import { createFileRoute, Link } from "@tanstack/react-router";
import { BookLogo } from "@/components/BookLogo";
import { ContactHub } from "@/components/ContactHub";
import { brand } from "@/lib/brand";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQs — Common Questions | CreaVerse" },
      { name: "description", content: "Answers to common CreaVerse questions: joining classes, becoming a teacher, AI Mentor, grading, privacy, and more." },
      { property: "og:title", content: "CreaVerse FAQs" },
      { property: "og:description", content: "Quick answers about using CreaVerse — classes, teachers, AI Mentor, and privacy." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/faq" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),

  component: FaqPage,
});

const faqs = [
  {
    q: "How do I join a class?",
    a: "Sign in as a student, open your dashboard, and enter the class code your teacher shared. You'll instantly see the class, its assignments, and its chat.",
  },
  {
    q: "How do I become a teacher?",
    a: "Everyone starts as a student. Ask an admin for a teacher invite code, then redeem it from your student dashboard — your account upgrades to a teacher immediately.",
  },
  {
    q: "How does grading work?",
    a: "Teachers grade each student's submission per assignment — you'll see the grade and any written feedback on the assignment card in your class view.",
  },
  {
    q: "What is the AI Mentor?",
    a: "A private tutor powered by AI. Pick a subject and level (school, college, university), then chat naturally — it answers in English or Urdu with worked examples.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your journal entries, mentor chats, and class data are protected by row-level security — only you (and, where relevant, your class teacher) can see them.",
  },
  {
    q: "How do admins moderate the platform?",
    a: "Admins manage teacher invite codes, view aggregated onboarding responses, and can suspend accounts. They cannot read your private journal or mentor history.",
  },
  {
    q: "Do you offer things for free?",
    a: `${brand.name} is free for learners. Our mission is to bring conceptual, visual, AI-driven learning to every child in Pakistan — especially those without paid tuition access.`,
  },
  {
    q: "Something is broken — how do I report it?",
    a: "Use the Feedback button in the header, or contact us via any of the channels in the Contact section below.",
  },
];

function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-3">
          <BookLogo size={32} className="text-[var(--color-ink)]" />
          <span className="font-display text-xl font-semibold text-foreground">{brand.name}</span>
        </Link>
        <Link to="/" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary">
          Back home
        </Link>
      </div>
      <main className="mx-auto max-w-4xl px-6 pb-16">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Frequently Asked Questions</h1>
        <p className="mt-2 text-muted-foreground">Quick answers about using {brand.name}.</p>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 shadow-sm">
              <summary className="cursor-pointer list-none font-display text-lg text-foreground group-open:text-[var(--color-ember)]">
                {f.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
        <ContactHub />
      </main>
    </div>
  );
}
