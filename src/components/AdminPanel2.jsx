import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { FileText, Users, ChartLine, ChartBar, Pulse, ShieldCheck, Sparkle, Trash, Stack } from "@phosphor-icons/react";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast.js";
import { showConfirm } from "../lib/alert.js";
import { Activity } from "lucide-react";

const THEME = {
  bg: "#f8fafc",
  surface: "#ffffff",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  primary: "#2563eb",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

// StatCard component defined outside to avoid re-creation on each render
const StatCard = ({ icon: IconComponent, label, value, unit = "", color = THEME.primary, trend = null }) => (
    <div style={{
      background: THEME.surface,
      borderRadius: "12px",
      padding: "24px",
      border: `1px solid ${THEME.border}`,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      transition: "all 0.3s ease",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.1)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Gradient background */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "120px",
        height: "120px",
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        borderRadius: "50%",
        transform: "translate(40px, -40px)",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            background: `${color}15`,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <IconComponent size={24} color={color} strokeWidth={2} />
          </div>
          {trend && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: "600",
              color: trend > 0 ? THEME.success : THEME.danger,
            }}>
              {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}%
            </div>
          )}
        </div>

        <p style={{
          fontSize: "13px",
          color: THEME.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontWeight: "600",
          margin: "0 0 8px 0",
        }}>
          {label}
        </p>

        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <h3 style={{
            fontSize: "36px",
            fontWeight: "800",
            color: THEME.text,
            margin: 0,
          }}>
            {value}
          </h3>
          {unit && <span style={{ fontSize: "16px", color: THEME.textMuted }}>{unit}</span>}
        </div>
      </div>
    </div>
  );

// Template Stats Canvas
const TemplateStatsCanvas = ({ templateData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2 - 60;

    // Title
    ctx.fillStyle = THEME.text;
    ctx.font = "bold 22px system-ui, -apple-system";
    ctx.textAlign = "center";
    ctx.fillText("Template Usage Statistics", width / 2, 35);

    if (templateData && templateData.length > 0) {
      const maxUses = Math.max(...templateData.map(t => t.uses || 0));
      if (maxUses > 0) {
        const barStartX = padding;
        const barStartY = padding + 40;
        const barChartHeight = chartHeight;
        const barChartWidth = chartWidth;
        const barWidth = (barChartWidth / Math.min(templateData.length, 8)) * 0.75;
        const barSpacing = (barChartWidth / Math.min(templateData.length, 8)) * 0.25;

        // Draw grid
        ctx.strokeStyle = "#f1f5f9";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
          const y = barStartY + (barChartHeight / 5) * i;
          ctx.beginPath();
          ctx.moveTo(padding, y);
          ctx.lineTo(width - padding, y);
          ctx.stroke();
        }

        templateData.slice(0, 8).forEach((template, idx) => {
          const barHeight = (template.uses / maxUses) * barChartHeight;
          const x = barStartX + idx * (barChartWidth / Math.min(templateData.length, 8)) + barSpacing / 2;
          const y = barStartY + barChartHeight - barHeight;

          const gradient = ctx.createLinearGradient(x, y, x, barStartY + barChartHeight);
          gradient.addColorStop(0, template.color || THEME.primary);
          gradient.addColorStop(1, (template.color || THEME.primary) + "80");
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);

          ctx.fillStyle = THEME.text;
          ctx.font = "bold 13px system-ui, -apple-system";
          ctx.textAlign = "center";
          ctx.fillText(template.uses || 0, x + barWidth / 2, y - 10);

          ctx.save();
          ctx.translate(x + barWidth / 2, barStartY + barChartHeight + 20);
          ctx.rotate(-Math.PI / 4);
          ctx.fillStyle = THEME.textMuted;
          ctx.font = "11px system-ui, -apple-system";
          ctx.textAlign = "left";
          const shortName = template.templateName.length > 15 
            ? template.templateName.substring(0, 13) + "..." 
            : template.templateName;
          ctx.fillText(shortName, 0, 0);
          ctx.restore();
        });

        // Y-axis labels
        ctx.fillStyle = THEME.textMuted;
        ctx.font = "12px system-ui, -apple-system";
        ctx.textAlign = "right";
        for (let i = 0; i <= 5; i++) {
          const value = Math.round((maxUses / 5) * (5 - i));
          const y = barStartY + (barChartHeight / 5) * i;
          ctx.fillText(value.toString(), padding - 15, y + 4);
        }
      }
    } else {
      ctx.fillStyle = THEME.textMuted;
      ctx.font = "16px system-ui, -apple-system";
      ctx.textAlign = "center";
      ctx.fillText("No template usage data available", width / 2, height / 2);
    }
  }, [templateData]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={600}
      style={{
        maxWidth: "100%",
        height: "auto",
        display: "block",
        borderRadius: "8px",
      }}
    />
  );
};

