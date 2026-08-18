import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Checking admin access...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/pending" replace />;
  }

  return children;
}