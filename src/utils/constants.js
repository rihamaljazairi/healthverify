// ============================================
// AI HEALTHVERIFY SYSTEM CONSTANTS
// ============================================

// =========================
// APP CONFIGURATION
// =========================
export const APP_CONFIG = {
  APP_NAME: "AI HealthVerify",
  APP_DESCRIPTION:
    "AI-Based Healthcare Staff Verification System",
  APP_VERSION: "1.0.0",
  DEFAULT_THEME: "dark",
  PAGINATION_LIMIT: 10,
  SUPPORT_EMAIL: "support@healthverify.com",
  COMPANY_NAME: "HealthVerify Technologies",
};

// =========================
// USER ROLES
// =========================
export const USER_ROLES = {
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  PHARMACIST: "Pharmacist",
  PATIENT: "Patient",
};

export const USER_ROLE_OPTIONS = [
  USER_ROLES.ADMIN,
  USER_ROLES.DOCTOR,
  USER_ROLES.NURSE,
  USER_ROLES.PHARMACIST,
  USER_ROLES.PATIENT,
];

// =========================
// DOCUMENT TYPES
// =========================
export const DOCUMENT_TYPES = [
  "Medical ID",
  "Prescription",
  "Lab Report",
  "Insurance Card",
  "Health Certificate",
  "Vaccination Record",
  "Hospital License",
  "Doctor License",
  "Nursing Certificate",
  "Pharmacy Certificate",
];

// =========================
// VERIFICATION STATUS
// =========================
export const VERIFICATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  FRAUD: "fraud",
};

// =========================
// STATUS LABELS
// =========================
export const VERIFICATION_STATUS_LABELS = {
  pending: "Pending Review",
  verified: "Verified",
  rejected: "Rejected",
  fraud: "Fraud Detected",
};

// =========================
// STATUS COLORS
// =========================
export const VERIFICATION_STATUS_COLORS = {
  pending: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },

  verified: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },

  rejected: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },

  fraud: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
  },
};

// =========================
// API ENDPOINTS
// =========================
export const API_ENDPOINTS = {
  // AUTH
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  REGISTER: "/auth/register",
  GET_PROFILE: "/auth/profile",
  UPDATE_PROFILE: "/auth/profile/update",

  // USERS
  GET_USERS: "/users",
  GET_USER_BY_ID: "/users/:id",
  CREATE_USER: "/users/create",
  UPDATE_USER: "/users/update",
  DELETE_USER: "/users/delete",

  // VERIFICATION
  VERIFY_DOCUMENT: "/verify-document",
  GET_VERIFICATIONS: "/verifications",
  APPROVE_VERIFICATION: "/verifications/approve",
  REJECT_VERIFICATION: "/verifications/reject",

  // HEALTH RECORDS
  GET_HEALTH_RECORDS: "/health-records",

  // REPORTS
  GET_REPORTS: "/reports",

  // WEATHER
  GET_WEATHER: "/weather",

  // PHARMACY
  GET_MEDICINES: "/pharmacy",
};

// =========================
// SIDEBAR NAVIGATION
// =========================
export const SIDEBAR_LINKS = [
  {
    title: "Dashboard",
    path: "/admin/dashboard",
    icon: "LayoutDashboard",
  },

  {
    title: "Verify Documents",
    path: "/admin/verify-documents",
    icon: "FileCheck",
  },

  {
    title: "Users",
    path: "/admin/users",
    icon: "Users",
  },

  {
    title: "Health Records",
    path: "/admin/health-records",
    icon: "Heart",
  },

  {
    title: "Doctors",
    path: "/admin/doctors",
    icon: "Stethoscope",
  },

  {
    title: "Reports",
    path: "/admin/reports",
    icon: "BarChart3",
  },

  {
    title: "Pharmacy",
    path: "/admin/pharmacy",
    icon: "Pill",
  },

  {
    title: "Weather",
    path: "/admin/weather",
    icon: "CloudSun",
  },

  {
    title: "Settings",
    path: "/admin/settings",
    icon: "Settings",
  },
];

// =========================
// DASHBOARD STATS
// =========================
export const DASHBOARD_STATS = [
  {
    title: "Total Users",
    key: "users",
    color: "blue",
  },

  {
    title: "Verified Staff",
    key: "verified",
    color: "green",
  },

  {
    title: "Pending Reviews",
    key: "pending",
    color: "yellow",
  },

  {
    title: "Fraud Alerts",
    key: "fraud",
    color: "red",
  },
];

// =========================
// LOCAL STORAGE KEYS
// =========================
export const STORAGE_KEYS = {
  THEME: "healthverify_theme",
  USER: "healthverify_user",
  TOKEN: "healthverify_token",
  SETTINGS: "healthverify_settings",
};

// =========================
// ANIMATION DURATIONS
// =========================
export const ANIMATION = {
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5,
};

// =========================
// SECURITY SETTINGS
// =========================
export const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT_MINUTES: 60,
  PASSWORD_MIN_LENGTH: 8,
};

// =========================
// AI SETTINGS
// =========================
export const AI_CONFIG = {
  FACE_MATCH_THRESHOLD: 0.85,
  DOCUMENT_CONFIDENCE_MIN: 80,
  FRAUD_DETECTION_ENABLED: true,
  OCR_ENABLED: true,
};

// =========================
// TABLE PAGINATION
// =========================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100],
};

// =========================
// DATE FORMATS
// =========================
export const DATE_FORMATS = {
  FULL: "DD MMM YYYY",
  SHORT: "DD/MM/YYYY",
  TIME: "hh:mm A",
};

// =========================
// DEFAULT EXPORT
// =========================
const CONSTANTS = {
  APP_CONFIG,
  USER_ROLES,
  USER_ROLE_OPTIONS,
  DOCUMENT_TYPES,
  VERIFICATION_STATUS,
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_STATUS_COLORS,
  API_ENDPOINTS,
  SIDEBAR_LINKS,
  DASHBOARD_STATS,
  STORAGE_KEYS,
  SECURITY,
  AI_CONFIG,
  PAGINATION,
  DATE_FORMATS,
};

export default CONSTANTS;