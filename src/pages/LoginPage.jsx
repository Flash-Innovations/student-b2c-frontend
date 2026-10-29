import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  Info,
  KeyRound,
  CheckCircle2,
  X,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { b2cApi } from "../services/b2cApi";
import { Button } from "../components/common/Button";
import { validatePasswordStrength } from "../utils/passwordPolicy";
import { PasswordRequirements } from "../components/common/PasswordRequirements";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function LoginPage() {
  const { login, setSession } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get("redirect") || location.state?.from?.pathname || "/dashboard";

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = request email, 2 = enter OTP + new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const data = await login(email.trim(), password);
      showSuccess(`Welcome back, ${data.user?.name || "Student"}!`);
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const msg = err.message || "Invalid email or password.";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email.trim());
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotError("");
    setForgotSuccessMsg("");
    setForgotStep(1);
    setShowForgotModal(true);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotError("");
    setForgotSuccessMsg("");
    setForgotStep(1);
  };

  // Step 1: Send OTP & Reset Link
  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setForgotError("Please enter a valid student email address.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    setForgotSuccessMsg("");

    try {
      const res = await b2cApi.forgotPassword({ email: cleanEmail });
      setForgotSuccessMsg(res.message || "A 6-digit verification code and reset link have been sent to your email.");
      showSuccess("Verification code sent to your email!");
      setForgotStep(2);
    } catch (err) {
      const msg = err.message || "Failed to send reset code. Please try again.";
      setForgotError(msg);
      showError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Confirm OTP & Change Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");

    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp) {
      setForgotError("Please enter the 6-digit verification code.");
      return;
    }

    const passwordError = validatePasswordStrength(forgotNewPassword);
    if (passwordError) {
      setForgotError(passwordError);
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Passwords do not match. Please verify.");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await b2cApi.resetPassword({
        email: forgotEmail.trim(),
        otp: cleanOtp,
        newPassword: forgotNewPassword
      });

      if (res && res.success) {
        showSuccess("Password reset successfully! Logging you in...");
        closeForgotModal();

        if (res.token) {
          await setSession(res.token, res.user);
          navigate(redirectTarget, { replace: true });
        } else {
          navigate("/login");
        }
      } else {
        const msg = res?.message || "Invalid or expired code. Please try again.";
        setForgotError(msg);
        showError(msg);
      }
    } catch (err) {
      const msg = err.message || "Failed to reset password. Please check the code and try again.";
      setForgotError(msg);
      showError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <img
            src="/branding/flash-logo-full.png"
            alt="FLASH"
            className="h-16 w-auto max-w-[240px] sm:max-w-[280px] object-contain cursor-pointer transition-transform hover:scale-105"
            onClick={() => navigate("/login")}
          />
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Main Auth Card */}
        <div className="bg-white py-7 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Student Portal Sign In</h2>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            <div className="flex items-start gap-2 p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100/80 text-xs text-indigo-900 leading-snug">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Enter your registered student email or create a new <strong>Student</strong> account.
              </span>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="e.g. student@college.edu"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Input with Forgot Password link */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-2"
            >
              Sign In to Student Platform <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account yet?{" "}
            <Link
              to={redirectTarget !== "/dashboard" ? `/register?redirect=${encodeURIComponent(redirectTarget)}` : "/register"}
              className="font-bold text-indigo-600 hover:text-indigo-700"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password / 2FA Verification Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {forgotStep === 1 ? "Reset Student Password" : "Enter Verification Code"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {forgotStep === 1 ? "Step 1: Request Security Code" : "Step 2: 2-Factor Verification"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForgotModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {forgotError && (
                <div className="mb-4 flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{forgotError}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                /* Step 1: Email Form */
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter the email address associated with your student account. We'll send an email from <strong>support@flashedu.in</strong> with a <strong>6-digit verification code</strong> and a <strong>1-click reset link</strong>.
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Student Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        disabled={forgotLoading}
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          setForgotError("");
                        }}
                        placeholder="e.g. student@college.edu"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2 text-xs text-indigo-900">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Codes expire in 15 minutes. Check your inbox and spam folder once sent.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={closeForgotModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={forgotLoading}
                      className="flex-1"
                    >
                      Send Reset Code &rarr;
                    </Button>
                  </div>
                </form>
              ) : (
                /* Step 2: OTP + New Password Form */
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      Code sent to <strong>{forgotEmail}</strong>. You can enter the 6-digit code below or click the direct link in your email.
                    </div>
                  </div>

                  {/* 6-Digit OTP Code */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 text-center">
                      6-Digit Verification Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      disabled={forgotLoading}
                      value={forgotOtp}
                      onChange={(e) => {
                        setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setForgotError("");
                      }}
                      placeholder="••••••"
                      className="w-full py-2.5 text-center font-mono text-2xl font-bold tracking-[0.5em] rounded-xl border border-slate-300 text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-slate-400"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showForgotNewPassword ? "text" : "password"}
                        required
                        disabled={forgotLoading}
                        value={forgotNewPassword}
                        onChange={(e) => {
                          setForgotNewPassword(e.target.value);
                          setForgotError("");
                        }}
                        placeholder="8-16 characters (upper, lower, num, special)"
                        className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordRequirements password={forgotNewPassword} />
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showForgotConfirmPassword ? "text" : "password"}
                        required
                        disabled={forgotLoading}
                        value={forgotConfirmPassword}
                        onChange={(e) => {
                          setForgotConfirmPassword(e.target.value);
                          setForgotError("");
                        }}
                        placeholder="Re-enter new password"
                        className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                    >
                      &larr; Change email
                    </button>
                    <button
                      type="button"
                      disabled={forgotLoading}
                      onClick={handleRequestResetCode}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" /> Resend code
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={closeForgotModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={forgotLoading}
                      className="flex-1"
                    >
                      Reset & Sign In &rarr;
                    </Button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
