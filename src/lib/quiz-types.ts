export type QuestionKind = "mcq" | "short" | "tf";

export interface McqQuestion {
  id: string;
  kind: "mcq";
  prompt: string;
  options: string[];
  correctIndex: number | null;
  points: number;
}
export interface ShortQuestion {
  id: string;
  kind: "short";
  prompt: string;
  answer: string | null; // acceptable answer (case-insensitive), optional
  points: number;
}
export interface TfQuestion {
  id: string;
  kind: "tf";
  prompt: string;
  correct: boolean | null;
  points: number;
}
export type Question = McqQuestion | ShortQuestion | TfQuestion;

export type Answer =
  | { kind: "mcq"; selectedIndex: number | null }
  | { kind: "short"; text: string }
  | { kind: "tf"; value: boolean | null };

export type AnswerMap = Record<string, Answer>;

export function newQuestion(kind: QuestionKind): Question {
  const id = (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  if (kind === "mcq")
    return { id, kind, prompt: "", options: ["", ""], correctIndex: null, points: 1 };
  if (kind === "tf")
    return { id, kind, prompt: "", correct: null, points: 1 };
  return { id, kind: "short", prompt: "", answer: null, points: 1 };
}

export function totalPoints(qs: Question[]): number {
  return qs.reduce((s, q) => s + (Number.isFinite(q.points) ? q.points : 0), 0);
}

/** Auto-score with the current questions. Short answers only count if teacher set an expected answer. */
export function autoScore(qs: Question[], answers: AnswerMap): { earned: number; possible: number; graded: number } {
  let earned = 0;
  let possible = 0;
  let graded = 0;
  for (const q of qs) {
    const a = answers[q.id];
    if (q.kind === "mcq") {
      possible += q.points;
      graded += q.points;
      if (a && a.kind === "mcq" && a.selectedIndex === q.correctIndex && q.correctIndex !== null) {
        earned += q.points;
      }
    } else if (q.kind === "tf") {
      possible += q.points;
      graded += q.points;
      if (a && a.kind === "tf" && a.value !== null && a.value === q.correct) {
        earned += q.points;
      }
    } else {
      // short answer only auto-graded when teacher provided an answer key
      if (q.answer && q.answer.trim()) {
        possible += q.points;
        graded += q.points;
        if (
          a && a.kind === "short" &&
          a.text.trim().toLowerCase() === q.answer.trim().toLowerCase()
        ) earned += q.points;
      } else {
        possible += q.points; // still worth points, but requires manual review
      }
    }
  }
  return { earned, possible, graded };
}
