import React, { useState } from 'react';
import {
  Crown,
  Check,
  Zap,
  Sparkles,
  Clock,
  Shield,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { b2cApi } from '../services/b2cApi';
import { openRazorpayCheckout } from '../services/razorpayClient';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, PlanBadge } from '../components/common/Badge';

export function PricingPage() {
  const { user, subscription, planTier, updateToken, refreshProfile } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [loadingAction, setLoadingAction] = useState(null); // 'BASIC', 'PREMIUM', 'MOCK_60', 'CONTEST_REG', 'CONTEST_PREM'

  // Plans catalog
  const plans = [
    {
      tier: 'FREE',
      name: 'Free Plan',
      basePrice: 0,
      priceFormatted: '₹0',
      periodText: 'forever',
      description: 'Essential placement starter kit for self-paced students.',
      features: [
        '100 overall MCQs (Aptitude & Core CS)',
        '50 DSA Coding Problems on Judge0 compiler',
        'Basic ATS resume scanner preview',
        'Placement readiness score tracking',
        'Contests entry fee: ₹50 / ₹100'
      ],
      isCurrent: planTier === 'FREE',
      buttonText: planTier === 'FREE' ? 'Current Plan' : 'Free Tier',
      variant: 'secondary'
    },
    {
      tier: 'BASIC',
      name: 'Basic Plan',
      basePrice: billingCycle === 'YEARLY' ? 999 : 99,
      priceFormatted: billingCycle === 'YEARLY' ? '₹999' : '₹99',
      periodText: billingCycle === 'YEARLY' ? '/year + GST' : '/month + GST',
      gstNote: billingCycle === 'YEARLY' ? '+ 18% GST (₹1,178.82 total)' : '+ 18% GST (₹116.82 total)',
      discountBadge: billingCycle === 'YEARLY' ? '~15% Annual Discount' : null,
      description: 'Unlimited MCQs & coding practice with 300 minutes of monthly AI mock interviews.',
      features: [
        'Unlimited MCQs (Quant, Logical, Verbal, CS)',
        'Unlimited DSA coding practice with sandbox compilation',
        '300 Minutes / month AI Mock Interviews (5 hours)',
        'Question-based voice tests',
        'Free entry to all standard campus placement contests',
        'Continuous performance streak telemetry'
      ],
      isCurrent: planTier === 'BASIC',
      popular: true,
      buttonText: planTier === 'BASIC' ? 'Active Plan' : 'Upgrade to Basic',
      variant: 'primary'
    },
    {
      tier: 'PREMIUM',
      name: 'Premium Plan',
      basePrice: billingCycle === 'YEARLY' ? 1999 : 199,
      priceFormatted: billingCycle === 'YEARLY' ? '₹1,999' : '₹199',
      periodText: billingCycle === 'YEARLY' ? '/year + GST' : '/month + GST',
      gstNote: billingCycle === 'YEARLY' ? '+ 18% GST (₹2,358.82 total)' : '+ 18% GST (₹234.82 total)',
      discountBadge: billingCycle === 'YEARLY' ? '~16% Annual Discount' : null,
      description: 'Maximum AI interview reps with exclusive company-specific practice problems.',
      features: [
        'All Basic Plan benefits included',
        '1,000 Minutes / month AI Mock Interviews (16.6 hours)',
        'Premium Contests included (Zero entry fee)',
        'Company-Specific Practice Sets (DSA, Dev tasks, MCQs for FAANG/MNCs)',
        'Comprehensive ATS Resume optimization audit',
        'Verified placement certificate & recruiter spotlight'
      ],
      isCurrent: planTier === 'PREMIUM',
      buttonText: planTier === 'PREMIUM' ? 'Active Plan' : 'Upgrade to Premium',
      variant: 'gold'
    }
  ];

  // Handle plan purchase
  const handleUpgradePlan = async (targetTier) => {
    if (targetTier === planTier) {
      showWarning(`You are already subscribed to the ${targetTier} plan.`);
      return;
    }

    if (targetTier === 'FREE') return;

    setLoadingAction(targetTier);
    try {
      // 1. Create Order in Backend
      const orderData = await b2cApi.createOrder({
        orderType: 'PLAN',
        planTier: targetTier,
        billingCycle
      });

      // 2. Open Razorpay Checkout Modal
      const paymentResponse = await openRazorpayCheckout({
        orderId: orderData.orderId,
        amountInPaise: orderData.amountInPaise,
        keyId: orderData.keyId,
        description: `Flash ${targetTier} Plan (${billingCycle})`,
        user,
        isSandbox: orderData.isSandbox
      });

      // 3. Verify Payment
      const verification = await b2cApi.verifyPayment(paymentResponse);
      if (verification && verification.success) {
        showSuccess(`Congratulations! Your ${targetTier} Plan is now active.`);
        if (verification.token) updateToken(verification.token);
        await refreshProfile();
      }
    } catch (err) {
      showError(err.message || 'Payment could not be completed.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle add-on purchase
  const handlePurchaseAddon = async (addonType) => {
    setLoadingAction(addonType);
    try {
      let payload = {};
      let desc = '';

      if (addonType === 'MOCK_60') {
        payload = { orderType: 'MOCK_MINUTES', mockHoursCount: 1 };
        desc = 'Mock Interview 1-Hour Add-on (60 Mins)';
      } else if (addonType === 'CONTEST_REG') {
        payload = { orderType: 'REGULAR_CONTEST' };
        desc = 'Standard Contest Ticket';
      } else if (addonType === 'CONTEST_PREM') {
        payload = { orderType: 'PREMIUM_CONTEST' };
        desc = 'Premium Contest Ticket';
      }

      const orderData = await b2cApi.createOrder(payload);

      const paymentResponse = await openRazorpayCheckout({
        orderId: orderData.orderId,
        amountInPaise: orderData.amountInPaise,
        keyId: orderData.keyId,
        description: desc,
        user,
        isSandbox: orderData.isSandbox
      });

      const verification = await b2cApi.verifyPayment(paymentResponse);
      if (verification && verification.success) {
        showSuccess('Add-on activated and credited to your wallet!');
        await refreshProfile();
      }
    } catch (err) {
      showError(err.message || 'Add-on purchase cancelled or failed.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <Badge variant="indigo" className="mb-3">Monetization & Plans</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
          Transparent, Student-First Pricing
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Hypothesis pricing built to validate student willingness to pay and retention for the 2028 batch.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="mt-8 inline-flex items-center p-1 rounded-2xl glass-panel border border-slate-700">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              billingCycle === 'MONTHLY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('YEARLY')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              billingCycle === 'YEARLY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
              Save 15-16%
            </span>
          </button>
        </div>
      </div>

      {/* Subscription Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        {plans.map((p) => (
          <div
            key={p.tier}
            className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
              p.isCurrent
                ? 'glass-panel border-indigo-500/60 shadow-2xl ring-2 ring-indigo-500/30'
                : p.popular
                ? 'glass-panel border-indigo-500/40 shadow-xl'
                : 'glass-panel border-slate-800'
            }`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
                Most Popular
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white font-heading">{p.name}</h3>
                <PlanBadge tier={p.tier} />
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">{p.description}</p>

              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-4xl font-extrabold text-white font-heading">{p.priceFormatted}</span>
                <span className="text-xs text-slate-400">{p.periodText}</span>
              </div>

              {p.gstNote && (
                <p className="text-[11px] text-slate-400 mb-2">{p.gstNote}</p>
              )}

              {p.discountBadge && (
                <p className="text-[11px] text-emerald-400 font-semibold mb-6 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{p.discountBadge}</span>
                </p>
              )}

              <div className="pt-6 border-t border-slate-800/80 space-y-3 mb-8">
                {p.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant={p.isCurrent ? 'secondary' : p.variant}
              disabled={p.isCurrent || p.tier === 'FREE'}
              loading={loadingAction === p.tier}
              onClick={() => handleUpgradePlan(p.tier)}
              className="w-full"
            >
              {p.buttonText}
            </Button>
          </div>
        ))}
      </div>

      {/* Variable Paid Packs Section (Handwritten note add-ons) */}
      <div className="max-w-6xl mx-auto pt-12 border-t border-slate-800">
        <div className="text-center mb-8">
          <Badge variant="purple" className="mb-2">Variable Paid Packs</Badge>
          <h2 className="text-2xl font-bold text-white font-heading">Flexible Pay-As-You-Go Add-ons</h2>
          <p className="text-xs text-slate-400 mt-1">Purchase instant credits without altering your monthly or annual subscription.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add-on 1: Mock Interview Pack */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-base">Mock Interview 1-Hr Pack</h3>
                <Badge variant="indigo">₹20 / 60 Mins</Badge>
              </div>
              <div className="text-3xl font-extrabold text-white font-heading mb-1">₹20</div>
              <div className="text-[11px] text-slate-400 mb-3">+ 18% GST (₹23.60 Total)</div>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Add 60 minutes of real-time conversational AI mock interviews (Technical or HR) via Gemini Live. Credits never expire and rollover month-to-month.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={loadingAction === 'MOCK_60'}
              onClick={() => handlePurchaseAddon('MOCK_60')}
              className="w-full"
            >
              Buy 1 Hour (₹20)
            </Button>
          </Card>

          {/* Add-on 2: Standard Contest Pass */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-base">Standard Contest Pass</h3>
                <Badge variant="emerald">₹50 / Contest</Badge>
              </div>
              <div className="text-3xl font-extrabold text-white font-heading mb-1">₹50</div>
              <div className="text-[11px] text-slate-400 mb-3">+ 18% GST (₹59.00 Total)</div>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Entry pass for a single scheduled campus placement coding contest with live Judge0 scoring and national leaderboards. (Included free on Basic & Premium).
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={planTier === 'BASIC' || planTier === 'PREMIUM'}
              loading={loadingAction === 'CONTEST_REG'}
              onClick={() => handlePurchaseAddon('CONTEST_REG')}
              className="w-full"
            >
              {planTier === 'BASIC' || planTier === 'PREMIUM' ? 'Included in Plan' : 'Buy Contest Pass (₹50)'}
            </Button>
          </Card>

          {/* Add-on 3: Premium Contest Pass */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-base">Premium Contest Pass</h3>
                <Badge variant="gold">
                  {planTier === 'BASIC' ? '₹50 (50% Off)' : planTier === 'PREMIUM' ? 'Free (Included)' : '₹100'}
                </Badge>
              </div>
              <div className="text-3xl font-extrabold text-white font-heading mb-1">
                {planTier === 'PREMIUM' ? '₹0' : planTier === 'BASIC' ? '₹50' : '₹100'}
              </div>
              <div className="text-[11px] text-slate-400 mb-3">
                {planTier === 'PREMIUM' ? 'Included with Premium Plan' : '+ 18% GST per contest'}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Specialized flagship contests with recruiter evaluation and company interview fast-tracks. ₹100 for Free users, ₹50 for Basic users, Free on Premium.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={planTier === 'PREMIUM'}
              loading={loadingAction === 'CONTEST_PREM'}
              onClick={() => handlePurchaseAddon('CONTEST_PREM')}
              className="w-full"
            >
              {planTier === 'PREMIUM' ? 'Included in Premium' : `Buy Premium Pass (${planTier === 'BASIC' ? '₹50' : '₹100'})`}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
