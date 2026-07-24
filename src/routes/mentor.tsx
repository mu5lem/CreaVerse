import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { SUBJECTS, type Subject, type Lang } from "@/lib/mentor-data";
import { askMentor } from "@/lib/mentor.functions";
import { generateQuiz, type QuizQuestion } from "@/lib/quiz.functions";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, User as UserIcon, Sparkles, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import { useDraft } from "@/hooks/useDraft";

type Level = "school" | "college" | "university";

export const Route = createFileRoute("/mentor")({
  head: () => ({
    meta: [
      { title: "AI Mentor — Personalized Study Help | CreaVerse" },
      { name: "description", content: "Ask an AI mentor for study help across subjects and take practice quizzes tailored to school, college, and university levels." },
      { property: "og:title", content: "AI Mentor — CreaVerse" },
      { property: "og:description", content: "Personalized AI study help and quizzes for Pakistani and global students." },
      { property: "og:url", content: "/mentor" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/mentor" }],
  }),
  component: () => (
    <ProtectedRoute>
      <MentorPage />
    </ProtectedRoute>
  ),
});

interface Msg { role: "user" | "assistant"; text: string }

function MentorPage() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<"chat" | "quiz">("chat");
  if (!profile) return null;
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="AI Mentor" role={profile.role} email={profile.email} onSignOut={signOut} />
      <div className="mx-auto max-w-5xl px-6 py-6">
        <BackButton />
      </div>
      <main className="mx-auto max-w-5xl px-6 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Learn with your AI mentor</h1>
          <p className="mt-2 text-muted-foreground">
            Ask anything — from Matric to university. English or Urdu, any subject, any level. Powered by real AI.
          </p>
        </div>
        <div className="mb-6 inline-flex rounded-full border border-border bg-card p-1">
          <button
            onClick={() => setTab("chat")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${tab === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >Mentor Chat</button>
          <button
            onClick={() => setTab("quiz")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${tab === "quiz" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >Quiz</button>
        </div>
        {tab === "chat" ? <MentorChat /> : <QuizPanel />}
      </main>
    </div>
  );
}

function MentorChat() {
  const { user } = useAuth();
  const [subject, setSubject] = useState<Subject>("Math");
  const [lang, setLang] = useState<Lang>("en");
  const [level, setLevel] = useState<Level>("school");
  const greeting: Msg = { role: "assistant", text: "Hi! I'm your AI Mentor. Pick a subject, level, and language — then ask me anything." };
  const [msgs, setMsgs] = useState<Msg[]>([greeting]);
  const [input, setInput, clearInput] = useDraft("draft:mentor:input");
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const ask = useServerFn(askMentor);

  // Load saved history for this user + subject whenever subject changes.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingHistory(true);
    (async () => {
      const { data, error } = await supabase
        .from("mentor_messages")
        .select("role, content, created_at")
        .eq("user_id", user.id)
        .eq("subject", subject)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (error) {
        console.error("load mentor history", error);
        setMsgs([greeting]);
      } else if (data && data.length > 0) {
        setMsgs(
          data.map((r) => ({
            role: r.role === "user" ? "user" : "assistant",
            text: r.content,
          }))
        );
      } else {
        setMsgs([greeting]);
      }
      setLoadingHistory(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, subject]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const clearHistory = async () => {
    if (!user) return;
    if (!confirm("Clear all saved chats for this subject? This cannot be undone.")) return;
    const { error } = await supabase
      .from("mentor_messages")
      .delete()
      .eq("user_id", user.id)
      .eq("subject", subject);
    if (error) {
      toast.error("Failed to clear history.");
      return;
    }
    setMsgs([greeting]);
    toast.success("History cleared.");
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    clearInput();
    setBusy(true);
    const nextMsgs: Msg[] = [...msgs, { role: "user", text }];
    setMsgs(nextMsgs);

    // Persist the user message immediately (fire-and-forget).
    if (user) {
      supabase
        .from("mentor_messages")
        .insert({ user_id: user.id, subject, role: "user", content: text })
        .then(({ error }) => {
          if (error) console.error("save user msg", error);
        });
    }

    try {
      const history = nextMsgs
        .slice(-20, -1) // send more turns so the mentor remembers the conversation
        .map((m) => ({ role: m.role, content: m.text }));
      const res = await ask({
        data: { subject, lang, level, history, message: text },
      });
      if (res.ok) {
        setMsgs((m) => [...m, { role: "assistant", text: res.reply }]);
        if (user) {
          supabase
            .from("mentor_messages")
            .insert({ user_id: user.id, subject, role: "assistant", content: res.reply })
            .then(({ error }) => {
              if (error) console.error("save assistant msg", error);
            });
        }
      } else {
        toast.error(res.error);
        setMsgs((m) => [...m, { role: "assistant", text: `⚠️ ${res.error}` }]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reach the mentor.");
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value as Subject)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as Level)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="school">School (Matric / O-Level)</option>
          <option value="college">College (FSc / A-Level / MDCAT / ECAT)</option>
          <option value="university">University</option>
        </select>
        <div className="inline-flex rounded-full border border-border bg-background p-0.5 text-xs">
          <button onClick={() => setLang("en")} className={`rounded-full px-3 py-1 ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>EN</button>
          <button onClick={() => setLang("ur")} className={`rounded-full px-3 py-1 ${lang === "ur" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>اردو</button>
        </div>
      </div>
      <div ref={scroller} className="h-96 space-y-4 overflow-y-auto p-6">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-[var(--color-ember)]/15 text-[var(--color-ember)]"}`}>
              {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${m.role === "user" ? "whitespace-pre-wrap bg-primary text-primary-foreground" : "bg-[var(--color-parchment)] text-foreground"}`}>
              {m.role === "assistant" ? (
                <div className="space-y-2 text-sm leading-relaxed [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_h1]:mt-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold [&_strong]:font-semibold [&_em]:italic [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-black/5 [&_pre]:p-2 [&_a]:text-[var(--color-ember)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_table]:my-2 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{m.text}</ReactMarkdown>
                </div>
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ember)]/15 text-[var(--color-ember)]">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-parchment)] px-4 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-border p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask any question — e.g. Explain Newton's second law with an example"
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
        </button>
      </form>
    </div>
  );
}

type QuizDiff = "easy" | "medium" | "hard";

function QuizPanel() {
  const [subject, setSubject] = useState<Subject>("Math");
  const [topic, setTopic] = useState("");
  const [diff, setDiff] = useState<QuizDiff>("medium");
  const [level, setLevel] = useState<Level>("school");
  const [lang, setLang] = useState<Lang>("en");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const gen = useServerFn(generateQuiz);

  const start = async () => {
    setLoading(true);
    try {
      const res = await gen({ data: { subject, topic: topic.trim(), difficulty: diff, level, lang, count } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setQuestions(res.questions);
      setIdx(0);
      setAnswers([]);
      setDone(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const pick = (choice: number) => {
    if (!questions) return;
    const next = [...answers, choice];
    setAnswers(next);
    if (idx + 1 >= questions.length) setDone(true);
    else setIdx(idx + 1);
  };

  const reset = () => { setQuestions(null); setAnswers([]); setIdx(0); setDone(false); };

  if (!questions) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-ember)]/15 text-[var(--color-ember)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="font-display text-2xl text-foreground">Generate an AI quiz</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a subject and (optionally) a topic. The AI mentor will craft a fresh quiz every time — no fixed question banks.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-muted-foreground">
            Subject
            <select value={subject} onChange={(e) => setSubject(e.target.value as Subject)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Level
            <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
              <option value="school">School (Matric / O-Level)</option>
              <option value="college">College (FSc / A-Level / MDCAT / ECAT)</option>
              <option value="university">University</option>
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Difficulty
            <select value={diff} onChange={(e) => setDiff(e.target.value as QuizDiff)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Number of questions
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
              {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
            Topic (optional — leave blank for a broad quiz)
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Newton's laws, algebraic identities, photosynthesis…" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" />
          </label>
          <div className="flex items-center gap-2 text-xs sm:col-span-2">
            <span className="text-muted-foreground">Language:</span>
            <div className="inline-flex rounded-full border border-border bg-background p-0.5">
              <button type="button" onClick={() => setLang("en")} className={`rounded-full px-3 py-1 ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>EN</button>
              <button type="button" onClick={() => setLang("ur")} className={`rounded-full px-3 py-1 ${lang === "ur" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>اردو</button>
            </div>
          </div>
        </div>
        <button onClick={start} disabled={loading} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating…" : "Generate quiz"}
        </button>
      </div>
    );
  }

  if (done) {
    const score = answers.reduce((acc, a, i) => acc + (a === questions[i]?.answer ? 1 : 0), 0);
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h2 className="font-display text-3xl text-foreground">Your score</h2>
          <div className="my-6 font-display text-6xl text-[var(--color-ember)]">{score} / {questions.length}</div>
          <p className="text-sm text-muted-foreground">{score === questions.length ? "Perfect! 🎉" : score >= questions.length / 2 ? "Nice work — keep going." : "Review the explanations below and try again."}</p>
        </div>
        <ul className="mt-8 space-y-4">
          {questions.map((q, i) => {
            const chosen = answers[i];
            const correct = chosen === q.answer;
            return (
              <li key={i} className="rounded-xl border border-border bg-background p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Q{i + 1} · {correct ? "Correct" : "Incorrect"}</div>
                <div className="mt-1 font-medium text-foreground">{q.q}</div>
                <div className="mt-2 grid gap-1 text-sm">
                  {q.options.map((o, oi) => (
                    <div key={oi} className={`rounded px-2 py-1 ${oi === q.answer ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : oi === chosen ? "bg-red-500/10 text-red-700 dark:text-red-400" : "text-muted-foreground"}`}>
                      {String.fromCharCode(65 + oi)}. {o}
                    </div>
                  ))}
                </div>
                {q.explanation && <div className="mt-2 text-xs text-muted-foreground"><strong>Why:</strong> {q.explanation}</div>}
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={start} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Generate another
          </button>
          <button onClick={reset} className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-secondary">Change settings</button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>Question {idx + 1} of {questions.length}</span>
        <button onClick={reset} className="text-xs normal-case tracking-normal text-muted-foreground underline hover:text-foreground">Cancel</button>
      </div>
      <h3 className="font-display text-2xl text-foreground">{q.q}</h3>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {q.options.map((o: string, i: number) => (
          <button key={i} onClick={() => pick(i)} className="rounded-xl border border-border bg-background px-4 py-3 text-left text-sm text-foreground transition hover:border-[var(--color-ember)]">
            {String.fromCharCode(65 + i)}. {o}
          </button>
        ))}
      </div>
    </div>
  );
}
