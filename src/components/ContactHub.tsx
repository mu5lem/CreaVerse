import { Mail, Facebook, Instagram, MessageCircle } from "lucide-react";
import { useState } from "react";

const contacts = [
  {
    href: "mailto:support@creaverse.site",
    label: "Email",
    value: "support@creaverse.site",
    icon: Mail,
  },
  {
    href: "mailto:support@creaverse.site?subject=WhatsApp%20contact%20request",
    label: "WhatsApp",
    value: "Request via email",
    icon: MessageCircle,
  },
  {
    href: "https://www.facebook.com/people/CreaVerse/61592002266797/",
    label: "Facebook",
    value: "@CreaVerse",
    icon: Facebook,
  },
  {
    href: "https://www.instagram.com/creaverseorg?utm_source=qr",
    label: "Instagram",
    value: "@creaverseorg",
    icon: Instagram,
  },
];

function ContactChip({ href, label, value, icon: Icon }: (typeof contacts)[number]) {
  const [open, setOpen] = useState(false);
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onTouchStart={() => setOpen((o) => !o)}
      aria-label={`${label}: ${value}`}
      className="group relative flex h-12 items-center overflow-hidden rounded-full border border-border bg-card px-3 shadow-sm transition-all duration-500 ease-out hover:border-[var(--color-ember)]/60 hover:shadow-md"
      style={{ width: open ? 260 : 48 }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-parchment)] text-[var(--color-ink)] transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-4 w-4" />
      </span>
      <span
        className={`ml-3 flex min-w-0 flex-col text-left transition-all duration-500 ${
          open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
        }`}
      >
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-medium text-foreground">{value}</span>
      </span>
    </a>
  );
}

export function ContactHub({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "" : "mt-16 border-t border-border pt-10"}>
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-[var(--color-ember)]" />
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">Contact Us</h3>
          <p className="text-sm text-muted-foreground">
            Hover, focus, or tap an icon to reveal the details.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {contacts.map((c) => (
          <ContactChip key={c.label} {...c} />
        ))}
      </div>
    </section>
  );
}
