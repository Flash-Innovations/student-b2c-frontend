import React, { useState } from 'react';
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { initiateStandardCheckout } from '../../services/razorpayClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * Standard Razorpay Checkout Button Component
 *
 * Handles the complete 3-step lifecycle:
 * 1. Backend Order Creation (POST /api/create-order)
 * 2. Razorpay Standard Checkout Modal Opening
 * 3. Backend Cryptographic HMAC-SHA256 Signature Verification (POST /api/verify-payment)
 */
export function RazorpayCheckoutButton({
  amountInPaise = 50000, // 50000 paise = ₹500
  amountInInr = null,
  currency = 'INR',
  description = 'Placement Preparation Pass',
  buttonText = null,
  className = '',
  onSuccess,
  onDismiss,
  onError,
  disabled = false
}) {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'SUCCESS' | 'FAILED' | null

  // Compute final amount in paise (minimum 100 paise)
  const finalPaise = Math.max(
    100,
    amountInInr ? Math.round(Number(amountInInr) * 100) : Number(amountInPaise) || 50000
  );
  const formattedInr = (finalPaise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 2
  });

  const handleCheckout = async () => {
    if (loading || disabled) return;

    try {
      setLoading(true);
      setStatus(null);

      await initiateStandardCheckout({
        amountInPaise: finalPaise,
        currency,
        description,
        user: {
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || ''
        },
        onSuccess: ({ paymentResult, verifyResponse }) => {
          setStatus('SUCCESS');
          showSuccess(`Payment of ${formattedInr} verified successfully! (ID: ${paymentResult.razorpay_payment_id})`);
          if (onSuccess) onSuccess({ paymentResult, verifyResponse });
        },
        onDismiss: () => {
          showInfo('Payment checkout was dismissed.');
          if (onDismiss) onDismiss();
        },
        onFailure: (err) => {
          setStatus('FAILED');
          showError(err.message || 'Payment failed. Please try again.');
          if (onError) onError(err);
        }
      });
    } catch (err) {
      if (err.code !== 'USER_CANCELLED') {
        showError(err.message || 'Unable to complete checkout.');
        if (onError) onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      id="razorpay-checkout-button"
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-sm active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed ${
        status === 'SUCCESS'
          ? 'bg-emerald-600 hover:bg-emerald-700'
          : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25 hover:shadow-md'
      } ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Processing Checkout...</span>
        </>
      ) : status === 'SUCCESS' ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>Paid ({formattedInr})</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 text-indigo-200" />
          <span>{buttonText || `Pay ${formattedInr} via Razorpay`}</span>
        </>
      )}
    </button>
  );
}

export default RazorpayCheckoutButton;
