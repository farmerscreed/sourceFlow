# SOURCEFLOW — Canton Fair Sourcing Companion

## Implementation PRD v1.0

**Product Owner:** Lawrence B. Okpokiri (LawOne Cloud LLC)
**Target User:** Law (solo user, mobile-first, at Canton Fair April 15–27, 2026)
**Ship Deadline:** April 14, 2026 (1 day before Canton Fair Phase 1 opens)

---

## TABLE OF CONTENTS

1. Product Overview
2. Technical Architecture
3. Data Model (Supabase)
4. Phase 1: Foundation + Quick Capture
5. Phase 2: Supplier Management + Review
6. Phase 3: AI Layer (OCR + Voice Processing)
7. Phase 4: Compare + BOQ Matcher
8. Phase 5: Export + Polish
9. UI/UX Specifications
10. Offline Strategy
11. Deployment
12. Pre-loaded Data
13. Implementation Notes

---

## 1. PRODUCT OVERVIEW

### What is SourceFlow?

A mobile-first Progressive Web App (PWA) for capturing, organizing, comparing, and analyzing supplier data collected at trade fairs. Built specifically for the Primerose Estate procurement trip to Canton Fair 2026.

### Core User Story

"I'm standing at a supplier's booth at Canton Fair. I need to capture their details in under 60 seconds — snap their business card, take product photos, record a voice note with pricing and specs — then move to the next booth. At the hotel each evening, I need to review everyone I met, compare suppliers side-by-side, and see which ones match my project requirements."

### Design Principles

