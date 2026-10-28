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
  EyeOff
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/common/Button";
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
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get("redirect") || location.state?.from?.pathname || "/dashboard";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    collegeName: "",
    course: COURSES[0].label,
    branch: COURSES[0].label,
    graduationYear: 2028,
    targetRole: TECHNICAL_ROLES[0]
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.collegeName.trim()) {
      setErrorMsg("Please fill in all required fields including your college name.");
      return;
    }

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    const passwordError = validatePasswordStrength(formData.password);
    if (passwordError) {
      setErrorMsg(passwordError);
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await register({
        ...formData,
        degree: formData.course,
        graduationYear: Number(formData.graduationYear)
      });
      showSuccess("Account created successfully! Welcome to Flash.");
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
              <h2 className="text-sm font-bold text-slate-900">Create Free Student Account</h2>
            </div>
          </div>

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
                  Full Name *
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
                  Student Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. harsh@college.edu"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

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
                      Class of {year} {year === 2028 ? "(2028 Batch)" : ""}
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

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-2"
            >
              Complete Registration & Start Practicing <ArrowRight className="w-4 h-4 ml-1" />
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
