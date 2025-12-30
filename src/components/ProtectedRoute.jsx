import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, requireVerified = false }) {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // If route requires email verification and user isn't verified
  if (requireVerified && user && !user.isVerified && user.provider === "local") {
    return <Navigate to="/verify-email" replace state={{ from: location }} />;
  }

  return children;
}
