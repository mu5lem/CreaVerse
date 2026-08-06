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

/** Reserved key used to persist the teacher's per-question marks inside submissions.answers. */
export const MARKS_KEY = "__teacher_marks";
export type MarkMap = Record<string, number>;

/** Auto-verdict for a single question: true/false when a key exists, null when it needs manual review. */
export function isAutoCorrect(q: Question, a: Answer | undefined): boolean | null {
  if (q.kind === "mcq") {
    if (q.correctIndex === null) return null;
    return a?.kind === "mcq" && a.selectedIndex === q.correctIndex;
  }
  if (q.kind === "tf") {
    if (q.correct === null) return null;
    return a?.kind === "tf" && a.value !== null && a.value === q.correct;
  }
  if (q.answer && q.answer.trim()) {
    return a?.kind === "short" && a.text.trim().toLowerCase() === q.answer.trim().toLowerCase();
  }
  return null;
}

/** Human-readable rendering of what the student answered. */
export function answerText(q: Question, a: Answer | undefined): string {
  if (!a) return "— no answer —";
  if (q.kind === "mcq" && a.kind === "mcq")
    return a.selectedIndex === null ? "— no answer —" : (q.options[a.selectedIndex] || `Option ${a.selectedIndex + 1}`);
  if (q.kind === "tf" && a.kind === "tf")
    return a.value === null ? "— no answer —" : a.value ? "True" : "False";
  if (q.kind === "short" && a.kind === "short") return a.text.trim() || "— no answer —";
  return "— no answer —";
}

/** Split the stored answers blob into real answers and the teacher's saved marks. */
export function splitAnswers(raw: unknown): { answers: AnswerMap; marks: MarkMap } {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const marks = (obj[MARKS_KEY] ?? {}) as MarkMap;
  const answers: AnswerMap = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === MARKS_KEY) continue;
    answers[k] = v as AnswerMap[string];
  }
  return { answers, marks };
}

/** Default marks a teacher starts from: full points when auto-correct, 0 when auto-wrong, unset when manual. */
export function defaultMarks(qs: Question[], answers: AnswerMap, saved: MarkMap): MarkMap {
  const out: MarkMap = {};
  for (const q of qs) {
    if (saved[q.id] !== undefined) {
      out[q.id] = saved[q.id];
      continue;
    }
    const verdict = isAutoCorrect(q, answers[q.id]);
    if (verdict === true) out[q.id] = q.points;
    else if (verdict === false) out[q.id] = 0;
  }
  return out;
}
