import emailjs from "@emailjs/browser";

import { APP_CONFIG } from "../utils/constants";

// ======================================================
// EMAILJS CONFIG
// ======================================================

const SERVICE_ID =
  import.meta.env.VITE_EMAILJS_SERVICE_ID;

const PUBLIC_KEY =
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const TEMPLATE_APPROVED =
  import.meta.env.VITE_EMAILJS_TEMPLATE_APPROVED;

const TEMPLATE_REJECTED =
  import.meta.env.VITE_EMAILJS_TEMPLATE_REJECTED;

// ======================================================
// INITIALIZE EMAILJS
// ======================================================

emailjs.init(PUBLIC_KEY);

// ======================================================
// COMMON TEMPLATE DATA
// ======================================================

const getCommonTemplateData = (
  toEmail,
  toName
) => ({
  to_email: toEmail,

  to_name: toName,

  app_name: APP_CONFIG.APP_NAME,

  company_name: APP_CONFIG.COMPANY_NAME,

  support_email: APP_CONFIG.SUPPORT_EMAIL,

  app_url: window.location.origin,

  current_year: new Date().getFullYear(),
});

// ======================================================
// SEND APPROVAL EMAIL
// ======================================================

export const sendApprovalEmail = async (
  toEmail,
  toName,
  role = "Healthcare Staff"
) => {
  try {
    const templateParams = {
      ...getCommonTemplateData(
        toEmail,
        toName
      ),

      role,

      subject:
        "Your HealthVerify Account Has Been Approved",

      status: "Approved",

      message: `
Congratulations!

Your HealthVerify healthcare account has been successfully approved by the administrator.

You can now log in and access your professional dashboard, healthcare verification tools, and system services.
      `,

      login_url: `${window.location.origin}/login`,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_APPROVED,
      templateParams,
      PUBLIC_KEY
    );

    console.log(
      "✅ Approval email sent:",
      response
    );

    return {
      success: true,

      message:
        "Approval email sent successfully.",
    };
  } catch (error) {
    console.error(
      "❌ Approval email failed:",
      error
    );

    return {
      success: false,

      message:
        error?.text ||
        "Failed to send approval email.",
    };
  }
};

// ======================================================
// SEND REJECTION EMAIL
// ======================================================

export const sendRejectionEmail = async (
  toEmail,
  toName,
  reason = "Your submitted documents did not meet the verification requirements."
) => {
  try {
    const templateParams = {
      ...getCommonTemplateData(
        toEmail,
        toName
      ),

      subject:
        "HealthVerify Account Verification Result",

      status: "Rejected",

      rejection_reason: reason,

      message: `
Unfortunately, your HealthVerify registration could not be approved at this time.

Please review your submitted healthcare documents and contact the administrator for further assistance.
      `,

      support_url: `${window.location.origin}/support`,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_REJECTED,
      templateParams,
      PUBLIC_KEY
    );

    console.log(
      "✅ Rejection email sent:",
      response
    );

    return {
      success: true,

      message:
        "Rejection email sent successfully.",
    };
  } catch (error) {
    console.error(
      "❌ Rejection email failed:",
      error
    );

    return {
      success: false,

      message:
        error?.text ||
        "Failed to send rejection email.",
    };
  }
};

// ======================================================
// GENERIC EMAIL
// ======================================================

export const sendCustomEmail = async ({
  templateId,
  toEmail,
  toName,
  subject,
  message,
  extraData = {},
}) => {
  try {
    const templateParams = {
      ...getCommonTemplateData(
        toEmail,
        toName
      ),

      subject,

      message,

      ...extraData,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      templateId,
      templateParams,
      PUBLIC_KEY
    );

    console.log(
      "✅ Custom email sent:",
      response
    );

    return {
      success: true,
      response,
    };
  } catch (error) {
    console.error(
      "❌ Custom email failed:",
      error
    );

    return {
      success: false,
      error,
    };
  }
};

// ======================================================
// EMAIL VALIDATOR
// ======================================================

export const validateEmail = (email) => {
  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(email);
};

// ======================================================
// CHECK CONFIG
// ======================================================

export const emailServiceReady = () => {
  return !!(
    SERVICE_ID &&
    PUBLIC_KEY &&
    TEMPLATE_APPROVED &&
    TEMPLATE_REJECTED
  );
};

// ======================================================
// EXPORT DEFAULT
// ======================================================

const emailService = {
  sendApprovalEmail,
  sendRejectionEmail,
  sendCustomEmail,
  validateEmail,
  emailServiceReady,
};

export default emailService;