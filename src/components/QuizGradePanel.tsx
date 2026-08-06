import { Check, X, CircleHelp } from "lucide-react";
import {
  answerText,
  isAutoCorrect,
  totalPoints,
  type AnswerMap,
  type MarkMap,
  type Question,
} from "@/lib/quiz-types";

interface Props {
  questions: Question[];
  answers: AnswerMap;
  marks: MarkMap;
  onChange: (next: MarkMap) => void;
}

/** Teacher-side marking of a submitted quiz: right/wrong per question plus partial marks. */
export function QuizGradePanel({ questions, answers, marks, onChange }: Props) {
  const total = totalPoints(questions);
  const obtained = questions.reduce((s, q) => s + (marks[q.id] ?? 0), 0);
  const checked = questions.filter((q) => marks[q.id] !== undefined).length;
  const percent = total > 0 ? Math.round((obtained / total) * 1000) / 10 : 0;

  const set = (id: string, value: number | undefined) => {
    const next = { ...marks };
    if (value === undefined) delete next[id];
    else next[id] = value;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {questions.map((q, idx) => {
        const a = answers[q.id];
        const verdict = isAutoCorrect(q, a);
        const awarded = marks[q.id];
        const isChecked = awarded !== undefined;
        return (
          <div
            key={q.id}
            className={`rounded-lg border p-3 transition ${isChecked ? "border-border bg-background" : "border-[var(--color-ember)]/50 bg-[var(--color-ember)]/5"}`}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="text-sm font-medium text-foreground">
                <span className="text-muted-foreground">Q{idx + 1}.</span> {q.prompt || <span className="italic text-muted-foreground">(no prompt)</span>}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {q.points} pt{q.points === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mb-2 text-sm">
              <span className="text-muted-foreground">Answer: </span>
              <span className="text-foreground">{answerText(q, a)}</span>
              {verdict !== null && (
                <span
                  className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${verdict ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"}`}
                >
                  {verdict ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {verdict ? "matches key" : "differs from key"}
                </span>
              )}
              {verdict === null && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  <CircleHelp className="h-3 w-3" /> needs your review
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => set(q.id, q.points)}
                className={`press inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${awarded === q.points ? "border-emerald-600 bg-emerald-600 text-white" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                <Check className="h-3.5 w-3.5" /> Correct
              </button>
              <button
                type="button"
                onClick={() => set(q.id, 0)}
                className={`press inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${awarded === 0 ? "border-red-600 bg-red-600 text-white" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                <X className="h-3.5 w-3.5" /> Wrong
              </button>
              <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                Marks
                <input
                  inputMode="decimal"
                  value={awarded === undefined ? "" : String(awarded)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, "");
                    if (raw === "") return set(q.id, undefined);
                    const n = parseFloat(raw);
                    if (Number.isNaN(n)) return;
                    set(q.id, Math.min(q.points, Math.max(0, n)));
                  }}
                  className="w-16 rounded-md border border-input bg-background px-2 py-1 text-right text-sm text-foreground"
                />
                <span>/ {q.points}</span>
              </label>
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-[var(--color-parchment)] px-3 py-2 text-sm">
        <span className="text-muted-foreground">
          {checked} / {questions.length} questions checked
        </span>
        <span className="font-medium text-foreground">
          {obtained} / {total} marks · {percent}%
        </span>
      </div>
    </div>
  );
}
