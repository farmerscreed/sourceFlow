// supabase/functions/ai-query/index.ts
// Natural Language Query using Claude API
// For Compare screen and general supplier questions

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question, supplier_data, context } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call Claude API
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const systemPrompt = `You are a procurement analyst for Primerose Estate, a 200-building residential development project in Abuja, Nigeria.

You are helping the project owner evaluate suppliers visited at Canton Fair 2026 in Guangzhou, China.

Key context:
- The project needs: windows, doors, cladding, railings, roofing, solar panels, inverters, batteries, smart home systems, CCTV, lighting, and various building materials
- Budget is significant but value for money is critical
- Suppliers who are manufacturers (not traders) are strongly preferred
- Experience shipping to Africa/Nigeria is a major plus
- Lead times matter - some items needed for carcass stage, others for finishing
- Quality certifications (IEC, ISO, CE) are important for solar and electrical

When analyzing suppliers:
1. Be specific with names, prices, and recommendations
2. Compare apples to apples (same specifications)
3. Consider total cost including shipping, MOQs, and payment terms
4. Flag any red flags or concerns
5. If data is insufficient, say so clearly

Format your responses in clear, scannable bullet points or tables when comparing multiple suppliers.`;

    const userMessage = supplier_data
      ? `Supplier data:\n${JSON.stringify(supplier_data, null, 2)}\n\n${context ? `Additional context: ${context}\n\n` : ""}Question: ${question}`
      : question;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2024-10-22",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`);
    }

    const claudeResult = await claudeResponse.json();
    const answer = claudeResult.content[0].text;

    // Log the query for future reference
    const supplierIds = supplier_data
      ? (Array.isArray(supplier_data) ? supplier_data : [supplier_data])
          .map((s: { id?: string }) => s.id)
          .filter(Boolean)
      : [];

    await supabase.from("ai_queries").insert({
      question,
      answer,
      context_supplier_ids: supplierIds,
    });

    return new Response(
      JSON.stringify({
        success: true,
        answer,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("AI-query error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
