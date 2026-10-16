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
import { b2cApi } from "../services/b2cApi";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";

const SAMPLE_QUESTIONS = [
  {
    id: "q1",
    question: "A pipe can fill a cistern in 12 hours and another pipe can empty it in 20 hours. If both the pipes are opened together, how long will it take to fill the cistern?",
    formula: "\\text{Net Rate} = \\frac{1}{12} - \\frac{1}{20} = \\frac{5 - 3}{60} = \\frac{2}{60} = \\frac{1}{30}",
    options: [
      "25 hours",
      "30 hours",
      "35 hours",
      "40 hours"
    ],
    correctIndex: 1,
    explanation: "Pipe A's 1 hour work = 1/12. Pipe B's 1 hour work = -1/20. Net rate per hour = 1/12 - 1/20 = (5-3)/60 = 2/60 = 1/30. Hence, it takes 30 hours to fill the cistern."
  },
  {
    id: "q2",
    question: "In a relational database, what normal form ensures that there is no transitive functional dependency of non-prime attributes on any candidate key?",
    formula: "X \\rightarrow Y \\text{ and } Y \\rightarrow Z \\implies X \\rightarrow Z \\quad (\\text{Transitive Dependency})",
    options: [
      "First Normal Form (1NF)",
      "Second Normal Form (2NF)",
      "Third Normal Form (3NF)",
      "Boyce-Codd Normal Form (BCNF)"
    ],
    correctIndex: 2,
    explanation: "Third Normal Form (3NF) requires 2NF compliance and ensures that no non-prime attribute is transitively dependent on the primary key."
  },
  {
    id: "q3",
    question: "Which CPU scheduling algorithm gives minimum average waiting time for a given set of processes?",
    options: [
      "First-Come, First-Served (FCFS)",
      "Shortest Job First (SJF / SJN)",
      "Round Robin (RR)",
      "Priority Scheduling"
    ],
    correctIndex: 1,
    explanation: "Shortest Job First (SJF) is theoretically optimal in terms of minimizing average waiting time for a scheduled queue of jobs."
  },
  {
    id: "q4",
    question: "What is the tightest time complexity to find the shortest path from a single source in an unweighted directed graph with V vertices and E edges?",
    formula: "O(V + E)",
    options: [
      "O(V log V)",
      "O(V^2)",
      "O(V + E) using Breadth-First Search (BFS)",
      "O(E log V) using Dijkstra's Algorithm"
    ],
    correctIndex: 2,
    explanation: "In an unweighted graph, standard Breadth-First Search (BFS) computes single-source shortest paths in O(V + E) time."
  },
  {
    id: "q5",
    question: "Which of the following is true regarding ACID properties in database transactions?",
    options: [
      "Atomicity guarantees non-blocking queries.",
      "Consistency ensures the database transitions only from one valid state to another.",
      "Durability implies memory-cached persistence before disk flush.",
      "Isolation prevents relational foreign key constraints."
    ],
    correctIndex: 1,
    explanation: "Consistency ensures any transaction will bring the database from one valid state to another valid state, preserving all defined invariants and constraints."
  }
];

export function McqSessionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, subscription, planTier, isPaid, refreshSubscription } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const topicName = searchParams.get("name") || "Quantitative Aptitude";
  const topicId = searchParams.get("topic") || "QUANTITATIVE";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes

  // Quota check
  const mcqCount = subscription?.mcqAttemptedCount || 0;
  const mcqLimit = subscription?.mcqLimit || 100;
  const isExhausted = !isPaid && mcqCount >= mcqLimit;

  // Timer
  useEffect(() => {
    if (sessionCompleted || isExhausted) return;
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
  }, [sessionCompleted, isExhausted]);

  const currentQ = SAMPLE_QUESTIONS[currentIndex];

  const handleSelectOption = (optionIdx) => {
    if (sessionCompleted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIdx
    }));
  };

  const handleNext = () => {
    if (currentIndex < SAMPLE_QUESTIONS.length - 1) {
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

  // Calculate score upon completion
  let correctCount = 0;
  if (sessionCompleted) {
    SAMPLE_QUESTIONS.forEach((q, idx) => {
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

      {!sessionCompleted ? (
        <div className="space-y-6">
          
          {/* Question Card */}
          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question {currentIndex + 1} of {SAMPLE_QUESTIONS.length}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {Object.keys(selectedAnswers).length} Answered
              </span>
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
              {currentIndex < SAMPLE_QUESTIONS.length - 1 ? (
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
                {correctCount}/{SAMPLE_QUESTIONS.length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">Accuracy</div>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                {Math.round((correctCount / SAMPLE_QUESTIONS.length) * 100)}%
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
