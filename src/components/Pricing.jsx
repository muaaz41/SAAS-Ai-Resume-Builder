import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import priceMan from "../assets/price_man.png";
import check from "../assets/check.png";
import "../css/Pricing.css";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { showToast } from "../lib/toast";

const Pricing = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // 'checkout', 'update', 'cancel', 'syncing'
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [pendingPlanSelection, setPendingPlanSelection] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("pendingPlan");
    } catch {
      return null;
    }
  });
  const [activatingPlan, setActivatingPlan] = useState(null);

  // Price IDs from Stripe
  // IMPORTANT: Set these in your .env file or they will use placeholder values
  // See STRIPE_SETUP.md in the backend for detailed setup instructions
  const PRICE_IDS = {
    professional: import.meta.env.VITE_STRIPE_PRICE_ID_PROFESSIONAL || null, // Will show error if not configured
    premium: import.meta.env.VITE_STRIPE_PRICE_ID_PREMIUM || null, // Will show error if not configured
  };

  // Check if Stripe is properly configured
  const isStripeConfigured = PRICE_IDS.professional && PRICE_IDS.premium;

  useEffect(() => {
    // Fetch subscription status if user is logged in
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  // Check for payment success and refresh data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const sessionId = urlParams.get("session_id");

    if (success === "true" && sessionId) {
      showToast("Payment successful! Activating your subscription...", {
        type: "success",
        duration: 5000,
      });

      // Clean up URL
      window.history.replaceState({}, "", "/pricing");

      try {
        const storedPlan = localStorage.getItem("pendingPlan");
        if (storedPlan) {
          setPendingPlanSelection(storedPlan);
          setActivatingPlan(storedPlan);
        }
      } catch {}

      // Refresh user data and subscription status
      if (user) {
        setLoadingAction("syncing");
        // Try to sync subscription immediately, then retry a few times
        const syncSubscription = async (attempt = 1) => {
          try {
            // Try to sync from Stripe
            await api.post("/api/v1/billing/sync");
            await refreshUser();
            await fetchSubscriptionStatus();

            // Check if subscription is now active
            const statusResponse = await api.get(
              "/api/v1/billing/subscription"
            );
            const status = statusResponse.data?.data;

            if (status?.hasActiveSubscription && status?.plan !== "free") {
              if (pendingPlanSelection && status.plan === pendingPlanSelection) {
                try {
                  localStorage.removeItem("pendingPlan");
                } catch {}
                setPendingPlanSelection(null);
                setActivatingPlan(null);
              }
              setLoadingAction(null);
              showToast(
                `Subscription activated! You now have ${status.plan} plan access.`,
                { type: "success", duration: 5000 }
              );
              
              // Check if user was redirected from builder and restore their resume
              const postUpgradeResumeId = localStorage.getItem("postUpgradeResumeId");
              if (postUpgradeResumeId) {
                localStorage.removeItem("postUpgradeResumeId");
                setTimeout(() => {
                  navigate("/builder", {
                    state: { resumeId: postUpgradeResumeId },
                  });
                }, 1500);
                return;
              }
            } else if (attempt < 5) {
              // Retry after delay if not active yet
              setTimeout(() => syncSubscription(attempt + 1), 2000);
            } else {
              setLoadingAction(null);
              showToast(
                "Payment successful! Your subscription should be active shortly. If issues persist, please refresh the page.",
                { type: "info", duration: 5000 }
              );
            }
          } catch (err) {
            console.error("Sync error:", err);
            if (attempt < 5) {
              // Retry after delay
              setTimeout(() => syncSubscription(attempt + 1), 2000);
            } else {
              setLoadingAction(null);
              // Final fallback - just refresh
              await refreshUser();
              await fetchSubscriptionStatus();
            }
          }
        };

        // Start syncing after a short delay for webhook to process
        setTimeout(() => syncSubscription(), 2000);
      }
    } else if (urlParams.get("canceled") === "true") {
      try {
        localStorage.removeItem("pendingPlan");
      } catch {}
      setPendingPlanSelection(null);
      setActivatingPlan(null);
      showToast("Payment was canceled.", {
        type: "error",
        duration: 3000,
      });
      window.history.replaceState({}, "", "/pricing");
    }
  }, [user, refreshUser]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get("/api/v1/billing/subscription");
      setSubscriptionStatus(response.data?.data);
    } catch (err) {
      console.error("Failed to fetch subscription status:", err);
    }
  };

  useEffect(() => {
    if (
      pendingPlanSelection &&
      subscriptionStatus?.hasActiveSubscription &&
      subscriptionStatus?.plan === pendingPlanSelection
    ) {
      try {
        localStorage.removeItem("pendingPlan");
      } catch {}
      setPendingPlanSelection(null);
      setActivatingPlan(null);
    }
  }, [pendingPlanSelection, subscriptionStatus]);

  const handleCheckout = async (planType) => {
    // Prevent multiple clicks
    if (loading || loadingAction) {
      return;
    }

    if (!user) {
      navigate("/signin?redirect=/pricing");
      return;
    }

    if (!isStripeConfigured) {
      showToast("Payment system is not configured. Please contact support.", {
        type: "error",
      });
      return;
    }

    // If user has active subscription, offer to update instead
    if (
      subscriptionStatus?.hasActiveSubscription &&
      subscriptionStatus?.plan !== planType
    ) {
      const confirmed = window.confirm(
        `You currently have a ${subscriptionStatus.plan} plan. Do you want to change to ${planType}? You'll be charged the prorated difference.`
      );
      if (confirmed) {
        handleUpdatePlan(planType);
        return;
      }
      return;
    }

    setLoading(true);
    setLoadingAction("checkout");
    showToast("Preparing checkout...", { type: "info", duration: 2000 });

    try {
      const priceId = PRICE_IDS[planType];
      if (!priceId) {
        showToast(`Price ID for ${planType} plan is not configured.`, {
          type: "error",
        });
        setLoading(false);
        setLoadingAction(null);
        return;
      }

      showToast("Creating checkout session...", {
        type: "info",
        duration: 2000,
      });
      const response = await api.post("/api/v1/billing/checkout", { priceId });
      const checkoutUrl = response.data?.data?.url;

      if (checkoutUrl) {
        try {
          localStorage.setItem("pendingPlan", planType);
        } catch {}
        setPendingPlanSelection(planType);
        showToast("Redirecting to payment...", {
          type: "success",
          duration: 1000,
        });
        // Small delay to show message before redirect
        setTimeout(() => {
          window.location.href = checkoutUrl;
        }, 500);
      } else {
        setLoading(false);
        setLoadingAction(null);
        showToast("Failed to create checkout session. Please try again.", {
          type: "error",
        });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setLoading(false);
      setLoadingAction(null);

      let errorMessage = "Failed to start checkout. Please try again.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      showToast(errorMessage, { type: "error" });
    }
    // Note: Don't set loading to false here if redirecting, let it stay true
  };

  const handleUpdatePlan = async (newPlanType) => {
    // Prevent multiple clicks
    if (loading || loadingAction) {
      return;
    }

    if (!user || !subscriptionStatus?.hasActiveSubscription) {
      showToast("No active subscription found.", { type: "error" });
      return;
    }

    if (subscriptionStatus.plan === newPlanType) {
      showToast("You are already on this plan.", { type: "info" });
      return;
    }

    setLoading(true);
    setLoadingAction("update");
    showToast("Updating your subscription...", {
      type: "success",
      duration: 3000,
    });

    try {
      const priceId = PRICE_IDS[newPlanType];
      if (!priceId) {
        showToast(`Price ID for ${newPlanType} plan is not configured.`, {
          type: "error",
        });
        setLoading(false);
        setLoadingAction(null);
        return;
      }

      await api.put("/api/v1/billing/subscription", { priceId });
      showToast(
        `Successfully updated to ${newPlanType} plan! Changes take effect immediately.`,
        { type: "success", duration: 5000 }
      );

      // Refresh subscription status
      await refreshUser();
      await fetchSubscriptionStatus();
    } catch (err) {
      console.error("Update plan error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update subscription. Please try again.";
      showToast(errorMessage, { type: "error" });
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const handleCancelSubscription = async () => {
    // Prevent multiple clicks
    if (loading || loadingAction) {
      return;
    }

    if (!user || !subscriptionStatus?.hasActiveSubscription) {
      showToast("No active subscription found.", { type: "error" });
      return;
    }

    // Get period end date, with fallback if invalid
    let periodEndText = "the end of your billing period";
    if (subscriptionStatus.currentPeriodEnd) {
      try {
        const periodEnd = new Date(subscriptionStatus.currentPeriodEnd);
        // Check if date is valid (not epoch time)
        if (!isNaN(periodEnd.getTime()) && periodEnd.getTime() > 0) {
          periodEndText = periodEnd.toLocaleDateString();
        }
      } catch (e) {
        console.error("Invalid period end date:", e);
      }
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel your ${subscriptionStatus.plan} subscription? You will retain access until ${periodEndText}, after which you'll be downgraded to the free plan.`
    );

    if (!confirmed) return;

    setLoading(true);
    setLoadingAction("cancel");
    showToast("Canceling subscription...", { type: "info", duration: 3000 });

    try {
      await api.post("/api/v1/billing/cancel");
      showToast(
        "Subscription canceled successfully. You'll retain access until the end of your billing period.",
        { type: "success", duration: 5000 }
      );

      // Refresh subscription status
      await refreshUser();
      await fetchSubscriptionStatus();
    } catch (err) {
      console.error("Cancel subscription error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to cancel subscription. Please try again.";
      showToast(errorMessage, { type: "error" });
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const isPlanActive = (planName) => {
    if (!subscriptionStatus) return false;
    return (
      subscriptionStatus.plan === planName &&
      subscriptionStatus.hasActiveSubscription
    );
  };

  const getCurrentPlan = () => {
    if (!subscriptionStatus) return null;
    if (subscriptionStatus.hasActiveSubscription) {
      return subscriptionStatus.plan;
    }
    return "free";
  };

  const currentPlan = getCurrentPlan();

  const formatPlanName = (plan) =>
    plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "";

  const renderPlanBadge = (planName) => {
    if (isPlanActive(planName)) {
      return "✓ Your Current Plan";
    }
    if (activatingPlan === planName) {
      return "Payment successful — activating this plan…";
    }
    if (pendingPlanSelection === planName && loadingAction === "checkout") {
      return "Redirecting to checkout…";
    }
    return "";
  };

  const isLoading = loading || loadingAction !== null;

  return (
    <main className="pricing">
      <Navbar />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            color: "white",
          }}>
          <div
            style={{
              background: "white",
              padding: "30px 40px",
              borderRadius: "12px",
              textAlign: "center",
              color: "#333",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #667eea",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <div
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "8px",
              }}>
              {loadingAction === "checkout"
                ? "Preparing Checkout..."
                : loadingAction === "update"
                ? "Updating Subscription..."
                : loadingAction === "cancel"
                ? "Canceling Subscription..."
                : loadingAction === "syncing"
                ? "Activating Subscription..."
                : "Processing..."}
            </div>
            <div style={{ fontSize: "14px", color: "#666" }}>
              {loadingAction === "checkout"
                ? "Please wait, redirecting to payment..."
                : loadingAction === "update"
                ? "Updating your plan, this may take a moment..."
                : loadingAction === "cancel"
                ? "Processing cancellation..."
                : loadingAction === "syncing"
                ? "Syncing your subscription status..."
                : "Please don't close this window"}
            </div>
          </div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      {activatingPlan && (
        <div
          style={{
            background: "#ecfccb",
            border: "1px solid #bef264",
            color: "#365314",
            padding: "16px",
            margin: "0 auto 16px",
            borderRadius: "8px",
            maxWidth: "1200px",
          }}>
          <strong>
            Payment confirmed! Activating your {formatPlanName(activatingPlan)}{" "}
            plan.
          </strong>
          <div style={{ fontSize: "14px", marginTop: 4 }}>
            This usually takes a few seconds. We’ll refresh your access
            automatically.
          </div>
        </div>
      )}

      {/* Current Plan Banner with Management */}
      {/* {user && subscriptionStatus && currentPlan && currentPlan !== "free" && (
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "20px",
            marginBottom: "20px",
            borderRadius: "8px",
            maxWidth: "1200px",
            margin: "0 auto 20px",
          }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}>
            <div>
              <strong style={{ fontSize: "18px", display: "block" }}>
                Your Current Plan: {formatPlanName(currentPlan)}
              </strong>
              {(() => {
                // Safely format period end date
                if (subscriptionStatus.currentPeriodEnd) {
                  try {
                    const periodEnd = new Date(
                      subscriptionStatus.currentPeriodEnd
                    );
                    // Check if date is valid (not epoch time)
                    if (
                      !isNaN(periodEnd.getTime()) &&
                      periodEnd.getTime() > 0
                    ) {
                      return (
                        <div
                          style={{
                            fontSize: "14px",
                            marginTop: "4px",
                            opacity: 0.9,
                          }}>
                          Active until {periodEnd.toLocaleDateString()}
                        </div>
                      );
                    }
                  } catch (e) {
                    console.error("Invalid period end date:", e);
                  }
                }
                return null;
              })()}
              {subscriptionStatus.subscriptionStatus === "canceled" &&
                (() => {
                  // Safely format period end date for canceled subscription
                  if (subscriptionStatus.currentPeriodEnd) {
                    try {
                      const periodEnd = new Date(
                        subscriptionStatus.currentPeriodEnd
                      );
                      if (
                        !isNaN(periodEnd.getTime()) &&
                        periodEnd.getTime() > 0
                      ) {
                        return (
                          <div
                            style={{
                              fontSize: "12px",
                              marginTop: "4px",
                              color: "#fef2f2",
                              fontWeight: 600,
                            }}>
                            ⚠️ Subscription will end on{" "}
                            {periodEnd.toLocaleDateString()}
                          </div>
                        );
                      }
                    } catch (e) {
                      console.error("Invalid period end date:", e);
                    }
                  }
                  return (
                    <div
                      style={{
                        fontSize: "12px",
                        marginTop: "4px",
                        color: "#fef2f2",
                        fontWeight: 600,
                      }}>
                      ⚠️ Subscription will end at the end of your billing period
                    </div>
                  );
                })()}
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}>
              {subscriptionStatus.subscriptionStatus !== "canceled" && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isLoading}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity: isLoading ? 0.6 : 1,
                  }}>
                  {isLoading && loadingAction === "cancel"
                    ? "Canceling..."
                    : isLoading
                    ? "Processing..."
                    : "Cancel Subscription"}
                </button>
              )}
            </div>
          </div>
        </div>
      )} */}

      {/* Hero */}
      <section className="pricing-hero">
        <div className="ph-left">
          <h1 className="ph-title">Build Your Future with the Right Plan</h1>
          <p className="ph-subtitle">
            Create standout resumes, customize designs, and unlock powerful
            tools and choose the plan that fits your journey.
          </p>
          <div className="arc-line" />
          <div className="ph-cta">
            <button className="btn-primary">Get Started</button>
            <a className="btn-secondary" href="#plans">
              See Plans
            </a>
          </div>
          <div className="stats-box">
            <div className="stat">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Online Support</div>
            </div>
            <div className="stat">
              <div className="stat-value">100+</div>
              <div className="stat-label">Professional Templates</div>
            </div>
            <div className="stat">
              <div className="stat-value">1K+</div>
              <div className="stat-label">Successful Job Seekers</div>
            </div>
          </div>
        </div>
        <div className="ph-right">
          <div className="ring">
            <img src={priceMan} alt="Happy customer" className="pm-img" />
            {/* <div className="badge">★ Crafted with Job Market Insights</div>
            <div className="rating-card">
              <div className="rc-count"><span>2400+</span></div>
              <div className="rc-text">Happy Customers</div>
              <div className="rc-stars">★★★★★ <span>(4.7 Stars)</span></div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Stats band removed; merged into left hero */}

      {/* Plans */}
      <section id="plans" className="plans">
        <h2 className="plans-title">Choose Your Plan</h2>
        <p className="plans-sub">
          Select the plan that best fits your needs. You can upgrade or
          downgrade at any time.
        </p>
        <div className="plans-line" />

        <div className="plan-grid">
          <div className="plan-card">
            <div className="plan-head">Free</div>
            <div className="plan-desc">
              Create and share professional resumes with essential tools to get
              started.
            </div>
            <div className="price">$ 0</div>
            <div className="per">Per User/ month, Billed Yearly.</div>
            <button
              className="btn-outline full"
              onClick={() => navigate("/signup")}>
              Start free trial
            </button>
            <div className="feat-title">What You'll Get</div>
            <ul className="feat-list">
              <li>
                <img src={check} alt="check" className="check-icon" />
                Multiple resume templates
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Version history & easy edits
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Built-in hosting & shareable link
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Bulk Status Changes
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Bulk resume exports (PDF/Word)
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Limited private projects
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Custom embeds
              </li>
            </ul>
          </div>

          <div className="plan-card popular">
            <div className="ribbon">Most Popular</div>
            <div className="plan-head">Premium</div>
            <div className="plan-desc">
              Perfect for professionals who want to stand out with tailored
              resumes and advanced features.
            </div>
            <div className="price">$ 32.99</div>
            <div className="per">Per User/ month, Billed Yearly.</div>
            {renderPlanBadge("premium") && (
              <div
                style={{
                  fontSize: "12px",
                  color:
                    activatingPlan === "premium" ? "#b45309" : "#059669",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}>
                {renderPlanBadge("premium")}
              </div>
            )}
            <button
              className="btn-primary full"
              onClick={() => {
                if (
                  subscriptionStatus?.hasActiveSubscription &&
                  subscriptionStatus?.plan !== "premium"
                ) {
                  handleUpdatePlan("premium");
                } else {
                  handleCheckout("premium");
                }
              }}
              disabled={
                isLoading || isPlanActive("premium") || !isStripeConfigured
              }
              style={{
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}>
              {isLoading && loadingAction === "checkout"
                ? "Preparing..."
                : isLoading && loadingAction === "update"
                ? "Updating..."
                : isLoading
                ? "Processing..."
                : isPlanActive("premium")
                ? "Current Plan"
                : subscriptionStatus?.hasActiveSubscription &&
                  subscriptionStatus?.plan === "professional"
                ? "Upgrade to Premium"
                : subscriptionStatus?.hasActiveSubscription &&
                  subscriptionStatus?.plan !== "premium"
                ? "Switch to Premium"
                : !isStripeConfigured
                ? "Not Configured"
                : "Get Started"}
            </button>
            {isPlanActive("premium") && (
              <button
                className="btn-outline full"
                onClick={handleCancelSubscription}
                disabled={isLoading}
                style={{
                  marginTop: 8,
                  opacity:
                    isLoading && loadingAction === "cancel"
                      ? 0.7
                      : isLoading
                      ? 0.6
                      : 1,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}>
                {isLoading && loadingAction === "cancel"
                  ? "Canceling..."
                  : "Cancel Subscription"}
              </button>
            )}
            <div className="feat-title">What You'll Get</div>
            <ul className="feat-list">
              <li>
                <img src={check} alt="check" className="check-icon" />
                Multiple resume templates
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Advanced resume templates & layouts
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Unlimited downloads (PDF/Word)
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Priority customer support
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Team collaboration & shared workspace
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Version history & bulk resume exports
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Secure cloud hosting & shareable links
              </li>
            </ul>
          </div>

          <div className="plan-card">
            <div className="plan-head">Professional</div>
            <div className="plan-desc">
              For job seekers and career builders who need powerful tools to
              create standout resumes.
            </div>
            <div className="price">$ 22.99</div>
            <div className="per">Per User/ month, Billed Yearly.</div>
            {renderPlanBadge("professional") && (
              <div
                style={{
                  fontSize: "12px",
                  color:
                    activatingPlan === "professional" ? "#b45309" : "#059669",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}>
                {renderPlanBadge("professional")}
              </div>
            )}
            <button
              className="btn-outline full"
              onClick={() => {
                if (
                  subscriptionStatus?.hasActiveSubscription &&
                  subscriptionStatus?.plan !== "professional"
                ) {
                  handleUpdatePlan("professional");
                } else {
                  handleCheckout("professional");
                }
              }}
              disabled={
                isLoading || isPlanActive("professional") || !isStripeConfigured
              }
              style={{
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}>
              {isLoading && loadingAction === "checkout"
                ? "Preparing..."
                : isLoading && loadingAction === "update"
                ? "Updating..."
                : isLoading
                ? "Processing..."
                : isPlanActive("professional")
                ? "Current Plan"
                : subscriptionStatus?.hasActiveSubscription &&
                  subscriptionStatus?.plan === "premium"
                ? "Downgrade to Professional"
                : subscriptionStatus?.hasActiveSubscription &&
                  subscriptionStatus?.plan !== "professional"
                ? "Switch to Professional"
                : !isStripeConfigured
                ? "Not Configured"
                : "Get Started"}
            </button>
            {isPlanActive("professional") && (
              <button
                className="btn-outline full"
                onClick={handleCancelSubscription}
                disabled={isLoading}
                style={{
                  marginTop: 8,
                  opacity:
                    isLoading && loadingAction === "cancel"
                      ? 0.7
                      : isLoading
                      ? 0.6
                      : 1,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}>
                {isLoading && loadingAction === "cancel"
                  ? "Canceling..."
                  : "Cancel Subscription"}
              </button>
            )}
            <div className="feat-title">What You'll Get</div>
            <ul className="feat-list">
              <li>
                <img src={check} alt="check" className="check-icon" />
                Multiple resume templates
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Unlimited downloads (PDF/Word)
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                AI-powered resume assistance
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Built-in hosting & shareable links
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Private workspace with secure storage
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Version history & easy edits
              </li>
              <li>
                <img src={check} alt="check" className="check-icon" />
                Priority email support
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Pricing;
