import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  ArrowRight,
  Code2,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RazorpayCheckoutButton } from '../components/common/RazorpayCheckoutButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

export function RazorpayCheckoutDemoPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [selectedPaise, setSelectedPaise] = useState(100); // 100 paise = ₹1.00 (Minimum order)
  const [customInr, setCustomInr] = useState('1.00');
  const [description, setDescription] = useState('Flash Placement Pass (Test)');
  const [lastPayment, setLastPayment] = useState(null);

  const presets = [
    { label: '₹1.00 (Min. Test)', paise: 100, note: 'Minimum 100 paise' },
    { label: '₹99.00 (Basic)', paise: 9900, note: 'Basic Plan' },
    { label: '₹199.00 (Premium)', paise: 19900, note: 'Premium Plan' },
    { label: '₹500.00 (Standard)', paise: 50000, note: 'Standard Prep Pass' }
  ];

  const handleSelectPreset = (paise) => {
    setSelectedPaise(paise);
    setCustomInr((paise / 100).toFixed(2));
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomInr(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 1) {
      setSelectedPaise(Math.round(num * 100));
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Razorpay Standard Web Checkout Integration
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Live Payment Gateway Verification
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Test order creation, Razorpay checkout modal, and HMAC-SHA256 signature verification end-to-end.
        </p>
      </div>

      {/* Main Payment Card */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="md:col-span-3 p-6 space-y-6 bg-white border-slate-200 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Standard Checkout Test
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an amount to initiate order creation and trigger the Razorpay modal.
            </p>
          </div>

          {/* Amount Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Select Amount
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {presets.map((p) => {
                const isSelected = selectedPaise === p.paise;
                return (
                  <button
                    key={p.paise}
                    type="button"
                    onClick={() => handleSelectPreset(p.paise)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900">{p.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.note}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Custom Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={customInr}
                onChange={handleCustomChange}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="1.00"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Equivalent to {selectedPaise} paise (minimum 100 paise / ₹1 required by Razorpay)
            </p>
          </div>

          {/* Checkout Button */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>TLS 256-Bit Cryptographic Checkout</span>
            </div>

            <RazorpayCheckoutButton
              amountInPaise={selectedPaise}
              description={description}
              className="w-full sm:w-auto"
              onSuccess={({ paymentResult, verifyResponse }) => {
                setLastPayment({
                  order_id: paymentResult.razorpay_order_id,
                  payment_id: paymentResult.razorpay_payment_id,
                  signature: paymentResult.razorpay_signature,
                  amount: selectedPaise,
                  timestamp: new Date().toLocaleTimeString()
                });
                showSuccess('Razorpay payment verified & confirmed!');
              }}
              onError={(err) => {
                showError(err.message || 'Payment failed.');
              }}
            />
          </div>
        </Card>

        {/* Verification & Status Sidebar */}
        <div className="md:col-span-2 space-y-4">
          {/* Active Credentials Badge */}
          <Card className="p-4 bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Gateway Status
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold">
                ACTIVE TEST
              </span>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-slate-400">KEY_ID:</div>
              <div className="text-indigo-200 truncate bg-slate-800/80 p-1.5 rounded">
                rzp_test_TsaU3wlZuPAEGJ
              </div>
              <div className="text-slate-400 pt-1">ENDPOINTS:</div>
              <div className="text-slate-300 text-[11px] space-y-0.5">
                <div>• POST /api/create-order</div>
                <div>• POST /api/verify-payment</div>
              </div>
            </div>
          </Card>

          {/* Last Transaction Status */}
          <Card className="p-4 bg-white border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Verification Result
            </h3>
            {lastPayment ? (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Signature Matched (HMAC-SHA256)</span>
                </div>
                <div className="space-y-1 text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  <div><strong>Order:</strong> {lastPayment.order_id}</div>
                  <div><strong>Payment:</strong> {lastPayment.payment_id}</div>
                  <div><strong>Amount:</strong> ₹{(lastPayment.amount / 100).toFixed(2)}</div>
                  <div className="truncate"><strong>Sig:</strong> {lastPayment.signature}</div>
                  <div className="text-slate-400">Time: {lastPayment.timestamp}</div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Click the checkout button above to run a live payment verification cycle.
              </div>
            )}
          </Card>

          <div className="text-center pt-2">
            <Link
              to="/pricing"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              <span>View Subscription Plans Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RazorpayCheckoutDemoPage;
