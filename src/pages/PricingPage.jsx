import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Crown,
  CheckCircle2,
  Zap,
  Sparkles,
  ArrowRight,
  Info,
  Trophy,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { b2cApi } from "../services/b2cApi";
import { openRazorpayCheckout } from "../services/razorpayClient";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge, PlanBadge } from "../components/common/Badge";

export function PricingPage() {
  const { user, subscription, planTier, isTechnical, refreshSubscription } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [billingCycle, setBillingCycle] = useState("MONTHLY"); // 'MONTHLY' | 'YEARLY'
  const [processingPlan, setProcessingPlan] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingAutoPay, setCancellingAutoPay] = useState(false);

  const handleSubscribe = async (tier) => {
    if (tier === "FREE") {
      showInfo("You are already on the Free tier.");
      return;
    }

    try {
      setProcessingPlan(tier);

      // AutoPay Recurring Subscription order creation
      const orderData = await b2cApi.createOrder({
        orderType: 'PLAN',
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
        description: `${tier} AutoPay Subscription (${billingCycle}, All-Inclusive)`,
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
      setProcessingPlan(null);
    }
  };

  const handleCancelAutoPay = async () => {
    try {
      setCancellingAutoPay(true);
      const res = await b2cApi.cancelAutoPay();
      showSuccess(res?.message || "AutoPay has been cancelled. Your access remains active until the end of this billing period.");
      setCancelModalOpen(false);
      await refreshSubscription();
    } catch (err) {
      showError(err?.message || "Failed to cancel AutoPay. Please try again or reach out to support.");
    } finally {
      setCancellingAutoPay(false);
    }
  };

  const formattedEndDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Invest in Your Placement Readiness
        </h1>
        <p className="text-xs text-slate-500 max-w-xl mx-auto">
          Hassle-free recurring subscriptions powered by UPI AutoPay and Card e-Mandates. All-inclusive pricing with zero hidden charges. Cancel anytime with 1 click.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingCycle === "MONTHLY"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Monthly AutoPay
            </button>
            <button
              onClick={() => setBillingCycle("YEARLY")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "YEARLY"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Annual AutoPay</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                Save ~16%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Subscription & AutoPay Management Banner (If Student is on Paid Tier) */}
      {planTier !== "FREE" && (
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 border border-indigo-100 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Membership:</span>
                <PlanBadge tier={planTier} />
                <span className="text-xs font-semibold text-slate-700 font-mono">
                  ({subscription?.billingCycle || "MONTHLY"})
                </span>
                {subscription?.autoPayEnabled ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> AutoPay Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    AutoPay Cancelled
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {subscription?.autoPayEnabled ? (
                  <>Next renewal debit: <strong>{formattedEndDate || "End of Period"}</strong>. (1-Year Mandate, cancel anytime)</>
                ) : (
                  <>AutoPay cancelled. Your <strong>{planTier}</strong> benefits remain fully active until <strong>{formattedEndDate}</strong>.</>
                )}
              </p>
            </div>
          </div>

          {subscription?.autoPayEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 shrink-0"
            >
              Cancel AutoPay
            </Button>
          )}
        </div>
      )}

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        
        {/* Tier 1: FREE */}
        <Card className="p-6 flex flex-col justify-between border-slate-200 hover:shadow-md transition-all">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Starter</span>
            </div>
            
            <h3 className="text-xl font-extrabold text-slate-900">Free Tier</h3>
            <p className="text-xs text-slate-500 mt-1">Foundational access for every student preparing for placements.</p>

            <div className="my-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 font-mono">₹0</span>
                <span className="text-xs text-slate-400 font-medium">/ forever</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Zero credit card required</div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>100 Overall MCQs</strong> ({isTechnical ? "Aptitude & Core CS" : "Aptitude & Reasoning"})</span>
              </li>
              {isTechnical ? (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>50 DSA Coding Problems</strong> (Judge0)</span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Analytical & Case Problem Sets</strong></span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>1 Group Discussion / month</strong> (15m, up to 4 peers)</span>
              </li>
              <li className="flex items-start gap-2 text-slate-400">
                <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">—</span>
                <span>No included mock interview minutes</span>
              </li>
              <li className="flex items-start gap-2 text-slate-400">
                <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">—</span>
                <span>Contests require ₹50 / ₹100 entry pass</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <Button
              variant="outline"
              disabled={planTier === "FREE"}
              onClick={() => handleSubscribe("FREE")}
              className="w-full"
            >
              {planTier === "FREE" ? "Current Active Plan" : "Downgrade to Free"}
            </Button>
          </div>
        </Card>

        {/* Tier 2: BASIC */}
        <Card className="p-6 flex flex-col justify-between border-slate-200 hover:shadow-md transition-all">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Standard</span>
              <Badge variant="primary">Popular</Badge>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">Basic Plan</h3>
            <p className="text-xs text-slate-500 mt-1">Unlimited practice + 300 mock interview minutes/month.</p>

            <div className="my-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-indigo-600 font-mono">
                  {billingCycle === "MONTHLY" ? "₹99" : "₹999"}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {billingCycle === "MONTHLY" ? "/ month (incl. all taxes)" : "/ year (incl. all taxes)"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-600 font-semibold">
                <RefreshCw className="w-3 h-3" />
                <span>UPI AutoPay & Card e-Mandate • Flat {billingCycle === "MONTHLY" ? "₹99" : "₹999"}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                1-Year Mandate • Cancel anytime with 1 click
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Unlimited MCQs</strong> across all {isTechnical ? "subjects" : "aptitude tracks"}</span>
              </li>
              {isTechnical && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900">Unlimited DSA Coding Problems</strong></span>
                </li>
              )}
              {!isTechnical && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900">1 Group Discussion / day</strong> (15m, up to 8 peers)</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">300 Mins/Month</strong> Gemini Live Audio Mocks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Free Entry</strong> to regular assessments</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>50% Discount on Paid Contests (₹50)</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <Button
              variant={planTier === "BASIC" ? "outline" : "primary"}
              loading={processingPlan === "BASIC"}
              onClick={() => handleSubscribe("BASIC")}
              className="w-full"
            >
              {planTier === "BASIC" ? "Current Active Plan" : "Enable AutoPay (Basic)"}
            </Button>
          </div>
        </Card>

        {/* Tier 3: PREMIUM */}
        <Card className="p-6 flex flex-col justify-between border-indigo-500 ring-2 ring-indigo-500/20 shadow-md relative bg-gradient-to-b from-indigo-50/30 to-white">
          <div className="absolute -top-3 right-6">
            <span className="bg-indigo-600 text-white text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded shadow-xs">
              Recommended
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Enterprise Ready</span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">Premium Plan</h3>
            <p className="text-xs text-slate-500 mt-1">Complete mastery + company-specific rounds.</p>

            <div className="my-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-purple-600 font-mono">
                  {billingCycle === "MONTHLY" ? "₹199" : "₹1,999"}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {billingCycle === "MONTHLY" ? "/ month (incl. all taxes)" : "/ year (incl. all taxes)"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-600 font-semibold">
                <RefreshCw className="w-3 h-3" />
                <span>UPI AutoPay & Card e-Mandate • Flat {billingCycle === "MONTHLY" ? "₹199" : "₹1,999"}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                1-Year Mandate • Cancel anytime with 1 click
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">All Basic Plan Features Included</strong></span>
              </li>
              {!isTechnical && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-900">2 Group Discussions / day</strong> (30m, up to 15 peers)</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">1,000 Mins/Month</strong> Gemini Live Audio Mocks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Full Access to Premium Contests</strong> (₹0)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{isTechnical ? "Company-Specific Practice Problems (Google, Amazon, etc.)" : "Company-Specific Case Studies & Screening Tests"}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Priority ATS Resume Optimization & Feedback</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <Button
              variant={planTier === "PREMIUM" ? "outline" : "primary"}
              loading={processingPlan === "PREMIUM"}
              onClick={() => handleSubscribe("PREMIUM")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
            >
              {planTier === "PREMIUM" ? "Current Active Plan" : "Enable AutoPay (Premium)"}
            </Button>
          </div>
        </Card>

      </div>

      {/* AutoPay FAQ & Guarantees */}
      <div className="max-w-4xl mx-auto mt-12 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-600 space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          How Flash AutoPay Works (RBI e-Mandate Compliant)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong className="text-slate-800">1. Seamless Recurring Setup:</strong>
            <p className="text-slate-500 mt-0.5">
              Set up your subscription via UPI AutoPay (Google Pay, PhonePe, Paytm) or Debit/Credit Card. The first transaction requires standard 2FA (UPI PIN/OTP).
            </p>
          </div>
          <div>
            <strong className="text-slate-800">2. All-Inclusive Flat Rates:</strong>
            <p className="text-slate-500 mt-0.5">
              Flat ₹99/mo or ₹199/mo with 18% GST already included. No hidden convenience fees or checkout surprises.
            </p>
          </div>
          <div>
            <strong className="text-slate-800">3. 1-Year Mandate Limit:</strong>
            <p className="text-slate-500 mt-0.5">
              Mandates are capped at 12 monthly cycles or 1 annual cycle for complete control and student peace of mind.
            </p>
          </div>
          <div>
            <strong className="text-slate-800">4. Cancel Anytime with Zero Penalties:</strong>
            <p className="text-slate-500 mt-0.5">
              Cancel with 1 click right from this page. Recurring debits stop immediately, while your paid access continues until your current period expires.
            </p>
          </div>
        </div>
      </div>

      {/* AutoPay Cancellation Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900 text-base">Cancel AutoPay Mandate?</h3>
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Are you sure you want to cancel your <strong>{planTier} Plan</strong> AutoPay?
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="font-semibold text-slate-800">What happens when you cancel:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>No future recurring debits will be made from your UPI / Card.</li>
                  <li>You will retain all <strong>{planTier}</strong> benefits until <strong>{formattedEndDate || "the end of your current cycle"}</strong>.</li>
                  <li>After that date, your account will smoothly revert to the Free starter tier.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancellingAutoPay}
              >
                Keep AutoPay
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={cancellingAutoPay}
                onClick={handleCancelAutoPay}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default PricingPage;
