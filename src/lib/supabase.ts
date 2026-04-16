import { createClient } from '@supabase/supabase-js';

// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Running in offline-only mode.');
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // No auth needed for single-user app
      },
    });
  }

  return supabaseInstance;
}

// Export for convenience
export const supabase = getSupabase();

// ============================================================
// STORAGE HELPERS
// ============================================================

export async function uploadPhoto(
  supplierLocalId: string,
  photoLocalId: string,
  blob: Blob
): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  const path = `${supplierLocalId}/${photoLocalId}.jpg`;

  const { error } = await client.storage
    .from('photos')
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Photo upload error:', error);
    return null;
  }

  return path;
}

export async function uploadVoiceNote(
  supplierLocalId: string,
  noteLocalId: string,
  blob: Blob
): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  const path = `${supplierLocalId}/${noteLocalId}.webm`;

  const { error } = await client.storage
    .from('voice-notes')
    .upload(path, blob, {
      contentType: 'audio/webm',
      upsert: true,
    });

  if (error) {
    console.error('Voice note upload error:', error);
    return null;
  }

  return path;
}

export function getPhotoUrl(path: string): string | null {
  const client = getSupabase();
  if (!client || !path) return null;

  const { data } = client.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
}

// ============================================================
// DATABASE HELPERS
// ============================================================

export interface SupabaseSupplier {
  id?: string;
  local_id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  wechat: string;
  whatsapp: string;
  website: string;
  booth_number: string;
  hall_area: string;
  fair_phase: number;
  date_visited: string;
  categories: string[];
  primary_category: string | null;
  status: string;
  verification: string;
  rating: number;
  pricing: object;
  capabilities: object;
  notes: string;
  ai_summary: string;
  red_flags: string;
  green_flags: string;
  factory_visit_scheduled: boolean;
  factory_visit_date: string | null;
  factory_visit_notes: string;
  follow_up_required: boolean;
  follow_up_action: string;
  follow_up_done: boolean;
  boq_matches: object[];
  sync_status: string;
}

export async function upsertSupplier(supplier: SupabaseSupplier): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await (client
    .from('suppliers') as ReturnType<typeof client.from>)
    .upsert(supplier, { onConflict: 'local_id' })
    .select('id')
    .single();

  if (error) {
    console.error('Supplier upsert error:', error);
    return null;
  }

  return data?.id || null;
}

export async function upsertPhoto(photo: {
  local_id: string;
  supplier_id?: string;
  supplier_local_id: string;
  tag: string;
  storage_path: string;
  ocr_result: object;
  ocr_processed: boolean;
  sync_status: string;
}): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await (client
    .from('photos') as ReturnType<typeof client.from>)
    .upsert(photo, { onConflict: 'local_id' })
    .select('id')
    .single();

  if (error) {
    console.error('Photo upsert error:', error);
    return null;
  }

  return data?.id || null;
}

export async function upsertVoiceNote(note: {
  local_id: string;
  supplier_id?: string;
  supplier_local_id: string;
  storage_path: string;
  duration_seconds: number;
  transcription: string;
  structured_data: object;
  ai_processed: boolean;
  sync_status: string;
}): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await (client
    .from('voice_notes') as ReturnType<typeof client.from>)
    .upsert(note, { onConflict: 'local_id' })
    .select('id')
    .single();

  if (error) {
    console.error('Voice note upsert error:', error);
    return null;
  }

  return data?.id || null;
}

// ============================================================
// EDGE FUNCTION CALLS
// ============================================================

/**
 * Process a business card photo with OCR
 */
export async function callProcessCard(
  photoLocalId: string,
  photoStoragePath: string,
  supplierLocalId: string
): Promise<{ success: boolean; ocr_result?: object } | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client.functions.invoke('process-card', {
    body: {
      photo_local_id: photoLocalId,
      photo_storage_path: photoStoragePath,
      supplier_local_id: supplierLocalId,
    },
  });

  if (error) {
    console.error('Process card error:', error);
    throw new Error(error.message || 'Business card OCR failed');
  }

  return data;
}

/**
 * Process a voice note transcription
 */
export async function callProcessVoice(
  voiceNoteLocalId: string,
  transcription: string,
  supplierLocalId: string
): Promise<{ success: boolean; structured_data?: object } | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client.functions.invoke('process-voice', {
    body: {
      voice_note_local_id: voiceNoteLocalId,
      transcription,
      supplier_local_id: supplierLocalId,
    },
  });

  if (error) {
    console.error('Process voice error:', error);
    throw new Error(error.message || 'Voice note processing failed');
  }

  return data;
}

/**
 * Ask an AI question about suppliers
 */
export async function callAIQuery(
  question: string,
  supplierData?: object[],
  context?: string
): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client.functions.invoke('ai-query', {
    body: {
      question,
      supplier_data: supplierData,
      context,
    },
  });

  if (error) {
    console.error('AI query error:', error);
    throw new Error(error.message || 'AI query failed');
  }

  return data?.answer ?? null;
}
