-- ============================================================
-- SOURCEFLOW DATA MODEL
-- Migration: 001_initial
-- Created: 2026-04-11
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
-- RLS POLICIES (using anon key for single user app)
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

-- ============================================================
-- SEED BOQ ITEMS (Primerose Estate Requirements)
-- ============================================================
INSERT INTO boq_items (id, name, category, description, quantity, unit, target_price_low, target_price_high, price_unit, priority, fair_phase, notes) VALUES
-- ORDER NOW (exterior for all 200 buildings)
(gen_random_uuid(), 'W1 Casement Windows (small)', 'windows_doors', 'Aluminium casement, ~1200x2100mm, per building drawings', 1200, 'units', 18, 35, 'per unit', 'order_now', 1, '6 per building x 200'),
(gen_random_uuid(), 'W2 Casement Windows', 'windows_doors', 'Aluminium casement, 1800x2100mm', 600, 'units', 25, 45, 'per unit', 'order_now', 1, '3 per building x 200'),
(gen_random_uuid(), 'W3 Casement Windows (med)', 'windows_doors', 'Aluminium casement, ~1500x2100mm', 1400, 'units', 22, 40, 'per unit', 'order_now', 1, '7 per building x 200'),
(gen_random_uuid(), 'W4 Casement Windows (wide)', 'windows_doors', 'Aluminium casement, 1200x2100mm dual panel', 600, 'units', 25, 45, 'per unit', 'order_now', 1, '3 per building x 200'),
(gen_random_uuid(), 'W5 Toilet/Service Windows', 'windows_doors', 'Aluminium casement, ~600x600mm', 400, 'units', 10, 20, 'per unit', 'order_now', 1, '2 per building x 200'),
(gen_random_uuid(), 'W6 Kitchen/Service Windows', 'windows_doors', 'Aluminium casement, 1800x2100mm', 200, 'units', 25, 45, 'per unit', 'order_now', 1, '1 per building x 200'),
(gen_random_uuid(), 'W8 Large Fixed Glazed Windows', 'windows_doors', 'Fixed glazed + mullions, 5250x1200mm, living room', 200, 'units', 150, 300, 'per unit', 'order_now', 1, '1 per building x 200'),
(gen_random_uuid(), 'Bathroom/WC Windows', 'windows_doors', 'Aluminium louvre/casement, ~600x900mm', 1400, 'units', 10, 25, 'per unit', 'order_now', 1, '7 per building x 200'),
(gen_random_uuid(), 'D1 Main Entrance Gate', 'windows_doors', 'Metal car park gate, ~2400mm wide', 200, 'units', 80, 200, 'per unit', 'order_now', 1, ''),
(gen_random_uuid(), 'D2 Main Entry Door (glazed)', 'windows_doors', 'Glazed + transom + side panels, 900x2100mm', 200, 'units', 150, 350, 'per unit', 'order_now', 1, ''),
(gen_random_uuid(), 'D5 Terrace/Balcony Doors', 'windows_doors', 'Aluminium sliding/French, ~2700mm wide', 1200, 'units', 120, 250, 'per unit', 'order_now', 1, '6 per building x 200'),
(gen_random_uuid(), 'Pedestrian Gate', 'windows_doors', 'Metal pedestrian gate, ~900mm', 200, 'units', 40, 100, 'per unit', 'order_now', 1, ''),
(gen_random_uuid(), 'Exterior Stone/ACP Cladding', 'cladding', 'Decorative stone cladding and ACP panels for facades', 200, 'sets', NULL, NULL, 'per building', 'order_now', 2, 'Quote at fair - varies by design'),
(gen_random_uuid(), 'Balcony & Staircase Railings', 'railings_metalwork', 'Aluminium or stainless steel railings per architect design', 3200, 'linear_metres', 15, 40, 'per linear metre', 'order_now', 1, '~16m per building x 200'),
(gen_random_uuid(), 'External LED Lighting', 'lighting', 'Soffit recessed lights + wall-mounted exterior lights', 2400, 'units', 8, 20, 'per unit', 'order_now', 1, '~12 per building x 200'),
(gen_random_uuid(), 'Long-Span Aluminium Roofing', 'roofing', 'Per architect spec: long span aluminium roofing sheets', 200, 'sets', NULL, NULL, 'per building', 'order_now', 1, 'Quote at fair - weight/shipping key factor'),
(gen_random_uuid(), 'Estate Perimeter Fence', 'railings_metalwork', 'Metal fence panels for estate boundary', 1600, 'linear_metres', 25, 60, 'per linear metre', 'order_now', 1, 'Estimate ~1600m perimeter'),

-- DECIDE NOW (affects carcass wiring)
(gen_random_uuid(), 'Smart Home Hub/Controller', 'smart_home', 'Tuya/Sonoff/HDL - decide protocol for pre-wiring', 200, 'units', 15, 80, 'per unit', 'decide_now', 1, 'Protocol decision affects carcass electrical'),
(gen_random_uuid(), 'Smart Locks (main entrance)', 'smart_home', 'Smart lock for main apartment doors', 200, 'units', 25, 60, 'per unit', 'decide_now', 1, ''),
(gen_random_uuid(), 'CCTV/NVR Systems', 'cctv_security', 'Hikvision/Dahua - estate + per-building camera system', 200, 'sets', 80, 200, 'per set', 'decide_now', 1, 'Cable routing during carcass'),
(gen_random_uuid(), 'Cat6 Cable + Smart Conduit', 'electrical', 'Pre-wiring infrastructure for smart home + CCTV', 200, 'sets', 30, 60, 'per building', 'decide_now', 1, 'Must install during carcass'),

-- SCOUT ONLY (order 6-12 months later)
(gen_random_uuid(), '550W Mono Solar Panels', 'solar_panels', 'Monocrystalline PERC or TOPCon, rooftop mount', 9600, 'units', 0.18, 0.22, 'per watt', 'scout_only', 1, '48 per building x 200 - order when roofs ready'),
(gen_random_uuid(), '10-15kW Hybrid Inverters', 'solar_inverters', 'Deye/Growatt hybrid inverter', 200, 'units', 400, 600, 'per unit', 'scout_only', 1, ''),
(gen_random_uuid(), 'LiFePO4 ESS Battery System', 'solar_batteries', 'Rack-mounted or containerised LiFePO4 storage', 500, 'kWh', 85, 120, 'per kWh', 'scout_only', 1, 'Central estate battery bank'),
(gen_random_uuid(), 'Bidirectional Smart Meters', 'electrical', 'For solar mini-grid billing', 200, 'units', 30, 60, 'per unit', 'scout_only', 1, ''),
(gen_random_uuid(), 'Solar Mounting Rails + Hardware', 'solar_panels', 'Aluminium rooftop mounting system', 200, 'sets', 80, 150, 'per set', 'scout_only', 1, ''),

-- SAMPLE ONLY (for finishing packages)
(gen_random_uuid(), 'Interior Tiles (sample)', 'building_materials', 'Floor and wall tiles - collect samples for finishing packages', 1, 'sets', NULL, NULL, 'per sample set', 'sample_only', 2, 'Phase 2 - not bulk order'),
(gen_random_uuid(), 'Sanitary Ware (sample)', 'building_materials', 'Toilets, basins, showers - collect samples', 1, 'sets', NULL, NULL, 'per sample set', 'sample_only', 2, 'Phase 2'),
(gen_random_uuid(), 'Kitchen Cabinets (sample)', 'building_materials', 'Cabinet sets - collect samples and pricing', 1, 'sets', NULL, NULL, 'per sample set', 'sample_only', 2, 'Phase 2');
