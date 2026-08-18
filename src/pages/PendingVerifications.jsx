import { useEffect, useMemo, useState, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  AlertTriangle,
  BadgeCheck,
  Brain,
  Clipboard,
  Clock3,
  Eye,
  FileText,
  Mail,
  RefreshCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  UserX,
  X,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  ZoomIn,
  Building2,
  Phone,
  Hash,
  CalendarDays,
} from "lucide-react";

import { db } from "../config/firebase";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import ErrorAlert from "../components/Common/ErrorAlert";
import SuccessAlert from "../components/Common/SuccessAlert";
import { logApproval, logRejection } from "../services/auditService";

/* ─────────────────────────────────────────────────────────────────────────────
   THRESHOLD ALIGNMENT NOTE
   ─────────────────────────────────────────────────────────────────────────────
   Flask / ai_service.py is the SINGLE SOURCE OF TRUTH for risk and
   recommendation. It writes riskLevel and verificationRecommendation into
   Firestore after every AI run. This file READS those stored values and falls
   back to re-deriving them only when they are absent (e.g. legacy records).

   Flask thresholds (must stay in sync with ai_service.py _build_decision):
     confidence >= 75 AND documentConfidence >= 75  → approve  / Low Risk
     confidence >= 55 (else)                        → manual   / Medium Risk
     confidence <  55                               → reject   / High Risk

   The OLD local thresholds (85 / 80 / 75 / 70) have been removed; they were
   causing Flask to say "approve" at 78 % while the dashboard showed "reject".
   ───────────────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────
   Data helpers
───────────────────────────────────────── */

function getFileStatus(user) {
  const documentUrl =
    user.idDocumentUrl || user.idDocumentURL || user.documentURL ||
    user.documentUrl || user.licenseURL || user.licenseUrl ||
    user.imageURL || user.profileImageUrl || "";
  const documentLocalPath =
    user.documentLocalPath || user.idDocumentLocalPath || user.licenseLocalPath || "";
  const selfieUrl =
    user.selfieURL || user.selfieUrl || user.selfieImageURL || "";
  const selfieLocalPath = user.selfieLocalPath || user.selfiePath || "";
  const hasDocument =
    Boolean(documentUrl) || Boolean(documentLocalPath) ||
    user.documentsUploaded === true;
  const hasLicense =
    Boolean(user.licenseURL) || Boolean(user.licenseUrl) ||
    Boolean(user.documentURL) || Boolean(user.documentLocalPath) ||
    Boolean(user.licenseNumber) || user.documentsUploaded === true;
  const hasSelfie =
    Boolean(selfieUrl) || Boolean(selfieLocalPath) || user.faceMatch === true;
  return {
    documentUrl, documentLocalPath,
    selfieUrl, selfieLocalPath,
    hasDocument, hasLicense, hasSelfie,
  };
}

function getAiNumbers(user) {
  return {
    aiScore:            Number(user.aiScore            || user.faceMatchScore || 0),
    faceConfidence:     Number(user.confidence         || user.faceConfidence || 0),
    documentConfidence: Number(user.documentConfidence || 0),
  };
}

/**
 * getRiskLevel — reads the riskLevel already stored by Flask in Firestore.
 * Falls back to re-deriving only for legacy records that pre-date the Flask
 * write (when riskLevel is absent). Thresholds match _build_decision exactly.
 */
function getRiskLevel(user) {
  /* ── Prefer stored value from Flask ── */
  const stored = (user.riskLevel || "").toLowerCase();
  if (stored === "low" || stored === "low risk") {
    return {
      level: "Low Risk",
      className: "pv-pill pv-pill-teal",
      chipClassName: "pv-risk-chip pv-pill-teal",
      icon: <ShieldCheck size={14} />,
      sortOrder: 1,
    };
  }
  if (stored === "medium" || stored === "medium risk") {
    return {
      level: "Medium Risk",
      className: "pv-pill pv-pill-amber",
      chipClassName: "pv-risk-chip pv-pill-amber",
      icon: <Clock3 size={14} />,
      sortOrder: 2,
    };
  }
  if (stored === "high" || stored === "high risk") {
    return {
      level: "High Risk",
      className: "pv-pill pv-pill-red",
      chipClassName: "pv-risk-chip pv-pill-red",
      icon: <AlertTriangle size={14} />,
      sortOrder: 3,
    };
  }

  /* ── Fallback: re-derive using Flask thresholds (legacy records) ── */
  const { faceConfidence, documentConfidence } = getAiNumbers(user);
  const files = getFileStatus(user);
  const hasCriticalMissing =
    !user.licenseNumber || !files.hasDocument || !files.hasSelfie;

  if (
    hasCriticalMissing ||
    user.faceMatch === false ||
    faceConfidence < 55 ||
    documentConfidence < 55
  ) {
    return {
      level: "High Risk",
      className: "pv-pill pv-pill-red",
      chipClassName: "pv-risk-chip pv-pill-red",
      icon: <AlertTriangle size={14} />,
      sortOrder: 3,
    };
  }
  if (faceConfidence < 75 || documentConfidence < 75) {
    return {
      level: "Medium Risk",
      className: "pv-pill pv-pill-amber",
      chipClassName: "pv-risk-chip pv-pill-amber",
      icon: <Clock3 size={14} />,
      sortOrder: 2,
    };
  }
  return {
    level: "Low Risk",
    className: "pv-pill pv-pill-teal",
    chipClassName: "pv-risk-chip pv-pill-teal",
    icon: <ShieldCheck size={14} />,
    sortOrder: 1,
  };
}

/**
 * getVerificationRecommendation — reads Flask's stored recommendation first.
 * Falls back to re-deriving using Flask thresholds for legacy records.
 * Never applies the old local 85/80/75 thresholds.
 */
