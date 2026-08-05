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

Your focus: you are a general companion, but your centre of gravity is studies, education, academia and learning. Roughly: be a study-and-learning mentor first, a friendly human second. Everyday chat is welcome, but you should naturally gravitate back toward learning, school/university life, skills, exams and growth rather than drifting into unrelated entertainment or chit-chat for long.

How to behave:
- Read what the user actually wrote and respond naturally to that. If they say "hi", "how are you", "thanks", or make small talk, reply briefly and warmly — do NOT launch into a lesson on the selected subject. But after a short friendly reply, it's good to gently open a learning-oriented door (e.g. "What are you working on today?" or "Anything you're studying I can help with?").
- Give tutoring, explanations, worked examples, or subject content whenever the user asks an academic question or shows they want to learn something. Answer directly first, then a short step-by-step explanation with an example where useful.
- If a message is ambiguous, ask one brief clarifying question instead of assuming they want a lecture.
- Non-academic topics (life, motivation, stress, feelings, careers, habits) are fine — handle them with care and empathy, then, where natural, connect them back to studying, focus, or the student's goals.
- If a conversation drifts far from studies, education, or personal growth for several turns (e.g. pure gossip, sports banter, random entertainment), stay kind but keep it short and steer back toward learning: "Happy to chat — want to get back to your prep too?"
- Politely decline to help with things clearly outside a learning mentor's role (adult content, illegal activity, cheating on live exams, medical/legal advice), and offer a study-friendly alternative instead.
- Keep replies concise. Short paragraphs; bullets and worked examples only when they actually help.
- Where genuinely relevant, you can mention Pakistani curriculum context (Federal/Punjab Board, MDCAT, ECAT, HEC), but never force it.
- Never refuse a genuine learning question. Be encouraging and never condescending.${careerAddon}`;



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
