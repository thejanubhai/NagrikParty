-- ============================================================================
-- Migration 15: Party Formation Governance System
-- Office Bearers | Convention & Resolutions | Constitution | Party Documents
-- Affidavits | Newspaper Notices | Signature Sheets | Symbols | Accounts | ECI Correspondence
-- ============================================================================

-- 1. OFFICE BEARERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.office_bearers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    designation TEXT NOT NULL,
    designation_label TEXT,
    full_name TEXT NOT NULL,
    parent_or_spouse TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    epic_number TEXT,
    is_founding_leader BOOLEAN DEFAULT false,
    election_method TEXT NOT NULL DEFAULT 'FOUNDER' CHECK (election_method IN ('FOUNDER','CONVENTION_RESOLUTION','MEETING_RESOLUTION')),
    appointed_at TIMESTAMPTZ DEFAULT NOW(),
    appointed_by UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RETIRED','REPLACED','SUSPENDED')),
    end_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the founding National President
INSERT INTO public.office_bearers (designation, designation_label, full_name, is_founding_leader, election_method, status)
SELECT 'NATIONAL_PRESIDENT', 'National President', 'Sheikh Arsalan Ullah Chishti', true, 'FOUNDER', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM public.office_bearers WHERE designation = 'NATIONAL_PRESIDENT' AND status = 'ACTIVE');

-- 2. GENERAL BODY CONVENTIONS & RESOLUTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    convention_date DATE,
    venue TEXT,
    total_members_at_convention INTEGER,
    attendance_count INTEGER,
    status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','SCHEDULED','HELD','MINUTES_FINALIZED','SUBMITTED')),
    minutes_summary TEXT,
    minutes_document_id UUID,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.convention_resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    convention_id UUID NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
    resolution_number TEXT,
    resolution_type TEXT NOT NULL CHECK (resolution_type IN ('CONSTITUTION_ADOPTION','OFFICE_BEARER_ELECTION','BANK_ACCOUNT','SYMBOL_PREFERENCE','NEWSPAPER_NOTICE','REGISTRATION_AUTHORISATION','GENERAL')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    proposed_by TEXT,
    seconded_by TEXT,
    vote_for INTEGER DEFAULT 0,
    vote_against INTEGER DEFAULT 0,
    abstain INTEGER DEFAULT 0,
    passed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PARTY DOCUMENTS VAULT (visibility: STAFF | MEMBERS | PUBLIC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.party_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('CONSTITUTION','CONVENTION_MINUTES','RESOLUTION','AFFIDAVIT','NOTICE_PROOF','SIGNATURE_SHEET','BANK_DOCUMENT','ECI_CORRESPONDENCE','SYMBOL_FORM','PRINT_PACK','OTHER')),
    title TEXT NOT NULL,
    description TEXT,
    storage_path TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    visibility TEXT NOT NULL DEFAULT 'STAFF' CHECK (visibility IN ('STAFF','MEMBERS','PUBLIC')),
    parent_id UUID,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PARTY CONSTITUTION VERSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.party_constitution_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    title TEXT,
    content_markdown TEXT NOT NULL,
    change_summary TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','RATIFIED','SUBMITTED','ECI_APPROVED')),
    sha256 TEXT,
    ratified_convention_id UUID REFERENCES public.conventions(id),
    ratified_at TIMESTAMPTZ,
    document_id UUID,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AFFIDAVITS (Chief Functionary)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.party_affidavits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deponent_office_bearer_id UUID REFERENCES public.office_bearers(id),
    deponent_name TEXT NOT NULL,
    stamp_paper_number TEXT,
    notary_name TEXT,
    notary_place TEXT,
    sworn_on DATE,
    draft_document_id UUID REFERENCES public.party_documents(id),
    notarized_document_id UUID REFERENCES public.party_documents(id),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PRINTED','NOTARIZED','SUBMITTED')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NEWSPAPER PUBLIC NOTICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.newspaper_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_title TEXT NOT NULL,
    english_text TEXT,
    hindi_text TEXT,
    newspaper_name TEXT,
    newspaper_language TEXT,
    edition TEXT,
    publication_date DATE,
    page_number TEXT,
    proof_document_id UUID REFERENCES public.party_documents(id),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','BOOKED','PUBLISHED','PROOF_UPLOADED','VERIFIED')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SIGNATURE SHEETS (physical signing workflow)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.signature_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_number TEXT UNIQUE,
    member_count INTEGER NOT NULL DEFAULT 0,
    member_ids UUID[] NOT NULL DEFAULT '{}',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID REFERENCES auth.users(id),
    signed_document_id UUID REFERENCES public.party_documents(id),
    signed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('GENERATED','PRINTED','SIGNED','SCANNED_UPLOADED','VERIFIED'))
);

