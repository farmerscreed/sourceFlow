import Dexie, { Table } from 'dexie';
import type {
  LocalSupplier,
  LocalPhoto,
  LocalVoiceNote,
  LocalBOQItem,
} from './types';
import { BOQ_SEED_DATA } from './constants';

// ============================================================
// SOURCEFLOW INDEXEDDB DATABASE
// ============================================================

class SourceFlowDB extends Dexie {
  suppliers!: Table<LocalSupplier, string>;
  photos!: Table<LocalPhoto, string>;
  voiceNotes!: Table<LocalVoiceNote, string>;
  boqItems!: Table<LocalBOQItem, string>;

  constructor() {
    super('sourceflow');

    this.version(1).stores({
      // Primary key is localId, indexed fields follow
      suppliers: 'localId, remoteId, status, rating, syncStatus, *categories, primaryCategory, createdAt, updatedAt',
      photos: 'localId, remoteId, supplierLocalId, tag, syncStatus, createdAt',
      voiceNotes: 'localId, remoteId, supplierLocalId, syncStatus, createdAt',
      boqItems: 'id, category, priority, name',
    });
  }
}

// Singleton database instance
export const db = new SourceFlowDB();

// ============================================================
// SUPPLIER HELPERS
// ============================================================

export async function getSupplierByLocalId(localId: string): Promise<LocalSupplier | undefined> {
  return db.suppliers.get(localId);
}

export async function getAllSuppliers(): Promise<LocalSupplier[]> {
  return db.suppliers.orderBy('createdAt').reverse().toArray();
}

export async function getPendingSuppliers(): Promise<LocalSupplier[]> {
  return db.suppliers.where('syncStatus').equals('pending').toArray();
}

export async function getSuppliersWithPendingAI(): Promise<LocalSupplier[]> {
  // Find synced suppliers that still have unprocessed AI items
  const photosNeedingOCR = await db.photos
    .filter(p => p.syncStatus === 'synced' && p.tag === 'business_card' && !p.ocrProcessed && !!p.remotePath)
    .toArray();
  const notesNeedingAI = await db.voiceNotes
    .filter(n => n.syncStatus === 'synced' && !n.aiProcessed && !!n.transcription && !!n.remotePath)
    .toArray();

  const supplierIds = new Set([
    ...photosNeedingOCR.map(p => p.supplierLocalId),
    ...notesNeedingAI.map(n => n.supplierLocalId),
  ]);

  if (supplierIds.size === 0) return [];

  return db.suppliers
    .filter(s => s.syncStatus === 'synced' && supplierIds.has(s.localId))
    .toArray();
}

export async function getSuppliersByCategory(category: string): Promise<LocalSupplier[]> {
  return db.suppliers
    .filter(s => s.categories.includes(category as LocalSupplier['categories'][number]))
    .toArray();
}

export async function getSuppliersByStatus(status: string): Promise<LocalSupplier[]> {
  return db.suppliers.where('status').equals(status).toArray();
}

export async function saveSupplier(supplier: LocalSupplier): Promise<string> {
  supplier.updatedAt = new Date().toISOString();
  await db.suppliers.put(supplier);
  return supplier.localId;
}

export async function updateSupplierField<K extends keyof LocalSupplier>(
  localId: string,
  field: K,
  value: LocalSupplier[K]
): Promise<void> {
  const update: Partial<LocalSupplier> = {
    [field]: value,
    updatedAt: new Date().toISOString(),
    syncStatus: 'pending' as const,
  };
  await db.suppliers.update(localId, update);
}

export async function deleteSupplier(localId: string): Promise<void> {
  await db.transaction('rw', [db.suppliers, db.photos, db.voiceNotes], async () => {
    // Delete related photos and voice notes first
    await db.photos.where('supplierLocalId').equals(localId).delete();
    await db.voiceNotes.where('supplierLocalId').equals(localId).delete();
    // Delete the supplier
    await db.suppliers.delete(localId);
  });
}

// ============================================================
// PHOTO HELPERS
// ============================================================

