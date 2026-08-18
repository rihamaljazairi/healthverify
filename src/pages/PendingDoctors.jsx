import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  Clipboard,
  Clock3,
  Mail,
  Phone,
  RefreshCcw,
  Search,
  Stethoscope,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { db } from "../config/firebase";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import ErrorAlert from "../components/Common/ErrorAlert";
import SuccessAlert from "../components/Common/SuccessAlert";

/**
 * Dedicated "Pending Doctors" page.
 *
 * Self-contained, like ApprovedDoctors.jsx and RejectedDoctors.jsx: it
 * subscribes to Firestore itself and ALWAYS shows only doctors who are
 * neither approved nor rejected. There is no dropdown that lets this
 * view switch to show approved/rejected/all doctors.
 *
 * Unlike the read-mostly Approved/Rejected pages, pending is an action
 * state, so each card exposes direct Approve / Reject quick actions in
 * addition to View Profile.
 */
export default function PendingDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [mounted, setMounted] = useState(false);
  const [processingId, setProcessingId] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);

    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((u) => String(u.role || "").toLowerCase() === "doctor")
          .filter((u) => {
            const isApproved = u.approved === true || u.status === "verified";
            const isRejected = u.rejected === true || u.status === "rejected";
            return !isApproved && !isRejected;
          });

        setDoctors(data);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load pending doctors.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredDoctors = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return doctors;

    return doctors.filter((d) => {
      return (
        String(d.name || "").toLowerCase().includes(q) ||
        String(d.email || "").toLowerCase().includes(q) ||
        String(d.specialization || "").toLowerCase().includes(q) ||
        String(d.hospitalName || "").toLowerCase().includes(q) ||
        String(d.department || "").toLowerCase().includes(q) ||
        String(d.licenseNumber || "").toLowerCase().includes(q)
      );
    });
  }, [doctors, search]);

  const departments = new Set(doctors.map((d) => d.department).filter(Boolean)).size;

  const handleRefresh = () => {
    setLastUpdated(new Date().toLocaleTimeString());
    setSuccess("Pending doctors list refreshed.");
  };

  const handleClearSearch = () => setSearch("");

  const handleCopy = async (text, label) => {
    if (!text) {
      setError(`${label} is empty.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setSuccess(`${label} copied successfully.`);
    } catch {
      setError("Copy failed.");
    }
  };

  const handleApprove = async (doctor) => {
    const adminNote = window.prompt(
      `Approve ${doctor.name || "this doctor"}?\n\nWrite admin note:`,
      "Profile and license details meet verification requirements."
    );

    if (adminNote === null) return;

    const confirmApprove = window.confirm(
      `Confirm approval for ${doctor.name || "this doctor"}?`
    );

    if (!confirmApprove) return;

    try {
      setProcessingId(doctor.id);
      setError("");
      setSuccess("");

      await updateDoc(doc(db, "users", doctor.id), {
        approved: true,
        rejected: false,
        status: "verified",
        verificationStatus: "verified",
        adminNotes: adminNote.trim() || "Approved after admin review.",
        reviewedBy: "Web Admin",
        reviewedAt: serverTimestamp(),
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(`${doctor.name || "Doctor"} has been approved successfully.`);
    } catch (err) {
      console.error(err);
      setError("Failed to approve doctor. Check Firestore rules and permissions.");
    } finally {
      setProcessingId("");
    }
  };

  const handleReject = async (doctor) => {
    const reason = window.prompt(
      `Reject ${doctor.name || "this doctor"}?\n\nEnter rejection reason:`,
      "Documents did not meet verification requirements."
    );

    if (reason === null) return;

    const finalReason = reason.trim() || "Documents did not meet verification requirements.";

    const confirmReject = window.confirm(
      `Confirm rejection for ${doctor.name || "this doctor"}?\n\nReason: ${finalReason}`
    );

    if (!confirmReject) return;

    try {
      setProcessingId(doctor.id);
      setError("");
      setSuccess("");

      await updateDoc(doc(db, "users", doctor.id), {
        approved: false,
        rejected: true,
        status: "rejected",
        verificationStatus: "rejected",
        rejectionReason: finalReason,
        reviewedBy: "Web Admin",
        reviewedAt: serverTimestamp(),
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(`${doctor.name || "Doctor"} has been rejected.`);
    } catch (err) {
      console.error(err);
      setError("Failed to reject doctor. Check Firestore rules and permissions.");
    } finally {
      setProcessingId("");
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={false}
        title="Loading Pending Doctors"
        subtitle="Fetching doctors awaiting review..."
      />
    );
  }

  return (
    <div className={`pd-root ${mounted ? "pd-mounted" : ""}`}>
      {error && <ErrorAlert message={error} onClose={() => setError("")} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess("")} />}

      {/* ── Page header ── */}
      <header className="pd-page-header">
        <div className="pd-page-title-group">
          <div className="pd-page-eyebrow">
            <Clock3 size={14} />
            Admin Review Queue
          </div>

          <h1 className="pd-page-title">Pending Doctors</h1>

          <p className="pd-page-sub">
            Doctors awaiting admin review. Approve or reject directly, or open
            a full profile for more detail.
          </p>

          <p className="pd-updated-text">Last updated: {lastUpdated}</p>
        </div>

        <div className="pd-header-actions">
          <button onClick={handleRefresh} className="pd-btn pd-btn-ghost">
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {/* ── Stat cards (pending-only context, no cross-status switching) ── */}
      <section className="pd-stats-grid">
        <StatCard title="Pending Doctors" value={doctors.length} icon={Clock3} color="amber" />
        <StatCard title="Departments Involved" value={departments} icon={Building2} color="violet" />
        <StatCard title="Showing Now" value={filteredDoctors.length} icon={Search} color="blue" />
      </section>

      {/* ── Search panel (search only — no status dropdown) ── */}
      <section className="pd-panel pd-search-panel">
        <div className="pd-search-field">
          <Search size={16} className="pd-search-icon" />

          <input
            type="text"
            placeholder="Search pending doctors by name, specialization, hospital, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pd-search-input"
          />

          {search && (
            <button onClick={handleClearSearch} className="pd-search-clear">
              <X size={14} />
            </button>
          )}
        </div>
      </section>

      {search && (
        <div className="pd-filters-row">
          <span>
            Showing <strong className="pd-filters-count">{filteredDoctors.length}</strong>{" "}
            result{filteredDoctors.length !== 1 ? "s" : ""}
          </span>
          <span className="pd-filter-chip">Search: "{search}"</span>
        </div>
      )}

      {/* ── Cards / empty state ── */}
      {filteredDoctors.length === 0 ? (
        <div className="pd-panel pd-empty-state">
          <div className="pd-empty-icon">
            <Search size={22} />
          </div>
          <h3 className="pd-empty-title">No pending doctors found</h3>
          <p className="pd-empty-sub">
            {doctors.length === 0
              ? "There are no doctors currently awaiting review."
              : "No pending doctors match your search."}
          </p>
          {search && (
            <button onClick={handleClearSearch} className="pd-btn pd-btn-ghost pd-empty-clear-btn">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="pd-cards-grid">
          {filteredDoctors.map((doctor) => (
            <PendingDoctorCard
              key={doctor.id}
              doctor={doctor}
              processing={processingId === doctor.id}
              onView={() => navigate(`/admin/doctors/${doctor.id}`)}
              onCopy={handleCopy}
              onApprove={() => handleApprove(doctor)}
              onReject={() => handleReject(doctor)}
            />
          ))}
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700;800&display=swap');

        .pd-root {
          --bg:          #060D1F;
          --surface:     #0D1733;
          --surface2:    #111E3A;
          --surface3:    #162040;
          --border:      rgba(255,255,255,0.065);
          --border2:     rgba(255,255,255,0.11);
          --blue:        #1D6EFF;
          --teal:        #00E5C3;
          --amber:       #F59E0B;
          --red:         #EF4444;
          --violet:      #8B5CF6;
          --text:        #E8EDF8;
          --muted:       #5A6A8A;
          --muted2:      #3D4F70;
          --r:           14px;
          --r-sm:        10px;
          --r-lg:        24px;
          --shadow:      0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);

          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text);
          background: var(--bg);
          min-height: 100vh;
          padding: 2rem 2rem 3rem;
          max-width: 1500px;
          margin: 0 auto;
          position: relative;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .pd-mounted { opacity: 1; transform: translateY(0); }
        .pd-root * { box-sizing: border-box; }

        /* ── Header ── */
        .pd-page-header {
          display: flex; flex-wrap: wrap; align-items: flex-start;
          justify-content: space-between; gap: 1.25rem; margin-bottom: 2rem;
        }
        .pd-page-title-group { max-width: 640px; }
        .pd-page-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; font-weight: 600; color: var(--amber);
          background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2);
          border-radius: 100px; padding: 0.5rem 1rem; margin-bottom: 1rem;
        }
        .pd-page-title {
          font-size: clamp(1.625rem, 3vw, 2.25rem); font-weight: 800;
          letter-spacing: -0.025em; color: var(--text); margin: 0 0 0.625rem;
        }
        .pd-page-sub { font-size: 0.9375rem; color: var(--muted); margin: 0 0 0.625rem; line-height: 1.55; }
        .pd-updated-text { font-size: 0.75rem; color: var(--muted2); margin: 0; font-family: 'DM Mono', monospace; }

        .pd-header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .pd-btn {
          height: 46px; padding: 0 1.125rem; border-radius: var(--r-sm);
          font-weight: 700; font-size: 0.8125rem; font-family: 'Inter', sans-serif;
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          cursor: pointer; border: 1px solid transparent; transition: all 0.18s ease;
          white-space: nowrap;
        }
        .pd-btn-ghost { background: rgba(255,255,255,0.04); border-color: var(--border2); color: var(--text); }
        .pd-btn-ghost:hover { background: rgba(255,255,255,0.09); }

        /* ── Stats grid ── */
        .pd-stats-grid {
          display: grid; grid-template-columns: 1fr;
          gap: 1rem; margin-bottom: 1.5rem;
        }
        @media (min-width: 700px) { .pd-stats-grid { grid-template-columns: repeat(3, 1fr); } }

        .pd-stat-card {
          display: flex; align-items: center; gap: 1rem;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r); box-shadow: var(--shadow);
          padding: 1.125rem 1.25rem;
        }
        .pd-stat-icon {
          width: 44px; height: 44px; border-radius: var(--r-sm); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; border: 1px solid;
        }
        .pd-stat-value { font-family: 'DM Mono', monospace; font-size: 1.75rem; font-weight: 500; color: var(--text); line-height: 1; margin: 0; }
        .pd-stat-title { font-size: 0.75rem; color: var(--muted); margin: 0.25rem 0 0; }

        /* ── Panel base ── */
        .pd-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r-lg); box-shadow: var(--shadow);
          padding: 1.5rem; transition: border-color 0.2s;
        }
        .pd-panel:hover { border-color: var(--border2); }

        /* ── Search ── */
        .pd-search-panel { margin-bottom: 1.25rem; }
        .pd-search-field { position: relative; }
        .pd-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); }
        .pd-search-input {
          width: 100%; height: 50px; border-radius: var(--r-sm);
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          padding: 0 2.5rem 0 2.75rem; color: var(--text); font-size: 0.9375rem;
          outline: none; transition: border-color 0.18s;
        }
        .pd-search-input::placeholder { color: var(--muted2); }
        .pd-search-input:focus { border-color: rgba(245,158,11,0.5); }
        .pd-search-clear {
          position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%);
          color: var(--muted); background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: color 0.15s;
        }
        .pd-search-clear:hover { color: var(--text); }

        /* ── Filters row ── */
        .pd-filters-row {
          display: flex; flex-wrap: wrap; align-items: center; gap: 0.625rem;
          font-size: 0.8125rem; color: var(--muted); margin-bottom: 1.25rem;
        }
        .pd-filters-count { color: var(--text); font-weight: 700; }
        .pd-filter-chip {
          padding: 0.25rem 0.625rem; border-radius: var(--r-sm);
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          color: var(--text); font-weight: 500; font-size: 0.75rem;
        }

        /* ── Empty state ── */
        .pd-empty-state { text-align: center; padding: 3.5rem 2rem; }
        .pd-empty-icon {
          width: 56px; height: 56px; border-radius: var(--r); margin: 0 auto 1rem;
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          color: var(--muted); display: flex; align-items: center; justify-content: center;
        }
        .pd-empty-title { font-size: 1.125rem; font-weight: 800; color: var(--text); margin: 0 0 0.5rem; }
        .pd-empty-sub { font-size: 0.875rem; color: var(--muted); margin: 0 0 1.25rem; }
        .pd-empty-clear-btn { margin: 0 auto; }

        /* ── Cards grid ── */
        .pd-cards-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        @media (min-width: 768px) { .pd-cards-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1280px) { .pd-cards-grid { grid-template-columns: repeat(3, 1fr); } }

        .pd-doctor-card {
          background: var(--surface); border: 1px solid rgba(245,158,11,0.16);
          border-radius: var(--r); box-shadow: var(--shadow);
          padding: 1.25rem; transition: all 0.2s ease;
        }
        .pd-doctor-card:hover { border-color: rgba(245,158,11,0.32); background: var(--surface2); }

        .pd-doctor-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.875rem; margin-bottom: 1rem; }
        .pd-doctor-head-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
        .pd-avatar {
          width: 48px; height: 48px; border-radius: var(--r-sm); flex-shrink: 0;
          background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25);
          color: var(--amber); display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.9375rem; overflow: hidden;
        }
        .pd-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .pd-doctor-name-wrap { min-width: 0; }
        .pd-doctor-name { font-size: 0.9375rem; font-weight: 700; color: var(--text); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pd-doctor-spec { font-size: 0.75rem; color: var(--muted); margin: 0.15rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pd-status-pill {
          flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.3rem 0.7rem; border-radius: 100px;
          font-size: 0.6875rem; font-weight: 700; border: 1px solid; white-space: nowrap;
          background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.22); color: var(--amber);
        }

        /* ── Info rows ── */
        .pd-info-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
        .pd-info-row {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          gap: 0.625rem; background: none; border: none; cursor: pointer;
          color: var(--muted); transition: color 0.15s; font-family: inherit; padding: 0;
        }
        .pd-info-row:hover { color: var(--text); }
        .pd-info-row-left { display: flex; align-items: center; gap: 0.625rem; min-width: 0; }
        .pd-info-icon { color: var(--muted2); flex-shrink: 0; }
        .pd-info-text { font-size: 0.8125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pd-info-clip { color: var(--muted2); flex-shrink: 0; }

        /* ── Card footer ── */
        .pd-card-footer {
          display: flex; flex-direction: column; gap: 0.75rem;
          padding-top: 1rem; border-top: 1px solid var(--border);
        }
        .pd-dept-chip {
          font-size: 0.75rem; color: var(--muted);
          padding: 0.2rem 0.55rem; border-radius: 6px;
          background: rgba(255,255,255,0.04);
          display: inline-block;
        }
        .pd-action-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.625rem; }
        .pd-action-btn {
          height: 42px; border-radius: var(--r-sm); font-weight: 700; font-size: 0.78125rem;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          cursor: pointer; border: 1px solid transparent; transition: all 0.18s; font-family: inherit;
        }
        .pd-action-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .pd-action-view {
          background: rgba(255,255,255,0.04); border-color: var(--border2); color: var(--text);
        }
        .pd-action-view:hover:not(:disabled) { background: rgba(255,255,255,0.09); }
        .pd-action-approve { background: var(--teal); color: #03251F; }
        .pd-action-approve:hover:not(:disabled) { background: #2FF0D4; }
        .pd-action-reject { background: var(--red); color: #fff; }
        .pd-action-reject:hover:not(:disabled) { background: #F87171; }

        /* ── Color helpers for stat icons ── */
        .pd-icon-blue   { background: rgba(29,110,255,0.14); border-color: rgba(29,110,255,0.25); color: #6AA3FF; }
        .pd-icon-amber  { background: rgba(245,158,11,0.14); border-color: rgba(245,158,11,0.25); color: var(--amber); }
        .pd-icon-violet { background: rgba(139,92,246,0.14); border-color: rgba(139,92,246,0.25); color: #A78BFA; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────
   StatCard
───────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="pd-stat-card">
      <div className={`pd-stat-icon pd-icon-${color}`}>
        <Icon size={20} />
      </div>

      <div>
        <p className="pd-stat-value">{value}</p>
        <p className="pd-stat-title">{title}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PendingDoctorCard
───────────────────────────────────────── */
function PendingDoctorCard({ doctor, processing, onView, onCopy, onApprove, onReject }) {
  const initials = (doctor.name || "D")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="pd-doctor-card">
      <div className="pd-doctor-head">
        <div className="pd-doctor-head-left">
          <div className="pd-avatar">
            {doctor.profileImageUrl || doctor.imageURL ? (
              <img src={doctor.profileImageUrl || doctor.imageURL} alt={doctor.name} />
            ) : (
              initials
            )}
          </div>

          <div className="pd-doctor-name-wrap">
            <h3 className="pd-doctor-name">{doctor.name || "Unknown Doctor"}</h3>
            <p className="pd-doctor-spec">{doctor.specialization || "General Medicine"}</p>
          </div>
        </div>

        <span className="pd-status-pill">
          <Clock3 size={12} />
          Pending
        </span>
      </div>

      <div className="pd-info-list">
        <InfoRow icon={Mail} text={doctor.email} onClick={() => onCopy(doctor.email, "Email")} />
        <InfoRow icon={Phone} text={doctor.phone} onClick={() => onCopy(doctor.phone, "Phone")} />
        <InfoRow icon={Building2} text={doctor.hospitalName} />
        <InfoRow
          icon={Stethoscope}
          text={doctor.licenseNumber}
          onClick={() => onCopy(doctor.licenseNumber, "License number")}
        />
      </div>

      <div className="pd-card-footer">
        {doctor.department && <span className="pd-dept-chip">{doctor.department}</span>}

        <div className="pd-action-row">
          <button onClick={onView} disabled={processing} className="pd-action-btn pd-action-view">
            <ChevronRight size={15} />
            View
          </button>

          <button onClick={onApprove} disabled={processing} className="pd-action-btn pd-action-approve">
            <UserCheck size={15} />
            {processing ? "..." : "Approve"}
          </button>

          <button onClick={onReject} disabled={processing} className="pd-action-btn pd-action-reject">
            <UserX size={15} />
            {processing ? "..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, text, onClick }) {
  if (!text) return null;

  return (
    <button type="button" onClick={onClick} className="pd-info-row">
      <span className="pd-info-row-left">
        <Icon size={13} className="pd-info-icon" />
        <span className="pd-info-text">{text}</span>
      </span>

      {onClick && <Clipboard size={12} className="pd-info-clip" />}
    </button>
  );
}