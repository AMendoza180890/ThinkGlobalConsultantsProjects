import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple markdown-to-HTML converter for the report
function mdToHtml(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;margin:18px 0 8px;color:#1a1a1a;font-weight:600;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;margin:24px 0 10px;color:#111;font-weight:700;border-bottom:1px solid #ddd;padding-bottom:6px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;margin:0 0 16px;color:#000;font-weight:800;">$1</h1>')
    // Horizontal rules
    .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #ccc;margin:20px 0;">')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // List items (nested)
    .replace(/^  - (.+)$/gm, '<li style="margin-left:24px;font-size:11px;color:#444;">$1</li>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:12px;font-size:12px;color:#333;">$1</li>')
    // Paragraphs: wrap non-tag lines
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed;
      return `<p style="font-size:12px;line-height:1.6;color:#333;margin:6px 0;">${trimmed}</p>`;
    })
    .join('\n');

  return html;
}

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
    const { markdown, format } = await req.json();

    if (!markdown) {
      return new Response(
        JSON.stringify({ error: "Missing markdown content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (format === "docx") {
      // For DOCX, return HTML that Word can open
      const wordHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:w="urn:schemas-microsoft-com:office:word"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8">
        <style>
          body { font-family: Calibri, sans-serif; font-size: 11pt; color: #333; margin: 1in; }
          h1 { font-size: 20pt; color: #000; }
          h2 { font-size: 15pt; color: #111; border-bottom: 1pt solid #ccc; padding-bottom: 4pt; }
          h3 { font-size: 12pt; color: #1a1a1a; }
          p { font-size: 11pt; line-height: 1.5; }
          li { font-size: 11pt; margin-left: 12pt; }
          hr { border: none; border-top: 1pt solid #ccc; }
        </style></head>
        <body>${mdToHtml(markdown)}</body></html>`;
      
      const encoder = new TextEncoder();
      const docxBytes = encoder.encode(wordHtml);

      return new Response(docxBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": 'attachment; filename="wasc-report.doc"',
        },
      });
    }

    // PDF: Generate using HTML-to-PDF via Deno's built-in fetch to a headless renderer
    // Since we can't run a headless browser in edge functions, we'll create a print-ready HTML
    // that the client can print to PDF
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>WASC Accreditation Report</title>
<style>
  @page { size: A4; margin: 20mm 18mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 12px;
    line-height: 1.6;
    color: #333;
    max-width: 780px;
    margin: 0 auto;
    padding: 40px;
  }
  h1 { font-size: 22px; color: #000; margin: 0 0 8px; font-weight: 800; }
  h2 { font-size: 17px; color: #111; font-weight: 700; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin: 28px 0 12px; }
  h3 { font-size: 14px; color: #1a1a1a; font-weight: 600; margin: 20px 0 8px; }
  p { margin: 6px 0; }
  li { margin: 4px 0 4px 16px; }
  hr { border: none; border-top: 1px solid #ccc; margin: 24px 0; }
  strong { color: #111; }
  .header-bar {
    background: #1a365d;
    color: white;
    padding: 16px 24px;
    margin: -40px -40px 32px;
    border-radius: 0;
  }
  .header-bar h1 { color: white; margin: 0; font-size: 20px; }
  .header-bar p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 11px; }
  .footer {
    margin-top: 40px;
    padding-top: 12px;
    border-top: 1px solid #ccc;
    font-size: 10px;
    color: #888;
    text-align: center;
  }
</style>
</head>
<body>
<div class="header-bar">
  <h1>WASC Accreditation Report</h1>
  <p>Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · CQ Impact Analysis</p>
</div>
${mdToHtml(markdown)}
<div class="footer">
  Generated by CQ Impact · ACS WASC Accreditation Intelligence · ${new Date().toISOString().slice(0, 10)}
</div>
</body>
</html>`;

    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(htmlContent);

    return new Response(htmlBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'inline; filename="wasc-report.html"',
      },
    });
  } catch (e) {
    console.error("export-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
