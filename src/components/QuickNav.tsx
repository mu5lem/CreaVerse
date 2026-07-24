import { Link } from "@tanstack/react-router";
import { Bot, Compass, Glasses, Library, Gamepad2, Trophy, NotebookPen, Users, HelpCircle, Mail } from "lucide-react";
import type { ComponentType } from "react";

const links: { to: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { to: "/mentor", label: "AI Mentor", icon: Bot },
  { to: "/opportunities", label: "Opportunities", icon: Compass },
  { to: "/contests", label: "Contests", icon: Trophy },
  { to: "/vr", label: "VR Lab", icon: Glasses },
  { to: "/academy", label: "Academy", icon: Library },
  { to: "/minigame", label: "Memory Game", icon: Gamepad2 },
  { to: "/journal", label: "Journal", icon: NotebookPen },
  { to: "/community", label: "Community", icon: Users },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
  { to: "/contact", label: "Contact Us", icon: Mail },
];


export function QuickNav() {
  return (
    <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition hover:border-[var(--color-ember)]/60"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-parchment)] text-[var(--color-ink)] transition group-hover:bg-[var(--color-ember)]/15 group-hover:text-[var(--color-ember)]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-xs font-medium text-foreground">{label}</div>
        </Link>
      ))}
    </div>
  );
}

