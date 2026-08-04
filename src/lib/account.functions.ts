import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


export const deleteCurrentAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
    await supabaseAdmin.from("assignment_link_opens").delete().eq("student_id", userId);
    await supabaseAdmin.from("mentor_messages").delete().eq("user_id", userId);
    await supabaseAdmin.from("journal_entries").delete().eq("user_id", userId);
    await supabaseAdmin.from("onboarding_responses").delete().eq("user_id", userId);
    await supabaseAdmin.from("feedback").delete().eq("user_id", userId);
    await supabaseAdmin.from("direct_messages").delete().or(`sender_id.eq.${userId},student_id.eq.${userId},teacher_id.eq.${userId}`);
    await supabaseAdmin.from("chat_messages").delete().eq("sender_id", userId);
    await supabaseAdmin.from("submissions").delete().eq("student_id", userId);
    await supabaseAdmin.from("enrollments").delete().eq("student_id", userId);
    await supabaseAdmin.from("classes").delete().eq("teacher_id", userId);
    await supabaseAdmin.from("admin_users").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { ok: true };
  });