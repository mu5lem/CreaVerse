import { createFileRoute, Link } from "@tanstack/react-router";
import { BookLogo } from "@/components/BookLogo";
import { brand } from "@/lib/brand";
import { Heart, MapPin, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About ${brand.name} — Our Mission for Pakistani Education` },
      { name: "description", content: "CreaVerse is a learning universe built to close Pakistan's education gap — founded by Muhammad Muslim of Dera Ghazi Khan." },
      { property: "og:title", content: `About — ${brand.name}` },
      { property: "og:description", content: "Our mission: bring quality learning to every child, especially in Pakistan's underprivileged regions." },
      { property: "og:url", content: "/about" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-3">
          <BookLogo size={32} className="text-[var(--color-ink)]" />
          <span className="font-display text-xl font-semibold text-foreground">
            {brand.name}
          </span>
        </Link>
        <Link
          to="/"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          Back home
        </Link>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-6">
        {/* Hero */}
        <header className="mb-14 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-[var(--color-parchment)] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ember)]" />
            About CreaVerse
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Education is a right,
            <br />
            <span className="text-[var(--color-ember)]">not a privilege.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {brand.fullPitch}
          </p>
        </header>

        {/* Mottos & slogans */}
        <section className="mb-14 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-parchment)]">
              <Sparkles className="h-5 w-5 text-[var(--color-ember)]" />
            </div>
            <h3 className="font-display text-lg text-foreground">Our Motto</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <em className="not-italic font-semibold text-foreground">Learn. Visualize. Build.</em>
              {" "}Three verbs, one promise — knowledge should feel alive, and every learner
              deserves to touch it, question it, and shape it.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-parchment)]">
              <Heart className="h-5 w-5 text-[var(--color-ember)]" />
            </div>
            <h3 className="font-display text-lg text-foreground">Our Slogan</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <em className="not-italic font-semibold text-foreground">
                Education for Everyone — a learning universe for every child.
              </em>{" "}
              From a village school in South Punjab to a city classroom in Karachi,
              the same tools, the same dignity, the same doors.
            </p>
          </div>
        </section>

        {/* Long-form: why the app exists */}
        <section className="prose prose-neutral mx-auto max-w-none space-y-6 text-[15px] leading-[1.85] text-foreground">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Why {brand.name} exists
          </h2>
          <p>
            Pakistan is home to one of the largest young populations on earth — yet
            over <strong>26 million children</strong> remain out of school, and millions
            more sit inside classrooms where a single overworked teacher, a broken
            blackboard, and a decades-old textbook are the only bridge to the world.
            In districts like <strong>Dera Ghazi Khan, Rajanpur, Tharparkar, and the
            merged tribal districts of KP</strong>, the reality is even starker: crumbling
            infrastructure, no science labs, no libraries, no internet, and daughters
            pulled out of school long before they can dream.
          </p>
          <p>
            The problem is not that Pakistani children can't learn. It is that
            <em> quality learning has become a luxury good</em> — locked inside
            elite private schools, expensive tuition academies, and English-medium
            curricula that most families can never afford. A child in Islamabad's
            F-7 sector and a child in a Basti outside DG Khan share the same
            curiosity, the same intelligence, the same capacity for wonder. They do
            not share the same chance.
          </p>
          <p>
            {brand.name} was built to narrow that gap. Not with slogans, but with
            software. We put a <strong>free AI mentor</strong> in every learner's
            pocket, so a student without a private tutor can still ask "why?" at
            midnight and get a patient answer. We embed <strong>real 3D and VR
            visualizations</strong> of the solar system, the human heart, and the
            atom — because a village student deserves to <em>see</em> gravity, not
            just memorize its formula. We build a <strong>teacher studio</strong>
            where a single motivated ustaad in Layyah can run a class as
            professionally as any institute in Lahore, and a <strong>class chat</strong>
            so students never learn alone.
          </p>
          <p>
            We index <strong>hundreds of Pakistani and global opportunities</strong>
            — IBA's National Talent Hunt Program, HEC scholarships, PIEAS, LUMS
            National Outreach, Rhodes, Gates Cambridge, DAAD — because a talented
            child in Kot Addu should learn about the same doors that open for a
            child in Defence. We add a <strong>Pakistan-context academy</strong>
            with Urdu, Islamiat, Pakistan Studies, and Matric / FSc / CSS prep,
            because education that ignores your language and your history is not
            education — it is exile.
          </p>
          <p>
            Our promise is simple: as long as a child has a phone and a spark of
            curiosity, {brand.name} will meet them where they are, in the language
            they think in, for free. Quality education should not depend on your
            postcode. It should depend on nothing at all.
          </p>

          <h2 className="mt-10 font-display text-3xl font-semibold tracking-tight text-foreground">
            The founder
          </h2>
          <div className="not-prose flex items-start gap-5 rounded-2xl border border-border bg-[var(--color-parchment)]/40 p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-ember)]/15 text-[var(--color-ember)]">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-foreground">
                Muhammad Muslim
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Founder — Dera Ghazi Khan, Pakistan
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Muhammad Muslim grew up in <strong>Dera Ghazi Khan</strong>, watching
                brilliant classmates leave school one by one — not because they
                couldn't learn, but because the system around them couldn't teach.
                Years later, that memory became a mission. He built {brand.name} as
                a single, honest answer to a question he could never stop asking:
                <em>
                  {" "}what if every child in Pakistan had the same access to
                  learning as the luckiest one?
                </em>
              </p>
            </div>
          </div>

          <p className="pt-4 text-center text-sm italic text-muted-foreground">
            "You do not fix a broken classroom with pity. You fix it with tools."
            <br />— Muhammad Muslim
          </p>
        </section>

        <div className="mt-14 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Join {brand.name}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-card px-7 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
