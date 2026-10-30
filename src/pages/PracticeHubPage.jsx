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
  Search
} from "lucide-react";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
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

export function PracticeHubPage() {
  const navigate = useNavigate();
  const { user, subscription, planTier, isPaid, isTechnical } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [topicCounts, setTopicCounts] = useState({});

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

  const availableTabs = isTechnical
    ? ["ALL", "Aptitude", "Core CS"]
    : ["ALL", "Aptitude", "Management"];

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
              {isPaid ? "Unlimited Attempts" : `${mcqCount} / ${mcqLimit} Solved`}
            </div>
          </div>
          {!isPaid && (
            <Button size="xs" variant="primary" onClick={() => navigate("/pricing")}>
              Upgrade
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
            placeholder="Search topics or subtopics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200/80 focus:outline-hidden focus:border-indigo-500 text-slate-800 placeholder-slate-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
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

            return (
              <Card key={topic.id} hover className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl border ${topic.color} shadow-xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="neutral" size="sm">{topic.category}</Badge>
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
      )}

    </div>
  );
}

export default PracticeHubPage;
