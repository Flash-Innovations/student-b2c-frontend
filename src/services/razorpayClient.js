/**
 * Razorpay Payment Client Wrapper for Standard Web Checkout
 * Loads Razorpay SDK, opens standard payment modal, and handles callbacks & events
 */
import { b2cApi } from './b2cApi';

/**
 * Dynamically load Razorpay Checkout SDK if not already loaded in the DOM
 * @returns {Promise<boolean>}
 */
export const loadRazorpaySdk = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true);
    }
    if (typeof document === 'undefined') {
      return resolve(false);
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Open Razorpay Standard Checkout Modal
 *
 * @param {object} params
 * @param {string} params.orderId - Razorpay Order ID (required)
 * @param {number} [params.amountInPaise] - Order amount in paise
 * @param {number} [params.amount] - Order amount in paise or INR
 * @param {string} [params.currency='INR'] - Currency code
 * @param {string} [params.name='Flash Platform'] - Merchant name
 * @param {string} [params.description='Checkout Payment'] - Description
 * @param {string} [params.keyId] - Razorpay Key ID (defaults to env VITE_RAZORPAY_KEY_ID)
 * @param {object} [params.user] - Prefill student details { name, email, phone }
 * @param {function} [params.onSuccess] - Callback on payment success ({ razorpay_payment_id, razorpay_order_id, razorpay_signature })
 * @param {function} [params.onDismiss] - Callback when modal is dismissed/cancelled
 * @param {function} [params.onFailure] - Callback on payment failure ({ code, description, source, step, reason })
 * @returns {Promise<object>} Resolves with payment result or rejects on failure/dismiss
 */
export const openRazorpayCheckout = async ({
  orderId,
  subscriptionId,
  subscription_id,
  amountInPaise,
  amount,
  currency = 'INR',
  name = 'Flash Student Platform',
  description = 'Course & Practice Subscription',
  keyId,
  user = {},
  onSuccess,
  onDismiss,
  onFailure
}) => {
  // Ensure Razorpay SDK script is available
  const isLoaded = await loadRazorpaySdk();
  if (!isLoaded || typeof window === 'undefined' || !window.Razorpay) {
    const error = new Error('Razorpay SDK could not be loaded. Please check your internet connection.');
    if (onFailure) onFailure(error);
    throw error;
  }

  // Calculate amount in paise
  let computedPaise = amountInPaise;
  if (!computedPaise && amount) {
    computedPaise = Number(amount) >= 100 ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);
  }
  if (!computedPaise) {
    computedPaise = 100;
  }

  const razorpayKey = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
  const activeSubId = subscriptionId || subscription_id;

  return new Promise((resolve, reject) => {
    const options = {
      key: razorpayKey,
      name: name || 'Flash Student Platform',
      description: description || 'Payment Checkout',
      prefill: {
        name: user.name || '',
        email: user.email || '',
        contact: user.phone || ''
      },
      theme: {
        color: '#6366f1' // Indigo brand theme
      },
      handler: function (response) {
        // Step 2 & 3: On success, receive payment_id, subscription_id / order_id, signature
        const result = {
          razorpay_order_id: response.razorpay_order_id || orderId,
          order_id: response.razorpay_order_id || orderId,
          razorpay_subscription_id: response.razorpay_subscription_id || activeSubId,
          subscription_id: response.razorpay_subscription_id || activeSubId,
          razorpay_payment_id: response.razorpay_payment_id,
          payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          signature: response.razorpay_signature
        };

        if (onSuccess) onSuccess(result);
        resolve(result);
      },
      modal: {
        ondismiss: function () {
          const cancelError = new Error('Payment modal closed by student.');
          cancelError.code = 'USER_CANCELLED';
          if (onDismiss) onDismiss();
          reject(cancelError);
        }
      }
    };

    // AutoPay Recurring Subscription takes subscription_id; one-time orders take order_id & amount
    if (activeSubId) {
      options.subscription_id = activeSubId;
    } else if (orderId) {
      options.order_id = orderId;
      options.amount = computedPaise;
      options.currency = currency || 'INR';
    }

    try {
      const rzp = new window.Razorpay(options);

      // Handle payment.failed event
      rzp.on('payment.failed', function (response) {
        const errDetails = response.error || {};
        const failureError = new Error(errDetails.description || 'Payment transaction failed');
        failureError.details = errDetails;

        console.error('[Razorpay Payment Failed]:', errDetails);
        if (onFailure) onFailure(failureError);
        reject(failureError);
      });

      rzp.open();
    } catch (openErr) {
      console.error('[Razorpay Modal Open Error]:', openErr);
      if (onFailure) onFailure(openErr);
      reject(openErr);
    }
  });
};

/**
 * End-to-End Razorpay Checkout Helper
 * 1. Calls backend /api/create-order
 * 2. Opens Razorpay modal with order_id
 * 3. On success, calls backend /api/verify-payment with order_id, payment_id, signature
 *
 * @param {object} params
 * @param {number} params.amountInPaise - Minimum 100 paise
 * @param {string} [params.currency='INR']
 * @param {string} [params.description]
 * @param {object} [params.user]
 * @param {function} [params.onSuccess]
 * @param {function} [params.onDismiss]
 * @param {function} [params.onFailure]
 */
export const initiateStandardCheckout = async ({
  amountInPaise,
  currency = 'INR',
  description = 'Placement Preparation Subscription',
  receipt,
  notes = {},
  user = {},
  onSuccess,
  onDismiss,
  onFailure
}) => {
  try {
    // 1. Create order on backend
    const orderResponse = await b2cApi.createStandardOrder({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes
    });

    if (!orderResponse || (!orderResponse.order_id && !orderResponse.id)) {
      throw new Error(orderResponse?.message || 'Unable to create order with Razorpay backend.');
    }

    const orderId = orderResponse.order_id || orderResponse.id;

    // 2. Open checkout modal
    const paymentResult = await openRazorpayCheckout({
      orderId,
      amountInPaise: orderResponse.amount || amountInPaise,
      currency: orderResponse.currency || currency,
      name: 'Flash Student Platform',
      description,
      keyId: orderResponse.key_id,
      user,
      onDismiss,
      onFailure
    });

    // 3. Verify signature on backend
    const verifyResponse = await b2cApi.verifyStandardPayment({
      razorpay_order_id: paymentResult.razorpay_order_id,
      razorpay_payment_id: paymentResult.razorpay_payment_id,
      razorpay_signature: paymentResult.razorpay_signature
    });

    if (onSuccess) onSuccess({ paymentResult, verifyResponse });
    return { paymentResult, verifyResponse };
  } catch (err) {
    if (onFailure && err.code !== 'USER_CANCELLED') {
      onFailure(err);
    }
    throw err;
  }
};
