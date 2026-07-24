export interface AcademyModule {
  title: string;
  description: string;
  url: string;
  source: string;
}

export interface AcademyCategory {
  id: string;
  title: string;
  description: string;
  modules: AcademyModule[];
}

export const academyData: AcademyCategory[] = [
  {
    id: "pk-matric",
    title: "Pakistani Curriculum — Matric (Grades 9–10)",
    description: "Federal & Punjab Board aligned resources, in English and Urdu.",
    modules: [
      {
        title: "Matric Physics (Class 9 & 10)",
        description: "Complete chapter-wise lectures aligned with Punjab/Federal Board syllabus.",
        url: "https://sabaq.pk/subject-detail.php?sid=6",
        source: "Sabaq Foundation",
      },
      {
        title: "Matric Chemistry (Class 9 & 10)",
        description: "Atomic structure, chemical bonding, acids & bases — full board syllabus.",
        url: "https://sabaq.pk/subject-detail.php?sid=7",
        source: "Sabaq Foundation",
      },
      {
        title: "Matric Biology (Class 9 & 10)",
        description: "Cell biology, biodiversity, digestion, reproduction — Urdu + English lectures.",
        url: "https://sabaq.pk/subject-detail.php?sid=8",
        source: "Sabaq Foundation",
      },
      {
        title: "Matric Mathematics (Class 9 & 10)",
        description: "Algebra, geometry, trigonometry basics — full board syllabus.",
        url: "https://sabaq.pk/subject-detail.php?sid=5",
        source: "Sabaq Foundation",
      },
      {
        title: "PTB Textbooks (Free PDFs)",
        description: "Official Punjab Textbook Board books — download for every class.",
        url: "https://pctb.punjab.gov.pk/downloadable_textbooks",
        source: "PCTB",
      },
      {
        title: "Federal Board Past Papers",
        description: "Model & past papers for FBISE Matric and Intermediate.",
        url: "https://www.fbise.edu.pk/pastpapers.php",
        source: "FBISE",
      },
    ],
  },
  {
    id: "pk-fsc",
    title: "Pakistani Curriculum — FSc / Intermediate (Grades 11–12)",
    description: "Pre-Medical and Pre-Engineering streams.",
    modules: [
      {
        title: "FSc Physics Part 1 & 2",
        description: "Mechanics, waves, electromagnetism, modern physics — Punjab Board.",
        url: "https://www.ilmkidunya.com/study/11th-class-physics-video-lectures.aspx",
        source: "ilmkidunya",
      },
      {
        title: "FSc Chemistry Part 1 & 2",
        description: "Physical, inorganic and organic chemistry lectures.",
        url: "https://www.ilmkidunya.com/study/11th-class-chemistry-video-lectures.aspx",
        source: "ilmkidunya",
      },
      {
        title: "FSc Biology Part 1 & 2",
        description: "Human physiology, genetics, evolution — Pre-Medical stream.",
        url: "https://www.ilmkidunya.com/study/11th-class-biology-video-lectures.aspx",
        source: "ilmkidunya",
      },
      {
        title: "FSc Mathematics Part 1 & 2",
        description: "Calculus, trigonometry, vectors — Pre-Engineering stream.",
        url: "https://sabaq.pk/subject-detail.php?sid=15",
        source: "Sabaq Foundation",
      },
      {
        title: "English (Compulsory)",
        description: "Grammar, essay writing and comprehension for FSc/FA.",
        url: "https://sabaq.pk/subject-detail.php?sid=13",
        source: "Sabaq Foundation",
      },
    ],
  },
  {
    id: "mdcat",
    title: "MDCAT Preparation",
    description: "PMDC / PMC official syllabus for medical & dental admissions in Pakistan.",
    modules: [
      {
        title: "MDCAT Biology — Full Course",
        description: "Human physiology, genetics, biotechnology per PMDC national syllabus.",
        url: "https://www.nearpeer.org/",
        source: "Nearpeer",
      },
      {
        title: "MDCAT Chemistry — Full Course",
        description: "Organic + physical chemistry drills and MCQ practice.",
        url: "https://www.taleemabad.com/mdcat",
        source: "Taleemabad",
      },
      {
        title: "MDCAT Physics — Full Course",
        description: "Electrostatics, current electricity, modern physics — MDCAT focused.",
        url: "https://mdcat.pmc.gov.pk/",
        source: "PMDC Official",
      },
      {
        title: "Logical Reasoning for MDCAT",
        description: "Practice sets for the reasoning section of the national MDCAT.",
        url: "https://www.mdcatguide.com/logical-reasoning/",
        source: "MDCAT Guide",
      },
      {
        title: "MDCAT Past Papers & Solved MCQs",
        description: "Year-wise past papers with solutions.",
        url: "https://www.ilmkidunya.com/entry-test/mcat-mdcat-past-papers.aspx",
        source: "ilmkidunya",
      },
    ],
  },
  {
    id: "ecat",
    title: "ECAT Preparation",
    description: "UET Lahore & engineering universities admission test.",
    modules: [
      {
        title: "ECAT Mathematics",
        description: "Calculus, vectors, matrices — full ECAT-focused course.",
        url: "https://www.nearpeer.org/ecat",
        source: "Nearpeer",
      },
      {
        title: "ECAT Physics",
        description: "Rotational dynamics, thermodynamics, optics for ECAT.",
        url: "https://sabaq.pk/subject-detail.php?sid=16",
        source: "Sabaq Foundation",
      },
      {
        title: "ECAT Chemistry",
        description: "Physical chemistry, equilibria and kinetics.",
        url: "https://www.ilmkidunya.com/entry-test/ecat-chemistry-preparation.aspx",
        source: "ilmkidunya",
      },
      {
        title: "ECAT English & Reasoning",
        description: "Vocabulary, usage and analytical questions for ECAT.",
        url: "https://www.ilmkidunya.com/entry-test/ecat-english-preparation.aspx",
        source: "ilmkidunya",
      },
      {
        title: "UET Past Papers",
        description: "Official ECAT past papers from UET Lahore.",
        url: "https://web.uet.edu.pk/admissions/",
        source: "UET Lahore",
      },
    ],
  },
  {
    id: "university",
    title: "University Level — Free World-Class Courses",
    description: "MIT, Stanford, Harvard and more — free open courseware.",
    modules: [
      {
        title: "MIT OpenCourseWare — All Subjects",
        description: "2,500+ MIT courses free: engineering, CS, math, physics, biology.",
        url: "https://ocw.mit.edu/",
        source: "MIT",
      },
      {
        title: "Khan Academy — University Math & Science",
        description: "Calculus, linear algebra, differential equations, organic chemistry.",
        url: "https://www.khanacademy.org/",
        source: "Khan Academy",
      },
      {
        title: "CS50: Introduction to Computer Science",
        description: "Harvard's flagship CS course — free on edX.",
        url: "https://cs50.harvard.edu/x/",
        source: "Harvard",
      },
      {
        title: "Stanford Engineering Everywhere",
        description: "Free Stanford engineering & CS lectures.",
        url: "https://see.stanford.edu/",
        source: "Stanford",
      },
      {
        title: "3Blue1Brown — Visual Math",
        description: "Intuitive university-level linear algebra, calculus, neural networks.",
        url: "https://www.3blue1brown.com/",
        source: "3Blue1Brown",
      },
      {
        title: "Virtual University of Pakistan",
        description: "Free video lectures across CS, business, and social sciences.",
        url: "https://www.vu.edu.pk/Lectures/",
        source: "VU Pakistan",
      },
    ],
  },
  {
    id: "programming",
    title: "Programming & Computer Science",
    description: "Learn to code from beginner to advanced — all free.",
    modules: [
      {
        title: "freeCodeCamp — Full Curriculum",
        description: "Web dev, Python, data science, ML — 3,000+ hours free.",
        url: "https://www.freecodecamp.org/learn",
        source: "freeCodeCamp",
      },
      {
        title: "The Odin Project",
        description: "Full-stack web development from scratch.",
        url: "https://www.theodinproject.com/",
        source: "The Odin Project",
      },
      {
        title: "CS50P: Python Programming",
        description: "Harvard's introduction to programming with Python.",
        url: "https://cs50.harvard.edu/python/",
        source: "Harvard",
      },
      {
        title: "Google Digital Garage",
        description: "Free certified courses in digital skills and marketing.",
        url: "https://learndigital.withgoogle.com/digitalgarage",
        source: "Google",
      },
    ],
  },
  {
    id: "pakistan-context",
    title: "Pakistan Context — Language, Culture & Compulsory Subjects",
    description: "Urdu, Islamiat, Pak Studies and board-exam strategy resources.",
    modules: [
      { title: "Pakistan Studies (Matric & FSc)", description: "History, geography and ideology of Pakistan aligned with Federal/Punjab boards.", url: "https://sabaq.pk/subject-detail.php?sid=27", source: "Sabaq Foundation" },
      { title: "Islamiat (Compulsory) — Full Course", description: "Complete Islamiat lectures for 9th, 10th and FSc levels.", url: "https://sabaq.pk/subject-detail.php?sid=14", source: "Sabaq Foundation" },
      { title: "Urdu Grammar & Literature", description: "Qawaid, essay writing and literature analysis in Urdu medium.", url: "https://sabaq.pk/subject-detail.php?sid=11", source: "Sabaq Foundation" },
      { title: "Learn Urdu — Reading & Writing", description: "Beginner Urdu alphabet, vocabulary and short stories.", url: "https://www.rekhta.org/learn-urdu", source: "Rekhta" },
      { title: "Matric & FSc Exam Strategy", description: "Time management, paper attempt tips and board-marking rubric explained.", url: "https://ilmkidunya.com/study/", source: "ilmkidunya" },
      { title: "CSS/PMS — Compulsory Subjects Intro", description: "Overview of CSS/PMS Pakistan competitive-exam subjects, syllabus and past papers.", url: "https://www.cssforum.com.pk/", source: "CSS Forum" },
      { title: "FPSC CSS Syllabus & Past Papers", description: "Official Federal Public Service Commission syllabi and past-paper archive.", url: "https://www.fpsc.gov.pk/", source: "FPSC" },
      { title: "Pakistani Constitution — Explainer", description: "The 1973 Constitution simplified for students and civic-education learners.", url: "https://na.gov.pk/en/content.php?id=2", source: "National Assembly of Pakistan" },
    ],
  },
];

