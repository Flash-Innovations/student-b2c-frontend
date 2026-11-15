import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Ticket,
  Key,
  CheckCircle2,
  ShieldCheck,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/common/Button";
import { GoogleAuthButton } from "../components/common/GoogleAuthButton";
import { b2cApi } from "../services/b2cApi";
import { validatePasswordStrength } from "../utils/passwordPolicy";
import { PasswordRequirements } from "../components/common/PasswordRequirements";

const POPULAR_COLLEGES_SUGGESTIONS = [
  "Indian Institute of Technology (IIT)",
  "National Institute of Technology (NIT)",
  "Birla Institute of Technology and Science (BITS)",
  "Vellore Institute of Technology (VIT)",
  "RV College of Engineering (RVCE)",
  "Delhi Technological University (DTU)",
  "SRM Institute of Science and Technology",
  "Manipal Institute of Technology",
  "Thapar Institute of Engineering and Technology",
  "PSG College of Technology",
  "Symbiosis International University",
  "Flash Student Open Community"
];

const COURSES = [
  { id: "btech", label: "B.Tech / B.E.", category: "technical" },
  { id: "bca", label: "BCA", category: "technical" },
  { id: "mca", label: "MCA", category: "technical" },
  { id: "mtech", label: "M.Tech", category: "technical" },
  { id: "bba", label: "BBA", category: "business" },
  { id: "mba", label: "MBA", category: "business" },
  { id: "other", label: "Other Degree", category: "other" }
];

const GRADUATION_BATCHES = [
  2024,
  2025,
  2026,
  2027,
  2028,
  2029,
  2030
];

const TECHNICAL_ROLES = [
  "Software Development Engineer (SDE-1)",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst / Data Scientist",
  "AI / Machine Learning Engineer",
  "Cloud & DevOps Engineer",
  "QA / Automation Testing Engineer",
  "Cybersecurity Analyst",
  "Systems / Embedded Engineer",
  "Other Technical Role"
];

const BUSINESS_ROLES = [
  "Management Trainee",
  "Business Analyst",
  "Product Management Associate",
  "Marketing & Growth Specialist",
  "Financial Analyst / FinTech",
  "Human Resources (HR) Specialist",
  "Operations & Supply Chain Associate",
  "Sales & Business Development",
  "Strategy & Consulting Analyst",
  "Other Management Role"
];

