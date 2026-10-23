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
  ChevronRight
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { practiceApi } from "../services/practiceApi";
import { useAuth } from "../context/AuthContext";

export function ContestResultPage() {
  const { contestId, attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

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
        setError(err.message || "Failed to load contest results.");
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [contestId, attemptId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-56 bg-slate-900 rounded-2xl" />
        <div className="h-48 bg-white border border-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Scorecard Not Available</h2>
        <p className="text-sm text-slate-600">{error || "No submission result was found for this assessment attempt."}</p>
        <div className="pt-2">
          <Button variant="outline" onClick={() => navigate("/contests")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Return to Contests
          </Button>
        </div>
      </div>
    );
  }

  const {
    status = "SUBMITTED",
    totalScore = 0,
    totalMarks = 100,
    aptitudeScore = 0,
    technicalScore = 0,
    codingScore = 0,
    questionBreakdown = []
  } = result;

  const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;

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
        </div>
      </div>

      {/* Main Scorecard Hero Card */}
      <Card className="p-8 text-center bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 space-y-4">
          <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto text-amber-400">
            <Trophy className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              Placement Assessment Scorecard
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 font-mono">
              {totalScore} <span className="text-lg font-normal text-indigo-200">/ {totalMarks} Marks</span>
            </h2>
            <p className="text-xs text-indigo-200 mt-1">
              Overall Performance Index: <span className="font-bold text-white">{percentage}%</span>
            </p>
          </div>

          {/* Section Summary Chips */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-3">
            <div className="p-3 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                Aptitude
              </span>
              <span className="text-base font-bold text-white font-mono">{aptitudeScore}</span>
            </div>
            <div className="p-3 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                Technical
              </span>
              <span className="text-base font-bold text-white font-mono">{technicalScore}</span>
            </div>
            <div className="p-3 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                Coding
              </span>
              <span className="text-base font-bold text-white font-mono">{codingScore}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Question Performance Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          Question Breakdown & Marks
        </h3>

        <div className="grid grid-cols-1 gap-2.5">
          {questionBreakdown.map((q, idx) => {
            const isCorrect = q.isCorrect;
            const marksAwarded = Number(q.marksAwarded || 0);
            const marksAvailable = Number(q.marksAvailable || 0);

            return (
              <Card key={q.questionVersionId || idx} className="p-3.5 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono">
                      Q{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral" size="xs">
                        {q.section}
                      </Badge>
                      <span className="text-xs font-medium text-slate-600">
                        {marksAvailable} Marks Available
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 font-mono block">
                        {marksAwarded > 0 ? `+${marksAwarded}` : marksAwarded} Marks
                      </span>
                    </div>
                    {isCorrect ? (
                      <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    ) : marksAwarded > 0 ? (
                      <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[2]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-200">
        <Button variant="outline" size="sm" onClick={() => navigate("/contests")}>
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