// User Stats Canvas
const UserStatsCanvas = ({ stats }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2 - 60;

    // Title
    ctx.fillStyle = THEME.text;
    ctx.font = "bold 22px system-ui, -apple-system";
    ctx.textAlign = "center";
    ctx.fillText("User Statistics Overview", width / 2, 35);

    // Draw grid
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + 40 + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // User stats data
    const statsData = [
      { label: "Total Users", value: stats.totalUsers || 0, color: "#7c3aed" },
      { label: "Verified Users", value: stats.verifiedUsers || 0, color: THEME.success },
      { label: "Premium Users", value: stats.premiumUsers || 0, color: THEME.warning },
      { label: "Active (30d)", value: stats.activeUsers || 0, color: "#06b6d4" },
    ];

    const maxValue = Math.max(...statsData.map(s => s.value), 1);
    const barWidth = (chartWidth / statsData.length) * 0.75;
    const barSpacing = (chartWidth / statsData.length) * 0.25;
    const barStartY = padding + 40;
    const barChartHeight = chartHeight;

    statsData.forEach((stat, idx) => {
      const barHeight = (stat.value / maxValue) * barChartHeight;
      const x = padding + idx * (chartWidth / statsData.length) + barSpacing / 2;
      const y = barStartY + barChartHeight - barHeight;

      const gradient = ctx.createLinearGradient(x, y, x, barStartY + barChartHeight);
      gradient.addColorStop(0, stat.color);
      gradient.addColorStop(1, stat.color + "80");
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = THEME.text;
      ctx.font = "bold 14px system-ui, -apple-system";
      ctx.textAlign = "center";
      ctx.fillText(stat.value.toString(), x + barWidth / 2, y - 10);

      ctx.save();
      ctx.translate(x + barWidth / 2, barStartY + barChartHeight + 25);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = THEME.textMuted;
      ctx.font = "11px system-ui, -apple-system";
      ctx.textAlign = "left";
      ctx.fillText(stat.label, 0, 0);
      ctx.restore();
    });

    // Y-axis labels
    ctx.fillStyle = THEME.textMuted;
    ctx.font = "12px system-ui, -apple-system";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxValue / 5) * (5 - i));
      const y = barStartY + (barChartHeight / 5) * i;
      ctx.fillText(value.toString(), padding - 15, y + 4);
    }
  }, [stats]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={600}
      style={{
        maxWidth: "100%",
        height: "auto",
        display: "block",
        borderRadius: "8px",
      }}
    />
  );
};

