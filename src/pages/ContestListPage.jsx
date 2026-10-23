import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Search,
  Code2,
  BrainCircuit,
  Binary,
  Layers,
  Crown,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { practiceApi } from "../services/practiceApi";
import { b2cApi } from "../services/b2cApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function ContestListPage() {
  const navigate = useNavigate();
  const { user, subscription, planTier, isPaid } = useAuth();
  const { showError } = useToast();

  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "LIVE" | "UPCOMING" | "ENDED"
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContests = async ({ forceRefresh = false } = {}) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let list = [];
      try {
        const b2cRes = await b2cApi.getContests();
        if (b2cRes && Array.isArray(b2cRes.contests)) {
          list = b2cRes.contests;
        }
      } catch (e) {}

      if (list.length === 0) {
        try {
          const practiceData = await practiceApi.getAvailableContests();
          if (Array.isArray(practiceData) && practiceData.length > 0) {
            list = practiceData;
          }
        } catch (e) {}
      }

      setContests(list);
    } catch (err) {
      console.error("Failed to load contests:", err);
      setError("Unable to load contests. Please check your connection.");
      setContests([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const getContestTimingState = (contest) => {
    if (contest.status === "CANCELLED") return "CANCELLED";
    const now = Date.now();
    const startMs = new Date(contest.startAt).getTime();
    const endMs = new Date(contest.endAt).getTime();

    if (contest.status === "SCHEDULED" || now < startMs) return "UPCOMING";
    if (now >= startMs && now < endMs) return "LIVE";
    return "ENDED";
  };

  // Check if current user is entitled to contest
  const isContestEntitled = (contest) => {
    if (planTier === "PREMIUM") return true;
    const isPremiumContest = contest.tierRequirement === "PREMIUM" || contest.isPremium;
    if (!isPremiumContest && (planTier === "BASIC" || subscription?.regularContestsFree)) {
      return true;
    }
    const unlocked = subscription?.unlockedContestIds || [];
    return unlocked.includes(contest.id);
  };

  const filteredContests = contests.filter((contest) => {
    const timingState = getContestTimingState(contest);

    if (statusFilter === "LIVE" && timingState !== "LIVE") return false;
    if (statusFilter === "UPCOMING" && timingState !== "UPCOMING") return false;
    if (statusFilter === "ENDED" && timingState !== "ENDED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (contest.title || "").toLowerCase().includes(q);
      const matchDesc = (contest.description || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              SIPS Campus Placement Standard
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {user?.collegeName || "Institutional Assessment Hub"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-500" />
            Assessments & Contests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Standardized campus hiring assessments, competitive coding rounds, and timed aptitude evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchContests({ forceRefresh: true })}
            loading={isRefreshing}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/practice")}
          >
            Practice Hub
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Assessments" },
            { id: "LIVE", label: "Live Now" },
            { id: "UPCOMING", label: "Scheduled" },
            { id: "ENDED", label: "Past" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-900">Service Notice</h4>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Contests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-5 w-20 rounded bg-slate-200" />
                <div className="h-5 w-16 rounded bg-slate-200" />
              </div>
              <div className="space-y-2">
                <div className="h-6 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-slate-100" />
                <div className="h-8 w-24 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredContests.length === 0 ? (
        <Card className="p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Assessments Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            There are currently no placement drives or assessments matching your filter criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("ALL");
              setSearchQuery("");
            }}
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContests.map((contest) => {
            const timingState = getContestTimingState(contest);
            const isLive = timingState === "LIVE";
            const isUpcoming = timingState === "UPCOMING";
            const isEnded = timingState === "ENDED";
            const entitled = isContestEntitled(contest);

            const startDate = new Date(contest.startAt);
            const endDate = new Date(contest.endAt);
            const formatOptions = {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            };
            const startStr = startDate.toLocaleDateString(undefined, formatOptions);

            const secBreakdown = contest.sectionBreakdown || {};

            return (
              <Card
                key={contest.id}
                className={`p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer ${
                  isLive
                    ? "border-emerald-300 bg-gradient-to-b from-white to-emerald-50/20"
                    : "border-slate-200 bg-white"
                }`}
                onClick={() => navigate(`/contests/${contest.id}`)}
              >
                <div className="space-y-3.5">
                  {/* Top Status & Marks */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500 text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          LIVE NOW
                        </span>
                      ) : isUpcoming ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          UPCOMING
                        </span>
                      ) : (
                        <Badge variant="neutral" size="xs">ENDED</Badge>
                      )}

                      {contest.tierRequirement === "PREMIUM" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Crown className="w-3 h-3 text-amber-600" />
                          Premium
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">{contest.totalMarks || 100}</span>
                      <span className="text-[10px] text-slate-400 font-semibold ml-1">Marks</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2">
                      {contest.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {contest.description || "Official placement drive evaluation session."}
                    </p>
                  </div>

                  {/* Duration & Window */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration:
                      </span>
                      <span className="font-bold text-slate-800">{contest.durationMinutes} Minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Starts:
                      </span>
                      <span className="font-semibold text-slate-700">{startStr}</span>
                    </div>
                  </div>

                  {/* Section Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {secBreakdown.CODING?.count > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                        <Code2 className="w-3 h-3" />
                        Coding ({secBreakdown.CODING.marks}M)
                      </span>
                    )}
                    {secBreakdown.APTITUDE?.count > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                        <BrainCircuit className="w-3 h-3" />
                        Aptitude ({secBreakdown.APTITUDE.marks}M)
                      </span>
                    )}
                    {secBreakdown.TECHNICAL?.count > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold border border-sky-100">
                        <Binary className="w-3 h-3" />
                        Technical ({secBreakdown.TECHNICAL.marks}M)
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    {entitled ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Access Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                        <Lock className="w-3.5 h-3.5" />
                        Pass Required
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                    <span>View Guidelines</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ContestListPage;
