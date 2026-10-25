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
import katex from "katex";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useScreenContext } from "../context/ScreenContext";
import { b2cApi } from "../services/b2cApi";
import { practiceApi } from "../services/practiceApi";
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
  const { setScreenContext, openAssistantWithQuery } = useScreenContext();

  const topicName = searchParams.get("name") || "Quantitative Aptitude";
  const topicId = searchParams.get("topic") || "QUANTITATIVE";

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes

  // Load real questions from Practice Platform
  useEffect(() => {
    let isMounted = true;
    async function loadQuestions() {
      setLoading(true);
      setError(null);
      try {
        const config = TOPIC_TYPE_MAP[topicId] || { type: "APTITUDE", category: topicId };
        let res = null;
        try {
          res = await practiceApi.getQuestions({ type: config.type, category: config.category, limit: 10 });
        } catch (e) {
          res = await practiceApi.getQuestions({ type: config.type, limit: 10 });
        }

        let list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        if (list.length === 0) {
          const fallbackRes = await practiceApi.getQuestions({ type: "APTITUDE", limit: 10 });
          list = Array.isArray(fallbackRes) ? fallbackRes : Array.isArray(fallbackRes?.data) ? fallbackRes.data : [];
        }

        // Fetch detailed question data (options, correct answer, explanation)
        const detailed = await Promise.all(
          list.slice(0, 10).map(async (item) => {
            try {
              const qRes = await practiceApi.getQuestionById(item.id);
              const q = qRes?.data || qRes || item;
              const v = (q.versions && q.versions[0]) || {};

              let options = v.options || q.options || [];
              if (typeof options === "string") {
                try { options = JSON.parse(options); } catch (e) { options = []; }
              }

              const optionTexts = (Array.isArray(options) ? options : []).map(opt =>
                typeof opt === "object" ? opt.text : opt
              );

              let correctIndex = 0;
              const rawAns = v.correctAnswer?.optionId || v.correctAnswer || q.correctAnswer;
              if (typeof rawAns === "string") {
                const found = (Array.isArray(options) ? options : []).findIndex(
                  opt => opt.id === rawAns || opt.text === rawAns
                );
                correctIndex = found >= 0 ? found : Math.max(0, rawAns.toUpperCase().charCodeAt(0) - 65);
              } else if (typeof rawAns === "number") {
                correctIndex = rawAns;
              }

              return {
                id: q.id,
                question: v.statement || q.statement || q.latestTitle || "Practice Question",
                formula: q.formula || v.metadata?.formula || null,
                options: optionTexts,
                correctIndex,
                explanation: v.explanation || q.explanation || "Standard analytical derivation."
              };
            } catch (detailErr) {
              return null;
            }
          })
        );

        if (isMounted) {
          const valid = detailed.filter(q => q && q.options && q.options.length > 0);
          setQuestions(valid);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load practice questions");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadQuestions();
    return () => { isMounted = false; };
  }, [topicId]);

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
        correctOption: showExplanation ? currentQ.options[currentQ.correctIndex] : null
      }
    });
  }, [currentIndex, currentQ, topicName, selectedAnswers, showExplanation, setScreenContext]);

  const handleSelectOption = (optionIdx) => {
    if (sessionCompleted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIdx
    }));
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
    setSessionCompleted(true);
    try {
      await b2cApi.recordQuestionAttempt({
        questionType: "MCQ",
        count: Object.keys(selectedAnswers).length || 1,
        topicId
      });
      await refreshSubscription();
      showSuccess("MCQ session completed and saved to your placement telemetry!");
    } catch (err) {
      console.warn("Attempt record error:", err);
    }
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
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

  // Calculate score upon completion
  let correctCount = 0;
  if (sessionCompleted) {
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });
  }

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
                <button
                  type="button"
                  onClick={() => openAssistantWithQuery(`Give me a 30-second elimination hack for this question: "${currentQ.question}" without directly stating the final answer.`, "HINT")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200/70 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  AI Coach Hint
                </button>
                <span className="text-xs font-medium text-slate-500">
                  {Object.keys(selectedAnswers).length} Answered
                </span>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQ.question}
            </h2>

            {currentQ.formula && (
              <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center overflow-x-auto">
                <div
                  className="font-mono text-sm text-slate-800 inline-block"
                  dangerouslySetInnerHTML={renderFormulaHtml(currentQ.formula)}
                />
              </div>
            )}

            {/* Options List */}
            <div className="mt-6 space-y-3">
              {currentQ.options.map((option, optIdx) => {
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
                        {option}
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
                    <strong>Solution: </strong> {currentQ.explanation}
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
              onClick={handleNext}
            >
              {currentIndex < questions.length - 1 ? (
                <>Next Question <ChevronRight className="w-4 h-4 ml-1" /></>
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
              Your results have been recorded in your batch placement telemetry.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {correctCount}/{questions.length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">Accuracy</div>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                {questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">Time Taken</div>
              <div className="text-2xl font-black text-indigo-600 font-mono mt-1">
                {formatTimer(600 - timerSeconds)}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <Link to="/practice">
              <Button variant="outline">Browse Other Topics</Button>
            </Link>
            <Button
              variant="primary"
              onClick={() => {
                setSessionCompleted(false);
                setSelectedAnswers({});
                setCurrentIndex(0);
                setTimerSeconds(600);
              }}
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
