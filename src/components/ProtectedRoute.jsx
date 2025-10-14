import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return children;
}
