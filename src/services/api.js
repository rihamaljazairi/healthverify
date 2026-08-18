import axios from "axios";

import { auth } from "../config/firebase";

import {
  APP_CONFIG,
  STORAGE_KEYS,
} from "../utils/constants";

// ============================================
// BASE URL
// ============================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

// ============================================
// AXIOS INSTANCE
// ============================================

const api = axios.create({
  baseURL: API_BASE_URL,

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

api.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;

      // FIREBASE TOKEN
      if (currentUser) {
        const token = await currentUser.getIdToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      // REQUEST TIME
      config.headers["x-request-time"] =
        new Date().toISOString();

      // APP NAME
      config.headers["x-app-name"] =
        APP_CONFIG.APP_NAME;

      return config;
    } catch (error) {
      console.error(
        "❌ Request interceptor error:",
        error
      );

      return config;
    }
  },

  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const status = error?.response?.status;

    // ========================================
    // UNAUTHORIZED
    // ========================================

    if (status === 401) {
      console.warn(
        "⚠ Unauthorized session. Redirecting..."
      );

      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);

      window.location.href = "/login";
    }

    // ========================================
    // FORBIDDEN
    // ========================================

    if (status === 403) {
      console.error(
        "⛔ Access denied."
      );
    }

    // ========================================
    // SERVER ERROR
    // ========================================

    if (status >= 500) {
      console.error(
        "🔥 Internal server error."
      );
    }

    return Promise.reject({
      status,

      message:
        error?.response?.data?.message ||
        error.message ||
        "Something went wrong.",

      data: error?.response?.data || null,
    });
  }
);

// ============================================
// GENERIC API METHODS
// ============================================

export const apiGet = async (
  url,
  config = {}
) => {
  const response = await api.get(url, config);

  return response.data;
};

export const apiPost = async (
  url,
  data = {},
  config = {}
) => {
  const response = await api.post(
    url,
    data,
    config
  );

  return response.data;
};

export const apiPut = async (
  url,
 data = {},
  config = {}
) => {
  const response = await api.put(
    url,
    data,
    config
  );

  return response.data;
};

export const apiPatch = async (
  url,
  data = {},
  config = {}
) => {
  const response = await api.patch(
    url,
    data,
    config
  );

  return response.data;
};

export const apiDelete = async (
  url,
  config = {}
) => {
  const response = await api.delete(
    url,
    config
  );

  return response.data;
};

// ============================================
// FILE UPLOAD
// ============================================

export const uploadFile = async (
  url,
  file,
  extraData = {}
) => {
  const formData = new FormData();

  formData.append("file", file);

  Object.entries(extraData).forEach(
    ([key, value]) => {
      formData.append(key, value);
    }
  );

  const response = await api.post(
    url,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data;
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthCheck = async () => {
  try {
    const response = await api.get("/health");

    return response.data;
  } catch (error) {
    console.error(
      "❌ API health check failed:",
      error
    );

    return null;
  }
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default api;