import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
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
  Sparkles
} from "lucide-react";
import { MathRenderer } from "../components/common/MathRenderer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { practiceApi } from "../services/practiceApi";
import { b2cApi } from "../services/b2cApi";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";

const TOPIC_TYPE_MAP = {
  QUANTITATIVE: { type: "APTITUDE", category: "QUANTITATIVE" },
  LOGICAL: { type: "APTITUDE", category: "LOGICAL" },
  VERBAL: { type: "APTITUDE", category: "VERBAL" },
  DI_ANALYTICS: { type: "APTITUDE", category: "DATA_INTERPRETATION" },
  DBMS: { type: "TECHNICAL", category: "DBMS" },
  OS: { type: "TECHNICAL", category: "OS" },
  NETWORKS: { type: "TECHNICAL", category: "NETWORKS" },
  OOP: { type: "TECHNICAL", category: "OOP" },
  BUSINESS_GK: { type: "NON_TECHNICAL", category: "BUSINESS" }
};
export function McqSessionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, subscription, planTier, isPaid, refreshSubscription } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  
  const topicName = searchParams.get("name") || "Quantitative Aptitude";
  const topicId = searchParams.get("topic") || "QUANTITATIVE";

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [verifications, setVerifications] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes
  const [attemptId, setAttemptId] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load real practice questions from backend
  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    setSessionCompleted(false);
    setSessionResult(null);
    setSelectedAnswers({});
    setVerifications({});
    setCurrentIndex(0);
    setShowExplanation(false);
    setTimerSeconds(600);
    const startMs = Date.now();
    setSessionStartTime(startMs);

    try {
      const topicConfig = TOPIC_TYPE_MAP[topicId] || { type: "MCQ", category: topicId };
      const categoryParam = topicConfig.category || topicId;

      let valid = [];
      // 1. Try PostgreSQL student practice endpoint first
      try {
        const res = await practiceApi.getPracticeQuestions({
          topic: categoryParam,
          category: categoryParam,
          type: "MCQ",
          limit: 20
        });

        const list = (res && (res.questions || res.data)) || [];
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map((q) => {
            let options = q.options || q.optionTexts || [];
            if (typeof options === "string") {
              try { options = JSON.parse(options); } catch (e) { options = []; }
            }
            const optionTexts = (Array.isArray(options) ? options : []).map(opt =>
              typeof opt === "object" && opt !== null ? (opt.text || opt.value || '') : String(opt)
            );

            return {
              id: q.id,
              versionId: q.versionId || q.questionVersionId || q.id,
              question: q.statement || q.title || q.latestTitle || "Practice Question",
              options: optionTexts,
              formula: q.formula || (q.constraints?.includes('$') ? q.constraints : null),
              explanation: q.explanation || null
            };
          }).filter(q => q.options && q.options.length > 0);

          if (formatted.length > 0) {
            valid = formatted;
          }
        }
      } catch (pgErr) {
        console.warn("Direct practice questions fetch error, attempting catalog fallback:", pgErr);
      }

      // 2. Fallback: Query practice platform by topic type & category map
      if (valid.length === 0) {
        let res = null;
        try {
          res = await practiceApi.getQuestions({
            type: topicConfig.type || "MCQ",
            category: categoryParam,
            limit: 20
          });
        } catch (e) {
          res = await practiceApi.getQuestions({ topic: categoryParam, limit: 20 });
        }

        let list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.questions) ? res.questions : [];
        if (list.length === 0) {
          const fallbackRes = await practiceApi.getQuestions({ type: "MCQ", limit: 20 });
          list = Array.isArray(fallbackRes) ? fallbackRes : Array.isArray(fallbackRes?.data) ? fallbackRes.data : Array.isArray(fallbackRes?.questions) ? fallbackRes.questions : [];
        }

        // Fetch detailed question data if options are not already embedded
        const detailed = await Promise.all(
          list.slice(0, 15).map(async (item) => {
            try {
              let q = item;
              if (!q.options || q.options.length === 0) {
                const qRes = await practiceApi.getQuestionById(item.id);
                q = qRes?.data || qRes || item;
              }
              const v = (q.versions && q.versions[0]) || {};

              let options = q.options || q.optionTexts || v.options || [];
              if (typeof options === "string") {
                try { options = JSON.parse(options); } catch (e) { options = []; }
              }

              const optionTexts = (Array.isArray(options) ? options : []).map(opt =>
                typeof opt === "object" && opt !== null ? (opt.text || opt.value || '') : String(opt)
              );

              return {
                id: q.id,
                versionId: q.versionId || v.id || q.id,
                question: q.statement || v.statement || q.title || q.latestTitle || "Practice Question",
                formula: q.formula || v.metadata?.formula || null,
                options: optionTexts,
                explanation: q.explanation || v.explanation || null
              };
            } catch (detailErr) {
              return null;
            }
          })
        );

        valid = detailed.filter(q => q && q.options && q.options.length > 0);
      }

      setQuestions(valid);

      // Initialize unique backend practice attempt session
      if (valid.length > 0) {
        try {
          const attemptRes = await practiceApi.createAttempt({
            topic: topicName,
            category: categoryParam,
            questionIds: valid.map(q => q.id),
            questionVersionIds: valid.map(q => q.versionId || q.id)
          });
          if (attemptRes && (attemptRes.attemptId || attemptRes.data?.id)) {
            setAttemptId(attemptRes.attemptId || attemptRes.data.id);
          }
        } catch (attErr) {
          console.warn("Could not register backend practice attempt, proceeding with local session:", attErr);
        }
      }
    } catch (err) {
      console.error("MCQ Load questions error:", err);
      setError(err.message || "Failed to load practice questions from question bank.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [topicName, topicId]);

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

  // Sync active MCQ question with AI Coach Assistant
  useEffect(() => {
    if (!currentQ) return;
    setScreenContext({
      contextType: "PRACTICE_MCQ",
      data: {
        questionTitle: currentQ.question,
        category: topicName,
        options: currentQ.options,
        studentAnswer: selectedAnswers[currentIndex] !== undefined ? currentQ.options[selectedAnswers[currentIndex]] : null,
        correctOption: showExplanation ? verifications[currentIndex]?.correctAnswer : null
      }
    });
  }, [currentIndex, currentQ, topicName, selectedAnswers, showExplanation, verifications, setScreenContext]);

  const handleSelectOption = async (optionIdx) => {
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

    // Verify against PostgreSQL backend
    try {
      const selectedText = currentQ.options[optionIdx];
      const res = await practiceApi.verifyPracticeAnswer({
        questionId: currentQ.id,
        selectedOption: selectedText,
        answerIndex: optionIdx
      });
      if (res && res.success) {
        setVerifications((prev) => ({
          ...prev,
          [currentIndex]: {
            isCorrect: res.isCorrect,
            correctAnswer: res.correctAnswer,
            explanation: res.explanation || currentQ.explanation
          }
        }));
      }
    } catch (err) {
      console.warn("Verify answer error:", err);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowExplanation(false);
    } else {
      handleFinishSession();
    }
  };

  const handleFinishSession = async () => {
    setIsSubmitting(true);
    let finalResult = null;

    // Build student responses map
    const formattedResponses = questions.map((q, idx) => ({
      questionId: q.id,
      questionVersionId: q.versionId || q.id,
      answerIndex: selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== null ? selectedAnswers[idx] : null,
      selectedOption: selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== null ? q.options[selectedAnswers[idx]] : null
    }));

    if (attemptId) {
      try {
        const timeSpent = Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000));
        const submitRes = await practiceApi.submitAttempt(attemptId, {
          responses: formattedResponses,
          timeSpentSeconds: timeSpent
        });
        if (submitRes && submitRes.data) {
          finalResult = submitRes.data;
        }
      } catch (submitErr) {
        console.warn("Submit attempt API error, falling back to authoritative local evaluation:", submitErr);
      }
    }

    // Authoritative fallback calculation if offline or backend error
    if (!finalResult) {
      const attempted = questions.filter((_, idx) => selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== null).length;
      const correct = questions.filter((_, idx) => verifications[idx]?.isCorrect === true).length;
      const incorrect = Math.max(0, attempted - correct);
      const unanswered = Math.max(0, questions.length - attempted);
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      const timeTakenSec = Math.max(0, Math.floor((Date.now() - sessionStartTime) / 1000));

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
        timeTakenSeconds: timeTakenSec,
        timeTakenDisplay: formatTimer(timeTakenSec)
      };
    }

    setSessionResult(finalResult);
    setSessionCompleted(true);
    setIsSubmitting(false);

    // Only record quota if at least one question was attempted
    if (finalResult.attemptedQuestions > 0) {
      try {
        await b2cApi.recordQuestionAttempt({
          questionType: "MCQ",
          count: finalResult.attemptedQuestions,
          topicId
        });
        await refreshSubscription();
        showSuccess("MCQ session completed and saved to your placement telemetry!");
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
    setShowExplanation(false);
    setTimerSeconds(600);
    setAttemptId(null);
    setSessionStartTime(Date.now());
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
        <Link
          to="/practice"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Practice Hub
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg font-mono text-xs font-medium text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {formatTimer(timerSeconds)}
          </div>
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

            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              <MathRenderer content={currentQ?.question} />
            </h2>

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

            {/* Explanation Toggle */}
            {selectedAnswers[currentIndex] !== undefined && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showExplanation ? "Hide Detailed Solution" : "View Step-by-Step Explanation"}
                </button>

                {showExplanation && (
                  <div className="mt-3 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 leading-relaxed">
                    <div className="font-bold text-indigo-900 mb-1">Solution Explanation:</div>
                    <MathRenderer content={verifications[currentIndex]?.explanation || "Solution verified via authoritative question bank."} />
                    {verifications[currentIndex]?.correctAnswer && (
                      <div className="mt-2 font-semibold text-emerald-700">
                        Correct Answer: {verifications[currentIndex].correctAnswer}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => {
                setCurrentIndex((prev) => Math.max(0, prev - 1));
                setShowExplanation(false);
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous Question
            </Button>

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
        /* Session Completed Scorecard */
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
            <Link to="/practice">
              <Button variant="outline">Browse Other Topics</Button>
            </Link>
            <Button
              variant="primary"
              onClick={handleRetakePractice}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Retake Practice
            </Button>
          </div>
        </Card>
      )}

    </div>
  );
}

export default McqSessionPage;
