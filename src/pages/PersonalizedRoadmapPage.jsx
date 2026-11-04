import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Compass,
  Target,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  ShieldCheck,
  Building2,
  Flame,
  Zap,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronRight,
  Calendar,
  AlertCircle,
  Terminal,
  BookOpen,
  Cpu,
  Database,
  Network,
  Layers,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { useAuth } from "../context/AuthContext";
import { b2cApi } from "../services/b2cApi";

const RECRUITER_OPTIONS = [
  { code: "TCS_NQT", name: "TCS NQT", badge: "Mass Recruiter", threshold: 65, color: "from-blue-600 to-indigo-600" },
  { code: "INFOSYS", name: "Infosys DSE", badge: "Differential Hiring", threshold: 70, color: "from-indigo-600 to-purple-600" },
  { code: "AMAZON", name: "Amazon SDE-1", badge: "Tier-1 Product", threshold: 80, color: "from-amber-600 to-orange-600" },
  { code: "ACCENTURE", name: "Accenture", badge: "Mass Recruiter", threshold: 60, color: "from-purple-600 to-pink-600" },
  { code: "WIPRO", name: "Wipro Elite", badge: "Mass Recruiter", threshold: 60, color: "from-emerald-600 to-teal-600" },
  { code: "COGNIZANT", name: "Cognizant GenC", badge: "Mass Recruiter", threshold: 65, color: "from-cyan-600 to-blue-600" },
  { code: "GENERAL", name: "Full-Stack DSA", badge: "Comprehensive", threshold: 65, color: "from-slate-700 to-slate-900" }
];

const DIAGNOSTIC_QUESTIONS = [
  {
    id: "diag_1",
    domain: "DSA",
    topic: "ARRAYS",
    question: "What is the optimal time complexity to find if a pair exists with target sum in an unsorted array?",
    options: ["O(N^2) using nested loops", "O(N log N) with binary search", "O(N) using a Hash Map", "O(1) with pointer trick"],
    correctIdx: 2,
    explanation: "Using an auxiliary hash set or hash map allows single-pass O(N) lookup of complements."
  },
  {
    id: "diag_2",
    domain: "DSA",
    topic: "TWO_POINTERS",
    question: "Given a sorted array, which algorithmic pattern finds two numbers that sum to target in O(1) space?",
    options: ["Dynamic Programming", "Two Pointers from ends", "Breadth-First Search", "Sliding Window of variable size"],
    correctIdx: 1,
    explanation: "Two pointers initialized at start and end converge inward in O(N) time and O(1) space."
  },
  {
    id: "diag_3",
    domain: "DSA",
    topic: "BINARY_TREES",
    question: "In which tree traversal order are the nodes of a Binary Search Tree visited in sorted ascending order?",
    options: ["Pre-order (Root, Left, Right)", "Post-order (Left, Right, Root)", "In-order (Left, Root, Right)", "Level-order (BFS)"],
    correctIdx: 2,
    explanation: "In-order traversal of a valid BST always yields values in strictly monotonically increasing order."
  },
  {
    id: "diag_4",
    domain: "DSA",
    topic: "DYNAMIC_PROGRAMMING",
    question: "Which characteristic determines whether a problem should be solved via Dynamic Programming rather than Greedy?",
    options: ["Optimal Substructure + Overlapping Subproblems", "Sorted input sequence", "All values are positive integers", "Array size > 1,000,000"],
    correctIdx: 0,
    explanation: "DP requires optimal substructure and overlapping subproblems where local choices do not yield global optimum."
  },
  {
    id: "diag_5",
    domain: "APTITUDE",
    topic: "QUANTITATIVE",
    question: "A train running at 54 km/hr crosses a platform in 20 seconds. If the train length is 120m, what is the platform length?",
    options: ["150 meters", "180 meters", "200 meters", "300 meters"],
    correctIdx: 1,
    explanation: "54 km/hr = 15 m/s. Distance in 20s = 300m. Platform length = 300 - 120 = 180m."
  },
  {
    id: "diag_6",
    domain: "APTITUDE",
    topic: "LOGICAL",
    question: "Pointing to a photograph of a man, Rahul said: 'His mother is the only daughter of my mother.' How is Rahul related to the man?",
    options: ["Brother", "Father", "Maternal Uncle", "Nephew"],
    correctIdx: 2,
    explanation: "Only daughter of Rahul's mother is Rahul's sister. The man's mother is Rahul's sister, so Rahul is maternal uncle."
  },
  {
    id: "diag_7",
    domain: "CORE_CS",
    topic: "OS",
    question: "Which condition is NOT one of Coffman's four conditions required for a Deadlock to occur?",
    options: ["Mutual Exclusion", "Hold and Wait", "No Preemption", "Paging Segmentation"],
    correctIdx: 3,
    explanation: "The 4 Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait."
  },
  {
    id: "diag_8",
    domain: "CORE_CS",
    topic: "DBMS",
    question: "Which SQL clause is executed after aggregation to filter rows returned by a GROUP BY clause?",
    options: ["WHERE", "HAVING", "ORDER BY", "FILTER"],
    correctIdx: 1,
    explanation: "HAVING filters grouped/aggregated rows; WHERE filters individual records prior to aggregation."
  }
];

