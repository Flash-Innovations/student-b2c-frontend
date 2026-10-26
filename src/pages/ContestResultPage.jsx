import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
  Award,
  ShieldCheck,
  Code2,
  BrainCircuit,
  Binary,
  Layers,
  ChevronRight,
  Clock,
  Bookmark,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  Copy,
  CheckCheck,
  Filter,
  History
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { MathRenderer } from "../components/common/MathRenderer";
import { practiceApi } from "../services/practiceApi";
import { useAuth } from "../context/AuthContext";

export function ContestResultPage() {
  const { contestId, attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL"); // "ALL" | "CORRECT" | "INCORRECT" | "UNANSWERED" | "REVIEW"
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  useEffect(() => {
    async function loadResult() {
      setLoading(true);
      setError(null);
      try {
        const data = await practiceApi.getContestResult(contestId, attemptId);
        if (data && (data.totalScore !== undefined || data.status)) {
          setResult(data);
        } else {
          setError("Assessment result not ready or invalid attempt.");
        }
      } catch (err) {
        console.error("Failed to load contest result:", err);
        setError(err.message || "Failed to load contest results.");
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [contestId, attemptId]);

  const handleCopyCode = (code, qId) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCodeId(qId);
      setTimeout(() => setCopiedCodeId(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-900 rounded-2xl" />
        <div className="h-12 bg-white border border-slate-200 rounded-xl" />
        <div className="h-48 bg-white border border-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <Card className="max-w-md mx-auto my-16 p-6 border-rose-200 bg-white text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Scorecard Unavailable</h3>
        <p className="text-xs text-slate-600">{error || "No submission result was found for this assessment attempt."}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/contests")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Return to Contests
          </Button>
        </div>
      </Card>
    );
  }

  const {
    status = "SUBMITTED",
    totalScore = 0,
    totalMarks = 100,
    percentage = (totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0),
    aptitudeScore = 0,
    technicalScore = 0,
    codingScore = 0,
    timeTakenFormatted = "N/A",
    timeTakenSeconds = 0,
    contestTitle = "Placement Assessment",
    submittedAt = null,
    summary = {},
    questions = []
  } = result;

  const totalQuestions = summary.totalQuestions || questions.length || 0;
  const attemptedCount = summary.attemptedCount !== undefined ? summary.attemptedCount : questions.filter(q => q.isAttempted).length;
  const unansweredCount = summary.unansweredCount !== undefined ? summary.unansweredCount : (totalQuestions - attemptedCount);
  const correctCount = summary.correctCount !== undefined ? summary.correctCount : questions.filter(q => q.isCorrect).length;
  const incorrectCount = summary.incorrectCount !== undefined ? summary.incorrectCount : questions.filter(q => q.isAttempted && !q.isCorrect).length;
  const reviewCount = summary.markedForReviewCount !== undefined ? summary.markedForReviewCount : questions.filter(q => q.isMarkedForReview).length;

  const submittedDateStr = submittedAt
    ? new Date(submittedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "Recently Submitted";

  // Filter questions according to active tab
  const filteredQuestions = questions.filter((q) => {
    if (activeFilter === "CORRECT") return q.isCorrect;
    if (activeFilter === "INCORRECT") return q.isAttempted && !q.isCorrect;
    if (activeFilter === "UNANSWERED") return !q.isAttempted;
    if (activeFilter === "REVIEW") return Boolean(q.isMarkedForReview);
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => navigate("/contests")}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Assessments
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={status === "TIMED_OUT" ? "warning" : "success"} size="sm">
            {status === "TIMED_OUT" ? "Timed Out & Evaluated" : "Officially Submitted"}
          </Badge>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {submittedDateStr}
          </span>
        </div>
      </div>

      {/* Main Scorecard Hero Card */}
      <Card className="p-8 text-center bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white relative overflow-hidden shadow-lg border-0">
        <div className="relative z-10 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Trophy className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              {contestTitle}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 font-mono">
              {totalScore} <span className="text-lg font-normal text-indigo-200">/ {totalMarks} Marks</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                percentage >= 70 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                percentage >= 40 ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" :
                "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                {percentage}% Score
              </span>
              <span className="text-xs text-indigo-200">
                {percentage >= 70 ? "Excellent Performance" : percentage >= 40 ? "Good Performance" : "Keep Practicing"}
              </span>
            </div>
          </div>

          {/* 6 Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 max-w-3xl mx-auto">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                Total Score
              </span>
              <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                {totalScore}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                Percentage
              </span>
              <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                {percentage}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 backdrop-blur-xs border border-emerald-500/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">
                Correct
              </span>
              <span className="text-sm font-bold text-emerald-300 font-mono mt-0.5 block">
                {correctCount}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/15 backdrop-blur-xs border border-rose-500/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 block">
                Incorrect
              </span>
              <span className="text-sm font-bold text-rose-300 font-mono mt-0.5 block">
                {incorrectCount}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-500/20 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                Unanswered
              </span>
              <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">
                {unansweredCount}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                Time Taken
              </span>
              <span className="text-sm font-bold text-white font-mono mt-0.5 block truncate">
                {timeTakenFormatted}
              </span>
            </div>
          </div>

          {/* Sectional Breakdown Chips */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] font-semibold text-indigo-200 block">Aptitude</span>
              <span className="text-xs font-bold text-white font-mono">{aptitudeScore} M</span>
            </div>
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] font-semibold text-indigo-200 block">Technical</span>
              <span className="text-xs font-bold text-white font-mono">{technicalScore} M</span>
            </div>
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] font-semibold text-indigo-200 block">Coding</span>
              <span className="text-xs font-bold text-white font-mono">{codingScore} M</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Question Review Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Questions", count: questions.length },
            { id: "CORRECT", label: "Correct", count: correctCount, color: "text-emerald-700 bg-emerald-50" },
            { id: "INCORRECT", label: "Incorrect", count: incorrectCount, color: "text-rose-700 bg-rose-50" },
            { id: "UNANSWERED", label: "Unanswered", count: unansweredCount, color: "text-slate-700 bg-slate-100" },
            { id: "REVIEW", label: "Marked for Review", count: reviewCount, color: "text-amber-700 bg-amber-50" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeFilter === tab.id ? "bg-white/20 text-white" : (tab.color || "bg-slate-200 text-slate-700")
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-medium px-1">
          Showing {filteredQuestions.length} of {questions.length} questions
        </span>
      </div>

      {/* Question-by-Question Review List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-slate-200">
            <p className="text-xs text-slate-500">No questions found matching the selected filter ({activeFilter}).</p>
          </Card>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isCorrect = q.isCorrect;
            const isAttempted = q.isAttempted;
            const isMarkedForReview = q.isMarkedForReview;
            const marksAwarded = Number(q.marksAwarded || 0);
            const marksAvailable = Number(q.marksAvailable || 0);
            const isCoding = q.type === "CODING";

            return (
              <Card
                key={q.questionVersionId || q.questionId || idx}
                className="p-5 bg-white border border-slate-200 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header row: Question Number, Section, Topic, Marks & Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 font-mono">
                      Q{q.questionNumber || idx + 1}
                    </span>
                    <Badge variant="neutral" size="xs">
                      {q.section}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                      {q.topic || "General"}
                    </span>
                    <Badge variant={q.difficulty === "HARD" ? "danger" : q.difficulty === "MEDIUM" ? "warning" : "success"} size="xs">
                      {q.difficulty}
                    </Badge>
                    {isMarkedForReview && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        <Bookmark className="w-3 h-3 fill-amber-500 text-amber-600" />
                        Marked for Review
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span className={`text-xs font-extrabold font-mono ${
                        marksAwarded > 0 ? "text-emerald-600" : marksAwarded < 0 ? "text-rose-600" : "text-slate-600"
                      }`}>
                        {marksAwarded > 0 ? `+${marksAwarded}` : marksAwarded} / {marksAvailable} Marks
                      </span>
                    </div>

                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        Correct
                      </span>
                    ) : isAttempted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        Incorrect
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        Unanswered
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Statement */}
                <div className="text-sm font-normal text-slate-800 leading-relaxed">
                  <MathRenderer content={q.statement || "No statement text provided for this question."} />
                </div>

                {/* MCQ Options Rendering */}
                {!isCoding && Array.isArray(q.options) && q.options.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Options & Answer Evaluation:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const optLetter = opt.letter || String.fromCharCode(65 + optIdx);
                        const optIndex = opt.index !== undefined ? opt.index : optIdx;

                        // Check if student selected this option
                        const isStudentChoice = Boolean(
                          opt.isStudentChoice ||
                          (q.studentAnswer && (
                            q.studentAnswer.index === optIndex ||
                            (q.studentAnswer.optionId && String(q.studentAnswer.optionId).toLowerCase() === String(opt.id || '').toLowerCase()) ||
                            (q.studentAnswer.text && String(q.studentAnswer.text).trim().toLowerCase() === String(opt.text || '').trim().toLowerCase()) ||
                            (q.studentAnswer.letter && q.studentAnswer.letter.toUpperCase() === optLetter.toUpperCase())
                          )) ||
                          (q.userResponse && (
                            (q.userResponse.optionId && String(q.userResponse.optionId).toLowerCase() === String(opt.id || '').toLowerCase()) ||
                            (q.userResponse.selectedOption && String(q.userResponse.selectedOption).trim().toLowerCase() === String(opt.text || '').trim().toLowerCase())
                          ))
                        );

                        // Check if this option is the authorized correct answer
                        const isCorrectChoice = Boolean(
                          opt.isCorrectChoice ||
                          (q.correctOption && (
                            q.correctOption.index === optIndex ||
                            (q.correctOption.optionId && String(q.correctOption.optionId).toLowerCase() === String(opt.id || '').toLowerCase()) ||
                            (q.correctOption.letter && q.correctOption.letter.toUpperCase() === optLetter.toUpperCase()) ||
                            (q.correctOption.text && String(q.correctOption.text).trim().toLowerCase() === String(opt.text || '').trim().toLowerCase())
                          )) ||
                          (q.correctAnswer && (
                            (typeof q.correctAnswer === "string" && (
                              String(q.correctAnswer).trim().toLowerCase() === String(opt.text || '').trim().toLowerCase() ||
                              String(q.correctAnswer).toLowerCase() === String(opt.id || '').toLowerCase() ||
                              String(q.correctAnswer).toUpperCase() === optLetter.toUpperCase()
                            )) ||
                            (typeof q.correctAnswer === "object" && q.correctAnswer && (
                              (q.correctAnswer.optionId && (
                                String(q.correctAnswer.optionId).toLowerCase() === String(opt.id || '').toLowerCase() ||
                                String(q.correctAnswer.optionId).toUpperCase() === optLetter.toUpperCase()
                              )) ||
                              (q.correctAnswer.id && String(q.correctAnswer.id).toLowerCase() === String(opt.id || '').toLowerCase()) ||
                              (q.correctAnswer.index !== undefined && q.correctAnswer.index === optIndex) ||
                              (q.correctAnswer.text && String(q.correctAnswer.text).trim().toLowerCase() === String(opt.text || '').trim().toLowerCase()) ||
                              (q.correctAnswer.letter && q.correctAnswer.letter.toUpperCase() === optLetter.toUpperCase())
                            ))
                          ))
                        );

                        let cardStyle = "bg-white border-slate-200 text-slate-800 hover:border-slate-300";
                        let badgeElement = null;

                        if (isStudentChoice && isCorrectChoice) {
                          cardStyle = "bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500/30 text-emerald-950 font-medium shadow-2xs";
                          badgeElement = (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-md border border-emerald-300 shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-700" />
                              Your Answer (Correct)
                            </span>
                          );
                        } else if (isStudentChoice && !isCorrectChoice) {
                          cardStyle = "bg-rose-50/90 border-rose-400 ring-1 ring-rose-400/30 text-rose-950 font-medium shadow-2xs";
                          badgeElement = (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-800 bg-rose-100/90 px-2.5 py-1 rounded-md border border-rose-300 shadow-2xs">
                              <X className="w-3.5 h-3.5 stroke-[3] text-rose-700" />
                              Your Answer (Incorrect)
                            </span>
                          );
                        } else if (isCorrectChoice) {
                          cardStyle = "bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500/30 text-emerald-950 font-medium shadow-2xs";
                          badgeElement = (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-md border border-emerald-300 shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-700" />
                              Correct Answer
                            </span>
                          );
                        }

                        return (
                          <div
                            key={opt.id || optIdx}
                            className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 transition-all ${cardStyle}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-6 h-6 rounded flex items-center justify-center font-bold font-mono text-[11px] shrink-0 transition-all ${
                                isCorrectChoice
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : isStudentChoice
                                  ? "bg-rose-600 text-white shadow-2xs"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {optLetter}
                              </span>
                              <span className="leading-relaxed">{opt.text}</span>
                            </div>

                            {badgeElement}
                          </div>
                        );
                      })}
                    </div>

                    {!isAttempted && (
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        * You left this question unanswered during the assessment.
                      </p>
                    )}
                  </div>
                )}

                {/* CODING Question Review */}
                {isCoding && (
                  <div className="space-y-3 pt-2">
                    {/* Constraints & Specs */}
                    {q.codingDetails?.constraints && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-slate-700 block">Constraints:</span>
                        <div className="text-slate-700 leading-relaxed">
                          <MathRenderer content={q.codingDetails.constraints} />
                        </div>
                      </div>
                    )}

                    {/* Sample test cases (Strictly non-hidden only) */}
                    {Array.isArray(q.codingDetails?.sampleTestCases) && q.codingDetails.sampleTestCases.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                          Sample Test Cases:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.codingDetails.sampleTestCases.map((tc, tcIdx) => (
                            <div key={tc.id || tcIdx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
                              <div className="text-[10px] text-slate-500 font-semibold mb-1">Case #{tcIdx + 1}</div>
                              <div className="text-slate-700"><strong>Input:</strong> {tc.input}</div>
                              <div className="text-emerald-700 mt-0.5"><strong>Expected:</strong> {tc.expectedOutput}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submitted Code View */}
                    {q.codingDetails?.sourceCode ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                            Submitted Source Code ({q.codingDetails.language || "cpp"}):
                          </span>
                          <button
                            onClick={() => handleCopyCode(q.codingDetails.sourceCode, q.questionId || idx)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          >
                            {copiedCodeId === (q.questionId || idx) ? (
                              <>
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                          <pre className="whitespace-pre">{q.codingDetails.sourceCode}</pre>
                        </div>
                        <div className="flex items-center gap-3 text-xs pt-1">
                          <span className="text-slate-500">
                            Tests Passed: <strong>{q.codingDetails.testsPassed || 0} / {q.codingDetails.testsTotal || 0}</strong>
                          </span>
                          <span className={`font-bold ${isCorrect ? "text-emerald-600" : "text-amber-600"}`}>
                            Status: {q.codingDetails.status || (isCorrect ? "ACCEPTED" : "WRONG_ANSWER")}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                        No code was submitted for this coding problem.
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation Card */}
                {q.explanation && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-indigo-900">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      Explanation & Solution Approach:
                    </span>
                    <div className="leading-relaxed text-indigo-900/90 font-normal">
                      <MathRenderer content={q.explanation} />
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-200">
        <Button variant="outline" size="sm" onClick={() => navigate("/contests")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          View Other Contests
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/contests/${contestId}/leaderboard`)}
          >
            <Trophy className="w-4 h-4 mr-1.5 text-amber-500" />
            View Leaderboard
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate("/practice")}>
            Return to Practice Hub
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ContestResultPage;
