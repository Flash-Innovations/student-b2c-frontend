import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Crown,
  Sparkles,
  Zap,
  Clock,
  Coins,
  Flame,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Building2,
  BookOpen,
  Award,
  RotateCcw,
  ShoppingBag,
  CreditCard,
  Layers,
  FileText,
  Calendar,
  Info,
  AlertTriangle,
  X,
  ChevronRight,
  Gift,
  Tag,
  Percent,
  Check,
  Lock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { b2cApi } from "../services/b2cApi";
import { openRazorpayCheckout } from "../services/razorpayClient";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge, PlanBadge } from "../components/common/Badge";
import { cn } from "../utils/cn";

const POPULAR_COMPANIES = [
  "TCS NQT",
  "Infosys",
  "Accenture",
  "Amazon",
  "Wipro",
  "Cognizant",
  "Capgemini",
  "Deloitte",
  "Microsoft",
  "Google"
];

const SINGLE_SUBJECTS = [
  { id: "OPERATING_SYSTEMS", name: "Operating Systems (OS)" },
  { id: "DATABASE_MANAGEMENT_SYSTEMS", name: "DBMS & SQL" },
  { id: "COMPUTER_NETWORKS", name: "Computer Networks (CN)" },
  { id: "OBJECT_ORIENTED_PROGRAMMING", name: "OOPs Concepts & Java" },
  { id: "DATA_STRUCTURES_AND_ALGORITHMS", name: "DSA Fundamentals" }
];

