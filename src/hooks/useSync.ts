'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useToastStore } from '@/lib/store';
import { db, getPendingSuppliers, getSuppliersWithPendingAI, getPhotosBySupplier, getVoiceNotesBySupplier } from '@/lib/db';
import {
  getSupabase,
  uploadPhoto,
  uploadVoiceNote,
  upsertSupplier,
  upsertPhoto,
  upsertVoiceNote,
  callProcessCard,
  callProcessVoice,
  type SupabaseSupplier,
} from '@/lib/supabase';
import { SYNC_CONFIG } from '@/lib/constants';
import type { LocalSupplier, LocalPhoto, LocalVoiceNote } from '@/lib/types';

/**
 * Hook to manage sync operations.
 * Call this once at the app root level.
 */
export function useSync() {
  const {
    isOnline,
    isSyncing,
    setIsSyncing,
    setPendingSyncCount,
    setLastSyncAt,
  } = useAppStore();

  const { addToast } = useToastStore();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasOfflineRef = useRef(!isOnline);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const pending = await getPendingSuppliers();
    setPendingSyncCount(pending.length);
  }, [setPendingSyncCount]);

  // Sync a single supplier and all related data
  const syncSupplier = useCallback(async (supplier: LocalSupplier): Promise<boolean> => {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      // 1. Upload photos
      const photos = await getPhotosBySupplier(supplier.localId);
      const businessCardPhotos: { localId: string; remotePath: string }[] = [];

      for (const photo of photos) {
        if (photo.syncStatus === 'pending' && photo.blob) {
          const remotePath = await uploadPhoto(supplier.localId, photo.localId, photo.blob);
          if (remotePath) {
            await db.photos.update(photo.localId, {
              remotePath,
              syncStatus: 'synced',
            });

            // Track business card photos for OCR processing
            if (photo.tag === 'business_card' && !photo.ocrProcessed) {
              businessCardPhotos.push({ localId: photo.localId, remotePath });
            }
          }
        }
        // Also retry already-synced business card photos that failed AI processing
        if (photo.syncStatus === 'synced' && photo.tag === 'business_card' && !photo.ocrProcessed && photo.remotePath) {
          const alreadyQueued = businessCardPhotos.some(p => p.localId === photo.localId);
          if (!alreadyQueued) {
            businessCardPhotos.push({ localId: photo.localId, remotePath: photo.remotePath });
          }
        }
      }

      // 2. Upload voice notes
      const voiceNotes = await getVoiceNotesBySupplier(supplier.localId);
      const unprocessedVoiceNotes: { localId: string; transcription: string }[] = [];

      for (const note of voiceNotes) {
        if (note.syncStatus === 'pending' && note.blob) {
          const remotePath = await uploadVoiceNote(supplier.localId, note.localId, note.blob);
          if (remotePath) {
            await db.voiceNotes.update(note.localId, {
              remotePath,
              syncStatus: 'synced',
            });

            // Track voice notes with transcription for AI processing
            if (note.transcription && !note.aiProcessed) {
              unprocessedVoiceNotes.push({ localId: note.localId, transcription: note.transcription });
            }
          }
        }
        // Also retry already-synced voice notes that failed AI processing
        if (note.syncStatus === 'synced' && !note.aiProcessed && note.transcription && note.remotePath) {
          const alreadyQueued = unprocessedVoiceNotes.some(n => n.localId === note.localId);
          if (!alreadyQueued) {
            unprocessedVoiceNotes.push({ localId: note.localId, transcription: note.transcription });
          }
        }
      }

      // 3. Upsert supplier record
      const supabaseSupplier: SupabaseSupplier = {
        local_id: supplier.localId,
        company_name: supplier.companyName,
        contact_person: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        wechat: supplier.wechat,
        whatsapp: supplier.whatsapp,
        website: supplier.website,
        booth_number: supplier.boothNumber,
        hall_area: supplier.hallArea,
        fair_phase: supplier.fairPhase,
        date_visited: supplier.dateVisited,
        categories: supplier.categories,
        primary_category: supplier.primaryCategory,
        status: supplier.status,
        verification: supplier.verification,
        rating: supplier.rating,
        pricing: supplier.pricing,
        capabilities: supplier.capabilities,
        notes: supplier.notes,
        ai_summary: supplier.aiSummary,
        red_flags: supplier.redFlags,
        green_flags: supplier.greenFlags,
        factory_visit_scheduled: supplier.factoryVisitScheduled,
        factory_visit_date: supplier.factoryVisitDate,
        factory_visit_notes: supplier.factoryVisitNotes,
        follow_up_required: supplier.followUpRequired,
        follow_up_action: supplier.followUpAction,
        follow_up_done: supplier.followUpDone,
        boq_matches: supplier.boqMatches,
        sync_status: 'synced',
      };

      const remoteId = await upsertSupplier(supabaseSupplier);
      if (remoteId) {
        await db.suppliers.update(supplier.localId, {
          remoteId,
          syncStatus: 'synced',
        });

        // 4. Upsert photo records with supplier_id
        for (const photo of photos) {
          if (photo.remotePath) {
            await upsertPhoto({
              local_id: photo.localId,
              supplier_id: remoteId,
              supplier_local_id: photo.supplierLocalId,
              tag: photo.tag,
              storage_path: photo.remotePath,
              ocr_result: photo.ocrResult,
              ocr_processed: photo.ocrProcessed,
              sync_status: 'synced',
            });
          }
        }

        // 5. Upsert voice note records with supplier_id
        for (const note of voiceNotes) {
          if (note.remotePath) {
            await upsertVoiceNote({
              local_id: note.localId,
              supplier_id: remoteId,
              supplier_local_id: note.supplierLocalId,
              storage_path: note.remotePath,
              duration_seconds: note.durationSeconds,
              transcription: note.transcription,
              structured_data: note.structuredData,
              ai_processed: note.aiProcessed,
              sync_status: 'synced',
            });
          }
        }

        // 6. Trigger AI processing for business card photos (OCR)
        // Skip if device went offline during sync
        if (isOnline && businessCardPhotos.length > 0) {
          for (const photo of businessCardPhotos) {
            try {
              const result = await callProcessCard(
                photo.localId,
                photo.remotePath,
                supplier.localId
              );
              if (result?.success && result.ocr_result) {
                await db.photos.update(photo.localId, {
                  ocrProcessed: true,
                  ocrResult: result.ocr_result,
                });
              }
            } catch (err) {
              console.error('OCR processing failed for photo:', photo.localId, err);
              addToast({
                type: 'warning',
                message: 'Business card OCR failed - will retry next sync',
              });
            }
          }
        }

        // 7. Trigger AI processing for voice notes
        // Skip if device went offline during sync
        if (isOnline && unprocessedVoiceNotes.length > 0) {
          for (const note of unprocessedVoiceNotes) {
            try {
              const result = await callProcessVoice(
                note.localId,
                note.transcription,
                supplier.localId
              );
              if (result?.success && result.structured_data) {
                await db.voiceNotes.update(note.localId, {
                  aiProcessed: true,
                  structuredData: result.structured_data,
                });
              }
            } catch (err) {
              console.error('Voice processing failed for note:', note.localId, err);
              addToast({
                type: 'warning',
                message: 'Voice note AI processing failed - will retry next sync',
              });
            }
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Sync error for supplier:', supplier.localId, error);
      await db.suppliers.update(supplier.localId, {
        syncStatus: 'error',
      });
      return false;
    }
  }, [isOnline, addToast]);

  // Sync all pending data and retry failed AI processing
  const syncAll = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || isSyncing) return;

    const pending = await getPendingSuppliers();
    const aiRetry = await getSuppliersWithPendingAI();

    // Deduplicate (a supplier could be both pending and needing AI retry)
    const seenIds = new Set<string>();
    const allToSync: LocalSupplier[] = [];
    for (const s of [...pending, ...aiRetry]) {
      if (!seenIds.has(s.localId)) {
        seenIds.add(s.localId);
        allToSync.push(s);
      }
    }

    if (allToSync.length === 0) return;

    setIsSyncing(true);

    let successCount = 0;
    let errorCount = 0;

    for (const supplier of allToSync) {
      const success = await syncSupplier(supplier);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsSyncing(false);
    setLastSyncAt(new Date().toISOString());
    await updatePendingCount();

    // Show toast
    if (successCount > 0 && errorCount === 0) {
      addToast({
        type: 'success',
        message: `Synced ${successCount} supplier${successCount > 1 ? 's' : ''}`,
      });
    } else if (errorCount > 0) {
      addToast({
        type: 'warning',
        message: `Synced ${successCount}, failed ${errorCount}`,
      });
    }
  }, [isSyncing, setIsSyncing, setLastSyncAt, updatePendingCount, syncSupplier, addToast]);

  // Schedule periodic sync when online
  useEffect(() => {
    if (isOnline) {
      // Clear any existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // If we just came back online, sync immediately
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        syncAll();
      }

      // Set up periodic sync
      const scheduleSync = () => {
        syncTimeoutRef.current = setTimeout(() => {
          syncAll();
          scheduleSync();
        }, SYNC_CONFIG.debounceMs);
      };

      scheduleSync();
    } else {
      wasOfflineRef.current = true;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, syncAll]);

  // Update pending count on mount and when sync completes
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  return {
    syncAll,
    syncSupplier,
    updatePendingCount,
  };
}

/**
 * Hook to get sync status values.
 */
export function useSyncStatus() {
  return useAppStore((state) => ({
    isOnline: state.isOnline,
    isSyncing: state.isSyncing,
    pendingSyncCount: state.pendingSyncCount,
    lastSyncAt: state.lastSyncAt,
  }));
}
