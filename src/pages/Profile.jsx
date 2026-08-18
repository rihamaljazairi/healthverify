import { useEffect, useMemo, useState } from "react";
import { auth, db, storage } from "../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  BriefcaseMedical,
  Camera,
  Clipboard,
  Edit3,
  Hospital,
  Mail,
  Phone,
  RefreshCcw,
  Save,
  ShieldCheck,
  Stethoscope,
  User,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  FileText,
} from "lucide-react";

import SuccessAlert from "../components/Common/SuccessAlert";
import ErrorAlert from "../components/Common/ErrorAlert";
import VerificationQRCode from "../components/QR/VerificationQRCode";

const DEPARTMENTS = [
  "Emergency Medicine",
  "Internal Medicine",
  "Surgery",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Cardiology",
  "Neurology",
  "Oncology",
  "Pharmacy",
  "Nursing",
];

const cleanValue = (value) => String(value || "").trim();

export default function Profile() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: "",
    specialization: "",
    licenseNumber: "",
    hospitalName: "",
  });

  const [originalFormData, setOriginalFormData] = useState({
    name: "",
    phone: "",
    department: "",
    specialization: "",
    licenseNumber: "",
    hospitalName: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const user = auth.currentUser;

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        setError("Profile not found.");
        return;
      }

      const data = {
        uid: user.uid,
        email: user.email,
        ...snap.data(),
      };

      const loadedForm = {
        name: data.name || "",
        phone: data.phone || "",
        department: data.department || "",
        specialization: data.specialization || "",
        licenseNumber: data.licenseNumber || "",
        hospitalName: data.hospitalName || "",
      };

      setUserData(data);
      setFormData(loadedForm);
      setOriginalFormData(loadedForm);
    } catch (err) {
      console.error(err);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const status = useMemo(() => {
    if (userData?.approved) return "verified";
    if (userData?.rejected) return "rejected";
    return "pending";
  }, [userData]);

  const statusText = {
    verified: "Verified",
    rejected: "Rejected",
    pending: "Pending Review",
  }[status];

  const hasChanges = useMemo(() => {
    const formChanged =
      cleanValue(formData.name) !== cleanValue(originalFormData.name) ||
      cleanValue(formData.phone) !== cleanValue(originalFormData.phone) ||
      cleanValue(formData.department) !== cleanValue(originalFormData.department) ||
      cleanValue(formData.specialization) !==
        cleanValue(originalFormData.specialization) ||
      cleanValue(formData.licenseNumber) !==
        cleanValue(originalFormData.licenseNumber) ||
      cleanValue(formData.hospitalName) !==
        cleanValue(originalFormData.hospitalName);

    return formChanged || Boolean(avatarFile);
  }, [formData, originalFormData, avatarFile]);

  const completion = useMemo(() => {
    const fields = [
      formData.name,
      userData?.email,
      formData.phone,
      formData.hospitalName,
      formData.department,
      formData.specialization,
      formData.licenseNumber,
    ];

    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [formData, userData]);

  // The three verification documents collected at registration. Field
  // names match what AuthService / RegisterScreen write to Firestore
  // (documentURL, licenseDocumentURL, selfieURL), same as DoctorProfile.jsx.
  const documents = useMemo(() => {
    return [
      {
        key: "nationalId",
        label: "National ID",
        icon: <BadgeCheck size={16} />,
        url: userData?.documentURL || "",
      },
      {
        key: "medicalLicense",
        label: "Medical License",
        icon: <BriefcaseMedical size={16} />,
        url: userData?.licenseDocumentURL || "",
      },
      {
        key: "selfie",
        label: "Selfie Verification",
        icon: <Camera size={16} />,
        url: userData?.selfieURL || userData?.imageURL || "",
      },
    ];
  }, [userData]);

  const initials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "HV";

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
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
      setError("Copy failed. Please try again.");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setSuccess("Profile image selected. Click Save Changes to upload.");
  };

  const cancelEdit = () => {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview("");
    setError("");
    setSuccess("");
    setFormData(originalFormData);
  };

  const validateProfile = () => {
    if (!formData.name.trim()) return "Full name is required.";
    if (!formData.phone.trim()) return "Phone number is required.";
    if (!formData.hospitalName.trim()) return "Hospital name is required.";
    if (!formData.department.trim()) return "Department is required.";
    if (!formData.specialization.trim()) return "Specialization is required.";
    if (!formData.licenseNumber.trim()) return "License number is required.";
    return "";
  };

  const saveProfile = async () => {
    try {
      if (!hasChanges) {
        setError("No changes detected. Edit something before saving.");
        return;
      }

      const validationError = validateProfile();

      if (validationError) {
        setError(validationError);
        return;
      }

      setSaving(true);
      setError("");
      setSuccess("");

      const user = auth.currentUser;

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      let imageURL = userData?.imageURL || "";

      if (avatarFile) {
        const storageRef = ref(
          storage,
          `avatars/${user.uid}/${Date.now()}_${avatarFile.name}`
        );

        await uploadBytes(storageRef, avatarFile);
        imageURL = await getDownloadURL(storageRef);
      }

      const updatedProfile = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        specialization: formData.specialization.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        hospitalName: formData.hospitalName.trim(),
        imageURL,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, "users", user.uid), updatedProfile);

      const updatedForm = {
        name: updatedProfile.name,
        phone: updatedProfile.phone,
        department: updatedProfile.department,
        specialization: updatedProfile.specialization,
        licenseNumber: updatedProfile.licenseNumber,
        hospitalName: updatedProfile.hospitalName,
      };

      setUserData((prev) => ({
        ...prev,
        ...updatedProfile,
      }));

      setFormData(updatedForm);
      setOriginalFormData(updatedForm);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview("");
      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setError(
        "Failed to update profile. If you uploaded an image, check Firebase Storage rules."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    await loadProfile();
    setSuccess("Profile refreshed successfully.");
  };

  const handleSecurityCheck = () => {
    setSecurityOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="rounded-3xl bg-[#111c31] border border-white/10 p-10 text-center shadow-2xl">
          <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto space-y-7">
      {success && (
        <SuccessAlert message={success} onClose={() => setSuccess("")} />
      )}

      {error && (
        <ErrorAlert
          message={error}
          onClose={() => setError("")}
          autoClose={false}
        />
      )}

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300 mb-4">
            <User size={16} />
            Healthcare Professional Account
          </div>

          <h1 className="text-4xl font-black text-white mb-2">My Profile</h1>

          <p className="text-slate-400">
            Manage professional details, account security, and public
            verification.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="h-12 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition"
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <button
            onClick={handleRefresh}
            className="h-12 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition"
          >
            <RefreshCcw size={18} />
            Refresh
          </button>

          <button
            onClick={() => (editing ? cancelEdit() : setEditing(true))}
            className={`h-12 px-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition ${
              editing
                ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
            }`}
          >
            {editing ? <X size={18} /> : <Edit3 size={18} />}
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      <section className="rounded-[2rem] bg-[#111c31]/90 border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-8 flex flex-col lg:flex-row gap-8">
          <div className="relative shrink-0">
            <div className="w-36 h-36 rounded-[2rem] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-black border border-white/20 overflow-hidden">
              {avatarPreview || userData?.imageURL || userData?.selfieURL ? (
                <img
                  src={avatarPreview || userData.imageURL || userData.selfieURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials(userData?.name)
              )}
            </div>

            {editing && (
              <label className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center cursor-pointer shadow-xl">
                <Camera size={21} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h2 className="text-3xl font-black text-white">
                {userData?.name || "User"}
              </h2>

              <StatusBadge status={status} label={statusText} />
            </div>

            <p className="text-slate-400 mb-5">
              {userData?.specialization || "Healthcare Professional"} •{" "}
              {userData?.hospitalName || "No hospital assigned"}
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <InfoPill
                icon={<Mail size={15} />}
                text={userData?.email}
                onClick={() => handleCopy(userData?.email, "Email")}
              />

              <InfoPill
                icon={<Phone size={15} />}
                text={formData.phone}
                onClick={() => handleCopy(formData.phone, "Phone number")}
              />

              <InfoPill
                icon={<Stethoscope size={15} />}
                text={userData?.role || "User"}
              />

              <InfoPill
                icon={<BadgeCheck size={15} />}
                text={formData.licenseNumber}
                onClick={() =>
                  handleCopy(formData.licenseNumber, "License number")
                }
              />
            </div>

            <div className="max-w-xl">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-400">
                  Profile Completion
                </span>

                <span className="text-sm font-bold text-blue-300">
                  {completion}%
                </span>
              </div>

              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Verification" value={statusText} color={status} />

        <StatCard
          title="Department"
          value={formData.department || "Not Provided"}
          color="blue"
        />

        <StatCard
          title="Role"
          value={userData?.role || "User"}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">
        <div className="xl:col-span-8 space-y-7">
          <CleanCard
            title="Basic Information"
            subtitle="Your account identity and contact information."
            icon={<User />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Full Name"
                value={formData.name}
                editing={editing}
                onChange={(v) => handleChange("name", v)}
              />

              <ReadOnly
                label="Email Address"
                value={userData?.email || "—"}
                buttonText="Copy"
                onButtonClick={() => handleCopy(userData?.email, "Email")}
              />

              <Field
                label="Phone Number"
                value={formData.phone}
                editing={editing}
                onChange={(v) => handleChange("phone", v)}
              />

              <ReadOnly label="Role" value={userData?.role || "User"} />
            </div>
          </CleanCard>

          <CleanCard
            title="Professional Details"
            subtitle="Healthcare workplace, license, and specialization."
            icon={<BriefcaseMedical />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Hospital Name"
                value={formData.hospitalName}
                editing={editing}
                onChange={(v) => handleChange("hospitalName", v)}
              />

              <Field
                label="Specialization"
                value={formData.specialization}
                editing={editing}
                onChange={(v) => handleChange("specialization", v)}
              />

              <Field
                label="License Number"
                value={formData.licenseNumber}
                editing={editing}
                onChange={(v) => handleChange("licenseNumber", v)}
              />

              <DepartmentField
                value={formData.department}
                editing={editing}
                onChange={(v) => handleChange("department", v)}
              />
            </div>
          </CleanCard>

          <CleanCard
            title="Verification Documents"
            subtitle="Submitted during registration for admin review. Contact an administrator to update a document."
            icon={<FileText />}
          >
            <div className="space-y-3">
              {documents.map((document) => (
                <DocumentRow
                  key={document.key}
                  icon={document.icon}
                  label={document.label}
                  url={document.url}
                />
              ))}
            </div>
          </CleanCard>

          <CleanCard
            title="Account Security"
            subtitle="Authentication and access-control details."
            icon={<ShieldCheck />}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SecurityBox
                title="Firebase Auth"
                value="Enabled"
                onClick={handleSecurityCheck}
              />

              <SecurityBox
                title="Role Access"
                value={userData?.role || "User"}
                onClick={handleSecurityCheck}
              />

              <SecurityBox
                title="Status"
                value={statusText}
                onClick={handleSecurityCheck}
              />
            </div>
          </CleanCard>
        </div>

        <aside className="xl:col-span-4 space-y-7">
          <CleanCard
            title="Verification Timeline"
            subtitle="Your account review progress."
            icon={<ShieldCheck />}
          >
            <div className="space-y-5">
              <TimelineItem active title="Account Created" />
              <TimelineItem active title="Profile Submitted" />

              <TimelineItem
                active={status === "verified"}
                loading={status === "pending"}
                danger={status === "rejected"}
                title={
                  status === "verified"
                    ? "Admin Approved"
                    : status === "rejected"
                    ? "Application Rejected"
                    : "Waiting for Admin Review"
                }
              />
            </div>
          </CleanCard>

          {userData?.approved && (
            <CleanCard
              title="Verification QR"
              subtitle="Public QR verification for approved users."
              icon={<BadgeCheck />}
            >
              <button
                onClick={() => setShowQR((prev) => !prev)}
                className="mb-5 w-full h-11 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition"
              >
                {showQR ? <EyeOff size={18} /> : <Eye size={18} />}
                {showQR ? "Hide QR Code" : "Show QR Code"}
              </button>

              {showQR && (
                <VerificationQRCode uid={userData.uid} name={userData.name} />
              )}
            </CleanCard>
          )}
        </aside>
      </div>

      {editing && (
        <div className="sticky bottom-6 z-30 rounded-3xl bg-[#111c31]/95 border border-white/10 shadow-2xl p-5 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center">
            <p
              className={`text-sm font-bold ${
                hasChanges ? "text-emerald-300" : "text-slate-500"
              }`}
            >
              {hasChanges
                ? "Unsaved changes detected."
                : "No changes yet. Edit a field or change your image to save."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={cancelEdit}
              className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <X size={18} />
              Cancel
            </button>

            <button
              onClick={saveProfile}
              disabled={saving || !hasChanges}
              className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
      )}

      {securityOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-[#111c31] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <KeyRound className="text-blue-400" />
                Security Details
              </h2>

              <button
                onClick={() => setSecurityOpen(false)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <SecurityDetail label="Firebase Auth" value="Enabled" />
              <SecurityDetail label="Email" value={userData?.email || "—"} />
              <SecurityDetail label="Role" value={userData?.role || "User"} />
              <SecurityDetail label="Verification Status" value={statusText} />
              <SecurityDetail
                label="User ID"
                value={userData?.uid || "Unavailable"}
              />

              <button
                onClick={() => {
                  handleCopy(userData?.uid, "User ID");
                  setSecurityOpen(false);
                }}
                className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition"
              >
                Copy User ID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CleanCard({ title, subtitle, icon, children }) {
  return (
    <section className="rounded-[2rem] bg-[#111c31]/90 border border-white/10 shadow-2xl p-7">
      <div className="flex items-start gap-4 mb-7">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
          {icon}
        </div>

        <div>
          <h3 className="text-xl font-black text-white">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({ label, value, editing, onChange }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>

      {editing ? (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="w-full h-12 rounded-2xl bg-[#0b1425] border border-white/10 px-4 text-white outline-none focus:border-blue-500/50"
        />
      ) : (
        <div className="min-h-12 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white font-semibold">
          {value || "Not Provided"}
        </div>
      )}
    </div>
  );
}

function ReadOnly({ label, value, buttonText, onButtonClick }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>

      <div className="min-h-12 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white font-semibold flex items-center justify-between gap-3">
        <span className="truncate">{value}</span>

        {buttonText && (
          <button
            onClick={onButtonClick}
            className="text-xs rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-1 hover:bg-blue-500/20 transition flex items-center gap-1"
          >
            <Clipboard size={13} />
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}

function DepartmentField({ value, editing, onChange }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">Department</label>

      {editing ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 rounded-2xl bg-[#0b1425] border border-white/10 px-4 text-white outline-none focus:border-blue-500/50"
        >
          <option value="">Select Department</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept} className="bg-[#0b1425]">
              {dept}
            </option>
          ))}
        </select>
      ) : (
        <div className="min-h-12 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white font-semibold">
          {value || "Not Provided"}
        </div>
      )}
    </div>
  );
}

// Read-only row for the Verification Documents card. Opens the document in
// a new tab when present; shows a "Missing" pill when it hasn't been
// uploaded (or hasn't synced from local storage to the cloud yet).
function DocumentRow({ icon, label, url }) {
  return (
    <a
      href={url || undefined}
      target={url ? "_blank" : undefined}
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!url) e.preventDefault();
      }}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
        url
          ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
          : "border-dashed border-white/10 bg-white/[0.02] cursor-not-allowed"
      }`}
    >
      <span className="flex items-center gap-3 text-sm font-semibold text-white">
        <span
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            url ? "bg-blue-500/10 text-blue-400" : "bg-white/5 text-slate-500"
          }`}
        >
          {icon}
        </span>
        {label}
      </span>

      <span
        className={`text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap ${
          url
            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
            : "bg-amber-500/10 text-amber-300 border-amber-500/20"
        }`}
      >
        {url ? "Uploaded" : "Missing"}
      </span>
    </a>
  );
}

function StatusBadge({ status, label }) {
  const styles = {
    verified: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-300 border-red-500/20",
    pending: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-black ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function InfoPill({ icon, text, onClick }) {
  if (!text) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.08] transition"
    >
      {icon}
      {text}
    </button>
  );
}

function StatCard({ title, value, color }) {
  const styles = {
    verified: "from-emerald-500/20 to-emerald-500/5 text-emerald-300",
    rejected: "from-red-500/20 to-red-500/5 text-red-300",
    pending: "from-yellow-500/20 to-yellow-500/5 text-yellow-300",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-300",
    purple: "from-purple-500/20 to-purple-500/5 text-purple-300",
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#111c31] border border-white/10 p-6 shadow-xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${styles[color]}`} />

      <div className="relative z-10">
        <p className="text-sm text-slate-400 mb-2">{title}</p>
        <h3 className={`text-2xl font-black ${styles[color]}`}>{value}</h3>
      </div>
    </div>
  );
}

function SecurityBox({ title, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:bg-white/[0.08] transition"
    >
      <p className="text-sm text-slate-500 mb-2">{title}</p>
      <p className="font-black text-white">{value}</p>
    </button>
  );
}

function SecurityDetail({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
      <p className="text-xs text-slate-500 font-bold uppercase mb-2">
        {label}
      </p>

      <p className="text-white font-semibold break-all">{value}</p>
    </div>
  );
}

function TimelineItem({ title, active, loading, danger }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-5 h-5 rounded-full border-2 ${
          active
            ? "bg-emerald-500 border-emerald-400"
            : danger
            ? "bg-red-500 border-red-400"
            : loading
            ? "bg-yellow-500 border-yellow-400 animate-pulse"
            : "bg-white/5 border-white/10"
        }`}
      />

      <p
        className={`font-semibold ${
          active || loading || danger ? "text-white" : "text-slate-500"
        }`}
      >
        {title}
      </p>
    </div>
  );
}