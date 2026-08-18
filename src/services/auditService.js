import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export const createAuditLog = async ({
  type = "activity",
  action = "System activity",
  targetId = "",
  targetName = "",
  targetEmail = "",
  details = "",
}) => {
  try {
    const currentUser = auth.currentUser;

    await addDoc(collection(db, "auditLogs"), {
      type,
      action,

      actorId: currentUser?.uid || "system",
      actorEmail: currentUser?.email || "system@healthverify.com",
      actorName: currentUser?.displayName || "System Admin",

      targetId,
      targetName,
      targetEmail,

      details,
      createdAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Audit log error:", error);
    return false;
  }
};

export const logApproval = async (user) => {
  return createAuditLog({
    type: "approval",
    action: "Approved healthcare staff",
    targetId: user?.id || "",
    targetName: user?.name || "",
    targetEmail: user?.email || "",
    details: `${user?.role || "User"} account was approved.`,
  });
};

export const logRejection = async (user, reason = "") => {
  return createAuditLog({
    type: "rejection",
    action: "Rejected healthcare staff",
    targetId: user?.id || "",
    targetName: user?.name || "",
    targetEmail: user?.email || "",
    details: reason || `${user?.role || "User"} account was rejected.`,
  });
};

export const logUpload = async (user, fileName = "") => {
  return createAuditLog({
    type: "upload",
    action: "Uploaded verification document",
    targetId: user?.id || "",
    targetName: user?.name || "",
    targetEmail: user?.email || "",
    details: fileName ? `Uploaded file: ${fileName}` : "Uploaded a document.",
  });
};

export const logLogin = async () => {
  const currentUser = auth.currentUser;

  return createAuditLog({
    type: "login",
    action: "Admin logged in",
    targetId: currentUser?.uid || "",
    targetEmail: currentUser?.email || "",
    details: "Administrator accessed the web dashboard.",
  });
};