-- 8. ECI SYMBOL INDEX & MEMBER RECOMMENDATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eci_symbol_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol_name TEXT UNIQUE NOT NULL,
    symbol_description TEXT,
    is_free BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.symbol_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    symbol_name TEXT NOT NULL,
    symbol_reason TEXT,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','SHORTLISTED','ACCEPTED','REJECTED')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PARTY ACCOUNTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.party_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_purpose TEXT NOT NULL CHECK (account_purpose IN ('FORMATION_ACCOUNT','ELECTION_FUND','OFFICE_OPERATIONS')),
    bank_name TEXT,
    branch TEXT,
    account_number_masked TEXT,
    ifsc TEXT,
    pan_reference TEXT,
    opening_resolution_id UUID REFERENCES public.convention_resolutions(id),
    passbook_document_id UUID REFERENCES public.party_documents(id),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','OPENED','ACTIVE','CLOSED')),
    opened_on DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ECI CORRESPONDENCE TRACKER
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eci_correspondence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    direction TEXT NOT NULL CHECK (direction IN ('SENT_TO_ECI','RECEIVED_FROM_ECI','INTERNAL')),
    subject TEXT NOT NULL,
    reference_number TEXT,
    correspondence_date DATE,
    filing_id UUID REFERENCES public.eci_filing_dossiers(id),
    document_id UUID REFERENCES public.party_documents(id),
    notes TEXT,
    requires_action BOOLEAN DEFAULT false,
    action_deadline DATE,
    action_status TEXT NOT NULL DEFAULT 'NONE' CHECK (action_status IN ('NONE','PENDING','IN_PROGRESS','DONE')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ELECTORAL ROLL VERIFICATION COLUMNS ON PROPOSER RECORDS
-- ============================================================================
ALTER TABLE public.proposer_records ADD COLUMN IF NOT EXISTS roll_year TEXT;
ALTER TABLE public.proposer_records ADD COLUMN IF NOT EXISTS roll_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.proposer_records ADD COLUMN IF NOT EXISTS roll_verified_by UUID REFERENCES auth.users(id);
ALTER TABLE public.proposer_records ADD COLUMN IF NOT EXISTS roll_verified_at TIMESTAMPTZ;
ALTER TABLE public.proposer_records ADD COLUMN IF NOT EXISTS verification_source TEXT CHECK (verification_source IN ('BLO','ROLL_EXTRACT','SELF','ECI_PORTAL'));

-- 12. ECI FREE SYMBOLS SEED (curated common free pool; Chimta already allotted in independent run)
-- ============================================================================
INSERT INTO public.eci_symbol_index (symbol_name, symbol_description, is_free, notes) VALUES
('Chimta (Tongs)', 'A pair of tongs', true, 'Already allotted during independent electoral run - familiar with Delhi voters'),
('Broom', 'A broom', true, NULL),
('Cauldron', 'A cooking cauldron', true, NULL),
('Cup & Saucer', 'A cup with saucer', true, NULL),
('Envelope', 'A postal envelope', true, NULL),
('Glass Tumbler', 'A drinking glass', true, NULL),
('Jug', 'A water jug', true, NULL),
('Kite', 'A flying kite', true, NULL),
('Ladder', 'A step ladder', true, NULL),
('Mace', 'A ceremonial mace', true, NULL),
('Pencil', 'A sharpened pencil', true, NULL),
('Pressure Cooker', 'A pressure cooker', true, NULL),
('Saw', 'A carpenter saw', true, NULL),
('Scissors', 'A pair of scissors', true, NULL),
('Ship', 'A sailing ship', true, NULL),
('Stethoscope', 'A medical stethoscope', true, NULL),
('Table Lamp', 'A lit table lamp', true, NULL),
('Telephone', 'A telephone receiver', true, NULL),
('Telescope', 'A telescope', true, NULL),
('Whistle', 'A whistle', true, NULL),
('Battery Torch', 'A torch with battery', true, NULL),
('Basket of Vegetables', 'A basket with vegetables', true, NULL),
('Black Board', 'A school black board', true, NULL),
('Bridge', 'A bridge structure', true, NULL),
('Bucket', 'A water bucket', true, NULL),
('Candles', 'Lit candles', true, NULL),
('Camera', 'A photographic camera', true, NULL),
('Chair', 'A wooden chair', true, NULL),
('Clock', 'A wall clock', true, NULL),
('Drum', 'A traditional drum', true, NULL),
('Flower', 'A blooming flower', true, NULL),
('Fruits', 'A bunch of fruits', true, NULL),
('Hat', 'A brimmed hat', true, NULL),
('Inkpot & Pen', 'An inkpot with pen', true, NULL),
('Iron', 'A clothes iron', true, NULL),
('Lock & Key', 'A lock with key', true, NULL),
('Milk Glass', 'A glass of milk', true, NULL),
('Motorcycle', 'A motorcycle', true, NULL),
('Nail Cutter', 'A nail cutter', true, NULL),
('Necklace', 'A necklace', true, NULL),
('Plate', 'A dinner plate', true, NULL),
('Ring', 'A finger ring', true, NULL),
('Rooster', 'A rooster', true, NULL),
('Scales', 'Balance scales', true, NULL),
('Sewing Machine', 'A sewing machine', true, NULL),
('Shoe', 'A shoe', true, NULL),
('Sofa', 'A sofa set', true, NULL),
('Spoons', 'A pair of spoons', true, NULL),
('Stool', 'A wooden stool', true, NULL),
('Sword', 'A sword', true, NULL),
('Tractor', 'A farm tractor', true, NULL),
('Umbrella', 'An open umbrella', true, NULL),
('Violin', 'A violin', true, NULL),
('Water Pot', 'An earthen water pot', true, NULL),
('Wheelbarrow', 'A wheelbarrow', true, NULL)
ON CONFLICT (symbol_name) DO NOTHING;

-- 13. RLS POLICIES
-- ============================================================================
ALTER TABLE public.office_bearers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_constitution_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_affidavits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newspaper_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eci_symbol_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symbol_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eci_correspondence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage office_bearers" ON public.office_bearers FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));
CREATE POLICY "Members view office_bearers" ON public.office_bearers FOR SELECT TO authenticated USING (status = 'ACTIVE');

CREATE POLICY "Staff manage conventions" ON public.conventions FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));
CREATE POLICY "Members view conventions" ON public.conventions FOR SELECT TO authenticated
  USING (status IN ('HELD','MINUTES_FINALIZED','SUBMITTED'));

