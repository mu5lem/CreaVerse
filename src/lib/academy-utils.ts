import type { AcademyCategory, AcademyModule } from "@/lib/academy-data";
import type { Subject } from "@/lib/mentor-data";

/** Best-guess AI Mentor subject for a piece of text (resource title, class name…). */
export function mentorSubjectFor(text: string): Subject {
  const t = text.toLowerCase();
  if (/physic/.test(t)) return "Physics";
  if (/chem/.test(t)) return "Chemistry";
  if (/math|algebra|calculus|geometry|trigonometry|statistic/.test(t)) return "Math";
  if (/comput|cs50|program|python|coding|web|software|data|cyber|\bai\b|java|developer/.test(t))
    return "CS";
  if (/english|ielts|toefl|grammar|essay|rhetoric|writing/.test(t)) return "English";
  if (/bio|science|mdcat|ecat/.test(t)) return "Science";
  return "Career Counseling";
}

export function mentorPromptFor(title: string): string {
  return `I'm studying "${title}". Explain the key ideas simply and tell me how to start.`;
}

export interface FlatModule extends AcademyModule {
  categoryId: string;
  categoryTitle: string;
  pk: boolean;
}

export function flattenAcademy(data: AcademyCategory[]): FlatModule[] {
  return data.flatMap((c) =>
    c.modules.map((m) => ({ ...m, categoryId: c.id, categoryTitle: c.title, pk: c.pk })),
  );
}

/** Suggest up to `max` Academy resources for a class title (e.g. "Class 9 Physics"). */
export function suggestForText(data: AcademyCategory[], text: string, max = 2): FlatModule[] {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !["class", "grade", "the", "and", "for"].includes(w));
  const subject = mentorSubjectFor(text);
  const subjectWord: Partial<Record<Subject, RegExp>> = {
    Physics: /physic/i,
    Chemistry: /chem/i,
    Math: /math/i,
    CS: /comput|program|cs50|python|web/i,
    English: /english|ielts/i,
    Science: /biolog|science/i,
  };
  const re = subjectWord[subject];
  const scored = flattenAcademy(data)
    .map((m) => {
      const hay = `${m.title} ${m.description}`.toLowerCase();
      let score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
      if (re && re.test(m.title)) score += 2;
      if (m.pk) score += 0.5;
      return { m, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((x) => x.m);
}
