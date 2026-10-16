import React, { useState } from "react";
import { Link } from "react-router-dom";
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
  Edit3,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { b2cApi } from "../services/b2cApi";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";

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
  const { showSuccess, showError, showInfo } = useToast();

  const [activeTab, setActiveTab] = useState("upload"); // 'upload' | 'text' | 'results'
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME_TEXT);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      showInfo(`Selected ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      let res = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("resume", selectedFile);
        formData.append("filename", selectedFile.name);
        res = await b2cApi.analyzeResume(formData);
      } else {
        res = await b2cApi.analyzeResume({
          resumeText,
          filename: "candidate_resume.txt"
        });
      }

      if (res && res.success) {
        setAnalysisResult(res.analysis);
        setActiveTab("results");
        showSuccess("Resume successfully scanned by Flash ATS engine!");

        if (res.analysis?.detectedSkills && res.analysis.detectedSkills.length > 0) {
          try {
            await b2cApi.updateProfile({ skills: res.analysis.detectedSkills });
            updateUser({ skills: res.analysis.detectedSkills });
          } catch (e) {}
        }
      }
    } catch (err) {
      showError(err.message || "Failed to analyze resume.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 border border-sky-100 text-sky-600">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ATS Resume Optimizer
            </h1>
            <Badge variant="blue">Batch 2028 Calibrated</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "upload" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveTab("upload")}
          >
            Upload Document
          </Button>
          <Button
            variant={activeTab === "text" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveTab("text")}
          >
            Edit Resume Text
          </Button>
          {analysisResult && (
            <Button
              variant={activeTab === "results" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab("results")}
            >
              View Report
            </Button>
          )}
        </div>
      </div>

      {/* INPUT STAGE */}
      {activeTab !== "results" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            {activeTab === "upload" ? (
              <Card className="p-10 border-2 border-dashed border-slate-200 hover:border-indigo-400 text-center transition-all">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Upload Your Resume</h3>
                    <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, or Plain Text (Max 5MB)</p>
                  </div>

                  <label className="inline-block cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <span className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm shadow-indigo-200 inline-flex items-center gap-2">
                      Choose File
                    </span>
                  </label>

                  {selectedFile && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-indigo-700 flex items-center justify-between">
                      <span className="truncate">{selectedFile.name}</span>
                      <Badge variant="success" size="sm">Ready to scan</Badge>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-indigo-600" /> Resume Plain Text / Markdown
                  </span>
                  <button
                    onClick={() => setResumeText(SAMPLE_RESUME_TEXT)}
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Load Sample 2028 SDE Resume
                  </button>
                </div>

                <textarea
                  rows={14}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 leading-relaxed"
                />
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                size="md"
                variant="primary"
                loading={analyzing}
                onClick={handleAnalyze}
              >
                <Sparkles className="w-4 h-4 mr-1.5" /> Run Instant ATS Scan & Optimization
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <CardHeader
                title="What Flash ATS Evaluates"
              />
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Structural Anchors</strong>
                    Contact details, Education, Projects, and Skills headers.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Extracted Tech Keywords</strong>
                    Exact programming languages, frameworks, and system tools.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Quantified Impact</strong>
                    Numbers and metrics demonstrating engineering results.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* RESULTS STAGE */}
      {activeTab === "results" && analysisResult && (
        <Card className="p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <Badge variant="blue" className="mb-1">ATS Compatibility Audit</Badge>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Resume Performance Report
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated against enterprise hiring thresholds for campus technical roles.
              </p>
            </div>

            <div className="p-4 px-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
              <div className="text-4xl font-black text-indigo-600 font-mono">
                {analysisResult.atsScore}%
              </div>
              <div className="text-[10px] uppercase font-bold text-indigo-700">ATS Match Score</div>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Structural Checklist</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Contact Info", passed: analysisResult.structuralReview?.hasContactInfo },
                { label: "GitHub / LinkedIn", passed: analysisResult.structuralReview?.hasSocialLinks },
                { label: "Education", passed: analysisResult.structuralReview?.hasEducationSection },
                { label: "Projects", passed: analysisResult.structuralReview?.hasProjectsSection },
                { label: "Work Experience", passed: analysisResult.structuralReview?.hasExperienceSection },
                { label: `${analysisResult.structuralReview?.actionVerbCount || 0} Action Verbs`, passed: (analysisResult.structuralReview?.actionVerbCount || 0) >= 3 }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    item.passed
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    {item.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div className="text-xs font-semibold">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Skills */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Detected Skills ({analysisResult.detectedSkills?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysisResult.detectedSkills?.map((skill, i) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Actionable Recommendations
            </h4>
            <ul className="space-y-2 text-xs text-amber-950">
              {analysisResult.suggestions?.map((sug, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Edit your resume and rescan to reach 90%+ compatibility.</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("text")}>Edit in Text Area</Button>
              <Link to="/practice">
                <Button size="sm">Practice Weak Areas in Hub <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}

export default ResumeOptimizerPage;
