import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Code2,
  TrendingUp,
  Award,
  RefreshCw,
  ExternalLink,
  Copy,
  Zap,
  ArrowRight,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { b2cApi } from '../services/b2cApi';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

const SAMPLE_RESUME_TEXT = `Harshvardhan Sharma
Email: harsh.sharma@college.edu | Phone: +91 98765 43210
GitHub: github.com/harsh-dev2028 | LinkedIn: linkedin.com/in/harsh-sharma2028

EDUCATION
B.Tech in Computer Science & Engineering | 2024 - 2028 | CGPA: 8.75
National Institute of Technology

TECHNICAL SKILLS
Languages: Python, JavaScript, C++, SQL, HTML, CSS
Frameworks & Libraries: React, Node.js, Express, Tailwind CSS, Redis
Tools & Core Concepts: Git, GitHub, Docker, Data Structures, Algorithms, System Design, REST API

PROJECTS
Flash Career Platform — Full Stack Engineer
- Built and optimized responsive student career intelligence portal with React, Node.js, and MongoDB.
- Engineered automated code execution evaluation sandbox in C++ and Docker with sub-second execution limits.
- Implemented real-time conversational voice interview module leveraging Gemini Live audio pipelines.

High-Throughput In-Memory Cache — Systems Engineer
- Architected a concurrent key-value cache engine in C++ with LRU eviction and thread-safe read-write locks.
- Benchmarked and improved read throughput to over 120,000 requests per second under peak load.

EXPERIENCE & LEADERSHIP
Technical Lead, Campus Open Source Club (2025 - Present)
- Mentored 120+ first-year and second-year students on Git workflows, competitive programming, and web development.
- Organized 3 college-wide hackathons with 450+ cumulative participants.`;

