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
  {
    id: "harvard-free",
    title: "Harvard University — Free Online Courses",
    description: "Full Harvard courses audit-free via edX and Harvard Online.",
    modules: [
      { title: "CS50: Introduction to Computer Science", description: "Harvard's flagship CS course — completely free to audit.", url: "https://pll.harvard.edu/course/cs50-introduction-computer-science", source: "Harvard / edX" },
      { title: "CS50's Web Programming with Python & JavaScript", description: "Django, React, SQL and modern web development.", url: "https://pll.harvard.edu/course/cs50s-web-programming-python-and-javascript", source: "Harvard / edX" },
      { title: "CS50's Introduction to Artificial Intelligence with Python", description: "Search, knowledge, uncertainty, optimization and machine learning.", url: "https://pll.harvard.edu/course/cs50s-introduction-artificial-intelligence-python", source: "Harvard / edX" },
      { title: "Data Science: R Basics (Harvard)", description: "Start of the Harvard PH125.x Data Science Professional series.", url: "https://pll.harvard.edu/course/data-science-r-basics", source: "Harvard / edX" },
      { title: "Justice with Michael Sandel", description: "Harvard's celebrated moral philosophy course, free online.", url: "https://pll.harvard.edu/course/justice", source: "Harvard Online" },
      { title: "Rhetoric: The Art of Persuasive Writing and Public Speaking", description: "Craft arguments and deliver them with power.", url: "https://pll.harvard.edu/course/rhetoric-art-persuasive-writing-and-public-speaking", source: "Harvard / edX" },
      { title: "Harvard Online — Full Free Catalog", description: "Browse every free Harvard course across every subject.", url: "https://pll.harvard.edu/catalog/free", source: "Harvard" },
    ],
  },
  {
    id: "google-certs",
    title: "Google — Career Certificates & Free Courses",
    description: "Job-ready Google Career Certificates and free skill courses from Google.",
    modules: [
      { title: "Google Data Analytics Certificate", description: "Beginner-friendly path to a data analyst role — free to audit on Coursera.", url: "https://www.coursera.org/professional-certificates/google-data-analytics", source: "Google" },
      { title: "Google IT Support Certificate", description: "Entry-level IT support foundation, industry-recognized.", url: "https://www.coursera.org/professional-certificates/google-it-support", source: "Google" },
      { title: "Google UX Design Certificate", description: "Learn UX design from research to portfolio.", url: "https://www.coursera.org/professional-certificates/google-ux-design", source: "Google" },
      { title: "Google Project Management Certificate", description: "Agile, Scrum and traditional project management.", url: "https://www.coursera.org/professional-certificates/google-project-management", source: "Google" },
      { title: "Google Digital Marketing & E-commerce Certificate", description: "SEO, ads, email marketing and analytics.", url: "https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce", source: "Google" },
      { title: "Google Cybersecurity Certificate", description: "Security foundations, Linux, SQL and incident response.", url: "https://www.coursera.org/professional-certificates/google-cybersecurity", source: "Google" },
      { title: "Google AI Essentials", description: "Practical, non-technical intro to using AI at work.", url: "https://www.coursera.org/learn/google-ai-essentials", source: "Google" },
      { title: "Google Skillshop — All Free Certifications", description: "Free certifications for Google Ads, Analytics and more.", url: "https://skillshop.exceedlms.com/student/catalog", source: "Google Skillshop" },
      { title: "Grow with Google — Free Training", description: "Complete catalog of free Google-run career and skills training.", url: "https://grow.google/intl/ssa-en/", source: "Google" },
    ],
  },
  {
    id: "meta-certs",
    title: "Meta — Developer & Marketing Certificates",
    description: "Free-to-audit Meta Professional Certificates on Coursera.",
    modules: [
      { title: "Meta Front-End Developer Certificate", description: "HTML, CSS, React and version control — from Meta engineers.", url: "https://www.coursera.org/professional-certificates/meta-front-end-developer", source: "Meta" },
      { title: "Meta Back-End Developer Certificate", description: "Python, Django, APIs and databases.", url: "https://www.coursera.org/professional-certificates/meta-back-end-developer", source: "Meta" },
      { title: "Meta Android Developer Certificate", description: "Build Android apps in Kotlin, Jetpack Compose and more.", url: "https://www.coursera.org/professional-certificates/meta-android-developer", source: "Meta" },
      { title: "Meta iOS Developer Certificate", description: "Swift, SwiftUI, UIKit and shipping to the App Store.", url: "https://www.coursera.org/professional-certificates/meta-ios-developer", source: "Meta" },
      { title: "Meta Database Engineer Certificate", description: "SQL, MySQL, database design and cloud databases.", url: "https://www.coursera.org/professional-certificates/meta-database-engineer", source: "Meta" },
      { title: "Meta Social Media Marketing Certificate", description: "Facebook, Instagram, campaigns and analytics.", url: "https://www.coursera.org/professional-certificates/facebook-social-media-marketing", source: "Meta" },
      { title: "Meta Blueprint — Free Marketing Courses", description: "Meta's own free training for marketers and creators.", url: "https://www.facebook.com/business/learn", source: "Meta Blueprint" },
    ],
  },
  {
    id: "big-tech-free",
    title: "Microsoft, IBM, AWS & More — Free Learning",
    description: "Free training catalogs from major tech companies.",
    modules: [
      { title: "Microsoft Learn — Full Catalog", description: "Thousands of free hands-on tutorials for Azure, .NET, AI and more.", url: "https://learn.microsoft.com/en-us/training/", source: "Microsoft" },
      { title: "IBM SkillsBuild — Free Learning", description: "Free courses on AI, cybersecurity and data — with credentials.", url: "https://skillsbuild.org/", source: "IBM" },
      { title: "AWS Skill Builder — Free Digital Training", description: "600+ free AWS cloud courses and learning plans.", url: "https://skillbuilder.aws/", source: "AWS" },
      { title: "Google Cloud Skills Boost — Free Tier", description: "Hands-on labs and courses for Google Cloud.", url: "https://www.cloudskillsboost.google/", source: "Google Cloud" },
      { title: "NVIDIA Deep Learning Institute — Free Courses", description: "Selected free courses on AI, deep learning and CUDA.", url: "https://www.nvidia.com/en-us/training/", source: "NVIDIA" },
      { title: "LinkedIn Learning — Free with Library Card", description: "Full LinkedIn Learning catalog free through many public libraries.", url: "https://www.linkedin.com/learning/", source: "LinkedIn Learning" },
    ],
  },
  {
    id: "test-prep",
    title: "Test Preparation — SAT, GRE, GMAT, IELTS, TOEFL",
    description: "Official and world-class free prep for international admission tests.",
    modules: [
      { title: "Official Digital SAT Prep — Khan Academy", description: "Free official Digital SAT prep from College Board & Khan Academy.", url: "https://www.khanacademy.org/digital-sat", source: "Khan Academy × College Board" },
      { title: "SAT Bluebook — Official Practice Tests", description: "Download the official Bluebook app for full-length practice SATs.", url: "https://bluebook.app.collegeboard.org/", source: "College Board" },
      { title: "SAT Suite — Official Practice", description: "PSAT, SAT and NMSQT official practice tests from College Board.", url: "https://satsuite.collegeboard.org/sat/practice-preparation", source: "College Board" },
      { title: "Khan Academy — Official LSAT Prep", description: "Free official LSAT prep in partnership with the LSAC.", url: "https://www.khanacademy.org/prep/lsat", source: "Khan Academy × LSAC" },
      { title: "Khan Academy — MCAT Prep", description: "Free MCAT prep videos and practice from Khan Academy.", url: "https://www.khanacademy.org/test-prep/mcat", source: "Khan Academy" },
      { title: "ETS — Official GRE Free Prep", description: "Official POWERPREP practice tests, sample questions and study plans.", url: "https://www.ets.org/gre/test-takers/general-test/prepare.html", source: "ETS" },
      { title: "ETS — Official TOEFL Free Prep", description: "Official TOEFL iBT free practice tests and prep materials.", url: "https://www.ets.org/toefl/test-takers/ibt/prepare.html", source: "ETS" },
      { title: "GMAC — Official GMAT Free Prep", description: "Official free GMAT Focus starter kit and practice.", url: "https://www.mba.com/exams/gmat-exam/prepare", source: "GMAC" },
      { title: "IELTS — Official Free Practice Tests", description: "Official IELTS practice tests, sample questions and preparation.", url: "https://ielts.org/take-a-test/preparation-resources/free-preparation-materials", source: "IELTS.org" },
      { title: "British Council — Free IELTS Prep", description: "Comprehensive free IELTS preparation from British Council.", url: "https://takeielts.britishcouncil.org/take-ielts/prepare", source: "British Council" },
      { title: "Duolingo English Test — Free Prep", description: "Free practice for the accepted-worldwide DET.", url: "https://englishtest.duolingo.com/prepare", source: "Duolingo" },
      { title: "AP — Official Free Practice (College Board)", description: "Free AP course & exam prep from College Board.", url: "https://apstudents.collegeboard.org/", source: "College Board" },
    ],
  },
  {
    id: "opencourse-hubs",
    title: "Course Discovery — Free From Every Top University",
    description: "Search engines for free courses across Harvard, MIT, Stanford, Yale, Princeton and more.",
    modules: [
      { title: "edX — Free Courses Catalog", description: "Free-to-audit courses from Harvard, MIT, Berkeley and 250+ universities.", url: "https://www.edx.org/search?learning_type=Course&price=Free", source: "edX" },
      { title: "Coursera — Free Courses", description: "Free-to-audit university courses across every subject.", url: "https://www.coursera.org/courses?query=free", source: "Coursera" },
      { title: "Class Central — Free Course Search", description: "Search every free online course from top universities in one place.", url: "https://www.classcentral.com/", source: "Class Central" },
      { title: "OpenLearn — The Open University", description: "Free courses and badged learning from The Open University, UK.", url: "https://www.open.edu/openlearn/", source: "The Open University" },
      { title: "Yale Open Courses", description: "Free Yale undergraduate courses with video and materials.", url: "https://oyc.yale.edu/", source: "Yale" },
      { title: "Stanford Online — Free Courses", description: "Free Stanford courses across engineering, medicine and business.", url: "https://online.stanford.edu/free-courses", source: "Stanford" },
    ],
  },
];


