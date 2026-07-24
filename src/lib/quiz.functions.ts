import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const bodySchema = z.object({
  subject: z.string().min(1).max(80),
  topic: z.string().max(200).optional().default(""),
  level: z.enum(["school", "college", "university"]).default("school"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(3).max(10).default(5),
  lang: z.enum(["en", "ur"]).default("en"),
});

const questionSchema = z.object({
  q: z.string().min(3),
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().optional().default(""),
});

export type QuizQuestion = z.infer<typeof questionSchema>;

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bodySchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI service is not configured." };

    const langInstruction =
      data.lang === "ur"
        ? "Write every question, option, and explanation in clear Urdu (Nastaliq)."
        : "Write every question, option, and explanation in clear English.";

    const levelInstruction = {
      school: "school level (Matric / O-Level / grades 6-10)",
      college: "college level (FSc / A-Level / MDCAT / ECAT prep)",
      university: "university undergraduate level",
    }[data.level];

    const topicClause = data.topic
      ? `Focus the quiz on: "${data.topic}".`
      : `Cover a broad range of core ideas across the whole subject — do NOT repeat a single narrow topic.`;

    const system = `You are a quiz generator for Pakistani students. Return ONLY valid JSON that matches the requested schema — no prose, no markdown fences.`;
    const user = `Generate ${data.count} ${data.difficulty} multiple-choice questions for the subject "${data.subject}" at ${levelInstruction}.
${topicClause}
${langInstruction}
Each question must have exactly 4 options and one correct answer. Vary the correct option index across questions.
Return JSON of the form:
{"questions":[{"q":"...","options":["a","b","c","d"],"answer":0,"explanation":"..."}]}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (res.status === 429) return { ok: false as const, error: "Rate limit reached. Please try again shortly." };
      if (res.status === 402) return { ok: false as const, error: "AI credits exhausted. Please contact the admin." };
      if (!res.ok) {
        const text = await res.text();
        console.error("quiz gateway error", res.status, text);
        return { ok: false as const, error: "Quiz generator is temporarily unavailable." };
      }
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
      if (!raw) return { ok: false as const, error: "Empty response from generator." };

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Try to salvage JSON embedded in prose
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) return { ok: false as const, error: "Generator returned invalid JSON." };
        parsed = JSON.parse(match[0]);
      }
      const shape = z.object({ questions: z.array(questionSchema).min(1) }).safeParse(parsed);
      if (!shape.success) return { ok: false as const, error: "Generator returned malformed questions." };
      return { ok: true as const, questions: shape.data.questions };
    } catch (err) {
      console.error("generateQuiz failed", err);
      return { ok: false as const, error: "Network error while generating the quiz." };
    }
  });