export function ResumeOptimizerPage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'text' | 'results'
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME_TEXT);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      addToast(`Selected ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      let res = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('resume', selectedFile);
        formData.append('filename', selectedFile.name);
        res = await b2cApi.analyzeResume(formData);
      } else {
        res = await b2cApi.analyzeResume({
          resumeText,
          filename: 'candidate_resume.txt'
        });
      }

      if (res && res.success) {
        setAnalysisResult(res.analysis);
        setActiveTab('results');
        addToast('Resume successfully analyzed by Flash ATS engine!', 'success');

        // Sync detected skills into user profile if available
        if (res.analysis?.detectedSkills && res.analysis.detectedSkills.length > 0) {
          try {
            await b2cApi.updateProfile({ skills: res.analysis.detectedSkills });
            updateUser({ skills: res.analysis.detectedSkills });
          } catch (e) {
            // Non-critical profile update
          }
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to analyze resume.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 stroke-emerald-400 border-emerald-500/30';
    if (score >= 60) return 'text-indigo-400 stroke-indigo-400 border-indigo-500/30';
    if (score >= 40) return 'text-amber-400 stroke-amber-400 border-amber-500/30';
    return 'text-rose-400 stroke-rose-400 border-rose-500/30';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <FileText className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  ATS Resume Optimizer
                  <Badge variant="primary">Campus Batch 2028 Calibrated</Badge>
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Benchmarked against applicant tracking systems from Google, Microsoft, Amazon, and leading enterprise campus recruiters.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'upload' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('upload')}
            >
              Upload PDF / DOCX
            </Button>
            <Button
              variant={activeTab === 'text' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('text')}
            >
              Edit Raw Text
            </Button>
            {analysisResult && (
              <Button
                variant={activeTab === 'results' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('results')}
              >
                View ATS Report
              </Button>
            )}
          </div>
        </div>

        {/* INPUT TABS */}
        {activeTab !== 'results' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Input Card */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'upload' ? (
                <Card className="p-8 border-dashed border-2 border-slate-700/80 hover:border-indigo-500/50 transition-all text-center">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Drag & drop your resume file</h3>
                      <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, or UTF-8 Plain Text (Max 5MB)</p>
                    </div>

                    <label className="inline-block cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <span className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2">
                        Browse Files
                      </span>
                    </label>

                    {selectedFile && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-indigo-300 flex items-center justify-between">
                        <span>{selectedFile.name}</span>
                        <Badge variant="success">Ready</Badge>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-indigo-400" />
                      Paste or Modify Resume Markdown / Plain Text
                    </div>
                    <button
                      onClick={() => setResumeText(SAMPLE_RESUME_TEXT)}
                      className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Load Sample 2028 SDE Resume
                    </button>
                  </div>

                  <textarea
                    rows={16}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                    placeholder="Paste resume content here..."
                  />
                </Card>
              )}

              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  isLoading={analyzing}
                  className="shadow-xl shadow-indigo-600/20"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Run Instant ATS Scan & Optimization
                </Button>
              </div>
            </div>

            {/* Sidebar Guide */}
            <div className="space-y-6">
              <Card className="p-6 space-y-4">
                <CardHeader
                  title="What Flash ATS Looks For"
                  subtitle="Calibrated for campus hiring algorithms"
                />
                
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white block">Standard Structural Anchors</strong>
                      Clear headers for Education, Projects, Skills, and Experience.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white block">Verified Technical Keywords</strong>
                      Matching exact terms (e.g. C++, React, Docker, Redis, System Design).
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white block">Quantified Action Verbs</strong>
                      Numbers, percentages, and metrics indicating real engineering impact.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white block">Verified Public Profiles</strong>
                      Direct GitHub code repos and personalized LinkedIn URL.
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* RESULTS REPORT TAB */}
        {activeTab === 'results' && analysisResult && (
          <div className="space-y-8">
            
            {/* Top Score Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-8 shadow-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div>
                  <Badge variant="primary" className="mb-2">ATS Audit Report</Badge>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Resume Compatibility Analysis
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Scanned {analysisResult.detectedSkills?.length || 0} technical skills and evaluated 6 structural hiring criteria.
                  </p>
                </div>

                <div className={`flex items-center gap-4 bg-slate-950/90 border px-8 py-4 rounded-3xl ${getScoreColor(analysisResult.atsScore)}`}>
                  <div className="text-center">
                    <div className="text-5xl font-black font-mono">
                      {analysisResult.atsScore}%
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                      ATS Match Score
                    </div>
                  </div>
                </div>
              </div>

              {/* Structural Review Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
                {[
                  { label: 'Contact Info', passed: analysisResult.structuralReview?.hasContactInfo },
                  { label: 'GitHub / LinkedIn', passed: analysisResult.structuralReview?.hasSocialLinks },
                  { label: 'Education Section', passed: analysisResult.structuralReview?.hasEducationSection },
                  { label: 'Projects Section', passed: analysisResult.structuralReview?.hasProjectsSection },
                  { label: 'Work Experience', passed: analysisResult.structuralReview?.hasExperienceSection },
                  { label: `${analysisResult.structuralReview?.actionVerbCount || 0} Action Verbs`, passed: (analysisResult.structuralReview?.actionVerbCount || 0) >= 3 }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      item.passed
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex justify-center mb-1.5">
                      {item.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      )}
                    </div>
                    <div className="text-xs font-semibold">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Detected Skills Chips */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-400" /> Detected Technical Skills ({analysisResult.detectedSkills?.length || 0})
                  </h3>
                  <Badge variant="success" className="text-xs">Synced with Student Profile</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.detectedSkills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actionable Suggestions */}
              <div className="mt-8 p-6 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-3">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> High-Impact ATS Optimization Suggestions
                </h3>
                <ul className="space-y-2.5">
                  {analysisResult.suggestions?.map((sug, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0"></span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  Tip: Update your resume in the editor and rerun the scan to push your score above 90%.
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setActiveTab('text')}>
                    Tweak Resume in Editor
                  </Button>
                  <Link to="/practice">
                    <Button>
                      Practice Weak Areas in Practice Hub <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
export default ResumeOptimizerPage;
