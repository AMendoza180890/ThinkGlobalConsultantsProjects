import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { createClient } from "npm:@supabase/supabase-js@2";
import { template as surveyTemplate } from "../_shared/transactional-email-templates/survey-reminder.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = "https://cq-for-schools-weekly.lovable.app";
const SITE_NAME = "CQ Impact";
const SENDER_DOMAIN = "notify.thinkglobalconsultants.com";
const FROM_DOMAIN = "notify.thinkglobalconsultants.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let reminderType = "friday";
    try {
      const body = await req.json();
      if (body?.type) reminderType = body.type;
    } catch {
      // no body is fine
    }

    // Get current week in ISO format
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
    const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
    const week = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

    // Get all active school members with their school info
    const { data: members, error: membersError } = await supabase
      .from("school_members")
      .select("user_id, school_id, schools(name)")
      .eq("is_active", true);

    if (membersError) throw membersError;

    const sent: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const member of members ?? []) {
      const { data: userData } = await supabase.auth.admin.getUserById(
        member.user_id
      );
      if (!userData?.user?.email) {
        skipped.push(member.user_id);
        continue;
      }

      const email = userData.user.email;

      // Check if already responded this week
      const { data: existing } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("user_id", member.user_id)
        .eq("week", week)
        .maybeSingle();

      if (existing) {
        skipped.push(email);
        continue;
      }

      // Check suppression list
      const { data: suppressed } = await supabase
        .from("suppressed_emails")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (suppressed) {
        skipped.push(`${email} (suppressed)`);
        continue;
      }

      // Create or reuse survey token
      const { data: existingToken } = await supabase
        .from("survey_tokens")
        .select("token")
        .eq("user_id", member.user_id)
        .eq("week", week)
        .maybeSingle();

      let token: string;
      if (existingToken?.token) {
        token = existingToken.token;
      } else {
        const { data: newToken, error: tokenError } = await supabase
          .from("survey_tokens")
          .insert({
            user_id: member.user_id,
            school_id: member.school_id,
            week,
          })
          .select("token")
          .single();

        if (tokenError || !newToken) {
          errors.push(
            `${email}: ${tokenError?.message ?? "token creation failed"}`
          );
          continue;
        }
        token = newToken.token;
      }

      const surveyLink = `${APP_URL}/survey?token=${token}`;
      const schoolName = (member as any).schools?.name ?? "your school";

      const templateData = { schoolName, surveyLink, reminderType };
      const messageId = crypto.randomUUID();
      const idempotencyKey = `survey-${reminderType}-${week}-${member.user_id}`;

      try {
        // Render the email template
        const html = await renderAsync(
          React.createElement(surveyTemplate.component, templateData)
        );
        const text = await renderAsync(
          React.createElement(surveyTemplate.component, templateData),
          { plainText: true }
        );
        const subject =
          typeof surveyTemplate.subject === "function"
            ? surveyTemplate.subject(templateData)
            : surveyTemplate.subject;

        // Get or create unsubscribe token
        let unsubToken: string;
        const { data: existingUnsub } = await supabase
          .from("email_unsubscribe_tokens")
          .select("token, used_at")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (existingUnsub && !existingUnsub.used_at) {
          unsubToken = existingUnsub.token;
        } else if (!existingUnsub) {
          const bytes = new Uint8Array(32);
          crypto.getRandomValues(bytes);
          unsubToken = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          await supabase
            .from("email_unsubscribe_tokens")
            .upsert(
              { token: unsubToken, email: email.toLowerCase() },
              { onConflict: "email", ignoreDuplicates: true }
            );
          // Re-read in case of race
          const { data: stored } = await supabase
            .from("email_unsubscribe_tokens")
            .select("token")
            .eq("email", email.toLowerCase())
            .maybeSingle();
          if (stored) unsubToken = stored.token;
        } else {
          skipped.push(`${email} (unsubscribed)`);
          continue;
        }

        // Log pending
        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: "survey-reminder",
          recipient_email: email,
          status: "pending",
        });

        // Enqueue directly to the transactional email queue
        const { error: enqueueError } = await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: email,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text,
            purpose: "transactional",
            label: "survey-reminder",
            idempotency_key: idempotencyKey,
            unsubscribe_token: unsubToken,
            queued_at: new Date().toISOString(),
          },
        });

        if (enqueueError) {
          errors.push(`${email}: enqueue failed - ${enqueueError.message}`);
          continue;
        }

        sent.push(email);
      } catch (renderErr) {
        errors.push(
          `${email}: ${renderErr instanceof Error ? renderErr.message : String(renderErr)}`
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        week,
        reminderType,
        sent: sent.length,
        skipped: skipped.length,
        errors: errors.length,
        details: { sent, skipped, errors },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
