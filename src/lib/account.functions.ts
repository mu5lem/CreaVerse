import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const phoneRegistrationSchema = z.object({
  syntheticEmail: z.string().email(),
  password: z.string().min(6).max(128),
  fullName: z.string().min(1).max(100),
  phone: z.string().min(8).max(32),
  waCode: z.string().regex(/^CV-\d{4}$/),
  gender: z.string().max(40).nullable().optional(),
  school: z.string().max(150).nullable().optional(),
});

export const registerPhoneAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => phoneRegistrationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.syntheticEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, phone: data.phone },
    });
    if (error) throw error;
    const uid = created.user?.id;
    if (!uid) throw new Error("Could not create phone account");

    const { error: pErr } = await supabaseAdmin.from("profiles").upsert({
      id: uid,
      email: data.syntheticEmail,
      phone: data.phone,
      role: "student",
      full_name: data.fullName,
      gender: data.gender ?? null,
      school: data.school ?? null,
      wa_verify_code: data.waCode,
      phone_verified: false,
    });
    if (pErr) throw pErr;
    return { ok: true as const, userId: uid };
  });

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