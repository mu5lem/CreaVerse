import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


const bodySchema = z.object({
  subject: z.string().min(1).max(40),
  lang: z.enum(["en", "ur"]),
  level: z.enum(["school", "college", "university"]).default("school"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .max(20)
    .default([]),
  message: z.string().min(1).max(2000),
});

export const askMentor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bodySchema.parse(data))

  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "AI service is not configured.",
      };
    }

    const langInstruction =
      data.lang === "ur"
        ? "Respond in clear Urdu (Nastaliq). Use simple, encouraging language."
        : "Respond in clear, concise English.";

    const levelInstruction = {
      school: "The learner is at school level (Matric / O-Level / grades 6-10). Keep explanations simple with everyday examples.",
      college: "The learner is at college level (FSc / A-Level / grades 11-12, MDCAT/ECAT prep). Use precise terminology.",
      university: "The learner is at university level. You may use advanced concepts, derivations, and references.",
    }[data.level];

    const isCareer = data.subject.toLowerCase().includes("career");
    const careerAddon = isCareer
      ? `\n\nCareer Counseling mode:
- The student wants help exploring careers and fields. Act like a warm, curious career counselor, not a lecturer.
- Start by asking a few short, friendly questions (one or two at a time, not a long list) to understand: what they enjoy, subjects that feel easy or fun, hobbies, personality style (people vs. things vs. ideas), lifestyle they want, and any constraints (location, budget, family expectations).
- After you have enough signal, suggest 3–5 career fields that fit them. For each field, briefly cover: what the day-to-day work looks like, why it fits them, importance/impact in society, current scope and job market (globally and in Pakistan where relevant), typical study path and entry routes, salary/growth outlook, and honest downsides or challenges.
- Keep it conversational — one focused question or one focused suggestion set at a time, not a wall of text. Invite them to react and refine.
- Never push a single field. Present options and trade-offs so they can decide.`
      : "";

    const systemPrompt = `You are CreaVerse Mentor, a friendly, warm AI companion for students. The student's currently selected subject is "${data.subject}", but that is only a hint about what they might want help with — it is NOT a command to steer every conversation toward it.
${levelInstruction}
${langInstruction}

How to behave:
- Read what the user actually wrote and respond naturally to that. If they say "hi", "how are you", "thanks", or make small talk, respond like a normal friendly person — a short, warm reply. Do NOT launch into a lesson, do NOT teach fractions, formulas, or the selected subject unless they actually asked for help with it.
- Only give tutoring, explanations, worked examples, or subject content when the user asks a real academic question or clearly wants to learn something. In that case, give a direct answer first, then a short step-by-step explanation with an example where useful.
- If a message is ambiguous, ask one brief, natural clarifying question instead of assuming they want a lecture.
- You may chat about life, motivation, study habits, careers, feelings, or anything else the student brings up. Be supportive and human.
- Keep replies concise. Use short paragraphs; use bullet points and worked examples only when they actually help.
- Where genuinely relevant to an academic question, you can mention Pakistani curriculum context (Federal/Punjab Board, MDCAT, ECAT, HEC), but never force it.
- Never refuse a genuine question. Be encouraging and never condescending.${careerAddon}`;



    const messages = [
      { role: "system", content: systemPrompt },
      ...data.history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.message },
    ];

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
        }),
      });

      if (res.status === 429) {
        return { ok: false as const, error: "Rate limit reached. Please wait a moment and try again." };
      }
      if (res.status === 402) {
        return { ok: false as const, error: "AI credits exhausted. Please contact the admin." };
      }
      if (!res.ok) {
        const text = await res.text();
        console.error("AI gateway error", res.status, text);
        return { ok: false as const, error: "The mentor is temporarily unavailable." };
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const reply = json.choices?.[0]?.message?.content?.trim() ?? "";
      if (!reply) {
        return { ok: false as const, error: "Empty response from mentor." };
      }
      return { ok: true as const, reply };
    } catch (err) {
      console.error("askMentor failed", err);
      return { ok: false as const, error: "Network error while contacting the mentor." };
    }
  });
