import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Calculator,
  Binary,
  Layers,
  Database,
  Cpu,
  BookOpen,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { practiceApi } from '../services/practiceApi';
import { b2cApi } from '../services/b2cApi';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, PlanBadge } from '../components/common/Badge';

export function PracticeHubPage() {
  const { planTier, isPaid, subscription } = useAuth();
  const { showError, showWarning } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    { id: 'ALL', name: 'All Subjects' },
    { id: 'APTITUDE', name: 'Aptitude & Reasoning', icon: Calculator },
    { id: 'CORE_CS', name: 'Core CS (DBMS, OS, CN)', icon: Database },
    { id: 'TECHNICAL', name: 'Technical Concepts', icon: Binary }
  ];

  const defaultSubjects = [
    {
      id: 'sub-quant',
      name: 'Quantitative Aptitude',
      category: 'APTITUDE',
      description: 'Arithmetic, Percentages, Profit & Loss, Time & Work, Permutations, Probability.',
      questionsCount: 450,
      icon: Calculator,
      color: 'from-blue-600 to-indigo-600'
    },
    {
      id: 'sub-logical',
      name: 'Logical Reasoning',
      category: 'APTITUDE',
      description: 'Number Series, Syllogisms, Blood Relations, Seating Arrangements, Coding-Decoding.',
      questionsCount: 380,
      icon: BrainCircuit,
      color: 'from-purple-600 to-indigo-600'
    },
    {
      id: 'sub-verbal',
      name: 'Verbal Ability & English',
      category: 'APTITUDE',
      description: 'Reading Comprehension, Sentence Correction, Vocabulary, Critical Reasoning.',
      questionsCount: 300,
      icon: BookOpen,
      color: 'from-sky-600 to-blue-600'
    },
    {
      id: 'sub-dbms',
      name: 'Database Management Systems (DBMS)',
      category: 'CORE_CS',
      description: 'SQL queries, Normalization (1NF–BCNF), Transactions, ACID properties, Indexing.',
      questionsCount: 280,
      icon: Database,
      color: 'from-emerald-600 to-teal-600'
    },
    {
      id: 'sub-os',
      name: 'Operating Systems',
      category: 'CORE_CS',
      description: 'Process Scheduling, Deadlocks, Memory Management, Paging, Virtual Memory, Linux CLI.',
      questionsCount: 260,
      icon: Cpu,
      color: 'from-amber-600 to-orange-600'
    },
    {
      id: 'sub-cn',
      name: 'Computer Networks',
      category: 'CORE_CS',
      description: 'OSI & TCP/IP stack, Routing protocols, Subnetting, HTTP/HTTPS, DNS, WebSockets.',
      questionsCount: 240,
      icon: Layers,
      color: 'from-rose-600 to-pink-600'
    }
  ];

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await practiceApi.getGlobalCatalog();
        if (data && Array.isArray(data) && data.length > 0) {
          setSubjects(data);
        } else {
          setSubjects(defaultSubjects);
        }
      } catch (err) {
        setSubjects(defaultSubjects);
      }
    }
    loadSubjects();
  }, []);

  const handleStartPractice = async (subject) => {
    setLoading(true);
    try {
      // 1. Pre-flight quota check in B2C backend
      const check = await b2cApi.checkEntitlement({ action: 'MCQ' });
      if (!check.allowed) {
        showWarning(check.message || 'MCQ quota exceeded. Please upgrade plan.');
        navigate('/pricing');
        return;
      }

      // 2. Create attempt in practice backend
      let attemptId = null;
      try {
        const attemptRes = await practiceApi.createAttempt({
          category: subject.name || 'APTITUDE',
          questionCount: 10
        });
        attemptId = attemptRes.attemptId || attemptRes.id;
      } catch (e) {
        // Fallback session identifier for standalone test
        attemptId = `sess_${Date.now()}`;
      }

      navigate(`/practice/session/${attemptId}`, {
        state: { subjectName: subject.name, category: subject.category }
      });
    } catch (err) {
      showError(err.message || 'Could not start practice session.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = selectedCategory === 'ALL'
    ? subjects
    : subjects.filter((s) => s.category === selectedCategory || s.type === selectedCategory);

  const mcqSolved = subscription?.mcqAttemptedCount || 0;
  const mcqLimit = subscription?.mcqLimit || 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              Aptitude & Subject MCQs
            </h1>
            <PlanBadge tier={planTier} />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Master campus screening tests across Quantitative, Logical, Verbal, and Core CS fundamentals.
          </p>
        </div>

        {/* Quota Indicator */}
        <div className="px-4 py-2.5 rounded-2xl glass-panel border border-slate-800 text-xs flex items-center gap-3">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Practice Quota</div>
            <div className="font-mono font-bold text-white">
              {mcqSolved} / {mcqLimit > 0 ? `${mcqLimit} questions` : 'Unlimited questions'}
            </div>
          </div>
          {!isPaid && (
            <Button variant="gold" size="sm" onClick={() => navigate('/pricing')}>
              Unlock Unlimited
            </Button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'glass-panel text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((sub) => {
          const Icon = sub.icon || Calculator;
          return (
            <Card key={sub.id} hoverable className="flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${sub.color || 'from-indigo-600 to-purple-600'} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <Badge variant="indigo">{sub.questionsCount || 250}+ MCQs</Badge>
                </div>

                <h3 className="font-bold text-white text-lg font-heading mb-1.5">{sub.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">{sub.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">10 Questions • 15 Mins</span>
                <Button
                  variant="primary"
                  size="sm"
                  loading={loading}
                  onClick={() => handleStartPractice(sub)}
                >
                  <span>Start Practice</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
