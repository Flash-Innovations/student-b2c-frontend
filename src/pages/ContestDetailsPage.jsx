import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  Play,
  RotateCcw,
  RefreshCw,
  Code2,
  BrainCircuit,
  Binary,
  FileText,
  Lock,
  Crown,
  CheckCircle2,
  Info,
  Layers
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { practiceApi } from "../services/practiceApi";
import { b2cApi } from "../services/b2cApi";
import { openRazorpayCheckout } from "../services/razorpayClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function ContestDetailsPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user, subscription, planTier, refreshSubscription } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const [purchasingPass, setPurchasingPass] = useState(false);

  const fetchContestDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = null;
      try {
        const b2cRes = await b2cApi.getContestById(contestId);
        if (b2cRes && b2cRes.contest) {
          data = b2cRes.contest;
        }
      } catch (e) {}

      if (!data) {
        data = await practiceApi.getStudentContest(contestId);
      }

      if (data && (data.id || data.title || data._id)) {
        setContest(data);
      } else {
        setError("Contest details could not be found.");
        setContest(null);
      }
    } catch (err) {
      console.error("Error loading contest details:", err);
      setError(err.message || "Failed to load contest details.");
      setContest(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contestId) {
      fetchContestDetails();
    }
  }, [contestId]);

  // Check entitlement
  const reqTier = (contest?.tierRequired || contest?.tierRequirement || "FREE").toUpperCase();
  const isPremiumContest = reqTier === "PREMIUM" || contest?.isPremium;
  const isEntitled = () => {
    if (reqTier === "FREE") return true;
    if (planTier === "PREMIUM") return true;
    if ((reqTier === "BASIC" || reqTier === "REGULAR") && (planTier === "BASIC" || subscription?.regularContestsFree)) {
      return true;
    }
    const unlocked = subscription?.unlockedContestIds || [];
    return unlocked.includes(contest?.id || contest?._id);
  };

  const handleStartOrResume = async () => {
    if (!contest) return;

    // Check if attempt already exists in contest details
    if (contest.myAttempt && contest.myAttempt.id) {
      navigate(`/contests/${contest.id || contest._id}/attempt/${contest.myAttempt.id}`);
      return;
    }

    setStarting(true);
    try {
      const result = await practiceApi.startContestAttempt(contestId);
      const attemptId = result?.attempt?.id || result?.attemptId;
      if (attemptId) {
        navigate(`/contests/${contest.id || contest._id}/attempt/${attemptId}`);
      } else {
        showError("Could not initialize attempt session with assessment server.");
      }
    } catch (err) {
      showError(err.message || "Failed to initialize contest attempt.");
    } finally {
      setStarting(false);
    }
  };

  const handleBuyPass = async () => {
    try {
      setPurchasingPass(true);
      const addonType = isPremiumContest ? "CONTEST_PREMIUM_PASS" : "CONTEST_REGULAR_PASS";

      const orderData = await b2cApi.createOrder({
        addonType,
        contestId: contest?.id
      });

      if (!orderData || !orderData.orderId) {
        throw new Error("Unable to create ticket order.");
      }

      openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.totalAmountWithGst,
        currency: "INR",
        name: "Flash Contest Ticket",
        description: `Entry: ${contest?.title} (All-Inclusive)`,
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

            showSuccess("Successfully enrolled in contest!");
            await refreshSubscription();
            await fetchContestDetails();
          } catch (verifyErr) {
            showError("Payment received, but verification failed. Please contact support.");
          }
        },
        onFailure: (err) => {
          showError(err.message || "Payment cancelled.");
        }
      });
    } catch (err) {
      showError(err.message || "Failed to initiate pass checkout.");
    } finally {
      setPurchasingPass(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-6">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-48 bg-white border border-slate-200 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-28 bg-white border border-slate-200 rounded-xl" />
          <div className="h-28 bg-white border border-slate-200 rounded-xl" />
          <div className="h-28 bg-white border border-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <Card className="max-w-md mx-auto my-16 p-6 border-rose-200 bg-white text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Assessment Unavailable</h3>
        <p className="text-xs text-slate-600">{error || "Contest details could not be loaded."}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/contests")}>
            Browse Contests
          </Button>
          <Button variant="primary" size="sm" onClick={fetchContestDetails}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const now = Date.now();
  const startMs = new Date(contest.startAt).getTime();
  const endMs = new Date(contest.endAt).getTime();

  let timingState = "LIVE";
  if (contest.status === "CANCELLED") {
    timingState = "CANCELLED";
  } else if (now < startMs) {
    timingState = "UPCOMING";
  } else if (now >= endMs) {
    timingState = "ENDED";
  }

  const isLive = timingState === "LIVE";
  const isUpcoming = timingState === "UPCOMING";
  const isEnded = timingState === "ENDED";
  const hasExistingAttempt = Boolean(contest.myAttempt && contest.myAttempt.id);
  const isAttemptSubmitted = contest.myAttempt?.status === "SUBMITTED" || contest.myAttempt?.status === "TIMED_OUT";
  const entitled = isEntitled();

  const startDate = new Date(contest.startAt);
  const endDate = new Date(contest.endAt);
  const formatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  };
  const startFormatted = startDate.toLocaleDateString(undefined, formatOptions);
  const endFormatted = endDate.toLocaleDateString(undefined, formatOptions);

  const secBreakdown = contest.sectionBreakdown || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => navigate("/contests")}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          All Assessments
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={fetchContestDetails}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Assessment Header Card */}
      <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE NOW
                </span>
              ) : isUpcoming ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  UPCOMING
                </span>
              ) : (
                <Badge variant="neutral" size="sm">{timingState}</Badge>
              )}

              {isPremiumContest && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  Premium Assessment
                </span>
              )}

              <span className="text-xs text-slate-400 font-medium">
                {user?.collegeName || "Institutional Assessment"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {contest.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {contest.description || "Official placement drive evaluation session."}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0 sm:border-l sm:border-slate-100 sm:pl-6">
            <div className="text-3xl font-black text-slate-900 font-mono">
              {contest.totalMarks || 100}
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Total Marks ({contest.totalQuestions || 0} Questions)
            </div>
          </div>
        </div>

        {/* Schedule & Timing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" /> Duration
            </span>
            <div className="text-base font-extrabold text-slate-900">
              {contest.durationMinutes} Minutes
            </div>
            <p className="text-[11px] text-slate-500">Timed upon attempt start</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Window Opens
            </span>
            <div className="text-xs font-bold text-slate-900 leading-snug">
              {startFormatted}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-600" /> Window Closes
            </span>
            <div className="text-xs font-bold text-slate-900 leading-snug">
              {endFormatted}
            </div>
          </div>
        </div>

        {/* Existing Attempt Alert */}
        {hasExistingAttempt && (
          <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200 flex items-start gap-3 text-xs text-indigo-950">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-indigo-900">
                {isAttemptSubmitted
                  ? "You have already completed this assessment."
                  : "You have an active session for this assessment."}
              </p>
              <p className="text-indigo-800">
                {isAttemptSubmitted
                  ? "Your attempt has been submitted and server-evaluated. You can view your detailed scorecard."
                  : "You can resume your ongoing attempt before your session deadline expires."}
              </p>
            </div>
          </div>
        )}

        {/* Entitlement Lock Alert for Free Tier */}
        {!entitled && !hasExistingAttempt && (
          <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/70 space-y-3">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-amber-600" />
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  {isPremiumContest ? "Paid Premium Assessment Entry" : "Paid Assessment Entry"}
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  {isPremiumContest
                    ? planTier === "BASIC"
                      ? "Basic plan students get a 50% discount: Pay ₹50 (all-inclusive) to join this assessment."
                      : "Pay ₹100 (all-inclusive) to join this assessment, or upgrade to Premium for free access."
                    : "Included free with Basic or Premium plan, or pay ₹50 to join."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="primary"
                size="sm"
                loading={purchasingPass}
                onClick={handleBuyPass}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Pay to Join ({isPremiumContest ? (planTier === "BASIC" ? "₹50" : "₹100") : "₹50"} all-incl.)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/pricing")}
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
        )}

        {/* Action Button Strip */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {isLive
              ? "The assessment window is currently open."
              : isUpcoming
              ? "The assessment will become available when the window opens."
              : "This assessment window has closed."}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(`/contests/${contest.id}/leaderboard`)}
              className="font-semibold"
            >
              <Trophy className="w-4 h-4 mr-1.5 text-amber-500" />
              Leaderboard
            </Button>

            {hasExistingAttempt && isAttemptSubmitted ? (
              <Button
                variant="primary"
                size="md"
                onClick={() =>
                  navigate(`/contests/${contest.id}/result/${contest.myAttempt.id}`)
                }
              >
                View Scorecard
              </Button>
            ) : hasExistingAttempt && !isAttemptSubmitted ? (
              <Button
                variant="primary"
                size="md"
                loading={starting}
                onClick={handleStartOrResume}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Resume Contest
              </Button>
            ) : isLive ? (
              <Button
                variant="primary"
                size="md"
                disabled={!entitled}
                loading={starting}
                onClick={handleStartOrResume}
                className={entitled ? "bg-indigo-600 hover:bg-indigo-700" : "opacity-60"}
              >
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                Start Contest
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                disabled
                className="opacity-60"
              >
                {isUpcoming ? "Contest Not Started Yet" : "Contest Window Closed"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Sections Breakdown */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          Assessment Sections & Question Composition
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Coding Section */}
          <Card className="p-4 bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Code2 className="w-4 h-4" />
              </div>
              <Badge variant={secBreakdown.CODING?.count > 0 ? "success" : "neutral"} size="xs">
                {secBreakdown.CODING?.count > 0 ? `${secBreakdown.CODING.marks} Marks` : "Not Present"}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Algorithmic Coding</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {secBreakdown.CODING?.count || 0} Challenge(s) • Live Judge0 sandbox evaluation against sample & hidden test cases.
              </p>
            </div>
          </Card>

          {/* Aptitude Section */}
          <Card className="p-4 bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <Badge variant={secBreakdown.APTITUDE?.count > 0 ? "primary" : "neutral"} size="xs">
                {secBreakdown.APTITUDE?.count > 0 ? `${secBreakdown.APTITUDE.marks} Marks` : "Not Present"}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Aptitude & Reasoning</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {secBreakdown.APTITUDE?.count || 0} Question(s) • Quantitative aptitude, logical deduction, and data interpretation.
              </p>
            </div>
          </Card>

          {/* Technical Section */}
          <Card className="p-4 bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Binary className="w-4 h-4" />
              </div>
              <Badge variant={secBreakdown.TECHNICAL?.count > 0 ? "primary" : "neutral"} size="xs">
                {secBreakdown.TECHNICAL?.count > 0 ? `${secBreakdown.TECHNICAL.marks} Marks` : "Not Present"}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Computer Science Core</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {secBreakdown.TECHNICAL?.count || 0} Question(s) • Operating Systems, DBMS, Object-Oriented Programming, Networks.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Contest Rules & Instructions */}
      <Card className="p-6 bg-white border border-slate-200 space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          Instructions & Assessment Rules
        </h3>

        {contest.instructions ? (
          <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 font-mono">
            {contest.instructions}
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-slate-600 space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="font-semibold text-slate-800">General Candidate Guidelines:</p>
            <p>1. <strong>Session Timer:</strong> Once started, your session timer will run continuously on the server for {contest.durationMinutes} minutes.</p>
            <p>2. <strong>Auto-Saving:</strong> MCQ selections and coding source code are saved automatically as you practice.</p>
            <p>3. <strong>Submission:</strong> You can submit responses section by section or finalize all answers before your deadline expires.</p>
            <p>4. <strong>Scoring:</strong> Server-authoritative scoring calculates final scores upon contest submission.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ContestDetailsPage;
