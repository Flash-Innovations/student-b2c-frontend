import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Crown,
  CheckCircle2,
  Zap,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  Trophy,
  HelpCircle,
  Users2
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

  const handleSubscribe = async (tier) => {
    if (tier === "FREE") {
      showInfo("You are already on the Free tier.");
      return;
    }

    try {
      setProcessingPlan(tier);

      const orderData = await b2cApi.createOrder({
        orderType: 'PLAN',
        planTier: tier,
        billingCycle
      });

      if (!orderData || (!orderData.orderId && !orderData.order_id)) {
        throw new Error("Unable to create order with Razorpay.");
      }

      openRazorpayCheckout({
        orderId: orderData.orderId || orderData.order_id,
        amountInPaise: orderData.amount || orderData.amountInPaise,
        amount: orderData.breakdown?.totalAmount || orderData.totalAmountWithGst,
        currency: orderData.currency || "INR",
        name: "Flash Platform",
        description: `${tier} Subscription (${billingCycle})`,
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
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              transactionId: orderData.transactionId
            });

            showSuccess(`Congratulations! Your ${tier} plan is now active.`);
            await refreshSubscription();
          } catch (verifyErr) {
            showError("Payment received, but verification failed. Please contact support.");
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

  const handleBuyAddon = async (addonType, itemDetails) => {
    try {
      setProcessingPlan(addonType);
      let orderType = addonType;
      if (addonType === "MOCK_MINUTES_PACK") orderType = "MOCK_MINUTES";
      if (addonType === "CONTEST_REGULAR_PASS") orderType = "REGULAR_CONTEST";
      if (addonType === "CONTEST_PREMIUM_PASS") orderType = "PREMIUM_CONTEST";
      if (addonType === "GD_POWERUP") orderType = "GD_POWERUP";

      const orderData = await b2cApi.createOrder({
        orderType,
        quantity: 1,
        contestId: itemDetails?.contestId
      });

      if (!orderData || (!orderData.orderId && !orderData.order_id)) {
        throw new Error("Unable to create order for add-on.");
      }

      openRazorpayCheckout({
        orderId: orderData.orderId || orderData.order_id,
        amountInPaise: orderData.amount || orderData.amountInPaise,
        amount: orderData.breakdown?.totalAmount || orderData.totalAmountWithGst,
        currency: "INR",
        name: "Flash Platform",
        description: itemDetails.title,
        keyId: orderData.keyId || orderData.key_id,
        user: {
          name: user?.name,
          email: user?.email
        },
        onSuccess: async (paymentResponse) => {
          try {
            await b2cApi.verifyPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });

            showSuccess(`Add-on activated: ${itemDetails.title}`);
            await refreshSubscription();
          } catch (err) {
            showError("Payment verification failed.");
          }
        },
        onFailure: (err) => {
          showError(err.message || "Payment cancelled.");
        }
      });
    } catch (err) {
      showError(err.message || "Failed to buy add-on pack.");
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Invest in Your Placement Readiness
        </h1>

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
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("YEARLY")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "YEARLY"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                Save ~16%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        
        {/* Tier 1: FREE */}
        <Card className="p-6 flex flex-col justify-between border-slate-200 hover:shadow-md transition-all">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Starter</span>
            </div>
            
            <h3 className="text-xl font-extrabold text-slate-900">Free Tier</h3>
            <p className="text-xs text-slate-500 mt-1">Foundational access for every 2028 batch student.</p>

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
                  {billingCycle === "MONTHLY" ? "/ month + GST" : "/ year + GST"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {billingCycle === "MONTHLY" ? "₹116.82 incl. 18% GST" : "₹1,178.82 incl. 18% GST (~₹83/mo)"}
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
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">1 Group Discussion / day</strong> (15m, up to 8 peers)</span>
              </li>
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
                <span>50% Subsidized Premium Contest Pass (₹50)</span>
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
              {planTier === "BASIC" ? "Current Active Plan" : "Upgrade to Basic"}
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
                  {billingCycle === "MONTHLY" ? "/ month + GST" : "/ year + GST"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {billingCycle === "MONTHLY" ? "₹234.82 incl. 18% GST" : "₹2,358.82 incl. 18% GST (~₹166/mo)"}
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">All Basic Plan Features Included</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">2 Group Discussions / day</strong> (30m, up to 15 peers)</span>
              </li>
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
              {planTier === "PREMIUM" ? "Current Active Plan" : "Upgrade to Premium"}
            </Button>
          </div>
        </Card>

      </div>

      {/* Pay-As-You-Go Variable Add-On Packs */}
      <div className="max-w-6xl mx-auto pt-6">
        <Card className="p-6">
          <CardHeader
            title="Pay-As-You-Go Add-On Packs"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Add-on 1: Mock Minutes */}
            <div className="p-5 rounded-2xl border border-slate-200/90 hover:border-indigo-400 transition-all bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Clock className="w-5 h-5" />
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono">₹20</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">1-Hour Mock Minutes Pack</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Adds 60 minutes of real-time conversational Gemini Live voice sessions + scorecards.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">+18% GST (₹23.60)</span>
                <Button
                  size="sm"
                  variant="outline"
                  loading={processingPlan === "MOCK_MINUTES_PACK"}
                  onClick={() => handleBuyAddon("MOCK_MINUTES_PACK", { title: "1-Hour Mock Minutes Pack" })}
                >
                  Buy Pack
                </Button>
              </div>
            </div>

            {/* Add-on 2: GD Session Power-Up Pass */}
            <div className="p-5 rounded-2xl border border-slate-200/90 hover:border-indigo-400 transition-all bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Users2 className="w-5 h-5" />
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono">₹30</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">GD Session Power-Up Pass</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  1 extra 15-minute Group Discussion session with live video & audio room access.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">+18% GST (₹35.40)</span>
                <Button
                  size="sm"
                  variant="outline"
                  loading={processingPlan === "GD_POWERUP"}
                  onClick={() => handleBuyAddon("GD_POWERUP", { title: "GD Session Power-Up Pass" })}
                >
                  Buy Pass
                </Button>
              </div>
            </div>

            {/* Add-on 3: Regular Contest */}
            <div className="p-5 rounded-2xl border border-slate-200/90 hover:border-indigo-400 transition-all bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Trophy className="w-5 h-5" />
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono">₹50</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Regular Contest Single Pass</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Entry ticket to one weekend competitive programming contest for Free plan students.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">+18% GST (₹59.00)</span>
                <Button
                  size="sm"
                  variant="outline"
                  loading={processingPlan === "CONTEST_REGULAR_PASS"}
                  onClick={() => handleBuyAddon("CONTEST_REGULAR_PASS", { title: "Regular Contest Pass" })}
                >
                  Buy Pass
                </Button>
              </div>
            </div>

            {/* Add-on 4: Premium Contest */}
            <div className="p-5 rounded-2xl border border-slate-200/90 hover:border-indigo-400 transition-all bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Crown className="w-5 h-5" />
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {planTier === "BASIC" ? "₹50" : "₹100"}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Premium Contest Pass</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Flagship campus hiring contest. (Free tier: ₹100, Basic tier: ₹50, Premium: Included).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">+18% GST</span>
                <Button
                  size="sm"
                  variant="outline"
                  loading={processingPlan === "CONTEST_PREMIUM_PASS"}
                  onClick={() => handleBuyAddon("CONTEST_PREMIUM_PASS", { title: "Premium Contest Pass" })}
                >
                  Buy Pass
                </Button>
              </div>
            </div>

          </div>
        </Card>
      </div>

    </div>
  );
}

export default PricingPage;
