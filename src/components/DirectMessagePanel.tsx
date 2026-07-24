import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface DM {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Props {
  classCode: string;
  teacherId: string;
  studentId: string;
  currentUserId: string;
  otherName: string;
  height?: string;
}

export function DirectMessagePanel({
  classCode,
  teacherId,
  studentId,
  currentUserId,
  otherName,
  height = "h-72",
}: Props) {
  const [messages, setMessages] = useState<DM[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("direct_messages")
      .select("id, sender_id, content, created_at")
      .eq("class_code", classCode)
      .eq("teacher_id", teacherId)
      .eq("student_id", studentId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) return;
    setMessages((data ?? []) as DM[]);
  }, [classCode, teacherId, studentId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`dm-${teacherId}-${studentId}-${classCode}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `class_code=eq.${classCode}`,
        },
        (payload) => {
          const row = payload.new as DM & { teacher_id: string; student_id: string };
          if (row.teacher_id === teacherId && row.student_id === studentId) {
            setMessages((m) => [...m, row]);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, teacherId, studentId, classCode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("direct_messages").insert({
      class_code: classCode,
      teacher_id: teacherId,
      student_id: studentId,
      sender_id: currentUserId,
      content: text.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setText("");
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div className={`${height} space-y-2 overflow-y-auto p-3`}>
        {messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No messages yet — say hi to {otherName}.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-[var(--color-parchment)] text-foreground"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  <div className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-border p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${otherName}…`}
          className="flex-1 rounded-full border border-input bg-background px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
        >
          <Send className="h-3.5 w-3.5" /> Send
        </button>
      </form>
    </div>
  );
}
