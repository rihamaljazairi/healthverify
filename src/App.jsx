import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AdminRoute from "./components/Protected/AdminRoute";
import ProtectedRoute from "./components/Protected/ProtectedRoute";
import Layout from "./components/Layout/Layout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VerifyDocuments from "./pages/VerifyDocuments";
import PendingVerifications from "./pages/PendingVerifications";
import Users from "./pages/Users";
import HealthRecords from "./pages/HealthRecords";
import Doctors from "./pages/Doctors";
import DoctorProfile from "./pages/DoctorProfile";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import Pharmacy from "./pages/Pharmacy";
import Weather from "./pages/Weather";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import PublicVerify from "./pages/PublicVerify";
import Pending from "./pages/Pending";
import Rejected from "./pages/Rejected";
import RejectedDoctors from "./pages/RejectedDoctors";
import ApprovedDoctors from "./pages/ApprovedDoctors";
import PendingDoctors from "./pages/PendingDoctors";

export default function App() {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    document.body.classList.add("loaded");
  }, []);

  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:uid" element={<PublicVerify />} />

        {/* USER STATUS ROUTES */}
        <Route
          path="/pending"
          element={
            <ProtectedRoute>
              <Pending />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rejected"
          element={
            <ProtectedRoute>
              <Rejected />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="verify-documents" element={<VerifyDocuments />} />
          <Route
            path="pending-verifications"
            element={<PendingVerifications />}
          />

          <Route path="users" element={<Users />} />
          <Route path="health-records" element={<HealthRecords />} />

          <Route path="doctors" element={<Doctors />} />
          <Route path="doctors/:id" element={<DoctorProfile />} />

          {/* Sidebar compatibility routes */}
          <Route path="approved-doctors" element={<ApprovedDoctors />} />
          <Route path="pending-doctors" element={<PendingDoctors />} />
          <Route path="rejected-doctors" element={<RejectedDoctors />} />

          <Route path="reports" element={<Reports />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="pharmacy" element={<Pharmacy />} />
          <Route path="weather" element={<Weather />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />

          {/* ADMIN FALLBACK */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* EXTRA COMPATIBILITY ROUTES */}
        <Route
          path="/dashboard"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route
          path="/reports"
          element={<Navigate to="/admin/reports" replace />}
        />

        <Route
          path="/users"
          element={<Navigate to="/admin/users" replace />}
        />

        <Route
          path="/doctors"
          element={<Navigate to="/admin/doctors" replace />}
        />

        <Route
          path="/pharmacy"
          element={<Navigate to="/admin/pharmacy" replace />}
        />

        <Route
          path="/weather"
          element={<Navigate to="/admin/weather" replace />}
        />

        <Route
          path="/settings"
          element={<Navigate to="/admin/settings" replace />}
        />

        <Route
          path="/profile"
          element={<Navigate to="/admin/profile" replace />}
        />

        <Route
          path="/approved-doctors"
          element={<Navigate to="/admin/approved-doctors" replace />}
        />

        <Route
          path="/pending-doctors"
          element={<Navigate to="/admin/pending-doctors" replace />}
        />

        <Route
          path="/rejected-doctors"
          element={<Navigate to="/admin/rejected-doctors" replace />}
        />

        {/* 404 FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}