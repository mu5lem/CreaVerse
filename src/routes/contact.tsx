import { createFileRoute } from "@tanstack/react-router";
import { BackButton } from "@/components/BackButton";
import { ContactHub } from "@/components/ContactHub";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact CreaVerse — Get in touch" },
      { name: "description", content: "Reach the CreaVerse team by email, WhatsApp, Facebook, or Instagram." },
      { property: "og:title", content: "Contact CreaVerse" },
      { property: "og:description", content: "Reach the CreaVerse team by email, WhatsApp, Facebook, or Instagram." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <BackButton to="/" />
        <div className="mt-6">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Contact Us</h1>
          <p className="mt-2 text-muted-foreground">
            We'd love to hear from you — questions, feedback, partnerships, or just to say hi.
          </p>
        </div>
        <div className="mt-8">
          <ContactHub compact />
        </div>
      </div>
    </div>
  );
}
