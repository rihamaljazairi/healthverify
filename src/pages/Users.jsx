import { useEffect, useMemo, useState, useRef } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import UserTable from "../components/Tables/UserTable";

import {
  Activity,
  Clipboard,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  X,
  Sparkles,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  Building2,
  Phone,
  Mail,
  Hash,
  Layers,
  BadgeCheck,
  Filter,
} from "lucide-react";

import { db } from "../config/firebase";
import SuccessAlert from "../components/Common/SuccessAlert";
import ErrorAlert from "../components/Common/ErrorAlert";
import { createAuditLog } from "../services/auditService";

const initialFormData = {
  name: "",
  email: "",
  role: "Doctor",
  phone: "",
  hospitalName: "",
  department: "",
  specialization: "",
  licenseNumber: "",
};

const ROLE_OPTIONS = ["Doctor", "Nurse", "Pharmacist", "Admin"];

export default function Users() {
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");

  const [showForm, setShowForm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [mounted, setMounted] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});

  const formRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        setAllUsers(list);
        setLastUpdated(new Date().toLocaleTimeString());
      },
      (err) => {
        console.error(err);
        setError("Failed to load users.");
      }
    );
    return () => unsubscribe();
  }, []);

  // Scroll form into view when opened
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [showForm]);

  const stats = useMemo(() => {
    const total = allUsers.length;
    const doctors = allUsers.filter((u) => String(u.role || "").toLowerCase() === "doctor").length;
    const verified = allUsers.filter((u) => u.approved === true || u.status === "verified").length;
    const pending = allUsers.filter((u) => !u.approved && !u.rejected).length;

    return [
      { title: "Total Users", value: total, icon: <UsersIcon size={22} />, color: "blue", sub: "All staff", action: () => { setRoleFilter("All Roles"); setSearchTerm(""); } },
      { title: "Doctors", value: doctors, icon: <Stethoscope size={22} />, color: "cyan", sub: "Physicians", action: () => { setRoleFilter("Doctor"); setSearchTerm(""); } },
      { title: "Verified", value: verified, icon: <BadgeCheck size={22} />, color: "emerald", sub: "Approved accounts", action: () => { setSearchTerm("verified"); setRoleFilter("All Roles"); } },
      { title: "Pending", value: pending, icon: <UserPlus size={22} />, color: "amber", sub: "Awaiting review", action: () => { setSearchTerm("pending"); setRoleFilter("All Roles"); } },
    ];
  }, [allUsers]);

  const filteredPreviewCount = useMemo(() => {
    return allUsers.filter((user) => {
      const value = searchTerm.toLowerCase().trim();
      const role = String(user.role || "").toLowerCase();
      const matchesRole = roleFilter === "All Roles" || role === roleFilter.toLowerCase();
      const matchesSearch =
        !value ||
        String(user.name || "").toLowerCase().includes(value) ||
        String(user.email || "").toLowerCase().includes(value) ||
        String(user.role || "").toLowerCase().includes(value) ||
        String(user.status || "").toLowerCase().includes(value) ||
        String(user.hospitalName || "").toLowerCase().includes(value) ||
        String(user.licenseNumber || "").toLowerCase().includes(value);
      return matchesRole && matchesSearch;
    }).length;
  }, [allUsers, searchTerm, roleFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormTouched((prev) => ({ ...prev, [name]: true }));
    // Clear field error on change
    if (formErrors[name]) {
      setFormErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setFormTouched({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full name is required.";
    if (!formData.email.trim()) errors.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) errors.email = "Enter a valid email address.";
    if (!formData.role.trim()) errors.role = "Role is required.";
    if (!formData.phone.trim()) errors.phone = "Phone number is required.";
    if (!formData.hospitalName.trim()) errors.hospitalName = "Hospital name is required.";
    if (!formData.department.trim()) errors.department = "Department is required.";
    if (!formData.specialization.trim()) errors.specialization = "Specialization is required.";
    if (!formData.licenseNumber.trim()) errors.licenseNumber = "License number is required.";
    return errors;
  };

  const handleOpenForm = () => {
    resetForm();
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Touch all fields to show errors
      const touched = {};
      Object.keys(initialFormData).forEach((k) => (touched[k] = true));
      setFormTouched(touched);
      setShowSaveConfirm(false);
      setError("Please fix the highlighted fields before saving.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const cleanRole = formData.role.toLowerCase();
      const newUser = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: cleanRole,
        phone: formData.phone.trim(),
        hospitalName: formData.hospitalName.trim(),
        department: formData.department.trim(),
        specialization: formData.specialization.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        approved: false,
        rejected: false,
        status: "pending",
        verificationStatus: "pending",
        aiScore: 0,
        documentConfidence: 0,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "users"), newUser);

      try {
        await createAuditLog({
          type: "activity",
          action: "Created user profile",
          targetId: docRef.id,
          targetName: formData.name,
          targetEmail: formData.email,
          details: `${formData.role} profile was created by admin.`,
        });
      } catch (auditError) {
        console.warn("Audit log failed:", auditError);
      }

      setSuccess(`✓ ${formData.name}'s profile has been created successfully.`);
      resetForm();
      setShowSaveConfirm(false);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError("Failed to create user. Check Firebase rules and connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowCancelConfirm(false);
    setShowForm(false);
    setError("");
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter("All Roles");
  };

  const handleRefresh = () => {
    setLastUpdated(new Date().toLocaleTimeString());
    setSuccess("Users list refreshed.");
  };

  const handleCopyForm = async () => {
    const text = JSON.stringify(formData, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Form data copied to clipboard.");
    } catch {
      setError("Copy failed.");
    }
  };

  const completedFields = Object.values(formData).filter((v) => String(v).trim()).length;
  const totalFields = Object.keys(formData).length;
  const formProgress = Math.round((completedFields / totalFields) * 100);

  return (
    <div className={`um-root ${mounted ? "um-mounted" : ""}`}>
      {/* Ambient orbs */}
      <div className="um-orb um-orb-1" />
      <div className="um-orb um-orb-2" />
      <div className="um-orb um-orb-3" />

      <div className="um-content">
        {success && <SuccessAlert message={success} onClose={() => setSuccess("")} />}
        {error && <ErrorAlert message={error} onClose={() => setError("")} autoClose={false} />}

        {/* ── Header ── */}
        <header className="um-header">
          <div className="um-header-left">
            <div className="um-eyebrow">
              <Activity size={14} />
              Healthcare Staff Management
            </div>
            <h1 className="um-title">Users Management</h1>
            <p className="um-subtitle">
              Manage administrators, doctors, nurses, pharmacists, and all healthcare staff from one place.
            </p>
            <p className="um-updated">
              <span className="um-updated-dot" />
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="um-header-actions">
            <button onClick={handleRefresh} className="um-btn um-btn-ghost">
              <RefreshCcw size={18} />
              Refresh
            </button>
            <button onClick={handleOpenForm} className="um-btn um-btn-primary">
              <Plus size={18} />
              Add New User
              <ChevronRight size={16} className="um-btn-arrow" />
            </button>
          </div>
        </header>

        {/* ── Stats grid ── */}
        <section className="um-stats-grid">
          {stats.map((item, index) => (
            <StatCard key={index} {...item} />
          ))}
        </section>

        {/* ── Create User Form ── */}
        {showForm && (
          <div ref={formRef} className="um-form-panel">
            {/* Form header */}
            <div className="um-form-header">
              <div className="um-form-header-left">
                <div className="um-form-icon">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="um-form-title">Create New User</h2>
                  <p className="um-form-sub">Add a healthcare staff profile to HealthVerify.</p>
                </div>
              </div>
              <button onClick={() => setShowCancelConfirm(true)} className="um-icon-btn">
                <X size={18} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="um-progress-wrap">
              <div className="um-progress-row">
                <span className="um-progress-label">{completedFields} / {totalFields} fields completed</span>
                <span className="um-progress-pct">{formProgress}%</span>
              </div>
              <div className="um-progress-track">
                <div className="um-progress-fill" style={{ width: `${formProgress}%` }} />
              </div>
            </div>

            {/* Form grid */}
            <div className="um-form-grid">
              <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange}
                placeholder="Dr. Sarah Al-Rashidi" icon={<UsersIcon size={16} />}
                error={formTouched.name && formErrors.name} />

              <InputField label="Email Address" name="email" type="email" value={formData.email}
                onChange={handleChange} placeholder="sarah@hospital.com" icon={<Mail size={16} />}
                error={formTouched.email && formErrors.email} />

              <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="+966 5X XXX XXXX" icon={<Phone size={16} />}
                error={formTouched.phone && formErrors.phone} />

              <InputField label="Hospital Name" name="hospitalName" value={formData.hospitalName}
                onChange={handleChange} placeholder="King Fahad Medical City" icon={<Building2 size={16} />}
                error={formTouched.hospitalName && formErrors.hospitalName} />

              <InputField label="Department" name="department" value={formData.department}
                onChange={handleChange} placeholder="Cardiology" icon={<Layers size={16} />}
                error={formTouched.department && formErrors.department} />

              <InputField label="Specialization" name="specialization" value={formData.specialization}
                onChange={handleChange} placeholder="Interventional Cardiology" icon={<Stethoscope size={16} />}
                error={formTouched.specialization && formErrors.specialization} />

              <InputField label="License Number" name="licenseNumber" value={formData.licenseNumber}
                onChange={handleChange} placeholder="SA-MED-XXXXX" icon={<Hash size={16} />}
                error={formTouched.licenseNumber && formErrors.licenseNumber} />

              <SelectField label="User Role" name="role" value={formData.role} onChange={handleChange}
                options={ROLE_OPTIONS} error={formTouched.role && formErrors.role} />
            </div>

            {/* Form actions */}
            <div className="um-form-actions">
              <button onClick={handleCopyForm} className="um-btn um-btn-ghost um-btn-sm">
                <Clipboard size={16} />
                Copy as JSON
              </button>
              <div className="um-form-actions-right">
                <button onClick={() => setShowCancelConfirm(true)} className="um-btn um-btn-ghost um-btn-sm">
                  Discard
                </button>
                <button onClick={() => setShowSaveConfirm(true)} disabled={saving} className="um-btn um-btn-primary um-btn-sm">
                  {saving ? <Loader2 size={16} className="um-spin" /> : <Save size={16} />}
                  {saving ? "Saving…" : "Save User"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Filter panel ── */}
        <div className="um-filter-panel">
          <div className="um-filter-header">
            <div className="um-filter-header-left">
              <Filter size={16} className="um-filter-icon" />
              <h3 className="um-filter-title">Filter Users</h3>
            </div>
            <span className="um-filter-count">
              {filteredPreviewCount} result{filteredPreviewCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="um-filter-grid">
            <div className="um-field-wrap">
              <label className="um-field-label">Search</label>
              <div className="um-search-wrap">
                <Search size={16} className="um-search-icon" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, role, hospital…"
                  className="um-input um-input-search"
                />
                {searchTerm && (
                  <button className="um-search-clear" onClick={() => setSearchTerm("")}>
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="um-field-wrap">
              <label className="um-field-label">Role</label>
              <div className="um-role-pills">
                {["All Roles", ...ROLE_OPTIONS].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`um-role-pill ${roleFilter === r ? "um-role-pill-active" : ""}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="um-field-wrap um-field-clear">
              <button onClick={handleClearFilters} className="um-btn um-btn-ghost um-btn-sm um-clear-btn">
                <Trash2 size={15} />
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* ── Users Table ── */}
        <div className="um-table-panel">
          <div className="um-table-header">
            <div>
              <h2 className="um-table-title">Registered Users</h2>
              <p className="um-table-sub">Healthcare staff currently registered in the system.</p>
            </div>
            <div className="um-table-badge">
              <ShieldCheck size={14} />
              Live Data
            </div>
          </div>
          <div className="um-table-body">
            <UserTable search={searchTerm} role={roleFilter} />
          </div>
        </div>

        {/* ── Confirm Save ── */}
        <ConfirmDialog
          open={showSaveConfirm}
          title="Create User Profile"
          message={`You're about to create a profile for ${formData.name || "this user"}. They'll be added with a pending status.`}
          confirmText={saving ? "Creating…" : "Create User"}
          cancelText="Go Back"
          onCancel={() => setShowSaveConfirm(false)}
          onConfirm={handleSave}
          disabled={saving}
          icon={<UserPlus size={28} />}
          color="blue"
        />

        {/* ── Confirm Cancel ── */}
        <ConfirmDialog
          open={showCancelConfirm}
          title="Discard Changes?"
          message="All form data will be lost. This can't be undone."
          confirmText="Discard"
          cancelText="Keep Editing"
          danger
          onCancel={() => setShowCancelConfirm(false)}
          onConfirm={handleCancel}
          icon={<Trash2 size={28} />}
          color="red"
        />
      </div>

      <style>{STYLES}</style>
    </div>
  );
}

/* ─────────────────────────────────────────
   StatCard
───────────────────────────────────────── */
function StatCard({ title, value, icon, color, sub, action }) {
  const colorMap = {
    blue:    { bg: "rgba(29,110,255,0.1)",   border: "rgba(29,110,255,0.2)",   text: "#6AA3FF",  glow: "rgba(29,110,255,0.15)" },
    cyan:    { bg: "rgba(6,182,212,0.1)",    border: "rgba(6,182,212,0.2)",    text: "#22D3EE",  glow: "rgba(6,182,212,0.15)" },
    emerald: { bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.2)",   text: "#34D399",  glow: "rgba(16,185,129,0.15)" },
    amber:   { bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.2)",   text: "#FBB040",  glow: "rgba(245,158,11,0.15)" },
  };
  const c = colorMap[color];

  return (
    <button
      onClick={action}
      className="um-stat-card"
      style={{ "--sc-bg": c.bg, "--sc-border": c.border, "--sc-text": c.text, "--sc-glow": c.glow }}
    >
      <div className="um-stat-glow" />
      <div className="um-stat-icon-wrap">
        {icon}
      </div>
      <div className="um-stat-value">{value}</div>
      <div className="um-stat-title">{title}</div>
      <div className="um-stat-sub">{sub}</div>
      <div className="um-stat-arrow">
        <ChevronRight size={14} />
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────
   InputField
───────────────────────────────────────── */
function InputField({ label, name, value, onChange, placeholder, type = "text", icon, error }) {
  return (
    <div className="um-input-group">
      <label className="um-field-label">{label}</label>
      <div className={`um-input-wrap ${error ? "um-input-wrap-error" : ""}`}>
        {icon && <span className="um-input-icon">{icon}</span>}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="um-input"
          style={{ paddingLeft: icon ? "2.75rem" : "1rem" }}
        />
        {value && !error && <Check size={14} className="um-input-check" />}
        {error && <AlertCircle size={14} className="um-input-err-icon" />}
      </div>
      {error && <p className="um-field-error">{error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────
   SelectField
───────────────────────────────────────── */
function SelectField({ label, name, value, onChange, options, error }) {
  return (
    <div className="um-input-group">
      <label className="um-field-label">{label}</label>
      <div className={`um-input-wrap ${error ? "um-input-wrap-error" : ""}`}>
        <select name={name} value={value} onChange={onChange} className="um-input um-select">
          {options.map((o) => (
            <option key={o} value={o} className="um-option">{o}</option>
          ))}
        </select>
      </div>
      {error && <p className="um-field-error">{error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────
   ConfirmDialog
───────────────────────────────────────── */
function ConfirmDialog({ open, title, message, confirmText, cancelText, onCancel, onConfirm, danger = false, disabled = false, icon, color = "blue" }) {
  if (!open) return null;
  return (
    <div className="um-dialog-overlay">
      <div className="um-dialog">
        <div className={`um-dialog-icon-wrap um-dialog-icon-${danger ? "red" : "blue"}`}>
          {icon}
        </div>
        <h2 className="um-dialog-title">{title}</h2>
        <p className="um-dialog-message">{message}</p>
        <div className="um-dialog-actions">
          <button onClick={onCancel} disabled={disabled} className="um-btn um-btn-ghost um-btn-sm">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`um-btn um-btn-sm ${danger ? "um-btn-danger" : "um-btn-primary"}`}
          >
            {disabled && <Loader2 size={15} className="um-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .um-root {
    --bg:       #04091A;
    --s1:       #070F24;
    --s2:       #0A1430;
    --s3:       #0D1A3D;
    --border:   rgba(255,255,255,0.07);
    --border2:  rgba(255,255,255,0.13);
    --blue:     #1D6EFF;
    --cyan:     #06B6D4;
    --emerald:  #10B981;
    --amber:    #F59E0B;
    --red:      #EF4444;
    --text:     #EDF2FF;
    --muted:    #556080;
    --muted2:   #38476A;
    --r:        16px;
    --r-sm:     10px;
    --r-lg:     28px;
    --shadow:   0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05);
    --shadow-lg:0 20px 70px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06);

    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    padding: 2.5rem 2rem 4rem;
    max-width: 1600px;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .um-mounted { opacity: 1; transform: translateY(0); }
  .um-root * { box-sizing: border-box; }

  /* ── Ambient orbs ── */
  .um-orb {
    position: fixed; border-radius: 50%; pointer-events: none;
    filter: blur(80px); z-index: 0;
  }
  .um-orb-1 { width: 600px; height: 600px; top: -200px; right: -150px; background: radial-gradient(circle, rgba(29,110,255,0.12), transparent 70%); }
  .um-orb-2 { width: 500px; height: 500px; bottom: -150px; left: -100px; background: radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%); }
  .um-orb-3 { width: 400px; height: 400px; top: 40%; left: 40%; transform: translate(-50%, -50%); background: radial-gradient(circle, rgba(6,182,212,0.06), transparent 70%); }

  .um-content { position: relative; z-index: 1; }

  /* ── Header ── */
  .um-header {
    display: flex; flex-wrap: wrap; align-items: flex-start;
    justify-content: space-between; gap: 1.5rem;
    margin-bottom: 2.5rem;
  }
  .um-eyebrow {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.45rem 1rem; border-radius: 100px;
    background: rgba(29,110,255,0.1); border: 1px solid rgba(29,110,255,0.22);
    color: #6AA3FF; font-size: 0.75rem; font-weight: 700;
    letter-spacing: 0.04em; margin-bottom: 1rem;
  }
  .um-title {
    font-size: clamp(2rem, 4vw, 3rem); font-weight: 900;
    letter-spacing: -0.03em; color: var(--text);
    margin: 0 0 0.75rem; line-height: 1.1;
    background: linear-gradient(135deg, #ffffff 0%, #a8c4ff 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .um-subtitle { font-size: 0.9375rem; color: var(--muted); margin: 0 0 1rem; max-width: 560px; line-height: 1.6; }
  .um-updated { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--muted2); font-family: 'DM Mono', monospace; }
  .um-updated-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--emerald); box-shadow: 0 0 8px rgba(16,185,129,0.6); animation: um-pulse 2.5s ease-in-out infinite; }
  @keyframes um-pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

  .um-header-actions { display: flex; flex-direction: column; gap: 0.75rem; align-items: stretch; }

  /* ── Buttons ── */
  .um-btn {
    height: 50px; padding: 0 1.375rem; border-radius: var(--r-sm);
    font-weight: 700; font-size: 0.875rem; font-family: 'Plus Jakarta Sans', sans-serif;
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    cursor: pointer; border: 1px solid transparent;
    transition: all 0.2s ease; white-space: nowrap;
  }
  .um-btn-sm { height: 44px; font-size: 0.8125rem; }
  .um-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .um-btn-ghost {
    background: rgba(255,255,255,0.05); border-color: var(--border2); color: var(--text);
  }
  .um-btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.1); }

  .um-btn-primary {
    background: linear-gradient(135deg, #1D6EFF 0%, #6C3FFF 100%);
    color: #fff; border-color: transparent;
    box-shadow: 0 4px 20px rgba(29,110,255,0.35);
    position: relative; overflow: hidden;
  }
  .um-btn-primary::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, #3A87FF 0%, #8A5FFF 100%);
    opacity: 0; transition: opacity 0.2s;
  }
  .um-btn-primary:hover:not(:disabled)::before { opacity: 1; }
  .um-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(29,110,255,0.45); }
  .um-btn-primary > * { position: relative; z-index: 1; }
  .um-btn-arrow { transition: transform 0.2s; }
  .um-btn-primary:hover .um-btn-arrow { transform: translateX(3px); }

  .um-btn-danger {
    background: var(--red); color: #fff;
    box-shadow: 0 4px 20px rgba(239,68,68,0.3);
  }
  .um-btn-danger:hover:not(:disabled) { background: #F87171; transform: translateY(-1px); }

  .um-icon-btn {
    width: 42px; height: 42px; border-radius: 12px;
    background: rgba(255,255,255,0.05); border: 1px solid var(--border2);
    display: flex; align-items: center; justify-content: center;
    color: var(--text); cursor: pointer; transition: background 0.15s;
  }
  .um-icon-btn:hover { background: rgba(255,255,255,0.1); }

  /* ── Stat cards ── */
  .um-stats-grid {
    display: grid; grid-template-columns: repeat(2,1fr); gap: 1.25rem;
    margin-bottom: 2rem;
  }
  @media (min-width: 900px) { .um-stats-grid { grid-template-columns: repeat(4,1fr); } }

  .um-stat-card {
    position: relative; overflow: hidden; text-align: left;
    background: var(--s1); border: 1px solid var(--border);
    border-radius: var(--r-lg); box-shadow: var(--shadow);
    padding: 1.75rem 1.5rem 1.5rem;
    cursor: pointer; font-family: inherit; color: inherit;
    transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), border-color 0.2s, box-shadow 0.2s;
  }
  .um-stat-card:hover {
    transform: translateY(-5px) scale(1.01);
    border-color: var(--sc-border);
    box-shadow: 0 0 0 1px var(--sc-border), var(--shadow-lg), 0 0 60px var(--sc-glow);
  }
  .um-stat-glow {
    position: absolute; inset: 0;
    background: radial-gradient(circle at top right, var(--sc-glow), transparent 60%);
    pointer-events: none;
  }
  .um-stat-icon-wrap {
    width: 50px; height: 50px; border-radius: 14px;
    background: var(--sc-bg); border: 1px solid var(--sc-border);
    display: flex; align-items: center; justify-content: center;
    color: var(--sc-text); margin-bottom: 1.25rem;
  }
  .um-stat-value {
    font-family: 'DM Mono', monospace; font-size: 2.75rem; font-weight: 500;
    letter-spacing: -0.04em; color: var(--text); line-height: 1; margin-bottom: 0.375rem;
  }
  .um-stat-title { font-size: 0.9375rem; font-weight: 700; color: var(--text); margin-bottom: 0.25rem; }
  .um-stat-sub { font-size: 0.75rem; color: var(--muted); }
  .um-stat-arrow {
    position: absolute; bottom: 1.25rem; right: 1.25rem;
    color: var(--sc-text); opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
  }
  .um-stat-card:hover .um-stat-arrow { opacity: 1; transform: translateX(3px); }

  /* ── Form panel ── */
  .um-form-panel {
    background: var(--s1); border: 1px solid var(--border2);
    border-radius: var(--r-lg); box-shadow: var(--shadow-lg);
    padding: 2rem; margin-bottom: 2rem;
    animation: um-slide-in 0.4s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes um-slide-in { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }

  .um-form-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.75rem; gap: 1rem;
  }
  .um-form-header-left { display: flex; align-items: center; gap: 1rem; }
  .um-form-icon {
    width: 52px; height: 52px; border-radius: 16px; flex-shrink: 0;
    background: linear-gradient(135deg, rgba(29,110,255,0.2), rgba(108,63,255,0.2));
    border: 1px solid rgba(29,110,255,0.25);
    display: flex; align-items: center; justify-content: center;
    color: #6AA3FF;
  }
  .um-form-title { font-size: 1.5rem; font-weight: 800; color: var(--text); margin: 0 0 0.3rem; }
  .um-form-sub { font-size: 0.875rem; color: var(--muted); margin: 0; }

  /* ── Progress ── */
  .um-progress-wrap { margin-bottom: 2rem; }
  .um-progress-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
  .um-progress-label { font-size: 0.8125rem; color: var(--muted); font-weight: 600; }
  .um-progress-pct { font-size: 0.8125rem; color: #6AA3FF; font-weight: 700; font-family: 'DM Mono', monospace; }
  .um-progress-track { height: 6px; background: rgba(255,255,255,0.06); border-radius: 6px; overflow: hidden; }
  .um-progress-fill {
    height: 100%; border-radius: 6px;
    background: linear-gradient(90deg, #1D6EFF, #6C3FFF);
    transition: width 0.4s cubic-bezier(.4,0,.2,1);
    box-shadow: 0 0 12px rgba(29,110,255,0.5);
  }

  /* ── Form grid ── */
  .um-form-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; margin-bottom: 2rem; }
  @media (min-width: 768px)  { .um-form-grid { grid-template-columns: repeat(2,1fr); } }
  @media (min-width: 1100px) { .um-form-grid { grid-template-columns: repeat(3,1fr); } }

  .um-form-actions {
    display: flex; flex-wrap: wrap; align-items: center;
    justify-content: space-between; gap: 1rem;
    padding-top: 1.75rem; border-top: 1px solid var(--border);
  }
  .um-form-actions-right { display: flex; gap: 0.75rem; }

  /* ── Input fields ── */
  .um-input-group { display: flex; flex-direction: column; gap: 0.5rem; }
  .um-field-label { font-size: 0.8125rem; font-weight: 600; color: var(--muted); letter-spacing: 0.01em; }

  .um-input-wrap {
    position: relative; display: flex; align-items: center;
    background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
    border-radius: var(--r-sm); transition: border-color 0.18s, box-shadow 0.18s;
  }
  .um-input-wrap:focus-within {
    border-color: rgba(29,110,255,0.55);
    box-shadow: 0 0 0 3px rgba(29,110,255,0.12);
  }
  .um-input-wrap-error {
    border-color: rgba(239,68,68,0.55) !important;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
  }
  .um-input-icon { position: absolute; left: 0.875rem; color: var(--muted); pointer-events: none; flex-shrink: 0; }
  .um-input {
    width: 100%; height: 52px; background: transparent;
    border: none; outline: none; color: var(--text);
    font-size: 0.9375rem; font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 0 2.5rem 0 1rem;
  }
  .um-input::placeholder { color: var(--muted2); }
  .um-input-check { position: absolute; right: 0.875rem; color: var(--emerald); pointer-events: none; }
  .um-input-err-icon { position: absolute; right: 0.875rem; color: var(--red); pointer-events: none; }
  .um-field-error { font-size: 0.75rem; color: #F87171; margin: 0; font-weight: 600; }

  .um-select { appearance: none; cursor: pointer; padding-right: 2.5rem; }
  .um-option { background: #0A1430; }

  /* ── Filter panel ── */
  .um-filter-panel {
    background: var(--s1); border: 1px solid var(--border);
    border-radius: var(--r-lg); box-shadow: var(--shadow);
    padding: 1.75rem; margin-bottom: 2rem;
  }
  .um-filter-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  .um-filter-header-left { display: flex; align-items: center; gap: 0.625rem; }
  .um-filter-icon { color: var(--muted); }
  .um-filter-title { font-size: 1rem; font-weight: 700; color: var(--text); margin: 0; }
  .um-filter-count {
    font-family: 'DM Mono', monospace; font-size: 0.8125rem; font-weight: 500;
    background: rgba(29,110,255,0.12); border: 1px solid rgba(29,110,255,0.22);
    color: #6AA3FF; padding: 0.25rem 0.75rem; border-radius: 100px;
  }

  .um-filter-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; align-items: end; }
  @media (min-width: 900px) { .um-filter-grid { grid-template-columns: 1fr 2fr auto; } }

  .um-field-wrap { display: flex; flex-direction: column; gap: 0.5rem; }
  .um-field-clear { justify-content: flex-end; }

  .um-search-wrap {
    position: relative; background: rgba(255,255,255,0.04);
    border: 1px solid var(--border2); border-radius: var(--r-sm);
    transition: border-color 0.18s;
  }
  .um-search-wrap:focus-within { border-color: rgba(29,110,255,0.5); }
  .um-search-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  .um-input-search { height: 52px; width: 100%; background: transparent; border: none; outline: none; color: var(--text); font-size: 0.9375rem; font-family: inherit; padding: 0 2.5rem 0 2.75rem; }
  .um-input-search::placeholder { color: var(--muted2); }
  .um-search-clear {
    position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--muted);
    display: flex; align-items: center; padding: 4px; border-radius: 4px;
    transition: color 0.15s;
  }
  .um-search-clear:hover { color: var(--text); }

  .um-role-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .um-role-pill {
    height: 36px; padding: 0 0.875rem; border-radius: 100px;
    background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
    color: var(--muted); font-size: 0.8125rem; font-weight: 600;
    cursor: pointer; transition: all 0.15s; font-family: inherit;
  }
  .um-role-pill:hover { background: rgba(255,255,255,0.08); color: var(--text); }
  .um-role-pill-active {
    background: rgba(29,110,255,0.15); border-color: rgba(29,110,255,0.4);
    color: #6AA3FF; box-shadow: 0 0 12px rgba(29,110,255,0.15);
  }
  .um-clear-btn { width: 100%; }

  /* ── Table panel ── */
  .um-table-panel {
    background: var(--s1); border: 1px solid var(--border);
    border-radius: var(--r-lg); box-shadow: var(--shadow);
    overflow: hidden;
  }
  .um-table-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.75rem 2rem; border-bottom: 1px solid var(--border);
    flex-wrap: wrap; gap: 1rem;
  }
  .um-table-title { font-size: 1.375rem; font-weight: 800; color: var(--text); margin: 0 0 0.3rem; }
  .um-table-sub { font-size: 0.875rem; color: var(--muted); margin: 0; }
  .um-table-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.45rem 0.875rem; border-radius: 100px;
    background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.22);
    color: #34D399; font-size: 0.8125rem; font-weight: 700;
  }
  .um-table-body { padding: 1.5rem 2rem 2rem; }

  /* ── Confirm dialog ── */
  .um-dialog-overlay {
    position: fixed; inset: 0; z-index: 60;
    background: rgba(2,5,15,0.82); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  }
  .um-dialog {
    width: 100%; max-width: 440px;
    background: var(--s2); border: 1px solid var(--border2);
    border-radius: var(--r-lg); box-shadow: var(--shadow-lg);
    padding: 2.25rem; text-align: center;
    animation: um-dialog-in 0.3s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes um-dialog-in { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
  .um-dialog-icon-wrap {
    width: 64px; height: 64px; border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.5rem;
  }
  .um-dialog-icon-blue { background: rgba(29,110,255,0.12); border: 1px solid rgba(29,110,255,0.22); color: #6AA3FF; }
  .um-dialog-icon-red  { background: rgba(239,68,68,0.12);  border: 1px solid rgba(239,68,68,0.22);  color: #F87171; }
  .um-dialog-title { font-size: 1.5rem; font-weight: 800; color: var(--text); margin: 0 0 0.75rem; }
  .um-dialog-message { font-size: 0.9375rem; color: var(--muted); line-height: 1.6; margin: 0 0 2rem; }
  .um-dialog-actions { display: flex; justify-content: center; gap: 0.75rem; }

  /* ── Spinner ── */
  .um-spin { animation: um-spinner 0.8s linear infinite; }
  @keyframes um-spinner { to { transform: rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
`;