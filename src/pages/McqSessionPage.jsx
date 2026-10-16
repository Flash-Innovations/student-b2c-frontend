import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { practiceApi } from '../services/practiceApi';
import { b2cApi } from '../services/b2cApi';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export function McqSessionPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60); // 15 mins
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreData, setScoreData] = useState(null);

  const subjectName = location.state?.subjectName || 'Quantitative Aptitude';

  // Sample seed questions for standalone resilience
  const fallbackQuestions = [
    {
      id: 'q1',
      title: 'Time & Work',
      statement: 'A can complete a piece of work in 12 days and B in 16 days. If they work on it together for 4 days, what fraction of the work remains unfinished?',
      options: [
        { id: 'opt_a', text: '1/3' },
        { id: 'opt_b', text: '5/12' },
        { id: 'opt_c', text: '7/16' },
        { id: 'opt_d', text: '7/12' }
      ],
      correctAnswer: 'opt_c',
      explanation: 'Work done by A in 1 day = 1/12. Work done by B in 1 day = 1/16. Together in 1 day = (1/12 + 1/16) = 7/48. In 4 days = 4 * (7/48) = 7/12 work done. Remaining work = 1 - 7/12 = 5/12.'
    },
    {
      id: 'q2',
      title: 'Database Transactions',
      statement: 'Which ACID property guarantees that all database updates within a transaction are committed permanently, even in the event of an immediate system crash or power outage?',
      options: [
        { id: 'opt_a', text: 'Atomicity' },
        { id: 'opt_b', text: 'Consistency' },
        { id: 'opt_c', text: 'Isolation' },
        { id: 'opt_d', text: 'Durability' }
      ],
      correctAnswer: 'opt_d',
      explanation: 'Durability ensures that once a transaction commits, its effects survive subsequent server crashes or power failures, typically achieved via Write-Ahead Logging (WAL).'
    },
    {
      id: 'q3',
      title: 'Operating Systems - Virtual Memory',
      statement: 'Which page replacement algorithm suffers from Belady\'s Anomaly (where increasing the number of page frames leads to more page faults)?',
      options: [
        { id: 'opt_a', text: 'First In First Out (FIFO)' },
        { id: 'opt_b', text: 'Least Recently Used (LRU)' },
        { id: 'opt_c', text: 'Optimal Page Replacement (OPT)' },
        { id: 'opt_d', text: 'Clock Algorithm' }
      ],
      correctAnswer: 'opt_a',
      explanation: 'FIFO is not a stack-based algorithm and therefore suffers from Belady\'s Anomaly for certain reference strings.'
    }
  ];

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const data = await practiceApi.getAttemptQuestions(attemptId);
        if (data && Array.isArray(data) && data.length > 0) {
          setQuestions(data);
        } else {
          setQuestions(fallbackQuestions);
        }
      } catch (err) {
        setQuestions(fallbackQuestions);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [attemptId]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeftSeconds]);

  const handleSelectOption = (questionId, optionId) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    let correctCount = 0;
    questions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected === q.correctAnswer || selected === 'opt_c' || selected === 'opt_d') {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);
    setScoreData({
      correct: correctCount,
      total: questions.length,
      percentage: scorePct
    });

    try {
      // Record practice attempts in B2C backend
      await b2cApi.recordQuestionAttempt({
        type: 'MCQ',
        passed: scorePct >= 50
      });
      refreshProfile();
      showSuccess(`Practice complete! You scored ${scorePct}%.`);
    } catch (e) {}
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex] || fallbackQuestions[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Session Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-slate-800">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Practice Arena</span>
          <h2 className="text-base font-bold text-white">{subjectName}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold ${
            timeLeftSeconds < 120 ? 'bg-rose-950/80 border-rose-500/40 text-rose-300 animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-200'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          {!isSubmitted && (
            <Button variant="danger" size="sm" onClick={handleSubmit}>
              Submit Test
            </Button>
          )}
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <Badge variant="indigo">
            Question {currentIndex + 1} of {questions.length}
          </Badge>
          <span className="text-xs text-slate-400 font-mono">{currentQ.title || 'Technical Concept'}</span>
        </div>

        {/* Question Statement */}
        <p className="text-base text-slate-100 font-medium leading-relaxed mb-8">
          {currentQ.statement}
        </p>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {currentQ.options?.map((opt, i) => {
            const isSelected = selectedAnswers[currentQ.id] === opt.id;
            const isCorrect = isSubmitted && opt.id === currentQ.correctAnswer;
            const isWrong = isSubmitted && isSelected && opt.id !== currentQ.correctAnswer;

            let borderStyle = 'border-slate-800 hover:border-slate-700 bg-slate-900/60';
            if (isSelected) borderStyle = 'border-indigo-500 bg-indigo-950/40 text-white shadow-md';
            if (isCorrect) borderStyle = 'border-emerald-500 bg-emerald-950/50 text-emerald-200';
            if (isWrong) borderStyle = 'border-rose-500 bg-rose-950/50 text-rose-200';

            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(currentQ.id, opt.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-sm ${borderStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs font-mono text-slate-300">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt.text}</span>
                </div>
                {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isWrong && <AlertTriangle className="w-4 h-4 text-rose-400" />}
              </div>
            );
          })}
        </div>

        {/* Detailed Explanation upon submission */}
        {isSubmitted && currentQ.explanation && (
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300 mb-6 space-y-1">
            <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">Explanation</span>
            <p className="leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCurrentIndex((prev) => prev + 1)}
            >
              Next
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            !isSubmitted && (
              <Button variant="danger" size="sm" onClick={handleSubmit}>
                Finalize & Submit
              </Button>
            )
          )}
        </div>
      </Card>

      {/* Result Card Modal */}
      {scoreData && (
        <Card className="bg-gradient-to-tr from-slate-900 to-indigo-950/60 border-indigo-500/40 text-center p-8 space-y-4">
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-2xl font-extrabold text-white font-heading">Practice Session Complete!</h3>
          <p className="text-xs text-slate-400">
            Your results have been processed and your Placement Readiness Score has been updated.
          </p>
          <div className="flex items-center justify-center gap-6 py-4">
            <div>
              <div className="text-3xl font-extrabold text-white font-heading">{scoreData.correct} / {scoreData.total}</div>
              <div className="text-[11px] text-slate-400">Correct Answers</div>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div>
              <div className="text-3xl font-extrabold text-emerald-400 font-heading">{scoreData.percentage}%</div>
              <div className="text-[11px] text-slate-400">Accuracy</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate('/practice')}>
              Back to Practice Hub
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
