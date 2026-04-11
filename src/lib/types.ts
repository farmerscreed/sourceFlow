// ============================================================
// SOURCEFLOW TYPE DEFINITIONS
// ============================================================

// Enum types matching Supabase schema
export type SupplierCategory =
  | 'windows_doors'
  | 'cladding'
  | 'railings_metalwork'
  | 'roofing'
  | 'solar_panels'
  | 'solar_inverters'
  | 'solar_batteries'
  | 'smart_home'
  | 'cctv_security'
  | 'lighting'
  | 'electrical'
  | 'plumbing'
  | 'building_materials'
  | 'water_treatment'
  | 'fire_safety'
  | 'other';

export type SupplierStatus =
  | 'new'
  | 'reviewing'
  | 'shortlisted'
  | 'rejected'
  | 'ordered';

export type VerificationStatus =
  | 'unverified'
  | 'likely_manufacturer'
  | 'confirmed_manufacturer'
  | 'likely_trader'
  | 'confirmed_trader';

export type PhotoTag =
  | 'business_card'
  | 'product'
  | 'booth'
  | 'price_sheet'
  | 'catalogue'
  | 'factory'
  | 'other';

export type SyncStatus = 'pending' | 'synced' | 'error';

export type BOQPriority = 'order_now' | 'decide_now' | 'scout_only' | 'sample_only';

// ============================================================
// PRICING & CAPABILITIES SCHEMAS
// ============================================================

export interface PriceQuote {
  product: string;
  unitPrice: number;
  currency: string;
  unit: string;
  moq?: number;
  notes?: string;
}

export interface Pricing {
  quotes: PriceQuote[];
  paymentTerms?: string;
  leadTimeDays?: number;
  samplePolicy?: string;
  fobPort?: string;
}

export interface Capabilities {
  annualCapacity?: string;
  factoryLocation?: string;
  certifications?: string[];
  shipsToAfrica?: boolean;
  africaExperience?: boolean;
  hasTestingLab?: boolean;
  yearsInBusiness?: number;
  employeeCount?: string;
}

export interface BOQMatch {
  boqItemId: string;
  boqItemName: string;
  canSupply: boolean;
  quotedPrice?: number;
  quantityAvailable?: number;
}

// ============================================================
// OCR & VOICE PROCESSING SCHEMAS
// ============================================================

export interface OCRResult {
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  whatsapp?: string;
  address?: string;
  website?: string;
  title?: string;
  rawText?: string;
}

export interface VoiceStructuredData {
  pricesMentioned?: Array<{
    product: string;
    price: number;
    currency: string;
    unit: string;
  }>;
  moqMentioned?: number;
  leadTimeMentioned?: string;
  keySpecs?: string[];
  manufacturerSignals?: string[];
  traderSignals?: string[];
  notablePoints?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  summary?: string;
}

// ============================================================
// LOCAL (INDEXEDDB) MODELS
// ============================================================

export interface LocalSupplier {
  localId: string;
  remoteId?: string;

  // Basic info
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  wechat: string;
  whatsapp: string;
  website: string;

  // Fair info
  boothNumber: string;
  hallArea: string;
  fairPhase: number;
  dateVisited: string;

  // Classification
  categories: SupplierCategory[];
  primaryCategory: SupplierCategory | null;
  status: SupplierStatus;
  verification: VerificationStatus;
  rating: number;

  // Pricing & capabilities
  pricing: Pricing;
  capabilities: Capabilities;

  // Notes
  notes: string;
  aiSummary: string;
  redFlags: string;
  greenFlags: string;

  // Factory visit
  factoryVisitScheduled: boolean;
  factoryVisitDate: string | null;
  factoryVisitNotes: string;

  // Follow-up
  followUpRequired: boolean;
  followUpAction: string;
  followUpDone: boolean;

  // BOQ matching
  boqMatches: BOQMatch[];

  // Sync
  syncStatus: SyncStatus;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface LocalPhoto {
  localId: string;
  remoteId?: string;
  supplierLocalId: string;

  tag: PhotoTag;
  blob?: Blob;
  thumbnailBlob?: Blob;
  remotePath?: string;

  ocrResult: OCRResult;
  ocrProcessed: boolean;

  syncStatus: SyncStatus;
  createdAt: string;
}

export interface LocalVoiceNote {
  localId: string;
  remoteId?: string;
  supplierLocalId: string;

  blob?: Blob;
  durationSeconds: number;
  remotePath?: string;

  transcription: string;
  structuredData: VoiceStructuredData;
  aiProcessed: boolean;

  syncStatus: SyncStatus;
  createdAt: string;
}

export interface LocalBOQItem {
  id: string;
  name: string;
  category: SupplierCategory;
  description: string;

  quantity: number;
  unit: string;

  targetPriceLow: number | null;
  targetPriceHigh: number | null;
  priceUnit: string;

  priority: BOQPriority;
  fairPhase: number;
  notes: string;

  // Coverage tracking
  suppliersMatched: number;
  bestPrice: number | null;
  bestSupplierName: string;
}

// ============================================================
// CAPTURE FORM STATE
// ============================================================

export interface CaptureFormState {
  companyName: string;
  boothNumber: string;
  categories: SupplierCategory[];
  rating: number;
  photos: Array<{
    localId: string;
    blob: Blob;
    thumbnailBlob?: Blob;
    tag: PhotoTag;
  }>;
  voiceNotes: Array<{
    localId: string;
    blob: Blob;
    durationSeconds: number;
    transcription: string;
  }>;
}

// ============================================================
// FILTER & SORT OPTIONS
// ============================================================

export interface SupplierFilters {
  category: SupplierCategory | 'all';
  status: SupplierStatus | 'all';
  verification: VerificationStatus | 'all';
  search: string;
}

export type SortOption = 'rating' | 'date' | 'price' | 'name';
export type SortDirection = 'asc' | 'desc';

export interface SupplierSort {
  by: SortOption;
  direction: SortDirection;
}
