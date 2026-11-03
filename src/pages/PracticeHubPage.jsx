import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  Calculator,
  Compass,
  BookOpen,
  Database,
  Cpu,
  Network,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock,
  Clock,
  Terminal,
  Search,
  Building2,
  ShieldCheck
} from "lucide-react";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { useAuth } from "../context/AuthContext";
import { practiceApi } from "../services/practiceApi";

const PRACTICE_TOPICS = [
  {
    id: "QUANTITATIVE",
    name: "Quantitative Aptitude",
    category: "Aptitude",
    icon: Calculator,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    questionCount: 320,
    difficulty: "Medium",
    topics: ["Profit & Loss", "Time & Work", "Percentages", "Permutation & Combination", "Probability"]
  },
  {
    id: "LOGICAL",
    name: "Logical Reasoning",
    category: "Aptitude",
    icon: Compass,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    questionCount: 280,
    difficulty: "Medium",
    topics: ["Blood Relations", "Direction Sense", "Syllogisms", "Coding-Decoding", "Seating Arrangement"]
  },
  {
    id: "VERBAL",
    name: "Verbal Ability & English",
    category: "Aptitude",
    icon: BookOpen,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    questionCount: 240,
    difficulty: "Easy-Medium",
    topics: ["Reading Comprehension", "Error Spotting", "Sentence Correction", "Para Jumbles", "Vocabulary"]
  },
  {
    id: "DBMS",
    name: "Database Management (DBMS)",
    category: "Core CS",
    technicalOnly: true,
    icon: Database,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    questionCount: 190,
    difficulty: "Medium-Hard",
    topics: ["SQL Queries", "Normalization (1NF-BCNF)", "Indexing & B-Trees", "ACID Transactions", "Concurreny"]
  },
  {
    id: "OS",
    name: "Operating Systems",
    category: "Core CS",
    technicalOnly: true,
    icon: Cpu,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    questionCount: 180,
    difficulty: "Medium",
    topics: ["Process Scheduling", "Deadlocks & Semaphores", "Virtual Memory & Paging", "Threading", "File Systems"]
  },
  {
    id: "NETWORKS",
    name: "Computer Networks",
    category: "Core CS",
    technicalOnly: true,
    icon: Network,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    questionCount: 160,
    difficulty: "Medium",
    topics: ["OSI & TCP/IP Models", "Routing Protocols", "DNS & HTTP/HTTPS", "Subnetting & CIDR", "Socket Programming"]
  },
  {
    id: "OOP",
    name: "Object-Oriented Programming",
    category: "Core CS",
    technicalOnly: true,
    icon: Layers,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    questionCount: 210,
    difficulty: "Medium",
    topics: ["Inheritance & Polymorphism", "Encapsulation", "SOLID Principles", "Design Patterns", "Abstract Classes"]
  },
  {
    id: "DI_ANALYTICS",
    name: "Data Interpretation & Analysis",
    category: "Aptitude",
    icon: Layers,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    questionCount: 220,
    difficulty: "Medium",
    topics: ["Tables & Bar Charts", "Pie Charts", "Caselets", "Data Sufficiency", "Trend Analysis"]
  },
  {
    id: "BUSINESS_GK",
    name: "Business & Management Foundations",
    category: "Management",
    businessOnly: true,
    icon: BookOpen,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    questionCount: 190,
    difficulty: "Medium",
    topics: ["Business Strategy", "Financial Terminology", "Marketing Principles", "Organizational Behavior", "Case Analysis"]
  }
];

