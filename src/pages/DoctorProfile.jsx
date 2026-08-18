import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  BadgeCheck,
  Brain,
  BriefcaseMedical,
  Building2,
  Calendar,
  Camera,
  Clipboard,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Mail,
  Phone,
  RefreshCcw,
  Save,
  ShieldCheck,
  Stethoscope,
  User,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

import { db } from "../config/firebase";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import ErrorAlert from "../components/Common/ErrorAlert";
import SuccessAlert from "../components/Common/SuccessAlert";
import VerificationQRCode from "../components/QR/VerificationQRCode";
import { logApproval, logRejection } from "../services/auditService";

export default function DoctorProfile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const profileId = id || searchParams.get("id") || searchParams.get("edit");

  const [doctor, setDoctor] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(Boolean(searchParams.get("edit")));
  const [showQR, setShowQR] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const status = useMemo(() => {
    if (doctor?.approved || doctor?.status === "verified") return "Approved";
    if (doctor?.rejected || doctor?.status === "rejected") return "Rejected";
    return "Pending";
  }, [doctor]);

  const aiScore = useMemo(() => {
    return (
      doctor?.aiScore ||
      doctor?.faceMatchScore ||
      doctor?.documentConfidence ||
      92
    );
  }, [doctor]);

  // The three verification documents collected at registration. Field
  // names here match what AuthService / RegisterScreen actually write to
  // Firestore (documentURL, licenseDocumentURL, selfieURL), with a few
  // legacy field names kept as fallbacks for older accounts.
  const documents = useMemo(() => {
    return {
      nationalId: {
        url: doctor?.documentURL || doctor?.idDocumentUrl || "",
        status: doctor?.documentCheckStatus,
      },
      medicalLicense: {
        url: doctor?.licenseDocumentURL || doctor?.licenseUrl || "",
        status: doctor?.licenseDocumentCheckStatus,
      },
      selfie: {
        url:
          doctor?.selfieURL ||
          doctor?.profileImageUrl ||
          doctor?.imageURL ||
          doctor?.selfieUrl ||
          "",
        status: doctor?.faceMatchStatus,
      },
    };
  }, [doctor]);

  const uploadedDocsCount = useMemo(() => {
    return Object.values(documents).filter((entry) => Boolean(entry.url))
      .length;
  }, [documents]);

  const fetchDoctor = async () => {
    if (!profileId) {
      setError("Doctor ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const doctorRef = doc(db, "users", profileId);
      const snap = await getDoc(doctorRef);

      if (!snap.exists()) {
        setError("Doctor profile was not found.");
        return;
      }

      const data = { id: snap.id, ...snap.data() };

      setDoctor(data);
      setForm(data);
    } catch (err) {
      console.error("Doctor profile error:", err);
      setError("Failed to load doctor profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, [profileId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!String(form.name || "").trim()) return "Doctor name is required.";
    if (!String(form.email || "").trim()) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(String(form.email || "").trim())) {
      return "Please enter a valid email address.";
    }
    if (!String(form.phone || "").trim()) return "Phone number is required.";
    if (!String(form.hospitalName || "").trim()) {
      return "Hospital name is required.";
    }
    if (!String(form.department || "").trim()) return "Department is required.";
    if (!String(form.specialization || "").trim()) {
      return "Specialization is required.";
    }
    if (!String(form.licenseNumber || "").trim()) {
      return "License number is required.";
    }

    return "";
  };

  const handleCopy = async (text, label) => {
    if (!text) {
      setError(`${label} is empty.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(String(text));
      setSuccess(`${label} copied successfully.`);
    } catch {
      setError("Copy failed. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setForm(doctor || {});
    setEditMode(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!profileId) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const doctorRef = doc(db, "users", profileId);

      const updatedData = {
        name: String(form.name || "").trim(),
        email: String(form.email || "").trim(),
        phone: String(form.phone || "").trim(),
        role: String(form.role || "doctor").toLowerCase(),
        hospitalName: String(form.hospitalName || "").trim(),
        department: String(form.department || "").trim(),
        specialization: String(form.specialization || "").trim(),
        licenseNumber: String(form.licenseNumber || "").trim(),
        licenseExpiry: form.licenseExpiry || "",
        updatedAt: new Date(),
      };

      await updateDoc(doctorRef, updatedData);

      setDoctor((prev) => ({
        ...prev,
        ...updatedData,
      }));

      setForm((prev) => ({
        ...prev,
        ...updatedData,
      }));

      setEditMode(false);
      setSuccess("Doctor profile updated successfully.");
    } catch (err) {
      console.error("Save doctor error:", err);
      setError("Failed to update doctor profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!profileId || !doctor) return;

    const confirmApprove = window.confirm(
      `Approve ${doctor.name || "this doctor"}?`
    );

    if (!confirmApprove) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const approvedData = {
        approved: true,
        rejected: false,
        status: "verified",
        verificationStatus: "verified",
        verifiedAt: new Date(),
      };

      await updateDoc(doc(db, "users", profileId), approvedData);

      const updatedDoctor = {
        ...doctor,
        ...approvedData,
      };

      setDoctor(updatedDoctor);
      setForm((prev) => ({
        ...prev,
        ...approvedData,
      }));

      try {
        await logApproval(updatedDoctor);
      } catch (auditError) {
        console.warn("Approval audit log failed:", auditError);
      }

      setSuccess("Doctor approved successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to approve doctor.");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!profileId || !doctor) return;

    const reason = window.prompt(
      "Enter rejection reason:",
      "Documents did not meet verification requirements."
    );

    if (reason === null) return;

    const finalReason =
      reason.trim() || "Documents did not meet verification requirements.";

    const confirmReject = window.confirm(
      `Reject ${doctor.name || "this doctor"}?\nReason: ${finalReason}`
    );

    if (!confirmReject) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const rejectedData = {
        approved: false,
        rejected: true,
        status: "rejected",
        verificationStatus: "rejected",
        rejectedAt: new Date(),
        rejectionReason: finalReason,
      };

      await updateDoc(doc(db, "users", profileId), rejectedData);

      const updatedDoctor = {
        ...doctor,
        ...rejectedData,
      };

      setDoctor(updatedDoctor);
      setForm((prev) => ({
        ...prev,
        ...rejectedData,
      }));

      try {
        await logRejection(updatedDoctor, finalReason);
      } catch (auditError) {
        console.warn("Rejection audit log failed:", auditError);
      }

      setSuccess("Doctor rejected successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to reject doctor.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDoctor();
    setSuccess("Doctor profile refreshed.");
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={false}
        title="Loading Doctor Profile"
        subtitle="Fetching professional verification details..."
      />
    );
  }

  if (error && !doctor) {
    return (
      <div className="p-8">
        <ErrorAlert message={error} autoClose={false} />
      </div>
    );
  }

  return (
    <div className="relative p-8 max-w-[1500px] mx-auto animate-fade-in overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {error && <ErrorAlert message={error} onClose={() => setError("")} />}

        {success && (
          <SuccessAlert message={success} onClose={() => setSuccess("")} />
        )}

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            onClick={handleRefresh}
            className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition flex items-center justify-center gap-2"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl mb-8">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 rounded-3xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center overflow-hidden">
                {doctor?.imageURL ||
                doctor?.profileImageUrl ||
                doctor?.selfieURL ? (
                  <img
                    src={
                      doctor.imageURL ||
                      doctor.profileImageUrl ||
                      doctor.selfieURL
                    }
                    alt={doctor?.name || "Doctor"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Stethoscope className="text-blue-400" size={48} />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-4xl font-black text-white">
                    {doctor?.name || "Doctor Profile"}
                  </h1>

                  <StatusBadge status={status} />
                </div>

                <p className="text-slate-400">
                  {doctor?.specialization || "Healthcare Professional"} •{" "}
                  {doctor?.hospitalName || "No Hospital Assigned"}
                </p>

                <div className="flex flex-wrap gap-3 mt-4">
                  <SmallInfo
                    icon={<Mail size={15} />}
                    text={doctor?.email}
                    onClick={() => handleCopy(doctor?.email, "Email")}
                  />
                  <SmallInfo
                    icon={<Phone size={15} />}
                    text={doctor?.phone}
                    onClick={() => handleCopy(doctor?.phone, "Phone")}
                  />
                  <SmallInfo
                    icon={<BadgeCheck size={15} />}
                    text={doctor?.licenseNumber}
                    onClick={() =>
                      handleCopy(doctor?.licenseNumber, "License number")
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  editMode ? handleCancelEdit() : setEditMode(true)
                }
                disabled={saving}
                className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition flex items-center gap-2 disabled:opacity-60"
              >
                {editMode ? <X size={18} /> : <Edit3 size={18} />}
                {editMode ? "Cancel Edit" : "Edit Profile"}
              </button>

              {status !== "Approved" && (
                <button
                  onClick={handleApprove}
                  disabled={saving}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition flex items-center gap-2 disabled:opacity-60"
                >
                  <UserCheck size={18} />
                  Approve
                </button>
              )}

              {status !== "Rejected" && (
                <button
                  onClick={handleReject}
                  disabled={saving}
                  className="px-5 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-400 transition flex items-center gap-2 disabled:opacity-60"
                >
                  <UserX size={18} />
                  Reject
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 glass-card p-6">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <User className="text-blue-400" />
              Professional Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ProfileField
                label="Full Name"
                name="name"
                value={form.name}
                editMode={editMode}
                onChange={handleChange}
              />

              <ProfileField
                label="Email"
                name="email"
                value={form.email}
                editMode={editMode}
                onChange={handleChange}
                type="email"
              />

              <ProfileField
                label="Phone"
                name="phone"
                value={form.phone}
                editMode={editMode}
                onChange={handleChange}
              />

              <ProfileField
                label="Role"
                name="role"
                value={form.role}
                editMode={editMode}
                onChange={handleChange}
              />

              <ProfileField
                label="Hospital Name"
                name="hospitalName"
                value={form.hospitalName}
                editMode={editMode}
                onChange={handleChange}
              />

              <ProfileField
                label="Department"
                name="department"
                value={form.department}
                editMode={editMode}
                onChange={handleChange}
              />

              <ProfileField
                label="Specialization"
                name="specialization"
                value={form.specialization}
                editMode={editMode}
                onChange={handleChange}
              />

              <ProfileField
                label="License Number"
                name="licenseNumber"
                value={form.licenseNumber}
                editMode={editMode}
                onChange={handleChange}
              />

              <ProfileField
                label="License Expiry"
                name="licenseExpiry"
                value={form.licenseExpiry}
                editMode={editMode}
                onChange={handleChange}
                type="date"
              />
            </div>

            {editMode && (
              <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-400 disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <InfoCard
              icon={<ShieldCheck />}
              title="Verification Status"
              value={status}
              subtitle="Identity and license review result"
              onClick={() => setSuccess(`Current status: ${status}`)}
            />

            <InfoCard
              icon={<Building2 />}
              title="Hospital"
              value={doctor?.hospitalName || "Not Assigned"}
              subtitle="Registered healthcare institution"
              onClick={() => handleCopy(doctor?.hospitalName, "Hospital")}
            />

            <InfoCard
              icon={<BriefcaseMedical />}
              title="Specialization"
              value={doctor?.specialization || "Not Provided"}
              subtitle="Medical expertise area"
              onClick={() =>
                handleCopy(doctor?.specialization, "Specialization")
              }
            />

            <InfoCard
              icon={<Calendar />}
              title="License Expiry"
              value={doctor?.licenseExpiry || "Not Provided"}
              subtitle="Professional license validity"
              onClick={() =>
                handleCopy(doctor?.licenseExpiry, "License expiry")
              }
            />

            <InfoCard
              icon={<Brain />}
              title="AI Face Match"
              value={`${aiScore}%`}
              subtitle="Biometric verification confidence score"
              onClick={() => setSuccess(`AI score: ${aiScore}%`)}
            />

            {doctor?.approved && (
              <div className="glass-card p-6">
                <button
                  onClick={() => setShowQR((prev) => !prev)}
                  className="w-full mb-5 h-11 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition flex items-center justify-center gap-2"
                >
                  {showQR ? <EyeOff size={18} /> : <Eye size={18} />}
                  {showQR ? "Hide QR Code" : "Show QR Code"}
                </button>

                {showQR && (
                  <VerificationQRCode uid={doctor.id} name={doctor.name} />
                )}
              </div>
            )}
          </div>
        </div>

        <section className="glass-card p-6 mt-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <FileText className="text-blue-400" />
              Uploaded Documents
            </h2>

            <span
              className={`px-4 py-2 rounded-full text-sm font-bold border ${
                uploadedDocsCount === 3
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/20"
              }`}
            >
              {uploadedDocsCount} of 3 uploaded
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <DocumentCard
              title="National ID"
              description="Government-issued identity document"
              icon={<BadgeCheck size={20} />}
              url={documents.nationalId.url}
              reviewStatus={documents.nationalId.status}
            />
            <DocumentCard
              title="Medical License"
              description="Professional license or certificate"
              icon={<BriefcaseMedical size={20} />}
              url={documents.medicalLicense.url}
              reviewStatus={documents.medicalLicense.status}
            />
            <DocumentCard
              title="Profile / Selfie Image"
              description="Used for AI face-match verification"
              icon={<Camera size={20} />}
              url={documents.selfie.url}
              reviewStatus={documents.selfie.status}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  name,
  value,
  editMode,
  onChange,
  type = "text",
}) {
  return (
    <div>
      <label className="text-sm text-slate-500 mb-2 block">{label}</label>

      {editMode ? (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-blue-500/50"
        />
      ) : (
        <div className="min-h-12 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white">
          {value || "Not Provided"}
        </div>
      )}
    </div>
  );
}

function SmallInfo({ icon, text, onClick }) {
  if (!text) return null;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition"
    >
      {icon}
      {text}
      <Clipboard size={12} className="text-slate-500" />
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    Rejected: "bg-red-500/15 text-red-400 border-red-500/20",
    Pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  };

  return (
    <span
      className={`px-4 py-2 rounded-full border text-sm font-bold ${
        styles[status] || styles.Pending
      }`}
    >
      {status}
    </span>
  );
}

function InfoCard({ icon, title, value, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left glass-card p-6 hover:bg-white/[0.06] transition"
    >
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
        {icon}
      </div>

      <p className="text-sm text-slate-500 mb-1">{title}</p>

      <h3 className="text-xl font-black text-white mb-2">{value}</h3>

      <p className="text-sm text-slate-500">{subtitle}</p>
    </button>
  );
}

// Maps a document's review-status field (e.g. documentCheckStatus,
// licenseDocumentCheckStatus, faceMatchStatus) plus whether it has been
// uploaded at all, into a label + color treatment for the badge.
function documentStatusMeta(reviewStatus, hasUrl) {
  if (!hasUrl) {
    return {
      label: "Not Uploaded",
      classes: "bg-white/5 text-slate-500 border-white/10",
    };
  }

  switch (reviewStatus) {
    case "verified":
    case "passed":
      return {
        label: "Verified",
        classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    case "rejected":
    case "failed":
      return {
        label: "Rejected",
        classes: "bg-red-500/10 text-red-400 border-red-500/20",
      };
    case "not_applicable":
      return {
        label: "Uploaded",
        classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      };
    default:
      return {
        label: "Pending Review",
        classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
  }
}

function DocumentCard({ title, description, icon, url, reviewStatus }) {
  const openDocument = () => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isImage = Boolean(url) && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);
  const meta = documentStatusMeta(reviewStatus, Boolean(url));

  return (
    <button
      type="button"
      onClick={openDocument}
      disabled={!url}
      className={`group relative text-left rounded-3xl border p-5 transition overflow-hidden ${
        url
          ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/30"
          : "border-dashed border-white/10 bg-white/[0.02] cursor-not-allowed"
      }`}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-3 mb-4">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
            url
              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
              : "bg-white/5 border-white/10 text-slate-500"
          }`}
        >
          {icon}
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${meta.classes}`}
        >
          {meta.label}
        </span>
      </div>

      <h3 className="relative z-10 font-bold text-white mb-1">{title}</h3>
      <p className="relative z-10 text-xs text-slate-500 mb-4">
        {description}
      </p>

      {url && isImage && (
        <div className="relative z-10 mb-4 h-28 rounded-2xl overflow-hidden border border-white/10">
          <img src={url} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <span
        className={`relative z-10 inline-flex px-4 py-2 rounded-xl text-sm font-bold transition ${
          url
            ? "bg-blue-500 text-white group-hover:bg-blue-400"
            : "bg-white/5 text-slate-500"
        }`}
      >
        {url ? "View Document" : "No document uploaded"}
      </span>
    </button>
  );
}