export function PersonalizedRoadmapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, subscription, planTier, isPaid } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [companyBlueprint, setCompanyBlueprint] = useState(null);
  const [isUpdatingTarget, setIsUpdatingTarget] = useState(false);
  const [selectedDomainTab, setSelectedDomainTab] = useState("ALL"); // ALL | DSA | APTITUDE | CORE_CS
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL"); // ALL | GAP | DEVELOPING | MASTERED
  const [searchQuery, setSearchQuery] = useState("");

  // Target Edit Modal
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetCompanyInput, setTargetCompanyInput] = useState("TCS_NQT");
  const [targetRoleInput, setTargetRoleInput] = useState("Software Engineer");
  const [targetDeadlineInput, setTargetDeadlineInput] = useState("");

  // Diagnostic Modal
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [diagnosticCurrentStep, setDiagnosticCurrentStep] = useState(0);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState({});
  const [diagnosticSubmitting, setDiagnosticSubmitting] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);

  // Fetch candidate personalization profile from backend
  const fetchProfile = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await b2cApi.getPersonalizationProfile();
      if (res && res.profile) {
        setProfile(res.profile);
        setCompanyBlueprint(res.companyBlueprint);
        setTargetCompanyInput(res.profile.targetCompany || "TCS_NQT");
        setTargetRoleInput(res.profile.targetRole || "Software Engineer");
        if (res.profile.targetDeadline) {
          setTargetDeadlineInput(new Date(res.profile.targetDeadline).toISOString().split("T")[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load personalization profile:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update target company
  const handleSelectCompany = async (companyCode) => {
    if (profile?.targetCompany === companyCode) return;
    setIsUpdatingTarget(true);
    try {
      const res = await b2cApi.updatePersonalizationTarget({
        targetCompany: companyCode,
        targetRole: targetRoleInput,
        targetDeadline: targetDeadlineInput || undefined
      });
      if (res && res.profile) {
        setProfile(res.profile);
        setCompanyBlueprint(res.companyBlueprint);
      }
    } catch (err) {
      console.error("Could not switch target recruiter:", err);
    } finally {
      setIsUpdatingTarget(false);
    }
  };

  // Submit Target Edit Form
  const handleSaveTargetModal = async (e) => {
    e.preventDefault();
    setIsUpdatingTarget(true);
    try {
      const res = await b2cApi.updatePersonalizationTarget({
        targetCompany: targetCompanyInput,
        targetRole: targetRoleInput,
        targetDeadline: targetDeadlineInput || undefined
      });
      if (res && res.profile) {
        setProfile(res.profile);
        setCompanyBlueprint(res.companyBlueprint);
        setIsTargetModalOpen(false);
      }
    } catch (err) {
      console.error("Could not update target sprint:", err);
    } finally {
      setIsUpdatingTarget(false);
    }
  };

  // Diagnostic submission handler
  const handleCompleteDiagnostic = async () => {
    setDiagnosticSubmitting(true);
    try {
      let score = 0;
      const sectionScores = { DSA: 0, APTITUDE: 0, CORE_CS: 0 };
      const sectionCounts = { DSA: 0, APTITUDE: 0, CORE_CS: 0 };

      DIAGNOSTIC_QUESTIONS.forEach((q) => {
        sectionCounts[q.domain] = (sectionCounts[q.domain] || 0) + 1;
        if (diagnosticAnswers[q.id] === q.correctIdx) {
          score += 1;
          sectionScores[q.domain] = (sectionScores[q.domain] || 0) + 1;
        }
      });

      // Normalize section scores to 0.0 - 1.0
      const normSectionScores = {};
      Object.keys(sectionScores).forEach((dom) => {
        normSectionScores[dom] = sectionCounts[dom] > 0 ? sectionScores[dom] / sectionCounts[dom] : 0.5;
      });

      const res = await b2cApi.submitDiagnosticAssessment({
        score,
        totalQuestions: DIAGNOSTIC_QUESTIONS.length,
        sectionScores: normSectionScores
      });

      if (res && res.profile) {
        setProfile(res.profile);
        setDiagnosticResult({
          score,
          total: DIAGNOSTIC_QUESTIONS.length,
          readiness: res.profile.overallReadinessIndex
        });
      }
    } catch (err) {
      console.error("Diagnostic submission failed:", err);
    } finally {
      setDiagnosticSubmitting(false);
    }
  };

  // Calculate days remaining to target deadline
  const daysRemaining = useMemo(() => {
    if (!profile?.targetDeadline) return 30;
    const diff = new Date(profile.targetDeadline) - new Date();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  }, [profile?.targetDeadline]);

  // Topic mastery list filtering
  const filteredTopics = useMemo(() => {
    let list = profile?.topicMastery || [];
    if (selectedDomainTab !== "ALL") {
      list = list.filter((t) => t.domain === selectedDomainTab);
    }
    if (selectedStatusFilter === "GAP") {
      list = list.filter((t) => t.masteryScore < 0.35);
    } else if (selectedStatusFilter === "DEVELOPING") {
      list = list.filter((t) => t.masteryScore >= 0.35 && t.masteryScore < 0.70);
    } else if (selectedStatusFilter === "MASTERED") {
      list = list.filter((t) => t.masteryScore >= 0.70);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.topicId.toLowerCase().includes(q));
    }
    return list;
  }, [profile?.topicMastery, selectedDomainTab, selectedStatusFilter, searchQuery]);

  const activeRecruiter = useMemo(() => {
    return RECRUITER_OPTIONS.find((r) => r.code === profile?.targetCompany) || RECRUITER_OPTIONS[0];
  }, [profile?.targetCompany]);

  const readinessScore = profile?.overallReadinessIndex || 15;
  const isTargetAchieved = readinessScore >= (activeRecruiter?.threshold || 65);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Header Banner & Target Recruiter Blueprint Switcher */}
      <div className="rounded-2xl bg-white p-6 sm:p-8 text-slate-900 shadow-xs border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-700 font-mono">
                Placement Intelligence Core
              </span>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> AI Coach Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Baseline Mode
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Adaptive Placement Roadmap
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
              Real-time skill calibration, target recruiter blueprints, and dynamic daily problem recommendations to maximize your placement conversion.
            </p>
          </div>

          {/* Quick Target Info & Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase text-slate-500">Target Role</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate max-w-[140px]">
                {profile?.targetRole || "Software Engineer"}
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase text-slate-500">Sprint Timeline</div>
              <div className="text-sm font-bold text-indigo-600 font-mono mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {daysRemaining} Days Left
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTargetModalOpen(true)}
              className="text-xs"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Edit Sprint
            </Button>
          </div>
        </div>

        {/* Recruiter Selector Pills */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500" /> Select Target Recruiter Blueprint:
            </span>
            {isUpdatingTarget && (
              <span className="text-[11px] font-mono text-purple-600 flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Recalibrating readiness...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {RECRUITER_OPTIONS.map((rec) => {
              const isSelected = profile?.targetCompany === rec.code;
              return (
                <button
                  key={rec.code}
                  disabled={isUpdatingTarget}
                  onClick={() => handleSelectCompany(rec.code)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span>{rec.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {rec.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Placement Readiness Gauge & Diagnostic Callout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Company Placement Readiness Index Card */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Target className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {companyBlueprint?.name || activeRecruiter.name} Readiness Index
                  </h3>
                  <p className="text-xs text-slate-500">
                    Placement probability calculated against {companyBlueprint?.name || activeRecruiter.name} hiring patterns
                  </p>
                </div>
              </div>
              <Badge
                variant={isTargetAchieved ? "success" : "warning"}
                className="text-xs font-bold"
              >
                {isTargetAchieved ? "Placement Ready" : "Gap Detected"}
              </Badge>
            </div>

            {/* Score Display Bar */}
            <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 font-mono">
                    {readinessScore}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Overall Readiness
                  </span>
                </div>
                <div className="text-xs text-right">
                  <span className="font-bold text-slate-700">Target Threshold: </span>
                  <span className="font-bold text-indigo-600 font-mono">{activeRecruiter.threshold}%</span>
                </div>
              </div>

              {/* Multi-step progress bar */}
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    readinessScore >= activeRecruiter.threshold
                      ? "bg-emerald-500"
                      : readinessScore >= 40
                        ? "bg-blue-600"
                        : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, readinessScore))}%` }}
                />
              </div>

              {/* Threshold indicator line */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
                <span>0% Beginner</span>
                <span className="text-indigo-600 font-bold">Cutoff: {activeRecruiter.threshold}%</span>
                <span>100% Expert</span>
              </div>
            </div>

            {/* Domain Mastery Summary Triad */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">DSA Coding</div>
                <div className="text-lg font-bold text-purple-600 font-mono mt-0.5">
                  {Math.round((profile?.dsaMastery || 0.15) * 100)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Aptitude</div>
                <div className="text-lg font-bold text-blue-600 font-mono mt-0.5">
                  {Math.round((profile?.aptitudeMastery || 0.15) * 100)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Core CS</div>
                <div className="text-lg font-bold text-emerald-600 font-mono mt-0.5">
                  {Math.round((profile?.coreCsMastery || 0.15) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Bottom helper text */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Solve recommended daily quests below to elevate your score.</span>
            <span className="font-semibold text-purple-700">Adaptive ELO Active</span>
          </div>
        </Card>

        {/* Right 1 Col: 15-Minute Diagnostic Calibration Card */}
        <Card className="p-6 bg-gradient-to-br from-purple-50/80 via-white to-blue-50/50 border-purple-200/80 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              15-Minute Diagnostic
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {profile?.diagnosticCompleted
                ? `Diagnostic baseline completed! Your score was calibrated at ${profile.diagnosticScore || 6}/8.`
                : "Calibrate your knowledge graph with 8 benchmark questions across Arrays, Trees, Math, and Core CS to instantly generate your custom learning path."}
            </p>

            {profile?.diagnosticCompleted && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Skill Graph Calibrated on {new Date(profile.diagnosticCompletedAt || Date.now()).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-purple-100">
            <Button
              variant={profile?.diagnosticCompleted ? "outline" : "primary"}
              className="w-full text-xs font-bold"
              onClick={() => {
                setDiagnosticCurrentStep(0);
                setDiagnosticAnswers({});
                setDiagnosticResult(null);
                setIsDiagnosticModalOpen(true);
              }}
            >
              <BrainCircuit className="w-4 h-4 mr-1.5" />
              {profile?.diagnosticCompleted ? "Retake Diagnostic" : "Start 15-Min Calibration"}
            </Button>
          </div>
        </Card>
      </div>

      {/* 3. Upsell Banner for Free Tier Users */}
      {!isPaid && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Unlock Full AI Personalization &amp; Weak-Spot Remediation
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold uppercase tracking-wider">
                  From ₹99/mo
                </span>
              </h4>
              <p className="text-xs text-blue-200 mt-0.5">
                Practice all DSA questions 100% free. Upgrade to Standard or Premium for automated recruiter placement blueprints, spaced-repetition queues, and mock interviews.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="whitespace-nowrap bg-white text-slate-900 hover:bg-slate-100 font-bold cursor-pointer"
            onClick={() => navigate("/pricing")}
          >
            Upgrade Plan <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* 4. Today's 3 Focus Quests (Dynamic Daily Focus Queue) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-slate-900">
              Today's Focus Quests
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              (Curated for {activeRecruiter.name})
            </span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => fetchProfile(true)}
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Quests
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(profile?.recommendedDailyQueue || []).length > 0 ? (
            profile.recommendedDailyQueue.map((quest, idx) => {
              const isCoding = quest.type === "CODING";
              const isCompleted = quest.completed;

              return (
                <Card
                  key={quest.questionId || idx}
                  className={`p-5 flex flex-col justify-between transition-all ${
                    isCompleted
                      ? "bg-slate-50/70 border-emerald-200"
                      : "hover:border-purple-300 hover:shadow-xs"
                  }`}
                >
                  <div>
                    {/* Header Pill & Difficulty */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        Quest #{idx + 1} • {quest.type}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          quest.difficulty === "HARD"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : quest.difficulty === "MEDIUM"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {quest.difficulty}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      {quest.title}
                    </h4>

                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {quest.reason}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <Check className="w-4 h-4 stroke-[2.5]" /> Completed
                      </span>
                    ) : (
                      <Button
                        size="xs"
                        variant="primary"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                        onClick={() => {
                          if (isCoding) {
                            navigate(`/coding?search=${encodeURIComponent(quest.topicId)}`);
                          } else {
                            navigate(`/practice/mcq?topic=${encodeURIComponent(quest.topicId)}`);
                          }
                        }}
                      >
                        Solve Quest <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-3 p-8 text-center bg-white border border-slate-200 rounded-2xl">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Generating today's adaptive quests...</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Interactive Skill Knowledge Graph & Mastery Matrix */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Knowledge Graph &amp; Topic Mastery
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual skill ratings calibrated by Bayesian Knowledge Tracing across {filteredTopics.length} placement topics
            </p>
          </div>

          {/* Domain Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {["ALL", "DSA", "APTITUDE", "CORE_CS"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedDomainTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDomainTab === tab
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topic (e.g. Arrays, Trees, Quant)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: "ALL", label: "All Skills" },
              { id: "GAP", label: "Gaps (<35%)" },
              { id: "DEVELOPING", label: "Developing (35-70%)" },
              { id: "MASTERED", label: "Mastered (>70%)" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                  selectedStatusFilter === f.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTopics.map((topic) => {
            const masteryPercent = Math.round(topic.masteryScore * 100);
            const isGap = topic.masteryScore < 0.35;
            const isMastered = topic.masteryScore >= 0.70;

            return (
              <div
                key={topic.topicId}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      {topic.domain}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isMastered
                          ? "bg-emerald-50 text-emerald-700"
                          : isGap
                            ? "bg-rose-50 text-rose-700"
                            : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {isMastered ? "Mastered" : isGap ? "Critical Gap" : "Developing"}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">
                    {topic.topicId.replace(/_/g, " ")}
                  </h4>

                  {/* Mastery Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                      <span className="text-slate-500">Mastery</span>
                      <span className="font-bold text-slate-900">{masteryPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMastered
                            ? "bg-emerald-500"
                            : isGap
                              ? "bg-rose-500"
                              : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.max(5, masteryPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Attempts & Solves */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2.5">
                    <span>{topic.successfulSolves} Solves ({topic.totalAttempts} Attempts)</span>
                    {topic.avgTimeSeconds > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {Math.round(topic.avgTimeSeconds / 60)}m avg
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="xs"
                    className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-bold justify-between"
                    onClick={() => {
                      if (topic.domain === "DSA") {
                        navigate(`/coding?search=${encodeURIComponent(topic.topicId)}`);
                      } else {
                        navigate(`/practice/mcq?topic=${encodeURIComponent(topic.topicId)}`);
                      }
                    }}
                  >
                    <span>Practice Challenges</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Target Sprint Edit Modal */}
      <Modal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        title="Customize Placement Sprint"
        subtitle="Configure your target recruiter and placement drive timeline"
      >
        <form onSubmit={handleSaveTargetModal} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Company</label>
            <select
              value={targetCompanyInput}
              onChange={(e) => setTargetCompanyInput(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-slate-400"
            >
              {RECRUITER_OPTIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.badge})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Role</label>
            <input
              type="text"
              value={targetRoleInput}
              onChange={(e) => setTargetRoleInput(e.target.value)}
              placeholder="e.g. Software Engineer, SDE-1"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Drive Date</label>
            <input
              type="date"
              value={targetDeadlineInput}
              onChange={(e) => setTargetDeadlineInput(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTargetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isUpdatingTarget}
            >
              Save Sprint Settings
            </Button>
          </div>
        </form>
      </Modal>

      {/* 15-Minute Diagnostic Assessment Modal */}
      <Modal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
        title="15-Minute Diagnostic Baseline"
        subtitle={
          diagnosticResult
            ? "Calibration results and initial readiness index"
            : `Question ${diagnosticCurrentStep + 1} of ${DIAGNOSTIC_QUESTIONS.length}`
        }
        maxWidth="max-w-2xl"
      >
        {diagnosticResult ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Diagnostic Complete!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You scored {diagnosticResult.score} / {diagnosticResult.total} questions correctly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 max-w-sm mx-auto">
              <div className="text-xs font-bold text-purple-900">Calibrated Placement Readiness</div>
              <div className="text-3xl font-black text-purple-700 font-mono mt-1">
                {diagnosticResult.readiness}%
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full max-w-xs mx-auto"
                onClick={() => setIsDiagnosticModalOpen(false)}
              >
                View Updated Roadmap
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Step progress bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all"
                style={{
                  width: `${((diagnosticCurrentStep + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%`
                }}
              />
            </div>

            {/* Current Question */}
            {(() => {
              const currentQ = DIAGNOSTIC_QUESTIONS[diagnosticCurrentStep];
              const selectedAnswer = diagnosticAnswers[currentQ.id];

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {currentQ.domain} • {currentQ.topic}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {currentQ.question}
                  </h4>

                  <div className="space-y-2">
                    {currentQ.options.map((opt, oIdx) => {
                      const isOptionSelected = selectedAnswer === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => {
                            setDiagnosticAnswers({
                              ...diagnosticAnswers,
                              [currentQ.id]: oIdx
                            });
                          }}
                          className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                            isOptionSelected
                              ? "border-purple-600 bg-purple-50/70 text-purple-950 font-bold"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span>{opt}</span>
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isOptionSelected
                                ? "border-purple-600 bg-purple-600 text-white"
                                : "border-slate-300"
                            }`}
                          >
                            {isOptionSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation controls */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={diagnosticCurrentStep === 0}
                      onClick={() => setDiagnosticCurrentStep((s) => Math.max(0, s - 1))}
                    >
                      Previous
                    </Button>

                    {diagnosticCurrentStep < DIAGNOSTIC_QUESTIONS.length - 1 ? (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={selectedAnswer === undefined}
                        onClick={() => setDiagnosticCurrentStep((s) => s + 1)}
                      >
                        Next Question <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={selectedAnswer === undefined}
                        loading={diagnosticSubmitting}
                        onClick={handleCompleteDiagnostic}
                      >
                        Submit Calibration
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
