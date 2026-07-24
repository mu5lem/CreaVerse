import { Plus, Trash2, GripVertical } from "lucide-react";
import type { Question, QuestionKind } from "@/lib/quiz-types";
import { newQuestion, totalPoints } from "@/lib/quiz-types";

interface Props {
  value: Question[];
  onChange: (next: Question[]) => void;
}

export function QuizBuilder({ value, onChange }: Props) {
  const update = (idx: number, patch: Partial<Question>) => {
    const next = value.slice();
    next[idx] = { ...next[idx], ...patch } as Question;
    onChange(next);
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = (kind: QuestionKind) => onChange([...value, newQuestion(kind)]);
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Questions ({value.length})
        </div>
        <div className="text-xs text-muted-foreground">
          Total: <span className="font-medium text-foreground">{totalPoints(value)} pts</span>
        </div>
      </div>

      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-background p-4 text-center text-sm text-muted-foreground">
          Add your first question below.
        </div>
      )}

      {value.map((q, idx) => (
        <div key={q.id} className="rounded-lg border border-border bg-background p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex flex-col">
              <button type="button" onClick={() => move(idx, -1)} className="text-muted-foreground hover:text-foreground" aria-label="Move up">
                <GripVertical className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="rounded-full bg-[var(--color-parchment)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground">
              {q.kind === "mcq" ? "Multiple choice" : q.kind === "tf" ? "True / False" : "Short answer"}
            </span>
            <span className="text-xs text-muted-foreground">Q{idx + 1}</span>
            <div className="ml-auto flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                Points
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={q.points}
                  onChange={(e) => update(idx, { points: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="w-16 rounded-md border border-input bg-background px-2 py-1 text-xs"
                />
              </label>
              <button type="button" onClick={() => remove(idx)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete question">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <textarea
            placeholder="Question prompt"
            rows={2}
            value={q.prompt}
            onChange={(e) => update(idx, { prompt: e.target.value })}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
          />

          {q.kind === "mcq" && (
            <div className="mt-2 space-y-1.5">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctIndex === oi}
                    onChange={() => update(idx, { correctIndex: oi })}
                    aria-label={`Mark option ${oi + 1} as correct`}
                  />
                  <input
                    value={opt}
                    onChange={(e) => {
                      const options = q.options.slice();
                      options[oi] = e.target.value;
                      update(idx, { options });
                    }}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const options = q.options.filter((_, i) => i !== oi);
                        const correctIndex = q.correctIndex === oi ? null
                          : q.correctIndex !== null && q.correctIndex > oi ? q.correctIndex - 1
                          : q.correctIndex;
                        update(idx, { options, correctIndex });
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove option"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => update(idx, { options: [...q.options, ""] })}
                className="text-xs font-medium text-[var(--color-ember)] hover:underline"
              >
                + Add option
              </button>
              {q.correctIndex === null && (
                <p className="text-[11px] text-muted-foreground">Pick the correct option to enable auto-scoring.</p>
              )}
            </div>
          )}

          {q.kind === "tf" && (
            <div className="mt-2 flex gap-4">
              {(["true", "false"] as const).map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`tf-${q.id}`}
                    checked={q.correct === (v === "true")}
                    onChange={() => update(idx, { correct: v === "true" })}
                  />
                  <span className="capitalize">{v}</span>
                </label>
              ))}
              {q.correct === null && (
                <p className="text-[11px] text-muted-foreground">Pick the correct answer.</p>
              )}
            </div>
          )}

          {q.kind === "short" && (
            <div className="mt-2">
              <input
                value={q.answer ?? ""}
                onChange={(e) => update(idx, { answer: e.target.value })}
                placeholder="Expected answer for auto-grade (optional)"
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {q.answer?.trim() ? "Auto-graded by case-insensitive exact match." : "Leave empty to grade manually."}
              </p>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={() => add("mcq")} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-[var(--color-ember)]/60">
          <Plus className="h-3.5 w-3.5" /> Multiple choice
        </button>
        <button type="button" onClick={() => add("tf")} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-[var(--color-ember)]/60">
          <Plus className="h-3.5 w-3.5" /> True / False
        </button>
        <button type="button" onClick={() => add("short")} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-[var(--color-ember)]/60">
          <Plus className="h-3.5 w-3.5" /> Short answer
        </button>
      </div>
    </div>
  );
}
