import { Link } from "@tanstack/react-router";
import { Bot, BookOpen, GraduationCap, Compass, Flower2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GroupNav({ role }: { role: string }) {
  const dashboard = role === "teacher" ? "/teacher/dashboard" : role === "admin" ? "/admin/dashboard" : "/student/dashboard";
  return (
    <nav aria-label="Learning groups" className="mb-10 grid gap-4 lg:grid-cols-4">
      <section className="min-w-0 rounded-lg border border-border bg-card p-5 lg:col-span-2 sm:p-6">
        <GraduationCap className="mb-4 h-7 w-7 text-ember" />
        <h2 className="break-words font-display text-2xl text-foreground">School-in-a-Box</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/mentor"><Bot />AI Mentor</Link></Button>
          <Button asChild variant="outline"><Link to="/academy"><BookOpen />Academy</Link></Button>
          <Button asChild variant="outline"><Link to={dashboard} hash="my-classes"><GraduationCap />Classroom</Link></Button>
        </div>
      </section>
      <Link to="/outreach" search={{ tab: "opportunities", q: "" }} className="group min-w-0 rounded-lg border border-border bg-secondary/50 p-5 transition-colors hover:bg-secondary sm:p-6">
        <Compass className="mb-4 h-7 w-7 text-foreground" />
        <h2 className="flex items-center justify-between gap-2 font-display text-xl text-foreground">Outreach<ArrowUpRight className="h-4 w-4 shrink-0" /></h2>
        <p className="mt-3 text-sm text-muted-foreground">Opportunities · Contests · Community</p>
      </Link>
      <Link to="/mind-garden" search={{ tab: "journal" }} className="group min-w-0 rounded-lg border border-border bg-accent/10 p-5 transition-colors hover:bg-accent/20 sm:p-6">
        <Flower2 className="mb-4 h-7 w-7 text-ember" />
        <h2 className="flex items-center justify-between gap-2 font-display text-xl text-foreground">Mind Garden<ArrowUpRight className="h-4 w-4 shrink-0" /></h2>
        <p className="mt-3 text-sm text-muted-foreground">Journal · Memory Game</p>
      </Link>
    </nav>
  );
}