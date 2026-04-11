import type {
  SupplierCategory,
  SupplierStatus,
  VerificationStatus,
  PhotoTag,
  BOQPriority,
  LocalSupplier,
  Pricing,
  Capabilities,
} from './types';

// ============================================================
// CATEGORY DEFINITIONS
// ============================================================

export interface CategoryInfo {
  value: SupplierCategory;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { value: 'windows_doors', label: 'Windows & Doors', shortLabel: 'Windows', color: '#2563EB', bgColor: '#DBEAFE', icon: '🪟' },
  { value: 'cladding', label: 'Cladding', shortLabel: 'Cladding', color: '#7C3AED', bgColor: '#EDE9FE', icon: '🏗️' },
  { value: 'railings_metalwork', label: 'Railings & Metalwork', shortLabel: 'Rails', color: '#059669', bgColor: '#D1FAE5', icon: '🔩' },
  { value: 'roofing', label: 'Roofing', shortLabel: 'Roofing', color: '#DC2626', bgColor: '#FEE2E2', icon: '🏠' },
  { value: 'solar_panels', label: 'Solar Panels', shortLabel: 'Solar', color: '#EAB308', bgColor: '#FEF9C3', icon: '☀️' },
  { value: 'solar_inverters', label: 'Solar Inverters', shortLabel: 'Inverters', color: '#F59E0B', bgColor: '#FEF3C7', icon: '⚡' },
  { value: 'solar_batteries', label: 'Solar Batteries', shortLabel: 'Batteries', color: '#84CC16', bgColor: '#ECFCCB', icon: '🔋' },
  { value: 'smart_home', label: 'Smart Home', shortLabel: 'Smart', color: '#06B6D4', bgColor: '#CFFAFE', icon: '🏡' },
  { value: 'cctv_security', label: 'CCTV & Security', shortLabel: 'CCTV', color: '#6366F1', bgColor: '#E0E7FF', icon: '📹' },
  { value: 'lighting', label: 'Lighting', shortLabel: 'Lighting', color: '#F97316', bgColor: '#FFEDD5', icon: '💡' },
  { value: 'electrical', label: 'Electrical', shortLabel: 'Electrical', color: '#8B5CF6', bgColor: '#EDE9FE', icon: '🔌' },
  { value: 'plumbing', label: 'Plumbing', shortLabel: 'Plumbing', color: '#0EA5E9', bgColor: '#E0F2FE', icon: '🚿' },
  { value: 'building_materials', label: 'Building Materials', shortLabel: 'Materials', color: '#78716C', bgColor: '#F5F5F4', icon: '🧱' },
  { value: 'water_treatment', label: 'Water Treatment', shortLabel: 'Water', color: '#14B8A6', bgColor: '#CCFBF1', icon: '💧' },
  { value: 'fire_safety', label: 'Fire Safety', shortLabel: 'Fire', color: '#EF4444', bgColor: '#FEE2E2', icon: '🧯' },
  { value: 'other', label: 'Other', shortLabel: 'Other', color: '#94A3B8', bgColor: '#F1F5F9', icon: '📦' },
];

export const getCategoryInfo = (category: SupplierCategory): CategoryInfo => {
  return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
};

// ============================================================
// STATUS DEFINITIONS
// ============================================================

export interface StatusInfo {
  value: SupplierStatus;
  label: string;
  color: string;
  bgColor: string;
}

export const STATUSES: StatusInfo[] = [
  { value: 'new', label: 'New', color: '#64748B', bgColor: '#F1F5F9' },
  { value: 'reviewing', label: 'Reviewing', color: '#2563EB', bgColor: '#DBEAFE' },
  { value: 'shortlisted', label: 'Shortlisted', color: '#16A34A', bgColor: '#DCFCE7' },
  { value: 'rejected', label: 'Rejected', color: '#DC2626', bgColor: '#FEE2E2' },
  { value: 'ordered', label: 'Ordered', color: '#C8952E', bgColor: '#FEF3C7' },
];

export const getStatusInfo = (status: SupplierStatus): StatusInfo => {
  return STATUSES.find(s => s.value === status) || STATUSES[0];
};