// Overview Canvas (showing combined stats)
const OverviewCanvas = ({ stats, templateData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.fillStyle = THEME.text;
    ctx.font = "bold 22px system-ui, -apple-system";
    ctx.textAlign = "center";
    ctx.fillText("Platform Overview Dashboard", width / 2, 35);

    // Draw stats circles
    const statsY = padding + 60;
    const statsData = [
      { label: "Total Users", value: stats.totalUsers || 0, color: "#7c3aed" },
      { label: "Total Resumes", value: stats.totalResumes || 0, color: THEME.primary },
      { label: "Verified", value: stats.verifiedUsers || 0, color: THEME.success },
      { label: "Premium", value: stats.premiumUsers || 0, color: THEME.warning },
    ];

    const statSpacing = chartWidth / statsData.length;
    statsData.forEach((stat, idx) => {
      const centerX = padding + idx * statSpacing + statSpacing / 2;
      
      ctx.fillStyle = stat.color + "15";
      ctx.beginPath();
      ctx.arc(centerX, statsY, 35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = stat.color;
      ctx.font = "bold 20px system-ui, -apple-system";
      ctx.textAlign = "center";
      ctx.fillText(stat.value.toString(), centerX, statsY + 7);

      ctx.fillStyle = THEME.textMuted;
      ctx.font = "12px system-ui, -apple-system";
      ctx.fillText(stat.label, centerX, statsY + 35);
    });

    // Template usage mini chart below
    if (templateData && templateData.length > 0) {
      const maxUses = Math.max(...templateData.map(t => t.uses || 0));
      if (maxUses > 0) {
        const miniStartY = statsY + 80;
        const miniHeight = chartHeight - (statsY + 100);
        const miniWidth = chartWidth;
        const miniBarWidth = (miniWidth / Math.min(templateData.length, 6)) * 0.8;
        const miniBarSpacing = (miniWidth / Math.min(templateData.length, 6)) * 0.2;

        ctx.fillStyle = THEME.text;
        ctx.font = "bold 16px system-ui, -apple-system";
        ctx.fillText("Top Template Usage", width / 2, miniStartY - 10);

        templateData.slice(0, 6).forEach((template, idx) => {
          const barHeight = (template.uses / maxUses) * miniHeight;
          const x = padding + idx * (miniWidth / Math.min(templateData.length, 6)) + miniBarSpacing / 2;
          const y = miniStartY + miniHeight - barHeight;

          const gradient = ctx.createLinearGradient(x, y, x, miniStartY + miniHeight);
          gradient.addColorStop(0, template.color || THEME.primary);
          gradient.addColorStop(1, (template.color || THEME.primary) + "80");
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, miniBarWidth, barHeight);

          ctx.fillStyle = THEME.text;
          ctx.font = "bold 11px system-ui, -apple-system";
          ctx.textAlign = "center";
          ctx.fillText(template.uses || 0, x + miniBarWidth / 2, y - 8);
        });
      }
    }
  }, [stats, templateData]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={600}
      style={{
        maxWidth: "100%",
        height: "auto",
        display: "block",
        borderRadius: "8px",
      }}
    />
  );
};

