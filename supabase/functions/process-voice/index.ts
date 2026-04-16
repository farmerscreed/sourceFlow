// supabase/functions/process-voice/index.ts
// Voice Note Processing using Claude API
// Processes transcription text and extracts structured data

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PriceMention {
  product: string;
  price: number;
  currency: string;
  unit: string;
}

interface StructuredData {
  prices_mentioned: PriceMention[];
  moq_mentioned: number | null;
  lead_time_mentioned: string | null;
  key_specs: string[];
  manufacturer_signals: string[];
  trader_signals: string[];
  notable_points: string[];
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { voice_note_local_id, transcription, supplier_local_id } = await req.json();

    if (!transcription) {
      return new Response(
        JSON.stringify({ error: "transcription is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call Claude API to structure the transcription
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2024-10-22",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `You are a procurement analyst for a 200-building residential estate project in Nigeria (Primerose Estate).
You are helping extract structured data from voice notes recorded at trade fair booths (Canton Fair).
Focus on identifying pricing information, MOQs, lead times, manufacturer vs trader signals, and notable observations.
Return JSON only, no other text.`,
        messages: [
          {
            role: "user",
            content: `Extract structured data from this voice note transcription recorded at a Canton Fair supplier booth:

"${transcription}"

Return this exact JSON structure (no other text):
{
  "prices_mentioned": [
    { "product": "product name", "price": 24.00, "currency": "USD", "unit": "per piece" }
  ],
  "moq_mentioned": 500,
  "lead_time_mentioned": "45 days",
  "key_specs": ["spec 1", "spec 2"],
  "manufacturer_signals": ["has own factory", "showed production line"],
  "trader_signals": ["vague about factory", "no production knowledge"],
  "notable_points": ["important observation 1", "important observation 2"],
  "sentiment": "positive",
  "summary": "One paragraph summary of the key points from this voice note"
}

Use null for moq_mentioned and lead_time_mentioned if not mentioned.
Use empty arrays [] if no items for a category.
Sentiment should be positive, neutral, or negative based on overall impression.`,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`);
    }

    const claudeResult = await claudeResponse.json();
    const responseText = claudeResult.content[0].text;

    // Parse the JSON response
    let structuredData: StructuredData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse structured data:", responseText);
      structuredData = {
        prices_mentioned: [],
        moq_mentioned: null,
        lead_time_mentioned: null,
        key_specs: [],
        manufacturer_signals: [],
        trader_signals: [],
        notable_points: [],
        sentiment: "neutral",
        summary: transcription.substring(0, 200),
      };
    }

    // Update the voice note record
    const { error: updateNoteError } = await supabase
      .from("voice_notes")
      .update({
        structured_data: structuredData,
        ai_processed: true,
      })
      .eq("local_id", voice_note_local_id);

    if (updateNoteError) {
      console.error("Failed to update voice note:", updateNoteError);
    }

    // Update supplier with extracted information
    if (supplier_local_id) {
      // Get current supplier data
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("ai_summary, pricing, verification")
        .eq("local_id", supplier_local_id)
        .single();

      if (supplier) {
        const updates: Record<string, unknown> = {};

        // Append to AI summary
        const existingSummary = supplier.ai_summary || "";
        const newSummary = existingSummary
          ? `${existingSummary}\n\n${structuredData.summary}`
          : structuredData.summary;
        updates.ai_summary = newSummary;

        // Update pricing if prices were mentioned
        if (structuredData.prices_mentioned.length > 0) {
          const existingPricing = supplier.pricing || { quotes: [] };
          const newQuotes = structuredData.prices_mentioned.map((p) => ({
            product: p.product,
            unit_price: p.price,
            currency: p.currency,
            unit: p.unit,
            moq: structuredData.moq_mentioned,
            notes: "",
          }));

          updates.pricing = {
            ...existingPricing,
            quotes: [...(existingPricing.quotes || []), ...newQuotes],
            lead_time_days: structuredData.lead_time_mentioned
              ? (() => { const m = String(structuredData.lead_time_mentioned).match(/\d+/); return m ? parseInt(m[0]) : null; })()
              : existingPricing.lead_time_days,
          };
        }

        // Update verification based on signals
        if (supplier.verification === "unverified") {
          if (structuredData.manufacturer_signals.length > structuredData.trader_signals.length) {
            updates.verification = "likely_manufacturer";
          } else if (structuredData.trader_signals.length > structuredData.manufacturer_signals.length) {
            updates.verification = "likely_trader";
          }
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from("suppliers")
            .update(updates)
            .eq("local_id", supplier_local_id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        structured_data: structuredData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Process-voice error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
