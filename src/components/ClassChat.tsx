import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, MessagesSquare, Pencil, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConfirm } from "@/components/ConfirmDialog";
import { useDraft } from "@/hooks/useDraft";

interface ChatMessage {
  id: string;
  class_code: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

export function ClassChat({ classCode }: { classCode: string }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [senders, setSenders] = useState<Record<string, { email: string; full_name: string | null; role: string }>>({});
  const [text, setText, clearText] = useDraft(`draft:chat:${classCode}`);
  const confirm = useConfirm();
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadSenderProfiles = useCallback(async (ids: string[]) => {
    const missing = ids.filter((id) => !senders[id]);
    if (missing.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .in("id", missing);
    if (data) {
      setSenders((prev) => {
        const next = { ...prev };
        data.forEach((p) => {
          next[p.id] = { email: p.email, full_name: p.full_name, role: p.role };
        });
        return next;
      });
    }
  }, [senders]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("class_code", classCode)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (error) {
        toast.error(error.message);
      } else if (data) {
        setMessages(data as ChatMessage[]);
        await loadSenderProfiles([...new Set(data.map((m) => m.sender_id))]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classCode]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${classCode}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `class_code=eq.${classCode}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          loadSenderProfiles([msg.sender_id]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `class_code=eq.${classCode}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages", filter: `class_code=eq.${classCode}` },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classCode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || sending) return;
    const trimmed = text.trim().slice(0, 2000);
    if (!trimmed) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      class_code: classCode,
      sender_id: user.id,
      message_text: trimmed,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    clearText();
  };

  const beginEdit = (m: ChatMessage) => {
    setEditingId(m.id);
    setEditText(m.message_text);
  };

  const saveEdit = async (id: string) => {
    if (!user) return;
    const trimmed = editText.trim().slice(0, 2000);
    if (!trimmed) return;
    const { error } = await supabase
      .from("chat_messages")
      .update({ message_text: trimmed })
      .eq("id", id)
      .eq("sender_id", user.id);
    if (error) return toast.error(error.message);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, message_text: trimmed } : m)));
    setEditingId(null);
  };

  const deleteMessage = async (id: string) => {
    if (!user) return;
    const ok = await confirm({ title: "Delete this message?", confirmText: "Delete", destructive: true });
    if (!ok) return;
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", id)
      .eq("sender_id", user.id);
    if (error) return toast.error(error.message);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const nameFor = (id: string) => {
    if (id === user?.id) return "You";
    const s = senders[id];
    return s?.full_name || s?.email || "Member";
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <MessagesSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-display text-lg text-foreground">Class Chat</h2>
      </div>
      <div className="h-72 overflow-y-auto rounded-lg border border-border bg-[var(--color-parchment)]/30 p-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              const isTeacher = senders[m.sender_id]?.role === "teacher";
              return (
                <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    isTeacher
                      ? "border border-[var(--color-ember)]/50 bg-[var(--color-ember)]/10 text-foreground"
                      : mine
                        ? "bg-[var(--color-ember)]/15 text-foreground"
                        : "bg-background text-foreground"
                  }`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      <span>{nameFor(m.sender_id)}</span>
                      {isTeacher && (
                        <span className="rounded-full bg-[var(--color-ember)] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          Teacher
                        </span>
                      )}
                      <span>· {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {editingId === m.id ? (
                      <div className="mt-1 space-y-1">
                        <textarea
                          value={editText}
                          rows={2}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full resize-none rounded-md border border-input bg-background px-2 py-1 text-sm"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveEdit(m.id)}
                            className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground"
                          >
                            <Check className="h-3 w-3" /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium"
                          >
                            <X className="h-3 w-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{m.message_text}</div>
                    )}
                    {mine && editingId !== m.id && (
                      <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">
                        <button
                          onClick={() => beginEdit(m)}
                          className="inline-flex items-center gap-0.5 hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => deleteMessage(m.id)}
                          className="inline-flex items-center gap-0.5 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={profile ? "Message the class…" : "Sign in to chat"}
          maxLength={2000}
          className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
    </section>
  );
}
