import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Check,
  X
} from "lucide-react";
import { MathRenderer } from "../components/common/MathRenderer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { practiceApi } from "../services/practiceApi";
import { b2cApi } from "../services/b2cApi";
import { practicePreloadService } from "../services/practicePreloadService";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";

const TOPIC_TYPE_MAP = {
  QUANTITATIVE: { type: "APTITUDE", category: "QUANTITATIVE" },
  LOGICAL: { type: "APTITUDE", category: "LOGICAL" },
  VERBAL: { type: "APTITUDE", category: "VERBAL" },
  DI_ANALYTICS: { type: "APTITUDE", category: "DATA_INTERPRETATION" },
  DBMS: { type: "TECHNICAL", category: "DBMS" },
  OS: { type: "TECHNICAL", category: "OPERATING_SYSTEMS" },
  NETWORKS: { type: "TECHNICAL", category: "NETWORKS" },
  OOP: { type: "TECHNICAL", category: "OOP" },
  BUSINESS_GK: { type: "NON_TECHNICAL", category: "BUSINESS" }
};
export function McqSessionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, subscription, planTier, isPaid, refreshSubscription } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  
  const topicName = searchParams.get("name") || "Quantitative Aptitude";
  const topicId = searchParams.get("topic") || "QUANTITATIVE";
  const isResultView = searchParams.get("view") === "result";

  // Recover session result if refreshed or navigated to on result view
  const initialResult = location.state?.result || (() => {
    try {
      const stored = sessionStorage.getItem(`flash_last_result_${topicId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  })();

  const initialQuestions = location.state?.questions || (() => {
    try {
      const s = sessionStorage.getItem(`flash_last_questions_${topicId}`);
      return s ? JSON.parse(s) : [];
    } catch (_) { return []; }
  })();

  const initialAnswers = location.state?.selectedAnswers || (() => {
    try {
      const s = sessionStorage.getItem(`flash_last_answers_${topicId}`);
      return s ? JSON.parse(s) : {};
    } catch (_) { return {}; }
  })();

  const initialVerifs = location.state?.verifications || (() => {
    try {
      const s = sessionStorage.getItem(`flash_last_verifs_${topicId}`);
      return s ? JSON.parse(s) : {};
    } catch (_) { return {}; }
  })();

  const [questions, setQuestions] = useState(isResultView && initialQuestions.length > 0 ? initialQuestions : []);
  const [loading, setLoading] = useState(!isResultView);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(isResultView ? initialAnswers : {});
  const [verifications, setVerifications] = useState(isResultView ? initialVerifs : {});
  const [sessionCompleted, setSessionCompleted] = useState(isResultView && Boolean(initialResult));
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes
  const [attemptId, setAttemptId] = useState(null);
  const [sessionResult, setSessionResult] = useState(initialResult);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load real practice questions from backend (Instantly from preloader cache, or via preload service)
  const loadQuestions = async () => {
    setError(null);
    setSessionCompleted(false);
    setSessionResult(null);
    setSelectedAnswers({});
    setVerifications({});
    setCurrentIndex(0);
    setTimerSeconds(600); // 10 minutes strictly
    setSessionStartTime(Date.now());

    // Fix vi: Check preloaded cache for instantaneous 0ms loading
    const cached = practicePreloadService.consumePreloadedQuestions(topicId);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setQuestions(cached.slice(0, 10));
      setLoading(false);

      // Initialize backend practice attempt session in the background
      const topicConfig = TOPIC_TYPE_MAP[topicId] || { type: "MCQ", category: topicId };
      const categoryParam = topicConfig.category || topicId;
      practiceApi.createAttempt({
        topic: topicName,
        category: categoryParam,
        questionIds: cached.map(q => q.id),
        questionVersionIds: cached.map(q => q.versionId || q.id)
      }).then(res => {
        if (res && (res.attemptId || res.data?.id)) {
          setAttemptId(res.attemptId || res.data.id);
        }
      }).catch(() => {});
      return;
    }

    // Cache miss: perform fetch via preloadSubject
    setLoading(true);
    try {
      const valid = await practicePreloadService.preloadSubject(topicId);
      const sessionQuestions = (valid && valid.length > 0 ? valid : []).slice(0, 10);
      setQuestions(sessionQuestions);

      if (sessionQuestions.length > 0) {
        const topicConfig = TOPIC_TYPE_MAP[topicId] || { type: "MCQ", category: topicId };
        const categoryParam = topicConfig.category || topicId;
        practiceApi.createAttempt({
          topic: topicName,
          category: categoryParam,
          questionIds: sessionQuestions.map(q => q.id),
          questionVersionIds: sessionQuestions.map(q => q.versionId || q.id)
        }).then(res => {
          if (res && (res.attemptId || res.data?.id)) {
            setAttemptId(res.attemptId || res.data.id);
          }
        }).catch(() => {});
      } else {
        setError("No practice questions found for this topic right now. Please try another subject.");
      }
    } catch (err) {
      console.error("MCQ Load questions error:", err);
      setError(err.message || "Failed to load practice questions from question bank.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isResultView) {
      if (!initialResult) {
        // No result data to display; return cleanly to Practice Hub
        navigate("/practice", { replace: true });
      }
      return;
    }
    loadQuestions();
  }, [topicName, topicId, isResultView]);

  // Handle browser Back button on the Result Screen: take student back to Practice Hub
  useEffect(() => {
    if (sessionCompleted || isResultView) {
      const handlePopState = () => {
        navigate("/practice", { replace: true });
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [sessionCompleted, isResultView, navigate]);

  // Prevent accidental navigation during active test with unsubmitted answers
  useEffect(() => {
    if (!sessionCompleted && !isResultView && questions.length > 0 && Object.keys(selectedAnswers).length > 0) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = "You have an active test session. If you leave, your answers will not be recorded.";
        return e.returnValue;
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [sessionCompleted, isResultView, questions.length, selectedAnswers]);

  // Quota check
  const mcqCount = subscription?.mcqAttemptedCount || 0;
  const mcqLimit = subscription?.mcqLimit || 100;
  const isExhausted = !isPaid && mcqCount >= mcqLimit;

  // Timer
  useEffect(() => {
    if (sessionCompleted || isExhausted || loading || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionCompleted, isExhausted, loading, questions.length]);

  const currentQ = questions[currentIndex] || null;

  const handleSelectOption = (optionIdx) => {
    if (sessionCompleted || !currentQ) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIdx
    }));

    // Record response on backend practice attempt
    if (attemptId) {
      practiceApi.recordResponse(attemptId, {
        questionId: currentQ.id,
        questionVersionId: currentQ.versionId || currentQ.id,
        answerIndex: optionIdx,
        selectedOption: currentQ.options[optionIdx]
      }).catch((e) => console.warn("Record practice response warning:", e));
    }
  };

  const handleClearOption = () => {
    if (sessionCompleted || !currentQ) return;
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinishSession();
    }
  };

  const handleFinishSession = async () => {
    setIsSubmitting(true);
    let finalResult = null;

    // Concurrently evaluate all questions to build verification map for scorecard review
    const verifMap = {};
    const verifyPromises = questions.map(async (q, idx) => {
      const answerIdx = selectedAnswers[idx];
      const hasAnswered = answerIdx !== undefined && answerIdx !== null;
      const selectedText = hasAnswered && q.options ? q.options[answerIdx] : null;

      try {
        const res = await practiceApi.verifyPracticeAnswer({
          questionId: q.id,
          selectedOption: selectedText,
          answerIndex: hasAnswered ? answerIdx : undefined
        });
        const data = res?.data || res;
        verifMap[idx] = {
          isCorrect: Boolean(data?.isCorrect),
          correctAnswer: data?.correctAnswer || q.correctAnswer,
          correctIndex: data?.correctIndex !== undefined ? data.correctIndex : -1,
          explanation: data?.explanation || q.explanation,
          selectedOption: selectedText
        };
      } catch (_) {
        verifMap[idx] = {
          isCorrect: false,
          selectedOption: selectedText,
          correctAnswer: q.correctAnswer,
          correctIndex: -1,
          explanation: q.explanation || "Detailed solution is recorded in the question repository."
        };
      }
    });

    await Promise.all(verifyPromises);
    setVerifications(verifMap);

    // Build student responses map
    const formattedResponses = questions.map((q, idx) => ({
      questionId: q.id,
      questionVersionId: q.versionId || q.id,
      answerIndex: selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== null ? selectedAnswers[idx] : null,
      selectedOption: selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== null ? q.options[selectedAnswers[idx]] : null
    }));

    const timeSpent = Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000));

    if (attemptId) {
      try {
        const submitRes = await practiceApi.submitAttempt(attemptId, {
          responses: formattedResponses,
          timeSpentSeconds: timeSpent
        });
        if (submitRes && submitRes.data) {
          finalResult = submitRes.data;
        }
      } catch (_) {}
    }

    // Authoritative calculation of scorecard
    if (!finalResult) {
      const attempted = questions.filter((_, idx) => selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== null).length;
      const correct = questions.filter((_, idx) => verifMap[idx]?.isCorrect === true).length;
      const incorrect = Math.max(0, attempted - correct);
      const unanswered = Math.max(0, questions.length - attempted);
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

      finalResult = {
        totalQuestions: questions.length,
        attemptedQuestions: attempted,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
        unansweredQuestions: unanswered,
        score: correct,
        maximumMarks: questions.length,
        accuracy,
        accuracyDisplay: attempted === 0 ? "0%" : `${accuracy}%`,
        timeTakenSeconds: timeSpent,
        timeTakenDisplay: formatTimer(timeSpent)
      };
    }

    setSessionResult(finalResult);
    setSessionCompleted(true);
    setIsSubmitting(false);

    try {
      sessionStorage.setItem(`flash_last_result_${topicId}`, JSON.stringify(finalResult));
      sessionStorage.setItem(`flash_last_questions_${topicId}`, JSON.stringify(questions));
      sessionStorage.setItem(`flash_last_answers_${topicId}`, JSON.stringify(selectedAnswers));
      sessionStorage.setItem(`flash_last_verifs_${topicId}`, JSON.stringify(verifMap));
    } catch (_) {}

    // Replace browser history entry so the in-progress questionnaire is eliminated from back/forward history!
    navigate(
      `/practice/mcq?topic=${encodeURIComponent(topicId)}&name=${encodeURIComponent(topicName)}&view=result`,
      {
        replace: true,
        state: { completed: true, result: finalResult, questions, verifications: verifMap, selectedAnswers }
      }
    );

    // Record exact count of attempted MCQs, correct count, and per-subject telemetry
    if (finalResult.attemptedQuestions > 0) {
      try {
        const attemptedIds = questions
          .filter((_, idx) => selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== null)
          .map((q) => q.id);

        practicePreloadService.markAttempted(attemptedIds);

        await b2cApi.recordQuestionAttempt({
          questionType: "MCQ",
          count: finalResult.attemptedQuestions,
          correctCount: finalResult.correctAnswers,
          subject: topicId,
          topicId,
          questionIds: attemptedIds
        });
        await refreshSubscription();
        showSuccess(`Saved ${finalResult.attemptedQuestions} questions to your placement telemetry!`);
      } catch (err) {
        console.warn("Attempt record error:", err);
      }
    }
  };

  const handleRetakePractice = () => {
    setSessionCompleted(false);
    setSessionResult(null);
    setSelectedAnswers({});
    setVerifications({});
    setCurrentIndex(0);
    setTimerSeconds(600);
    setAttemptId(null);
    setSessionStartTime(Date.now());
    try {
      sessionStorage.removeItem(`flash_last_result_${topicId}`);
      sessionStorage.removeItem(`flash_last_questions_${topicId}`);
      sessionStorage.removeItem(`flash_last_answers_${topicId}`);
      sessionStorage.removeItem(`flash_last_verifs_${topicId}`);
    } catch (_) {}
    navigate(
      `/practice/mcq?topic=${encodeURIComponent(topicId)}&name=${encodeURIComponent(topicName)}`,
      { replace: true }
    );
    loadQuestions();
  };

  const formatTimer = (totalSec) => {
    const s = Math.max(0, parseInt(totalSec, 10) || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Render mathematical formula with KaTeX
  const renderFormulaHtml = (tex) => {
    if (!tex) return null;
    try {
      return { __html: katex.renderToString(tex, { throwOnError: false }) };
    } catch (e) {
      return { __html: tex };
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-64 bg-white border border-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto space-y-4 my-8">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">Questions Unavailable</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="primary" size="sm" onClick={() => loadQuestions()}>Try Again</Button>
          <Link to="/practice">
            <Button variant="outline" size="sm">Back to Practice Hub</Button>
          </Link>
        </div>
      </Card>
    );
  }
  if (isExhausted) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto space-y-4 my-8">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">Free MCQ Quota Exhausted</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          You have completed {mcqCount} of {mcqLimit} free MCQs included in the Free tier. Upgrade to Basic (₹99/mo) or Premium (₹199/mo) to unlock unlimited MCQs across all aptitude and computer science subjects.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/practice">
            <Button variant="outline" size="sm">Back to Hub</Button>
          </Link>
          <Link to="/pricing">
            <Button variant="primary" size="sm">Upgrade Plan</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Questions Available</h2>
        <p className="text-sm text-slate-600">
          There are currently no active practice questions configured for {topicName}.
        </p>
        <div className="pt-2">
          <Link to="/practice">
            <Button variant="outline">
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              Back to Practice Hub
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Scorecard values derived from authoritative sessionResult or safe fallback
  const displayedScore = sessionResult ? sessionResult.score : 0;
  const displayedMaxMarks = sessionResult ? (sessionResult.maximumMarks || questions.length) : questions.length;
  const displayedAttempted = sessionResult
    ? sessionResult.attemptedQuestions
    : questions.filter((_, idx) => selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== null).length;
  const displayedCorrect = sessionResult
    ? sessionResult.correctAnswers
    : questions.filter((_, idx) => verifications[idx]?.isCorrect === true).length;
  const displayedIncorrect = sessionResult
    ? sessionResult.incorrectAnswers
    : Math.max(0, displayedAttempted - displayedCorrect);
  const displayedUnanswered = sessionResult
    ? sessionResult.unansweredQuestions
    : Math.max(0, questions.length - displayedAttempted);
  const displayedAccuracy = sessionResult
    ? (sessionResult.accuracyDisplay || (displayedAttempted === 0 ? "0%" : `${sessionResult.accuracy}%`))
    : (displayedAttempted === 0 ? "0%" : `${Math.round((displayedCorrect / displayedAttempted) * 100)}%`);
  const displayedTimeTaken = sessionResult?.timeTakenDisplay || formatTimer(Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000)));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={() => {
            if (!sessionCompleted && Object.keys(selectedAnswers).length > 0) {
              if (window.confirm("Are you sure you want to exit this active session? Your answers will not be recorded.")) {
                navigate("/practice", { replace: true });
              }
            } else {
              navigate("/practice", { replace: true });
            }
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Practice Hub
        </button>

        <div className="flex items-center gap-3">
          {!sessionCompleted && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg font-mono text-xs font-medium text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {formatTimer(timerSeconds)}
            </div>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 border border-slate-200/80">
            {topicName}
          </span>
        </div>
      </div>

      {!sessionCompleted && currentQ ? (
        <div className="space-y-6">
          
          {/* Question Card */}
          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-slate-500">
                  {Object.keys(selectedAnswers).length} Answered
                </span>
              </div>
            </div>

            <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              <MathRenderer content={currentQ?.question} />
            </div>

            {currentQ?.formula && (
              <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center overflow-x-auto">
                <MathRenderer content={currentQ.formula.startsWith("$") ? currentQ.formula : `$$${currentQ.formula}$$`} />
              </div>
            )}

            {/* Options List */}
            <div className="mt-6 space-y-3">
              {(currentQ?.options || []).map((option, optIdx) => {
                const isSelected = selectedAnswers[currentIndex] === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500/20 shadow-xs"
                        : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className={`text-sm ${isSelected ? "font-bold text-indigo-950" : "text-slate-800"}`}>
                        <MathRenderer content={option} inline />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => {
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous Question
            </Button>

            {selectedAnswers[currentIndex] !== undefined && (
              <button
                type="button"
                onClick={handleClearOption}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 cursor-pointer"
              >
                Clear Choice
              </button>
            )}

            <Button
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              onClick={handleNext}
            >
              {currentIndex < questions.length - 1 ? (
                <>Next Question <ChevronRight className="w-4 h-4 ml-1" /></>
              ) : isSubmitting ? (
                <>Evaluating Answers...</>
              ) : (
                <>Finish & View Scorecard <CheckCircle2 className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>

        </div>
      ) : (
        /* Session Completed Scorecard & Question Review */
        <div className="space-y-6">
          <Card className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {topicName} Practice Result
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {displayedAttempted === 0 
                  ? "Session finished without attempting any questions." 
                  : "Your results have been recorded in your batch placement telemetry."}
              </p>
            </div>

            {/* Primary Metrics Grid: Score, Accuracy, Time Taken */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                  {displayedScore}/{displayedMaxMarks}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Accuracy</div>
                <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                  {displayedAccuracy}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Time Taken</div>
                <div className="text-2xl font-black text-indigo-600 font-mono mt-1">
                  {displayedTimeTaken}
                </div>
              </div>
            </div>

            {/* Question Breakdown: Attempted, Correct, Incorrect, Unanswered */}
            <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto pt-2">
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/80 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Attempted</div>
                <div className="text-lg font-black text-indigo-950 font-mono mt-0.5">
                  {displayedAttempted}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/80 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Correct</div>
                <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">
                  {displayedCorrect}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100/80 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Incorrect</div>
                <div className="text-lg font-black text-rose-950 font-mono mt-0.5">
                  {displayedIncorrect}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100/60 border border-slate-200/80 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unanswered</div>
                <div className="text-lg font-black text-slate-800 font-mono mt-0.5">
                  {displayedUnanswered}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/practice", { replace: true })}
              >
                Browse Other Topics
              </Button>
              <Button
                variant="primary"
                onClick={handleRetakePractice}
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Retake Practice
              </Button>
            </div>
          </Card>

          {/* Detailed Question Review & Solutions */}
          {questions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Question Review & Step-by-Step Solutions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review your answers, correct options, and detailed pedagogical explanations.
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  {questions.length} Question{questions.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const studentAnsIdx = selectedAnswers[idx];
                  const hasAnswered = studentAnsIdx !== undefined && studentAnsIdx !== null;
                  const v = verifications[idx];
                  const isCorrect = v?.isCorrect === true;
                  const correctIdx = v?.correctIndex !== undefined && v?.correctIndex >= 0
                    ? v.correctIndex
                    : (q.options || []).findIndex(
                        (opt) =>
                          v?.correctAnswer &&
                          String(opt).trim().toLowerCase() === String(v.correctAnswer).trim().toLowerCase()
                      );

                  return (
                    <Card key={q.id || idx} className="p-6 text-left border border-slate-200/90 shadow-2xs">
                      {/* Question Header & Status Badge */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Question {idx + 1} of {questions.length}
                        </span>
                        <div>
                          {!hasAnswered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Unanswered
                            </span>
                          ) : isCorrect ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3.5 h-3.5" /> Correct (+1)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <X className="w-3.5 h-3.5" /> Incorrect (0)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Statement */}
                      <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                        <MathRenderer content={q.statement || "No question statement provided."} />
                      </div>

                      {/* Options Grid */}
                      <div className="mt-4 space-y-2.5">
                        {(q.options || []).map((opt, optIdx) => {
                          const isStudentPick = hasAnswered && studentAnsIdx === optIdx;
                          const isThisOptionCorrect = optIdx === correctIdx || (
                            v?.correctAnswer &&
                            String(opt).trim().toLowerCase() === String(v.correctAnswer).trim().toLowerCase()
                          );

                          let borderAndBg = "bg-white border-slate-200/80 text-slate-700";
                          let badge = null;

                          if (isStudentPick && isThisOptionCorrect) {
                            borderAndBg = "bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500/20";
                            badge = (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded">
                                Your Choice (Correct)
                              </span>
                            );
                          } else if (isStudentPick && !isThisOptionCorrect) {
                            borderAndBg = "bg-rose-50/80 border-rose-500 text-rose-950 font-bold ring-1 ring-rose-500/20";
                            badge = (
                              <span className="text-[11px] font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded">
                                Your Choice (Incorrect)
                              </span>
                            );
                          } else if (!isStudentPick && isThisOptionCorrect) {
                            borderAndBg = "bg-emerald-50/40 border-emerald-400 text-emerald-900 font-medium border-dashed";
                            badge = (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                                Correct Answer
                              </span>
                            );
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${borderAndBg}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isStudentPick && isThisOptionCorrect
                                    ? "bg-emerald-600 text-white"
                                    : isStudentPick && !isThisOptionCorrect
                                    ? "bg-rose-600 text-white"
                                    : isThisOptionCorrect
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="text-sm">
                                  <MathRenderer content={opt} inline />
                                </span>
                              </div>
                              {badge && <div className="shrink-0 ml-2">{badge}</div>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Step-by-Step Explanation Card */}
                      <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-800 leading-relaxed">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1.5">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          Step-by-Step Explanation
                        </div>
                        <div className="text-slate-700 mt-1">
                          <MathRenderer
                            content={
                              v?.explanation ||
                              q.explanation ||
                              "Verified solution is recorded in the platform question bank."
                            }
                          />
                        </div>
                        {v?.correctAnswer && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/70 font-semibold text-emerald-800">
                            Correct Answer: <span className="font-bold">{v.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/practice", { replace: true })}
                >
                  Browse Other Topics
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRetakePractice}
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Retake Practice
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default McqSessionPage;