export async function getPhotosBySupplier(supplierLocalId: string): Promise<LocalPhoto[]> {
  return db.photos.where('supplierLocalId').equals(supplierLocalId).toArray();
}

export async function getBusinessCardPhoto(supplierLocalId: string): Promise<LocalPhoto | undefined> {
  return db.photos
    .where('supplierLocalId')
    .equals(supplierLocalId)
    .filter(p => p.tag === 'business_card')
    .first();
}

export async function getPendingPhotos(): Promise<LocalPhoto[]> {
  return db.photos.where('syncStatus').equals('pending').toArray();
}

export async function savePhoto(photo: LocalPhoto): Promise<string> {
  await db.photos.put(photo);
  return photo.localId;
}

export async function deletePhoto(localId: string): Promise<void> {
  await db.photos.delete(localId);
}

// ============================================================
// VOICE NOTE HELPERS
// ============================================================

export async function getVoiceNotesBySupplier(supplierLocalId: string): Promise<LocalVoiceNote[]> {
  return db.voiceNotes.where('supplierLocalId').equals(supplierLocalId).toArray();
}

export async function getPendingVoiceNotes(): Promise<LocalVoiceNote[]> {
  return db.voiceNotes.where('syncStatus').equals('pending').toArray();
}

export async function saveVoiceNote(voiceNote: LocalVoiceNote): Promise<string> {
  await db.voiceNotes.put(voiceNote);
  return voiceNote.localId;
}

export async function deleteVoiceNote(localId: string): Promise<void> {
  await db.voiceNotes.delete(localId);
}

// ============================================================
// BOQ HELPERS
// ============================================================

export async function getAllBOQItems(): Promise<LocalBOQItem[]> {
  return db.boqItems.toArray();
}

export async function getBOQItemsByPriority(priority: string): Promise<LocalBOQItem[]> {
  return db.boqItems.where('priority').equals(priority).toArray();
}

export async function getBOQItemsByCategory(category: string): Promise<LocalBOQItem[]> {
  return db.boqItems.where('category').equals(category).toArray();
}

export async function saveBOQItem(item: LocalBOQItem): Promise<string> {
  await db.boqItems.put(item);
  return item.id;
}

export async function updateBOQCoverage(
  itemId: string,
  suppliersMatched: number,
  bestPrice: number | null,
  bestSupplierName: string
): Promise<void> {
  await db.boqItems.update(itemId, {
    suppliersMatched,
    bestPrice,
    bestSupplierName,
  });
}

// ============================================================
// STATS HELPERS
// ============================================================

export async function getSupplierStats(): Promise<{
  total: number;
  today: number;
  shortlisted: number;
  pendingSync: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}> {
  const suppliers = await getAllSuppliers();
  const today = new Date().toISOString().split('T')[0];

  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  suppliers.forEach(s => {
    // Count by primary category
    if (s.primaryCategory) {
      byCategory[s.primaryCategory] = (byCategory[s.primaryCategory] || 0) + 1;
    }
    // Count by status
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  });

  return {
    total: suppliers.length,
    today: suppliers.filter(s => s.createdAt.startsWith(today)).length,
    shortlisted: suppliers.filter(s => s.status === 'shortlisted').length,
    pendingSync: suppliers.filter(s => s.syncStatus === 'pending').length,
    byCategory,
    byStatus,
  };
}

// ============================================================
// BOQ SEEDING (run on first load)
// ============================================================

export async function seedBOQItems(): Promise<void> {
  const existingCount = await db.boqItems.count();
  if (existingCount === 0) {
    await db.boqItems.bulkAdd(BOQ_SEED_DATA);
    console.log('BOQ items seeded:', BOQ_SEED_DATA.length);
  }
}

// ============================================================
// CLEAR ALL DATA (for testing/reset)
// ============================================================

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.suppliers, db.photos, db.voiceNotes, db.boqItems], async () => {
    await db.suppliers.clear();
    await db.photos.clear();
    await db.voiceNotes.clear();
    await db.boqItems.clear();
  });
}
