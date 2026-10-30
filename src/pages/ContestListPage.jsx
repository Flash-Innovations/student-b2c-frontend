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
  CreditCard,
  CheckCircle2,
  Lock,
  History,
  Award,
  ChevronLeft,
  ChevronRight,
  Play,
  FileCheck2,
  Check
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { practiceApi } from "../services/practiceApi";
import { b2cApi } from "../services/b2cApi";
import { openRazorpayCheckout } from "../services/razorpayClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function ContestListPage() {
  const navigate = useNavigate();
  const { user, subscription, planTier, isTechnical, refreshSubscription } = useAuth();
  const { showError, showSuccess } = useToast();

  const [contests, setContests] = useState([]);
  const [payingContestId, setPayingContestId] = useState(null);

  const handlePayToJoinContest = async (contest) => {
    const contestId = contest.id || contest._id;
    try {
      setPayingContestId(contestId);
      const isPremium = (contest.tierRequired || contest.tierRequirement || "").toUpperCase() === "PREMIUM";
      const addonType = isPremium ? "CONTEST_PREMIUM_PASS" : "CONTEST_REGULAR_PASS";

      const orderData = await b2cApi.createOrder({
        orderType: addonType,
        addonType,
        contestId
      });

      if (!orderData || !orderData.orderId) {
        throw new Error("Unable to create entry order.");
      }

      openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.totalAmountWithGst,
        currency: "INR",
        name: "Flash Platform",
        description: `Entry: ${contest.title} (All-Inclusive)`,
        user: {
          name: user?.name,
          email: user?.email
        },
        onSuccess: async (paymentResponse) => {
          try {
            await b2cApi.verifyPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              transactionId: orderData.transactionId
            });
            showSuccess(`Payment received! You are enrolled in ${contest.title}.`);
            if (refreshSubscription) await refreshSubscription();
            await fetchContests();
          } catch (err) {
            showError("Payment verification failed. Please contact support.");
          }
        },
        onFailure: (err) => {
          showError(err.message || "Payment cancelled.");
        }
      });
    } catch (err) {
      showError(err.message || "Failed to initiate payment.");
    } finally {
      setPayingContestId(null);
    }
  };

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "LIVE" | "UPCOMING" | "ENDED" | "MY_ATTEMPTS"
  const [domainFilter, setDomainFilter] = useState("AUTO"); // "AUTO" | "ALL" | "TECHNICAL" | "MANAGEMENT"
  const [searchQuery, setSearchQuery] = useState("");

  // Contest History state
  const [myAttempts, setMyAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL"); // "ALL" | "SUBMITTED" | "TIMED_OUT" | "IN_PROGRESS"
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

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
        } else if (Array.isArray(b2cRes)) {
          list = b2cRes;
        }
      } catch (e) {}

      if (list.length === 0) {
        try {
          const practiceData = await practiceApi.getAvailableContests();
          if (Array.isArray(practiceData)) {
            list = practiceData;
          } else if (practiceData && Array.isArray(practiceData.contests)) {
            list = practiceData.contests;
          }
        } catch (e) {}
      }

      setContests(list);
    } catch (err) {
      console.error("Failed to load contests:", err);
      setError("Unable to connect to contest platform. Please verify your connection.");
      setContests([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchMyAttempts = async (page = 1) => {
    setLoadingAttempts(true);
    try {
      const data = await practiceApi.getMyContestAttempts({
        page,
        limit: 12,
        status: historyStatusFilter,
        search: searchQuery
      });
      if (data && data.success && Array.isArray(data.attempts)) {
        setMyAttempts(data.attempts);
        if (data.pagination) {
          setHistoryPage(data.pagination.page || 1);
          setHistoryTotalPages(data.pagination.totalPages || 1);
          setHistoryTotal(data.pagination.total || 0);
        }
      } else {
        setMyAttempts([]);
      }
    } catch (err) {
      console.warn("Could not load student attempts:", err.message);
      setMyAttempts([]);
    } finally {
      setLoadingAttempts(false);
    }
  };

  useEffect(() => {
    fetchContests();
    fetchMyAttempts(1);
  }, [planTier, subscription]);

  useEffect(() => {
    if (statusFilter === "MY_ATTEMPTS") {
      fetchMyAttempts(1);
    }
  }, [statusFilter, historyStatusFilter]);

  const getContestTimingState = (contest) => {
    if (contest.status === "CANCELLED" || contest.status === "DRAFT") return contest.status;
    const now = Date.now();
    const startMs = new Date(contest.startAt).getTime();
    const endMs = new Date(contest.endAt).getTime();

    if (contest.status === "SCHEDULED" || now < startMs) return "UPCOMING";
    if (now >= startMs && now < endMs) return "LIVE";
    return "ENDED";
  };

  // Check if current user is entitled to contest
  const isContestEntitled = (contest) => {
    const tier = (contest.tierRequired || contest.tierRequirement || "FREE").toUpperCase();
    if (tier === "FREE") return true;
    if (planTier === "PREMIUM") return true;
    if (tier === "BASIC" && (planTier === "BASIC" || subscription?.regularContestsFree)) {
      return true;
    }
    const unlocked = subscription?.unlockedContestIds || [];
    return unlocked.includes(contest.id || contest._id);
  };

  const filteredContests = contests.filter((contest) => {
    const timingState = getContestTimingState(contest);

    if (statusFilter === "LIVE" && timingState !== "LIVE") return false;
    if (statusFilter === "UPCOMING" && timingState !== "UPCOMING") return false;
    if (statusFilter === "ENDED" && timingState !== "ENDED") return false;

    // Candidate stream & domain filtering
    const targetDomain = (contest.targetDomain || "ALL").toUpperCase();
    if (domainFilter === "TECHNICAL" && targetDomain === "MANAGEMENT") return false;
    if (domainFilter === "MANAGEMENT" && targetDomain === "TECHNICAL") return false;
    if (domainFilter === "AUTO") {
      if (isTechnical && targetDomain === "MANAGEMENT") return false;
      if (!isTechnical && targetDomain === "TECHNICAL") return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (contest.title || "").toLowerCase().includes(q);
      const matchDesc = (contest.description || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  const filteredAttempts = myAttempts.filter((att) => {
    if (historyStatusFilter !== "ALL" && (att.status || "").toUpperCase() !== historyStatusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (att.contestTitle || "").toLowerCase().includes(q);
      if (!matchTitle) return false;
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
            variant={statusFilter === "MY_ATTEMPTS" ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter("MY_ATTEMPTS");
              fetchMyAttempts(1);
            }}
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            My Contest History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (statusFilter === "MY_ATTEMPTS") fetchMyAttempts(historyPage);
              else fetchContests({ forceRefresh: true });
            }}
            loading={isRefreshing || loadingAttempts}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button
            variant="outline"
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
            { id: "ENDED", label: "Past" },
            { id: "MY_ATTEMPTS", label: "My Attempts", isHistory: true }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                if (tab.id === "MY_ATTEMPTS") fetchMyAttempts(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.isHistory && <History className="w-3.5 h-3.5" />}
              {tab.label}
              {tab.isHistory && myAttempts.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {myAttempts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={statusFilter === "MY_ATTEMPTS" ? "Search my attempts..." : "Search assessments..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Stream & Domain Scoping Selector */}
      {statusFilter !== "MY_ATTEMPTS" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Candidate Persona:
            </span>
            <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-blue-50 text-blue-700 border border-blue-200/60">
              {isTechnical ? "Engineering & Technical" : "Management & Business"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: "AUTO", label: `Curated for Me (${isTechnical ? "Tech" : "Mgmt"})` },
              { id: "ALL", label: "Open to All" },
              { id: "TECHNICAL", label: "Engineering / Tech" },
              { id: "MANAGEMENT", label: "Management / MBA" }
            ].map((dTab) => (
              <button
                key={dTab.id}
                onClick={() => setDomainFilter(dTab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  domainFilter === dTab.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {dTab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* If in My Attempts View, show status pills */}
      {statusFilter === "MY_ATTEMPTS" && (
        <div className="flex items-center gap-2 pt-1 pb-1 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
          {[
            { id: "ALL", label: "All Attempts" },
            { id: "SUBMITTED", label: "Submitted" },
            { id: "TIMED_OUT", label: "Timed Out" },
            { id: "IN_PROGRESS", label: "In Progress" }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setHistoryStatusFilter(filter.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                historyStatusFilter === filter.id
                  ? "bg-slate-800 text-white shadow-2xs font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

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

      {/* RENDER VIEW 1: MY CONTEST HISTORY VIEW */}
      {statusFilter === "MY_ATTEMPTS" ? (
        loadingAttempts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 animate-pulse">
                <div className="h-5 w-24 rounded bg-slate-200" />
                <div className="h-6 w-3/4 rounded bg-slate-200" />
                <div className="h-16 w-full rounded bg-slate-100" />
                <div className="h-8 w-full rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filteredAttempts.length === 0 ? (
          <Card className="p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Contest Attempts Recorded</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery || historyStatusFilter !== "ALL"
                ? "No contest attempts match your filter criteria."
                : "You haven't participated in any placement drives or assessments yet. Take your first assessment to build your performance history!"}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setStatusFilter("ALL");
                setSearchQuery("");
                setHistoryStatusFilter("ALL");
              }}
            >
              Browse Assessments
            </Button>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAttempts.map((attempt) => {
                const isFinalized = attempt.status === "SUBMITTED" || attempt.status === "TIMED_OUT";
                const isTimedOut = attempt.status === "TIMED_OUT";
                const isInProgress = attempt.status === "IN_PROGRESS";

                const dateStr = attempt.submittedAt
                  ? new Date(attempt.submittedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : attempt.startedAt
                  ? new Date(attempt.startedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "Recent Attempt";

                const pct = attempt.percentage !== null && attempt.percentage !== undefined
                  ? attempt.percentage
                  : attempt.totalMarks > 0
                  ? Math.round((attempt.totalScore / attempt.totalMarks) * 100)
                  : 0;

                return (
                  <Card
                    key={attempt.id}
                    className="p-5 flex flex-col justify-between hover:shadow-md transition-all border-slate-200 bg-white"
                  >
                    <div className="space-y-3.5">
                      {/* Top Badge & Date */}
                      <div className="flex items-center justify-between gap-2">
                        {isTimedOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Timed Out
                          </span>
                        ) : isFinalized ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FileCheck2 className="w-3 h-3" />
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            In Progress
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 font-medium">{dateStr}</span>
                      </div>

                      {/* Title & Info */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                          {attempt.contestTitle || "Placement Assessment"}
                        </h3>
                        {attempt.contestDescription && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {attempt.contestDescription}
                          </p>
                        )}
                      </div>

                      {/* Performance Metrics Block */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Score Obtained:</span>
                          <span className="font-bold text-slate-900 font-mono">
                            {attempt.totalScore} / {attempt.totalMarks} Marks
                          </span>
                        </div>

                        {/* Progress Bar */}
                        {isFinalized && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-medium">Percentage:</span>
                              <span className={`font-bold font-mono ${pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-indigo-600" : "text-amber-600"}`}>
                                {pct}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-indigo-600" : "bg-amber-500"}`}
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                          <span>Attempted: <strong>{attempt.attemptedCount}</strong> / {attempt.totalQuestions || "N/A"} Qs</span>
                          <span>Time: <strong>{attempt.timeTakenFormatted || "N/A"}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      {isFinalized ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full justify-center text-xs"
                          onClick={() => navigate(`/contests/${attempt.contestId}/result/${attempt.id}`)}
                        >
                          <Award className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                          View Result & Review Answers
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full justify-center text-xs bg-sky-600 hover:bg-sky-700"
                          onClick={() => navigate(`/contests/${attempt.contestId}/workspace/${attempt.id}`)}
                        >
                          <Play className="w-3.5 h-3.5 mr-1.5" />
                          Resume Assessment
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {historyTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={historyPage <= 1}
                  onClick={() => fetchMyAttempts(historyPage - 1)}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>
                <span className="text-xs font-semibold text-slate-600 px-2">
                  Page {historyPage} of {historyTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={historyPage >= historyTotalPages}
                  onClick={() => fetchMyAttempts(historyPage + 1)}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )
      ) : (
        /* RENDER VIEW 2: AVAILABLE CONTESTS LIST */
        loading ? (
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
                      ? "border-emerald-300 bg-white"
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

                        {(contest.tierRequired === "PREMIUM" || contest.tierRequirement === "PREMIUM") ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Crown className="w-3 h-3 text-amber-600" />
                            Premium Plan
                          </span>
                        ) : (contest.tierRequired === "BASIC" || contest.tierRequirement === "BASIC" || contest.tierRequirement === "REGULAR") ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <ShieldCheck className="w-3 h-3 text-indigo-500" />
                            Basic Plan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Free Access
                          </span>
                        )}

                        {/* Candidate Target Domain Badge */}
                        {(contest.targetDomain === "TECHNICAL" || contest.targetDomain === "TECHNICAL_DOMAIN") ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                            <Code2 className="w-3 h-3 text-blue-600" />
                            Technical
                          </span>
                        ) : (contest.targetDomain === "MANAGEMENT" || contest.targetDomain === "MANAGEMENT_DOMAIN") ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                            <BrainCircuit className="w-3 h-3 text-amber-600" />
                            Management
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Layers className="w-3 h-3 text-slate-500" />
                            Open to All
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
                      ) : (() => {
                        const isPremiumContest = (contest.tierRequired || contest.tierRequirement || "").toUpperCase() === "PREMIUM";
                        const price = contest.entryFee > 0 ? contest.entryFee : (isPremiumContest ? (planTier === "BASIC" ? 50 : 100) : 50);
                        return (
                          <Button
                            size="xs"
                            variant="primary"
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            loading={payingContestId === (contest.id || contest._id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayToJoinContest(contest);
                            }}
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Pay to Join (₹{price} all-incl.)
                          </Button>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                      <span>{entitled ? (isLive ? "Start Assessment" : "View Details") : "Unlock Assessment"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

export default ContestListPage;
