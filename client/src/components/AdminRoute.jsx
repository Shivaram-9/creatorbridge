import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner centered />;
  
  if (!user || user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
}
