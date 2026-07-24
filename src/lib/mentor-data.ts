export type Subject = "Math" | "Science" | "Physics" | "Chemistry" | "CS" | "English" | "Career Counseling";
export type Lang = "en" | "ur";
export const SUBJECTS: Subject[] = ["Math", "Science", "Physics", "Chemistry", "CS", "English", "Career Counseling"];

type ResponseMap = Record<Subject, Record<Lang, { keywords: string[]; reply: string }[]>>;


export const mentorResponses: ResponseMap = {
  Math: {
    en: [
      { keywords: ["algebra", "equation", "solve"], reply: "Isolate the variable step by step: apply the same operation to both sides to keep the equation balanced." },
      { keywords: ["geometry", "triangle", "angle"], reply: "Remember: interior angles of a triangle sum to 180°. Sketch it — a diagram makes the relationships obvious." },
      { keywords: ["fraction", "decimal"], reply: "To add fractions, find a common denominator first. To convert to decimal, just divide numerator by denominator." },
    ],
    ur: [
      { keywords: ["algebra", "مساوات"], reply: "متغیر کو الگ کریں — دونوں طرف ایک ہی عمل کریں تاکہ مساوات متوازن رہے۔" },
      { keywords: ["ہندسہ", "مثلث"], reply: "مثلث کے تینوں زاویوں کا مجموعہ 180° ہوتا ہے۔ ہمیشہ ایک خاکہ بنائیں۔" },
    ],
  },
  Science: {
    en: [
      { keywords: ["cell", "biology"], reply: "The cell is the basic unit of life. Focus on organelles: nucleus stores DNA, mitochondria make energy." },
      { keywords: ["ecosystem", "environment"], reply: "An ecosystem is producers + consumers + decomposers linked by energy flow. Start with the food chain." },
    ],
    ur: [
      { keywords: ["خلیہ", "حیاتیات"], reply: "خلیہ زندگی کی بنیادی اکائی ہے۔ مرکزہ DNA رکھتا ہے، اور مائٹوکونڈریا توانائی بناتا ہے۔" },
    ],
  },
  Physics: {
    en: [
      { keywords: ["newton", "force", "motion"], reply: "F = m·a. If you know two of force, mass, or acceleration, the third follows directly." },
      { keywords: ["energy", "kinetic", "potential"], reply: "KE = ½mv²; PE = mgh. Total mechanical energy is conserved if there's no friction." },
      { keywords: ["gravity", "gravitation"], reply: "Near Earth, g ≈ 9.8 m/s². Weight = mass × g. Gravity acts toward the center of the larger mass." },
    ],
    ur: [
      { keywords: ["قوت", "حرکت"], reply: "F = m·a۔ قوت، کمیت اور اسراع میں سے دو معلوم ہوں تو تیسرا نکل آتا ہے۔" },
    ],
  },
  Chemistry: {
    en: [
      { keywords: ["atom", "electron", "proton"], reply: "Protons define the element (atomic number). Electrons determine chemistry. Neutrons determine the isotope." },
      { keywords: ["bond", "covalent", "ionic"], reply: "Ionic bonds transfer electrons (metal + nonmetal). Covalent bonds share electrons (two nonmetals)." },
      { keywords: ["acid", "base", "ph"], reply: "pH < 7 = acidic, pH > 7 = basic. Each unit is a 10× change in H⁺ concentration." },
    ],
    ur: [
      { keywords: ["ایٹم", "الیکٹران"], reply: "پروٹون عنصر کی شناخت کرتے ہیں، الیکٹران کیمیائی خواص طے کرتے ہیں۔" },
    ],
  },
  CS: {
    en: [
      { keywords: ["loop", "for", "while"], reply: "Use `for` when you know the count; `while` when you loop until a condition changes. Always check your exit case." },
      { keywords: ["array", "list"], reply: "Arrays give O(1) index access but O(n) inserts in the middle. Pick the structure that matches your access pattern." },
      { keywords: ["function", "recursion"], reply: "Every recursive function needs a base case and a step that moves toward it. Otherwise: stack overflow." },
    ],
    ur: [
      { keywords: ["لوپ", "پروگرام"], reply: "for لوپ گنتی معلوم ہو تو استعمال کریں، while شرط بدلنے تک۔" },
    ],
  },
  English: {
    en: [
      { keywords: ["essay", "writing"], reply: "Structure: intro (thesis) → body paragraphs (one idea each, with evidence) → conclusion (restate + reflect)." },
      { keywords: ["grammar", "tense"], reply: "Match tense to time: past for finished events, present for habits/facts, future for what will happen." },
      { keywords: ["vocabulary", "word"], reply: "Learn words in context, not lists. Read one paragraph a day and note 3 new words with their sentences." },
    ],
    ur: [
      { keywords: ["مضمون", "لکھنا"], reply: "ترتیب: تعارف → دلائل (ہر پیراگراف ایک نقطہ) → نتیجہ۔" },
    ],
  },
  "Career Counseling": {
    en: [
      { keywords: ["career", "field", "future"], reply: "Tell me a bit about what you enjoy, what subjects feel easy, and what kind of life you'd like — I'll help you map that to fields that fit." },
    ],
    ur: [
      { keywords: ["کیریئر", "شعبہ"], reply: "مجھے بتائیں آپ کو کیا پسند ہے اور کون سا مضمون آسان لگتا ہے — میں آپ کو موزوں شعبے تجویز کروں گا۔" },
    ],
  },

};