CREATE POLICY "Staff manage resolutions" ON public.convention_resolutions FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));
CREATE POLICY "Members view resolutions" ON public.convention_resolutions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage party_documents" ON public.party_documents FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));
CREATE POLICY "Members view member docs" ON public.party_documents FOR SELECT TO authenticated
  USING (visibility IN ('MEMBERS','PUBLIC'));
CREATE POLICY "Public view public docs" ON public.party_documents FOR SELECT TO anon USING (visibility = 'PUBLIC');

CREATE POLICY "Staff manage constitution" ON public.party_constitution_versions FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));
CREATE POLICY "Members view ratified constitution" ON public.party_constitution_versions FOR SELECT TO authenticated
  USING (status IN ('RATIFIED','SUBMITTED','ECI_APPROVED'));
CREATE POLICY "Public view ratified constitution" ON public.party_constitution_versions FOR SELECT TO anon
  USING (status IN ('RATIFIED','SUBMITTED','ECI_APPROVED'));

CREATE POLICY "Staff manage party_affidavits" ON public.party_affidavits FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));
CREATE POLICY "Staff manage newspaper_notices" ON public.newspaper_notices FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));
CREATE POLICY "Staff manage signature_sheets" ON public.signature_sheets FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));
CREATE POLICY "Staff manage party_accounts" ON public.party_accounts FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));
CREATE POLICY "Staff manage eci_correspondence" ON public.eci_correspondence FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));
CREATE POLICY "Anyone view symbol index" ON public.eci_symbol_index FOR SELECT USING (true);
CREATE POLICY "Members submit symbol recommendations" ON public.symbol_recommendations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members view own recommendations" ON public.symbol_recommendations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));
CREATE POLICY "Staff manage recommendations" ON public.symbol_recommendations FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('VERIFIER','ADMIN','SUPER_ADMIN'));

-- 14. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_office_bearers_status ON public.office_bearers(status);
CREATE INDEX IF NOT EXISTS idx_convention_resolutions_convention ON public.convention_resolutions(convention_id);
CREATE INDEX IF NOT EXISTS idx_party_documents_category ON public.party_documents(category);
CREATE INDEX IF NOT EXISTS idx_party_documents_visibility ON public.party_documents(visibility);
CREATE INDEX IF NOT EXISTS idx_constitution_status ON public.party_constitution_versions(status);
CREATE INDEX IF NOT EXISTS idx_notices_status ON public.newspaper_notices(status);
CREATE INDEX IF NOT EXISTS idx_signature_sheets_status ON public.signature_sheets(status);
CREATE INDEX IF NOT EXISTS idx_symbol_recs_status ON public.symbol_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_correspondence_filing ON public.eci_correspondence(filing_id);

-- 15. SHEET NUMBER GENERATOR
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.signature_sheet_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_sheet_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'SHT-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.signature_sheet_seq')::text, 5, '0');
$$;

-- 16. COMMENTS
-- ============================================================================
COMMENT ON TABLE public.office_bearers IS 'ECI-mandated office bearer registry. Founding National President seeded; future bearers elected via convention or meeting resolutions recorded in-app.';
COMMENT ON TABLE public.party_documents IS 'Unified party document vault with visibility tiers: STAFF (internal), MEMBERS (all authenticated members), PUBLIC (anyone).';
COMMENT ON TABLE public.signature_sheets IS 'Printable signature sheets: generated in-app, printed, physically signed, scanned and uploaded back for verification.';
COMMENT ON TABLE public.eci_symbol_index IS 'Curated ECI free symbol pool for preference selection. Chimta (Tongs) noted as previously allotted during independent run.';

