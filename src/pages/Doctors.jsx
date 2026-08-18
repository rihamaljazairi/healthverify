import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  Clipboard,
  Mail,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { db } from "../config/firebase";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import ErrorAlert from "../components/Common/ErrorAlert";
import SuccessAlert from "../components/Common/SuccessAlert";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes("approved-doctors")) {
      setStatusFilter("approved");
    } else if (location.pathname.includes("rejected-doctors")) {
      setStatusFilter("rejected");
    } else if (location.pathname.includes("pending-doctors")) {
      setStatusFilter("pending");
    } else {
      setStatusFilter("all");
    }
  }, [location.pathname]);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((u) => String(u.role || "").toLowerCase() === "doctor");

        setDoctors(data);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load doctors.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredDoctors = useMemo(() => {
    const q = search.toLowerCase().trim();

    return doctors.filter((d) => {
      const isApproved = d.approved === true || d.status === "verified";
      const isRejected = d.rejected === true || d.status === "rejected";
      const isPending = !isApproved && !isRejected;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && isApproved) ||
        (statusFilter === "pending" && isPending) ||
        (statusFilter === "rejected" && isRejected);

      const matchesSearch =
        !q ||
        String(d.name || "").toLowerCase().includes(q) ||
        String(d.email || "").toLowerCase().includes(q) ||
        String(d.specialization || "").toLowerCase().includes(q) ||
        String(d.hospitalName || "").toLowerCase().includes(q) ||
        String(d.department || "").toLowerCase().includes(q) ||
        String(d.licenseNumber || "").toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [doctors, search, statusFilter]);

  const approved = doctors.filter(
    (d) => d.approved === true || d.status === "verified"
  ).length;

  const pending = doctors.filter(
    (d) =>
      d.approved !== true &&
      d.rejected !== true &&
      d.status !== "verified" &&
      d.status !== "rejected"
  ).length;

  const rejected = doctors.filter(
    (d) => d.rejected === true || d.status === "rejected"
  ).length;

  const departments = new Set(
    doctors.map((d) => d.department).filter(Boolean)
  ).size;

  const handleRefresh = () => {
    setLastUpdated(new Date().toLocaleTimeString());
    setSuccess("Doctors list refreshed.");
  };

  const handleClear = () => {
    setSearch("");
    setStatusFilter("all");
    navigate("/admin/doctors");
  };

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

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={false}
        title="Loading Doctors"
        subtitle="Fetching healthcare professionals..."
      />
    );
  }

  const pageTitle =
    statusFilter === "approved"
      ? "Approved Doctors"
      : statusFilter === "rejected"
      ? "Rejected Doctors"
      : statusFilter === "pending"
      ? "Pending Doctors"
      : "All Doctors";

  return (
    <div className={`dr-root ${mounted ? "dr-mounted" : ""}`}>
      {error && <ErrorAlert message={error} onClose={() => setError("")} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess("")} />}

      {/* ── Page header ── */}
      <header className="dr-page-header">
        <div className="dr-page-title-group">
          <div className="dr-page-eyebrow">
            <Stethoscope size={14} />
            Healthcare Professionals Registry
          </div>

          <div className="dr-title-row">
            <h1 className="dr-page-title">{pageTitle}</h1>
            <span className={`dr-viewing-badge dr-viewing-${statusFilter}`}>
              Viewing: {pageTitle}
            </span>
          </div>

          <p className="dr-page-sub">
            Monitor and manage doctors across all departments.
          </p>

          <p className="dr-updated-text">Last updated: {lastUpdated}</p>
        </div>

        <div className="dr-header-actions">
          <button onClick={handleRefresh} className="dr-btn dr-btn-ghost">
            <RefreshCcw size={16} />
            Refresh
          </button>
          <button onClick={handleClear} className="dr-btn dr-btn-ghost">
            <X size={16} />
            Clear
          </button>
        </div>
      </header>

      {/* ── Stat cards ── */}
      <section className="dr-stats-grid">
        <StatCard
          title="All Doctors"
          value={doctors.length}
          icon={Users}
          color="blue"
          active={statusFilter === "all"}
          onClick={() => {
            setStatusFilter("all");
            navigate("/admin/doctors");
          }}
        />

        <StatCard
          title="Approved Doctors"
          value={approved}
          icon={BadgeCheck}
          color="teal"
          active={statusFilter === "approved"}
          onClick={() => {
            setStatusFilter("approved");
            navigate("/admin/approved-doctors");
          }}
        />

        <StatCard
          title="Pending Doctors"
          value={pending}
          icon={UserCheck}
          color="amber"
          active={statusFilter === "pending"}
          onClick={() => {
            setStatusFilter("pending");
            navigate("/admin/pending-doctors");
          }}
        />

        <StatCard
          title="Rejected Doctors"
          value={rejected}
          icon={X}
          color="red"
          active={statusFilter === "rejected"}
          onClick={() => {
            setStatusFilter("rejected");
            navigate("/admin/rejected-doctors");
          }}
        />

        <StatCard
          title="Departments"
          value={departments}
          icon={Building2}
          color="violet"
          active={false}
          onClick={() => setSuccess(`${departments} departments found.`)}
        />
      </section>

      {/* ── Search panel ── */}
      <section className="dr-panel dr-search-panel">
        <div className="dr-search-grid">
          <div className="dr-search-field">
            <Search size={16} className="dr-search-icon" />

            <input
              type="text"
              placeholder="Search by name, specialization, hospital, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="dr-search-input"
            />

            {search && (
              <button onClick={() => setSearch("")} className="dr-search-clear">
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value);

              if (value === "approved") navigate("/admin/approved-doctors");
              else if (value === "rejected") navigate("/admin/rejected-doctors");
              else if (value === "pending") navigate("/admin/pending-doctors");
              else navigate("/admin/doctors");
            }}
            className="dr-select"
          >
            <option value="all">All Doctors</option>
            <option value="approved">Approved Doctors</option>
            <option value="pending">Pending Doctors</option>
            <option value="rejected">Rejected Doctors</option>
          </select>
        </div>
      </section>

      {/* ── Active filters row ── */}
      {(search || statusFilter !== "all") && (
        <div className="dr-filters-row">
          <span>
            Showing <strong className="dr-filters-count">{filteredDoctors.length}</strong>{" "}
            result{filteredDoctors.length !== 1 ? "s" : ""}
          </span>

          {search && <span className="dr-filter-chip">Search: "{search}"</span>}
          <span className="dr-filter-chip">Filter: {statusFilter}</span>
        </div>
      )}

      {/* ── Cards / empty state ── */}
      {filteredDoctors.length === 0 ? (
        <div className="dr-panel dr-empty-state">
          <div className="dr-empty-icon">
            <Search size={22} />
          </div>
          <h3 className="dr-empty-title">No doctors found</h3>
          <p className="dr-empty-sub">No healthcare professionals match your filter.</p>
          <button onClick={handleClear} className="dr-btn dr-btn-ghost dr-empty-clear-btn">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="dr-cards-grid">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onView={() => navigate(`/admin/doctors/${doctor.id}`)}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700;800&display=swap');

        .dr-root {
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
        .dr-mounted { opacity: 1; transform: translateY(0); }
        .dr-root * { box-sizing: border-box; }

        /* ── Header ── */
        .dr-page-header {
          display: flex; flex-wrap: wrap; align-items: flex-start;
          justify-content: space-between; gap: 1.25rem; margin-bottom: 2rem;
        }
        .dr-page-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; font-weight: 600; color: #6AA3FF;
          background: rgba(29,110,255,0.1); border: 1px solid rgba(29,110,255,0.2);
          border-radius: 100px; padding: 0.5rem 1rem; margin-bottom: 1rem;
        }
        .dr-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.875rem; margin-bottom: 0.625rem; }
        .dr-page-title {
          font-size: clamp(1.625rem, 3vw, 2.25rem); font-weight: 800;
          letter-spacing: -0.025em; color: var(--text); margin: 0;
        }
        .dr-viewing-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.03em;
          padding: 0.35rem 0.75rem; border-radius: 100px; border: 1px solid;
          white-space: nowrap;
        }
        .dr-viewing-all      { background: rgba(29,110,255,0.1);  border-color: rgba(29,110,255,0.25);  color: #6AA3FF; }
        .dr-viewing-approved { background: rgba(0,229,195,0.1);   border-color: rgba(0,229,195,0.25);   color: var(--teal); }
        .dr-viewing-pending  { background: rgba(245,158,11,0.1);  border-color: rgba(245,158,11,0.25);  color: var(--amber); }
        .dr-viewing-rejected { background: rgba(239,68,68,0.1);   border-color: rgba(239,68,68,0.25);   color: #F87171; }

        .dr-page-sub { font-size: 0.9375rem; color: var(--muted); margin: 0 0 0.625rem; }
        .dr-updated-text { font-size: 0.75rem; color: var(--muted2); margin: 0; font-family: 'DM Mono', monospace; }

        .dr-header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .dr-btn {
          height: 46px; padding: 0 1.125rem; border-radius: var(--r-sm);
          font-weight: 700; font-size: 0.8125rem; font-family: 'Inter', sans-serif;
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          cursor: pointer; border: 1px solid transparent; transition: all 0.18s ease;
          white-space: nowrap;
        }
        .dr-btn-ghost { background: rgba(255,255,255,0.04); border-color: var(--border2); color: var(--text); }
        .dr-btn-ghost:hover { background: rgba(255,255,255,0.09); }

        /* ── Stats grid ── */
        .dr-stats-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1rem; margin-bottom: 1.5rem;
        }
        @media (min-width: 700px) { .dr-stats-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1180px) { .dr-stats-grid { grid-template-columns: repeat(5, 1fr); } }

        .dr-stat-card {
          position: relative; text-align: left; display: flex; align-items: center; gap: 1rem;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r); box-shadow: var(--shadow);
          padding: 1.125rem 1.25rem; cursor: pointer;
          transition: all 0.18s ease; font-family: inherit; color: inherit;
        }
        .dr-stat-card:hover { border-color: var(--border2); background: var(--surface2); }

        .dr-stat-card-active { transform: translateY(-2px); }
        .dr-stat-active-dot {
          position: absolute; top: 0.75rem; right: 0.75rem;
          width: 7px; height: 7px; border-radius: 50%;
          animation: dr-pulse 2s ease-in-out infinite;
        }
        @keyframes dr-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

        .dr-stat-card-active-blue {
          border-color: rgba(29,110,255,0.5); background: rgba(29,110,255,0.1);
          box-shadow: 0 0 0 1px rgba(29,110,255,0.25), 0 10px 30px rgba(29,110,255,0.18);
        }
        .dr-stat-card-active-blue .dr-stat-active-dot { background: #6AA3FF; box-shadow: 0 0 8px #1D6EFF; }

        .dr-stat-card-active-teal {
          border-color: rgba(0,229,195,0.5); background: rgba(0,229,195,0.1);
          box-shadow: 0 0 0 1px rgba(0,229,195,0.25), 0 10px 30px rgba(0,229,195,0.18);
        }
        .dr-stat-card-active-teal .dr-stat-active-dot { background: var(--teal); box-shadow: 0 0 8px var(--teal); }

        .dr-stat-card-active-amber {
          border-color: rgba(245,158,11,0.5); background: rgba(245,158,11,0.1);
          box-shadow: 0 0 0 1px rgba(245,158,11,0.25), 0 10px 30px rgba(245,158,11,0.18);
        }
        .dr-stat-card-active-amber .dr-stat-active-dot { background: var(--amber); box-shadow: 0 0 8px var(--amber); }

        .dr-stat-card-active-red {
          border-color: rgba(239,68,68,0.5); background: rgba(239,68,68,0.1);
          box-shadow: 0 0 0 1px rgba(239,68,68,0.25), 0 10px 30px rgba(239,68,68,0.18);
        }
        .dr-stat-card-active-red .dr-stat-active-dot { background: #F87171; box-shadow: 0 0 8px var(--red); }

        .dr-stat-card-active-violet {
          border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.1);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.25), 0 10px 30px rgba(139,92,246,0.18);
        }
        .dr-stat-card-active-violet .dr-stat-active-dot { background: #A78BFA; box-shadow: 0 0 8px var(--violet); }

        .dr-stat-icon {
          width: 44px; height: 44px; border-radius: var(--r-sm); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; border: 1px solid;
        }
        .dr-stat-value { font-family: 'DM Mono', monospace; font-size: 1.75rem; font-weight: 500; color: var(--text); line-height: 1; margin: 0; }
        .dr-stat-title { font-size: 0.75rem; color: var(--muted); margin: 0.25rem 0 0; }

        /* ── Panel base ── */
        .dr-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r-lg); box-shadow: var(--shadow);
          padding: 1.5rem; transition: border-color 0.2s;
        }
        .dr-panel:hover { border-color: var(--border2); }

        /* ── Search ── */
        .dr-search-panel { margin-bottom: 1.25rem; }
        .dr-search-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        @media (min-width: 900px) { .dr-search-grid { grid-template-columns: 2fr 1fr; } }

        .dr-search-field { position: relative; }
        .dr-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); }
        .dr-search-input {
          width: 100%; height: 50px; border-radius: var(--r-sm);
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          padding: 0 2.5rem 0 2.75rem; color: var(--text); font-size: 0.9375rem;
          outline: none; transition: border-color 0.18s;
        }
        .dr-search-input::placeholder { color: var(--muted2); }
        .dr-search-input:focus { border-color: rgba(29,110,255,0.5); }
        .dr-search-clear {
          position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%);
          color: var(--muted); background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: color 0.15s;
        }
        .dr-search-clear:hover { color: var(--text); }

        .dr-select {
          height: 50px; border-radius: var(--r-sm);
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          padding: 0 1rem; color: var(--text); font-size: 0.9375rem;
          outline: none; transition: border-color 0.18s; font-family: inherit;
        }
        .dr-select:focus { border-color: rgba(29,110,255,0.5); }
        .dr-select option { background: #0D1733; color: var(--text); }

        /* ── Filters row ── */
        .dr-filters-row {
          display: flex; flex-wrap: wrap; align-items: center; gap: 0.625rem;
          font-size: 0.8125rem; color: var(--muted); margin-bottom: 1.25rem;
        }
        .dr-filters-count { color: var(--text); font-weight: 700; }
        .dr-filter-chip {
          padding: 0.25rem 0.625rem; border-radius: var(--r-sm);
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          color: var(--text); font-weight: 500; font-size: 0.75rem;
        }

        /* ── Empty state ── */
        .dr-empty-state { text-align: center; padding: 3.5rem 2rem; }
        .dr-empty-icon {
          width: 56px; height: 56px; border-radius: var(--r); margin: 0 auto 1rem;
          background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
          color: var(--muted); display: flex; align-items: center; justify-content: center;
        }
        .dr-empty-title { font-size: 1.125rem; font-weight: 800; color: var(--text); margin: 0 0 0.5rem; }
        .dr-empty-sub { font-size: 0.875rem; color: var(--muted); margin: 0 0 1.25rem; }
        .dr-empty-clear-btn { margin: 0 auto; }

        /* ── Cards grid ── */
        .dr-cards-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        @media (min-width: 768px) { .dr-cards-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1280px) { .dr-cards-grid { grid-template-columns: repeat(3, 1fr); } }

        .dr-doctor-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--r); box-shadow: var(--shadow);
          padding: 1.25rem; transition: all 0.2s ease;
        }
        .dr-doctor-card:hover { border-color: var(--border2); background: var(--surface2); }

        .dr-doctor-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.875rem; margin-bottom: 1rem; }
        .dr-doctor-head-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
        .dr-avatar {
          width: 48px; height: 48px; border-radius: var(--r-sm); flex-shrink: 0;
          background: rgba(29,110,255,0.12); border: 1px solid rgba(29,110,255,0.22);
          color: #6AA3FF; display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.9375rem; overflow: hidden;
        }
        .dr-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .dr-doctor-name-wrap { min-width: 0; }
        .dr-doctor-name { font-size: 0.9375rem; font-weight: 700; color: var(--text); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dr-doctor-spec { font-size: 0.75rem; color: var(--muted); margin: 0.15rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .dr-status-pill {
          flex-shrink: 0; padding: 0.3rem 0.7rem; border-radius: 100px;
          font-size: 0.6875rem; font-weight: 700; border: 1px solid; white-space: nowrap;
        }
        .dr-status-teal  { background: rgba(0,229,195,0.1); border-color: rgba(0,229,195,0.22); color: var(--teal); }
        .dr-status-amber { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.22); color: var(--amber); }
        .dr-status-red   { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.22); color: #F87171; }

        /* ── Info rows ── */
        .dr-info-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
        .dr-info-row {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          gap: 0.625rem; background: none; border: none; cursor: pointer;
          color: var(--muted); transition: color 0.15s; font-family: inherit; padding: 0;
        }
        .dr-info-row:hover { color: var(--text); }
        .dr-info-row-left { display: flex; align-items: center; gap: 0.625rem; min-width: 0; }
        .dr-info-icon { color: var(--muted2); flex-shrink: 0; }
        .dr-info-text { font-size: 0.8125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dr-info-clip { color: var(--muted2); flex-shrink: 0; }

        /* ── Card footer ── */
        .dr-card-footer {
          display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
          padding-top: 1rem; border-top: 1px solid var(--border);
        }
        .dr-dept-chip {
          font-size: 0.75rem; color: var(--muted);
          padding: 0.2rem 0.55rem; border-radius: 6px;
          background: rgba(255,255,255,0.04);
        }
        .dr-view-btn {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.5rem 0.875rem; border-radius: var(--r-sm);
          background: var(--blue); color: #fff; font-size: 0.8125rem; font-weight: 700;
          border: none; cursor: pointer; transition: background 0.15s, transform 0.1s;
        }
        .dr-view-btn:hover { background: #3D82FF; }
        .dr-view-btn:active { transform: scale(0.96); }

        /* ── Color helpers for stat icons ── */
        .dr-icon-blue   { background: rgba(29,110,255,0.14); border-color: rgba(29,110,255,0.25); color: #6AA3FF; }
        .dr-icon-teal   { background: rgba(0,229,195,0.12);  border-color: rgba(0,229,195,0.25); color: var(--teal); }
        .dr-icon-amber  { background: rgba(245,158,11,0.14); border-color: rgba(245,158,11,0.25); color: #FBB040; }
        .dr-icon-red    { background: rgba(239,68,68,0.14);  border-color: rgba(239,68,68,0.25); color: #F87171; }
        .dr-icon-violet { background: rgba(139,92,246,0.14); border-color: rgba(139,92,246,0.25); color: #A78BFA; }

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
function StatCard({ title, value, icon: Icon, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`dr-stat-card ${active ? `dr-stat-card-active dr-stat-card-active-${color}` : ""}`}
    >
      {active && <span className="dr-stat-active-dot" />}

      <div className={`dr-stat-icon dr-icon-${color}`}>
        <Icon size={20} />
      </div>

      <div>
        <p className="dr-stat-value">{value}</p>
        <p className="dr-stat-title">{title}</p>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────
   DoctorCard
───────────────────────────────────────── */
function DoctorCard({ doctor, onView, onCopy }) {
  const initials = (doctor.name || "D")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusConfig =
    doctor.approved || doctor.status === "verified"
      ? { label: "Verified", cls: "dr-status-pill dr-status-teal" }
      : doctor.rejected || doctor.status === "rejected"
      ? { label: "Rejected", cls: "dr-status-pill dr-status-red" }
      : { label: "Pending", cls: "dr-status-pill dr-status-amber" };

  return (
    <div className="dr-doctor-card">
      <div className="dr-doctor-head">
        <div className="dr-doctor-head-left">
          <div className="dr-avatar">
            {doctor.profileImageUrl || doctor.imageURL ? (
              <img src={doctor.profileImageUrl || doctor.imageURL} alt={doctor.name} />
            ) : (
              initials
            )}
          </div>

          <div className="dr-doctor-name-wrap">
            <h3 className="dr-doctor-name">{doctor.name || "Unknown Doctor"}</h3>
            <p className="dr-doctor-spec">{doctor.specialization || "General Medicine"}</p>
          </div>
        </div>

        <span className={statusConfig.cls}>{statusConfig.label}</span>
      </div>

      <div className="dr-info-list">
        <InfoRow icon={Mail} text={doctor.email} onClick={() => onCopy(doctor.email, "Email")} />
        <InfoRow icon={Phone} text={doctor.phone} onClick={() => onCopy(doctor.phone, "Phone")} />
        <InfoRow icon={Building2} text={doctor.hospitalName} />
        <InfoRow
          icon={ShieldCheck}
          text={doctor.licenseNumber}
          onClick={() => onCopy(doctor.licenseNumber, "License number")}
        />
      </div>

      <div className="dr-card-footer">
        <div>
          {doctor.department && <span className="dr-dept-chip">{doctor.department}</span>}
        </div>

        <button onClick={onView} className="dr-view-btn">
          View Profile
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, text, onClick }) {
  if (!text) return null;

  return (
    <button type="button" onClick={onClick} className="dr-info-row">
      <span className="dr-info-row-left">
        <Icon size={13} className="dr-info-icon" />
        <span className="dr-info-text">{text}</span>
      </span>

      {onClick && <Clipboard size={12} className="dr-info-clip" />}
    </button>
  );
}