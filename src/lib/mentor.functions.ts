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

    const systemPrompt = `You are CreaVerse Mentor, an expert tutor for Pakistani students covering the ${data.subject} subject.
${levelInstruction}
${langInstruction}

Rules:
- Treat EVERY user message as a genuine learning question, even if it is short or unclear — ask a brief clarifying question only if truly necessary.
- Give a direct answer first, then a short step-by-step explanation.
- Where relevant, mention Pakistani curriculum context (Federal Board / Punjab Board / MDCAT / ECAT / HEC).
- Use short paragraphs and bullet points. Include worked examples for math/science.
- Never refuse a genuine academic question. Be encouraging.`;

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
