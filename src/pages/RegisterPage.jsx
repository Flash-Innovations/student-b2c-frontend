import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Mail,
  Lock,
  User,
  GraduationCap,
  Building,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export function RegisterPage() {
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    collegeName: '',
    graduationYear: '2028',
    degree: 'B.Tech / B.E.',
    branch: 'Computer Science & Engineering',
    phone: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      showError('Please fill in your name, email, and password.');
      return;
    }

    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }

    if (!formData.collegeName.trim()) {
      showError('Please enter your college or university name.');
      return;
    }

    setLoading(true);
    try {
      const data = await register(formData);
      showSuccess('Account created! Welcome to the Flash 2028 Cohort.');
      navigate('/dashboard');
    } catch (err) {
      showError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-extrabold text-2xl text-white font-heading">FLASH</span>
          </Link>

          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-white font-heading">Join the Student Platform</h2>
            <Badge variant="indigo">Batch of 2028</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Open self-registration. Get instant free access to MCQs, coding compiler, and ATS scoring.
          </p>
        </div>

        {/* Card Form */}
        <Card className="border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@college.edu or gmail"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* College / Institution */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">College / University Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  placeholder="e.g. National Institute of Technology, Trichy"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Graduation Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Graduation Passing Year</label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="2028">2028 (Target Cohort)</option>
                    <option value="2027">2027</option>
                    <option value="2026">2026</option>
                    <option value="2029">2029</option>
                  </select>
                </div>
              </div>

              {/* Branch / Stream */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Branch / Specialization</label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science, AI/ML, ECE"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Free Plan Auto-inclusion note */}
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-white">Free Plan Included:</span> 100 overall MCQs, 50 DSA practice problems on Judge0, and ATS resume scoring activated immediately.
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>Already have an account? </span>
            <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
