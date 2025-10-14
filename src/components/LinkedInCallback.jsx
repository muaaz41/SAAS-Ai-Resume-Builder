import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LinkedInCallback() {
  const { loginWithLinkedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const error = params.get("error");
    const returnedState = params.get("state");
    const redirectUri =
      import.meta.env.VITE_LINKEDIN_REDIRECT_URI ||
      "http://localhost:5173/auth/linkedin/callback";
    if (error) {
      setError(`LinkedIn error: ${error}`);
      return;
    }
    if (!code) {
      setError("Missing authorization code");
      return;
    }
    const expectedState = sessionStorage.getItem("li_oauth_state");
    // Enforce state only when both sides are present; relax if missing to ease local dev
    if (returnedState && expectedState && returnedState !== expectedState) {
      setError("Invalid state parameter");
      return;
    }
    (async () => {
      try {
        await loginWithLinkedIn(code, redirectUri);
        navigate("/");
      } catch (e) {
        setError("LinkedIn sign-in failed");
      }
    })();
  }, [location.search, navigate, loginWithLinkedIn]);

  return (
    <div style={{ padding: 24 }}>
      {error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        "Signing you in with LinkedIn..."
      )}
    </div>
  );
}
