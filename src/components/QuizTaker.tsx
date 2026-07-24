import type { Question, AnswerMap } from "@/lib/quiz-types";

interface Props {
  questions: Question[];
  answers: AnswerMap;
  onChange: (next: AnswerMap) => void;
  readOnly?: boolean;
}

export function QuizTaker({ questions, answers, onChange, readOnly }: Props) {
  const set = (id: string, patch: AnswerMap[string]) =>
    onChange({ ...answers, [id]: patch });

  if (questions.length === 0) {
    return <div className="text-sm text-muted-foreground">This quiz has no questions yet.</div>;
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const a = answers[q.id];
        return (
          <div key={q.id} className="rounded-lg border border-border bg-background p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="text-sm font-medium text-foreground">
                <span className="text-muted-foreground">Q{idx + 1}.</span> {q.prompt || <span className="italic text-muted-foreground">(no prompt)</span>}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{q.points} pt{q.points === 1 ? "" : "s"}</span>
            </div>

            {q.kind === "mcq" && (
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/50">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      disabled={readOnly}
                      checked={a?.kind === "mcq" && a.selectedIndex === oi}
                      onChange={() => set(q.id, { kind: "mcq", selectedIndex: oi })}
                    />
                    <span>{opt || <span className="italic text-muted-foreground">(empty)</span>}</span>
                  </label>
                ))}
              </div>
            )}

            {q.kind === "tf" && (
              <div className="flex gap-4">
                {(["true", "false"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      disabled={readOnly}
                      checked={a?.kind === "tf" && a.value === (v === "true")}
                      onChange={() => set(q.id, { kind: "tf", value: v === "true" })}
                    />
                    <span className="capitalize">{v}</span>
                  </label>
                ))}
              </div>
            )}

            {q.kind === "short" && (
              <input
                disabled={readOnly}
                value={a?.kind === "short" ? a.text : ""}
                onChange={(e) => set(q.id, { kind: "short", text: e.target.value })}
                placeholder="Your answer"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
