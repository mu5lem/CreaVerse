import { createFileRoute, Link } from "@tanstack/react-router";
import { BookLogo } from "@/components/BookLogo";
import { brand } from "@/lib/brand";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — CreaVerse" },
      { name: "description", content: "Terms governing your use of the CreaVerse education platform." },
      { property: "og:title", content: "CreaVerse Terms of Service" },
      { property: "og:description", content: "Rules of the road for using CreaVerse as a student, teacher, or admin." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/terms" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-3">
          <BookLogo size={32} className="text-[var(--color-ink)]" />
          <span className="font-display text-xl font-semibold text-foreground">{brand.name}</span>
        </Link>
        <Link to="/" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary">
          Back home
        </Link>
      </div>
      <main className="prose mx-auto max-w-3xl px-6 pb-16 text-foreground">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: July 22, 2026</p>

        <h2 className="mt-8 font-display text-2xl">1. Acceptance</h2>
        <p>By creating an account or using {brand.name}, you agree to these Terms and our Privacy Policy.</p>

        <h2 className="mt-6 font-display text-2xl">2. Accounts</h2>
        <ul className="list-disc pl-6">
          <li>You are responsible for keeping your credentials safe and for activity under your account.</li>
          <li>Everyone starts as a student; teacher access requires a valid admin-issued invite code.</li>
          <li>Admin accounts are never self-service.</li>
        </ul>

        <h2 className="mt-6 font-display text-2xl">3. Acceptable use</h2>
        <ul className="list-disc pl-6">
          <li>No harassment, hate speech, or harmful content in class chat, submissions, or journal entries shared with others.</li>
          <li>No academic misconduct: don't submit work that isn't yours as your own.</li>
          <li>No attempts to break, probe, or overload the platform.</li>
        </ul>

        <h2 className="mt-6 font-display text-2xl">4. AI mentor</h2>
        <p>The AI mentor is a study aid, not a substitute for qualified professional advice. Always verify important information (medical, legal, financial, safety).</p>

        <h2 className="mt-6 font-display text-2xl">5. Content ownership</h2>
        <p>You own the content you create (submissions, journal entries, messages). You grant {brand.name} a limited licence to store and display it as needed to run the service.</p>

        <h2 className="mt-6 font-display text-2xl">6. Suspension</h2>
        <p>We may suspend or remove accounts that violate these Terms, applicable law, or the safety of other users.</p>

        <h2 className="mt-6 font-display text-2xl">7. Disclaimer</h2>
        <p>The service is provided "as is" without warranties of any kind. We work hard to keep it running, but we cannot guarantee uninterrupted access.</p>

        <h2 className="mt-6 font-display text-2xl">8. Changes</h2>
        <p>We may update these Terms as the product evolves. Material changes will be communicated in-product.</p>

        <h2 className="mt-6 font-display text-2xl">9. Contact</h2>
        <p><a href="mailto:support@creaverse.site" className="underline">support@creaverse.site</a></p>
      </main>
    </div>
  );
}