function getVerificationRecommendation(user) {
  const files = getFileStatus(user);
  const { faceConfidence, documentConfidence } = getAiNumbers(user);

  /* ── Hard blockers (always checked, regardless of stored value) ── */
  const blockers = [];
  if (!user.licenseNumber)   blockers.push("Missing license number");
  if (!files.hasDocument)    blockers.push("Missing ID/license document");
  if (!files.hasSelfie)      blockers.push("Missing selfie photo");
  if (user.faceMatch === false) blockers.push("Face match failed");

  if (blockers.length > 0) {
    return {
      type: "reject",
      label: "Recommended Rejection",
      reason: blockers.join(" • "),
      boxClassName: "pv-recommend-box pv-recommend-reject",
      icon: <UserX size={18} />,
    };
  }

  /* ── Prefer Flask-stored recommendation ── */
  const stored = (
    user.verificationRecommendation ||
    user.recommendation ||
    ""
  ).toLowerCase();

  if (stored === "approve" || stored === "recommended approval") {
    return {
      type: "approve",
      label: "Recommended Approval",
      reason:
        "AI confidence, document confidence, and face match all passed Flask thresholds (≥ 75 %).",
      boxClassName: "pv-recommend-box pv-recommend-approve",
      icon: <UserCheck size={18} />,
    };
  }
  if (stored === "manual_review" || stored === "manual review" || stored === "manual review required") {
    return {
      type: "review",
      label: "Manual Review Required",
      reason: `Face confidence ${faceConfidence}% or document confidence ${documentConfidence}% is between 55–74%. Admin review needed.`,
      boxClassName: "pv-recommend-box pv-recommend-review",
      icon: <AlertTriangle size={18} />,
    };
  }
  if (stored === "reject" || stored === "recommended rejection") {
    return {
      type: "reject",
      label: "Recommended Rejection",
      reason: `Confidence below Flask reject threshold (< 55%). Face: ${faceConfidence}%, Doc: ${documentConfidence}%.`,
      boxClassName: "pv-recommend-box pv-recommend-reject",
      icon: <UserX size={18} />,
    };
  }

  /* ── Fallback: derive from Flask thresholds for legacy records ── */
  if (
    user.faceMatch === true &&
    faceConfidence >= 75 &&
    documentConfidence >= 75
  ) {
    return {
      type: "approve",
      label: "Recommended Approval",
      reason: "AI confidence, document confidence, and face match all passed Flask thresholds (≥ 75 %).",
      boxClassName: "pv-recommend-box pv-recommend-approve",
      icon: <UserCheck size={18} />,
    };
  }
  if (faceConfidence >= 55) {
    return {
      type: "review",
      label: "Manual Review Required",
      reason: `Face confidence ${faceConfidence}% or document confidence ${documentConfidence}% is between 55–74%. Admin review needed.`,
      boxClassName: "pv-recommend-box pv-recommend-review",
      icon: <AlertTriangle size={18} />,
    };
  }
  return {
    type: "reject",
    label: "Recommended Rejection",
    reason: `Face confidence ${faceConfidence}% is below the Flask reject threshold (< 55%).`,
    boxClassName: "pv-recommend-box pv-recommend-reject",
    icon: <UserX size={18} />,
  };
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function PendingVerifications() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [selectedUser, setSelectedUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [filterRole, setFilterRole] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [noteModal, setNoteModal] = useState(null);
  const [noteValue, setNoteValue] = useState("");
  const [reasonValue, setReasonValue] = useState("");

  useEffect(() => {
    setMounted(true);
    const usersRef = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const list = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((user) => user.approved !== true && user.rejected !== true);
        setUsers(list);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
      },
      (err) => {
        console.error("Pending verifications error:", err);
        setError("Failed to load pending verifications. Check Firestore index/rules.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  /* ── Derived data ── */
  const roles = useMemo(() => {
    const set = new Set(
      users.map((u) => String(u.role || "").toLowerCase()).filter(Boolean)
    );
    return ["all", ...Array.from(set)];
  }, [users]);

  const filteredUsers = useMemo(() => {
    const value = search.toLowerCase().trim();
    return users
      .filter((user) => {
        const name          = String(user.name           || "").toLowerCase();
        const email         = String(user.email          || "").toLowerCase();
        const role          = String(user.role           || "").toLowerCase();
        const hospital      = String(user.hospitalName   || "").toLowerCase();
        const license       = String(user.licenseNumber  || "").toLowerCase();
        const specialization= String(user.specialization || "").toLowerCase();
        const status        = String(user.verificationStatus || user.status || "").toLowerCase();
        const risk          = getRiskLevel(user).level.toLowerCase();
        const matchesSearch =
          !value ||
          name.includes(value) || email.includes(value) ||
          role.includes(value) || hospital.includes(value) ||
          license.includes(value) || specialization.includes(value) ||
          status.includes(value) || risk.includes(value);
        const matchesRole = filterRole === "all" || role === filterRole;
        const matchesRisk =
          filterRisk === "all" ||
          getRiskLevel(user).level.toLowerCase().includes(filterRisk);
        return matchesSearch && matchesRole && matchesRisk;
      })
      .sort((a, b) => {
        let aVal, bVal;
        if (sortField === "name") {
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
        } else if (sortField === "aiScore") {
          aVal = getAiNumbers(a).aiScore;
          bVal = getAiNumbers(b).aiScore;
        } else if (sortField === "risk") {
          aVal = getRiskLevel(a).sortOrder;
          bVal = getRiskLevel(b).sortOrder;
        } else {
          aVal = a.createdAt?.seconds || 0;
          bVal = b.createdAt?.seconds || 0;
        }
        return sortDir === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
  }, [users, search, filterRole, filterRisk, sortField, sortDir]);

  const stats = useMemo(() => ({
    pending:    users.length,
    doctors:    users.filter((u) => String(u.role || "").toLowerCase() === "doctor").length,
    /* Use stored Flask recommendation for stat cards */
    highAi:     users.filter((u) => getVerificationRecommendation(u).type === "approve").length,
    needReview: users.filter((u) => getVerificationRecommendation(u).type !== "approve").length,
  }), [users]);

  /* ── Handlers ── */
  const handleCopy = useCallback(async (text, label) => {
    if (!text) { setError(`${label} is empty.`); return; }
    try {
      await navigator.clipboard.writeText(text);
      setSuccess(`${label} copied to clipboard.`);
    } catch {
      setError("Copy failed. Please try again.");
    }
  }, []);

  const openApproveFlow = useCallback((user) => {
    const recommendation = getVerificationRecommendation(user);
    const { faceConfidence, documentConfidence } = getAiNumbers(user);
    const defaultNote =
      recommendation.type === "approve"
        ? `AI confidence ${faceConfidence}%, document confidence ${documentConfidence}%, face match passed. All Flask thresholds (≥ 75%) met.`
        : `Manual override approval. Flask recommendation was: ${recommendation.label}.`;
    setNoteValue(defaultNote);
    setReasonValue("");
    setNoteModal({ user, type: "approve" });
  }, []);

  const openRejectFlow = useCallback((user) => {
    const recommendation = getVerificationRecommendation(user);
    const { faceConfidence, documentConfidence } = getAiNumbers(user);
    const defaultReason =
      recommendation.type === "reject"
        ? recommendation.reason
        : `Documents did not meet verification requirements. Confidence: ${faceConfidence}%, Doc: ${documentConfidence}%.`;
    setReasonValue(defaultReason);
    setNoteValue(`Rejected after admin review. Reason: ${defaultReason}`);
    setNoteModal({ user, type: "reject" });
  }, []);

  const handleNoteConfirm = useCallback(() => {
    if (!noteModal) return;
    setConfirmModal({
      type:   noteModal.type,
      user:   noteModal.user,
      note:   noteValue,
      reason: reasonValue,
    });
    setNoteModal(null);
  }, [noteModal, noteValue, reasonValue]);

  const handleConfirmedApprove = useCallback(async () => {
    if (!confirmModal) return;
    const { user, note } = confirmModal;
    const recommendation = getVerificationRecommendation(user);
    try {
      setProcessingId(user.id);
      setError("");
      setSuccess("");
      setConfirmModal(null);
      await updateDoc(doc(db, "users", user.id), {
        approved:                  true,
        rejected:                  false,
        status:                    "verified",
        verificationStatus:        "verified",
        /* Preserve Flask-written values; don't overwrite with recomputed ones */
        riskLevel:                 user.riskLevel || getRiskLevel(user).level,
        verificationRecommendation: recommendation.label,
        adminNotes:                note.trim(),
        reviewedBy:                "Web Admin",
        reviewedAt:                serverTimestamp(),
        verifiedAt:                serverTimestamp(),
        updatedAt:                 serverTimestamp(),
      });
      try {
        await logApproval({
          ...user,
          riskLevel:                 user.riskLevel || getRiskLevel(user).level,
          verificationRecommendation: recommendation.label,
          adminNotes:                note.trim(),
        });
      } catch (auditError) {
        console.warn("Audit approval log failed:", auditError);
      }
      setSelectedUser(null);
      setSuccess(`✓ ${user.name || "User"} has been approved successfully.`);
    } catch (err) {
      console.error("Approve error:", err);
      setError("Failed to approve user. Check Firestore rules and permissions.");
    } finally {
      setProcessingId("");
    }
  }, [confirmModal]);

  const handleConfirmedReject = useCallback(async () => {
    if (!confirmModal) return;
    const { user, note, reason } = confirmModal;
    const recommendation = getVerificationRecommendation(user);
    const finalReason =
      reason.trim() || "Documents did not meet verification requirements.";
    try {
      setProcessingId(user.id);
      setError("");
      setSuccess("");
      setConfirmModal(null);
      await updateDoc(doc(db, "users", user.id), {
        approved:                  false,
        rejected:                  true,
        status:                    "rejected",
        verificationStatus:        "rejected",
        riskLevel:                 user.riskLevel || getRiskLevel(user).level,
        verificationRecommendation: recommendation.label,
        rejectionReason:           finalReason,
        adminNotes:                note.trim(),
        reviewedBy:                "Web Admin",
        reviewedAt:                serverTimestamp(),
        rejectedAt:                serverTimestamp(),
        updatedAt:                 serverTimestamp(),
      });
      try {
        await logRejection(
          {
            ...user,
            riskLevel:                 user.riskLevel || getRiskLevel(user).level,
            verificationRecommendation: recommendation.label,
            adminNotes:                note.trim(),
          },
          finalReason
        );
      } catch (auditError) {
        console.warn("Audit rejection log failed:", auditError);
      }
      setSelectedUser(null);
      setSuccess(`✗ ${user.name || "User"} has been rejected.`);
    } catch (err) {
      console.error("Reject error:", err);
      setError("Failed to reject user. Check Firestore rules and permissions.");
    } finally {
      setProcessingId("");
    }
  }, [confirmModal]);

  const handleBulkApprove = useCallback(async () => {
    if (bulkSelected.length === 0) return;
    const eligible = bulkSelected
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean);
    setBulkProcessing(true);
    let count = 0;
    for (const user of eligible) {
      try {
        const recommendation = getVerificationRecommendation(user);
        await updateDoc(doc(db, "users", user.id), {
          approved:                  true,
          rejected:                  false,
          status:                    "verified",
          verificationStatus:        "verified",
          riskLevel:                 user.riskLevel || getRiskLevel(user).level,
          verificationRecommendation: recommendation.label,
          adminNotes:                "Bulk approved by Web Admin.",
          reviewedBy:                "Web Admin",
          reviewedAt:                serverTimestamp(),
          verifiedAt:                serverTimestamp(),
          updatedAt:                 serverTimestamp(),
        });
        count++;
      } catch (e) {
        console.error("Bulk approve error for", user.id, e);
      }
    }
    setBulkSelected([]);
    setBulkProcessing(false);
    setSuccess(`✓ ${count} user(s) bulk approved successfully.`);
  }, [bulkSelected, users]);

  const toggleBulkSelect = useCallback((id) => {
    setBulkSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleCard = useCallback((id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleRefresh = useCallback(() => {
    setLastUpdated(new Date().toLocaleTimeString());
    setSuccess("Queue refreshed.");
  }, []);

  const handleExport = useCallback(() => {
    const rows = [
      ["Name", "Email", "Role", "Hospital", "License", "AI Score", "Face Confidence", "Doc Confidence", "Flask Risk", "Flask Recommendation"],
      ...filteredUsers.map((u) => {
        const { aiScore, faceConfidence, documentConfidence } = getAiNumbers(u);
        const risk = getRiskLevel(u);
        const rec  = getVerificationRecommendation(u);
        return [
          u.name, u.email, u.role, u.hospitalName, u.licenseNumber,
          `${aiScore}%`, `${faceConfidence}%`, `${documentConfidence}%`,
          risk.level, rec.label,
        ];
      }),
    ];
    const csv  = rows.map((r) => r.map((v) => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `pending_verifications_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredUsers]);

  const toggleSort = useCallback((field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }, [sortField]);

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={false}
        title="Loading Pending Verifications"
        subtitle="Fetching healthcare staff awaiting review..."
      />
    );
  }

  return (
    <div className={`pv-root ${mounted ? "pv-mounted" : ""}`}>
      {error   && <ErrorAlert   message={error}   onClose={() => setError("")}   />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess("")} />}

      {/* ── Page header ── */}
      <header className="pv-page-header">
        <div className="pv-page-title-group">
          <div className="pv-page-eyebrow">
            <span className="pv-live-dot" />
            Admin Verification Queue
          </div>
          <h1 className="pv-page-title">Pending Verifications</h1>
          <p className="pv-page-sub">
            Review healthcare staff registrations, AI confidence scores (Flask/DeepFace),
            uploaded documents, and approve or reject accounts.
          </p>
          <p className="pv-updated-text">
            Last updated: {lastUpdated} &nbsp;·&nbsp;
            {filteredUsers.length} of {users.length} shown
          </p>
        </div>
        <div className="pv-header-actions">
          <button onClick={handleExport} className="pv-btn pv-btn-ghost">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={handleRefresh} className="pv-btn pv-btn-ghost">
            <RefreshCcw size={16} /> Refresh
          </button>
          <div className="pv-active-chip">
            <ShieldCheck size={15} /> Admin Review Active
          </div>
        </div>
      </header>

      {/* ── Metric cards ── */}
      <section className="pv-metrics-grid">
        <StatCard
          title="Pending" value={stats.pending} icon={<Clock3 size={18} />} color="amber"
          onClick={() => { setFilterRole("all"); setFilterRisk("all"); setSearch(""); }}
        />
        <StatCard
          title="Doctors" value={stats.doctors} icon={<Stethoscope size={18} />} color="blue"
          onClick={() => setFilterRole("doctor")}
        />
        <StatCard
          title="Ready to Approve" value={stats.highAi} icon={<Brain size={18} />} color="teal"
          onClick={() => setFilterRisk("low")}
        />
        <StatCard
          title="Need Review" value={stats.needReview} icon={<AlertTriangle size={18} />} color="red"
          onClick={() => setFilterRisk("high")}
        />
      </section>

      {/* ── Search & Filter panel ── */}
      <section className="pv-panel pv-search-panel">
        <div className="pv-search-row">
          <div className="pv-search-field">
            <label className="pv-search-label">Search pending users</label>
            <div className="pv-search-input-wrap">
              <Search size={16} className="pv-search-icon" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, role, hospital, license, risk…"
                className="pv-search-input"
              />
              {search && (
                <button className="pv-search-clear-x" onClick={() => setSearch("")}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <button onClick={() => setFilterExpanded((v) => !v)} className="pv-btn pv-btn-ghost">
            <Filter size={16} /> Filters
            {filterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => { setSearch(""); setFilterRole("all"); setFilterRisk("all"); }}
            className="pv-btn pv-btn-ghost"
          >
            Clear All
          </button>
        </div>

        {filterExpanded && (
          <div className="pv-filter-expanded">
            <div className="pv-filter-group">
              <label className="pv-filter-label">Role</label>
              <div className="pv-filter-pills">
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRole(r)}
                    className={`pv-filter-pill ${filterRole === r ? "pv-filter-pill-active" : ""}`}
                  >
                    {r === "all" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="pv-filter-group">
              <label className="pv-filter-label">
                Risk Level <span className="pv-filter-sublabel">(from Flask AI)</span>
              </label>
              <div className="pv-filter-pills">
                {["all", "low", "medium", "high"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRisk(r)}
                    className={`pv-filter-pill ${filterRisk === r ? "pv-filter-pill-active" : ""} ${r !== "all" ? `pv-filter-pill-${r}` : ""}`}
                  >
                    {r === "all" ? "All Risks" : r.charAt(0).toUpperCase() + r.slice(1) + " Risk"}
                  </button>
                ))}
              </div>
            </div>
            <div className="pv-filter-group">
              <label className="pv-filter-label">Sort By</label>
              <div className="pv-filter-pills">
                {[
                  { key: "createdAt", label: "Date"     },
                  { key: "name",      label: "Name"     },
                  { key: "aiScore",   label: "AI Score" },
                  { key: "risk",      label: "Risk"     },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleSort(key)}
                    className={`pv-filter-pill ${sortField === key ? "pv-filter-pill-active" : ""}`}
                  >
                    {label}
                    {sortField === key &&
                      (sortDir === "asc" ? <SortAsc size={12} /> : <SortDesc size={12} />)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Bulk actions bar ── */}
      {bulkSelected.length > 0 && (
        <div className="pv-bulk-bar">
          <span className="pv-bulk-count">{bulkSelected.length} selected</span>
          <button
            onClick={handleBulkApprove}
            disabled={bulkProcessing}
            className="pv-btn pv-btn-teal"
          >
            <UserCheck size={16} />
            {bulkProcessing ? "Processing…" : `Approve ${bulkSelected.length}`}
          </button>
          <button onClick={() => setBulkSelected([])} className="pv-btn pv-btn-ghost">
            <X size={16} /> Deselect All
          </button>
        </div>
      )}

      {/* ── Cards / empty state ── */}
      {filteredUsers.length === 0 ? (
        <div className="pv-panel pv-empty-state">
          <BadgeCheck size={52} className="pv-empty-icon" />
          <h2 className="pv-empty-title">No Pending Verifications</h2>
          <p className="pv-empty-sub">
            {search || filterRole !== "all" || filterRisk !== "all"
              ? "No users match the current filters."
              : "All healthcare staff registrations are currently reviewed."}
          </p>
          {(search || filterRole !== "all" || filterRisk !== "all") && (
            <button
              onClick={() => { setSearch(""); setFilterRole("all"); setFilterRisk("all"); }}
              className="pv-btn pv-btn-ghost"
              style={{ marginTop: "1.25rem" }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="pv-cards-grid">
          {filteredUsers.map((user) => (
            <VerificationCard
              key={user.id}
              user={user}
              processing={processingId === user.id}
              expanded={expandedCards[user.id] || false}
              bulkSelected={bulkSelected.includes(user.id)}
              onApprove={() => openApproveFlow(user)}
              onReject={() => openRejectFlow(user)}
              onView={() => setSelectedUser(user)}
              onCopy={handleCopy}
              onToggleExpand={() => toggleCard(user.id)}
              onToggleBulk={() => toggleBulkSelect(user.id)}
              onImagePreview={(url) => setImagePreview(url)}
            />
          ))}
        </div>
      )}

      {/* ── Note/Reason modal ── */}
      {noteModal && (
        <NoteModal
          user={noteModal.user}
          type={noteModal.type}
          noteValue={noteValue}
          reasonValue={reasonValue}
          onNoteChange={setNoteValue}
          onReasonChange={setReasonValue}
          onConfirm={handleNoteConfirm}
          onClose={() => setNoteModal(null)}
        />
      )}

      {/* ── Confirm modal ── */}
      {confirmModal && (
        <ConfirmModal
          data={confirmModal}
          onConfirm={
            confirmModal.type === "approve"
              ? handleConfirmedApprove
              : handleConfirmedReject
          }
          onBack={() => {
            setConfirmModal(null);
            if (confirmModal.type === "approve") openApproveFlow(confirmModal.user);
            else openRejectFlow(confirmModal.user);
          }}
          onClose={() => setConfirmModal(null)}
        />
      )}

      {/* ── User details modal ── */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          processing={processingId === selectedUser.id}
          onClose={() => setSelectedUser(null)}
          onApprove={() => { setSelectedUser(null); openApproveFlow(selectedUser); }}
          onReject={() => { setSelectedUser(null); openRejectFlow(selectedUser); }}
          onCopy={handleCopy}
          onImagePreview={(url) => setImagePreview(url)}
        />
      )}

      {/* ── Image preview overlay ── */}
      {imagePreview && (
        <div className="pv-img-overlay" onClick={() => setImagePreview(null)}>
          <div className="pv-img-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="pv-modal-close"
              onClick={() => setImagePreview(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem" }}
            >
              <X size={18} />
            </button>
            <img src={imagePreview} alt="Document preview" className="pv-img-preview" />
          </div>
        </div>
      )}

      <style>{STYLES}</style>
    </div>
  );
}

/* ─────────────────────────────────────────
   NoteModal
───────────────────────────────────────── */
function NoteModal({ user, type, noteValue, reasonValue, onNoteChange, onReasonChange, onConfirm, onClose }) {
  const recommendation = getVerificationRecommendation(user);
  const isApprove = type === "approve";
  return (
    <div className="pv-modal-overlay">
      <div className="pv-modal" style={{ maxWidth: 560 }}>
        <div className="pv-modal-head">
          <div>
            <h2 className="pv-modal-title">
              {isApprove ? "Approve" : "Reject"} — {user.name || "User"}
            </h2>
            <p className="pv-modal-sub">Flask Recommendation: {recommendation.label}</p>
          </div>
          <button onClick={onClose} className="pv-modal-close"><X size={18} /></button>
        </div>
        <div className="pv-modal-body">
          <div className={recommendation.boxClassName} style={{ marginBottom: "1.25rem" }}>
            <div>{recommendation.icon}</div>
            <div>
              <p className="pv-recommend-title">{recommendation.label}</p>
              <p className="pv-recommend-reason">{recommendation.reason}</p>
            </div>
          </div>

          {!isApprove && (
            <div className="pv-form-group">
              <label className="pv-form-label">Rejection Reason *</label>
              <textarea
                className="pv-textarea"
                value={reasonValue}
                onChange={(e) => onReasonChange(e.target.value)}
                rows={3}
                placeholder="Enter the reason for rejection…"
              />
            </div>
          )}

          <div className="pv-form-group">
            <label className="pv-form-label">Admin Note</label>
            <textarea
              className="pv-textarea"
              value={noteValue}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={3}
              placeholder="Optional internal note for this decision…"
            />
          </div>

          <div className="pv-modal-actions" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <button onClick={onClose} className="pv-modal-action-btn pv-mab-email">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`pv-modal-action-btn ${isApprove ? "pv-mab-approve" : "pv-mab-reject"}`}
            >
              {isApprove ? <UserCheck size={16} /> : <UserX size={16} />}
              Proceed to Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ConfirmModal
───────────────────────────────────────── */
function ConfirmModal({ data, onConfirm, onBack, onClose }) {
  const { type, user, note, reason } = data;
  const isApprove = type === "approve";
  return (
    <div className="pv-modal-overlay">
      <div className="pv-modal" style={{ maxWidth: 500 }}>
        <div className="pv-modal-head">
          <div>
            <h2 className="pv-modal-title">
              Confirm {isApprove ? "Approval" : "Rejection"}
            </h2>
            <p className="pv-modal-sub">This action will be logged in the audit trail.</p>
          </div>
          <button onClick={onClose} className="pv-modal-close"><X size={18} /></button>
        </div>
        <div className="pv-modal-body">
          <div className="pv-confirm-summary">
            <div className="pv-confirm-row">
              <span className="pv-confirm-label">User</span>
              <span className="pv-confirm-val">{user.name || "—"}</span>
            </div>
            <div className="pv-confirm-row">
              <span className="pv-confirm-label">Email</span>
              <span className="pv-confirm-val">{user.email || "—"}</span>
            </div>
            <div className="pv-confirm-row">
              <span className="pv-confirm-label">Action</span>
              <span className={`pv-confirm-val ${isApprove ? "pv-color-teal" : "pv-color-red"}`}>
                {isApprove ? "APPROVE" : "REJECT"}
              </span>
            </div>
            {!isApprove && reason && (
              <div className="pv-confirm-row">
                <span className="pv-confirm-label">Reason</span>
                <span className="pv-confirm-val">{reason}</span>
              </div>
            )}
            {note && (
              <div className="pv-confirm-row">
                <span className="pv-confirm-label">Admin Note</span>
                <span className="pv-confirm-val">{note}</span>
              </div>
            )}
          </div>
          <div className="pv-modal-actions" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <button onClick={onBack} className="pv-modal-action-btn pv-mab-email">
              ← Back
            </button>
            <button
              onClick={onConfirm}
              className={`pv-modal-action-btn ${isApprove ? "pv-mab-approve" : "pv-mab-reject"}`}
            >
              {isApprove ? <UserCheck size={16} /> : <UserX size={16} />}
              Confirm {isApprove ? "Approval" : "Rejection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   VerificationCard
───────────────────────────────────────── */
function VerificationCard({
  user, processing, expanded, bulkSelected,
  onApprove, onReject, onView, onCopy,
  onToggleExpand, onToggleBulk, onImagePreview,
}) {
  const { aiScore, faceConfidence, documentConfidence } = getAiNumbers(user);
  const files          = getFileStatus(user);
  const risk           = getRiskLevel(user);
  const recommendation = getVerificationRecommendation(user);
  const avatarSrc      = user.profileImageUrl || user.selfieURL || user.selfieUrl;

  return (
    <div className={`pv-card ${bulkSelected ? "pv-card-selected" : ""}`}>
      <div className="pv-card-glow" />
      <div className="pv-card-body">
        {/* ── Head ── */}
        <div className="pv-card-head">
          <div className="pv-card-head-left">
            <label className="pv-checkbox-wrap" title="Select for bulk actions">
              <input
                type="checkbox"
                checked={bulkSelected}
                onChange={onToggleBulk}
                className="pv-checkbox"
              />
              <span className="pv-checkbox-box" />
            </label>
            <div
              className="pv-avatar"
              onClick={() => avatarSrc && onImagePreview(avatarSrc)}
              style={{ cursor: avatarSrc ? "zoom-in" : "default" }}
              title={avatarSrc ? "Click to preview" : ""}
            >
              {avatarSrc ? (
                <>
                  <img src={avatarSrc} alt={user.name || "User"} />
                  <span className="pv-avatar-zoom"><ZoomIn size={14} /></span>
                </>
              ) : (
                (user.name || "U").charAt(0).toUpperCase()
              )}
            </div>
          </div>

          <div className="pv-card-head-info">
            <div className="pv-card-name-row">
              <h2 className="pv-card-name">{user.name || "Unknown User"}</h2>
              <span className="pv-pill pv-pill-amber">Pending</span>
              <span className={risk.className}>
                {risk.icon} {risk.level}
              </span>
            </div>
            <p className="pv-card-meta">
              <Building2 size={13} style={{ display: "inline", marginRight: 4 }} />
              {user.role || "Healthcare Staff"} &nbsp;·&nbsp;
              {user.hospitalName || "No hospital"}
            </p>
            <div className="pv-mini-row">
              <MiniInfo icon={<Mail size={14} />}  text={user.email}         onClick={() => onCopy(user.email, "Email")}          title="Click to copy email"   />
              <MiniInfo icon={<Hash size={14} />}  text={user.licenseNumber} onClick={() => onCopy(user.licenseNumber, "License")} title="Click to copy license" />
              {user.specialization && <MiniInfo icon={<Stethoscope size={14} />} text={user.specialization} />}
              {user.phone          && <MiniInfo icon={<Phone size={14} />}       text={user.phone}          onClick={() => onCopy(user.phone, "Phone")} />}
            </div>
            {user.createdAt && (
              <p className="pv-card-date">
                <CalendarDays size={12} style={{ display: "inline", marginRight: 4 }} />
                Registered {formatDate(user.createdAt)}
              </p>
            )}
          </div>
        </div>

        <RecommendationBox recommendation={recommendation} />

        {/* ── Score meters — all three values from Flask ── */}
        <div className="pv-metric-row">
          <MetricBox title="AI Score"            value={aiScore}            color="blue"   />
          <MetricBox title="Face Confidence"     value={faceConfidence}     color="violet" />
          <MetricBox title="Document Confidence" value={documentConfidence} color="teal"   />
        </div>

        {/* ── Flask threshold legend ── */}
        <div className="pv-threshold-legend">
          <span className="pv-tl-item pv-tl-approve">≥ 75% both → Approve</span>
          <span className="pv-tl-item pv-tl-review"> 55–74%    → Review</span>
          <span className="pv-tl-item pv-tl-reject"> &lt; 55%  → Reject</span>
        </div>

        {/* ── Expandable detail ── */}
        <button className="pv-expand-btn" onClick={onToggleExpand}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? "Collapse Details" : "Expand Full Details"}
        </button>

        {expanded && (
          <div className="pv-expanded-section">
            <div className="pv-ai-block">
              <h3 className="pv-ai-block-title">
                <Brain size={18} color="#6AA3FF" />
                Flask / DeepFace AI Verification Summary
              </h3>
              <div className="pv-ai-status-list">
                <AIStatus
                  title="Face Recognition"
                  status={user.faceMatch ? "Passed" : "Pending / Failed"}
                  warning={!user.faceMatch}
                />
                <AIStatus
                  title="AI Processing"
                  status={user.aiProcessingStatus || "Pending"}
                  warning={(user.aiProcessingStatus || "").toLowerCase() !== "completed"}
                />
                {/* ocrStatus is always "not_applicable" — no OCR in this project */}
                <AIStatus
                  title="OCR / Document Text"
                  status="Not Applicable (face-match only)"
                  warning={false}
                />
                <AIStatus
                  title="Document Check"
                  status={user.documentCheckStatus || "Not Applicable"}
                  warning={false}
                />
                <AIStatus
                  title="Fraud Detection"
                  status={faceConfidence >= 75 && documentConfidence >= 75 ? "No Issues" : "Manual Review"}
                  warning={!(faceConfidence >= 75 && documentConfidence >= 75)}
                />
                <AIStatus
                  title="License Validation"
                  status={user.licenseNumber ? "License Number Provided" : "Missing License Number"}
                  warning={!user.licenseNumber}
                />
                <AIStatus
                  title="Flask DeepFace Model"
                  status={user.deepFaceModel ? `${user.deepFaceModel} / ${user.deepFaceDetector}` : "FaceNet / OpenCV"}
                  warning={false}
                />
              </div>
            </div>

            <div className="pv-doc-row">
              <DocumentLink
                title="ID Document"
                url={files.documentUrl}
                localPath={files.documentLocalPath}
                uploaded={files.hasDocument}
                onPreview={onImagePreview}
              />
              <DocumentLink
                title="License"
                url={user.licenseURL || user.licenseUrl || files.documentUrl}
                localPath={user.licenseLocalPath || files.documentLocalPath}
                uploaded={files.hasLicense}
                onPreview={onImagePreview}
              />
              <DocumentLink
                title="Selfie"
                url={files.selfieUrl}
                localPath={files.selfieLocalPath}
                uploaded={files.hasSelfie}
                onPreview={onImagePreview}
              />
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="pv-action-row">
          <button onClick={onView}    disabled={processing} className="pv-action-btn pv-action-view">
            <Eye size={18} /> View
          </button>
          <button onClick={onApprove} disabled={processing} className="pv-action-btn pv-action-approve">
            <UserCheck size={18} /> {processing ? "Processing…" : "Approve"}
          </button>
          <button onClick={onReject}  disabled={processing} className="pv-action-btn pv-action-reject">
            <UserX size={18} /> {processing ? "Processing…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   UserDetailsModal
───────────────────────────────────────── */
function UserDetailsModal({ user, processing, onClose, onApprove, onReject, onCopy, onImagePreview }) {
  const files                                    = getFileStatus(user);
  const { aiScore, faceConfidence, documentConfidence } = getAiNumbers(user);
  const risk                                     = getRiskLevel(user);
  const recommendation                           = getVerificationRecommendation(user);
  const avatarSrc = user.profileImageUrl || user.selfieURL || user.selfieUrl;

  return (
    <div className="pv-modal-overlay">
      <div className="pv-modal">
        <div className="pv-modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {avatarSrc && (
              <div className="pv-avatar" style={{ cursor: "zoom-in" }} onClick={() => onImagePreview(avatarSrc)}>
                <img src={avatarSrc} alt={user.name} />
                <span className="pv-avatar-zoom"><ZoomIn size={14} /></span>
              </div>
            )}
            <div>
              <h2 className="pv-modal-title">{user.name || "Applicant Details"}</h2>
              <p className="pv-modal-sub">
                Full verification profile · Flask AI scores · Admin decision tools
              </p>
            </div>
          </div>
          <button onClick={onClose} className="pv-modal-close"><X size={18} /></button>
        </div>

        <div className="pv-modal-body">
          <RecommendationBox recommendation={recommendation} />

          <div className="pv-metric-row">
            <MetricBox title="AI Score"            value={aiScore}            color="blue"   />
            <MetricBox title="Face Confidence"     value={faceConfidence}     color="violet" />
            <MetricBox title="Document Confidence" value={documentConfidence} color="teal"   />
          </div>

          {/* Flask threshold reminder */}
          <div className="pv-threshold-legend" style={{ marginBottom: "1.5rem" }}>
            <span className="pv-tl-item pv-tl-approve">≥ 75% both → Approve</span>
            <span className="pv-tl-item pv-tl-review"> 55–74%    → Review</span>
            <span className="pv-tl-item pv-tl-reject"> &lt; 55%  → Reject</span>
          </div>

          <div className={risk.chipClassName} style={{ marginBottom: "1.5rem" }}>
            {risk.icon} Risk Level: {risk.level}
          </div>

          <div className="pv-detail-grid">
            <Detail label="Full Name"           value={user.name} />
            <Detail label="Email"               value={user.email}         copyable onCopy={() => onCopy(user.email, "Email")} />
            <Detail label="Phone"               value={user.phone}         copyable={Boolean(user.phone)} onCopy={() => onCopy(user.phone, "Phone")} />
            <Detail label="Role"                value={user.role || "Healthcare Staff"} />
            <Detail label="Hospital"            value={user.hospitalName} />
            <Detail label="Department"          value={user.department} />
            <Detail label="Specialization"      value={user.specialization} />
            <Detail label="License Number"      value={user.licenseNumber} copyable={Boolean(user.licenseNumber)} onCopy={() => onCopy(user.licenseNumber, "License number")} />
            <Detail label="Verification Status" value={user.verificationStatus || user.status || "pending"} />
            <Detail label="Face Match"          value={user.faceMatch ? "✓ Passed" : "✗ Pending / Failed"} />
            <Detail label="Flask Risk Level"    value={user.riskLevel || risk.level} />
            <Detail label="Flask Recommendation" value={user.verificationRecommendation || recommendation.label} />
            <Detail label="Registered"          value={formatDate(user.createdAt)} />
            <Detail label="Document Path"       value={files.documentLocalPath || files.documentUrl || "Not uploaded"} />
          </div>

          <div className="pv-ai-block" style={{ marginBottom: "1.5rem" }}>
            <h3 className="pv-ai-block-title">
              <Brain size={18} color="#6AA3FF" />
              Flask / DeepFace AI Verification Summary
            </h3>
            <div className="pv-ai-status-list">
              <AIStatus title="Face Recognition"     status={user.faceMatch ? "Passed" : "Pending / Failed"} warning={!user.faceMatch} />
              <AIStatus title="AI Processing"        status={user.aiProcessingStatus || "Pending"} warning={(user.aiProcessingStatus || "").toLowerCase() !== "completed"} />
              <AIStatus title="OCR / Document Text"  status="Not Applicable (face-match only)" warning={false} />
              <AIStatus title="Document Check"       status={user.documentCheckStatus || "Not Applicable"} warning={false} />
              <AIStatus title="Fraud Detection"      status={faceConfidence >= 75 && documentConfidence >= 75 ? "No Issues" : "Manual Review"} warning={!(faceConfidence >= 75 && documentConfidence >= 75)} />
              <AIStatus title="License Validation"   status={user.licenseNumber ? "License Number Provided" : "Missing License Number"} warning={!user.licenseNumber} />
              <AIStatus title="Flask DeepFace Model" status={user.deepFaceModel ? `${user.deepFaceModel} / ${user.deepFaceDetector}` : "FaceNet / OpenCV"} warning={false} />
            </div>
          </div>

          <div className="pv-doc-row" style={{ marginBottom: "1.5rem" }}>
            <DocumentLink title="ID / License" url={files.documentUrl}  localPath={files.documentLocalPath} uploaded={files.hasDocument} onPreview={onImagePreview} />
            <DocumentLink title="Selfie"       url={files.selfieUrl}    localPath={files.selfieLocalPath}   uploaded={files.hasSelfie}   onPreview={onImagePreview} />
            <DocumentLink title="License #"    url=""                   localPath={user.licenseNumber}      uploaded={Boolean(user.licenseNumber)} onPreview={null} />
          </div>

          <div className="pv-modal-actions">
            <button onClick={() => onCopy(user.email, "Email")}           className="pv-modal-action-btn pv-mab-email">
              <Clipboard size={16} /> Copy Email
            </button>
            <button onClick={() => onCopy(user.licenseNumber, "License")} className="pv-modal-action-btn pv-mab-license">
              <Clipboard size={16} /> Copy License
            </button>
            <button onClick={onApprove} disabled={processing} className="pv-modal-action-btn pv-mab-approve">
              <UserCheck size={16} /> Approve
            </button>
            <button onClick={onReject}  disabled={processing} className="pv-modal-action-btn pv-mab-reject">
              <UserX size={16} /> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Small presentational pieces
───────────────────────────────────────── */
function RecommendationBox({ recommendation }) {
  return (
    <div className={recommendation.boxClassName}>
      <div style={{ flexShrink: 0, paddingTop: 2 }}>{recommendation.icon}</div>
      <div>
        <h3 className="pv-recommend-title">{recommendation.label}</h3>
        <p className="pv-recommend-reason">{recommendation.reason}</p>
      </div>
    </div>
  );
}

function ScoreMeter({ value }) {
  /* Colours match Flask thresholds: green ≥ 75, amber 55–74, red < 55 */
  const color = value >= 75 ? "#00E5C3" : value >= 55 ? "#F59E0B" : "#EF4444";
  return (
    <div className="pv-score-meter">
      <div className="pv-score-track">
        <div
          className="pv-score-fill"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function MetricBox({ title, value, color }) {
  return (
    <div className="pv-metric-box">
      <div className={`pv-metric-box-icon pv-icon-${color}`}>
        <ShieldCheck size={18} />
      </div>
      <p className="pv-metric-box-title">{title}</p>
      <p className="pv-metric-box-value">{value}%</p>
      <ScoreMeter value={value} />
    </div>
  );
}

function AIStatus({ title, status, warning }) {
  return (
    <div className="pv-ai-status-row">
      <span className="pv-ai-status-label">{title}</span>
      <span className={`pv-ai-status-value ${warning ? "pv-ai-status-warn" : "pv-ai-status-ok"}`}>
        {warning ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
        {status}
      </span>
    </div>
  );
}

function MiniInfo({ icon, text, onClick, title }) {
  if (!text) return null;
  return (
    <button onClick={onClick} className="pv-mini-info" title={title}>
      {icon} {text}
      {onClick && <Clipboard size={12} className="pv-mini-copy-icon" />}
    </button>
  );
}

function DocumentLink({ title, url, localPath, uploaded, onPreview }) {
  const canOpen    = Boolean(url) && String(url).startsWith("http");
  const canPreview = canOpen && onPreview && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  return (
    <div className="pv-doc-link-wrap">
      <button
        onClick={() => canOpen && window.open(url, "_blank", "noopener,noreferrer")}
        disabled={!canOpen}
        className="pv-doc-link"
      >
        <FileText size={18} className="pv-doc-link-icon" />
        <h4 className="pv-doc-title">{title}</h4>
        {canOpen ? (
          <span className="pv-doc-status pv-doc-view">View File ↗</span>
        ) : uploaded ? (
          <span className="pv-doc-status pv-doc-uploaded">
            <CheckCircle2 size={13} /> Uploaded{localPath ? " (Local)" : ""}
          </span>
        ) : (
          <span className="pv-doc-status pv-doc-missing">
            <XCircle size={13} /> Not uploaded
          </span>
        )}
      </button>
      {canPreview && (
        <button className="pv-doc-preview-btn" onClick={() => onPreview(url)} title="Preview image">
          <ZoomIn size={14} />
        </button>
      )}
    </div>
  );
}

function Detail({ label, value, copyable, onCopy }) {
  return (
    <div className="pv-detail-box">
      <p className="pv-detail-label">{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <p className="pv-detail-value">{value || "Not Provided"}</p>
        {copyable && (
          <button onClick={onCopy} className="pv-detail-copy" title={`Copy ${label}`}>
            <Clipboard size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, onClick }) {
  return (
    <button onClick={onClick} className="pv-stat-card">
      <div className={`pv-stat-icon pv-icon-${color}`}>{icon}</div>
      <p className="pv-stat-title">{title}</p>
      <p className="pv-stat-value">{value}</p>
    </button>
  );
}

/* ─────────────────────────────────────────
   Styles  (all original CSS preserved +
   new threshold-legend and filter-sublabel)
───────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700;800&display=swap');

  .pv-root {
    --bg:        #060D1F;
    --surface:   #0D1733;
    --surface2:  #111E3A;
    --surface3:  #162040;
    --border:    rgba(255,255,255,0.065);
    --border2:   rgba(255,255,255,0.11);
    --blue:      #1D6EFF;
    --teal:      #00E5C3;
    --amber:     #F59E0B;
    --red:       #EF4444;
    --violet:    #8B5CF6;
    --text:      #E8EDF8;
    --muted:     #5A6A8A;
    --muted2:    #3D4F70;
    --r:         14px;
    --r-sm:      10px;
    --r-lg:      24px;
    --shadow:    0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);

    font-family: 'Inter', system-ui, sans-serif;
    color: var(--text);
    background: var(--bg);
    min-height: 100vh;
    padding: 2rem 2rem 3rem;
    max-width: 1600px;
    margin: 0 auto;
    position: relative;
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.55s ease, transform 0.55s ease;
  }
  .pv-mounted { opacity: 1; transform: translateY(0); }
  .pv-root * { box-sizing: border-box; }

  .pv-page-header {
    display: flex; flex-wrap: wrap; align-items: flex-start;
    justify-content: space-between; gap: 1.25rem; margin-bottom: 2.25rem;
  }
  .pv-page-eyebrow {
    display: inline-flex; align-items: center; gap: 0.5rem;
    font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--amber);
    background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2);
    border-radius: 100px; padding: 0.5rem 1rem; margin-bottom: 1rem;
  }
  .pv-live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--amber); box-shadow: 0 0 8px var(--amber);
    animation: pv-pulse 2s ease-in-out infinite;
  }
  @keyframes pv-pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
  .pv-page-title { font-size: clamp(1.75rem, 3.4vw, 2.5rem); font-weight: 800; letter-spacing: -0.025em; color: var(--text); margin: 0 0 0.75rem; }
  .pv-page-sub { font-size: 0.9375rem; color: var(--muted); margin: 0 0 0.75rem; max-width: 640px; line-height: 1.55; }
  .pv-updated-text { font-size: 0.75rem; color: var(--muted2); margin: 0; font-family: 'DM Mono', monospace; }
  .pv-header-actions { display: flex; flex-direction: column; gap: 0.75rem; align-items: stretch; }

  .pv-btn {
    height: 48px; padding: 0 1.25rem; border-radius: var(--r-sm);
    font-weight: 700; font-size: 0.875rem; font-family: 'Inter', sans-serif;
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    cursor: pointer; border: 1px solid transparent; transition: all 0.18s ease; white-space: nowrap;
  }
  .pv-btn-ghost { background: rgba(255,255,255,0.04); border-color: var(--border2); color: var(--text); }
  .pv-btn-ghost:hover { background: rgba(255,255,255,0.09); }
  .pv-btn-teal { background: var(--teal); color: #03251F; border-color: var(--teal); }
  .pv-btn-teal:hover:not(:disabled) { background: #2FF0D4; }
  .pv-btn-teal:disabled { opacity: 0.55; cursor: not-allowed; }
  .pv-active-chip {
    height: 48px; padding: 0 1.25rem; border-radius: var(--r-sm);
    background: rgba(0,229,195,0.1); border: 1px solid rgba(0,229,195,0.22);
    color: var(--teal); font-weight: 700; font-size: 0.875rem;
    display: inline-flex; align-items: center; gap: 0.5rem; white-space: nowrap;
  }

  .pv-metrics-grid {
    display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; margin-bottom: 1.5rem;
  }
  @media (min-width: 768px) { .pv-metrics-grid { grid-template-columns: repeat(4,1fr); } }
  .pv-stat-card {
    position: relative; overflow: hidden; text-align: left;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r); box-shadow: var(--shadow);
    padding: 1.375rem; cursor: pointer;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    font-family: inherit; color: inherit;
  }
  .pv-stat-card:hover { transform: translateY(-3px); border-color: var(--border2); }
  .pv-stat-icon { width: 46px; height: 46px; border-radius: var(--r-sm); display: flex; align-items: center; justify-content: center; margin-bottom: 1.125rem; }
  .pv-stat-title { font-size: 0.8125rem; color: var(--muted); margin: 0 0 0.4rem; }
  .pv-stat-value { font-family: 'DM Mono', monospace; font-size: 2.25rem; font-weight: 500; letter-spacing: -0.03em; color: var(--text); margin: 0; }

  .pv-panel {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-lg); box-shadow: var(--shadow);
    padding: 1.75rem; transition: border-color 0.2s;
  }
  .pv-panel:hover { border-color: var(--border2); }
  .pv-search-panel { margin-bottom: 1.5rem; }
  .pv-search-row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 1rem; }
  .pv-search-field { flex: 1; min-width: 240px; }
  .pv-search-label { display: block; font-size: 0.8125rem; color: var(--muted); margin-bottom: 0.625rem; }
  .pv-search-input-wrap { position: relative; }
  .pv-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  .pv-search-input {
    width: 100%; height: 50px; border-radius: var(--r-sm);
    background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
    padding: 0 2.5rem 0 2.75rem; color: var(--text); font-size: 0.9375rem;
    outline: none; transition: border-color 0.18s;
  }
  .pv-search-input::placeholder { color: var(--muted2); }
  .pv-search-input:focus { border-color: rgba(29,110,255,0.5); }
  .pv-search-clear-x {
    position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--muted); padding: 4px;
    display: flex; align-items: center; border-radius: 4px; transition: color 0.15s;
  }
  .pv-search-clear-x:hover { color: var(--text); }

  .pv-filter-expanded {
    display: flex; flex-wrap: wrap; gap: 1.5rem;
    margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--border);
  }
  .pv-filter-group { display: flex; flex-direction: column; gap: 0.625rem; }
  .pv-filter-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); display: flex; align-items: center; gap: 0.375rem; }
  .pv-filter-sublabel { font-size: 0.65rem; text-transform: none; letter-spacing: 0; opacity: 0.7; }
  .pv-filter-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .pv-filter-pill {
    height: 34px; padding: 0 0.875rem; border-radius: 100px;
    background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
    color: var(--muted); font-size: 0.8125rem; font-weight: 600;
    cursor: pointer; transition: all 0.15s; font-family: inherit;
    display: inline-flex; align-items: center; gap: 0.375rem;
  }
  .pv-filter-pill:hover { background: rgba(255,255,255,0.08); color: var(--text); }
  .pv-filter-pill-active { background: rgba(29,110,255,0.15); border-color: rgba(29,110,255,0.4); color: #6AA3FF; }
  .pv-filter-pill-low    { color: var(--teal); }
  .pv-filter-pill-medium { color: var(--amber); }
  .pv-filter-pill-high   { color: #F87171; }

  .pv-bulk-bar {
    display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    background: rgba(29,110,255,0.1); border: 1px solid rgba(29,110,255,0.25);
    border-radius: var(--r); padding: 1rem 1.25rem; margin-bottom: 1.5rem;
  }
  .pv-bulk-count { font-weight: 700; font-size: 0.9375rem; color: #6AA3FF; }

  .pv-empty-state { text-align: center; padding: 3.5rem 2rem; }
  .pv-empty-icon  { color: var(--teal); margin-bottom: 1.25rem; }
  .pv-empty-title { font-size: 1.625rem; font-weight: 800; color: var(--text); margin: 0 0 0.625rem; }
  .pv-empty-sub   { color: var(--muted); margin: 0; }

  .pv-cards-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
  @media (min-width: 1280px) { .pv-cards-grid { grid-template-columns: repeat(2,1fr); } }

  .pv-card {
    position: relative; overflow: hidden;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-lg); box-shadow: var(--shadow);
    padding: 1.75rem; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .pv-card:hover { border-color: var(--border2); }
  .pv-card-selected { border-color: rgba(29,110,255,0.45) !important; box-shadow: 0 0 0 2px rgba(29,110,255,0.18), var(--shadow); }
  .pv-card-glow {
    position: absolute; top: -90px; right: -90px;
    width: 280px; height: 280px; border-radius: 50%;
    background: radial-gradient(circle, rgba(29,110,255,0.12), transparent 70%);
    pointer-events: none;
  }
  .pv-card-body { position: relative; z-index: 1; }

  .pv-card-head { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.25rem; margin-bottom: 1.5rem; }
  .pv-card-head-left { display: flex; flex-direction: column; align-items: center; gap: 0.625rem; flex-shrink: 0; }

  .pv-checkbox-wrap { display: flex; align-items: center; cursor: pointer; position: relative; }
  .pv-checkbox { position: absolute; opacity: 0; width: 0; height: 0; }
  .pv-checkbox-box {
    width: 18px; height: 18px; border-radius: 5px;
    border: 1.5px solid var(--border2); background: rgba(255,255,255,0.04);
    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
  }
  .pv-checkbox:checked + .pv-checkbox-box { background: var(--blue); border-color: var(--blue); }
  .pv-checkbox:checked + .pv-checkbox-box::after {
    content: ''; display: block; width: 5px; height: 9px;
    border: 2px solid #fff; border-top: none; border-left: none;
    transform: rotate(45deg) translateY(-1px);
  }

  .pv-avatar {
    width: 64px; height: 64px; border-radius: 18px;
    background: rgba(29,110,255,0.12); border: 1px solid rgba(29,110,255,0.22);
    display: flex; align-items: center; justify-content: center;
    color: #6AA3FF; font-size: 1.5rem; font-weight: 800;
    overflow: hidden; flex-shrink: 0; position: relative;
  }
  .pv-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .pv-avatar-zoom {
    position: absolute; inset: 0; background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
    color: #fff; opacity: 0; transition: opacity 0.15s;
  }
  .pv-avatar:hover .pv-avatar-zoom { opacity: 1; }

  .pv-card-head-info { flex: 1; min-width: 0; }
  .pv-card-name-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.625rem; margin-bottom: 0.5rem; }
  .pv-card-name { font-size: 1.3125rem; font-weight: 800; color: var(--text); margin: 0; }
  .pv-card-meta { font-size: 0.875rem; color: var(--muted); margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.25rem; }
  .pv-card-date { font-size: 0.75rem; color: var(--muted2); margin: 0.5rem 0 0; font-family: 'DM Mono', monospace; display: flex; align-items: center; }

  .pv-pill {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.3rem 0.7rem; border-radius: 100px;
    font-size: 0.6875rem; font-weight: 700; border: 1px solid; white-space: nowrap;
  }
  .pv-pill-amber { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.22); color: var(--amber); }
  .pv-pill-red   { background: rgba(239,68,68,0.1);  border-color: rgba(239,68,68,0.22);  color: #F87171; }
  .pv-pill-teal  { background: rgba(0,229,195,0.1);  border-color: rgba(0,229,195,0.22);  color: var(--teal); }
  .pv-risk-chip {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem 1rem; border-radius: 100px; border: 1px solid;
    font-size: 0.8125rem; font-weight: 700;
  }

  .pv-mini-row { display: flex; flex-wrap: wrap; gap: 0.625rem; }
  .pv-mini-info {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.45rem 0.75rem; border-radius: var(--r-sm);
    background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
    font-size: 0.8125rem; color: var(--text); cursor: pointer;
    transition: background 0.15s; font-family: inherit;
    max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .pv-mini-info:hover { background: rgba(255,255,255,0.09); }
  .pv-mini-copy-icon { opacity: 0; flex-shrink: 0; transition: opacity 0.15s; }
  .pv-mini-info:hover .pv-mini-copy-icon { opacity: 0.6; }

  .pv-recommend-box {
    border-radius: var(--r); border: 1px solid; padding: 1.125rem 1.25rem;
    margin-bottom: 1.5rem; display: flex; gap: 0.875rem; align-items: flex-start;
  }
  .pv-recommend-approve { background: rgba(0,229,195,0.08); border-color: rgba(0,229,195,0.2); color: var(--teal); }
  .pv-recommend-reject  { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); color: #F87171; }
  .pv-recommend-review  { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.2); color: var(--amber); }
  .pv-recommend-title  { font-weight: 800; margin: 0 0 0.25rem; font-size: 0.9375rem; }
  .pv-recommend-reason { font-size: 0.8125rem; opacity: 0.9; line-height: 1.5; margin: 0; }

  /* ── Flask threshold legend ── */
  .pv-threshold-legend {
    display: flex; flex-wrap: wrap; gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .pv-tl-item {
    padding: 0.25rem 0.75rem; border-radius: 100px;
    font-size: 0.6875rem; font-weight: 700; border: 1px solid;
    font-family: 'DM Mono', monospace;
  }
  .pv-tl-approve { background: rgba(0,229,195,0.08); border-color: rgba(0,229,195,0.2); color: var(--teal); }
  .pv-tl-review  { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.2); color: var(--amber); }
  .pv-tl-reject  { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); color: #F87171; }

  .pv-metric-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.875rem; margin-bottom: 1rem; }
  .pv-metric-box {
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    border-radius: var(--r); padding: 1.125rem;
  }
  .pv-metric-box-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 0.875rem; }
  .pv-metric-box-title { font-size: 0.75rem; color: var(--muted); margin: 0 0 0.375rem; }
  .pv-metric-box-value { font-family: 'DM Mono', monospace; font-size: 1.625rem; font-weight: 500; color: var(--text); margin: 0 0 0.625rem; }
  .pv-score-meter { height: 4px; border-radius: 4px; overflow: hidden; background: rgba(255,255,255,0.07); }
  .pv-score-track { height: 100%; border-radius: 4px; background: rgba(255,255,255,0.07); overflow: hidden; }
  .pv-score-fill  { height: 100%; border-radius: 4px; transition: width 0.6s ease; }

  .pv-expand-btn {
    display: flex; align-items: center; gap: 0.5rem;
    background: none; border: 1px dashed var(--border2); border-radius: var(--r-sm);
    color: var(--muted); font-size: 0.8125rem; font-weight: 600;
    cursor: pointer; width: 100%; padding: 0.625rem 1rem;
    margin-bottom: 1.25rem; transition: all 0.15s; font-family: inherit;
  }
  .pv-expand-btn:hover { background: rgba(255,255,255,0.04); color: var(--text); border-color: var(--border2); }
  .pv-expanded-section { border-top: 1px solid var(--border); padding-top: 1.25rem; margin-bottom: 1.25rem; }

  .pv-ai-block {
    border-radius: var(--r); border: 1px solid var(--border);
    background: rgba(255,255,255,0.025); padding: 1.375rem; margin-bottom: 1.5rem;
  }
  .pv-ai-block-title { display: flex; align-items: center; gap: 0.625rem; font-size: 1.0625rem; font-weight: 800; color: var(--text); margin: 0 0 1.125rem; }
  .pv-ai-status-list { display: flex; flex-direction: column; gap: 0.625rem; }
  .pv-ai-status-row {
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    border-radius: var(--r-sm); padding: 0.75rem 1rem;
  }
  .pv-ai-status-label { font-size: 0.875rem; color: var(--text); }
  .pv-ai-status-value { font-weight: 700; font-size: 0.8125rem; display: flex; align-items: center; gap: 0.375rem; }
  .pv-ai-status-ok   { color: var(--teal); }
  .pv-ai-status-warn { color: var(--amber); }

  .pv-doc-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.875rem; margin-bottom: 1.5rem; }
  .pv-doc-link-wrap { position: relative; }
  .pv-doc-link {
    text-align: left; border-radius: var(--r); border: 1px solid var(--border);
    background: rgba(255,255,255,0.025); padding: 1rem; cursor: pointer;
    transition: background 0.15s; font-family: inherit; color: inherit; width: 100%;
  }
  .pv-doc-link:hover:not(:disabled) { background: rgba(255,255,255,0.06); }
  .pv-doc-link:disabled { cursor: not-allowed; }
  .pv-doc-link-icon { color: var(--muted); margin-bottom: 0.5rem; }
  .pv-doc-title { font-weight: 700; color: var(--text); margin: 0 0 0.625rem; font-size: 0.875rem; }
  .pv-doc-status { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8125rem; font-weight: 700; }
  .pv-doc-view     { color: #6AA3FF; }
  .pv-doc-uploaded { color: var(--teal); }
  .pv-doc-missing  { color: var(--muted); font-weight: 500; }
  .pv-doc-preview-btn {
    position: absolute; top: 0.5rem; right: 0.5rem;
    width: 28px; height: 28px; border-radius: 6px;
    background: rgba(255,255,255,0.08); border: 1px solid var(--border2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text); transition: background 0.15s;
  }
  .pv-doc-preview-btn:hover { background: rgba(255,255,255,0.15); }

  .pv-action-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.75rem; }
  .pv-action-btn {
    height: 50px; border-radius: var(--r-sm); font-weight: 800; font-size: 0.875rem;
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    cursor: pointer; border: 1px solid transparent; transition: all 0.18s; font-family: inherit;
  }
  .pv-action-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .pv-action-view    { background: rgba(255,255,255,0.04); border-color: var(--border2); color: var(--text); }
  .pv-action-view:hover:not(:disabled) { background: rgba(255,255,255,0.09); }
  .pv-action-approve { background: var(--teal); color: #03251F; }
  .pv-action-approve:hover:not(:disabled) { background: #2FF0D4; }
  .pv-action-reject  { background: var(--red); color: #fff; }
  .pv-action-reject:hover:not(:disabled) { background: #F87171; }

  .pv-modal-overlay {
    position: fixed; inset: 0; z-index: 60;
    background: rgba(2,6,16,0.78); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  }
  .pv-modal {
    width: 100%; max-width: 920px; max-height: 92vh; overflow-y: auto;
    background: var(--bg); border: 1px solid var(--border2);
    border-radius: var(--r-lg); box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  }
  .pv-modal-head {
    position: sticky; top: 0; z-index: 5; background: var(--bg);
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.5rem 1.75rem; border-bottom: 1px solid var(--border);
  }
  .pv-modal-title { font-size: 1.375rem; font-weight: 800; color: var(--text); margin: 0 0 0.3rem; }
  .pv-modal-sub   { font-size: 0.8125rem; color: var(--muted); margin: 0; }
  .pv-modal-close {
    width: 38px; height: 38px; border-radius: 10px;
    background: rgba(255,255,255,0.05); border: 1px solid var(--border2);
    display: flex; align-items: center; justify-content: center;
    color: var(--text); cursor: pointer; transition: background 0.15s; flex-shrink: 0;
  }
  .pv-modal-close:hover { background: rgba(255,255,255,0.1); }
  .pv-modal-body { padding: 1.75rem; }

  .pv-detail-grid { display: grid; grid-template-columns: 1fr; gap: 0.875rem; margin-bottom: 1.5rem; }
  @media (min-width: 700px) { .pv-detail-grid { grid-template-columns: repeat(2,1fr); } }
  .pv-detail-box { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: var(--r-sm); padding: 0.875rem 1rem; }
  .pv-detail-label { font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin: 0 0 0.4rem; }
  .pv-detail-value { font-size: 0.9375rem; font-weight: 600; color: var(--text); margin: 0; word-break: break-all; }
  .pv-detail-copy {
    background: none; border: none; cursor: pointer; color: var(--muted);
    padding: 4px; border-radius: 4px; flex-shrink: 0; transition: color 0.15s;
    display: flex; align-items: center;
  }
  .pv-detail-copy:hover { color: var(--text); }

  .pv-modal-actions { display: grid; grid-template-columns: repeat(2,1fr); gap: 0.75rem; }
  @media (min-width: 700px) { .pv-modal-actions { grid-template-columns: repeat(4,1fr); } }
  .pv-modal-action-btn {
    height: 46px; border-radius: var(--r-sm); font-weight: 700; font-size: 0.8125rem;
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    cursor: pointer; border: 1px solid; transition: all 0.18s; font-family: inherit;
  }
  .pv-modal-action-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .pv-mab-email:hover:not(:disabled)   { background: rgba(29,110,255,0.18); }
  .pv-mab-email   { background: rgba(29,110,255,0.1);  border-color: rgba(29,110,255,0.22); color: #6AA3FF; }
  .pv-mab-license { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.22); color: #A78BFA; }
  .pv-mab-license:hover:not(:disabled) { background: rgba(139,92,246,0.18); }
  .pv-mab-approve { background: var(--teal); border-color: var(--teal); color: #03251F; }
  .pv-mab-approve:hover:not(:disabled) { background: #2FF0D4; }
  .pv-mab-reject  { background: var(--red);  border-color: var(--red);  color: #fff; }
  .pv-mab-reject:hover:not(:disabled)  { background: #F87171; }

  .pv-form-group  { margin-bottom: 1.25rem; }
  .pv-form-label  { display: block; font-size: 0.8125rem; font-weight: 600; color: var(--muted); margin-bottom: 0.5rem; }
  .pv-textarea {
    width: 100%; border-radius: var(--r-sm);
    background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
    padding: 0.75rem 1rem; color: var(--text); font-size: 0.9375rem;
    font-family: inherit; line-height: 1.6; outline: none;
    transition: border-color 0.18s; resize: vertical;
  }
  .pv-textarea::placeholder { color: var(--muted2); }
  .pv-textarea:focus { border-color: rgba(29,110,255,0.5); }

  .pv-confirm-summary {
    background: rgba(255,255,255,0.025); border: 1px solid var(--border);
    border-radius: var(--r); overflow: hidden; margin-bottom: 1.5rem;
  }
  .pv-confirm-row {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 1rem; padding: 0.875rem 1.125rem; border-bottom: 1px solid var(--border);
  }
  .pv-confirm-row:last-child { border-bottom: none; }
  .pv-confirm-label { font-size: 0.8125rem; color: var(--muted); font-weight: 600; white-space: nowrap; flex-shrink: 0; }
  .pv-confirm-val   { font-size: 0.875rem; color: var(--text); font-weight: 600; text-align: right; word-break: break-word; }
  .pv-color-teal { color: var(--teal) !important; }
  .pv-color-red  { color: #F87171 !important; }

  .pv-img-overlay {
    position: fixed; inset: 0; z-index: 70;
    background: rgba(2,6,16,0.92); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 2rem;
    cursor: zoom-out;
  }
  .pv-img-container {
    position: relative; max-width: 90vw; max-height: 90vh;
    border-radius: var(--r-lg); overflow: hidden; cursor: default;
  }
  .pv-img-preview { display: block; max-width: 100%; max-height: 90vh; object-fit: contain; }

  .pv-icon-blue   { background: rgba(29,110,255,0.14); color: #6AA3FF; }
  .pv-icon-amber  { background: rgba(245,158,11,0.14); color: #FBB040; }
  .pv-icon-teal   { background: rgba(0,229,195,0.12);  color: var(--teal); }
  .pv-icon-red    { background: rgba(239,68,68,0.14);  color: #F87171; }
  .pv-icon-violet { background: rgba(139,92,246,0.14); color: #A78BFA; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
`;