const OTHER_ROLES = [
  ...TECHNICAL_ROLES.slice(0, 5),
  ...BUSINESS_ROLES.slice(0, 5),
  "General Associate / Trainee"
];

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function RegisterPage() {
  const { register, googleSignIn, googleRegister } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get("redirect") || location.state?.from?.pathname || "/dashboard";

  const [googleAuthData, setGoogleAuthData] = useState(() => {
    if (location.state?.googleUser && location.state?.credential) {
      return {
        googleUser: location.state.googleUser,
        credential: location.state.credential
      };
    }
    return null;
  });

  const [formData, setFormData] = useState({
    name: location.state?.googleUser?.name || "",
    email: location.state?.googleUser?.email || "",
    password: "",
    collegeName: "",
    course: COURSES[0].label,
    branch: COURSES[0].label,
    graduationYear: new Date().getFullYear() + 1,
    targetRole: TECHNICAL_ROLES[0]
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Populate Google Auth data if navigated from login or external state
  React.useEffect(() => {
    if (location.state?.googleUser && location.state?.credential) {
      setGoogleAuthData({
        googleUser: location.state.googleUser,
        credential: location.state.credential
      });
      setFormData((prev) => ({
        ...prev,
        name: location.state.googleUser.name || prev.name,
        email: location.state.googleUser.email || prev.email
      }));
    }
  }, [location.state]);

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    setErrorMsg("");
    try {
      // First check if the user is already registered!
      const data = await googleSignIn(credential);
      if (data?.token && !data?.isNewUser) {
        showSuccess(`Welcome back, ${data.user?.name || "Student"}!`);
        navigate(redirectTarget, { replace: true });
        return;
      }

      // New Google student: pre-fill verified name and email, ask for missing placement credentials
      const gUser = data?.googleUser || {};
      setGoogleAuthData({
        googleUser: gUser,
        credential
      });
      setFormData((prev) => ({
        ...prev,
        name: gUser.name || prev.name,
        email: gUser.email || prev.email
      }));
      showSuccess("Google account linked! Please enter your academic details below.");
    } catch (err) {
      const msg = err.message || "Failed to authenticate with Google.";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (err) => {
    const msg = err?.message || "Google authentication was cancelled or could not be completed.";
    setErrorMsg(msg);
    showError(msg);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleCourseChange = (e) => {
    const selectedCourseLabel = e.target.value;
    const selectedCourse = COURSES.find((c) => c.label === selectedCourseLabel);
    let rolesForCourse = TECHNICAL_ROLES;
    if (selectedCourse?.category === "business") {
      rolesForCourse = BUSINESS_ROLES;
    } else if (selectedCourse?.category === "other") {
      rolesForCourse = OTHER_ROLES;
    }

    setFormData((prev) => ({
      ...prev,
      course: selectedCourseLabel,
      branch: selectedCourseLabel,
      targetRole: rolesForCourse[0]
    }));
    setErrorMsg("");
  };

  const currentCourseObj = COURSES.find((c) => c.label === formData.course);
  const activeRoles =
    currentCourseObj?.category === "business"
      ? BUSINESS_ROLES
      : currentCourseObj?.category === "other"
      ? OTHER_ROLES
      : TECHNICAL_ROLES;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.name.trim()) {
      const msg = "Please enter your full name.";
      setErrorMsg(msg);
      showError(msg);
      return;
    }

    if (!formData.email.trim()) {
      const msg = "Please enter your student email address.";
      setErrorMsg(msg);
      showError(msg);
      return;
    }

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      const msg = "Please enter a valid email address.";
      setErrorMsg(msg);
      showError(msg);
      return;
    }

    // Password is only required when signing up with standard email/password
    if (!googleAuthData) {
      if (!formData.password) {
        const msg = "Please create a password.";
        setErrorMsg(msg);
        showError(msg);
        return;
      }

      const passwordError = validatePasswordStrength(formData.password);
      if (passwordError) {
        setErrorMsg(passwordError);
        showError(passwordError);
        return;
      }
    }

    if (!formData.collegeName.trim()) {
      const msg = "Please enter your college or institution name.";
      setErrorMsg(msg);
      showError(msg);
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      if (googleAuthData) {
        await googleRegister({
          credential: googleAuthData.credential,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          collegeName: formData.collegeName.trim(),
          course: formData.course,
          degree: formData.course,
          branch: formData.branch,
          graduationYear: Number(formData.graduationYear),
          targetRole: formData.targetRole
        });
        showSuccess(`Account created successfully! Welcome to Flash, ${formData.name.trim()}!`);
      } else {
        await register({
          ...formData,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          collegeName: formData.collegeName.trim(),
          degree: formData.course,
          graduationYear: Number(formData.graduationYear)
        });
        showSuccess("Account created successfully! Welcome to Flash.");
      }
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const msg = err.message || "Registration failed. Please try again.";
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="flex justify-center mb-3">
          <img
            src="/branding/flash-logo-full.png"
            alt="FLASH"
            className="h-16 w-auto max-w-[240px] sm:max-w-[280px] object-contain cursor-pointer transition-transform hover:scale-105"
            onClick={() => navigate("/login")}
          />
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Main Card */}
        <div className="bg-white py-7 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {googleAuthData ? "Complete Student Registration" : "Create Free Student Account"}
              </h2>
            </div>
          </div>

          {/* Connected Google Account Banner */}
          {googleAuthData ? (
            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 mb-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {googleAuthData.googleUser?.avatar ? (
                    <img
                      src={googleAuthData.googleUser.avatar}
                      alt="Google Avatar"
                      className="w-10 h-10 rounded-full border border-emerald-300 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      {(googleAuthData.googleUser?.name || "G")[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">
                        {googleAuthData.googleUser?.name || formData.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Google Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {googleAuthData.googleUser?.email || formData.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGoogleAuthData(null);
                    setFormData((prev) => ({ ...prev, name: "", email: "" }));
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline decoration-slate-300 cursor-pointer"
                >
                  Use other email
                </button>
              </div>
              <p className="mt-2 text-[11px] text-emerald-800 font-medium">
                Verified via Google. Complete the remaining academic fields below to activate your account.
              </p>
            </div>
          ) : (
            <>
              {/* Google Sign Up Button */}
              <div className="mb-3">
                <GoogleAuthButton
                  mode="signup"
                  label="Sign up with Google"
                  disabled={loading}
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2.5 text-slate-400 font-semibold tracking-wider">
                    Or register with student email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name * {googleAuthData && <span className="text-emerald-600 font-normal lowercase">(from Google)</span>}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Harshvardhan Sharma"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Student Email * {googleAuthData && <span className="text-emerald-600 font-normal lowercase">(Google verified)</span>}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    required
                    readOnly={Boolean(googleAuthData)}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. harsh@college.edu"
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400 ${googleAuthData ? "bg-slate-50 cursor-not-allowed text-slate-600" : ""}`}
                  />
                </div>
              </div>
            </div>

            {!googleAuthData ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="8-16 characters (upper, lower, num, special)"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordRequirements password={formData.password} />
              </div>
            ) : (
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-900">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Google Authentication Active:</strong> Sign in securely with your Google account. No separate password needed.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  College / Institution *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="collegeName"
                    list="popular-colleges"
                    required
                    value={formData.collegeName}
                    onChange={handleChange}
                    placeholder="Enter your college / university name"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400"
                  />
                  <datalist id="popular-colleges">
                    {POPULAR_COLLEGES_SUGGESTIONS.map((col, idx) => (
                      <option key={idx} value={col} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Course / Degree *
                </label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleCourseChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-900 font-medium"
                >
                  {COURSES.map((c) => (
                    <option key={c.id} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Graduation Batch *
                </label>
                <select
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-900 font-medium"
                >
                  {GRADUATION_BATCHES.map((year) => (
                    <option key={year} value={year}>
                      Class of {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Career Role *
                </label>
                <select
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-900 font-medium"
                >
                  {activeRoles.map((role, idx) => (
                    <option key={idx} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              onClick={handleSubmit}
              className="w-full mt-2 flex items-center justify-center gap-2"
            >
              <span>{googleAuthData ? "Complete Registration with Google" : "Complete Registration & Start Practicing"}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Button>

          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              to={redirectTarget !== "/dashboard" ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : "/login"}
              className="font-bold text-indigo-600 hover:text-indigo-700"
            >
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
