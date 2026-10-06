import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Upload,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { delhiConstituenciesAndWards } from "@/lib/delhi_data";
import {
  CONSTITUTIONAL_DECLARATION_V1,
  DATA_CONSENT_V1,
  MEMBERSHIP_CATEGORIES,
  PARTICIPATION_AREAS,
} from "@/lib/declarations";

const STEPS = [
  { step: 1, title: "Participation", label: "Bhagidaari" },
  { step: 2, title: "Personal Details", label: "Aapki Jaankari" },
  { step: 3, title: "Location", label: "Aapka Pata" },
  { step: 4, title: "Participation Interests", label: "Kaise Madad Karenge" },
  { step: 5, title: "Category", label: "Shreni" },
  { step: 6, title: "Declaration", label: "Ghoshna" },
  { step: 7, title: "Consent", label: "Privacy Sahamati" },
  { step: 8, title: "Verification & Review", label: "Review & Sign" },
];

export function InductionWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedApp, setSubmittedApp] = useState<{ id: string; number: string } | null>(null);

  const [participationRole, setParticipationRole] = useState<"member" | "volunteer">("member");

  const [personalDetails, setPersonalDetails] = useState({
    full_legal_name: "",
    parent_or_guardian_name: "",
    date_of_birth: "",
    gender: "Male",
    occupation: "",
    phone: "",
    email: "",
    address_line1: "",
    address_line2: "",
    state: "Delhi",
    district: "South East",
    vidhan_sabha: "Okhla",
    ward: "Zakir Nagar (W)",
    pincode: "110025",
  });

  const [electoralDetails, setElectoralDetails] = useState({
    identity_proof_type: "Voter ID (EPIC)",
    epic_number: "",
    vidhan_sabha: "Okhla",
    part_number: "",
    serial_number: "",
    polling_station: "",
    identity_document_id: "",
  });

  const [uploadedDoc, setUploadedDoc] = useState<{
    id: string;
    filename: string;
    sha256: string;
    extractedFields?: Record<string, string>;
  } | null>(null);

  const [membershipCategory, setMembershipCategory] = useState("Primary Member");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const [declarationAgreed, setDeclarationAgreed] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");

  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedMsg, setDraftSavedMsg] = useState("");
  const [correctionNotes, setCorrectionNotes] = useState<string | null>(null);

  const vidhanSabhas = Object.keys(delhiConstituenciesAndWards);
  const availableWards =
    delhiConstituenciesAndWards[
      personalDetails.vidhan_sabha as keyof typeof delhiConstituenciesAndWards
    ] || [];

  useEffect(() => {
    async function loadUserData() {
      if (!supabase) return;
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setNeedsAuth(true);
        setLoading(false);
        return;
      }

      setPersonalDetails((prev) => ({
        ...prev,
        email: session.user.email || "",
      }));

      // Check existing application
      const token = session.access_token;
      try {
        const res = await fetch("/api/v1/member/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.application) {
            const app = data.application;
            if (app.status === "APPROVED" || app.status === "SUBMITTED" || app.status === "UNDER_REVIEW") {
              setSubmittedApp({
                id: app.id,
                number: app.application_number,
              });
            } else {
              if (app.status === "NEEDS_CORRECTION") {
                setCorrectionNotes(app.correction_notes);
              }
              if (app.membership_category) {
                setMembershipCategory(app.membership_category);
              }
              const addr = Array.isArray(app.member_addresses) ? app.member_addresses[0] : app.member_addresses;
              if (addr) {
                setPersonalDetails((prev) => ({
                  ...prev,
                  full_legal_name: addr.full_legal_name || prev.full_legal_name,
                  parent_or_guardian_name: addr.parent_or_guardian_name || prev.parent_or_guardian_name,
                  date_of_birth: addr.date_of_birth || prev.date_of_birth,
                  gender: addr.gender || prev.gender,
                  occupation: addr.occupation || prev.occupation,
                  phone: addr.phone || prev.phone,
                  email: addr.email || prev.email,
                  address_line1: addr.address_line1 || prev.address_line1,
                  address_line2: addr.address_line2 || prev.address_line2,
                  state: addr.state || prev.state,
                  district: addr.district || prev.district,
                  vidhan_sabha: addr.vidhan_sabha || prev.vidhan_sabha,
                  ward: addr.ward || prev.ward,
                  pincode: addr.pincode || prev.pincode,
                }));
              }
              const elec = Array.isArray(app.electoral_details) ? app.electoral_details[0] : app.electoral_details;
              if (elec) {
                setElectoralDetails((prev) => ({
                  ...prev,
                  identity_proof_type: elec.identity_proof_type || prev.identity_proof_type,
                  epic_number: elec.epic_number || prev.epic_number,
                  vidhan_sabha: elec.vidhan_sabha || prev.vidhan_sabha,
                  part_number: elec.part_number || prev.part_number,
                  serial_number: elec.serial_number || prev.serial_number,
                  polling_station: elec.polling_station || prev.polling_station,
                }));
              }
              const part = Array.isArray(app.member_participation) ? app.member_participation[0] : app.member_participation;
              if (part && Array.isArray(part.interest_areas)) {
                setSelectedInterests(part.interest_areas);
              }
              const docs = Array.isArray(app.documents) ? app.documents : [];
              if (docs.length > 0) {
                const lastDoc = docs[docs.length - 1];
                setUploadedDoc({
                  id: lastDoc.id,
                  filename: lastDoc.original_filename,
                  sha256: lastDoc.sha256_hash,
                });
              }
              const decl = Array.isArray(app.membership_declarations) ? app.membership_declarations[0] : app.membership_declarations;
              if (decl) {
                setDeclarationAgreed(decl.accepts_constitution !== false);
              }
              const cons = Array.isArray(app.membership_consents) ? app.membership_consents[0] : app.membership_consents;
              if (cons) {
                setConsentAgreed(true);
              }
              const sig = Array.isArray(app.signatures) ? app.signatures[0] : app.signatures;
              if (sig && sig.typed_name) {
                setTypedSignature(sig.typed_name);
              }
              if (addr?.full_legal_name) setStep(2);
            }
          }
        }
      } catch (err) {
        console.error("Error loading user induction status:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  async function saveDraft(silent = false) {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (!silent) setSavingDraft(true);
    setDraftSavedMsg("");

    try {
      const payload = {
        action: "draft",
        membershipCategory,
        personalDetails,
        electoralDetails,
        participation: {
          interest_areas: selectedInterests,
        },
        declaration: {
          declaration_text: CONSTITUTIONAL_DECLARATION_V1.text,
          declaration_version: CONSTITUTIONAL_DECLARATION_V1.version,
          bears_true_faith: declarationAgreed,
          upholds_sovereignty: declarationAgreed,
          accepts_constitution: declarationAgreed,
          no_other_party_membership: declarationAgreed,
          no_prohibited_conduct: declarationAgreed,
        },
        consent: {
          consent_text: DATA_CONSENT_V1.text,
          consent_version: DATA_CONSENT_V1.version,
        },
        signature: {
          signature_type: "TYPED_CONFIRMATION",
          typed_name: typedSignature.trim(),
          document_id: uploadedDoc?.id || null,
        },
      };

      const res = await fetch("/api/v1/member/induction", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok && !silent) {
        setDraftSavedMsg("✓ Aapka jawab save ho gaya. Kabhi bhi wapas aa sakte hain.");
        setTimeout(() => setDraftSavedMsg(""), 3500);
      }
    } catch {
      // ignore silent error
    } finally {
      if (!silent) setSavingDraft(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!supabase) {
      setError("Database service unavailable.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", "identity_proof");

    try {
      const res = await fetch("/api/v1/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadedDoc({
        id: data.document.id,
        filename: data.document.original_filename,
        sha256: data.document.sha256_hash,
        extractedFields: data.document.extracted_fields,
      });

      setElectoralDetails((prev) => ({
        ...prev,
        identity_document_id: data.document.id,
        epic_number: data.document.extracted_fields?.id_number || prev.epic_number,
      }));

      if (data.document.extracted_fields?.full_name && !personalDetails.full_legal_name) {
        setPersonalDetails((prev) => ({
          ...prev,
          full_legal_name: data.document.extracted_fields.full_name,
        }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Document upload failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleInterest(area: string) {
    setSelectedInterests((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  async function handleFinalSubmit() {
    if (!declarationAgreed) {
      setError("Please confirm the Constitutional Declaration before joining.");
      return;
    }
    if (!consentAgreed) {
      setError("Please confirm the Data & Privacy terms.");
      return;
    }
    if (!typedSignature.trim()) {
      setError("Please type your full legal name as your digital signature.");
      return;
    }

    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        action: "submit",
        membershipCategory,
        personalDetails,
        electoralDetails,
        participation: {
          interest_areas: selectedInterests,
        },
        declaration: {
          declaration_text: CONSTITUTIONAL_DECLARATION_V1.text,
          declaration_version: CONSTITUTIONAL_DECLARATION_V1.version,
          bears_true_faith: true,
          upholds_sovereignty: true,
          accepts_constitution: true,
          no_other_party_membership: true,
          no_prohibited_conduct: true,
        },
        consent: {
          consent_text: DATA_CONSENT_V1.text,
          consent_version: DATA_CONSENT_V1.version,
        },
        signature: {
          signature_type: "TYPED_CONFIRMATION",
          typed_name: typedSignature.trim(),
          document_id: uploadedDoc?.id || null,
        },
      };

      const res = await fetch("/api/v1/member/induction", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmittedApp({
        id: data.application_id,
        number: data.application_number,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit induction.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !uploadedDoc) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 16px", color: "var(--saffron)" }} />
        <p style={{ color: "var(--muted)" }}>Loading your profile...</p>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div
        className="card"
        style={{
          maxWidth: "600px",
          margin: "40px auto",
          padding: "40px 32px",
          textAlign: "center",
          background: "var(--paper-card)",
          borderRadius: "4px",
          border: "1px solid var(--line-strong)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        <ShieldCheck size={48} style={{ color: "var(--saffron)", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-serif)", marginBottom: "8px" }}>
          Sign In to Start Induction
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: "440px", margin: "0 auto 24px", lineHeight: 1.55 }}>
          To apply for founding membership under Phase 1, please sign in or register with your email.
        </p>
        <a href="/login" className="button button-primary" style={{ padding: "12px 28px", fontSize: "14.5px" }}>
          Sign In / Create Account &rarr;
        </a>
      </div>
    );
  }

  // Confirmation View (Step 9)
  if (submittedApp) {
    return (
      <div
        className="card"
        style={{
          maxWidth: "680px",
          margin: "30px auto",
          padding: "44px 32px",
          textAlign: "center",
          background: "var(--paper-card)",
          borderRadius: "4px",
          border: "1.5px solid var(--green)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        <CheckCircle2 size={52} style={{ color: "var(--green)", margin: "0 auto 16px" }} />
        
        <span
          style={{
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: "2px",
            backgroundColor: "rgba(4, 106, 56, 0.1)",
            color: "var(--green)",
            fontWeight: 700,
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            marginBottom: "12px",
            textTransform: "uppercase",
          }}
        >
          APPLICATION SUBMITTED · STATUS: UNDER REVIEW
        </span>

        <h2 style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-serif)", marginBottom: "6px" }}>
          Welcome to Nagrik Party
        </h2>
        
        <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: "480px", margin: "0 auto 20px", lineHeight: 1.55 }}>
          Your founding membership application has been received and logged under our Phase 1 regulatory framework.
        </p>

        <div
          style={{
            background: "var(--paper-subtle)",
            border: "1px solid var(--line)",
            borderRadius: "4px",
            padding: "16px 20px",
            maxWidth: "380px",
            margin: "0 auto 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            ORGANISATIONAL APPLICATION ID
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--saffron)", marginTop: "4px" }}>
            {submittedApp.number}
          </div>
          <small style={{ display: "block", fontSize: "11px", color: "var(--ink-faint)", marginTop: "4px" }}>
            Organisational record · Not a government-issued document
          </small>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <a href="/member" className="button button-primary" style={{ padding: "12px 24px" }}>
            Open Member Portal &rarr;
          </a>
          <a href="/member/status" className="button" style={{ padding: "12px 20px" }}>
            Track Verification Status
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto" }}>
      
      {/* Step Indicator Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "11.5px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--saffron)", textTransform: "uppercase" }}>
            Step {step} of {STEPS.length} · {STEPS[step - 1]?.label}
          </span>
          <button
            type="button"
            onClick={() => saveDraft(false)}
            disabled={savingDraft}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              fontSize: "12px",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            {savingDraft ? "Save ho raha hai..." : "Draft save karein, baad me poora karein"}
          </button>
        </div>

        {/* Visual Step Progress Bar */}
        <div style={{ width: "100%", height: "4px", background: "var(--paper-subtle)", borderRadius: "2px", overflow: "hidden" }}>
          <div
            style={{
              width: `${(step / STEPS.length) * 100}%`,
              height: "100%",
              background: "var(--saffron)",
              transition: "width 0.25s ease",
            }}
          />
        </div>

        {draftSavedMsg && (
          <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--green)", fontWeight: 600 }}>
            ✓ {draftSavedMsg}
          </div>
        )}

        {error && (
          <div style={{ marginTop: "10px", padding: "10px 14px", background: "#fff1f0", border: "1px solid #ffa39e", borderRadius: "3px", color: "var(--red)", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Main Step Body */}
      <div
        className="form-surface"
        style={{
          background: "var(--paper-card)",
          border: "1px solid var(--line-strong)",
          borderRadius: "4px",
          padding: "clamp(22px, 3.5vw, 36px)",
          boxShadow: "var(--shadow)",
        }}
      >
        
        {/* STEP 1: ENTRY - Participation Choice */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: "0 0 8px" }}>
              How would you like to participate?
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 24px", lineHeight: 1.55 }}>
              Choose whether you want to formally join as a founding voter member or contribute as a volunteer.
            </p>

            <div style={{ display: "grid", gap: "14px", marginBottom: "28px" }}>
              <div
                onClick={() => setParticipationRole("member")}
                style={{
                  padding: "20px 22px",
                  borderRadius: "4px",
                  border: participationRole === "member" ? "2px solid var(--saffron)" : "1px solid var(--line)",
                  background: participationRole === "member" ? "var(--paper-subtle)" : "var(--paper-card)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "16px", color: "var(--ink)", display: "block" }}>
                    Become a Founding Member
                  </strong>
                  <span style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px", display: "block" }}>
                    "I want to formally join Nagrik Party."
                    Verify voter details and receive your organizational Nagrik ID record under Section 29A RPA 1951.
                  </span>
                </div>
                <input
                  type="radio"
                  name="role"
                  checked={participationRole === "member"}
                  onChange={() => {}}
                  style={{ accentColor: "var(--saffron)", width: "18px", height: "18px" }}
                />
              </div>

              <div
                onClick={() => setParticipationRole("volunteer")}
                style={{
                  padding: "20px 22px",
                  borderRadius: "4px",
                  border: participationRole === "volunteer" ? "2px solid var(--green)" : "1px solid var(--line)",
                  background: participationRole === "volunteer" ? "var(--paper-subtle)" : "var(--paper-card)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "16px", color: "var(--ink)", display: "block" }}>
                    Become a Volunteer
                  </strong>
                  <span style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px", display: "block" }}>
                    "I want to contribute my time or skills."
                    Help with ground checks, research, design, media, and outreach.
                  </span>
                </div>
                <input
                  type="radio"
                  name="role"
                  checked={participationRole === "volunteer"}
                  onChange={() => {}}
                  style={{ accentColor: "var(--green)", width: "18px", height: "18px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  saveDraft(true);
                  setStep(2);
                }}
                style={{ padding: "12px 28px" }}
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Let's get to know you */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: "0 0 8px" }}>
              Let's get to know you.
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 24px" }}>
              Please enter your full name as it appears on official records.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={personalDetails.full_legal_name}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, full_legal_name: e.target.value })}
                  placeholder="e.g. Sheikh Arsalanullah"
                  className="input"
                />
              </div>

              <div className="field">
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Parent / Guardian Name *</label>
                <input
                  type="text"
                  required
                  value={personalDetails.parent_or_guardian_name}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, parent_or_guardian_name: e.target.value })}
                  placeholder="Father / Mother / Guardian"
                  className="input"
                />
              </div>

              <div className="field">
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={personalDetails.date_of_birth}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, date_of_birth: e.target.value })}
                  className="input"
                />
              </div>

              <div className="field">
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={personalDetails.phone}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className="input"
                />
              </div>

              <div className="field">
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={personalDetails.email}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, email: e.target.value })}
                  className="input"
                />
              </div>

              <div className="field">
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Gender</label>
                <select
                  value={personalDetails.gender}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, gender: e.target.value })}
                  className="input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="field">
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Occupation (Optional)</label>
                <input
                  type="text"
                  value={personalDetails.occupation}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, occupation: e.target.value })}
                  placeholder="e.g. Teacher, Engineer, Trader"
                  className="input"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button type="button" className="button" onClick={() => setStep(1)}>
                &larr; Back
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  if (!personalDetails.full_legal_name || !personalDetails.phone) {
                    setError("Please enter your name and mobile number.");
                    return;
                  }
                  setError("");
                  saveDraft(true);
                  setStep(3);
                }}
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Where do you live? */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: "0 0 8px" }}>
              Where do you live?
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 24px" }}>
              Delhi constituency and ward mapping for Section 29A founding member compliance.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
              <div className="field">
                <label style={{ fontSize: "13px", fontWeight: 600 }}>State / UT</label>
                <input type="text" value={personalDetails.state} disabled className="input" style={{ background: "var(--paper-subtle)" }} />
              </div>

              <div className="field">
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Assembly Constituency (Vidhan Sabha) *</label>
                <select
                  value={personalDetails.vidhan_sabha}
                  onChange={(e) => {
                    const vs = e.target.value;
                    const wards = delhiConstituenciesAndWards[vs as keyof typeof delhiConstituenciesAndWards] || [];
                    setPersonalDetails({
                      ...personalDetails,
                      vidhan_sabha: vs,
                      ward: wards[0] || "",
                    });
                  }}
                  className="input"
                >
                  {vidhanSabhas.map((vs) => (
                    <option key={vs} value={vs}>{vs}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Ward / Area</label>
                <select
                  value={personalDetails.ward}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, ward: e.target.value })}
                  className="input"
                >
                  {availableWards.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Pincode *</label>
                <input
                  type="text"
                  required
                  value={personalDetails.pincode}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, pincode: e.target.value })}
                  placeholder="1100XX"
                  className="input"
                />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Residential Address *</label>
                <input
                  type="text"
                  required
                  value={personalDetails.address_line1}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, address_line1: e.target.value })}
                  placeholder="House / Flat No., Street, Locality"
                  className="input"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button type="button" className="button" onClick={() => setStep(2)}>
                &larr; Back
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  if (!personalDetails.address_line1) {
                    setError("Please enter your residential address.");
                    return;
                  }
                  setError("");
                  saveDraft(true);
                  setStep(4);
                }}
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: What would you like to help with? */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: "0 0 8px" }}>
              What would you like to help with?
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 20px" }}>
              Select your preferred areas of participation. You can pick multiple.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "28px" }}>
              {PARTICIPATION_AREAS.map((area) => {
                const isSelected = selectedInterests.includes(area);
                return (
                  <div
                    key={area}
                    onClick={() => toggleInterest(area)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "4px",
                      border: isSelected ? "1.5px solid var(--saffron)" : "1px solid var(--line)",
                      background: isSelected ? "var(--paper-subtle)" : "var(--paper-card)",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? "var(--ink)" : "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{area}</span>
                    {isSelected && <Check size={14} style={{ color: "var(--saffron)" }} />}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button type="button" className="button" onClick={() => setStep(3)}>
                &larr; Back
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  saveDraft(true);
                  setStep(5);
                }}
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Membership Category */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: "0 0 8px" }}>
              Membership Category
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 20px" }}>
              Choose the category of your participation in Nagrik Party.
            </p>

            <div style={{ display: "grid", gap: "12px", marginBottom: "28px" }}>
              {MEMBERSHIP_CATEGORIES.map((cat) => {
                const isSelected = membershipCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setMembershipCategory(cat.id)}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "4px",
                      border: isSelected ? "1.5px solid var(--saffron)" : "1px solid var(--line)",
                      background: isSelected ? "var(--paper-subtle)" : "var(--paper-card)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "15px", color: "var(--ink)", display: "block" }}>
                        {cat.id}
                      </strong>
                      <span style={{ fontSize: "12.5px", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                        {cat.desc}
                      </span>
                    </div>
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ accentColor: "var(--saffron)", width: "16px", height: "16px" }}
                    />
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button type="button" className="button" onClick={() => setStep(4)}>
                &larr; Back
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  saveDraft(true);
                  setStep(6);
                }}
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Before you join, you need to confirm a few things. (Constitutional Declaration) */}
        {step === 6 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: "0 0 8px" }}>
              Before you join, you need to confirm a few things.
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 20px" }}>
              Statutory declaration under Section 29A of the Representation of the People Act, 1951.
            </p>

            <div
              style={{
                background: "var(--paper-subtle)",
                border: "1px solid var(--line-strong)",
                borderRadius: "4px",
                padding: "20px 22px",
                marginBottom: "24px",
                fontSize: "13.5px",
                lineHeight: 1.65,
                color: "var(--ink-body)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "8px", color: "var(--ink)" }}>
                Constitutional & Statutory Commitments:
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "6px" }}>
                <li>I bear true faith and allegiance to the Constitution of India as by law established.</li>
                <li>I uphold the sovereignty, unity, and integrity of India.</li>
                <li>I commit to secularism, democratic principles, and peaceful constitutional methods.</li>
                <li>I subscribe to the Draft Constitution and Code of Conduct of Nagrik Party.</li>
                <li>I confirm that I am not a registered member of any other political party.</li>
              </ul>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "4px",
                background: declarationAgreed ? "rgba(4, 106, 56, 0.06)" : "var(--paper-card)",
                border: declarationAgreed ? "1.5px solid var(--green)" : "1px solid var(--line)",
                cursor: "pointer",
                marginBottom: "28px",
              }}
            >
              <input
                type="checkbox"
                checked={declarationAgreed}
                onChange={(e) => setDeclarationAgreed(e.target.checked)}
                style={{ accentColor: "var(--green)", width: "18px", height: "18px", marginTop: "2px" }}
              />
              <span style={{ fontSize: "13.5px", color: "var(--ink)", fontWeight: 600, lineHeight: 1.5 }}>
                I confirm and agree to the Constitutional Declaration of Nagrik Party.
              </span>
            </label>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button type="button" className="button" onClick={() => setStep(5)}>
                &larr; Back
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  if (!declarationAgreed) {
                    setError("Please check the confirmation box to proceed.");
                    return;
                  }
                  setError("");
                  saveDraft(true);
                  setStep(7);
                }}
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: Data Consent */}
        {step === 7 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: "0 0 8px" }}>
              Data Protection & Statutory Consent
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 20px" }}>
              How your membership records and documents are protected.
            </p>

            <div
              style={{
                background: "var(--paper-subtle)",
                border: "1px solid var(--line)",
                borderRadius: "4px",
                padding: "20px 22px",
                marginBottom: "24px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--ink-body)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "8px", color: "var(--ink)" }}>
                Our Privacy Pledge to You:
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", display: "grid", gap: "6px" }}>
                <li>Your voter ID number, address proof, and contact details are strictly confidential.</li>
                <li>We never display personal identity documents on public pages.</li>
                <li>Records are compiled exclusively for party records and Section 29A regulatory submission to the Election Commission of India.</li>
                <li>Your digital induction record receives an immutable cryptographic SHA-256 integrity hash.</li>
              </ul>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "4px",
                background: consentAgreed ? "rgba(22, 53, 92, 0.06)" : "var(--paper-card)",
                border: consentAgreed ? "1.5px solid var(--blue)" : "1px solid var(--line)",
                cursor: "pointer",
                marginBottom: "28px",
              }}
            >
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
                style={{ accentColor: "var(--blue)", width: "18px", height: "18px", marginTop: "2px" }}
              />
              <span style={{ fontSize: "13.5px", color: "var(--ink)", fontWeight: 600, lineHeight: 1.5 }}>
                I consent to the collection and regulatory verification of my details for party membership records.
              </span>
            </label>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button type="button" className="button" onClick={() => setStep(6)}>
                &larr; Back
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  if (!consentAgreed) {
                    setError("Please check the consent box to proceed.");
                    return;
                  }
                  setError("");
                  saveDraft(true);
                  setStep(8);
                }}
              >
                Continue to Review &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 8: Review & Verification */}
        {step === 8 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-serif)", margin: "0 0 8px" }}>
              Review & Identity Verification
            </h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 20px" }}>
              Upload proof of voter registration (EPIC Voter ID) and provide your typed signature.
            </p>

            {/* Document Upload Box */}
            <div
              style={{
                border: "1.5px dashed var(--line-strong)",
                borderRadius: "4px",
                padding: "24px",
                textAlign: "center",
                background: "var(--paper-subtle)",
                marginBottom: "24px",
              }}
            >
              <Upload size={32} style={{ color: "var(--saffron)", margin: "0 auto 10px" }} />
              <strong style={{ display: "block", fontSize: "15px", color: "var(--ink)", marginBottom: "4px" }}>
                {uploadedDoc ? "Document Upload Ho Gaya ✓" : "Voter ID / Pehchaan Patra Upload Karein"}
              </strong>
              <p style={{ fontSize: "12.5px", color: "var(--muted)", margin: "0 0 14px" }}>
                JPG, PNG ya PDF chalega (Max 5MB). File verify hogi aur SHA-256 se hash hogi.
              </p>

              {uploadedDoc ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(4, 106, 56, 0.1)", color: "var(--green)", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> {uploadedDoc.filename}
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {/* Camera-first: on mobile opens camera directly */}
                  <label
                    className="button button-primary"
                    style={{ minHeight: "52px", cursor: "pointer", fontSize: "15px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    📷 Photo Kheenchein
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      capture="environment"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                  <label
                    className="button"
                    style={{ minHeight: "52px", cursor: "pointer", fontSize: "14px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    📁 Gallery / PDF se Chunein
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="field" style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>EPIC Voter ID Number (Optional at draft, required for full verification)</label>
              <input
                type="text"
                value={electoralDetails.epic_number}
                onChange={(e) => setElectoralDetails({ ...electoralDetails, epic_number: e.target.value })}
                placeholder="e.g. ABC1234567"
                className="input"
              />
            </div>

            <div className="field" style={{ marginBottom: "28px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Typed Digital Signature *</label>
              <input
                type="text"
                required
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Apna poora kanooni naam likhein"
                className="input"
                style={{ fontFamily: "var(--font-sans)", fontSize: "17px", minHeight: "52px" }}
              />
              <small style={{ color: "var(--muted)", fontSize: "12px" }}>
                Naam likhna aapka kanooni digital signature maana jayega.
              </small>
            </div>

            {/* Application Summary Review */}
            <div style={{ background: "var(--paper-subtle)", padding: "16px 20px", borderRadius: "4px", border: "1px solid var(--line)", marginBottom: "28px", fontSize: "13px" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px", color: "var(--ink)" }}>Application Summary:</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                <div><strong>Name:</strong> {personalDetails.full_legal_name || "–"}</div>
                <div><strong>Phone:</strong> {personalDetails.phone || "–"}</div>
                <div><strong>Constituency:</strong> {personalDetails.vidhan_sabha} ({personalDetails.ward || "–"})</div>
                <div><strong>Category:</strong> {membershipCategory}</div>
                <div><strong>Role:</strong> {participationRole === "member" ? "Founding Member" : "Volunteer"}</div>
                <div><strong>Interests:</strong> {selectedInterests.join(", ") || "General"}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <button type="button" className="button" onClick={() => setStep(7)} disabled={submitting} style={{ minHeight: "44px" }}>
                &larr; Back
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={handleFinalSubmit}
                disabled={submitting}
                style={{ padding: "12px 32px", fontSize: "15px", minHeight: "44px" }}
              >
                {submitting ? "Submitting Application..." : "Join Nagrik Party &rarr;"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
