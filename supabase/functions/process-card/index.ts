// supabase/functions/process-card/index.ts
// Business Card OCR using Claude Vision API
// Trigger: Called when a photo with tag 'business_card' is synced

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OCRResult {
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  wechat: string;
  whatsapp: string;
  website: string;
  address: string;
  title: string;
  raw_text: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { photo_local_id, photo_storage_path, supplier_local_id } = await req.json();

    if (!photo_storage_path) {
      return new Response(
        JSON.stringify({ error: "photo_storage_path is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download image from Supabase Storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from("photos")
      .download(photo_storage_path);

    if (downloadError) {
      throw new Error(`Failed to download image: ${downloadError.message}`);
    }

    // Convert to base64
    const arrayBuffer = await imageData.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = imageData.type || "image/jpeg";

    // Call Claude API for OCR
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: `Extract all contact information from this business card image.
Return JSON only, no preamble or explanation: {
  "company_name": "",
  "contact_person": "",
  "phone": "",
  "email": "",
  "wechat": "",
  "whatsapp": "",
  "website": "",
  "address": "",
  "title": "",
  "raw_text": ""
}
If a field is not visible or unclear, use empty string.
For phone numbers, include country code if visible.
The raw_text field should contain all visible text from the card.`,
              },
            ],
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
    let ocrResult: OCRResult;
    try {
      // Try to extract JSON from the response (in case there's any extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        ocrResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse OCR result:", responseText);
      ocrResult = {
        company_name: "",
        contact_person: "",
        phone: "",
        email: "",
        wechat: "",
        whatsapp: "",
        website: "",
        address: "",
        title: "",
        raw_text: responseText,
      };
    }

    // Update the photo record with OCR results
    const { error: updatePhotoError } = await supabase
      .from("photos")
      .update({
        ocr_result: ocrResult,
        ocr_processed: true,
      })
      .eq("local_id", photo_local_id);

    if (updatePhotoError) {
      console.error("Failed to update photo:", updatePhotoError);
    }

    // If supplier fields are empty, auto-populate from OCR
    if (supplier_local_id && ocrResult.company_name) {
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("company_name, contact_person, phone, email, wechat, website")
        .eq("local_id", supplier_local_id)
        .single();

      if (supplier) {
        const updates: Record<string, string> = {};

        if (!supplier.company_name && ocrResult.company_name) {
          updates.company_name = ocrResult.company_name;
        }
        if (!supplier.contact_person && ocrResult.contact_person) {
          updates.contact_person = ocrResult.contact_person;
        }
        if (!supplier.phone && ocrResult.phone) {
          updates.phone = ocrResult.phone;
        }
        if (!supplier.email && ocrResult.email) {
          updates.email = ocrResult.email;
        }
        if (!supplier.wechat && ocrResult.wechat) {
          updates.wechat = ocrResult.wechat;
        }
        if (!supplier.website && ocrResult.website) {
          updates.website = ocrResult.website;
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
        ocr_result: ocrResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Process-card error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