// ============================================================
// VERIFICATION DEFINITIONS
// ============================================================

export interface VerificationInfo {
  value: VerificationStatus;
  label: string;
  shortLabel: string;
  color: string;
  icon: 'check' | 'x' | 'question';
}

export const VERIFICATIONS: VerificationInfo[] = [
  { value: 'unverified', label: 'Unverified', shortLabel: '?', color: '#94A3B8', icon: 'question' },
  { value: 'likely_manufacturer', label: 'Likely Manufacturer', shortLabel: 'Mfr?', color: '#16A34A', icon: 'check' },
  { value: 'confirmed_manufacturer', label: 'Confirmed Manufacturer', shortLabel: 'Mfr ✓', color: '#16A34A', icon: 'check' },
  { value: 'likely_trader', label: 'Likely Trader', shortLabel: 'Trader?', color: '#EAB308', icon: 'x' },
  { value: 'confirmed_trader', label: 'Confirmed Trader', shortLabel: 'Trader', color: '#DC2626', icon: 'x' },
];

export const getVerificationInfo = (verification: VerificationStatus): VerificationInfo => {
  return VERIFICATIONS.find(v => v.value === verification) || VERIFICATIONS[0];
};

// ============================================================
// PHOTO TAG DEFINITIONS
// ============================================================

export interface PhotoTagInfo {
  value: PhotoTag;
  label: string;
  icon: string;
}

export const PHOTO_TAGS: PhotoTagInfo[] = [
  { value: 'business_card', label: 'Business Card', icon: '💳' },
  { value: 'product', label: 'Product', icon: '📦' },
  { value: 'booth', label: 'Booth', icon: '🏪' },
  { value: 'price_sheet', label: 'Price Sheet', icon: '📋' },
  { value: 'catalogue', label: 'Catalogue', icon: '📖' },
  { value: 'factory', label: 'Factory', icon: '🏭' },
  { value: 'other', label: 'Other', icon: '📷' },
];

// ============================================================
// BOQ PRIORITY DEFINITIONS
// ============================================================

export interface BOQPriorityInfo {
  value: BOQPriority;
  label: string;
  color: string;
  bgColor: string;
}

export const BOQ_PRIORITIES: BOQPriorityInfo[] = [
  { value: 'order_now', label: 'Order Now', color: '#16A34A', bgColor: '#DCFCE7' },
  { value: 'decide_now', label: 'Decide Now', color: '#EAB308', bgColor: '#FEF9C3' },
  { value: 'scout_only', label: 'Scout Only', color: '#2563EB', bgColor: '#DBEAFE' },
  { value: 'sample_only', label: 'Sample Only', color: '#8B5CF6', bgColor: '#EDE9FE' },
];

// ============================================================
// DEFAULT VALUES
// ============================================================

export const DEFAULT_PRICING: Pricing = {
  quotes: [],
  paymentTerms: '',
  leadTimeDays: undefined,
  samplePolicy: '',
  fobPort: 'Guangzhou',
};

export const DEFAULT_CAPABILITIES: Capabilities = {
  annualCapacity: '',
  factoryLocation: '',
  certifications: [],
  shipsToAfrica: false,
  africaExperience: false,
  hasTestingLab: false,
  yearsInBusiness: undefined,
  employeeCount: '',
};