export function FlashStorePage() {
  const { user, subscription, planTier, refreshSubscription } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'SUBSCRIPTIONS' | 'PASSES' | 'COMPANIES' | 'MINUTES' | 'XP_ARCADE'
  const initialTab = searchParams.get("tab") || "SUBSCRIPTIONS";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [selectedCompany, setSelectedCompany] = useState("TCS NQT");
  const [selectedSubject, setSelectedSubject] = useState("OPERATING_SYSTEMS");
  const [companyPassCycle, setCompanyPassCycle] = useState("MONTHLY");

  const [processingItem, setProcessingItem] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingAutoPay, setCancellingAutoPay] = useState(false);

  // Dynamic Catalog State (Admin Configured Items & Festive Offers)
  const [catalogData, setCatalogData] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Checkout & Coupon Modal State
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Fetch dynamic plans and festive offers from backend
  useEffect(() => {
    let mounted = true;
    const fetchCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const res = await b2cApi.getPlans();
        if (mounted && res) {
          setCatalogData(res.catalog || res);
        }
      } catch (err) {
        console.warn("Could not load dynamic store catalog:", err);
      } finally {
        if (mounted) {
          setLoadingCatalog(false);
        }
      }
    };
    fetchCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const openCheckoutModal = (itemDetails) => {
    setCheckoutItem(itemDetails);
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const closeCheckoutModal = () => {
    if (isCheckingOut) return;
    setCheckoutItem(null);
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Check if an item is published or hidden by SuperAdmin
  const isItemPublished = (code) => {
    if (!catalogData) return true;
    const clean = (code || '').toUpperCase().trim();
    const rawHidden = catalogData.hiddenItemIds || catalogData.hidden || [];
    const hidden = rawHidden.map((x) => String(x || '').toUpperCase().trim());

    if (hidden.includes(clean)) return false;
    if (hidden.includes(`PASS_${clean}`)) return false;
    if (hidden.includes(`PLAN_${clean}`)) return false;
    if (hidden.includes(`PACK_${clean}`)) return false;

    const stripped = clean.replace(/^(PASS_|PLAN_|PACK_)/, '');
    if (hidden.includes(stripped)) return false;

    return true;
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    if (!checkoutItem) return;

    try {
      setValidatingCoupon(true);
      setCouponError(null);
      const res = await b2cApi.validateCoupon({
        couponCode: couponInput.trim().toUpperCase(),
        orderAmount: checkoutItem.priceInr,
        orderType: checkoutItem.orderType,
        itemCategory: checkoutItem.category || checkoutItem.orderType
      });

      if (res && res.valid) {
        setAppliedCoupon({
          code: res.coupon.code,
          discountType: res.coupon.discountType,
          discountValue: res.coupon.discountValue,
          discountAmount: res.discountAmount,
          finalAmount: res.finalAmount,
          message: res.message
        });
        showSuccess(`Coupon ${res.coupon.code} applied! Saved ₹${res.discountAmount}`);
      } else {
        setCouponError((res && res.message) || "Invalid coupon code");
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(err.message || "Failed to validate coupon");
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const handleExecuteCheckout = async () => {
    if (!checkoutItem) return;
    try {
      setIsCheckingOut(true);
      const activeCoupon = appliedCoupon ? appliedCoupon.code : undefined;

      let orderPayload = {
        orderType: checkoutItem.orderType,
        couponCode: activeCoupon
      };

      if (checkoutItem.orderType === "PLAN") {
        orderPayload.planTier = checkoutItem.planTier;
        orderPayload.billingCycle = checkoutItem.billingCycle || "MONTHLY";
      } else if (checkoutItem.orderType === "PASS") {
        orderPayload.passType = checkoutItem.passType;
        orderPayload.entityId = checkoutItem.entityId || null;
        orderPayload.billingCycle = checkoutItem.billingCycle || "MONTHLY";
      } else if (checkoutItem.orderType === "MINUTES_PACK") {
        orderPayload.packId = checkoutItem.packId;
      } else if (checkoutItem.orderType === "CUSTOM_OFFER") {
        orderPayload.slug = checkoutItem.slug;
      }

      const orderData = await b2cApi.createOrder(orderPayload);

      if (!orderData || (!orderData.subscriptionId && !orderData.orderId && !orderData.order_id)) {
        throw new Error("Unable to create checkout order with payment gateway.");
      }

      const activeSubId = orderData.subscriptionId || orderData.subscription_id;
      const activeOrderId = orderData.orderId || orderData.order_id;

      openRazorpayCheckout({
        subscriptionId: activeSubId,
        orderId: activeOrderId,
        amountInPaise: orderData.amount || orderData.amountInPaise,
        amount: orderData.breakdown?.totalAmount || orderData.totalAmountWithGst,
        currency: orderData.currency || "INR",
        name: "Flash Store",
        description: `${checkoutItem.title} (All-Inclusive)`,
        keyId: orderData.keyId || orderData.key_id,
        user: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone
        },
        onSuccess: async (paymentResponse) => {
          try {
            await b2cApi.verifyPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id || activeOrderId,
              razorpay_subscription_id: paymentResponse.razorpay_subscription_id || activeSubId,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });

            showSuccess(`Success! ${checkoutItem.title} is now activated on your account.`);
            setCheckoutItem(null);
            await refreshSubscription();
          } catch (verifyErr) {
            showError("Payment received, but activation confirmation failed. Please contact support.");
          }
        },
        onFailure: (err) => {
          showError(err.message || "Payment cancelled.");
        }
      });
    } catch (err) {
      showError(err.message || "Failed to initiate payment checkout.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // XP Arcade & Ledger State
  const [xpLedger, setXpLedger] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [redeemingXp, setRedeemingXp] = useState(null);
  const [repairingStreak, setRepairingStreak] = useState(false);

  // Keep search params in sync with tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch XP Ledger when XP Arcade tab is active
  useEffect(() => {
    if (activeTab === "XP_ARCADE") {
      fetchXpLedger();
    }
  }, [activeTab]);

  const fetchXpLedger = async () => {
    try {
      setLoadingLedger(true);
      const res = await b2cApi.getXpLedger();
      if (res && res.ledger) {
        setXpLedger(res.ledger);
      }
    } catch (err) {
      console.warn("Could not load XP ledger:", err);
    } finally {
      setLoadingLedger(false);
    }
  };

  // 1. Subscribe to Recurring Plan
  const handleSubscribePlan = async (tier) => {
    if (tier === "FREE") {
      showInfo("You are already on the Free tier.");
      return;
    }

    try {
      setProcessingItem(`PLAN_${tier}`);

      const orderData = await b2cApi.createOrder({
        orderType: "PLAN",
        planTier: tier,
        billingCycle
      });

      if (!orderData || (!orderData.subscriptionId && !orderData.orderId && !orderData.order_id)) {
        throw new Error("Unable to create AutoPay subscription with Razorpay.");
      }

      const activeSubId = orderData.subscriptionId || orderData.subscription_id;
      const activeOrderId = orderData.orderId || orderData.order_id;

      openRazorpayCheckout({
        subscriptionId: activeSubId,
        orderId: activeOrderId,
        amountInPaise: orderData.amount || orderData.amountInPaise,
        amount: orderData.breakdown?.totalAmount || orderData.totalAmountWithGst,
        currency: orderData.currency || "INR",
        name: "Flash Platform",
        description: `Flash ${tier} Plan (${billingCycle}, All-Inclusive)`,
        keyId: orderData.keyId || orderData.key_id,
        user: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone
        },
        onSuccess: async (paymentResponse) => {
          try {
            await b2cApi.verifyPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_subscription_id: paymentResponse.razorpay_subscription_id || activeSubId,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });

            showSuccess(`Congratulations! Your ${tier} plan AutoPay mandate is now active.`);
            await refreshSubscription();
          } catch (verifyErr) {
            showError("Payment received, but mandate verification failed. Please contact support.");
          }
        },
        onFailure: (err) => {
          showError(err.message || "Payment cancelled or failed.");
        }
      });
    } catch (err) {
      showError(err.message || "Failed to initiate subscription checkout.");
    } finally {
      setProcessingItem(null);
    }
  };

  // 2. Purchase Modular Pass
  const handlePurchasePass = async (passType, entityId = null, cycle = "MONTHLY", passLabel = "Pass") => {
    try {
      setProcessingItem(`PASS_${passType}_${entityId || cycle}`);

      const orderData = await b2cApi.createOrder({
        orderType: "PASS",
        passType,
        entityId,
        billingCycle: cycle
      });

      if (!orderData || (!orderData.orderId && !orderData.order_id)) {
        throw new Error("Unable to initiate pass order.");
      }

      const activeOrderId = orderData.orderId || orderData.order_id;

      openRazorpayCheckout({
        orderId: activeOrderId,
        amountInPaise: orderData.amount || orderData.amountInPaise,
        amount: orderData.breakdown?.totalAmount || orderData.totalAmountWithGst,
        currency: orderData.currency || "INR",
        name: "Flash Store",
        description: `${passLabel} (${cycle}, All-Inclusive)`,
        keyId: orderData.keyId || orderData.key_id,
        user: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone
        },
        onSuccess: async (paymentResponse) => {
          try {
            await b2cApi.verifyPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id || activeOrderId,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });

            showSuccess(`Success! Your ${passLabel} has been activated.`);
            await refreshSubscription();
          } catch (verifyErr) {
            showError("Payment verified, but activation failed. Contact support.");
          }
        },
        onFailure: (err) => {
          showError(err.message || "Payment cancelled.");
        }
      });
    } catch (err) {
      showError(err.message || "Failed to purchase pass.");
    } finally {
      setProcessingItem(null);
    }
  };

  // 3. Purchase Interview Minutes Pack
  const handlePurchaseMinutes = async (packId, minutes, priceInr) => {
    try {
      setProcessingItem(`MINUTES_${packId}`);

      const orderData = await b2cApi.createOrder({
        orderType: "MINUTES_PACK",
        packId
      });

      if (!orderData || (!orderData.orderId && !orderData.order_id)) {
        throw new Error("Unable to create minutes pack order.");
      }

      const activeOrderId = orderData.orderId || orderData.order_id;

      openRazorpayCheckout({
        orderId: activeOrderId,
        amountInPaise: orderData.amount || orderData.amountInPaise,
        amount: orderData.breakdown?.totalAmount || orderData.totalAmountWithGst,
        currency: orderData.currency || "INR",
        name: "Flash Store",
        description: `${minutes} AI Mock Interview Minutes (All-Inclusive)`,
        keyId: orderData.keyId || orderData.key_id,
        user: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone
        },
        onSuccess: async (paymentResponse) => {
          try {
            await b2cApi.verifyPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id || activeOrderId,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });

            showSuccess(`Success! Added ${minutes} minutes to your interview wallet. These never expire.`);
            await refreshSubscription();
          } catch (verifyErr) {
            showError("Payment verified, but credit failed. Contact support.");
          }
        },
        onFailure: (err) => {
          showError(err.message || "Payment cancelled.");
        }
      });
    } catch (err) {
      showError(err.message || "Failed to purchase minutes pack.");
    } finally {
      setProcessingItem(null);
    }
  };

  // 4. XP Redemptions
  const handleRedeemInterviewXp = async () => {
    try {
      setRedeemingXp("INTERVIEW_30");
      const res = await b2cApi.redeemInterviewXp();
      showSuccess(res.message || "Successfully redeemed 1,000 XP for 30 mock interview minutes!");
      await refreshSubscription();
      await fetchXpLedger();
    } catch (err) {
      showError(err.message || "Failed to redeem XP.");
    } finally {
      setRedeemingXp(null);
    }
  };

  // 5. Streak Repair & Reset
  const handleRepairStreak = async () => {
    try {
      setRepairingStreak(true);
      const res = await b2cApi.repairStreak();
      showSuccess(res.message || "Streak repaired successfully!");
      await refreshSubscription();
      await fetchXpLedger();
    } catch (err) {
      showError(err.message || "Failed to repair streak.");
    } finally {
      setRepairingStreak(false);
    }
  };

  const handleResetStreak = async () => {
    try {
      setRepairingStreak(true);
      const res = await b2cApi.resetStreak();
      showInfo(res.message || "Streak reset to 0.");
      await refreshSubscription();
    } catch (err) {
      showError(err.message || "Failed to reset streak.");
    } finally {
      setRepairingStreak(false);
    }
  };

  // 6. Cancel AutoPay
  const handleCancelAutoPay = async () => {
    try {
      setCancellingAutoPay(true);
      const res = await b2cApi.cancelAutoPay();
      showSuccess(res.message || "AutoPay cancelled successfully.");
      setCancelModalOpen(false);
      await refreshSubscription();
    } catch (err) {
      showError(err.message || "Failed to cancel AutoPay.");
    } finally {
      setCancellingAutoPay(false);
    }
  };

  const currentXp = Math.max(0, subscription?.totalXp || 0);
  const totalAvailableMockMinutes = (subscription?.includedMinutesRemaining || 0) + (subscription?.purchasedMinutesBalance || 0);
  const currentStreak = subscription?.currentStreak || 0;
  const streakHealth = subscription?.streakHealth || {};

  const formattedEndDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Flash Store
              </h1>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                Purchase subscriptions, targeted subject passes, company assessment packs, AI mock interview minutes, and redeem earned XP.
              </p>
            </div>

            {/* Quick Wallet Summary Pill */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                <PlanBadge tier={subscription?.planTier || planTier} size="sm" />
              </div>
              <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                <Coins className="w-4 h-4 text-amber-500" />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">{currentXp.toLocaleString("en-IN")} XP</span>
                  <span className="text-slate-500 ml-1">Wallet</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">{totalAvailableMockMinutes} mins</span>
                  <span className="text-slate-500 ml-1">Mock Wallet</span>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Grace / Broken Banner (if active) */}
          {streakHealth.streakGraceActive && (
            <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Day 1 Streak Grace Active
                  </p>
                  <p className="text-xs text-amber-700">
                    You missed yesterday. Complete 1 MCQ session or 1 coding problem today to preserve your {currentStreak}-day streak without penalty.
                  </p>
                </div>
              </div>
              <Link to="/practice">
                <Button size="xs" variant="primary">
                  Practise Now
                </Button>
              </Link>
            </div>
          )}

          {streakHealth.streakBroken && (
            <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Practice Streak Broken
                  </p>
                  <p className="text-xs text-red-700">
                    Your {currentStreak}-day streak broke after missing consecutive days. Pay 5 XP to repair and resume, or reset to 0 for free.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="primary"
                  onClick={handleRepairStreak}
                  disabled={currentXp < 5 || repairingStreak}
                >
                  Repair Streak (5 XP)
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleResetStreak}
                  disabled={repairingStreak}
                >
                  Reset for Free
                </Button>
              </div>
            </div>
          )}

          {/* Active Passes Banner (if student has any active passes) */}
          {Array.isArray(subscription?.activePasses) && subscription.activePasses.length > 0 && (
            <div className="mt-6 p-4 rounded-lg bg-blue-50/70 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  Your Active Modular Passes
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {subscription.activePasses.map((pass, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded text-xs font-medium text-slate-800"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold">{pass.passName || pass.passType}</span>
                    {pass.entityId && <span className="text-slate-500">({pass.entityId})</span>}
                    <span className="text-[11px] text-slate-400">
                      • Expires {new Date(pass.expiresAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Active AutoPay Subscription Banner */}
          {subscription?.planTier !== "FREE" && subscription?.planTier && (
            <div className="mt-6 p-4 rounded-lg bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                    Active Membership
                  </span>
                  <span className="text-xs text-slate-400">
                    ({subscription?.billingCycle || "MONTHLY"})
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Flash {subscription?.planTier} Plan
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {subscription?.autoPayEnabled ? (
                    <>
                      AutoPay mandate active. Next renewal on{" "}
                      <span className="font-semibold text-white">{formattedEndDate || "period end"}</span>.
                    </>
                  ) : (
                    <>
                      Membership active until{" "}
                      <span className="font-semibold text-white">{formattedEndDate || "period end"}</span>. (No recurring renewal).
                    </>
                  )}
                </p>
              </div>

              {subscription?.autoPayEnabled && (
                <Button
                  size="xs"
                  variant="outline"
                  className="bg-transparent text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                  onClick={() => setCancelModalOpen(true)}
                >
                  Manage / Cancel AutoPay
                </Button>
              )}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="mt-8 border-b border-slate-200 flex overflow-x-auto space-x-6">
            <button
              onClick={() => handleTabChange("SUBSCRIPTIONS")}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === "SUBSCRIPTIONS"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Crown className="w-4 h-4" />
              Subscription Plans
            </button>

            <button
              onClick={() => handleTabChange("PASSES")}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === "PASSES"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-4 h-4" />
              Modular Passes
            </button>

            <button
              onClick={() => handleTabChange("COMPANIES")}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === "COMPANIES"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Company Placement Packs
            </button>

            <button
              onClick={() => handleTabChange("MINUTES")}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === "MINUTES"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-4 h-4" />
              AI Mock Minutes
            </button>

            <button
              onClick={() => handleTabChange("XP_ARCADE")}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === "XP_ARCADE"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Coins className="w-4 h-4 text-amber-500" />
              XP Redemption Arcade
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================================= */}
        {/* TAB 1: SUBSCRIPTIONS */}
        {/* ========================================================================= */}
        {activeTab === "SUBSCRIPTIONS" && (
          <div>
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setBillingCycle("MONTHLY")}
                  className={`px-5 py-2 text-xs font-semibold rounded-md transition-all ${
                    billingCycle === "MONTHLY"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("YEARLY")}
                  className={`px-5 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    billingCycle === "YEARLY"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Annual Billing
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Save ~16%
                  </span>
                </button>
              </div>
            </div>

            {/* Festive & Special Offers Section (Dynamic from SuperAdmin) */}
            {catalogData?.customOffers && catalogData.customOffers.length > 0 && (
              <div className="mb-8 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Festive & Limited-Time Flash Offers
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Special
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catalogData.customOffers.map((offer) => (
                    <div
                      key={offer.slug || offer.id}
                      className="p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl border border-blue-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-600 text-white">
                            {offer.badge || "Special Offer"}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 uppercase">
                            {offer.interval || "One-Time"}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{offer.title}</h4>
                        {offer.tagline && (
                          <p className="text-xs text-slate-600 mt-1">{offer.tagline}</p>
                        )}

                        <div className="flex items-baseline gap-2 my-3">
                          <span className="text-2xl font-extrabold text-slate-900">₹{offer.priceInr}</span>
                          {offer.originalPriceInr && offer.originalPriceInr > offer.priceInr && (
                            <span className="text-xs text-slate-400 line-through">₹{offer.originalPriceInr}</span>
                          )}
                          <span className="text-xs text-slate-500">all-inclusive</span>
                        </div>

                        {Array.isArray(offer.features) && offer.features.length > 0 && (
                          <ul className="space-y-1 text-xs text-slate-700 mb-4">
                            {offer.features.map((feat, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        onClick={() =>
                          openCheckoutModal({
                            orderType: "CUSTOM_OFFER",
                            slug: offer.slug,
                            title: offer.title,
                            description: offer.tagline,
                            priceInr: offer.priceInr,
                            originalPriceInr: offer.originalPriceInr,
                            badge: offer.badge || "Festive Offer"
                          })
                        }
                      >
                        Claim Offer & Checkout
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3 Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* FREE PLAN */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Free Plan
                    </span>
                    <Badge variant="neutral">Default</Badge>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">Rs 0</span>
                    <span className="text-xs text-slate-500">/ forever</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Essential entry-level placement practice with hard quota limits.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Included Quotas
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>100 MCQs total</strong> (hard limit across all subjects)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>50 DSA Coding Questions</strong> (hard limit) with Judge0</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>ATS Resume Score Preview</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>1 Group Discussion session per month</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-400">
                        <XCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        <span>Contests require paid entry ticket</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-400">
                        <XCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        <span>0 AI Mock Interview minutes</span>
                      </li>
                      <li className="flex items-start gap-2 text-slate-400">
                        <XCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        <span>0 Mentorship sessions</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold"
                    disabled
                  >
                    Current Default Tier
                  </Button>
                </div>
              </div>

              {/* STANDARD PLAN (Entry subscription) */}
              {isItemPublished("PLAN_STANDARD") && (
              <div className="bg-white rounded-xl border-2 border-blue-600 shadow-md p-6 flex flex-col justify-between relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                  Recommended For Practice
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                      Standard Plan
                    </span>
                    <Badge variant="blue">Entry Subscription</Badge>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">
                      Rs {billingCycle === "YEARLY" ? "999" : "99"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {billingCycle === "YEARLY" ? "/ year" : "/ month"} (all-inclusive)
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Comprehensive practice for campus aptitude, core technical MCQs, and coding.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Included Monthly Quotas
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>100 MCQs per subject</strong> refreshed monthly (Quants, LR, VA, Core CS)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>250 DSA Coding Questions</strong> per month with Judge0</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>60 Minutes/month</strong> AI Mock Interviews (Gemini Live)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>1 Mentorship Session/month</strong> (Async Code & Profile Audit by Flash Alumni)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>Free entry to normal weekly placement contests (up to 5/month)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>1 Group Discussion session per day (30/month)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <Button
                    variant="primary"
                    className="w-full text-xs font-semibold"
                    disabled={planTier === "STANDARD" || planTier === "BASIC" || processingItem === "PLAN_STANDARD"}
                    onClick={() => openCheckoutModal({
                      orderType: "PLAN",
                      planTier: "STANDARD",
                      billingCycle,
                      title: `Flash Standard Plan (${billingCycle === "YEARLY" ? "Annual" : "Monthly"})`,
                      description: "100 MCQs/subj/mo, 250 DSA Coding Qs, 60m Mock Interviews, 1 Mentorship Session",
                      priceInr: billingCycle === "YEARLY" ? 999 : 99,
                      originalPriceInr: billingCycle === "YEARLY" ? 1188 : 199,
                      badge: "Entry Subscription"
                    })}
                  >
                    {planTier === "STANDARD" || planTier === "BASIC" ? (
                      "Active Plan"
                    ) : (
                      processingItem === "PLAN_STANDARD" ? "Setting up AutoPay..." : "Subscribe to Standard"
                    )}
                  </Button>
                </div>
              </div>
              )}

              {/* PREMIUM PLAN (Advanced subscription) */}
              {isItemPublished("PLAN_PREMIUM") && (
              <div className="bg-slate-900 text-white rounded-xl border border-slate-800 shadow-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                      Premium Plan
                    </span>
                    <Badge variant="orchid" className="bg-purple-950/80 text-purple-300 border-purple-800">
                      All-Inclusive Suite
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      Rs {billingCycle === "YEARLY" ? "2,999" : "299"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {billingCycle === "YEARLY" ? "/ year" : "/ month"} (all-inclusive)
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">
                    The ultimate suite for dream placements with live 1:1 mentorship and all company archives.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Included Monthly Quotas
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-200">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>250 MCQs per subject</strong> refreshed monthly across all domains</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>750 DSA Coding Questions</strong> per month</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>180 Minutes/month</strong> AI Mock Interviews (Gemini Live)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>3 Mentorship Sessions/month</strong> (Live 1:1 15-minute scheduled calls)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span>Zero entry fee for both Normal and Premium Contests</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>All 50+ Company Placement Banks</strong> and archives included</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span>2 Group Discussion sessions per day (60/month)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800">
                  <Button
                    variant="primary"
                    className="w-full text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white border-transparent"
                    disabled={planTier === "PREMIUM" || processingItem === "PLAN_PREMIUM"}
                    onClick={() => openCheckoutModal({
                      orderType: "PLAN",
                      planTier: "PREMIUM",
                      billingCycle,
                      title: `Flash Premium Plan (${billingCycle === "YEARLY" ? "Annual" : "Monthly"})`,
                      description: "250 MCQs/subj/mo, 750 DSA Coding Qs, 180m Mock Interviews, 3 Mentorship Sessions",
                      priceInr: billingCycle === "YEARLY" ? 2999 : 299,
                      originalPriceInr: billingCycle === "YEARLY" ? 3588 : 599,
                      badge: "All-Inclusive Suite"
                    })}
                  >
                    {planTier === "PREMIUM" ? (
                      "Active Plan"
                    ) : (
                      processingItem === "PLAN_PREMIUM" ? "Setting up AutoPay..." : "Upgrade to Premium"
                    )}
                  </Button>
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MODULAR PASSES */}
        {/* ========================================================================= */}
        {activeTab === "PASSES" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 1. Aptitude Pass */}
              {isItemPublished("PASS_APTITUDE") && (
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Aptitude
                    </span>
                    <Badge variant="blue">Pass</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">
                    Aptitude Pass
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    100 MCQs per subject across Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Data Interpretation.
                  </p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">Rs 59</span>
                    <span className="text-xs text-slate-500">/ month</span>
                    <span className="text-xs text-slate-400">or Rs 599 / year</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                  <Button
                    size="xs"
                    variant="primary"
                    className="flex-1"
                    onClick={() => openCheckoutModal({
                      orderType: "PASS",
                      passType: "PASS_APTITUDE",
                      billingCycle: "MONTHLY",
                      title: "Aptitude Pass (Monthly)",
                      description: "Full access to Quantitative Aptitude, Logical Reasoning, and Verbal Ability banks",
                      priceInr: 59,
                      originalPriceInr: 99
                    })}
                    disabled={processingItem === "PASS_PASS_APTITUDE_MONTHLY"}
                  >
                    Rs 59 Monthly
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openCheckoutModal({
                      orderType: "PASS",
                      passType: "PASS_APTITUDE",
                      billingCycle: "YEARLY",
                      title: "Aptitude Pass (Yearly)",
                      description: "Full 1-year access to Quants, LR, and Verbal Ability placement banks",
                      priceInr: 599,
                      originalPriceInr: 708
                    })}
                    disabled={processingItem === "PASS_PASS_APTITUDE_YEARLY"}
                  >
                    Rs 599 Yearly
                  </Button>
                </div>
              </div>
              )}

              {/* 2. Core CS Subject MCQ Pass */}
              {isItemPublished("PASS_SUBJECT_MCQ") && (
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Technical
                    </span>
                    <Badge variant="primary">Pass</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">
                    Technical Subject MCQ Pass
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    100 MCQs per subject across Operating Systems, DBMS, Computer Networks, OOP, and Software Engineering.
                  </p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">Rs 79</span>
                    <span className="text-xs text-slate-500">/ month</span>
                    <span className="text-xs text-slate-400">or Rs 799 / year</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                  <Button
                    size="xs"
                    variant="primary"
                    className="flex-1"
                    onClick={() => openCheckoutModal({
                      orderType: "PASS",
                      passType: "PASS_SUBJECT_MCQ",
                      billingCycle: "MONTHLY",
                      title: "Core CS Pass (Monthly)",
                      description: "Complete coverage of OS, DBMS, CN, and OOPs concepts",
                      priceInr: 79,
                      originalPriceInr: 129
                    })}
                    disabled={processingItem === "PASS_PASS_SUBJECT_MCQ_MONTHLY"}
                  >
                    Rs 79 Monthly
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openCheckoutModal({
                      orderType: "PASS",
                      passType: "PASS_SUBJECT_MCQ",
                      billingCycle: "YEARLY",
                      title: "Core CS Pass (Yearly)",
                      description: "Full 1-year access to all technical core CS placement question banks",
                      priceInr: 799,
                      originalPriceInr: 948
                    })}
                    disabled={processingItem === "PASS_PASS_SUBJECT_MCQ_YEARLY"}
                  >
                    Rs 799 Yearly
                  </Button>
                </div>
              </div>
              )}

              {/* 3. Single Subject Deep Dive Pass */}
              {isItemPublished("PASS_SINGLE_SUBJECT") && (
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Single Subject
                    </span>
                    <Badge variant="neutral">Targeted</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">
                    Single Subject Pass
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    100 MCQs for 1 specific subject of your choice.
                  </p>

                  <div className="mt-3">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Choose Subject
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
                    >
                      {SINGLE_SUBJECTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">Rs 29</span>
                    <span className="text-xs text-slate-500">/ 30 days</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button
                    size="xs"
                    variant="primary"
                    className="w-full"
                    onClick={() =>
                      handlePurchasePass(
                        "PASS_SINGLE_SUBJECT",
                        selectedSubject,
                        "MONTHLY",
                        `Single Subject Pass (${selectedSubject})`
                      )
                    }
                    disabled={processingItem === `PASS_PASS_SINGLE_SUBJECT_${selectedSubject}`}
                  >
                    Purchase for Rs 29
                  </Button>
                </div>
              </div>
              )}

              {/* 4. Contest All-Access Pass */}
              {isItemPublished("PASS_CONTEST") && (
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Competitions
                    </span>
                    <Badge variant="blue">Pass</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">
                    Contest All-Access Pass
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Free entry to 4 weekly placement contests + 1 monthly major contest without paying individual entry fees.
                  </p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">Rs 59</span>
                    <span className="text-xs text-slate-500">/ month</span>
                    <span className="text-xs text-slate-400">or Rs 599 / year</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                  <Button
                    size="xs"
                    variant="primary"
                    className="flex-1"
                    onClick={() => openCheckoutModal({
                      orderType: "PASS",
                      passType: "PASS_CONTEST",
                      billingCycle: "MONTHLY",
                      title: "Contest Pass (Monthly)",
                      description: "Access to 4 standard weekly contests and 1 premium monthly contest",
                      priceInr: 59,
                      originalPriceInr: 99
                    })}
                    disabled={processingItem === "PASS_PASS_CONTEST_MONTHLY"}
                  >
                    Rs 59 Monthly
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openCheckoutModal({
                      orderType: "PASS",
                      passType: "PASS_CONTEST",
                      billingCycle: "YEARLY",
                      title: "Contest Pass (Yearly)",
                      description: "Annual access to all weekly and monthly placement contests",
                      priceInr: 599,
                      originalPriceInr: 708
                    })}
                    disabled={processingItem === "PASS_PASS_CONTEST_YEARLY"}
                  >
                    Rs 599 Yearly
                  </Button>
                </div>
              </div>
              )}

              {/* 5. Flash Coding Tournament Series */}
              {isItemPublished("PASS_FLASH_CODING_SERIES") && (
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Tournament Series
                    </span>
                    <Badge variant="orchid">10,000 XP Pool</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">
                    Flash Coding Series
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Competitive tournament series with real-time testcase runs. 10,000 XP prize pool distributed among Top 10 participants (1,000 XP each).
                  </p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">Rs 150</span>
                    <span className="text-xs text-slate-500">/ one-time tournament entry</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button
                    size="xs"
                    variant="primary"
                    className="w-full"
                    onClick={() =>
                      handlePurchasePass(
                        "PASS_FLASH_CODING_SERIES",
                        null,
                        "ONE_TIME",
                        "Flash Coding Series Tournament Ticket"
                      )
                    }
                    disabled={processingItem === "PASS_PASS_FLASH_CODING_SERIES_ONE_TIME"}
                  >
                    Enter Series for Rs 150
                  </Button>
                </div>
              </div>
              )}

              {/* 6. CAT / GATE Test Series */}
              {isItemPublished("PASS_SERIES_CAT_GATE") && (
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      National Series
                    </span>
                    <Badge variant="neutral">Weekly Pass</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">
                    CAT / GATE Test Series
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Weekly full-length mock assessment series for GATE CS and CAT Aptitude with percentile benchmarking.
                  </p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">Rs 29</span>
                    <span className="text-xs text-slate-500">/ week</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button
                    size="xs"
                    variant="primary"
                    className="w-full"
                    onClick={() =>
                      handlePurchasePass(
                        "PASS_CAT_GATE_SERIES",
                        null,
                        "WEEKLY",
                        "CAT / GATE Weekly Test Series Pass"
                      )
                    }
                    disabled={processingItem === "PASS_PASS_CAT_GATE_SERIES_WEEKLY"}
                  >
                    Join Series for Rs 29
                  </Button>
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: COMPANY PLACEMENT PACKS */}
        {/* ========================================================================= */}
        {activeTab === "COMPANIES" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Option A: Individual Target Company Pass */}
              {isItemPublished("PASS_COMPANY_SINGLE") && isItemPublished("PASS_COMPANY_INDIVIDUAL") && (
                <div className={cn("bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between", !isItemPublished("PASS_COMPANY_ALL") && "lg:col-span-2 max-w-xl mx-auto w-full")}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Single Company
                      </span>
                      <Badge variant="blue">Individual Recruiter</Badge>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mt-2">
                      Target Company Pass
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Curated question banks, aptitude patterns, and coding archives calibrated for 1 specific company.
                    </p>

                    <div className="mt-6">
                      <label className="text-xs font-semibold text-slate-700 block mb-2">
                        Select Target Company
                      </label>
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 font-medium"
                      >
                        {POPULAR_COMPANIES.map((comp) => (
                          <option key={comp} value={comp}>
                            {comp}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{selectedCompany} specific aptitude & technical MCQs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Previous years coding interview problems</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Company-specific interview round guidance</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">Rs 99</span>
                      <span className="text-xs text-slate-500">/ month per company</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full"
                      onClick={() =>
                        handlePurchasePass(
                          "PASS_COMPANY_INDIVIDUAL",
                          selectedCompany,
                          "MONTHLY",
                          `${selectedCompany} Company Pass`
                        )
                      }
                      disabled={processingItem === `PASS_PASS_COMPANY_INDIVIDUAL_${selectedCompany}`}
                    >
                      Unlock {selectedCompany} Pass for Rs 99
                    </Button>
                  </div>
                </div>
              )}

              {/* Option B: All-Company Placement Pass (Clubbed) */}
              {isItemPublished("PASS_COMPANY_ALL") && (
                <div className={cn("bg-slate-900 text-white rounded-xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between", (!isItemPublished("PASS_COMPANY_SINGLE") && !isItemPublished("PASS_COMPANY_INDIVIDUAL")) && "lg:col-span-2 max-w-xl mx-auto w-full")}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                        All Companies Vault
                      </span>
                      <Badge variant="orchid" className="bg-purple-950 text-purple-300 border-purple-800">
                        50+ Companies Included
                      </Badge>
                    </div>
                    <h4 className="text-xl font-bold text-white mt-2">
                      All-Company Placement Pass (Clubbed)
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Unconstrained access to all 50+ company banks: TCS, Infosys, Accenture, Amazon, Microsoft, Google, Wipro, Cognizant, and more.
                    </p>

                    <div className="mt-6 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCompanyPassCycle("MONTHLY")}
                        className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold border transition-all ${
                          companyPassCycle === "MONTHLY"
                            ? "bg-white text-slate-900 border-white"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        Monthly (Rs 349)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompanyPassCycle("YEARLY")}
                        className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold border transition-all ${
                          companyPassCycle === "YEARLY"
                            ? "bg-white text-slate-900 border-white"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        Yearly (Rs 999) - Save 76%
                      </button>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-slate-800/80 border border-slate-700 space-y-2 text-xs text-slate-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                        <span>Full access to 50+ company question banks & archives</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                        <span>FAANG, Big 4, and Mass Recruiter patterns included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                        <span>Free updates whenever new exam batches are ingested</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white">
                        Rs {companyPassCycle === "YEARLY" ? "999" : "349"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {companyPassCycle === "YEARLY" ? "/ year" : "/ month"} (all-inclusive)
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-800">
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white border-transparent"
                      onClick={() =>
                        handlePurchasePass(
                          "PASS_COMPANY_ALL",
                          null,
                          companyPassCycle,
                          `All-Company Placement Pass (${companyPassCycle})`
                        )
                      }
                      disabled={processingItem === `PASS_PASS_COMPANY_ALL_${companyPassCycle}`}
                    >
                      Unlock All 50+ Companies (Rs {companyPassCycle === "YEARLY" ? "999" : "349"})
                    </Button>
                  </div>
                </div>
              )}

              {!isItemPublished("PASS_COMPANY_ALL") && !isItemPublished("PASS_COMPANY_SINGLE") && !isItemPublished("PASS_COMPANY_INDIVIDUAL") && (
                <div className="col-span-full p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                  Company placement packages are temporarily offline for updates. Check back shortly.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AI MOCK INTERVIEW MINUTES */}
        {/* ========================================================================= */}
        {activeTab === "MINUTES" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 100 Minutes Pack */}
              {(isItemPublished("PACK_100") || isItemPublished("PACK_100_MINUTES")) && (
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="neutral">Starter</Badge>
                    <span className="text-[11px] font-semibold text-slate-500">Rs 0.30/min</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mt-3">
                    100 Mins
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Perfect for 3-4 full mock technical or HR interview sessions.
                  </p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">Rs 30</span>
                    <span className="text-xs text-slate-500">(all-inclusive)</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button
                    size="xs"
                    variant="primary"
                    className="w-full"
                    onClick={() => openCheckoutModal({
                    orderType: "MINUTES_PACK",
                    packId: "PACK_100",
                    minutes: 100,
                    title: "100 AI Mock Interview Minutes",
                    description: "Voice-driven real-time technical and HR simulation powered by Gemini Live",
                    priceInr: 30,
                    originalPriceInr: 50
                  })}
                    disabled={processingItem === "MINUTES_PACK_100"}
                  >
                    Buy 100 Mins (Rs 30)
                  </Button>
                </div>
              </div>
              )}

              {/* 200 Minutes Pack */}
              {(isItemPublished("PACK_200") || isItemPublished("PACK_200_MINUTES")) && (
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="blue">Standard</Badge>
                    <span className="text-[11px] font-semibold text-slate-500">Rs 0.30/min</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mt-3">
                    200 Mins
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Enough for 7-8 deep interview simulations with voice & video feedback.
                  </p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">Rs 60</span>
                    <span className="text-xs text-slate-500">(all-inclusive)</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button
                    size="xs"
                    variant="primary"
                    className="w-full"
                    onClick={() => openCheckoutModal({
                    orderType: "MINUTES_PACK",
                    packId: "PACK_200",
                    minutes: 200,
                    title: "200 AI Mock Interview Minutes",
                    description: "Multi-session interview readiness with live AI feedback and scorecard",
                    priceInr: 60,
                    originalPriceInr: 100
                  })}
                    disabled={processingItem === "MINUTES_PACK_200"}
                  >
                    Buy 200 Mins (Rs 60)
                  </Button>
                </div>
              </div>
              )}

              {/* 300 Minutes Pack */}
              {(isItemPublished("PACK_300") || isItemPublished("PACK_300_MINUTES")) && (
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="primary">Popular</Badge>
                    <span className="text-[11px] font-semibold text-slate-500">Rs 0.30/min</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mt-3">
                    300 Mins
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Comprehensive practice for entire placement season interviews.
                  </p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">Rs 90</span>
                    <span className="text-xs text-slate-500">(all-inclusive)</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button
                    size="xs"
                    variant="primary"
                    className="w-full"
                    onClick={() => openCheckoutModal({
                    orderType: "MINUTES_PACK",
                    packId: "PACK_300",
                    minutes: 300,
                    title: "300 AI Mock Interview Minutes",
                    description: "Deep interview mastery covering System Design, Coding, and behavioral rounds",
                    priceInr: 90,
                    originalPriceInr: 150
                  })}
                    disabled={processingItem === "MINUTES_PACK_300"}
                  >
                    Buy 300 Mins (Rs 90)
                  </Button>
                </div>
              </div>
              )}

              {/* 600 Minutes Pack (Best Value) */}
              {(isItemPublished("PACK_600") || isItemPublished("PACK_600_MINUTES")) && (
              <div className="bg-slate-900 text-white rounded-lg border border-slate-800 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="orchid" className="bg-purple-950 text-purple-300 border-purple-800">
                      Best Value
                    </Badge>
                    <span className="text-[11px] font-semibold text-purple-300">Rs 0.25/min</span>
                  </div>
                  <h4 className="text-2xl font-bold text-white mt-3">
                    600 Mins
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    10 hours of unconstrained AI interview practice. Never expires.
                  </p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">Rs 150</span>
                    <span className="text-xs text-slate-400">(all-inclusive)</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <Button
                    size="xs"
                    variant="primary"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white border-transparent"
                    onClick={() => openCheckoutModal({
                    orderType: "MINUTES_PACK",
                    packId: "PACK_600",
                    minutes: 600,
                    title: "600 AI Mock Interview Minutes",
                    description: "Our best value bundle: 10 full hours of live AI placement mock practice",
                    priceInr: 150,
                    originalPriceInr: 250,
                    badge: "Best Value"
                  })}
                    disabled={processingItem === "MINUTES_PACK_600"}
                  >
                    Buy 600 Mins (Rs 150)
                  </Button>
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: XP REDEMPTION ARCADE */}
        {/* ========================================================================= */}
        {activeTab === "XP_ARCADE" && (
          <div className="space-y-8">
            {/* XP Wallet Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Flash XP Rewards
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {currentXp.toLocaleString("en-IN")} XP Balance
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Earn XP by answering MCQs, passing coding testcases, maintaining streaks, and competing in contests. Redeem your earned XP below for mock interview minutes, contest entries, and streak repairs.
              </p>
            </div>

            {/* Redemption Arcade Grid */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-4">
                Redeem Earned XP
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Mock Interview Redemption */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="blue">Interview</Badge>
                      <span className="text-xs font-bold text-amber-600">1,000 XP</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-2">
                      30 Mins AI Mock Interview
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Convert 1,000 XP directly into 30 minutes of Gemini Live AI interview practice.
                    </p>

                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Button
                      size="xs"
                      variant="primary"
                      className="w-full"
                      onClick={handleRedeemInterviewXp}
                      disabled={currentXp < 1000 || redeemingXp === "INTERVIEW_30"}
                    >
                      {currentXp < 1000 ? "Need 1,000 XP" : (redeemingXp === "INTERVIEW_30" ? "Redeeming..." : "Redeem 30 Mins")}
                    </Button>
                  </div>
                </div>

                {/* 2. Contest Entry Redemption */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="primary">Contest Ticket</Badge>
                      <span className="text-xs font-bold text-amber-600">2,500 XP</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-2">
                      Contest Entry Pass
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Join eligible placement contests for free by redeeming 2,500 XP.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link to="/contests">
                      <Button
                        size="xs"
                        variant="outline"
                        className="w-full text-slate-700"
                      >
                        Browse Contests to Redeem
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 3. Streak Grace Repair */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="orchid">Streak Recovery</Badge>
                      <span className="text-xs font-bold text-amber-600">5 XP</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-2">
                      Streak Grace Repair
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Missed 2 days in a row? Spend 5 XP to repair your broken streak and keep your consecutive progress alive.
                    </p>
                    <div className="mt-3 text-[11px] text-slate-500">
                      Day 1 miss is protected by Flash Grace automatically.
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Button
                      size="xs"
                      variant="primary"
                      className="w-full"
                      onClick={handleRepairStreak}
                      disabled={currentXp < 5 || repairingStreak || !streakHealth.streakBroken}
                    >
                      {streakHealth.streakBroken
                        ? (currentXp < 5 ? "Need 5 XP" : (repairingStreak ? "Repairing..." : "Repair Streak (5 XP)"))
                        : "Streak is Active"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Earning Rules Table */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                How You Earn XP
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold">
                      <th className="px-4 py-2.5 text-left">Activity</th>
                      <th className="px-4 py-2.5 text-left">XP Reward</th>
                      <th className="px-4 py-2.5 text-left">Condition & Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-slate-900">Correct MCQ Answer</td>
                      <td className="px-4 py-2.5 font-bold text-blue-600">+1 XP</td>
                      <td className="px-4 py-2.5">Earned for every unique MCQ answered correctly</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-slate-900">Coding Testcase Passed</td>
                      <td className="px-4 py-2.5 font-bold text-blue-600">+1 XP</td>
                      <td className="px-4 py-2.5">Earned for each passed testcase on accepted runs</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-slate-900">Daily Practice Streak</td>
                      <td className="px-4 py-2.5 font-bold text-amber-600">+1 XP / day</td>
                      <td className="px-4 py-2.5">Complete at least 1 MCQ or coding question daily</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-slate-900">Contest Score 41% - 75%</td>
                      <td className="px-4 py-2.5 font-bold text-emerald-600">+5 XP</td>
                      <td className="px-4 py-2.5">Awarded on completing scored contest attempt</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-slate-900">Contest Score 76% - 100%</td>
                      <td className="px-4 py-2.5 font-bold text-emerald-600">+10 XP</td>
                      <td className="px-4 py-2.5">Top-tier competitive performance reward</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-slate-900">Flash Coding Series Winner</td>
                      <td className="px-4 py-2.5 font-bold text-purple-600">1,000 XP</td>
                      <td className="px-4 py-2.5">Top 10 winners share a 10,000 XP tournament pool</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent XP Activity Ledger */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Recent XP Activity Ledger
                </h3>
                <Button size="xs" variant="ghost" onClick={fetchXpLedger} disabled={loadingLedger}>
                  <RotateCcw className={`w-3.5 h-3.5 ${loadingLedger ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {loadingLedger ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Loading activity ledger...
                </div>
              ) : xpLedger.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No XP transactions recorded yet. Start practising to earn your first XP!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold">
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Source</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {xpLedger.slice(0, 15).map((entry, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-slate-500">
                            {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="px-4 py-2 font-medium text-slate-800">
                            {entry.description || entry.source}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                entry.type === "CREDIT"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {entry.type}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-2 text-right font-bold ${
                              entry.type === "CREDIT" ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {entry.type === "CREDIT" ? `+${entry.amount}` : `-${entry.amount}`} XP
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-900">
                            {entry.balanceAfter} XP
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AutoPay Cancellation Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Cancel AutoPay Mandate
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Are you sure you want to cancel your recurring AutoPay mandate for the{" "}
                <strong className="text-slate-900">{subscription?.planTier} Plan</strong>?
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                <p className="font-semibold">Fair Usage Guarantee</p>
                <p className="mt-0.5 text-[11px] text-blue-800">
                  Your access will remain fully active until{" "}
                  <strong>{formattedEndDate || "the end of your billing cycle"}</strong>. No further recurring debits will occur.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancellingAutoPay}
              >
                Keep Active
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelAutoPay}
                disabled={cancellingAutoPay}
              >
                {cancellingAutoPay ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlashStorePage;

