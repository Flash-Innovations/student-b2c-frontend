/**
 * Razorpay Payment Client Wrapper
 * Handles live payment popups with automatic test simulator fallback
 */

export const openRazorpayCheckout = ({
  orderId,
  amountInPaise,
  currency = 'INR',
  name = 'Flash Student Platform',
  description = 'Subscription Upgrade',
  keyId,
  user = {},
  isSandbox = false,
  onSuccess,
  onDismiss
}) => {
  return new Promise((resolve, reject) => {
    // If Razorpay SDK loaded and not pure mock test
    if (typeof window !== 'undefined' && window.Razorpay && !isSandbox) {
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency,
        name,
        description,
        order_id: orderId,
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#6366f1' // Indigo-600
        },
        handler: function (response) {
          const result = {
            razorpay_order_id: response.razorpay_order_id || orderId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          };
          if (onSuccess) onSuccess(result);
          resolve(result);
        },
        modal: {
          ondismiss: function () {
            if (onDismiss) onDismiss();
            reject(new Error('Payment cancelled by student.'));
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        reject(new Error(response.error.description || 'Payment failed'));
      });
      rzp.open();
    } else {
      // Sandbox Simulator Dialog
      const confirmed = window.confirm(
        `[Flash Test Gateway Simulator]\n\nAuthorize payment of ₹${(amountInPaise / 100).toFixed(2)} for ${description}?\n\nClick OK to simulate successful payment, or Cancel to dismiss.`
      );

      if (confirmed) {
        const mockResult = {
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: 'sim_signature_test'
        };
        if (onSuccess) onSuccess(mockResult);
        resolve(mockResult);
      } else {
        if (onDismiss) onDismiss();
        reject(new Error('Payment simulation cancelled.'));
      }
    }
  });
};