export const COMPANY_PACKS = [
  {
    id: "TCS_NQT",
    code: "TCS NQT",
    mockContestId: "TCS_NQT_MOCK",
    name: "TCS NQT Placement Vault",
    company: "TCS NQT",
    difficulty: "Moderate",
    badge: "Mass Recruiter",
    examDuration: "80 Mins",
    totalMarks: 100,
    description: "Curated aptitude, numerical reasoning, verbal ability, and hands-on coding problems following the latest TCS NQT National Qualifier test pattern.",
    topics: ["Numerical Ability", "Verbal Reasoning", "Advanced Coding", "Cognitive Assessment"],
    questionCount: 180,
    priceInr: 99,
    rounds: [
      { id: "r1", name: "Numerical Ability", topic: "QUANTITATIVE", category: "Aptitude", count: "26 Qs", desc: "Percentages, Profit & Loss, Speed & Distance, Number Systems" },
      { id: "r2", name: "Verbal Ability", topic: "VERBAL", category: "Verbal", count: "24 Qs", desc: "Sentence completion, Error spotting, Reading comprehension" },
      { id: "r3", name: "Reasoning Ability", topic: "LOGICAL", category: "Logical", count: "30 Qs", desc: "Syllogisms, Blood relations, Direction sense, Seating" },
      { id: "r4", name: "Hands-on Coding", topic: "CODING", category: "Coding", count: "2 Problems", isCoding: true, desc: "Arrays, String manipulation, Matrix transformations" }
    ]
  },
  {
    id: "INFOSYS",
    code: "Infosys",
    mockContestId: "INFOSYS_SP_MOCK",
    name: "Infosys DSE & SP Archive",
    company: "Infosys",
    difficulty: "Medium-Hard",
    badge: "Specialist Programmer",
    examDuration: "54 Mins",
    totalMarks: 100,
    description: "Cryptarithmetic, mathematical critical thinking, data structures, and algorithmic problems for Infosys Specialist Programmer and DSE recruitment drives.",
    topics: ["Cryptarithmetic", "Critical Reasoning", "Advanced DSA", "Data Interpretation"],
    questionCount: 140,
    priceInr: 99,
    rounds: [
      { id: "r1", name: "Mathematical Critical Thinking", topic: "QUANTITATIVE", category: "Aptitude", count: "10 Qs", desc: "Cryptarithmetic puzzles, Permutations, Probability, Series" },
      { id: "r2", name: "Logical Reasoning", topic: "LOGICAL", category: "Logical", count: "15 Qs", desc: "Critical thinking, Deductive logic, Data interpretation" },
      { id: "r3", name: "Verbal Ability", topic: "VERBAL", category: "Verbal", count: "20 Qs", desc: "Contextual vocabulary, Sentence correction, Grammar" },
      { id: "r4", name: "Hands-on Coding", topic: "CODING", category: "Coding", count: "3 Problems", isCoding: true, desc: "Dynamic programming, Graph traversal, Algorithms" }
    ]
  },
  {
    id: "ACCENTURE",
    code: "Accenture",
    mockContestId: "ACCENTURE_MOCK",
    name: "Accenture Assessment Pack",
    company: "Accenture",
    difficulty: "Medium",
    badge: "Cognitive & Technical",
    examDuration: "90 Mins",
    totalMarks: 100,
    description: "Cognitive ability, English reasoning, abstract thinking, and MS Office / pseudo-code assessment modules for Accenture campus hiring.",
    topics: ["Cognitive Assessment", "Pseudocode Debugging", "Technical Essentials", "Networking Basics"],
    questionCount: 160,
    priceInr: 99,
    rounds: [
      { id: "r1", name: "Cognitive Assessment", topic: "LOGICAL", category: "Logical", count: "50 Qs", desc: "Abstract reasoning, Analytical ability, Spatial patterns" },
      { id: "r2", name: "Pseudo-code & Technical", topic: "OOP", category: "Core CS", count: "40 Qs", desc: "Code snippet execution, Loop tracing, MS Office, Networks" },
      { id: "r3", name: "English Ability", topic: "VERBAL", category: "Verbal", count: "20 Qs", desc: "Grammar, Prepositions, Spotting errors, Synonyms" },
      { id: "r4", name: "Coding Assessment", topic: "CODING", category: "Coding", count: "2 Problems", isCoding: true, desc: "Array transformations, String hashing, Bitwise logic" }
    ]
  },
  {
    id: "AMAZON",
    code: "Amazon",
    mockContestId: "AMAZON_SDE_MOCK",
    name: "Amazon SDE Vault",
    company: "Amazon",
    difficulty: "Hard",
    badge: "Product / FAANG",
    examDuration: "90 Mins",
    totalMarks: 100,
    description: "Core algorithms, trees & dynamic programming, system architecture concepts, and Amazon Leadership Principles interview questions.",
    topics: ["Dynamic Programming", "Trees & Graphs", "System Design", "Leadership Principles"],
    questionCount: 220,
    priceInr: 99,
    rounds: [
      { id: "r1", name: "Data Structures & Algorithms", topic: "OOP", category: "Core CS", count: "20 Qs", desc: "Binary Trees, Stacks, Queues, Heaps, Graph algorithms" },
      { id: "r2", name: "System Concepts & Architecture", topic: "OS", category: "Core CS", count: "20 Qs", desc: "Operating Systems (Paging, Threads), DBMS, System Design" },
      { id: "r3", name: "Hands-on Coding", topic: "CODING", category: "Coding", count: "2 Problems", isCoding: true, desc: "Two Pointers, Sliding Window, BFS/DFS, DP" }
    ]
  },
  {
    id: "WIPRO",
    code: "Wipro",
    mockContestId: "WIPRO_ELITE_MOCK",
    name: "Wipro Elite NTH Archive",
    company: "Wipro",
    difficulty: "Easy-Medium",
    badge: "National Talent Hunt",
    examDuration: "60 Mins",
    totalMarks: 100,
    description: "Quantitative aptitude, logical reasoning, written communication evaluation, and basic coding modules for Wipro Elite hiring rounds.",
    topics: ["Quantitative Aptitude", "Logical Reasoning", "Basic Coding", "Grammar & Comprehension"],
    questionCount: 130,
    priceInr: 99,
    rounds: [
      { id: "r1", name: "Quantitative Aptitude", topic: "QUANTITATIVE", category: "Aptitude", count: "16 Qs", desc: "Number series, Percentages, Profit and Loss, Work & Time" },
      { id: "r2", name: "Logical Reasoning", topic: "LOGICAL", category: "Logical", count: "14 Qs", desc: "Blood relations, Coding-decoding, Analogy, Syllogisms" },
      { id: "r3", name: "Verbal English", topic: "VERBAL", category: "Verbal", count: "22 Qs", desc: "Prepositions, Articles, Sentence correction, Comprehension" },
      { id: "r4", name: "Basic Coding", topic: "CODING", category: "Coding", count: "2 Problems", isCoding: true, desc: "Array sorting, Palindrome checks, Number patterns" }
    ]
  },
  {
    id: "COGNIZANT",
    code: "Cognizant",
    mockContestId: "COGNIZANT_GENC_MOCK",
    name: "Cognizant GenC & GenC Next",
    company: "Cognizant",
    difficulty: "Medium",
    badge: "GenC Series",
    examDuration: "75 Mins",
    totalMarks: 100,
    description: "Analytical ability, code analysis, debugging testcases, and data structures calibrated for Cognizant GenC and GenC Next tests.",
    topics: ["Analytical Reasoning", "Code Debugging", "Automata Fix", "Data Structures"],
    questionCount: 150,
    priceInr: 99,
    rounds: [
      { id: "r1", name: "Quantitative & Analytical", topic: "QUANTITATIVE", category: "Aptitude", count: "25 Qs", desc: "Arithmetic reasoning, Data arrangement, Number series, Ratios" },
      { id: "r2", name: "Automata Fix & Debugging", topic: "OOP", category: "Core CS", count: "20 Qs", desc: "Bug fixing in loops, Pointer errors, Logic correction" },
      { id: "r3", name: "Verbal & Critical", topic: "VERBAL", category: "Verbal", count: "20 Qs", desc: "Vocabulary, Sentence correction, Error detection" },
      { id: "r4", name: "Coding Test", topic: "CODING", category: "Coding", count: "2 Problems", isCoding: true, desc: "Dynamic programming, Array manipulation, String parsing" }
    ]
  }
];