export function mentorReply(subject: Subject, lang: Lang, text: string): string {
  const bank = mentorResponses[subject][lang] ?? [];
  const lower = text.toLowerCase();
  for (const item of bank) {
    if (item.keywords.some((k) => lower.includes(k.toLowerCase()))) return item.reply;
  }
  if (bank[0]) return bank[0].reply;
  return lang === "ur"
    ? "اچھا سوال! تھوڑی مزید تفصیل دیں تاکہ میں بہتر مدد کر سکوں۔"
    : "Great question! Share a bit more detail and I'll help you work through it.";
}

// Quiz Bank
export type Difficulty = "easy" | "medium" | "hard";
export interface QuizQ {
  q: string;
  options: string[];
  answer: number;
}
export const quizBank: Record<Subject, Record<Difficulty, QuizQ[]>> = {
  Math: {
    easy: [
      { q: "What is 7 × 8?", options: ["54", "56", "64", "48"], answer: 1 },
      { q: "What is ½ + ¼?", options: ["¾", "⅔", "⅛", "1"], answer: 0 },
      { q: "Solve: x + 5 = 12", options: ["5", "6", "7", "8"], answer: 2 },
    ],
    medium: [
      { q: "Solve: 2x − 3 = 11", options: ["4", "5", "7", "8"], answer: 2 },
      { q: "Area of a circle radius 3? (π≈3.14)", options: ["28.26", "18.84", "9.42", "31.4"], answer: 0 },
    ],
    hard: [
      { q: "Derivative of x³?", options: ["x²", "3x²", "3x", "x⁴/4"], answer: 1 },
      { q: "Roots of x² − 5x + 6?", options: ["2, 3", "1, 6", "−2, −3", "0, 5"], answer: 0 },
    ],
  },
  Science: {
    easy: [
      { q: "Powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi"], answer: 2 },
      { q: "How many planets in our solar system?", options: ["7", "8", "9", "10"], answer: 1 },
    ],
    medium: [
      { q: "Which gas do plants absorb?", options: ["Oxygen", "Nitrogen", "CO₂", "Hydrogen"], answer: 2 },
    ],
    hard: [
      { q: "DNA replication is called…", options: ["Semi-conservative", "Conservative", "Dispersive", "None"], answer: 0 },
    ],
  },
  Physics: {
    easy: [
      { q: "Unit of force?", options: ["Joule", "Watt", "Newton", "Pascal"], answer: 2 },
      { q: "Value of g on Earth?", options: ["9.8 m/s²", "10 N", "5 m/s", "1 m/s²"], answer: 0 },
    ],
    medium: [
      { q: "F = 10N, m = 2kg. Acceleration?", options: ["2 m/s²", "5 m/s²", "20 m/s²", "0.2 m/s²"], answer: 1 },
    ],
    hard: [
      { q: "Photon energy is proportional to…", options: ["wavelength", "frequency", "mass", "temperature"], answer: 1 },
    ],
  },
  Chemistry: {
    easy: [
      { q: "Chemical symbol for gold?", options: ["Go", "Au", "Ag", "Gd"], answer: 1 },
      { q: "pH of pure water?", options: ["0", "5", "7", "14"], answer: 2 },
    ],
    medium: [
      { q: "NaCl is what kind of bond?", options: ["Covalent", "Ionic", "Metallic", "Hydrogen"], answer: 1 },
    ],
    hard: [
      { q: "Which is a noble gas?", options: ["Chlorine", "Argon", "Sodium", "Oxygen"], answer: 1 },
    ],
  },
  CS: {
    easy: [
      { q: "HTML stands for?", options: ["Hyper Text Markup Language", "High Text ML", "Home Tool ML", "Hyper Transfer ML"], answer: 0 },
      { q: "Which is a loop?", options: ["if", "for", "return", "let"], answer: 1 },
    ],
    medium: [
      { q: "Big-O of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], answer: 1 },
    ],
    hard: [
      { q: "TCP is at which OSI layer?", options: ["Network", "Transport", "Session", "Application"], answer: 1 },
    ],
  },
  English: {
    easy: [
      { q: "Plural of 'child'?", options: ["childs", "childrens", "children", "childes"], answer: 2 },
      { q: "Synonym of 'happy'?", options: ["sad", "joyful", "angry", "tired"], answer: 1 },
    ],
    medium: [
      { q: "'She ___ to school every day.' Fill in.", options: ["go", "goes", "going", "gone"], answer: 1 },
    ],
    hard: [
      { q: "A metaphor is…", options: ["a direct comparison", "a comparison using like/as", "an exaggeration", "a sound word"], answer: 0 },
    ],
  },
};
