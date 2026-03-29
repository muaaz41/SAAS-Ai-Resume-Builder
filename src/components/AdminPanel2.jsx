import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { FileText, Users, ChartLine, ChartBar, Pulse, ShieldCheck, Sparkle, Trash, Stack, Upload } from "@phosphor-icons/react";
import { api } from "../lib/api.js";
import { showToast } from "../lib/toast.js";
import { showConfirm } from "../lib/alert.js";
import { Activity } from "lucide-react";
import "../css/AdminPanel.css";
// import TemplateUpload from "./TemplateUpload.jsx";

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
    <div className="admin-stat-card">
      <div className="stat-glow" style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }} />
      <div className="admin-stat-inner">
        <div className="admin-stat-top">
          <div className="admin-stat-icon-wrap" style={{ background: `${color}15` }}>
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
        <p className="admin-stat-label">{label}</p>
        <div className="admin-stat-value-row">
          <h3 className="admin-stat-value">{value}</h3>
          {unit && <span className="admin-stat-unit">{unit}</span>}
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
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState(null);
  const [endingSubscriptionUserId, setEndingSubscriptionUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, templates, users, activity
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [deletingTemplateSlug, setDeletingTemplateSlug] = useState(null);

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

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("/api/v1/templates");
        const templatesData = res.data?.data?.items || [];
        setTemplates(templatesData);
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      }
    };
    if (user?.role === "admin" && activeTab === "templates") {
      fetchTemplates();
    }
  }, [user, activeTab]);

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

  const handleUpdateUserRole = async (userId, role, userName) => {
    const isPromote = role === "admin";
    const confirmed = await showConfirm(
      isPromote
        ? `Make "${userName}" an admin?\n\nThey will have full access to the Admin Dashboard.`
        : `Revoke admin access for "${userName}"?\n\nThey will no longer have access to the Admin Dashboard.`
    );
    if (!confirmed) return;

    try {
      setUpdatingRoleUserId(userId);
      await api.patch(`/api/v1/admin/users/${userId}/role`, { role });
      showToast(
        isPromote ? `"${userName}" is now an admin` : `Admin access revoked for "${userName}"`,
        { type: "success" }
      );
      setUsers((prev) =>
        prev.map((u) => {
          const id = u._id || u.id;
          if (id && id.toString() === userId.toString()) {
            return { ...u, role };
          }
          return u;
        })
      );
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to update role";
      showToast(errorMsg, { type: "error" });
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleEndUserSubscription = async (userId, userName, plan) => {
    const confirmed = await showConfirm(
      `End subscription for "${userName}"?\n\nCurrent plan: ${plan || "free"}\nThis will cancel the user's active paid subscription.`
    );
    if (!confirmed) return;

    try {
      setEndingSubscriptionUserId(userId);
      await api.post(`/api/v1/admin/users/${userId}/cancel-subscription`);
      showToast(`Subscription ended for "${userName}"`, { type: "success" });

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
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to end subscription";
      showToast(errorMsg, { type: "error" });
    } finally {
      setEndingSubscriptionUserId(null);
    }
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

  const handleTemplateUploadSuccess = () => {
    setShowTemplateUpload(false);
    // Refresh template stats and list
    const fetchData = async () => {
      try {
        const [statsRes, templatesRes] = await Promise.all([
          api.get("/api/v1/admin/dashboard-stats"),
          api.get("/api/v1/templates"),
        ]);
        const data = statsRes.data?.data || {};
        setTemplateUsage(data.templateUsage || []);
        setTemplates(templatesRes.data?.data?.items || []);
      } catch (err) {
        console.error("Failed to refresh template data:", err);
      }
    };
    fetchData();
  };

  const handleDeleteTemplate = async (slug, name) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete template "${name}"?\n\nThis will permanently delete:\n- Template files (template.hbs, style.css, mapping.json)\n- Template record from database\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingTemplateSlug(slug);
      await api.delete(`/api/v1/admin/templates/${slug}`);
      showToast(`Template "${name}" deleted successfully`, { type: "success" });
      
      // Refresh templates list and stats
      const [templatesRes, statsRes] = await Promise.all([
        api.get("/api/v1/templates"),
        api.get("/api/v1/admin/dashboard-stats"),
      ]);
      setTemplates(templatesRes.data?.data?.items || []);
      const data = statsRes.data?.data || {};
      setTemplateUsage(data.templateUsage || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete template";
      showToast(errorMsg, { type: "error" });
    } finally {
      setDeletingTemplateSlug(null);
    }
  };

  return (
    <div className="admin-panel-wrap">
      <Navbar />
      {showTemplateUpload && (
        <TemplateUpload
          onClose={() => setShowTemplateUpload(false)}
          onSuccess={handleTemplateUploadSuccess}
        />
      )}

      <main className="admin-main">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <div className="admin-header-row">
              <ChartBar size={32} color={THEME.primary} strokeWidth={2} />
              <h1 className="admin-title">
                Admin Dashboard
              </h1>
            </div>
            <p className="admin-subtitle">
              Welcome back! Here's what's happening on your platform today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="admin-stats-grid">
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
          <div className="admin-content-card">
            {/* Left Sidebar Tabs */}
            <div className="admin-tabs-sidebar">
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
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`admin-tab-btn ${isActive ? "active" : ""}`}
                  >
                    <IconComponent size={20} weight={isActive ? "fill" : "regular"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Content Area */}
            <div className="admin-content-area">
              {dataLoading ? (
                <div className="admin-loading">
                  <div className="admin-loading-inner">
                    <div className="admin-loading-title">Loading analytics...</div>
                    <div className="admin-loading-sub">Fetching dashboard data</div>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === "overview" && (
                    <OverviewCanvas stats={stats} templateData={templateData} />
                  )}
                  {activeTab === "templates" && (
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 className="admin-section-title admin-section-title-lg">
                          Template Management
                        </h2>
                        {/* <button
                          onClick={() => setShowTemplateUpload(true)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 20px",
                            background: THEME.primary,
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Upload size={20} />
                          Upload Template
                        </button> */}
                      </div>
                      
                      {/* Template List */}
                      <div className="admin-table-card">
                        <div className="admin-table-card-header">
                          <h3 className="admin-table-card-title">
                            All Templates ({templates.length})
                          </h3>
                        </div>
                        <div className="admin-table-scroll">
                          {templates.length === 0 ? (
                            <div className="admin-empty">
                              No templates found
                            </div>
                          ) : (
                            <table className="admin-table">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Category</th>
                                  <th>Slug</th>
                                  <th>Status</th>
                                  <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {templates.map((template) => (
                                  <tr key={template.slug || template._id}>
                                    <td>{template.name}</td>
                                    <td>
                                      <span className={`admin-badge ${template.category === "premium" ? "admin-badge-premium" : template.category === "industry" ? "admin-badge-industry" : "admin-badge-free"}`}>
                                        {template.category || "free"}
                                      </span>
                                    </td>
                                    <td style={{ fontFamily: "monospace", color: THEME.textMuted }}>
                                      {template.slug}
                                    </td>
                                    <td>
                                      <span className={template.isActive ? "admin-badge admin-badge-active" : "admin-badge admin-badge-inactive"}>
                                        {template.isActive ? "Active" : "Inactive"}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTemplate(template.slug, template.name)}
                                        disabled={deletingTemplateSlug === template.slug}
                                        className="admin-btn admin-btn-danger"
                                      >
                                        <Trash size={14} />
                                        {deletingTemplateSlug === template.slug ? "Deleting..." : "Delete"}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>

                      <TemplateStatsCanvas templateData={templateData} />
                    </div>
                  )}
                  {activeTab === "users" && (
                    <UserStatsCanvas stats={stats} />
                  )}
                  {activeTab === "activity" && (
                    <div className="admin-activity-list">
                      <h2 className="admin-activity-title">
                        Recent Activity
                      </h2>
                      <div className="admin-metric-block">
                        <div className="admin-metric-row">
                          <div>
                            <div className="admin-metric-label">New Users Today</div>
                            <div className="admin-metric-desc">Users registered in the last 24 hours</div>
                          </div>
                          <div className="admin-metric-value">
                            {stats.newUsersToday || 0}
                          </div>
                        </div>
                      </div>
                      <div className="admin-metric-block">
                        <div className="admin-metric-row">
                          <div>
                            <div className="admin-metric-label">New Resumes Today</div>
                            <div className="admin-metric-desc">Resumes created in the last 24 hours</div>
                          </div>
                          <div className="admin-metric-value admin-metric-value-success">
                            {stats.newResumesToday || 0}
                          </div>
                        </div>
                      </div>
                      <div className="admin-metric-block">
                        <div className="admin-metric-row">
                          <div>
                            <div className="admin-metric-label">Active Users (30 days)</div>
                            <div className="admin-metric-desc">Users active in the last 30 days</div>
                          </div>
                          <div className="admin-metric-value admin-metric-value-cyan">
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
          <div className="admin-main-grid">
            {/* Left: Template Usage Cards */}
            <div className="admin-side-cards">
              <div className="admin-card">
                <h2 className="admin-card-title">
                  Top Template Usage
                </h2>

                {dataLoading ? (
                  <div className="admin-empty" style={{ padding: "20px" }}>
                    Loading...
                  </div>
                ) : templateData.length === 0 ? (
                  <div className="admin-empty" style={{ padding: "20px" }}>
                    No template usage data
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {templateData.slice(0, 6).map((template, idx) => (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                        <div className="admin-progress-wrap">
                          <div
                            className="admin-progress-bar"
                            style={{
                              width: `${((template.uses || 0) / maxUses) * 100}%`,
                              background: `linear-gradient(90deg, ${template.color || THEME.primary}, ${(template.color || THEME.primary) + "dd"})`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="admin-card">
                <h3 className="admin-card-title">
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
            <div className="admin-card" style={{ display: "flex", flexDirection: "column" }}>
              <h2 className="admin-section-title" style={{ marginBottom: "24px" }}>
                Template Usage Chart
              </h2>
              {dataLoading ? (
                <div className="admin-empty" style={{ flex: 1, minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  Loading chart data...
                </div>
              ) : templateData.length === 0 ? (
                <div className="admin-empty" style={{ flex: 1, minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  No template usage data available
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
                  <TemplateUsageChart templateData={templateData} />
                </div>
              )}
            </div>
          </div>

          {/* Additional Stats Grid */}
          <div className="admin-extra-grid">
            {/* User Status */}
            <div className="admin-card">
              <h3 className="admin-card-title" style={{ fontSize: "16px" }}>
                User Status
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: THEME.textMuted }}>Email Verified</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: THEME.success }}>
                      {stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="admin-progress-wrap">
                    <div
                      className="admin-progress-bar"
                      style={{
                        width: `${stats.totalUsers > 0 ? (stats.verifiedUsers / stats.totalUsers) * 100 : 0}%`,
                        background: THEME.success,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: THEME.textMuted }}>Premium Users</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: THEME.warning }}>
                      {stats.totalUsers > 0 ? Math.round(((stats.premiumUsers || 0) / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="admin-progress-wrap">
                    <div
                      className="admin-progress-bar"
                      style={{
                        width: `${stats.totalUsers > 0 ? ((stats.premiumUsers || 0) / stats.totalUsers) * 100 : 0}%`,
                        background: THEME.warning,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Health */}
            <div className="admin-health-card">
              <h3>Platform Health</h3>
              <div className="admin-health-row">
                <span>System Status</span>
                <span>● Operational</span>
              </div>
              <div className="admin-health-row">
                <span>Total Templates</span>
                <span>{templateUsage.length}</span>
              </div>
              <div className="admin-health-row">
                <span>Active Users</span>
                <span>{stats.activeUsers || 0}</span>
              </div>
            </div>
          </div>

          {/* Users Management Section */}
          <div className="admin-users-section">
            <h2>Users Management</h2>

            {dataLoading ? (
              <div className="admin-empty">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="admin-empty">
                No users found
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Plan</th>
                      <th>Joined</th>
                      <th className="admin-actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id || u.id}>
                        <td>{u.name || "N/A"}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={u.role === "admin" ? "admin-badge admin-badge-admin" : "admin-badge admin-badge-user"}>
                            {u.role || "user"}
                          </span>
                        </td>
                        <td>
                          <span className={u.isVerified ? "admin-badge admin-badge-verified" : "admin-badge admin-badge-unverified"}>
                            {u.isVerified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                        <td>
                          <span className={u.plan === "premium" || u.plan === "professional" ? "admin-badge admin-badge-premium" : "admin-badge admin-badge-inactive"}>
                            {u.plan || "free"}
                          </span>
                        </td>
                        <td style={{ color: THEME.textMuted, fontSize: "13px" }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="admin-actions-cell">
                          {(() => {
                            const currentUserId = user?._id || user?.id;
                            const userId = u._id || u.id;
                            const isCurrentUser = currentUserId && userId && currentUserId.toString() === userId.toString();
                            
                            if (isCurrentUser) {
                              return (
                                <span className="admin-no-self">
                                  Cannot delete yourself
                                </span>
                              );
                            }
                            
                            return (
                              <div className="admin-actions-group">
                                {(u.stripeSubscriptionId ||
                                  u.plan === "premium" ||
                                  u.plan === "professional" ||
                                  u.subscriptionStatus === "active" ||
                                  u.subscriptionStatus === "trialing") && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEndUserSubscription(
                                        userId,
                                        u.name || u.email,
                                        u.plan
                                      )
                                    }
                                    disabled={endingSubscriptionUserId === userId}
                                    className="admin-btn admin-btn-end-subscription"
                                    title="Cancel this user's active subscription"
                                  >
                                    <Stack size={14} />
                                    {endingSubscriptionUserId === userId ? "Ending..." : "End Subscription"}
                                  </button>
                                )}
                                {u.role !== "admin" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateUserRole(userId, "admin", u.name || u.email)}
                                    disabled={updatingRoleUserId === userId}
                                    className="admin-btn admin-btn-make-admin"
                                    title="Grant this user admin access"
                                  >
                                    <ShieldCheck size={14} />
                                    {updatingRoleUserId === userId ? "Updating..." : "Make Admin"}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateUserRole(userId, "user", u.name || u.email)}
                                    disabled={updatingRoleUserId === userId}
                                    className="admin-btn admin-btn-revoke-admin"
                                    title="Revoke admin access"
                                  >
                                    <ShieldCheck size={14} />
                                    {updatingRoleUserId === userId ? "Updating..." : "Revoke Admin"}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(userId, u.name || u.email, false)}
                                  disabled={deletingUserId === userId}
                                  className="admin-btn admin-btn-danger"
                                  title="Soft delete - User data retained for 30 days"
                                >
                                  <Trash size={14} />
                                  {deletingUserId === userId ? "Deleting..." : "Delete"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleHardDeleteWithConfirm(userId, u.name || u.email)}
                                  disabled={deletingUserId === userId}
                                  className="admin-btn admin-btn-hard"
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
