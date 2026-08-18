import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  Eye,
  Trash2,
  Edit,
  ShieldCheck,
  Clock3,
  XCircle,
  Brain,
  UserCheck,
  UserX,
  X,
  Save,
  AlertTriangle,
  Mail,
  Hospital,
  Phone,
  BadgeCheck,
  FileText,
  Clipboard,
  CheckCircle2,
  AlertCircle,
  Activity,
  ShieldAlert,
} from "lucide-react";

import { db } from "../../config/firebase";

import SuccessAlert from "../Common/SuccessAlert";
import ErrorAlert from "../Common/ErrorAlert";

import {
  logApproval,
  logRejection,
  createAuditLog,
} from "../../services/auditService";

export default function UserTable({ search = "", role = "All Roles" }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [processingId, setProcessingId] = useState("");

  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error("User listener error:", error);
        setLoading(false);
        setError("Failed to load users.");
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const searchValue = search.toLowerCase().trim();
      const roleValue = role.toLowerCase();

      const name = String(u?.name || "").toLowerCase();
      const email = String(u?.email || "").toLowerCase();
      const userRole = String(u?.role || "").toLowerCase();
      const hospital = String(u?.hospitalName || "").toLowerCase();
      const license = String(u?.licenseNumber || "").toLowerCase();
      const status = String(u?.status || "").toLowerCase();
      const risk = String(u?.riskLevel || "").toLowerCase();
      const recommendation = String(u?.verificationRecommendation || "").toLowerCase();

      const matchSearch =
        !searchValue ||
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        userRole.includes(searchValue) ||
        hospital.includes(searchValue) ||
        license.includes(searchValue) ||
        status.includes(searchValue) ||
        risk.includes(searchValue) ||
        recommendation.includes(searchValue);

      const matchRole =
        roleValue === "all roles" || userRole === roleValue;

      return matchSearch && matchRole;
    });
  }, [users, search, role]);

  const openEdit = (user) => {
    setEditUser(user);

    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "doctor",
      phone: user.phone || "",
      hospitalName: user.hospitalName || "",
      department: user.department || "",
      specialization: user.specialization || "",
      licenseNumber: user.licenseNumber || "",
      status: user.status || "pending",
    });
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCopy = async (text, label = "Value") => {
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

  const handleSaveEdit = async () => {
    if (!editUser?.id) return;

    try {
      setProcessingId(editUser.id);

      await updateDoc(doc(db, "users", editUser.id), {
        ...editForm,
        role: String(editForm.role || "").toLowerCase(),
        updatedAt: serverTimestamp(),
      });

      await safeCreateAuditLog({
        type: "activity",
        action: "Updated user account",
        targetId: editUser.id,
        targetName: editForm.name,
        targetEmail: editForm.email,
        details: "User information was updated from Users Management.",
      });

      setSuccess("User updated successfully.");
      setEditUser(null);
      setEditForm({});
    } catch (error) {
      console.error("Edit error:", error);
      setError("Failed to update user.");
    } finally {
      setProcessingId("");
    }
  };

  const handleDelete = async () => {
    if (!deleteUser?.id) return;

    try {
      setProcessingId(deleteUser.id);

      await deleteDoc(doc(db, "users", deleteUser.id));

      await safeCreateAuditLog({
        type: "danger",
        action: "Deleted user account",
        targetId: deleteUser.id,
        targetName: deleteUser.name,
        targetEmail: deleteUser.email,
        details: `${deleteUser.role || "user"} account was deleted.`,
      });

      setSuccess("User deleted successfully.");
      setDeleteUser(null);
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete user.");
    } finally {
      setProcessingId("");
    }
  };

  const handleApprove = async (user) => {
    const recommendation = getVerificationRecommendation(user);

    const confirmMessage =
      recommendation.decision === "reject"
        ? `${user.name || "This user"} is marked as HIGH RISK.\n\nReason:\n${recommendation.reasons.join("\n")}\n\nAre you sure you still want to approve?`
        : recommendation.decision === "review"
        ? `${user.name || "This user"} needs manual review.\n\nReason:\n${recommendation.reasons.join("\n")}\n\nApprove after admin review?`
        : `Approve ${user.name || "this user"} as verified healthcare staff?`;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    const adminNotes =
      window.prompt(
        "Admin approval notes:",
        recommendation.decision === "approve"
          ? "AI score, face match, document confidence, and profile information meet verification requirements."
          : "Approved after manual admin review."
      ) || "";

    try {
      setProcessingId(user.id);

      await updateDoc(doc(db, "users", user.id), {
        approved: true,
        rejected: false,
        status: "verified",
        verificationStatus: "verified",
        riskLevel: recommendation.riskLevel,
        verificationRecommendation: recommendation.label,
        adminNotes,
        rejectionReason: "",
        reviewedAt: serverTimestamp(),
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        await logApproval({ ...user, adminNotes });
      } catch (auditError) {
        console.warn("Approval audit log failed:", auditError);
      }

      await safeCreateAuditLog({
        type: "approval",
        action: "Approved healthcare staff",
        targetId: user.id,
        targetName: user.name,
        targetEmail: user.email,
        details: `Admin approved user. Recommendation: ${recommendation.label}. AI Score: ${getAIScore(user)}%.`,
      });

      setViewUser(null);
      setSuccess(`${user.name || "User"} approved successfully.`);
    } catch (error) {
      console.error(error);
      setError("Failed to approve user.");
    } finally {
      setProcessingId("");
    }
  };

  const handleReject = async (user) => {
    const recommendation = getVerificationRecommendation(user);

    const reason = window.prompt(
      "Enter rejection reason:",
      recommendation.reasons.length
        ? recommendation.reasons.join(" ")
        : "Documents did not meet verification requirements."
    );

    if (reason === null) return;

    const finalReason =
      reason.trim() || "Documents did not meet verification requirements.";

    const adminNotes =
      window.prompt(
        "Admin notes:",
        `Rejected after verification review. Recommendation: ${recommendation.label}.`
      ) || "";

    const confirmed = window.confirm(
      `Reject ${user.name || "this user"}?\n\nReason:\n${finalReason}`
    );

    if (!confirmed) return;

    try {
      setProcessingId(user.id);

      await updateDoc(doc(db, "users", user.id), {
        approved: false,
        rejected: true,
        status: "rejected",
        verificationStatus: "rejected",
        riskLevel: recommendation.riskLevel,
        verificationRecommendation: recommendation.label,
        rejectionReason: finalReason,
        adminNotes,
        reviewedAt: serverTimestamp(),
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        await logRejection(user, finalReason);
      } catch (auditError) {
        console.warn("Rejection audit log failed:", auditError);
      }

      await safeCreateAuditLog({
        type: "rejection",
        action: "Rejected healthcare staff",
        targetId: user.id,
        targetName: user.name,
        targetEmail: user.email,
        details: finalReason,
      });

      setViewUser(null);
      setSuccess(`${user.name || "User"} rejected.`);
    } catch (error) {
      console.error(error);
      setError("Failed to reject user.");
    } finally {
      setProcessingId("");
    }
  };

  const getStatus = (user) => {
    if (user.approved || user.status === "verified" || user.status === "approved") {
      return {
        label: "Approved",
        icon: ShieldCheck,
        className:
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
      };
    }

    if (user.rejected || user.status === "rejected") {
      return {
        label: "Rejected",
        icon: XCircle,
        className: "bg-red-500/15 text-red-400 border border-red-500/20",
      };
    }

    return {
      label: "Pending",
      icon: Clock3,
      className:
        "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    };
  };

  const getAIScore = (user) => {
    return Number(user.aiScore || user.faceMatchScore || user.documentConfidence || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-14 h-14 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <h3 className="text-xl font-bold text-white mb-2">No Users Found</h3>

        <p className="text-slate-500">
          No matching healthcare staff found.
        </p>
      </div>
    );
  }

  return (
    <>
      {success && (
        <div className="mb-6">
          <SuccessAlert message={success} onClose={() => setSuccess("")} />
        </div>
      )}

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} onClose={() => setError("")} />
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl">
        <div
          className="professional-table overflow-auto"
          style={{
            maxHeight: "calc(100vh - 280px)",
          }}
        >
          <table className="w-full min-w-[1180px]">
            <thead
              className="bg-slate-950 border-b border-white/10 sticky top-0 z-30"
              style={{
                backdropFilter: "blur(20px)",
              }}
            >
              <tr>
                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                  User
                </th>

                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                  Role
                </th>

                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                  AI Score
                </th>

                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recommendation
                </th>

                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                  Status
                </th>

                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                  Hospital
                </th>

                <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-wider text-slate-400 sticky right-0 bg-slate-950 z-40">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => {
                const status = getStatus(user);
                const StatusIcon = status.icon;
                const aiScore = getAIScore(user);
                const recommendation = getVerificationRecommendation(user);

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-300 font-bold overflow-hidden">
                          {user.imageURL || user.selfieURL ? (
                            <img
                              src={user.imageURL || user.selfieURL}
                              alt={user.name || "User"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            String(user.name || "U").charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-white">
                            {user.name || "Unknown User"}
                          </h4>

                          <p className="text-sm text-slate-500">
                            {user.email || "No Email"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 text-xs font-semibold capitalize">
                        {user.role || "user"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className={getScoreClass(aiScore)}>
                        <Brain size={14} />
                        {aiScore}%
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <RecommendationBadge recommendation={recommendation} />
                    </td>

                    <td className="px-6 py-5">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}
                      >
                        <StatusIcon size={14} />
                        {status.label}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-slate-400">
                      {user.hospitalName || "Not Assigned"}
                    </td>

                    <td className="px-6 py-5 sticky right-0 bg-slate-900/95 backdrop-blur-xl z-20">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {!user.approved && !user.rejected && (
                          <>
                            <button
                              disabled={processingId === user.id}
                              onClick={() => handleApprove(user)}
                              title="Approve user"
                              className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition flex items-center justify-center disabled:opacity-50"
                            >
                              <UserCheck size={18} />
                            </button>

                            <button
                              disabled={processingId === user.id}
                              onClick={() => handleReject(user)}
                              title="Reject user"
                              className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition flex items-center justify-center disabled:opacity-50"
                            >
                              <UserX size={18} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setViewUser(user)}
                          title="View user"
                          className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition flex items-center justify-center"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => openEdit(user)}
                          title="Edit user"
                          className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition flex items-center justify-center"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          disabled={processingId === user.id}
                          onClick={() => setDeleteUser(user)}
                          title="Delete user"
                          className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition flex items-center justify-center disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {viewUser && (
        <Modal title="User Details" onClose={() => setViewUser(null)}>
          <UserDetails
            user={viewUser}
            status={getStatus(viewUser)}
            recommendation={getVerificationRecommendation(viewUser)}
            onCopy={handleCopy}
          />

          {!viewUser.approved && !viewUser.rejected && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
              <button
                onClick={() => handleReject(viewUser)}
                disabled={processingId === viewUser.id}
                className="h-12 px-5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserX size={18} />
                Reject
              </button>

              <button
                onClick={() => handleApprove(viewUser)}
                disabled={processingId === viewUser.id}
                className="h-12 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserCheck size={18} />
                Approve
              </button>
            </div>
          )}
        </Modal>
      )}

      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditInput
              label="Full Name"
              name="name"
              value={editForm.name}
              onChange={handleEditChange}
            />

            <EditInput
              label="Email"
              name="email"
              value={editForm.email}
              onChange={handleEditChange}
            />

            <EditInput
              label="Phone"
              name="phone"
              value={editForm.phone}
              onChange={handleEditChange}
            />

            <EditInput
              label="Hospital Name"
              name="hospitalName"
              value={editForm.hospitalName}
              onChange={handleEditChange}
            />

            <EditInput
              label="Department"
              name="department"
              value={editForm.department}
              onChange={handleEditChange}
            />

            <EditInput
              label="Specialization"
              name="specialization"
              value={editForm.specialization}
              onChange={handleEditChange}
            />

            <EditInput
              label="License Number"
              name="licenseNumber"
              value={editForm.licenseNumber}
              onChange={handleEditChange}
            />

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Role
              </label>

              <select
                name="role"
                value={editForm.role}
                onChange={handleEditChange}
                className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-blue-500/40"
              >
                <option className="bg-slate-900" value="admin">
                  Admin
                </option>
                <option className="bg-slate-900" value="doctor">
                  Doctor
                </option>
                <option className="bg-slate-900" value="nurse">
                  Nurse
                </option>
                <option className="bg-slate-900" value="pharmacist">
                  Pharmacist
                </option>
                <option className="bg-slate-900" value="technician">
                  Technician
                </option>
                <option className="bg-slate-900" value="user">
                  User
                </option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={() => setEditUser(null)}
              disabled={processingId === editUser.id}
              className="h-12 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSaveEdit}
              disabled={processingId === editUser.id}
              className="h-12 px-5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={18} />
              {processingId === editUser.id ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {deleteUser && (
        <div className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-red-500/20 bg-slate-950 shadow-2xl p-8">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center justify-center mb-5">
              <AlertTriangle size={30} />
            </div>

            <h2 className="text-3xl font-black text-white mb-3">
              Delete User?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              You are about to permanently delete{" "}
              <span className="text-white font-black">
                {deleteUser.name || deleteUser.email}
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-red-200 text-sm">
                This will remove the user profile from Firebase.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setDeleteUser(null)}
                disabled={processingId === deleteUser.id}
                className="h-12 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={processingId === deleteUser.id}
                className="h-12 px-5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 size={18} />
                {processingId === deleteUser.id ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

async function safeCreateAuditLog(payload) {
  try {
    await createAuditLog(payload);
  } catch (error) {
    console.warn("Audit log failed:", error);
  }
}

function getFiles(user) {
  return {
    documentUrl: user.documentURL || user.documentUrl || user.licenseURL || user.imageURL || "",
    selfieUrl: user.selfieURL || user.selfieUrl || user.profileImageUrl || "",
    documentLocalPath: user.documentLocalPath || user.licenseLocalPath || "",
    selfieLocalPath: user.selfieLocalPath || "",
    hasDocument:
      Boolean(user.documentURL) ||
      Boolean(user.documentUrl) ||
      Boolean(user.licenseURL) ||
      Boolean(user.documentLocalPath) ||
      user.documentsUploaded === true,
    hasSelfie:
      Boolean(user.selfieURL) ||
      Boolean(user.selfieUrl) ||
      Boolean(user.profileImageUrl) ||
      Boolean(user.selfieLocalPath) ||
      user.faceMatch === true,
  };
}

function getVerificationRecommendation(user) {
  const aiScore = Number(user.aiScore || user.faceMatchScore || 0);
  const documentConfidence = Number(user.documentConfidence || 0);
  const faceConfidence = Number(user.confidence || 0);
  const files = getFiles(user);

  const hasLicense = Boolean(user.licenseNumber);
  const faceMatch = user.faceMatch === true;

  const reasons = [];

  if (!hasLicense) reasons.push("Missing license number.");
  if (!files.hasDocument) reasons.push("Missing ID or professional document.");
  if (!files.hasSelfie) reasons.push("Missing selfie photo.");
  if (!faceMatch) reasons.push("Face match is not confirmed.");
  if (aiScore < 80) reasons.push("AI score is below 80%.");
  if (documentConfidence < 75) reasons.push("Document confidence is below 75%.");
  if (faceConfidence < 75) reasons.push("Face confidence is below 75%.");

  const approve =
    hasLicense &&
    files.hasDocument &&
    files.hasSelfie &&
    faceMatch &&
    aiScore >= 85 &&
    documentConfidence >= 80 &&
    faceConfidence >= 80;

  const reject =
    !hasLicense ||
    !files.hasDocument ||
    !files.hasSelfie ||
    aiScore < 60 ||
    documentConfidence < 50 ||
    faceConfidence < 50;

  if (approve) {
    return {
      decision: "approve",
      label: "Recommended Approval",
      riskLevel: "low",
      className:
        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
      icon: CheckCircle2,
      reasons: ["All verification requirements are satisfied."],
    };
  }

  if (reject) {
    return {
      decision: "reject",
      label: "High Risk",
      riskLevel: "high",
      className: "bg-red-500/15 text-red-300 border border-red-500/20",
      icon: ShieldAlert,
      reasons,
    };
  }

  return {
    decision: "review",
    label: "Manual Review",
    riskLevel: "medium",
    className: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
    icon: AlertCircle,
    reasons: reasons.length ? reasons : ["Admin review is recommended."],
  };
}

function getScoreClass(score) {
  if (score >= 85) {
    return "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 text-xs font-semibold";
  }

  if (score >= 70) {
    return "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20 text-xs font-semibold";
  }

  return "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/20 text-xs font-semibold";
}

function RecommendationBadge({ recommendation }) {
  const Icon = recommendation.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${recommendation.className}`}
    >
      <Icon size={14} />
      {recommendation.label}
    </div>
  );
}

function UserDetails({ user, status, recommendation, onCopy }) {
  const files = getFiles(user);
  const aiScore = Number(user.aiScore || user.faceMatchScore || 0);
  const documentConfidence = Number(user.documentConfidence || 0);
  const faceConfidence = Number(user.confidence || 0);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-300 text-2xl font-black overflow-hidden">
            {user.imageURL || user.selfieURL ? (
              <img
                src={user.imageURL || user.selfieURL}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              String(user.name || "U").charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-2xl font-black text-white">
              {user.name || "Unknown User"}
            </h3>
            <p className="text-slate-400 mt-1">
              {user.role || "Healthcare Staff"} •{" "}
              {user.hospitalName || "Healthcare Institution"}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                <status.icon size={14} />
                {status.label}
              </div>

              <RecommendationBadge recommendation={recommendation} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="AI Score" value={`${aiScore}%`} icon={<Brain />} score={aiScore} />
        <MetricCard title="Document Confidence" value={`${documentConfidence}%`} icon={<FileText />} score={documentConfidence} />
        <MetricCard title="Face Confidence" value={`${faceConfidence}%`} icon={<Activity />} score={faceConfidence} />
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-xl font-black text-white mb-4">
          Admin Decision Support
        </h3>

        <div className={`rounded-2xl border p-4 ${recommendation.className}`}>
          <div className="flex items-center gap-2 font-black mb-3">
            <recommendation.icon size={18} />
            {recommendation.label} • {recommendation.riskLevel.toUpperCase()} RISK
          </div>

          <ul className="space-y-2 text-sm">
            {recommendation.reasons.map((reason, index) => (
              <li key={index}>• {reason}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Info label="Name" value={user.name} icon={<BadgeCheck />} />
        <Info label="Email" value={user.email} icon={<Mail />} />
        <Info label="Role" value={user.role} icon={<ShieldCheck />} />
        <Info label="Phone" value={user.phone} icon={<Phone />} />
        <Info label="Hospital" value={user.hospitalName} icon={<Hospital />} />
        <Info label="Department" value={user.department} />
        <Info label="Specialization" value={user.specialization} />
        <Info label="License Number" value={user.licenseNumber} />
        <Info label="Verification Status" value={user.verificationStatus || user.status} />
        <Info label="AI Processing" value={user.aiProcessingStatus} />
        <Info label="Face Match Status" value={user.faceMatchStatus} />
        <Info label="Document Check" value={user.documentCheckStatus || user.ocrStatus} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DocumentCard
          title="ID / License Document"
          url={files.documentUrl}
          localPath={files.documentLocalPath}
          uploaded={files.hasDocument}
        />

        <DocumentCard
          title="Selfie Image"
          url={files.selfieUrl}
          localPath={files.selfieLocalPath}
          uploaded={files.hasSelfie}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onCopy(user.email, "Email")}
          className="h-11 px-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold hover:bg-blue-500/20 flex items-center gap-2"
        >
          <Clipboard size={16} />
          Copy Email
        </button>

        <button
          onClick={() => onCopy(user.licenseNumber, "License number")}
          className="h-11 px-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold hover:bg-purple-500/20 flex items-center gap-2"
        >
          <Clipboard size={16} />
          Copy License
        </button>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, score }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
      <div className={getScoreClass(Number(score || 0)).replace("inline-flex", "w-12 h-12 flex justify-center")}>
        {icon}
      </div>

      <p className="text-slate-500 text-sm mt-4 mb-2">{title}</p>
      <h3 className="text-3xl font-black text-white">{value}</h3>
    </div>
  );
}

function DocumentCard({ title, url, localPath, uploaded }) {
  const canOpen = Boolean(url) && String(url).startsWith("http");

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
      <h4 className="text-white font-black mb-3">{title}</h4>

      {canOpen ? (
        <button
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          className="h-10 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold hover:bg-blue-500/20 flex items-center gap-2"
        >
          <Eye size={16} />
          View File
        </button>
      ) : uploaded ? (
        <div className="text-emerald-300 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          Uploaded {localPath ? "(Local Demo Path)" : ""}
        </div>
      ) : (
        <div className="text-red-300 text-sm font-bold flex items-center gap-2">
          <XCircle size={16} />
          Not uploaded
        </div>
      )}

      {localPath && (
        <p className="text-slate-500 text-xs mt-3 break-all">
          {localPath}
        </p>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-white">{title}</h2>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function Info({ label, value, icon }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
        {icon && <span className="w-5 h-5">{icon}</span>}
        {label}
      </div>

      <p className="text-white font-bold capitalize">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function EditInput({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">
        {label}
      </label>

      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-blue-500/40"
      />
    </div>
  );
}