export const createDefaultSupplier = (localId: string): LocalSupplier => ({
  localId,
  remoteId: undefined,
  companyName: '',
  contactPerson: '',
  phone: '',
  email: '',
  wechat: '',
  whatsapp: '',
  website: '',
  boothNumber: '',
  hallArea: '',
  fairPhase: 1,
  dateVisited: new Date().toISOString().split('T')[0],
  categories: [],
  primaryCategory: null,
  status: 'new',
  verification: 'unverified',
  rating: 0,
  pricing: { ...DEFAULT_PRICING },
  capabilities: { ...DEFAULT_CAPABILITIES },
  notes: '',
  aiSummary: '',
  redFlags: '',
  greenFlags: '',
  factoryVisitScheduled: false,
  factoryVisitDate: null,
  factoryVisitNotes: '',
  followUpRequired: false,
  followUpAction: '',
  followUpDone: false,
  boqMatches: [],
  syncStatus: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ============================================================
// SYNC CONFIGURATION
// ============================================================

export const SYNC_CONFIG = {
  debounceMs: 30000, // 30 seconds
  maxRetries: 3,
  retryDelayMs: 5000,
};

// ============================================================
// IMAGE COMPRESSION CONFIGURATION
// ============================================================

export const IMAGE_CONFIG = {
  maxWidth: 1200,
  quality: 0.8,
  thumbnailMaxWidth: 200,
  thumbnailQuality: 0.6,
};

// ============================================================
// APP METADATA
// ============================================================

export const APP_CONFIG = {
  name: 'SourceFlow',
  description: 'Canton Fair Sourcing Companion',
  themeColor: '#1B3A5C',
  version: '1.0.0',
};

// ============================================================
// BOQ SEED DATA (Primerose Estate Requirements)
// ============================================================

import type { LocalBOQItem } from './types';

export const BOQ_SEED_DATA: LocalBOQItem[] = [
  // WINDOWS & DOORS - Order Now
  {
    id: 'boq-001',
    name: 'Aluminum Sliding Windows',
    category: 'windows_doors',
    description: 'Double-glazed aluminum sliding windows for all units',
    quantity: 2400,
    unit: 'sqm',
    targetPriceLow: 80,
    targetPriceHigh: 120,
    priceUnit: 'USD/sqm',
    priority: 'order_now',
    fairPhase: 1,
    notes: 'Must include screens, multiple sizes needed',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  {
    id: 'boq-002',
    name: 'Entry Doors (Steel/Security)',
    category: 'windows_doors',
    description: 'Security doors for main entrance of each unit',
    quantity: 120,
    unit: 'pcs',
    targetPriceLow: 150,
    targetPriceHigh: 250,
    priceUnit: 'USD/pc',
    priority: 'order_now',
    fairPhase: 1,
    notes: 'Fire-rated preferred, multiple designs',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  {
    id: 'boq-003',
    name: 'Interior Doors (WPC/Composite)',
    category: 'windows_doors',
    description: 'Interior doors for bedrooms and bathrooms',
    quantity: 600,
    unit: 'pcs',
    targetPriceLow: 40,
    targetPriceHigh: 80,
    priceUnit: 'USD/pc',
    priority: 'decide_now',
    fairPhase: 1,
    notes: 'Waterproof for bathroom doors',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  // CLADDING - Order Now
  {
    id: 'boq-004',
    name: 'Exterior Wall Cladding (ACP)',
    category: 'cladding',
    description: 'Aluminum composite panels for exterior walls',
    quantity: 5000,
    unit: 'sqm',
    targetPriceLow: 25,
    targetPriceHigh: 40,
    priceUnit: 'USD/sqm',
    priority: 'order_now',
    fairPhase: 1,
    notes: 'Fire-rated (A2 grade) required for some areas',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  // RAILINGS - Decide Now
  {
    id: 'boq-005',
    name: 'Balcony Railings (Glass)',
    category: 'railings_metalwork',
    description: 'Tempered glass railings with stainless steel posts',
    quantity: 800,
    unit: 'lm',
    targetPriceLow: 100,
    targetPriceHigh: 150,
    priceUnit: 'USD/lm',
    priority: 'decide_now',
    fairPhase: 1,
    notes: 'Must meet safety standards, 12mm tempered',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  {
    id: 'boq-006',
    name: 'Staircase Railings',
    category: 'railings_metalwork',
    description: 'Stainless steel railings for common staircases',
    quantity: 400,
    unit: 'lm',
    targetPriceLow: 60,
    targetPriceHigh: 100,
    priceUnit: 'USD/lm',
    priority: 'decide_now',
    fairPhase: 1,
    notes: '',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  // SOLAR - Order Now
  {
    id: 'boq-007',
    name: 'Solar Panels (550W)',
    category: 'solar_panels',
    description: 'Monocrystalline solar panels for rooftop installation',
    quantity: 300,
    unit: 'pcs',
    targetPriceLow: 100,
    targetPriceHigh: 140,
    priceUnit: 'USD/pc',
    priority: 'order_now',
    fairPhase: 1,
    notes: 'Tier 1 manufacturer preferred, warranty important',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  {
    id: 'boq-008',
    name: 'Hybrid Inverters (10kW)',
    category: 'solar_inverters',
    description: 'Hybrid inverters with battery charging capability',
    quantity: 30,
    unit: 'pcs',
    targetPriceLow: 1000,
    targetPriceHigh: 1500,
    priceUnit: 'USD/pc',
    priority: 'decide_now',
    fairPhase: 1,
    notes: 'Must support grid-tie and off-grid modes',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  {
    id: 'boq-009',
    name: 'Lithium Batteries (5kWh)',
    category: 'solar_batteries',
    description: 'Wall-mounted lithium battery storage units',
    quantity: 60,
    unit: 'pcs',
    targetPriceLow: 800,
    targetPriceHigh: 1200,
    priceUnit: 'USD/pc',
    priority: 'scout_only',
    fairPhase: 2,
    notes: 'LiFePO4 preferred for safety',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  // SMART HOME
  {
    id: 'boq-010',
    name: 'Smart Switches',
    category: 'smart_home',
    description: 'WiFi-enabled smart light switches',
    quantity: 500,
    unit: 'pcs',
    targetPriceLow: 8,
    targetPriceHigh: 15,
    priceUnit: 'USD/pc',
    priority: 'scout_only',
    fairPhase: 2,
    notes: 'Must work with common protocols (Tuya, Matter)',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  // CCTV & SECURITY
  {
    id: 'boq-011',
    name: 'IP Cameras (4MP)',
    category: 'cctv_security',
    description: 'Outdoor IP cameras for perimeter security',
    quantity: 100,
    unit: 'pcs',
    targetPriceLow: 30,
    targetPriceHigh: 60,
    priceUnit: 'USD/pc',
    priority: 'decide_now',
    fairPhase: 1,
    notes: 'POE, night vision, weatherproof',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  {
    id: 'boq-012',
    name: 'NVR (32 Channel)',
    category: 'cctv_security',
    description: 'Network video recorders for camera system',
    quantity: 4,
    unit: 'pcs',
    targetPriceLow: 300,
    targetPriceHigh: 500,
    priceUnit: 'USD/pc',
    priority: 'decide_now',
    fairPhase: 1,
    notes: 'H.265 compression, RAID support',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  // LIGHTING
  {
    id: 'boq-013',
    name: 'LED Downlights (12W)',
    category: 'lighting',
    description: 'Recessed LED downlights for interior',
    quantity: 2000,
    unit: 'pcs',
    targetPriceLow: 3,
    targetPriceHigh: 8,
    priceUnit: 'USD/pc',
    priority: 'order_now',
    fairPhase: 1,
    notes: 'Warm white 3000K, dimmable preferred',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  {
    id: 'boq-014',
    name: 'Solar Street Lights',
    category: 'lighting',
    description: 'All-in-one solar street lights for estate roads',
    quantity: 50,
    unit: 'pcs',
    targetPriceLow: 150,
    targetPriceHigh: 300,
    priceUnit: 'USD/pc',
    priority: 'decide_now',
    fairPhase: 1,
    notes: 'Motion sensor, dusk-to-dawn',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  // WATER TREATMENT
  {
    id: 'boq-015',
    name: 'Water Treatment Plant',
    category: 'water_treatment',
    description: 'Complete water treatment system for estate',
    quantity: 1,
    unit: 'set',
    targetPriceLow: 15000,
    targetPriceHigh: 30000,
    priceUnit: 'USD/set',
    priority: 'scout_only',
    fairPhase: 2,
    notes: 'Capacity: 50,000 liters/day',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
  // FIRE SAFETY
  {
    id: 'boq-016',
    name: 'Fire Extinguishers',
    category: 'fire_safety',
    description: 'ABC dry powder fire extinguishers',
    quantity: 200,
    unit: 'pcs',
    targetPriceLow: 15,
    targetPriceHigh: 30,
    priceUnit: 'USD/pc',
    priority: 'sample_only',
    fairPhase: 2,
    notes: '6kg capacity',
    suppliersMatched: 0,
    bestPrice: null,
    bestSupplierName: '',
  },
];
