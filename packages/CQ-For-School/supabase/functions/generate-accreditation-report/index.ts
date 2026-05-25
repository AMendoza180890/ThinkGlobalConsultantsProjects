import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { summary, allEvidence, adminNotes, cumulativeWins } = await req.json();

    if (!summary || !allEvidence) {
      return new Response(
        JSON.stringify({ error: "Missing required data: summary and allEvidence" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert accreditation report writer for ACS WASC (Western Association of Schools and Colleges) school reviews.

RULES:
- Every sentence you write MUST reference a specific number from the data provided. Never invent or estimate statistics.
- Use the exact risk scores, severity averages, issue counts, participation rates, trend directions, and evidence counts from the JSON data.
- Write in formal third-person prose suitable for an accreditation submission.
- Structure the report with clear markdown headings.
- Where data is missing or insufficient, explicitly state "Insufficient data to assess" rather than fabricating.
- When referencing CQ wins, use the exact behavior labels and counts provided.
- Include specific week counts, date ranges, and percentage changes where available.

REPORT STRUCTURE:
1. # WASC Accreditation Report — CQ Impact Analysis
2. ## Executive Summary (2-3 paragraphs citing overall risk score, total issues, participation rate, reporting weeks, high-risk domain count)
3. ## Domain Analysis (one subsection per domain with survey data, each citing: risk score, risk level, avg severity, trend direction, issue count, evidence count, top friction items with their severities, missing evidence)
4. ## Document-Only Standards (brief section listing standards that require manual document uploads and their current status)
5. ## CQ Behavioral Evidence (if win data exists: cite most/least practiced behaviors, counts, and patterns)
6. ## Recommendations (actionable items tied to specific high/medium risk domains, citing the friction drivers)
7. ## Administrative Notes (include verbatim if provided)

Keep the total report between 1500-2500 words.`;

    const dataPayload = JSON.stringify({
      overallRisk: summary.overallRisk,
      overallScore: summary.overallScore,
      totalIssuesReported: summary.totalIssuesReported,
      participationRate: summary.participationRate,
      reportingWeeks: summary.reportingWeeks,
      domainAssessments: summary.domainAssessments.map((a: any) => ({
        domainCode: a.domain.code,
        domainName: a.domain.name,
        domainDescription: a.domain.description,
        riskLevel: a.riskLevel,
        riskScore: a.riskScore,
        avgSeverity: a.avgSeverity,
        trendDirection: a.trendDirection,
        issueCount: a.issueCount,
        evidenceCount: a.evidenceCount,
        missingEvidence: a.missingEvidence,
        topIssues: a.topIssues,
      })),
      evidenceArtifacts: allEvidence,
      cqWinBehaviors: cumulativeWins ?? [],
      adminNotes: adminNotes || "None provided.",
    });

    const userPrompt = `Generate a WASC accreditation report from the following school data. Every claim must cite a specific number from this data:\n\n${dataPayload}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate report. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("generate-accreditation-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