// Template Usage Chart Component (for sidebar)
const TemplateUsageChart = ({ templateData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !templateData || templateData.length === 0) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const maxUses = Math.max(...templateData.map(t => t.uses || 0));
    if (maxUses === 0) return;

    // Draw grid lines
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw bars
    const barWidth = chartWidth / templateData.length - 10;
    templateData.forEach((template, idx) => {
      const barHeight = (template.uses / maxUses) * chartHeight;
      const x = padding + idx * (chartWidth / templateData.length) + 5;
      const y = height - padding - barHeight;

      // Draw bar
      const gradient = ctx.createLinearGradient(x, y, x, height - padding);
      gradient.addColorStop(0, template.color || THEME.primary);
      gradient.addColorStop(1, template.color + "dd" || THEME.primary + "dd");
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on top
      ctx.fillStyle = THEME.text;
      ctx.font = "12px system-ui, -apple-system";
      ctx.textAlign = "center";
      ctx.fillText(template.uses || 0, x + barWidth / 2, y - 8);

      // Draw template name (rotated)
      ctx.save();
      ctx.translate(x + barWidth / 2, height - padding + 20);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = THEME.textMuted;
      ctx.font = "11px system-ui, -apple-system";
      ctx.textAlign = "left";
      const shortName = template.templateName.length > 15 
        ? template.templateName.substring(0, 12) + "..." 
        : template.templateName;
      ctx.fillText(shortName, 0, 0);
      ctx.restore();
    });

    // Draw Y-axis labels
    ctx.fillStyle = THEME.textMuted;
    ctx.font = "11px system-ui, -apple-system";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxUses / 5) * (5 - i));
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }
  }, [templateData]);

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        style={{
          maxWidth: "100%",
          height: "auto",
          display: "block",
        }}
      />
    </div>
  );
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    totalResumes: 0,
    totalUsers: 0,
    verifiedUsers: 0,
    premiumUsers: 0,
    activeUsers: 0,
    deletedUsers: 0,
    newUsersToday: 0,
    newResumesToday: 0,
  });
  const [templateUsage, setTemplateUsage] = useState([]);
  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, templates, users, activity

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        const res = await api.get("/api/v1/admin/dashboard-stats");
        const data = res.data?.data || {};
        
        // Ensure all stats are properly set with defaults
        setStats({
          totalResumes: data.stats?.totalResumes || 0,
          totalUsers: data.stats?.totalUsers || 0,
          verifiedUsers: data.stats?.verifiedUsers || 0,
          premiumUsers: data.stats?.premiumUsers || 0,
          activeUsers: data.stats?.activeUsers || 0,
          deletedUsers: data.stats?.deletedUsers || 0,
          newUsersToday: data.stats?.newUsersToday || 0,
          newResumesToday: data.stats?.newResumesToday || 0,
        });
        setTemplateUsage(data.templateUsage || []);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to load dashboard data";
        console.error("Error details:", {
          status: err.response?.status,
          message: errorMessage,
          data: err.response?.data
        });
        showToast(errorMessage, { type: "error" });
        // Set empty stats on error
        setStats({
          totalResumes: 0,
          totalUsers: 0,
          verifiedUsers: 0,
          premiumUsers: 0,
          activeUsers: 0,
          deletedUsers: 0,
          newUsersToday: 0,
          newResumesToday: 0,
        });
        setTemplateUsage([]);
      } finally {
        setDataLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchData();
    }
  }, [user]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/api/v1/admin/users?limit=100");
        const usersData = res.data?.data?.users || [];
        setUsers(usersData);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/signin", { replace: true });
      return;
    }
    if (user?.role !== "admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleDeleteUser = async (userId, userName, permanent = false, deleteResumes = false) => {
    const warningMsg = permanent 
      ? `⚠️ WARNING: PERMANENT DELETE\n\nThis will PERMANENTLY DELETE user "${userName}" from the database!\n\n- All user data will be permanently removed\n${deleteResumes ? "- All user's resumes will also be deleted\n" : "- User's resumes will be kept\n"}- This action CANNOT be undone\n\nAre you absolutely sure you want to proceed?`
      : `Are you sure you want to delete user "${userName}"?\n\nThis will soft-delete the user. Their data will be retained for 30 days and can be recovered.`;
    
    const confirmed = await showConfirm(warningMsg);
    if (!confirmed) return;

    try {
      setDeletingUserId(userId);
      const endpoint = permanent 
        ? `/api/v1/admin/users/${userId}/hard${deleteResumes ? "?deleteResumes=true" : ""}`
        : `/api/v1/admin/users/${userId}`;
      
      await api.delete(endpoint);
      showToast(`User ${permanent ? "permanently deleted" : "deleted"} successfully`, { type: "success" });
      
      // Refresh data
      const [usersRes, statsRes] = await Promise.all([
        api.get("/api/v1/admin/users?limit=100"),
        api.get("/api/v1/admin/dashboard-stats"),
      ]);
      setUsers(usersRes.data?.data?.users || []);
      const data = statsRes.data?.data || {};
      setStats({
        totalResumes: data.stats?.totalResumes || 0,
        totalUsers: data.stats?.totalUsers || 0,
        verifiedUsers: data.stats?.verifiedUsers || 0,
        premiumUsers: data.stats?.premiumUsers || 0,
        activeUsers: data.stats?.activeUsers || 0,
        deletedUsers: data.stats?.deletedUsers || 0,
        newUsersToday: data.stats?.newUsersToday || 0,
        newResumesToday: data.stats?.newResumesToday || 0,
      });
      setTemplateUsage(data.templateUsage || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete user";
      showToast(errorMsg, { type: "error" });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleHardDeleteWithConfirm = async (userId, userName) => {
    const deleteResumes = await showConfirm(
      `Permanent Delete: "${userName}"\n\nDo you also want to delete all resumes created by this user?\n\nClick OK to delete resumes, Cancel to keep them.`
    );
    await handleDeleteUser(userId, userName, true, deleteResumes);
  };

  if (loading || !user) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (user?.role !== "admin") {
    return <div style={{ padding: 24 }}>Access Denied. Admin access required.</div>;
  }

  // Prepare template data with colors
  const templateColors = {
    "#2563eb": "#2563eb",
    "#7c3aed": "#7c3aed",
    "#06b6d4": "#06b6d4",
    "#10b981": "#10b981",
    "#f59e0b": "#f59e0b",
    "#ec4899": "#ec4899",
    "#8b5cf6": "#8b5cf6",
    "#14b8a6": "#14b8a6",
  };
  
  const colorPalette = Object.values(templateColors);
  const templateData = templateUsage.slice(0, 8).map((tpl, idx) => ({
    ...tpl,
    color: colorPalette[idx % colorPalette.length],
  }));

  const maxUses = templateData.length > 0 ? Math.max(...templateData.map(t => t.uses || 0)) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: THEME.bg }}>
      <Navbar />

      <main style={{ flex: 1, padding: "40px 20px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <ChartBar size={32} color={THEME.primary} strokeWidth={2} />
              <h1 style={{
                fontSize: "32px",
                fontWeight: "800",
                color: THEME.text,
                margin: 0,
              }}>
                Admin Dashboard
              </h1>
            </div>
            <p style={{
              fontSize: "16px",
              color: THEME.textMuted,
              margin: "8px 0 0 0",
            }}>
              Welcome back! Here's what's happening on your platform today.
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "32px",
          }}>
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats.totalUsers || 0}
              color="#7c3aed"
            />
            <StatCard
              icon={FileText}
              label="Total Resumes"
              value={stats.totalResumes || 0}
              color={THEME.primary}
            />
            <StatCard
              icon={ShieldCheck}
              label="Verified Users"
              value={stats.verifiedUsers || 0}
              unit={stats.totalUsers > 0 ? `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}%` : ""}
              color={THEME.success}
            />
            <StatCard
              icon={Sparkle}
              label="Premium Users"
              value={stats.premiumUsers || 0}
              unit={stats.totalUsers > 0 ? `${Math.round(((stats.premiumUsers || 0) / stats.totalUsers) * 100)}%` : ""}
              color={THEME.warning}
            />
            <StatCard
              icon={Pulse}
              label="Active (30d)"
              value={stats.activeUsers || 0}
              color="#06b6d4"
            />
            <StatCard
              icon={ChartLine}
              label="Deleted Users"
              value={stats.deletedUsers || 0}
              color="#ec4899"
            />
          </div>

          {/* Central Canvas - Main Focus with Tabs */}
          <div style={{
            background: THEME.surface,
            borderRadius: "16px",
            border: `1px solid ${THEME.border}`,
            padding: "0",
            marginBottom: "40px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
            display: "flex",
            minHeight: "600px",
            overflow: "hidden",
          }}>
            {/* Left Sidebar Tabs */}
            <div style={{
              width: "200px",
              background: THEME.bg,
              borderRight: `1px solid ${THEME.border}`,
              display: "flex",
              flexDirection: "column",
              padding: "20px 0",
            }}>
              {[
                { id: "overview", label: "Overview", icon: ChartBar },
                { id: "templates", label: "Templates", icon: Stack },
                { id: "users", label: "Users", icon: Users },
                { id: "activity", label: "Activity", icon: Activity },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: isActive ? THEME.surface : "transparent",
                      border: "none",
                      borderLeft: isActive ? `3px solid ${THEME.primary}` : "3px solid transparent",
                      padding: "16px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "all 0.2s ease",
                      color: isActive ? THEME.primary : THEME.textMuted,
                      fontWeight: isActive ? "600" : "500",
                      fontSize: "14px",
                      width: "100%",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = THEME.bg;
                        e.currentTarget.style.color = THEME.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = THEME.textMuted;
                      }
                    }}
                  >
                    <IconComponent size={20} weight={isActive ? "fill" : "regular"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Content Area */}
            <div style={{
              flex: 1,
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {dataLoading ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: THEME.textMuted,
                  minHeight: "500px",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "18px", marginBottom: "12px" }}>Loading analytics...</div>
                    <div style={{ fontSize: "14px", color: THEME.textMuted }}>Fetching dashboard data</div>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === "overview" && (
                    <OverviewCanvas stats={stats} templateData={templateData} />
                  )}
                  {activeTab === "templates" && (
                    <TemplateStatsCanvas templateData={templateData} />
                  )}
                  {activeTab === "users" && (
                    <UserStatsCanvas stats={stats} />
                  )}
                  {activeTab === "activity" && (
                    <div style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                      maxWidth: "800px",
                    }}>
                      <h2 style={{
                        fontSize: "22px",
                        fontWeight: "700",
                        color: THEME.text,
                        margin: "0 0 24px 0",
                        textAlign: "center",
                      }}>
                        Recent Activity
                      </h2>
                      <div style={{
                        background: THEME.bg,
                        borderRadius: "12px",
                        padding: "20px",
                        border: `1px solid ${THEME.border}`,
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}>
                          <div>
                            <div style={{ fontSize: "16px", fontWeight: "600", color: THEME.text }}>
                              New Users Today
                            </div>
                            <div style={{ fontSize: "13px", color: THEME.textMuted }}>
                              Users registered in the last 24 hours
                            </div>
                          </div>
                          <div style={{
                            fontSize: "32px",
                            fontWeight: "800",
                            color: THEME.primary,
                          }}>
                            {stats.newUsersToday || 0}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        background: THEME.bg,
                        borderRadius: "12px",
                        padding: "20px",
                        border: `1px solid ${THEME.border}`,
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}>
                          <div>
                            <div style={{ fontSize: "16px", fontWeight: "600", color: THEME.text }}>
                              New Resumes Today
                            </div>
                            <div style={{ fontSize: "13px", color: THEME.textMuted }}>
                              Resumes created in the last 24 hours
                            </div>
                          </div>
                          <div style={{
                            fontSize: "32px",
                            fontWeight: "800",
                            color: THEME.success,
                          }}>
                            {stats.newResumesToday || 0}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        background: THEME.bg,
                        borderRadius: "12px",
                        padding: "20px",
                        border: `1px solid ${THEME.border}`,
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}>
                          <div>
                            <div style={{ fontSize: "16px", fontWeight: "600", color: THEME.text }}>
                              Active Users (30 days)
                            </div>
                            <div style={{ fontSize: "13px", color: THEME.textMuted }}>
                              Users active in the last 30 days
                            </div>
                          </div>
                          <div style={{
                            fontSize: "32px",
                            fontWeight: "800",
                            color: "#06b6d4",
                          }}>
                            {stats.activeUsers || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Secondary Content: Template Usage Cards + Side Chart */}
          <style>{`
            .admin-main-grid {
              display: grid;
              grid-template-columns: 1fr 2fr;
              gap: 32px;
              margin-bottom: 40px;
            }
            @media (max-width: 1024px) {
              .admin-main-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
          <div className="admin-main-grid">
            {/* Left: Template Usage Cards */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}>
              <div style={{
                background: THEME.surface,
                borderRadius: "16px",
                border: `1px solid ${THEME.border}`,
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              }}>
                <h2 style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: THEME.text,
                  margin: "0 0 20px 0",
                }}>
                  Top Template Usage
                </h2>

                {dataLoading ? (
                  <div style={{ padding: "20px", textAlign: "center", color: THEME.textMuted }}>
                    Loading...
                  </div>
                ) : templateData.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: THEME.textMuted }}>
                    No template usage data
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {templateData.slice(0, 6).map((template, idx) => (
                      <div key={idx} style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}>
                          <span style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: THEME.text,
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {template.templateName}
                          </span>
                          <span style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            color: template.color || THEME.primary,
                            marginLeft: "12px",
                          }}>
                            {template.uses}
                          </span>
                        </div>
                        <div style={{
                          height: "8px",
                          background: "#f1f5f9",
                          borderRadius: "4px",
                          overflow: "hidden",
                          position: "relative",
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${((template.uses || 0) / maxUses) * 100}%`,
                            background: `linear-gradient(90deg, ${template.color || THEME.primary}, ${template.color || THEME.primary}dd)`,
                            borderRadius: "4px",
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div style={{
                background: THEME.surface,
                borderRadius: "16px",
                border: `1px solid ${THEME.border}`,
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              }}>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: THEME.text,
                  margin: "0 0 16px 0",
                }}>
                  Recent Activity
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{
                    padding: "12px",
                    background: THEME.bg,
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: THEME.textMuted,
                  }}>
                    <strong style={{ color: THEME.text }}>{stats.newUsersToday || 0} new users</strong> registered today
                  </div>
                  <div style={{
                    padding: "12px",
                    background: THEME.bg,
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: THEME.textMuted,
                  }}>
                    <strong style={{ color: THEME.text }}>{stats.newResumesToday || 0} new resumes</strong> created today
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Canvas Chart */}
            <div style={{
              background: THEME.surface,
              borderRadius: "16px",
              border: `1px solid ${THEME.border}`,
              padding: "32px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
            }}>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "700",
                color: THEME.text,
                margin: "0 0 24px 0",
              }}>
                Template Usage Chart
              </h2>
              {dataLoading ? (
                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: THEME.textMuted,
                  minHeight: "300px",
                }}>
                  Loading chart data...
                </div>
              ) : templateData.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: THEME.textMuted,
                  minHeight: "300px",
                }}>
                  No template usage data available
                </div>
              ) : (
                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "300px",
                }}>
                  <TemplateUsageChart templateData={templateData} />
                </div>
              )}
            </div>
          </div>

          {/* Additional Stats Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            marginBottom: "40px",
          }}>
            {/* User Status */}
            <div style={{
              background: THEME.surface,
              borderRadius: "16px",
              border: `1px solid ${THEME.border}`,
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "700",
                color: THEME.text,
                margin: "0 0 20px 0",
              }}>
                User Status
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}>
                    <span style={{ fontSize: "14px", color: THEME.textMuted }}>Email Verified</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: THEME.success }}>
                      {stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{
                    height: "8px",
                    background: "#f1f5f9",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${stats.totalUsers > 0 ? (stats.verifiedUsers / stats.totalUsers) * 100 : 0}%`,
                      background: THEME.success,
                    }} />
                  </div>
                </div>

                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}>
                    <span style={{ fontSize: "14px", color: THEME.textMuted }}>Premium Users</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: THEME.warning }}>
                      {stats.totalUsers > 0 ? Math.round(((stats.premiumUsers || 0) / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{
                    height: "8px",
                    background: "#f1f5f9",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${stats.totalUsers > 0 ? ((stats.premiumUsers || 0) / stats.totalUsers) * 100 : 0}%`,
                      background: THEME.warning,
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Health */}
            <div style={{
              background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primary}ee)`,
              borderRadius: "16px",
              padding: "24px",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(37, 99, 235, 0.2)",
            }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "700",
                margin: "0 0 20px 0",
              }}>
                Platform Health
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>System Status</span>
                  <span style={{ fontWeight: "700" }}>● Operational</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Templates</span>
                  <span style={{ fontWeight: "700" }}>{templateUsage.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Active Users</span>
                  <span style={{ fontWeight: "700" }}>{stats.activeUsers || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Users Management Section */}
          <div style={{
            background: THEME.surface,
            borderRadius: "16px",
            border: `1px solid ${THEME.border}`,
            padding: "32px",
            marginBottom: "40px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}>
            <h2 style={{
              fontSize: "20px",
              fontWeight: "700",
              color: THEME.text,
              margin: "0 0 24px 0",
            }}>
              Users Management
            </h2>

            {dataLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: THEME.textMuted }}>
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: THEME.textMuted }}>
                No users found
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${THEME.border}` }}>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: THEME.textMuted, textTransform: "uppercase" }}>Name</th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: THEME.textMuted, textTransform: "uppercase" }}>Email</th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: THEME.textMuted, textTransform: "uppercase" }}>Role</th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: THEME.textMuted, textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: THEME.textMuted, textTransform: "uppercase" }}>Plan</th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: THEME.textMuted, textTransform: "uppercase" }}>Joined</th>
                      <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: THEME.textMuted, textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id || u.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                        <td style={{ padding: "12px", fontSize: "14px", color: THEME.text }}>{u.name || "N/A"}</td>
                        <td style={{ padding: "12px", fontSize: "14px", color: THEME.text }}>{u.email}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: u.role === "admin" ? `${THEME.primary}15` : `${THEME.success}15`,
                            color: u.role === "admin" ? THEME.primary : THEME.success,
                          }}>
                            {u.role || "user"}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: u.isVerified ? `${THEME.success}15` : `${THEME.warning}15`,
                            color: u.isVerified ? THEME.success : THEME.warning,
                          }}>
                            {u.isVerified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: u.plan === "premium" || u.plan === "professional" ? `${THEME.warning}15` : `${THEME.textMuted}15`,
                            color: u.plan === "premium" || u.plan === "professional" ? THEME.warning : THEME.textMuted,
                          }}>
                            {u.plan || "free"}
                          </span>
                        </td>
                        <td style={{ padding: "12px", fontSize: "13px", color: THEME.textMuted }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          {(() => {
                            const currentUserId = user?._id || user?.id;
                            const userId = u._id || u.id;
                            const isCurrentUser = currentUserId && userId && currentUserId.toString() === userId.toString();
                            
                            if (isCurrentUser) {
                              return (
                                <span style={{ 
                                  fontSize: "12px", 
                                  color: THEME.textMuted, 
                                  fontStyle: "italic" 
                                }}>
                                  Cannot delete yourself
                                </span>
                              );
                            }
                            
                            return (
                              <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                                <button
                                  onClick={() => handleDeleteUser(userId, u.name || u.email, false)}
                                  disabled={deletingUserId === userId}
                                  style={{
                                    padding: "6px 12px",
                                    background: THEME.danger,
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    cursor: deletingUserId === userId ? "not-allowed" : "pointer",
                                    opacity: deletingUserId === userId ? 0.6 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                  title="Soft delete - User data retained for 30 days"
                                >
                                  <Trash size={14} />
                                  {deletingUserId === userId ? "Deleting..." : "Delete"}
                                </button>
                                <button
                                  onClick={() => handleHardDeleteWithConfirm(userId, u.name || u.email)}
                                  disabled={deletingUserId === userId}
                                  style={{
                                    padding: "6px 10px",
                                    background: "#991b1b",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    cursor: deletingUserId === userId ? "not-allowed" : "pointer",
                                    opacity: deletingUserId === userId ? 0.6 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  title="Permanent delete - Cannot be undone!"
                                >
                                  <Trash size={12} weight="fill" />
                                  <span>Hard</span>
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
