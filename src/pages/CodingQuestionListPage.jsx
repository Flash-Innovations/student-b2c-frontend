import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Code2,
  Terminal,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Check,
  Award,
  BookOpen,
  HelpCircle,
  Filter
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { MathRenderer } from "../components/common/MathRenderer";
import { practiceApi } from "../services/practiceApi";
import { useAuth } from "../context/AuthContext";

export function CodingQuestionListPage() {
  const navigate = useNavigate();
  const { user, subscription, planTier, isPaid } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedSubcategory, setSelectedSubcategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL"); // ALL | SOLVED | UNSOLVED
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Track solved questions locally (from user profile or practice telemetry)
  const solvedQuestionIds = useMemo(() => {
    return new Set(user?.solvedQuestions || []);
  }, [user]);

  const fetchQuestions = async ({ forceRefresh = false } = {}) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await practiceApi.getQuestions({ type: "CODING", limit: 1000 });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.questions)
            ? res.questions
            : [];
      setQuestions(list);
    } catch (err) {
      console.error("Failed to load coding questions:", err);
      setError(err.message || "Unable to fetch coding questions from the Practice Platform.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Extract unique subcategories
  const subcategories = useMemo(() => {
    const set = new Set();
    questions.forEach((q) => {
      if (q.subcategory) set.add(q.subcategory);
      else if (q.category) set.add(q.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [questions]);

  // Aggregate stats
  const totalQuestions = questions.length;
  const easyTotal = useMemo(() => questions.filter((q) => (q.difficulty || "").toUpperCase() === "EASY").length, [questions]);
  const mediumTotal = useMemo(() => questions.filter((q) => (q.difficulty || "").toUpperCase() === "MEDIUM").length, [questions]);
  const hardTotal = useMemo(() => questions.filter((q) => (q.difficulty || "").toUpperCase() === "HARD").length, [questions]);

  const easySolved = useMemo(() => questions.filter((q) => (q.difficulty || "").toUpperCase() === "EASY" && solvedQuestionIds.has(q.id)).length, [questions, solvedQuestionIds]);
  const mediumSolved = useMemo(() => questions.filter((q) => (q.difficulty || "").toUpperCase() === "MEDIUM" && solvedQuestionIds.has(q.id)).length, [questions, solvedQuestionIds]);
  const hardSolved = useMemo(() => questions.filter((q) => (q.difficulty || "").toUpperCase() === "HARD" && solvedQuestionIds.has(q.id)).length, [questions, solvedQuestionIds]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const title = (q.latestTitle || q.title || q.statement || "").toLowerCase();
      const subcat = (q.subcategory || q.category || "").toLowerCase();
      const diff = (q.difficulty || "").toUpperCase();
      const isSolved = solvedQuestionIds.has(q.id);

      const matchesSearch =
        searchQuery.trim() === "" ||
        title.includes(searchQuery.toLowerCase()) ||
        subcat.includes(searchQuery.toLowerCase());

      const matchesDifficulty =
        selectedDifficulty === "ALL" || diff === selectedDifficulty;

      const matchesSubcategory =
        selectedSubcategory === "ALL" ||
        (q.subcategory === selectedSubcategory || q.category === selectedSubcategory);

      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "SOLVED" && isSolved) ||
        (selectedStatus === "UNSOLVED" && !isSolved);

      return matchesSearch && matchesDifficulty && matchesSubcategory && matchesStatus;
    });
  }, [questions, searchQuery, selectedDifficulty, selectedSubcategory, selectedStatus, solvedQuestionIds]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDifficulty, selectedSubcategory, selectedStatus]);

  const getDifficultyBadge = (difficulty) => {
    switch ((difficulty || "").toUpperCase()) {
      case "EASY":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Easy</span>;
      case "MEDIUM":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Medium</span>;
      case "HARD":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Hard</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">{difficulty || "Medium"}</span>;
    }
  };

  const dsaCount = subscription?.dsaAttemptedCount || 0;
  const dsaLimit = subscription?.dsaLimit || 50;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-md border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Terminal className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 font-mono">
                DSA Problem Arena
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Coding Practice Challenges
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl leading-relaxed">
              Curated campus placement and competitive coding problems in C++, Python, Java, and JavaScript with Judge0 sandbox evaluation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
              <div className="text-[10px] font-bold uppercase text-indigo-200">DSA Quota</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {isPaid ? "Unlimited" : `${dsaCount} / ${dsaLimit} Solved`}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              onClick={() => fetchQuestions({ forceRefresh: true })}
              loading={isRefreshing}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh List
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -bottom-10 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Progress & Category Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">Total Problems</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {totalQuestions}
          </div>
          <span className="text-[10px] text-slate-400">Available to Practice</span>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Easy</span>
            <span className="text-[10px] text-slate-400">{easySolved}/{easyTotal}</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
            {easyTotal}
          </div>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${easyTotal > 0 ? (easySolved / easyTotal) * 100 : 0}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Medium</span>
            <span className="text-[10px] text-slate-400">{mediumSolved}/{mediumTotal}</span>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">
            {mediumTotal}
          </div>
          <div className="w-full bg-amber-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${mediumTotal > 0 ? (mediumSolved / mediumTotal) * 100 : 0}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Hard</span>
            <span className="text-[10px] text-slate-400">{hardSolved}/{hardTotal}</span>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">
            {hardTotal}
          </div>
          <div className="w-full bg-rose-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all"
              style={{ width: `${hardTotal > 0 ? (hardSolved / hardTotal) * 100 : 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems by title, keywords, or topics..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedDifficulty === diff
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {diff === "ALL" ? "All Levels" : diff.charAt(0) + diff.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Subcategory Select */}
          {subcategories.length > 2 && (
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              {subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub === "ALL" ? "All Categories" : sub.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Status</option>
            <option value="SOLVED">Solved</option>
            <option value="UNSOLVED">Unsolved</option>
          </select>
        </div>
      </Card>

      {/* Questions List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-16 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center max-w-md mx-auto space-y-3 my-8">
          <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Failed to Load Questions</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchQuestions({ forceRefresh: true })}>
            Try Again
          </Button>
        </Card>
      ) : paginatedQuestions.length === 0 ? (
        <Card className="p-12 text-center max-w-md mx-auto space-y-3 my-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Matching Problems Found</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search query or clearing difficulty filters to view more challenges.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedDifficulty("ALL");
                setSelectedSubcategory("ALL");
                setSelectedStatus("ALL");
              }}
            >
              Reset All Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span>Showing {paginatedQuestions.length} of {filteredQuestions.length} challenges</span>
            <span>Page {currentPage} of {totalPages}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100">
            {paginatedQuestions.map((q, idx) => {
              const displayTitle = q.latestTitle || q.title || (q.statement ? q.statement.slice(0, 70) + "..." : "Coding Challenge");
              const isSolved = solvedQuestionIds.has(q.id);
              const questionNumber = (currentPage - 1) * pageSize + idx + 1;

              return (
                <div
                  key={q.id}
                  onClick={() => navigate(`/coding/${q.id}`)}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Status Indicator */}
                    <div className="shrink-0">
                      {isSolved ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold font-mono">
                          {questionNumber}
                        </span>
                      )}
                    </div>

                    {/* Title & Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          <MathRenderer content={displayTitle} inline />
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {(q.subcategory || q.category || "DSA").replace(/_/g, " ")}
                        </span>
                        {q.sourceNamespace && (
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            {q.sourceNamespace}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Difficulty badge & CTA */}
                  <div className="flex items-center gap-3 shrink-0">
                    {getDifficultyBadge(q.difficulty)}

                    <Button
                      variant="primary"
                      size="xs"
                      className="hidden sm:inline-flex group-hover:bg-indigo-700"
                    >
                      Solve <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-slate-400 sm:hidden" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-semibold text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default CodingQuestionListPage;
