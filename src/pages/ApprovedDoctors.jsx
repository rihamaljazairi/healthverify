import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  Clipboard,
  Mail,
  Phone,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { db } from "../config/firebase";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import ErrorAlert from "../components/Common/ErrorAlert";
import SuccessAlert from "../components/Common/SuccessAlert";

/**
 * Dedicated "Approved Doctors" page.
 *
 * Unlike the generic Doctors.jsx page, this component is self-contained:
 * it subscribes to Firestore itself and ALWAYS shows only doctors whose
 * status is approved/verified. There is no dropdown or filter that lets
 * an admin switch this view to show pending/rejected/all doctors — that
 * separation is intentional, mirroring how RejectedDoctors.jsx is its
 * own dedicated page rather than a filtered mode of a shared component.
 */
export default function ApprovedDoctors() {
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
          .filter((u) => u.approved === true || u.status === "verified");

        setDoctors(data);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load approved doctors.");
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
    setSuccess("Approved doctors list refreshed.");
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

  const handleMoveToPending = async (doctor) => {
    const confirmMove = window.confirm(
      `Move ${doctor.name || "this doctor"} back to pending review? This will revoke their approved status until an admin reviews them again.`
    );

    if (!confirmMove) return;

    try {
      setProcessingId(doctor.id);
      setError("");
      setSuccess("");

      await updateDoc(doc(db, "users", doctor.id), {
        approved: false,
        rejected: false,
        status: "pending",
        verificationStatus: "pending",
        reviewedBy: "Web Admin",
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(`${doctor.name || "Doctor"} has been moved back to pending review.`);
    } catch (err) {
      console.error(err);
      setError("Failed to update doctor status. Check Firestore rules and permissions.");
    } finally {
      setProcessingId("");
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={false}
        title="Loading Approved Doctors"
        subtitle="Fetching verified healthcare professionals..."
      />
    );
  }

  return (
    <div className={`ad-root ${mounted ? "ad-mounted" : ""}`}>
      {error && <ErrorAlert message={error} onClose={() => setError("")} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess("")} />}

      {/* ── Page header ── */}
      <header className="ad-page-header">
        <div className="ad-page-title-group">
          <div className="ad-page-eyebrow">
            <BadgeCheck size={14} />
            Admin Verified Registry
          </div>

          <h1 className="ad-page-title">Approved Doctors</h1>

          <p className="ad-page-sub">
            Healthcare professionals who have completed verification and are
            currently active in the system.
          </p>

          <p className="ad-updated-text">Last updated: {lastUpdated}</p>
        </div>

        <div className="ad-header-actions">
          <button onClick={handleRefresh} className="ad-btn ad-btn-ghost">
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {/* ── Stat cards (approved-only context, no cross-status switching) ── */}
      <section className="ad-stats-grid">
        <StatCard title="Approved Doctors" value={doctors.length} icon={BadgeCheck} color="teal" />
        <StatCard title="Departments Covered" value={departments} icon={Building2} color="violet" />
        <StatCard
          title="Showing Now"
          value={filteredDoctors.length}
          icon={Users}
          color="blue"
        />
      </section>

      {/* ── Search panel (search only — no status dropdown) ── */}
      <section className="ad-panel ad-search-panel">
        <div className="ad-search-field">
          <Search size={16} className="ad-search-icon" />

          <input
            type="text"
            placeholder="Search approved doctors by name, specialization, hospital, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ad-search-input"
          />

          {search && (
            <button onClick={handleClearSearch} className="ad-search-clear">
              <X size={14} />
            </button>
          )}
        </div>
      </section>

      {search && (
        <div className="ad-filters-row">
          <span>
            Showing <strong className="ad-filters-count">{filteredDoctors.length}</strong>{" "}
            result{filteredDoctors.length !== 1 ? "s" : ""}
          </span>
          <span className="ad-filter-chip">Search: "{search}"</span>
        </div>
      )}

      {/* ── Cards / empty state ── */}
      {filteredDoctors.length === 0 ? (
        <div className="ad-panel ad-empty-state">
          <div className="ad-empty-icon">
            <Search size={22} />
          </div>
          <h3 className="ad-empty-title">No approved doctors found</h3>
          <p className="ad-empty-sub">
            {doctors.length === 0
              ? "No doctors have been approved yet."
              : "No approved doctors match your search."}
          </p>
          {search && (
            <button onClick={handleClearSearch} className="ad-btn ad-btn-ghost ad-empty-clear-btn">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="ad-cards-grid">
          {filteredDoctors.map((doctor) => (
            <ApprovedDoctorCard
              key={doctor.id}
              doctor={doctor}
              processing={processingId === doctor.id}
              onView={() => navigate(`/admin/doctors/${doctor.id}`)}
              onCopy={handleCopy}
              onMoveToPending={() => handleMoveToPending(doctor)}
            />
          ))}
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700;800&display=swap');

        .ad-root {
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
        .ad-mounted { opacity: 1; transform: translateY(0); }
        .ad-root * { box-sizing: border-box; }

        /* ── Header ── */
        .ad-page-header {
          display: flex; flex-wrap: wrap; align-items: flex-start;
          justify-content: space-between; gap: 1.25rem; margin-bottom: 2rem;
        }
        .ad-page-title-group { max-width: 640px; }
        .ad-page-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; font-weight: 600; color: var(--teal);
          background: rgba(0,229,195,0.1); border: 1px solid rgba(0,229,195,0.2);
          border-radius: 100px; padding: 0.5rem 1rem; margin-bottom: 1rem;
        }
        .ad-page-title {
          font-size: clamp(1.625rem, 3vw, 2.25rem); font-weight: 800;
          letter-spacing: -0.025em; color: var(--text); margin: 0 0 0.625rem;
        }
        .ad-page-sub { font-size: 0.9375rem; color: var(--muted); margin: 0 0 0.625rem; line-height: 1.55; }
        .ad-updated-text { font-size: 0.75rem; color: var(--muted2); margin: 0; font-family: 'DM Mono', monospace; }

        .ad-header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .ad-btn {
          height: 46px; padding: 0 1.125rem; border-radius: var(--r-sm);
          font-weight: 700; font-size: 0.8125rem; font-family: 'Inter', sans-serif;
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          cursor: pointer; border: 1px solid transparent; transition: all 0.18s ease;
          white-space: nowrap;
        }
        .ad-btn-ghost { background: rgba(255,255,255,0.04); border-color: var(--border2); color: var(--text); }
        .ad-btn-ghost:hover { background: rgba(255,255,255,0.09); }

        /* ── Stats grid ── */
        .ad-stats-grid {
          display: grid; grid-template-columns: 1fr;
          gap: 1rem; margin-bottom: 1.5rem;
        }
        @media (min-width: 700px) { .ad-stats-grid { grid-template-columns: repeat(3, 1fr); } }

        .ad-stat-card {
          display: flex; align-items: center; gap: 1rem;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r); box-shadow: var(--shadow);
          padding: 1.125rem 1.25rem;
        }
        .ad-stat-icon {
          width: 44px; height: 44px; border-radius: var(--r-sm); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; border: 1px solid;
        }
        .ad-stat-value { font-family: 'DM Mono', monospace; font-size: 1.75rem; font-weight: 500; color: var(--text); line-height: 1; margin: 0; }
        .ad-stat-title { font-size: 0.75rem; color: var(--muted); margin: 0.25rem 0 0; }

        /* ── Panel base ── */
        .ad-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r-lg); box-shadow: var(--shadow);
          padding: 1.5rem; transition: border-color 0.2s;
        }
        .ad-panel:hover { border-color: var(--border2); }

        /* ── Search ── */
        .ad-search-panel { margin-bottom: 1.25rem; }
        .ad-search-field { position: relative; }
        .ad-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); }
        .ad-search-input {
          width: 100%; height: 50px; border-radius: var(--r-sm);
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          padding: 0 2.5rem 0 2.75rem; color: var(--text); font-size: 0.9375rem;
          outline: none; transition: border-color 0.18s;
        }
        .ad-search-input::placeholder { color: var(--muted2); }
        .ad-search-input:focus { border-color: rgba(0,229,195,0.5); }
        .ad-search-clear {
          position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%);
          color: var(--muted); background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: color 0.15s;
        }
        .ad-search-clear:hover { color: var(--text); }

        /* ── Filters row ── */
        .ad-filters-row {
          display: flex; flex-wrap: wrap; align-items: center; gap: 0.625rem;
          font-size: 0.8125rem; color: var(--muted); margin-bottom: 1.25rem;
        }
        .ad-filters-count { color: var(--text); font-weight: 700; }
        .ad-filter-chip {
          padding: 0.25rem 0.625rem; border-radius: var(--r-sm);
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          color: var(--text); font-weight: 500; font-size: 0.75rem;
        }

        /* ── Empty state ── */
        .ad-empty-state { text-align: center; padding: 3.5rem 2rem; }
        .ad-empty-icon {
          width: 56px; height: 56px; border-radius: var(--r); margin: 0 auto 1rem;
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          color: var(--muted); display: flex; align-items: center; justify-content: center;
        }
        .ad-empty-title { font-size: 1.125rem; font-weight: 800; color: var(--text); margin: 0 0 0.5rem; }
        .ad-empty-sub { font-size: 0.875rem; color: var(--muted); margin: 0 0 1.25rem; }
        .ad-empty-clear-btn { margin: 0 auto; }

        /* ── Cards grid ── */
        .ad-cards-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        @media (min-width: 768px) { .ad-cards-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1280px) { .ad-cards-grid { grid-template-columns: repeat(3, 1fr); } }

        .ad-doctor-card {
          background: var(--surface); border: 1px solid rgba(0,229,195,0.16);
          border-radius: var(--r); box-shadow: var(--shadow);
          padding: 1.25rem; transition: all 0.2s ease;
        }
        .ad-doctor-card:hover { border-color: rgba(0,229,195,0.32); background: var(--surface2); }

        .ad-doctor-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.875rem; margin-bottom: 1rem; }
        .ad-doctor-head-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
        .ad-avatar {
          width: 48px; height: 48px; border-radius: var(--r-sm); flex-shrink: 0;
          background: rgba(0,229,195,0.12); border: 1px solid rgba(0,229,195,0.25);
          color: var(--teal); display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.9375rem; overflow: hidden;
        }
        .ad-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ad-doctor-name-wrap { min-width: 0; }
        .ad-doctor-name { font-size: 0.9375rem; font-weight: 700; color: var(--text); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ad-doctor-spec { font-size: 0.75rem; color: var(--muted); margin: 0.15rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .ad-status-pill {
          flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.3rem 0.7rem; border-radius: 100px;
          font-size: 0.6875rem; font-weight: 700; border: 1px solid; white-space: nowrap;
          background: rgba(0,229,195,0.1); border-color: rgba(0,229,195,0.22); color: var(--teal);
        }

        /* ── Info rows ── */
        .ad-info-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
        .ad-info-row {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          gap: 0.625rem; background: none; border: none; cursor: pointer;
          color: var(--muted); transition: color 0.15s; font-family: inherit; padding: 0;
        }
        .ad-info-row:hover { color: var(--text); }
        .ad-info-row-left { display: flex; align-items: center; gap: 0.625rem; min-width: 0; }
        .ad-info-icon { color: var(--muted2); flex-shrink: 0; }
        .ad-info-text { font-size: 0.8125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ad-info-clip { color: var(--muted2); flex-shrink: 0; }

        /* ── Card footer ── */
        .ad-card-footer {
          display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
          padding-top: 1rem; border-top: 1px solid var(--border);
        }
        .ad-dept-chip {
          font-size: 0.75rem; color: var(--muted);
          padding: 0.2rem 0.55rem; border-radius: 6px;
          background: rgba(255,255,255,0.04);
        }
        .ad-card-actions { display: flex; align-items: center; gap: 0.5rem; }
        .ad-revoke-btn {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.5rem 0.75rem; border-radius: var(--r-sm);
          background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.22);
          color: var(--amber); font-size: 0.75rem; font-weight: 700;
          cursor: pointer; transition: background 0.15s; font-family: inherit;
        }
        .ad-revoke-btn:hover:not(:disabled) { background: rgba(245,158,11,0.18); }
        .ad-revoke-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ad-view-btn {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.5rem 0.875rem; border-radius: var(--r-sm);
          background: var(--teal); color: #03251F; font-size: 0.8125rem; font-weight: 700;
          border: none; cursor: pointer; transition: background 0.15s, transform 0.1s;
        }
        .ad-view-btn:hover { background: #2FF0D4; }
        .ad-view-btn:active { transform: scale(0.96); }

        /* ── Color helpers for stat icons ── */
        .ad-icon-blue   { background: rgba(29,110,255,0.14); border-color: rgba(29,110,255,0.25); color: #6AA3FF; }
        .ad-icon-teal   { background: rgba(0,229,195,0.12);  border-color: rgba(0,229,195,0.25); color: var(--teal); }
        .ad-icon-violet { background: rgba(139,92,246,0.14); border-color: rgba(139,92,246,0.25); color: #A78BFA; }

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
    <div className="ad-stat-card">
      <div className={`ad-stat-icon ad-icon-${color}`}>
        <Icon size={20} />
      </div>

      <div>
        <p className="ad-stat-value">{value}</p>
        <p className="ad-stat-title">{title}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ApprovedDoctorCard
───────────────────────────────────────── */
function ApprovedDoctorCard({ doctor, processing, onView, onCopy, onMoveToPending }) {
  const initials = (doctor.name || "D")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="ad-doctor-card">
      <div className="ad-doctor-head">
        <div className="ad-doctor-head-left">
          <div className="ad-avatar">
            {doctor.profileImageUrl || doctor.imageURL ? (
              <img src={doctor.profileImageUrl || doctor.imageURL} alt={doctor.name} />
            ) : (
              initials
            )}
          </div>

          <div className="ad-doctor-name-wrap">
            <h3 className="ad-doctor-name">{doctor.name || "Unknown Doctor"}</h3>
            <p className="ad-doctor-spec">{doctor.specialization || "General Medicine"}</p>
          </div>
        </div>

        <span className="ad-status-pill">
          <ShieldCheck size={12} />
          Verified
        </span>
      </div>

      <div className="ad-info-list">
        <InfoRow icon={Mail} text={doctor.email} onClick={() => onCopy(doctor.email, "Email")} />
        <InfoRow icon={Phone} text={doctor.phone} onClick={() => onCopy(doctor.phone, "Phone")} />
        <InfoRow icon={Building2} text={doctor.hospitalName} />
        <InfoRow
          icon={Stethoscope}
          text={doctor.licenseNumber}
          onClick={() => onCopy(doctor.licenseNumber, "License number")}
        />
      </div>

      <div className="ad-card-footer">
        <div>
          {doctor.department && <span className="ad-dept-chip">{doctor.department}</span>}
        </div>

        <div className="ad-card-actions">
          <button onClick={onMoveToPending} disabled={processing} className="ad-revoke-btn" title="Move back to pending review">
            <RotateCcw size={13} />
            {processing ? "Updating..." : "Move to Pending"}
          </button>

          <button onClick={onView} className="ad-view-btn">
            View Profile
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, text, onClick }) {
  if (!text) return null;

  return (
    <button type="button" onClick={onClick} className="ad-info-row">
      <span className="ad-info-row-left">
        <Icon size={13} className="ad-info-icon" />
        <span className="ad-info-text">{text}</span>
      </span>

      {onClick && <Clipboard size={12} className="ad-info-clip" />}
    </button>
  );
}