1. **60-second capture** — logging a new supplier must take under 1 minute at the booth
2. **Offline-first** — Canton Fair halls have unreliable connectivity; capture must work with zero network
3. **Mobile-only** — designed for phone use (OnePlus Open, 7.82" unfolded); no desktop layout needed
4. **AI-augmented, not AI-dependent** — AI enhances data (OCR, transcription) but the app is fully functional without it; AI processing happens async when online
5. **Single user** — no auth complexity; one user, one project

---

## 2. TECHNICAL ARCHITECTURE

### Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14+ (App Router) | PWA with service worker |
| UI Framework | Tailwind CSS + shadcn/ui | Mobile-first components |
| State Management | Zustand | Lightweight, supports offline state |
| Local Storage | IndexedDB (via Dexie.js) | Offline data + image/audio blob storage |
| Backend | Supabase | Postgres DB + Storage buckets + Edge Functions |
| AI | Claude API (claude-sonnet-4-20250514) | Business card OCR, voice note structuring, comparison queries |
| Audio Recording | MediaRecorder API | Browser-native voice recording |
| Camera | HTML5 `<input type="file" capture>` | Native camera access on mobile |
| Hosting | Vercel | Auto-deploy from GitHub |

### Architecture Diagram

```
┌─────────────────────────────────────────────┐
│                  PHONE (PWA)                 │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Camera  │  │ Mic/Rec  │  │  UI/App   │  │
│  └────┬────┘  └────┬─────┘  └─────┬─────┘  │
│       │            │              │         │
│  ┌────▼────────────▼──────────────▼──────┐  │
│  │         Zustand Store + Dexie         │  │
│  │     (IndexedDB — offline-first)       │  │
│  └───────────────┬───────────────────────┘  │
│                  │                          │
│          ┌───────▼────────┐                 │
│          │  Sync Engine   │                 │
│          │ (when online)  │                 │
│          └───────┬────────┘                 │
└──────────────────┼──────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │     SUPABASE       │
         │                    │
         │  ┌──────────────┐  │
         │  │   Postgres   │  │
         │  │  (suppliers, │  │
         │  │  photos,     │  │
         │  │  voice_notes,│  │
         │  │  boq_items)  │  │
         │  └──────────────┘  │
         │                    │
         │  ┌──────────────┐  │
         │  │   Storage    │  │
         │  │  (images,    │  │
         │  │   audio)     │  │
         │  └──────────────┘  │
         │                    │
         │  ┌──────────────┐  │
         │  │Edge Functions│  │
         │  │ (AI proxy)   │  │
         │  └──────┬───────┘  │
         └─────────┼──────────┘
                   │
         ┌─────────▼──────────┐
         │    CLAUDE API      │
         │  (OCR, transcribe, │
         │   structure, query) │
         └────────────────────┘
```

### File Structure

```
sourceflow/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   ├── icons/                 # App icons (192, 512)
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout + PWA meta tags
│   │   ├── page.tsx           # Dashboard (home)
│   │   ├── capture/
│   │   │   └── page.tsx       # Quick Capture screen
│   │   ├── suppliers/
│   │   │   ├── page.tsx       # Supplier list (filterable)
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Supplier detail
│   │   ├── compare/
│   │   │   └── page.tsx       # Side-by-side comparison
│   │   ├── boq/
│   │   │   └── page.tsx       # BOQ matcher
│   │   └── export/
│   │       └── page.tsx       # Export & share
│   ├── components/
│   │   ├── ui/                # shadcn components
│   │   ├── BottomNav.tsx      # Fixed bottom navigation
│   │   ├── SupplierCard.tsx   # List item component
│   │   ├── CategoryBadge.tsx  # Category pill/badge
│   │   ├── RatingStars.tsx    # 1-5 star rating
│   │   ├── StatusBadge.tsx    # Manufacturer/Trader badge
│   │   ├── VoiceRecorder.tsx  # Audio recording component
│   │   ├── PhotoCapture.tsx   # Camera/photo component
│   │   ├── CompareTable.tsx   # Comparison grid
│   │   ├── BOQCoverage.tsx    # BOQ coverage visualization
│   │   ├── SyncIndicator.tsx  # Online/offline + sync status
│   │   └── QuickActions.tsx   # FAB / action buttons
│   ├── lib/
│   │   ├── db.ts              # Dexie (IndexedDB) schema + helpers
│   │   ├── supabase.ts        # Supabase client
│   │   ├── sync.ts            # Offline → Supabase sync engine
│   │   ├── ai.ts              # Claude API helpers (OCR, transcribe, query)
│   │   ├── store.ts           # Zustand store
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── constants.ts       # Categories, BOQ data, config
│   │   └── utils.ts           # Helpers (format, sort, filter)
│   └── hooks/
│       ├── useOnlineStatus.ts # Network detection
│       ├── useSync.ts         # Sync trigger hook
│       └── useAI.ts           # AI processing hook
├── supabase/
│   ├── migrations/
│   │   └── 001_initial.sql    # Full schema
│   └── functions/
│       ├── process-card/      # Business card OCR edge function
│       ├── process-voice/     # Voice note structuring edge function
│       └── ai-query/          # Natural language query edge function
├── next.config.js
├── tailwind.config.js
├── package.json
└── .env.local                 # SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
```

---

## 3. DATA MODEL (SUPABASE)

### Migration SQL: `001_initial.sql`

```sql
-- ============================================================
-- SOURCEFLOW DATA MODEL
-- ============================================================

-- ENUM types
CREATE TYPE supplier_category AS ENUM (
  'windows_doors',
  'cladding',
  'railings_metalwork',
  'roofing',
  'solar_panels',
  'solar_inverters',
  'solar_batteries',
  'smart_home',
  'cctv_security',
  'lighting',
  'electrical',
  'plumbing',
  'building_materials',
  'water_treatment',
  'fire_safety',
  'other'
);

CREATE TYPE supplier_status AS ENUM (
  'new',
  'reviewing',
  'shortlisted',
  'rejected',
  'ordered'
);

CREATE TYPE verification_status AS ENUM (
  'unverified',
  'likely_manufacturer',
  'confirmed_manufacturer',
  'likely_trader',
  'confirmed_trader'
);

CREATE TYPE photo_tag AS ENUM (
  'business_card',
  'product',
  'booth',
  'price_sheet',
  'catalogue',
  'factory',
  'other'
);

CREATE TYPE sync_status AS ENUM (
  'pending',
  'synced',
  'error'
);

-- ============================================================
-- SUPPLIERS (core table)
-- ============================================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id TEXT UNIQUE NOT NULL,           -- Client-generated ID for offline-first
  
  -- Basic info
  company_name TEXT NOT NULL DEFAULT '',
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  wechat TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  website TEXT DEFAULT '',
  
  -- Fair info
  booth_number TEXT DEFAULT '',
  hall_area TEXT DEFAULT '',                -- e.g. 'Area C', 'Hall 12.2'
  fair_phase INTEGER DEFAULT 1,            -- 1 or 2
  date_visited DATE DEFAULT CURRENT_DATE,
  
  -- Classification
  categories supplier_category[] NOT NULL DEFAULT '{}',  -- Can have multiple
  primary_category supplier_category,
  status supplier_status NOT NULL DEFAULT 'new',
  verification verification_status NOT NULL DEFAULT 'unverified',
  rating INTEGER CHECK (rating >= 0 AND rating <= 5) DEFAULT 0,
  
  -- Pricing & terms
  pricing JSONB DEFAULT '{}',
  /*
    pricing schema:
    {
      "quotes": [
        {
          "product": "W1 Casement Window 1200x2100",
          "unit_price": 24.00,
          "currency": "USD",
          "unit": "per piece",
          "moq": 500,
          "notes": "1.4mm profile, double glazed"
        }
      ],
      "payment_terms": "30/70 T/T",
      "lead_time_days": 45,
      "sample_policy": "paid, $5/unit",
      "fob_port": "Guangzhou"
    }
  */
  
  -- Capabilities
  capabilities JSONB DEFAULT '{}',
  /*
    capabilities schema:
    {
      "annual_capacity": "2GW",
      "factory_location": "Foshan, Guangdong",
      "certifications": ["IEC 61215", "ISO 9001", "CE"],
      "ships_to_africa": true,
      "africa_experience": true,
      "has_testing_lab": true,
      "years_in_business": 12,
      "employee_count": "200-500"
    }
  */
  
  -- Notes
  notes TEXT DEFAULT '',
  ai_summary TEXT DEFAULT '',              -- AI-generated summary from voice notes
  red_flags TEXT DEFAULT '',
  green_flags TEXT DEFAULT '',
  
  -- Factory visit
  factory_visit_scheduled BOOLEAN DEFAULT FALSE,
  factory_visit_date DATE,
  factory_visit_notes TEXT DEFAULT '',
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_action TEXT DEFAULT '',
  follow_up_done BOOLEAN DEFAULT FALSE,
  
  -- BOQ matching
  boq_matches JSONB DEFAULT '[]',
  /*
    boq_matches schema:
    [
      {
        "boq_item_id": "uuid",
        "boq_item_name": "W1 Casement Windows",
        "can_supply": true,
        "quoted_price": 24.00,
        "quantity_available": 10000
      }
    ]
  */
  
  -- Sync
  sync_status sync_status NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PHOTOS
-- ============================================================
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_local_id TEXT NOT NULL,          -- For offline linking
  
  tag photo_tag NOT NULL DEFAULT 'other',
  storage_path TEXT DEFAULT '',             -- Supabase storage path
  local_blob_key TEXT DEFAULT '',           -- IndexedDB blob key (offline)
  thumbnail_path TEXT DEFAULT '',
  
  -- OCR results (for business cards)
  ocr_result JSONB DEFAULT '{}',
  /*
    ocr_result schema (for business_card tag):
    {
      "company_name": "Foshan Aluminium Co.",
      "contact_person": "Zhang Wei",
      "phone": "+86 13812345678",
      "email": "zhang@foshanalum.com",
      "wechat": "zhangwei_fsa",
      "address": "No. 88 Nanhai Rd, Foshan",
      "raw_text": "..."
    }
  */
  
  ocr_processed BOOLEAN DEFAULT FALSE,
  sync_status sync_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VOICE NOTES
-- ============================================================
CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_local_id TEXT NOT NULL,
  
  storage_path TEXT DEFAULT '',
  local_blob_key TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 0,
  
  -- AI processing
  transcription TEXT DEFAULT '',
  structured_data JSONB DEFAULT '{}',
  /*
    structured_data schema:
    {
      "prices_mentioned": [
        { "product": "casement window", "price": 24, "currency": "USD", "unit": "per piece" }
      ],
      "moq_mentioned": 500,
      "lead_time_mentioned": "45 days",
      "key_specs": ["1.4mm profile", "double glazed", "powder coated"],
      "manufacturer_signals": ["has own factory", "showed production line"],
      "trader_signals": [],
      "notable_points": ["invited to factory visit April 21", "ships to Lagos regularly"],
      "sentiment": "positive"
    }
  */
  
  ai_processed BOOLEAN DEFAULT FALSE,
  sync_status sync_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOQ ITEMS (pre-loaded Primerose requirements)
-- ============================================================
CREATE TABLE boq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  category supplier_category NOT NULL,
  description TEXT DEFAULT '',
  
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'units',       -- 'units', 'linear_metres', 'sqm', 'kWh', 'sets'
  
  target_price_low DECIMAL(10,2),
  target_price_high DECIMAL(10,2),
  price_unit TEXT DEFAULT 'per unit',       -- 'per unit', 'per watt', 'per kWh', 'per sqm'
  
  priority TEXT NOT NULL DEFAULT 'order_now',  -- 'order_now', 'decide_now', 'scout_only', 'sample_only'
  fair_phase INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  
  -- Coverage tracking
  suppliers_matched INTEGER DEFAULT 0,
  best_price DECIMAL(10,2),
  best_supplier_name TEXT DEFAULT '',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI CHAT LOG (for query history)
-- ============================================================
CREATE TABLE ai_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context_supplier_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_suppliers_category ON suppliers USING GIN(categories);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_rating ON suppliers(rating DESC);
CREATE INDEX idx_suppliers_sync ON suppliers(sync_status);
CREATE INDEX idx_suppliers_local ON suppliers(local_id);
CREATE INDEX idx_photos_supplier ON photos(supplier_id);
CREATE INDEX idx_photos_supplier_local ON photos(supplier_local_id);
CREATE INDEX idx_photos_tag ON photos(tag);
CREATE INDEX idx_voice_notes_supplier ON voice_notes(supplier_id);
CREATE INDEX idx_boq_category ON boq_items(category);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER suppliers_updated
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Create via Supabase dashboard or CLI:
-- Bucket: 'photos' (public read, authenticated write)
-- Bucket: 'voice-notes' (private, authenticated read/write)

-- ============================================================
-- RLS POLICIES (disable for single user, or use anon key)
-- ============================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;

-- Allow all operations with anon key (single user app)
CREATE POLICY "Allow all" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON voice_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON boq_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON ai_queries FOR ALL USING (true) WITH CHECK (true);
```

### Dexie (IndexedDB) Schema: `lib/db.ts`

The local IndexedDB mirrors the Supabase schema but also stores image and audio blobs for offline access.

```typescript
import Dexie, { Table } from 'dexie';

interface LocalSupplier {
  localId: string;           // UUID generated client-side
  remoteId?: string;         // Supabase UUID after sync
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  wechat: string;
  whatsapp: string;
  website: string;
  boothNumber: string;
  hallArea: string;
  fairPhase: number;
  dateVisited: string;
  categories: string[];
  primaryCategory: string;
  status: string;
  verification: string;
  rating: number;
  pricing: object;
  capabilities: object;
  notes: string;
  aiSummary: string;
  redFlags: string;
  greenFlags: string;
  factoryVisitScheduled: boolean;
  factoryVisitDate: string | null;
  factoryVisitNotes: string;
  followUpRequired: boolean;
  followUpAction: string;
  followUpDone: boolean;
  boqMatches: object[];
  syncStatus: 'pending' | 'synced' | 'error';
  createdAt: string;
  updatedAt: string;
}

interface LocalPhoto {
  localId: string;
  remoteId?: string;
  supplierLocalId: string;
  tag: string;
  blob?: Blob;              // Actual image data stored in IndexedDB
  thumbnailBlob?: Blob;
  remotePath?: string;
  ocrResult: object;
  ocrProcessed: boolean;
  syncStatus: 'pending' | 'synced' | 'error';
  createdAt: string;
}

interface LocalVoiceNote {
  localId: string;
  remoteId?: string;
  supplierLocalId: string;
  blob?: Blob;              // Actual audio data stored in IndexedDB
  durationSeconds: number;
  remotePath?: string;
  transcription: string;
  structuredData: object;
  aiProcessed: boolean;
  syncStatus: 'pending' | 'synced' | 'error';
  createdAt: string;
}

interface LocalBOQItem {
  id: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  targetPriceLow: number;
  targetPriceHigh: number;
  priceUnit: string;
  priority: string;
  fairPhase: number;
  notes: string;
  suppliersMatched: number;
  bestPrice: number | null;
  bestSupplierName: string;
}

class SourceFlowDB extends Dexie {
  suppliers!: Table<LocalSupplier, string>;
  photos!: Table<LocalPhoto, string>;
  voiceNotes!: Table<LocalVoiceNote, string>;
  boqItems!: Table<LocalBOQItem, string>;

  constructor() {
    super('sourceflow');
    this.version(1).stores({
      suppliers: 'localId, remoteId, status, rating, syncStatus, *categories',
      photos: 'localId, remoteId, supplierLocalId, tag, syncStatus',
      voiceNotes: 'localId, remoteId, supplierLocalId, syncStatus',
      boqItems: 'id, category, priority'
    });
  }
}

export const db = new SourceFlowDB();
```

---

## 4. PHASE 1: FOUNDATION + QUICK CAPTURE

**Goal:** A working PWA that installs on the phone, lets the user create a new supplier in under 60 seconds with photos and voice notes, and stores everything locally.

**This phase is the MVP. If nothing else ships, this phase alone makes the trip viable.**

### Tasks

1. **Scaffold Next.js project** with App Router, Tailwind, shadcn/ui
2. **PWA configuration:**
   - `manifest.json` with app name "SourceFlow", theme color `#1B3A5C`, display: standalone
   - Service worker for offline caching (cache app shell + static assets)
   - Add to Home Screen support
   - Viewport meta for mobile: `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`
3. **Dexie IndexedDB setup** with schema from above
4. **Bottom navigation bar** (fixed, 5 tabs): Dashboard, Capture (+), Suppliers, Compare, More
5. **Quick Capture screen** (`/capture`):

#### Quick Capture Flow (this is the most critical screen)

```
┌──────────────────────────────────┐
│  ← Back              New Supplier │
├──────────────────────────────────┤
│                                  │
│  ┌──────────┐  ┌──────────────┐  │
│  │ 📷 CARD  │  │ 📷 PRODUCTS  │  │
│  │ (tap to  │  │ (tap to add  │  │
│  │  scan)   │  │   photos)    │  │
│  └──────────┘  └──────────────┘  │
│                                  │
│  ┌──────────────────────────────┐│
│  │ 🏢 Company ________________ ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ 📍 Booth # ________________ ││
│  └──────────────────────────────┘│
│                                  │
│  Category (tap to select):       │
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │Windows │ │Cladding│ │Solar │ │
│  │& Doors │ │        │ │      │ │
│  └────────┘ └────────┘ └──────┘ │
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │Smart   │ │ CCTV   │ │Rails │ │
│  │ Home   │ │        │ │      │ │
│  └────────┘ └────────┘ └──────┘ │
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │Lighting│ │Roofing │ │Other │ │
│  └────────┘ └────────┘ └──────┘ │
│                                  │
│  ┌──────────────────────────────┐│
│  │  🎤 HOLD TO RECORD VOICE    ││
│  │     NOTE (pricing, specs,   ││
│  │     impressions)            ││
│  └──────────────────────────────┘│
│                                  │
│  Rating: ☆ ☆ ☆ ☆ ☆              │
│                                  │
│  ┌──────────────────────────────┐│
│  │  💾 SAVE SUPPLIER            ││
│  └──────────────────────────────┘│
│                                  │
└──────────────────────────────────┘
```

#### Quick Capture Behaviour Specification:

- **Business Card Photo:** Tapping opens native camera. Photo saved as blob in IndexedDB, tagged as `business_card`. If online, queued for AI OCR. If OCR results come back, auto-populate company name, contact, phone, email, wechat fields (user can edit/override).
- **Product Photos:** Opens native camera. Multiple photos allowed (tap again to add more). Each saved as blob, tagged as `product`. Show thumbnail strip of captured photos.
- **Company Name:** Text input. Pre-filled from OCR if available. If user types here manually, it takes precedence over OCR.
- **Booth Number:** Text input. Free text (e.g. "C12", "Hall 12.2 F35").
- **Category:** Multi-select pill buttons. User can tap multiple (e.g. a supplier does both Windows and Railings). First tapped = primary category. Highlighted when selected. Categories: Windows & Doors, Cladding, Railings & Metalwork, Roofing, Solar Panels, Solar Inverters, Solar Batteries, Smart Home, CCTV & Security, Lighting, Electrical, Building Materials, Other.
- **Voice Note:** Press-and-hold to record (or tap to start/stop). Uses MediaRecorder API. Show recording duration timer while recording. Save as audio blob in IndexedDB. Multiple voice notes per supplier allowed. Each voice note queued for AI transcription + structuring when online.
- **Rating:** Tap 1–5 stars. Initial impression rating. Can be changed later.
- **Save:** Creates a `LocalSupplier` record in IndexedDB with `syncStatus: 'pending'`. Shows success toast. Returns to Dashboard or offers "Add Another" button for rapid-fire booth logging.

#### What happens on Save:

1. Generate UUID for `localId`
2. Create supplier record in Dexie (IndexedDB)
3. Link all photos and voice notes via `supplierLocalId`
4. If online → trigger sync immediately (upload to Supabase + trigger AI processing)
5. If offline → record stays in IndexedDB with `syncStatus: 'pending'`; sync happens when connectivity returns
6. Show toast: "Supplier saved ✓" with booth number

### Dashboard Screen (`/`)

```
┌──────────────────────────────────┐
│  SOURCEFLOW          🔄 ● Online │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────────┐│
│  │  Suppliers: 23    Today: 7   ││
│  │  Shortlisted: 5  Pending: 3 ││
│  └──────────────────────────────┘│
│                                  │
│  Categories:                     │
│  ┌───────────────┐ ┌───────────┐│
│  │ Windows: 8    │ │ Cladding: 3││
│  └───────────────┘ └───────────┘│
│  ┌───────────────┐ ┌───────────┐│
│  │ Solar: 4      │ │ Smart: 3  ││
│  └───────────────┘ └───────────┘│
│  ┌───────────────┐ ┌───────────┐│
│  │ CCTV: 2       │ │ Other: 3  ││
│  └───────────────┘ └───────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │  ➕ CAPTURE NEW SUPPLIER     ││
│  └──────────────────────────────┘│
│                                  │
│  Recent:                         │
│  ┌──────────────────────────────┐│
│  │ Foshan Aluminium Co.  ★★★★☆ ││
│  │ Windows & Doors  •  C12     ││
│  │ $24/unit  •  Manufacturer ✓ ││
│  ├──────────────────────────────┤│
│  │ Shenzhen Solar Tech   ★★★☆☆ ││
│  │ Solar Panels  •  C45        ││
│  │ $0.19/W  •  Unverified      ││
│  └──────────────────────────────┘│
│                                  │
├──────────────────────────────────┤
│  🏠   ➕   📋   ⚖️   •••        │
└──────────────────────────────────┘
```

Dashboard shows: sync status indicator (online/offline + pending sync count), summary stats, category breakdown counts, large capture button, and recent supplier cards (last 5, sorted by creation time descending).

---

## 5. PHASE 2: SUPPLIER MANAGEMENT + REVIEW

**Goal:** Full supplier list with filtering, detailed supplier view with editing, and status management.

### Supplier List Screen (`/suppliers`)

- **Filter bar** at top: category dropdown, status dropdown (all/new/reviewing/shortlisted/rejected), verification dropdown (all/manufacturer/trader/unverified)
- **Sort options:** rating (high→low), date added (newest), price (lowest), company name (A→Z)
- **Search bar:** fuzzy search on company name, booth number, notes
- **Supplier cards** showing: company name, primary category badge, booth number, rating stars, key price point (first quote from pricing JSON), verification badge (green check for manufacturer, red X for trader, grey ? for unverified)
- **Swipe actions** on each card: swipe right → shortlist, swipe left → reject (with confirmation)
- **Floating Action Button** → Quick Capture

### Supplier Detail Screen (`/suppliers/[id]`)

Tabbed layout with 4 tabs:

**Tab 1: INFO**
- Company name (editable)
- Contact details (editable): person, phone, email, wechat, whatsapp
- Booth number, hall area, fair phase
- Date visited
- Categories (editable pill selector)
- Status selector: New → Reviewing → Shortlisted → Rejected → Ordered
- Verification selector: Unverified → Likely Manufacturer → Confirmed Manufacturer → Likely Trader → Confirmed Trader
- Rating (editable stars)

**Tab 2: MEDIA**
- Grid of all photos (tappable to view full-screen, pinch to zoom)
- Add more photos button
- Voice notes list with play button and duration
- Add voice note button
- If OCR has been processed, show extracted text with "Apply to Contact" button
- If voice note has been transcribed, show transcription text

**Tab 3: PRICING**
- Structured price quotes (editable form):
  - Product name
  - Unit price + currency
  - MOQ
  - Notes/specs
  - Add another quote button
- Payment terms (text)
- Lead time (days, number input)
- Sample policy (text)
- FOB port (text, default "Guangzhou")

**Tab 4: NOTES**
- Free-text notes field (large text area)
- AI-generated summary (read-only, generated from voice notes)
- Red flags field
- Green flags field
- Factory visit section: toggle scheduled, date picker, notes
- Follow-up section: toggle required, action text, done checkbox
- BOQ matches (read-only, auto-computed from pricing data)

---

## 6. PHASE 3: AI LAYER

**Goal:** Business card OCR, voice note transcription and structuring, and natural language querying.

### Supabase Edge Function: `process-card`

**Trigger:** Called by sync engine when a photo with tag `business_card` is uploaded.

**Implementation:**

```typescript
// supabase/functions/process-card/index.ts
// 1. Receive photo URL from Supabase Storage
// 2. Download image, convert to base64
// 3. Call Claude API with vision:
//    System: "Extract all contact information from this business card image.
//            Return JSON only, no preamble: {
//              company_name, contact_person, phone, email,
//              wechat, whatsapp, address, website, title, raw_text
//            }
//            If a field is not visible, use empty string."
//    User: [image as base64]
// 4. Parse response JSON
// 5. Update photos.ocr_result in Supabase
// 6. If supplier fields are empty, auto-populate from OCR results
// 7. Set ocr_processed = true
```

### Supabase Edge Function: `process-voice`

**Trigger:** Called by sync engine when a voice note audio file is uploaded.

**Implementation:**

```typescript
// supabase/functions/process-voice/index.ts
// 1. Receive audio URL from Supabase Storage
// 2. Use a speech-to-text service to transcribe
//    Option A: Use Whisper API (OpenAI) for transcription
//    Option B: Use browser's Web Speech API on client before upload
//    Option C: Send audio to Claude and ask it to work from a description
//    RECOMMENDED: Use browser's Web Speech API on client (free, offline-capable)
//    and send the text transcript to Claude for structuring
// 3. Call Claude API with transcript:
//    System: "You are a procurement analyst. Extract structured data from this
//            voice note transcription recorded at a trade fair booth.
//            Return JSON only: {
//              prices_mentioned: [{ product, price, currency, unit }],
//              moq_mentioned: number or null,
//              lead_time_mentioned: string or null,
//              key_specs: [string],
//              manufacturer_signals: [string],
//              trader_signals: [string],
//              notable_points: [string],
//              sentiment: 'positive' | 'neutral' | 'negative',
//              summary: 'one paragraph summary'
//            }"
//    User: [transcript text]
// 4. Update voice_notes.transcription and voice_notes.structured_data
// 5. Update supplier.ai_summary with concatenated summaries
// 6. Auto-detect and populate: manufacturer signals → verification status,
//    prices → pricing JSON, specs → capabilities
// 7. Set ai_processed = true
```

**IMPORTANT NOTE ON VOICE TRANSCRIPTION:**

The recommended approach for voice-to-text is to use the **Web Speech API** (`webkitSpeechRecognition`) on the client side during or immediately after recording. This is free, works in Chrome on Android, and produces a text transcript that can be stored alongside the audio blob. The Claude API is then used ONLY for structuring the transcript into the JSON schema — not for transcription itself.

If the Web Speech API is unavailable (browser support), fall back to storing audio only and processing transcription server-side via Whisper or similar when synced.

```typescript
// VoiceRecorder component should:
// 1. Start MediaRecorder for audio blob capture
// 2. Simultaneously start webkitSpeechRecognition for real-time transcript
// 3. Save both blob AND transcript text to IndexedDB
// 4. On sync, upload audio blob to Supabase Storage
// 5. Send transcript text to process-voice edge function for AI structuring
```

### Supabase Edge Function: `ai-query`

**Trigger:** Called from the Compare or BOQ screen when the user asks a natural language question.

**Implementation:**

```typescript
// supabase/functions/ai-query/index.ts
// 1. Receive question text + relevant supplier data (JSON array)
// 2. Call Claude API:
//    System: "You are a procurement analyst for a 200-building residential
//            estate project in Nigeria. You have data on suppliers visited
//            at Canton Fair. Answer the user's question based on the data provided.
//            Be specific with names, prices, and recommendations.
//            If data is insufficient, say so."
//    User: "Supplier data: [JSON]\n\nQuestion: [user question]"
// 3. Return answer text
// 4. Log to ai_queries table
```

---

## 7. PHASE 4: COMPARE + BOQ MATCHER

### Compare Screen (`/compare`)

**Step 1:** User selects a category (e.g. "Windows & Doors")
**Step 2:** App shows all suppliers in that category as selectable cards
**Step 3:** User taps 2–3 suppliers to compare
**Step 4:** Side-by-side comparison table:

```
┌──────────────────────────────────────────┐
│  Compare: Windows & Doors                │
├──────────┬──────────┬──────────┬─────────┤
│          │Foshan Al.│Guangzhou │Dongguan │
│          │  ★★★★☆  │ Win Co.  │Profiles │
│          │          │  ★★★☆☆  │  ★★★★★  │
├──────────┼──────────┼──────────┼─────────┤
│ Price    │ $24/unit │ $28/unit │ $22/unit│
│ MOQ      │ 500      │ 200      │ 1000   │
│ Lead Time│ 45 days  │ 30 days  │ 60 days│
│ Payment  │ 30/70 TT │ 50/50 TT │ 30/70  │
│ Verified │ ✓ Mfr    │ ? Unknown│ ✓ Mfr  │
│ Africa   │ ✓ Yes    │ ✗ No     │ ✓ Yes  │
│ Certs    │ IEC, ISO │ CE only  │ IEC,ISO│
│ Rating   │ ★★★★     │ ★★★      │ ★★★★★  │
│ Flags    │ None     │ Vague on │ None   │
│          │          │ factory  │        │
├──────────┼──────────┼──────────┼─────────┤
│ 🤖 ASK AI: "Which should I choose?"     │
└──────────────────────────────────────────┘
```

- Rows are auto-populated from supplier pricing and capabilities JSON
- Missing data shows "—" in grey
- "Best" value in each row highlighted in green
- "Worst" value highlighted in amber
- Bottom: AI query input where user can ask free-form questions about the compared suppliers

### BOQ Matcher Screen (`/boq`)

Shows the pre-loaded Primerose BOQ items with coverage status:

```
┌──────────────────────────────────────┐
│  BOQ Coverage          68% matched   │
│  ████████████████░░░░░░░             │
├──────────────────────────────────────┤
│                                      │
│  🟢 ORDER NOW                        │
│  ┌──────────────────────────────────┐│
│  │ W1 Casement Windows  [6,000 pcs]││
│  │ Target: $18–45/unit             ││
│  │ ✓ 3 suppliers matched           ││
│  │ Best: $22 (Dongguan Profiles)   ││
│  ├──────────────────────────────────┤│
│  │ Exterior Doors       [1,800 pcs]││
│  │ Target: $60–200/unit            ││
│  │ ✓ 2 suppliers matched           ││
│  │ Best: $85 (Foshan Aluminium)    ││
│  ├──────────────────────────────────┤│
│  │ Railings           [3,200 lin.m]││
│  │ Target: $15–40/m               ││
│  │ ✗ 0 suppliers — NEEDS SOURCING  ││
│  └──────────────────────────────────┘│
│                                      │
│  🟡 DECIDE NOW                       │
│  ┌──────────────────────────────────┐│
│  │ Smart Home Controllers [200 pcs]││
│  │ ✓ 1 supplier matched            ││
│  └──────────────────────────────────┘│
│                                      │
│  🔵 SCOUT ONLY                       │
│  ┌──────────────────────────────────┐│
│  │ Solar Panels 550W  [9,600 pcs]  ││
│  │ ✓ 2 suppliers matched           ││
│  └──────────────────────────────────┘│
│                                      │
└──────────────────────────────────────┘
```

- Each BOQ item shows: name, quantity, target price range, number of suppliers matched, best price and supplier name
- Tap a BOQ item to see all matched suppliers for that item
- Items with 0 suppliers are highlighted red ("NEEDS SOURCING")
- Coverage percentage = (items with ≥1 supplier) / total items
- Matching logic: when a supplier's pricing JSON contains a quote whose product name fuzzy-matches a BOQ item name AND the category matches, it's a match. AI can also be used to improve matching.

---

## 8. PHASE 5: EXPORT + POLISH

### Export Screen (`/export`)

Three export options:

1. **PDF Summary Report**
   - One page per category
   - Top 3 suppliers per category with comparison
   - BOQ coverage summary
   - Generated via client-side PDF (use `@react-pdf/renderer` or `jspdf`)

2. **Spreadsheet Export**
   - All suppliers as CSV/XLSX
   - Columns: company, contact, phone, email, wechat, booth, category, price, MOQ, lead time, rating, verification, status, notes
   - Downloadable file

3. **Follow-up Message Generator**
   - Select a shortlisted supplier
   - AI generates a WeChat/email follow-up message referencing the booth meeting, project scope, and requesting formal quotation
   - Copy to clipboard for pasting into WeChat

### Polish Tasks

- **Pull-to-refresh** on supplier list
- **Haptic feedback** on save, rate, shortlist actions (navigator.vibrate)
- **Toast notifications** for save, sync, AI processing complete
- **Empty states** with helpful prompts (e.g. "No suppliers yet — tap + to capture your first")
- **Loading skeletons** for async operations
- **Confirmation dialogs** for destructive actions (reject, delete)
- **Swipe gestures** on supplier cards (right = shortlist, left = reject)

---

## 9. UI/UX SPECIFICATIONS

### Design System

```
Colors:
  --primary:     #1B3A5C  (navy blue)
  --primary-light: #D6E4F0
  --accent:      #C8952E  (gold)
  --success:     #16A34A  (green)
  --warning:     #EAB308  (amber)
  --danger:      #DC2626  (red)
  --bg:          #FFFFFF
  --bg-subtle:   #F8FAFC
  --text:        #1E293B
  --text-muted:  #94A3B8
  --border:      #E2E8F0

Typography:
  --font: 'Inter', system-ui, sans-serif
  Heading: 20px semibold
  Body: 16px regular
  Caption: 13px regular
  Badge: 12px medium

Spacing: 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48)

Border radius: 8px (cards), 12px (buttons), 20px (pills), 9999px (badges)

Shadows:
  Card: 0 1px 3px rgba(0,0,0,0.08)
  Modal: 0 4px 24px rgba(0,0,0,0.12)
```

### Bottom Navigation

Fixed bottom bar, 64px tall, 5 items:
1. 🏠 Home (Dashboard)
2. ➕ Capture (slightly elevated, accent color, round — this is the primary action)
3. 📋 Suppliers (list)
4. ⚖️ Compare
5. ••• More (BOQ, Export, Settings)

Active tab: primary color icon + label. Inactive: muted icon, no label.

### Category Color Map

Each category has a consistent color used for badges and pills:

```
windows_doors:     #2563EB (blue)
cladding:          #7C3AED (purple)
railings_metalwork:#059669 (emerald)
roofing:           #DC2626 (red)
solar_panels:      #EAB308 (yellow)
solar_inverters:   #F59E0B (amber)
solar_batteries:   #84CC16 (lime)
smart_home:        #06B6D4 (cyan)
cctv_security:     #6366F1 (indigo)
lighting:          #F97316 (orange)
electrical:        #8B5CF6 (violet)
building_materials:#78716C (stone)
other:             #94A3B8 (grey)
```

---

## 10. OFFLINE STRATEGY

### How Offline Works

1. **Service Worker** caches app shell (HTML, CSS, JS, images) on first load. App loads instantly from cache thereafter, even offline.

2. **All data operations go to IndexedDB first.** Every create/update/delete modifies IndexedDB immediately. The UI reads from IndexedDB. This means the app is instant — no loading spinners for data operations.

3. **Sync Engine** runs in background:
   - Listens for `online` event
   - On connectivity: iterates all records with `syncStatus: 'pending'`
   - Uploads photos/audio blobs to Supabase Storage
   - Upserts supplier/photo/voice_note records to Supabase Postgres
   - Triggers AI processing edge functions for unprocessed cards and voice notes
   - Updates `syncStatus` to `synced` in IndexedDB
   - Shows sync indicator: "Syncing 3 items..." → "All synced ✓"

4. **Conflict resolution:** Last-write-wins. Since single user, conflicts are unlikely. `updatedAt` timestamp is the tiebreaker.

5. **Sync indicator** in the header/status bar:
   - 🟢 Online + All synced
   - 🟡 Online + Syncing (n items)
   - 🔴 Offline (n items pending)

### Key Implementation Detail

```typescript
// lib/sync.ts
export async function syncAll() {
  const pending = await db.suppliers
    .where('syncStatus').equals('pending')
    .toArray();
  
  for (const supplier of pending) {
    try {
      // 1. Upload any pending photos for this supplier
      const photos = await db.photos
        .where('supplierLocalId').equals(supplier.localId)
        .filter(p => p.syncStatus === 'pending')
        .toArray();
      
      for (const photo of photos) {
        if (photo.blob) {
          const path = `${supplier.localId}/${photo.localId}.jpg`;
          await supabase.storage.from('photos').upload(path, photo.blob);
          await db.photos.update(photo.localId, {
            remotePath: path,
            syncStatus: 'synced'
          });
        }
      }
      
      // 2. Upload any pending voice notes
      const notes = await db.voiceNotes
        .where('supplierLocalId').equals(supplier.localId)
        .filter(n => n.syncStatus === 'pending')
        .toArray();
      
      for (const note of notes) {
        if (note.blob) {
          const path = `${supplier.localId}/${note.localId}.webm`;
          await supabase.storage.from('voice-notes').upload(path, note.blob);
          await db.voiceNotes.update(note.localId, {
            remotePath: path,
            syncStatus: 'synced'
          });
        }
      }
      
      // 3. Upsert supplier record
      const { data, error } = await supabase
        .from('suppliers')
        .upsert({
          local_id: supplier.localId,
          company_name: supplier.companyName,
          // ... map all fields
        }, { onConflict: 'local_id' })
        .select('id')
        .single();
      
      if (data) {
        await db.suppliers.update(supplier.localId, {
          remoteId: data.id,
          syncStatus: 'synced'
        });
      }
      
      // 4. Trigger AI processing for unprocessed items
      // (business card OCR, voice note structuring)
      
    } catch (err) {
      await db.suppliers.update(supplier.localId, {
        syncStatus: 'error'
      });
    }
  }
}
```

---

## 11. DEPLOYMENT

### Steps

1. **Supabase Project:** Use Law's existing Supabase instance or create a new project named `sourceflow`
2. **Run migration:** Execute `001_initial.sql` against the Supabase database
3. **Create storage buckets:** `photos` (public) and `voice-notes` (private)
4. **Deploy Edge Functions:** `process-card`, `process-voice`, `ai-query`
5. **Set environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` (in Supabase Edge Function secrets only — never expose to client)
6. **Deploy to Vercel:**
   - Connect GitHub repo
   - Set env vars in Vercel dashboard
   - Deploy
7. **Custom domain (optional):** `source.lawone.cloud` or similar
8. **Install PWA:** Open in Chrome on phone → "Add to Home Screen"

---

## 12. PRE-LOADED DATA

### BOQ Items to Seed

Insert these into `boq_items` table on deployment:

```sql
INSERT INTO boq_items (id, name, category, description, quantity, unit, target_price_low, target_price_high, price_unit, priority, fair_phase, notes) VALUES
-- ORDER NOW (exterior for all 200 buildings)
(gen_random_uuid(), 'W1 Casement Windows (small)', 'windows_doors', 'Aluminium casement, ~1200×2100mm, per building drawings', 1200, 'units', 18, 35, 'per unit', 'order_now', 1, '6 per building × 200'),
(gen_random_uuid(), 'W2 Casement Windows', 'windows_doors', 'Aluminium casement, 1800×2100mm', 600, 'units', 25, 45, 'per unit', 'order_now', 1, '3 per building × 200'),
(gen_random_uuid(), 'W3 Casement Windows (med)', 'windows_doors', 'Aluminium casement, ~1500×2100mm', 1400, 'units', 22, 40, 'per unit', 'order_now', 1, '7 per building × 200'),
(gen_random_uuid(), 'W4 Casement Windows (wide)', 'windows_doors', 'Aluminium casement, 1200×2100mm dual panel', 600, 'units', 25, 45, 'per unit', 'order_now', 1, '3 per building × 200'),
(gen_random_uuid(), 'W5 Toilet/Service Windows', 'windows_doors', 'Aluminium casement, ~600×600mm', 400, 'units', 10, 20, 'per unit', 'order_now', 1, '2 per building × 200'),
(gen_random_uuid(), 'W6 Kitchen/Service Windows', 'windows_doors', 'Aluminium casement, 1800×2100mm', 200, 'units', 25, 45, 'per unit', 'order_now', 1, '1 per building × 200'),
(gen_random_uuid(), 'W8 Large Fixed Glazed Windows', 'windows_doors', 'Fixed glazed + mullions, 5250×1200mm, living room', 200, 'units', 150, 300, 'per unit', 'order_now', 1, '1 per building × 200'),
(gen_random_uuid(), 'Bathroom/WC Windows', 'windows_doors', 'Aluminium louvre/casement, ~600×900mm', 1400, 'units', 10, 25, 'per unit', 'order_now', 1, '7 per building × 200'),
(gen_random_uuid(), 'D1 Main Entrance Gate', 'windows_doors', 'Metal car park gate, ~2400mm wide', 200, 'units', 80, 200, 'per unit', 'order_now', 1, ''),
(gen_random_uuid(), 'D2 Main Entry Door (glazed)', 'windows_doors', 'Glazed + transom + side panels, 900×2100mm', 200, 'units', 150, 350, 'per unit', 'order_now', 1, ''),
(gen_random_uuid(), 'D5 Terrace/Balcony Doors', 'windows_doors', 'Aluminium sliding/French, ~2700mm wide', 1200, 'units', 120, 250, 'per unit', 'order_now', 1, '6 per building × 200'),
(gen_random_uuid(), 'Pedestrian Gate', 'windows_doors', 'Metal pedestrian gate, ~900mm', 200, 'units', 40, 100, 'per unit', 'order_now', 1, ''),
(gen_random_uuid(), 'Exterior Stone/ACP Cladding', 'cladding', 'Decorative stone cladding and ACP panels for facades', 200, 'sets', NULL, NULL, 'per building', 'order_now', 2, 'Quote at fair — varies by design'),
(gen_random_uuid(), 'Balcony & Staircase Railings', 'railings_metalwork', 'Aluminium or stainless steel railings per architect design', 3200, 'linear_metres', 15, 40, 'per linear metre', 'order_now', 1, '~16m per building × 200'),
(gen_random_uuid(), 'External LED Lighting', 'lighting', 'Soffit recessed lights + wall-mounted exterior lights', 2400, 'units', 8, 20, 'per unit', 'order_now', 1, '~12 per building × 200'),
(gen_random_uuid(), 'Long-Span Aluminium Roofing', 'roofing', 'Per architect spec: long span aluminium roofing sheets', 200, 'sets', NULL, NULL, 'per building', 'order_now', 1, 'Quote at fair — weight/shipping key factor'),
(gen_random_uuid(), 'Estate Perimeter Fence', 'railings_metalwork', 'Metal fence panels for estate boundary', 1600, 'linear_metres', 25, 60, 'per linear metre', 'order_now', 1, 'Estimate ~1600m perimeter'),

-- DECIDE NOW (affects carcass wiring)
(gen_random_uuid(), 'Smart Home Hub/Controller', 'smart_home', 'Tuya/Sonoff/HDL — decide protocol for pre-wiring', 200, 'units', 15, 80, 'per unit', 'decide_now', 1, 'Protocol decision affects carcass electrical'),
(gen_random_uuid(), 'Smart Locks (main entrance)', 'smart_home', 'Smart lock for main apartment doors', 200, 'units', 25, 60, 'per unit', 'decide_now', 1, ''),
(gen_random_uuid(), 'CCTV/NVR Systems', 'cctv_security', 'Hikvision/Dahua — estate + per-building camera system', 200, 'sets', 80, 200, 'per set', 'decide_now', 1, 'Cable routing during carcass'),
(gen_random_uuid(), 'Cat6 Cable + Smart Conduit', 'electrical', 'Pre-wiring infrastructure for smart home + CCTV', 200, 'sets', 30, 60, 'per building', 'decide_now', 1, 'Must install during carcass'),

-- SCOUT ONLY (order 6-12 months later)
(gen_random_uuid(), '550W Mono Solar Panels', 'solar_panels', 'Monocrystalline PERC or TOPCon, rooftop mount', 9600, 'units', 0.18, 0.22, 'per watt', 'scout_only', 1, '48 per building × 200 — order when roofs ready'),
(gen_random_uuid(), '10-15kW Hybrid Inverters', 'solar_inverters', 'Deye/Growatt hybrid inverter', 200, 'units', 400, 600, 'per unit', 'scout_only', 1, ''),
(gen_random_uuid(), 'LiFePO4 ESS Battery System', 'solar_batteries', 'Rack-mounted or containerised LiFePO4 storage', 500, 'kWh', 85, 120, 'per kWh', 'scout_only', 1, 'Central estate battery bank'),
(gen_random_uuid(), 'Bidirectional Smart Meters', 'electrical', 'For solar mini-grid billing', 200, 'units', 30, 60, 'per unit', 'scout_only', 1, ''),
(gen_random_uuid(), 'Solar Mounting Rails + Hardware', 'solar_panels', 'Aluminium rooftop mounting system', 200, 'sets', 80, 150, 'per set', 'scout_only', 1, ''),

-- SAMPLE ONLY (for finishing packages)
(gen_random_uuid(), 'Interior Tiles (sample)', 'building_materials', 'Floor and wall tiles — collect samples for finishing packages', 1, 'sets', NULL, NULL, 'per sample set', 'sample_only', 2, 'Phase 2 — not bulk order'),
(gen_random_uuid(), 'Sanitary Ware (sample)', 'building_materials', 'Toilets, basins, showers — collect samples', 1, 'sets', NULL, NULL, 'per sample set', 'sample_only', 2, 'Phase 2'),
(gen_random_uuid(), 'Kitchen Cabinets (sample)', 'building_materials', 'Cabinet sets — collect samples and pricing', 1, 'sets', NULL, NULL, 'per sample set', 'sample_only', 2, 'Phase 2');
```

---

## 13. IMPLEMENTATION NOTES

### Phase Implementation Order

**Implement strictly in this order. Each phase must be fully working before starting the next.**

| Phase | Scope | Estimated Effort | Must Ship By |
|-------|-------|-----------------|-------------|
| 1 | Foundation + Quick Capture + Dashboard | 8-12 hours | April 13 |
| 2 | Supplier List + Detail + Editing | 6-8 hours | April 14 |
| 3 | AI Layer (OCR + Voice) | 6-8 hours | April 15 |
| 4 | Compare + BOQ Matcher | 4-6 hours | April 16 |
| 5 | Export + Polish | 4-6 hours | April 17 |

**Phases 1 and 2 are non-negotiable.** If time runs out, the app is usable without AI, Compare, or Export. The core value is fast capture + organized review.

### Critical Implementation Rules

1. **IndexedDB first, always.** Never make the UI wait for a network request. Write to Dexie, update UI, sync to Supabase in background.

2. **No loading spinners for data operations.** Data is local. It's instant. Show spinners only for AI processing and file uploads.

3. **Camera must use native input.** Use `<input type="file" accept="image/*" capture="environment">` for camera access. Do NOT try to use `getUserMedia` — it's more complex and less reliable on mobile.

4. **Voice recording: MediaRecorder API.** Use `audio/webm` format (universally supported). Keep recordings under 2 minutes — longer notes should be split.

5. **Test on mobile from Phase 1.** Every feature must be tested on actual phone (Chrome on Android) from the first commit. Desktop is irrelevant.

6. **PWA install prompt.** Show a banner encouraging "Add to Home Screen" on first visit. After install, the app launches fullscreen without browser chrome.

7. **Image compression.** Before storing photos in IndexedDB, compress to max 1200px wide, 80% JPEG quality. Business cards don't need high-res for OCR. This keeps IndexedDB size manageable.

8. **No authentication.** Single user app. Use Supabase anon key. No login screen.

9. **UUID generation client-side.** Use `crypto.randomUUID()` for all local IDs. This ensures offline record creation works without server round-trips.

10. **Debounce sync.** Don't sync after every save. Sync every 30 seconds when online, or immediately when transitioning from offline to online.

### Environment Variables Required

```env
# .env.local (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Supabase Edge Function secrets (set via CLI)
ANTHROPIC_API_KEY=sk-ant-...
```

### Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.2",
    "react": "^18.3",
    "react-dom": "^18.3",
    "@supabase/supabase-js": "^2.43",
    "dexie": "^4.0",
    "dexie-react-hooks": "^1.1",
    "zustand": "^4.5",
    "tailwindcss": "^3.4",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-toast": "latest",
    "lucide-react": "^0.383",
    "date-fns": "^3.6",
    "fuse.js": "^7.0",
    "jspdf": "^2.5",
    "jspdf-autotable": "^3.8"
  }
}
```

---

## END OF PRD

This document is the complete specification. Implement phase by phase, test each phase on mobile before proceeding, and ship Phase 1+2 minimum by April 14, 2026.
