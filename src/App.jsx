import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import SignIn from "./components/SignIn.jsx";
import SignUp from "./components/SignUp.jsx";
import Landing from "./components/Landing.jsx";
import LinkedInCallback from "./components/LinkedInCallback.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Builder from "./components/Builder.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ATSChecker from "./components/ATSChecker.jsx";
import Pricing from "./components/Pricing.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/builder"
        element={
          <ProtectedRoute>
            <Builder />
          </ProtectedRoute>
        }
      />
      <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
      <Route path="/ats-checker" element={<ATSChecker />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
