import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  RefreshCcw,
  Search,
  ShieldX,
  Stethoscope,
  Trash2,
  UserX,
  X,
} from "lucide-react";

import { db } from "../config/firebase";
import SuccessAlert from "../components/Common/SuccessAlert";
import ErrorAlert from "../components/Common/ErrorAlert";

export default function RejectedDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [restoreDoctor, setRestoreDoctor] = useState(null);
  const [processingId, setProcessingId] = useState("");
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setDoctors(list);
        setLastUpdated(new Date().toLocaleTimeString());
      },
      (err) => {
        console.error(err);
        setError("Failed to load rejected doctors.");
      }
    );

    return () => unsubscribe();
  }, []);

  const rejectedDoctors = useMemo(() => {
    const value = search.toLowerCase().trim();

    return doctors.filter((doctor) => {
      const role = String(doctor.role || "").toLowerCase();
      const rejected =
        doctor.rejected === true ||
        String(doctor.status || "").toLowerCase() === "rejected" ||
        String(doctor.verificationStatus || "").toLowerCase() === "rejected";

      const matchesDoctor = role === "doctor";

      const matchesSearch =
        !value ||
        String(doctor.name || "").toLowerCase().includes(value) ||
        String(doctor.email || "").toLowerCase().includes(value) ||
        String(doctor.hospitalName || "").toLowerCase().includes(value) ||
        String(doctor.licenseNumber || "").toLowerCase().includes(value) ||
        String(doctor.specialization || "").toLowerCase().includes(value);

      return matchesDoctor && rejected && matchesSearch;
    });
  }, [doctors, search]);

  const handleRefresh = () => {
    setLastUpdated(new Date().toLocaleTimeString());
    setSuccess("Rejected doctors refreshed.");
  };

  const handleRestore = async () => {
    if (!restoreDoctor?.id) return;

    try {
      setProcessingId(restoreDoctor.id);

      await updateDoc(doc(db, "users", restoreDoctor.id), {
        approved: false,
        rejected: false,
        status: "pending",
        verificationStatus: "pending",
        updatedAt: serverTimestamp(),
      });

      setSuccess(`${restoreDoctor.name || "Doctor"} moved back to pending.`);
      setRestoreDoctor(null);
    } catch (err) {
      console.error(err);
      setError("Failed to restore doctor.");
    } finally {
      setProcessingId("");
    }
  };

  const handleApprove = async (doctor) => {
    try {
      setProcessingId(doctor.id);

      await updateDoc(doc(db, "users", doctor.id), {
        approved: true,
        rejected: false,
        status: "verified",
        verificationStatus: "verified",
        updatedAt: serverTimestamp(),
      });

      setSuccess(`${doctor.name || "Doctor"} approved successfully.`);
    } catch (err) {
      console.error(err);
      setError("Failed to approve doctor.");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <div className={`rd-root ${mounted ? "rd-mounted" : ""}`}>
      {success && <SuccessAlert message={success} onClose={() => setSuccess("")} />}
      {error && <ErrorAlert message={error} onClose={() => setError("")} autoClose={false} />}

      {/* ── Page header ── */}
      <header className="rd-page-header">
        <div className="rd-page-title-group">
          <div className="rd-page-eyebrow">
            <ShieldX size={14} />
            Admin Rejection Review
          </div>

          <h1 className="rd-page-title">Rejected Doctors</h1>

          <p className="rd-page-sub">
            Review rejected doctor applications, restore them to pending, or
            approve verified profiles.
          </p>

          <p className="rd-updated-text">Last updated: {lastUpdated}</p>
        </div>

        <button onClick={handleRefresh} className="rd-btn rd-btn-ghost">
          <RefreshCcw size={16} />
          Refresh
        </button>
      </header>

      {/* ── Stat cards ── */}
      <section className="rd-stats-grid">
        <StatCard title="Rejected Doctors" value={rejectedDoctors.length} icon={UserX} color="red" />
        <StatCard
          title="Total Doctors"
          value={doctors.filter((u) => String(u.role || "").toLowerCase() === "doctor").length}
          icon={Stethoscope}
          color="blue"
        />
        <StatCard title="Need Review" value={rejectedDoctors.length} icon={AlertTriangle} color="amber" />
      </section>

      {/* ── Search panel ── */}
      <section className="rd-panel rd-search-panel">
        <div className="rd-search-field">
          <Search size={16} className="rd-search-icon" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rejected doctors by name, email, hospital, license..."
            className="rd-search-input"
          />
        </div>

        <p className="rd-search-count">
          Showing {rejectedDoctors.length} rejected doctor(s).
        </p>
      </section>

      {/* ── Table ── */}
      <div className="rd-table-panel">
        <div className="rd-table-scroll">
          <table className="rd-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Hospital</th>
                <th>Specialization</th>
                <th>License</th>
                <th>Status</th>
                <th className="rd-th-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rejectedDoctors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="rd-empty-cell">
                    No rejected doctors found.
                  </td>
                </tr>
              ) : (
                rejectedDoctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>
                      <div className="rd-doctor-cell">
                        <div className="rd-avatar">
                          {doctor.imageURL ? (
                            <img src={doctor.imageURL} alt={doctor.name} />
                          ) : (
                            String(doctor.name || "D").charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="rd-doctor-info">
                          <p className="rd-doctor-name">{doctor.name || "Unknown Doctor"}</p>
                          <p className="rd-doctor-email">{doctor.email || "No email"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="rd-td-muted">{doctor.hospitalName || "Not Assigned"}</td>
                    <td className="rd-td-muted">{doctor.specialization || "Not Provided"}</td>
                    <td className="rd-td-license">{doctor.licenseNumber || "N/A"}</td>

                    <td>
                      <span className="rd-status-pill">
                        <ShieldX size={13} />
                        Rejected
                      </span>
                    </td>

                    <td>
                      <div className="rd-actions-cell">
                        <button
                          onClick={() => setSelectedDoctor(doctor)}
                          className="rd-icon-btn rd-icon-btn-blue"
                          title="View Details"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => setRestoreDoctor(doctor)}
                          disabled={processingId === doctor.id}
                          className="rd-icon-btn rd-icon-btn-amber"
                          title="Move to Pending"
                        >
                          <RefreshCcw size={17} />
                        </button>

                        <button
                          onClick={() => handleApprove(doctor)}
                          disabled={processingId === doctor.id}
                          className="rd-icon-btn rd-icon-btn-teal"
                          title="Approve Doctor"
                        >
                          <CheckCircle2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDoctor && (
        <DoctorDetailsModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      )}

      {restoreDoctor && (
        <RestoreDialog
          doctor={restoreDoctor}
          onCancel={() => setRestoreDoctor(null)}
          onConfirm={handleRestore}
          loading={processingId === restoreDoctor.id}
        />
      )}

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700;800&display=swap');

        .rd-root {
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
          max-width: 1600px;
          margin: 0 auto;
          position: relative;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .rd-mounted { opacity: 1; transform: translateY(0); }
        .rd-root * { box-sizing: border-box; }

        /* ── Header ── */
        .rd-page-header {
          display: flex; flex-wrap: wrap; align-items: flex-start;
          justify-content: space-between; gap: 1.25rem; margin-bottom: 2.25rem;
        }
        .rd-page-title-group { max-width: 640px; }
        .rd-page-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; font-weight: 600; color: #F87171;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 100px; padding: 0.5rem 1rem; margin-bottom: 1rem;
        }
        .rd-page-title {
          font-size: clamp(1.75rem, 3.4vw, 2.5rem); font-weight: 800;
          letter-spacing: -0.025em; color: var(--text); margin: 0 0 0.75rem;
        }
        .rd-page-sub { font-size: 0.9375rem; color: var(--muted); margin: 0 0 0.75rem; line-height: 1.55; }
        .rd-updated-text { font-size: 0.75rem; color: var(--muted2); margin: 0; font-family: 'DM Mono', monospace; }

        .rd-btn {
          height: 48px; padding: 0 1.25rem; border-radius: var(--r-sm);
          font-weight: 700; font-size: 0.875rem; font-family: 'Inter', sans-serif;
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          cursor: pointer; border: 1px solid transparent; transition: all 0.18s ease;
          white-space: nowrap;
        }
        .rd-btn-ghost { background: rgba(255,255,255,0.04); border-color: var(--border2); color: var(--text); }
        .rd-btn-ghost:hover { background: rgba(255,255,255,0.09); }

        /* ── Stats grid ── */
        .rd-stats-grid {
          display: grid; grid-template-columns: 1fr;
          gap: 1rem; margin-bottom: 1.5rem;
        }
        @media (min-width: 700px) { .rd-stats-grid { grid-template-columns: repeat(3, 1fr); } }

        .rd-stat-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r-lg); box-shadow: var(--shadow);
          padding: 1.375rem;
        }
        .rd-stat-icon {
          width: 46px; height: 46px; border-radius: var(--r-sm); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; border: 1px solid;
          margin-bottom: 1.125rem;
        }
        .rd-stat-title { font-size: 0.8125rem; color: var(--muted); margin: 0 0 0.4rem; }
        .rd-stat-value { font-family: 'DM Mono', monospace; font-size: 2.25rem; font-weight: 500; letter-spacing: -0.03em; color: var(--text); margin: 0; }

        /* ── Panel base ── */
        .rd-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r-lg); box-shadow: var(--shadow);
          padding: 1.5rem; transition: border-color 0.2s;
        }
        .rd-panel:hover { border-color: var(--border2); }

        /* ── Search ── */
        .rd-search-panel { margin-bottom: 1.5rem; }
        .rd-search-field { position: relative; }
        .rd-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); }
        .rd-search-input {
          width: 100%; height: 50px; border-radius: var(--r-sm);
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          padding: 0 1rem 0 2.75rem; color: var(--text); font-size: 0.9375rem;
          outline: none; transition: border-color 0.18s;
        }
        .rd-search-input::placeholder { color: var(--muted2); }
        .rd-search-input:focus { border-color: rgba(239,68,68,0.45); }
        .rd-search-count { font-size: 0.8125rem; color: var(--muted); margin: 1.125rem 0 0; }

        /* ── Table panel ── */
        .rd-table-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r-lg); box-shadow: var(--shadow);
          overflow: hidden;
        }
        .rd-table-scroll { overflow-x: auto; }
        .rd-table { width: 100%; min-width: 980px; border-collapse: collapse; }
        .rd-table thead { background: rgba(255,255,255,0.025); border-bottom: 1px solid var(--border); }
        .rd-table th {
          padding: 1.125rem 1.5rem; text-align: left;
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--muted); white-space: nowrap;
        }
        .rd-th-actions { text-align: right; }
        .rd-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.15s; }
        .rd-table tbody tr:last-child { border-bottom: none; }
        .rd-table tbody tr:hover { background: rgba(255,255,255,0.025); }
        .rd-table td { padding: 1.125rem 1.5rem; vertical-align: middle; }

        .rd-empty-cell { text-align: center; padding: 3.5rem 1.5rem; color: var(--muted); }

        .rd-doctor-cell { display: flex; align-items: center; gap: 1rem; }
        .rd-avatar {
          width: 48px; height: 48px; border-radius: var(--r-sm); flex-shrink: 0;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.22);
          color: #F87171; display: flex; align-items: center; justify-content: center;
          font-weight: 800; overflow: hidden;
        }
        .rd-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .rd-doctor-info { min-width: 0; }
        .rd-doctor-name { font-weight: 700; color: var(--text); margin: 0; font-size: 0.9375rem; white-space: nowrap; }
        .rd-doctor-email { font-size: 0.8125rem; color: var(--muted); margin: 0.2rem 0 0; white-space: nowrap; }

        .rd-td-muted { color: var(--muted); font-size: 0.875rem; white-space: nowrap; }
        .rd-td-license { font-family: 'DM Mono', monospace; color: #6AA3FF; font-size: 0.8125rem; white-space: nowrap; }

        .rd-status-pill {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.35rem 0.75rem; border-radius: 100px;
          font-size: 0.75rem; font-weight: 700; white-space: nowrap;
          background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.22); color: #F87171;
        }

        .rd-actions-cell { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; }
        .rd-icon-btn {
          width: 40px; height: 40px; border-radius: var(--r-sm);
          display: flex; align-items: center; justify-content: center;
          border: 1px solid; cursor: pointer; transition: background 0.15s;
        }
        .rd-icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .rd-icon-btn-blue  { background: rgba(29,110,255,0.1); border-color: rgba(29,110,255,0.22); color: #6AA3FF; }
        .rd-icon-btn-blue:hover:not(:disabled) { background: rgba(29,110,255,0.18); }
        .rd-icon-btn-amber { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.22); color: var(--amber); }
        .rd-icon-btn-amber:hover:not(:disabled) { background: rgba(245,158,11,0.18); }
        .rd-icon-btn-teal  { background: rgba(0,229,195,0.1); border-color: rgba(0,229,195,0.22); color: var(--teal); }
        .rd-icon-btn-teal:hover:not(:disabled) { background: rgba(0,229,195,0.18); }

        /* ── Modals ── */
        .rd-modal-overlay {
          position: fixed; inset: 0; z-index: 999;
          background: rgba(2,6,16,0.78); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .rd-detail-modal {
          width: 100%; max-width: 760px; max-height: 90vh; overflow-y: auto;
          background: var(--bg); border: 1px solid var(--border2);
          border-radius: var(--r-lg); box-shadow: 0 24px 80px rgba(0,0,0,0.6);
        }
        .rd-detail-head {
          padding: 1.5rem 1.75rem; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .rd-detail-title { font-size: 1.375rem; font-weight: 800; color: var(--text); margin: 0; }
        .rd-detail-close {
          width: 40px; height: 40px; border-radius: var(--r-sm);
          background: rgba(255,255,255,0.05); border: 1px solid var(--border2);
          color: var(--text); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.15s; flex-shrink: 0;
        }
        .rd-detail-close:hover { background: rgba(255,255,255,0.1); }
        .rd-detail-body { padding: 1.75rem; display: grid; grid-template-columns: 1fr; gap: 0.875rem; }
        @media (min-width: 600px) { .rd-detail-body { grid-template-columns: repeat(2, 1fr); } }

        .rd-detail-box {
          background: rgba(255,255,255,0.03); border: 1px solid var(--border);
          border-radius: var(--r-sm); padding: 0.875rem 1rem;
        }
        .rd-detail-label {
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--muted); margin: 0 0 0.4rem;
        }
        .rd-detail-value { font-size: 0.9375rem; font-weight: 600; color: var(--text); margin: 0; word-break: break-all; }

        /* ── Restore dialog ── */
        .rd-restore-modal {
          width: 100%; max-width: 480px;
          background: var(--bg); border: 1px solid rgba(245,158,11,0.22);
          border-radius: var(--r-lg); box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          padding: 2rem;
        }
        .rd-restore-icon {
          width: 60px; height: 60px; border-radius: var(--r-lg); margin-bottom: 1.25rem;
          background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.22);
          color: var(--amber); display: flex; align-items: center; justify-content: center;
        }
        .rd-restore-title { font-size: 1.625rem; font-weight: 800; color: var(--text); margin: 0 0 0.75rem; }
        .rd-restore-desc { color: var(--muted); line-height: 1.6; margin: 0; font-size: 0.9375rem; }
        .rd-restore-desc strong { color: var(--text); font-weight: 800; }
        .rd-restore-note {
          margin-top: 1.5rem; border-radius: var(--r); padding: 1rem;
          background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.22);
        }
        .rd-restore-note p { color: #FBD38D; font-size: 0.875rem; margin: 0; }
        .rd-restore-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem; }
        .rd-restore-cancel {
          height: 48px; padding: 0 1.25rem; border-radius: var(--r-sm);
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          color: var(--text); font-weight: 700; font-size: 0.875rem;
          cursor: pointer; transition: background 0.15s;
        }
        .rd-restore-cancel:hover:not(:disabled) { background: rgba(255,255,255,0.09); }
        .rd-restore-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
        .rd-restore-confirm {
          height: 48px; padding: 0 1.25rem; border-radius: var(--r-sm);
          background: var(--amber); color: #1A1206; font-weight: 800; font-size: 0.875rem;
          border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
          transition: background 0.15s;
        }
        .rd-restore-confirm:hover:not(:disabled) { background: #FBB040; }
        .rd-restore-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Color helpers ── */
        .rd-icon-blue   { background: rgba(29,110,255,0.14); border-color: rgba(29,110,255,0.25); color: #6AA3FF; }
        .rd-icon-amber  { background: rgba(245,158,11,0.14); border-color: rgba(245,158,11,0.25); color: var(--amber); }
        .rd-icon-red    { background: rgba(239,68,68,0.14);  border-color: rgba(239,68,68,0.25); color: #F87171; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────
   DoctorDetailsModal
───────────────────────────────────────── */
function DoctorDetailsModal({ doctor, onClose }) {
  return (
    <div className="rd-modal-overlay">
      <div className="rd-detail-modal">
        <div className="rd-detail-head">
          <h2 className="rd-detail-title">Rejected Doctor Details</h2>

          <button onClick={onClose} className="rd-detail-close">
            <X size={18} />
          </button>
        </div>

        <div className="rd-detail-body">
          <Detail label="Name" value={doctor.name} />
          <Detail label="Email" value={doctor.email} />
          <Detail label="Phone" value={doctor.phone} />
          <Detail label="Hospital" value={doctor.hospitalName} />
          <Detail label="Department" value={doctor.department} />
          <Detail label="Specialization" value={doctor.specialization} />
          <Detail label="License Number" value={doctor.licenseNumber} />
          <Detail label="Status" value="Rejected" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   RestoreDialog
───────────────────────────────────────── */
function RestoreDialog({ doctor, onCancel, onConfirm, loading }) {
  return (
    <div className="rd-modal-overlay">
      <div className="rd-restore-modal">
        <div className="rd-restore-icon">
          <RefreshCcw size={28} />
        </div>

        <h2 className="rd-restore-title">Restore Application?</h2>

        <p className="rd-restore-desc">
          This will move <strong>{doctor.name || doctor.email}</strong> back to
          pending review.
        </p>

        <div className="rd-restore-note">
          <p>Admin can review and approve/reject this doctor again.</p>
        </div>

        <div className="rd-restore-actions">
          <button onClick={onCancel} disabled={loading} className="rd-restore-cancel">
            Cancel
          </button>

          <button onClick={onConfirm} disabled={loading} className="rd-restore-confirm">
            <RefreshCcw size={16} />
            {loading ? "Restoring..." : "Restore"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   StatCard
───────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rd-stat-card">
      <div className={`rd-stat-icon rd-icon-${color}`}>
        <Icon size={22} />
      </div>

      <p className="rd-stat-title">{title}</p>
      <p className="rd-stat-value">{value}</p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Detail
───────────────────────────────────────── */
function Detail({ label, value }) {
  return (
    <div className="rd-detail-box">
      <p className="rd-detail-label">{label}</p>
      <p className="rd-detail-value">{value || "Not Provided"}</p>
    </div>
  );
}