export function PracticeHubPage() {
  const navigate = useNavigate();
  const {
    user,
    subscription,
    planTier,
    isPaid,
    isTechnical,
    hasAptitudePass,
    hasSubjectMcqPass,
    hasCompanyPass,
    hasSingleSubjectPass
  } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [topicCounts, setTopicCounts] = useState({});
  const [selectedCompanyVault, setSelectedCompanyVault] = useState(null);
  const [isStartingSimulation, setIsStartingSimulation] = useState(false);

  const handleStartSimulation = async (comp) => {
    if (!comp) return;
    setIsStartingSimulation(true);
    try {
      const contestId = comp.mockContestId || `${comp.id}_MOCK`;
      const res = await practiceApi.startContestAttempt(contestId);
      const attemptId = res?.attemptId || res?.attempt?.id || res?.data?.id || `att_${Date.now()}`;
      navigate(`/contests/${contestId}/attempt/${attemptId}`);
    } catch (err) {
      console.error("Failed to start mock simulation:", err);
      const contestId = comp.mockContestId || `${comp.id}_MOCK`;
      const fallbackAttemptId = `att_local_${Date.now()}`;
      navigate(`/contests/${contestId}/attempt/${fallbackAttemptId}`);
    } finally {
      setIsStartingSimulation(false);
    }
  };

  const mcqCount = subscription?.mcqAttemptedCount || 0;
  const mcqLimit = subscription?.mcqLimit || 100;

  // Fetch real-time active question counts from database
  useEffect(() => {
    let isMounted = true;
    async function fetchCounts() {
      try {
        const res = await practiceApi.getTopics();
        const list = res?.topics || res?.data || [];
        const countMap = {};
        for (const t of list) {
          if (t.name) {
            countMap[t.name.toUpperCase()] = t.count || t.questionCount || 0;
          }
        }
        if (isMounted) setTopicCounts(countMap);
      } catch (err) {
        console.warn("Failed to load topic counts from question bank:", err);
      }
    }
    fetchCounts();
    return () => { isMounted = false; };
  }, []);

  // Filter topics based on technical vs non-technical student profile
  const availableTopics = PRACTICE_TOPICS.filter((t) => {
    if (!isTechnical && t.technicalOnly) return false;
    if (isTechnical && t.businessOnly) return false;
    return true;
  });

  const filteredTopics = availableTopics.filter((t) => {
    const matchesCategory = selectedCategory === "ALL" || t.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.topics.some(sub => sub.toLowerCase().includes(q))
    );
  });

  const filteredCompanyPacks = COMPANY_PACKS.filter((comp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      comp.name.toLowerCase().includes(q) ||
      comp.company.toLowerCase().includes(q) ||
      comp.topics.some(sub => sub.toLowerCase().includes(q))
    );
  });

  const availableTabs = isTechnical
    ? ["ALL", "Aptitude", "Core CS", "Company Packs"]
    : ["ALL", "Aptitude", "Management", "Company Packs"];

  const hasAnyModularPass = hasAptitudePass || hasSubjectMcqPass;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isTechnical ? "Subject & Aptitude Practice Hub" : "Aptitude & Business Reasoning Hub"}
            </h1>
          </div>
        </div>

        {/* Quota Pill */}
        <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">MCQ Quota</div>
            <div className="text-sm font-extrabold text-slate-900 font-mono">
              {isPaid
                ? "Unlimited Attempts"
                : (hasAptitudePass && hasSubjectMcqPass)
                  ? "All Passes Active"
                  : hasAptitudePass
                    ? "Aptitude Pass Active"
                    : hasSubjectMcqPass
                      ? "Core CS Pass Active"
                      : `${mcqCount} / ${mcqLimit} Solved`}
            </div>
          </div>
          {!isPaid && !hasAnyModularPass && (
            <Button size="xs" variant="primary" onClick={() => navigate("/store")}>
              Unlock Passes
            </Button>
          )}
        </div>
      </div>

      {/* Coding Arena Quick Launch Card for Technical Students */}
      {isTechnical && (
        <Card className="p-5 bg-white text-slate-900 border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Coding Arena & Algorithmic Challenges
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">LeetCode Style</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Practice Data Structures & Algorithms with real-time sandbox execution, test cases, and AI coaching.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap self-start sm:self-auto cursor-pointer"
              onClick={() => navigate("/coding")}
            >
              Browse Problem Bank <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {availableTabs.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {cat === "ALL" ? (isTechnical ? "All Practice Tracks" : "All Aptitude Tracks") : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={selectedCategory === "Company Packs" ? "Search company archives..." : "Search topics or subtopics..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200/80 focus:outline-hidden focus:border-indigo-500 text-slate-800 placeholder-slate-400 shadow-2xs"
          />
        </div>
      </div>

      {/* TAB: COMPANY PACKS VIEW */}
      {selectedCategory === "Company Packs" ? (
        <div className="space-y-6">
          {/* All-Company Upsell Banner if not fully unlocked */}
          {!isPaid && !subscription?.companySpecificProblems && !subscription?.hasCompanyAllPass && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-indigo-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">All-Company Placement Vault</h4>
                  <p className="text-xs text-slate-300">
                    Get full unconstrained access to all 50+ company placement question banks for ₹349/month or ₹999/year.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                className="whitespace-nowrap bg-indigo-500 hover:bg-indigo-600 text-white border-0 shadow-md"
                onClick={() => navigate("/store?tab=COMPANIES")}
              >
                Unlock All Companies
              </Button>
            </div>
          )}

          {filteredCompanyPacks.length === 0 ? (
            <Card className="p-8 text-center max-w-md mx-auto space-y-3">
              <p className="text-sm font-semibold text-slate-700">No company archives matched your query</p>
              <Button size="xs" variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanyPacks.map((comp) => {
                const isCompanyUnlocked =
                  isPaid ||
                  Boolean(subscription?.companySpecificProblems) ||
                  Boolean(subscription?.hasCompanyAllPass) ||
                  (typeof hasCompanyPass === "function" && (hasCompanyPass(comp.code) || hasCompanyPass(comp.company)));

                return (
                  <Card key={comp.id} hover className="p-6 flex flex-col justify-between border-slate-200">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl border bg-slate-100 text-slate-800 border-slate-200 shadow-xs">
                          <Building2 className="w-6 h-6" />
                        </div>
                        {isCompanyUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> Unlocked Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-400" /> ₹{comp.priceInr}/mo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-slate-900">{comp.name}</h3>
                      </div>
                      <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100 mb-2">
                        {comp.badge}
                      </span>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        {comp.description}
                      </p>

                      <div className="space-y-1.5 mb-6">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assessed Rounds:</div>
                        <div className="flex flex-wrap gap-1">
                          {comp.topics.map((t, idx) => (
                            <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">
                        {comp.questionCount}+ Problems
                      </span>
                      {isCompanyUnlocked ? (
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => setSelectedCompanyVault(comp)}
                        >
                          Practice Vault <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => navigate("/store?tab=COMPANIES")}
                        >
                          Unlock Pass (₹{comp.priceInr}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD TOPICS GRID */
        filteredTopics.length === 0 ? (
          <Card className="p-8 text-center max-w-md mx-auto space-y-3">
            <p className="text-sm font-semibold text-slate-700">No matching practice tracks found</p>
            <p className="text-xs text-slate-500">Try adjusting your search keywords or switching category filters.</p>
            <Button size="xs" variant="outline" onClick={() => { setSelectedCategory("ALL"); setSearchQuery(""); }}>
              Reset Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;
              const liveCount = topicCounts[topic.id] || 
                topicCounts[topic.id === "DI_ANALYTICS" ? "DATA_INTERPRETATION" : topic.id] || 
                topic.questionCount;

              const isPassCovered =
                isPaid ||
                (topic.category === "Aptitude" && hasAptitudePass) ||
                ((topic.category === "Core CS" || topic.category === "Management") && hasSubjectMcqPass) ||
                (typeof hasSingleSubjectPass === "function" && hasSingleSubjectPass(topic.id));

              return (
                <Card key={topic.id} hover className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl border ${topic.color} shadow-xs`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        {isPassCovered && !isPaid ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Pass Active
                          </span>
                        ) : null}
                        {(() => {
                          const stat = subscription?.subjectStats?.[topic.id.toUpperCase()];
                          if (stat && stat.attempted > 0) {
                            return (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {stat.attempted} Attempted • {stat.accuracy}%
                              </span>
                            );
                          }
                          return <Badge variant="neutral" size="sm">{topic.category}</Badge>;
                        })()}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      {liveCount} Curated Questions • {topic.difficulty}
                    </p>

                    <div className="space-y-1.5 mb-6">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Key Subtopics:</div>
                      <div className="flex flex-wrap gap-1">
                        {topic.topics.map((sub, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 font-medium">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 10 Qs / Session
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate(`/practice/mcq?topic=${topic.id}&name=${encodeURIComponent(topic.name)}`)}
                    >
                      Start Practice <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}


      {/* Company Dual-Mode Practice Modal */}
      {selectedCompanyVault && (
        <Modal
          isOpen={Boolean(selectedCompanyVault)}
          onClose={() => setSelectedCompanyVault(null)}
          maxWidth="max-w-3xl"
          className="p-6 sm:p-8"
        >
          <div className="space-y-6">
            {/* Recruiter Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedCompanyVault.name}</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Unlocked Vault
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
                    {selectedCompanyVault.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Option A: Full Recruiter Exam Simulation (Real Test Mode) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    <Clock className="w-3 h-3" /> Option A • Real Exam Simulation
                  </div>
                  <h3 className="text-lg font-bold text-white">Full Recruiter Placement Simulation</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                    Experience {selectedCompanyVault.code} test conditions under real recruiter constraints ({selectedCompanyVault.examDuration || "80 Mins"}, sectional timing, multi-round proctoring, and comprehensive accuracy scorecards).
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedCompanyVault.rounds?.map((r) => (
                      <span key={r.id} className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/10 font-mono">
                        {r.name} ({r.count})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    size="md"
                    variant="primary"
                    disabled={isStartingSimulation}
                    onClick={() => handleStartSimulation(selectedCompanyVault)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20 whitespace-nowrap"
                  >
                    {isStartingSimulation ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Launching...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Start Full Simulation <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Option B: Practice Tested Topics Individually (Topic Vault Mode) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Option B • Topic-by-Topic Practice
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Practice Assessed Rounds Individually
                  </h4>
                </div>
                <span className="text-xs text-slate-400">
                  {selectedCompanyVault.rounds?.length || 4} Rounds Tested
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedCompanyVault.rounds?.map((round, idx) => (
                  <div
                    key={round.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                          {round.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {round.count}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900">{round.name}</h5>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {round.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      {round.isCoding ? (
                        <Button
                          size="xs"
                          variant="outline"
                          className="w-full text-blue-700 border-blue-200 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedCompanyVault(null);
                            navigate(`/practice/coding?recruiter=${encodeURIComponent(selectedCompanyVault.code)}`);
                          }}
                        >
                          <Terminal className="w-3.5 h-3.5 mr-1" />
                          Solve Coding Problems
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          className="w-full text-slate-700 border-slate-200 hover:bg-slate-100"
                          onClick={() => {
                            setSelectedCompanyVault(null);
                            navigate(`/practice/mcq?topic=${round.topic}&company=${encodeURIComponent(selectedCompanyVault.code)}&round=${encodeURIComponent(round.name)}`);
                          }}
                        >
                          <BrainCircuit className="w-3.5 h-3.5 mr-1" />
                          Practice Round MCQs
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Recruiter Pattern: Updated for 2025-2026 Hiring Season</span>
              <button
                onClick={() => setSelectedCompanyVault(null)}
                className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

export default PracticeHubPage;
