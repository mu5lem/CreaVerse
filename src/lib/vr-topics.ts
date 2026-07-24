export interface VRTopic {
  id: string;
  title: string;
  category: string;
  description: string;
  youtubeId: string;
  source: string;
}

// Real, publicly-embeddable educational YouTube videos.
export const vrTopics: VRTopic[] = [
  { id: "solar", title: "Solar System", category: "Astronomy",
    description: "Tour the Sun, planets and moons and see them in true scale.",
    youtubeId: "libKVRa01L8", source: "Kurzgesagt" },
  { id: "atom", title: "Atomic Structure", category: "Chemistry",
    description: "Zoom inside an atom and see protons, neutrons and electron clouds.",
    youtubeId: "thnDxFdkzZs", source: "TED-Ed" },
  { id: "gravity", title: "Gravity & Free Fall", category: "Physics",
    description: "A feather and a bowling ball fall together in a giant vacuum chamber.",
    youtubeId: "E43-CfukEgs", source: "BBC Human Universe" },
  { id: "circuit", title: "Electric Circuits", category: "Physics",
    description: "Series, parallel and how current flows through everyday circuits.",
    youtubeId: "mc979OhitAg", source: "CrashCourse Physics" },
  { id: "reaction", title: "Chemical Reactions", category: "Chemistry",
    description: "Types of chemical reactions — synthesis, decomposition, combustion and more.",
    youtubeId: "PmvLB5dIEp8", source: "CrashCourse Chemistry" },
  { id: "waves", title: "Sound Waves", category: "Physics",
    description: "How sound travels — frequency, wavelength and pitch explained.",
    youtubeId: "qV4lR9EWGlY", source: "TED-Ed" },
  { id: "optics", title: "Light & Optics", category: "Physics",
    description: "Reflection, refraction and how prisms split white light into a rainbow.",
    youtubeId: "IXxZRZxafEQ", source: "CrashCourse Physics" },
  { id: "states", title: "States of Matter", category: "Chemistry",
    description: "Solids, liquids, gases and plasma — how molecules move at each phase.",
    youtubeId: "pKvo0XWZtjo", source: "CrashCourse Kids" },
  // New topics
  { id: "newton", title: "Newton's Laws of Motion", category: "Physics",
    description: "The three laws that govern how everything moves — from apples to rockets.",
    youtubeId: "kKKM8Y-u7ds", source: "CrashCourse Physics" },
  { id: "emag", title: "Electromagnetism Basics", category: "Physics",
    description: "How electricity and magnetism are two sides of the same force.",
    youtubeId: "hFAOXdXZ5TM", source: "CrashCourse Physics" },
  { id: "cell", title: "Cell Structure", category: "Biology",
    description: "Explore the parts of a cell — membrane, nucleus, mitochondria and more.",
    youtubeId: "URUJD5NEXC8", source: "CrashCourse Biology" },
  { id: "periodic", title: "The Periodic Table", category: "Chemistry",
    description: "How the periodic table is organised and what element properties mean.",
    youtubeId: "0RRVV4Diomg", source: "CrashCourse Chemistry" },
];
