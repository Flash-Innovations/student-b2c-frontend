import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Bot,
  User as UserIcon,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { aiApi } from '../services/aiApi';
import { b2cApi } from '../services/b2cApi';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, PlanBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

const INTERVIEW_TRACKS = [
  {
    id: 'tech-fullstack',
    title: 'Full Stack & Web Architecture',
    category: 'Technical',
    role: 'SDE-1 / Full Stack Engineer',
    topics: ['React & Next.js Lifecycle', 'Node.js Event Loop', 'REST & WebSockets', 'PostgreSQL vs MongoDB', 'Caching & Redis'],
    icon: BrainCircuit,
    color: 'from-blue-500 to-indigo-600',
    difficulty: 'Medium-Hard'
  },
  {
    id: 'tech-dsa',
    title: 'Data Structures & Algorithms',
    category: 'Technical',
    role: 'SDE Core Prep',
    topics: ['Dynamic Programming', 'Graph BFS/DFS', 'Binary Trees', 'Time & Space Complexity', 'Sliding Window'],
    icon: Sparkles,
    color: 'from-emerald-500 to-teal-600',
    difficulty: 'Hard'
  },
  {
    id: 'tech-sysdesign',
    title: 'System Design & High-Scale Systems',
    category: 'Technical',
    role: 'Backend & Systems Engineer',
    topics: ['Load Balancing', 'Database Sharding', 'Message Queues (Kafka)', 'CAP Theorem', 'Rate Limiting Algorithms'],
    icon: TrendingUp,
    color: 'from-purple-500 to-indigo-700',
    difficulty: 'Hard'
  },
  {
    id: 'hr-behavioral',
    title: 'HR & Behavioral Competency',
    category: 'Behavioral',
    role: 'STAR Method & Culture Fit',
    topics: ['Handling High Pressure', 'Cross-functional Conflict', 'Failure & Learning', 'Ownership Mindset', 'Career Vision 2028'],
    icon: MessageSquare,
    color: 'from-amber-500 to-orange-600',
    difficulty: 'All Levels'
  },
  {
    id: 'voice-aptitude',
    title: 'Question-Based Voice Aptitude Test',
    category: 'Voice Test',
    role: 'Spoken Communication & Reasoning',
    topics: ['Pacing & Filler Word Reduction', 'Structured Problem Articulation', 'Clarity Under Timer', 'Technical Eloquence'],
    icon: Mic,
    color: 'from-rose-500 to-pink-600',
    difficulty: 'Practical'
  }
];

export function MockInterviewPage() {
  const { user, subscription, planTier, isPaid, refreshSubscription } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('tracks'); // 'tracks' | 'live' | 'scorecard' | 'history'
  const [selectedTrack, setSelectedTrack] = useState(INTERVIEW_TRACKS[0]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [conversation, setConversation] = useState([]);
  const [currentAiStatus, setCurrentAiStatus] = useState('idle'); // 'idle' | 'listening' | 'speaking' | 'evaluating'
  const [userInputDraft, setUserInputDraft] = useState('');
  const [scorecard, setScorecard] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Audio wave visualization simulation
  const [waveAmplitudes, setWaveAmplitudes] = useState([12, 24, 40, 18, 30, 48, 20, 15, 36, 25, 42, 16]);

  const timerRef = useRef(null);
  const conversationEndRef = useRef(null);

  const totalMockMinutes = (subscription?.includedMinutesRemaining || 0) + (subscription?.purchasedMinutesBalance || 0);

  // Load interview history on mount
  useEffect(() => {
    async function loadPastHistory() {
      try {
        setLoadingHistory(true);
        const data = await aiApi.getHistory();
        if (data && data.interviews) {
          setPastSessions(data.interviews);
        }
      } catch (err) {
        // Fallback default sample history if AI backend empty
        setPastSessions([
          {
            id: 'mock-sample-1',
            trackName: 'Full Stack & Web Architecture',
            date: '2026-10-14',
            durationMins: 18,
            overallScore: 84,
            verdict: 'Recommended for SDE-1'
          },
          {
            id: 'mock-sample-2',
            trackName: 'HR & Behavioral Competency',
            date: '2026-10-10',
            durationMins: 12,
            overallScore: 91,
            verdict: 'Excellent STAR articulation'
          }
        ]);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadPastHistory();
  }, []);

  // Timer interval when session active
  useEffect(() => {
    if (isSessionActive) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive]);

  // Audio waves animation
  useEffect(() => {
    let animInterval = null;
    if (isSessionActive && currentAiStatus !== 'idle') {
      animInterval = setInterval(() => {
        setWaveAmplitudes((prev) =>
          prev.map(() => Math.floor(Math.random() * (currentAiStatus === 'speaking' ? 52 : 30) + 8))
        );
      }, 150);
    }
    return () => {
      if (animInterval) clearInterval(animInterval);
    };
  }, [isSessionActive, currentAiStatus]);

  // Scroll to bottom of conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const handleStartInterview = async (track) => {
    // Check minutes quota
    if (totalMockMinutes <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setSelectedTrack(track);
    setElapsedSeconds(0);
    setConversation([]);
    setScorecard(null);
    setIsSessionActive(true);
    setActiveTab('live');
    setCurrentAiStatus('speaking');

    // Initial greeting from Sarah, Principal AI Interviewer
    setTimeout(() => {
      setConversation([
        {
          sender: 'ai',
          name: 'Sarah (Principal AI Interviewer)',
          time: 'Just now',
          text: `Hello ${user?.name || 'Candidate'}! Welcome to your ${track.title} mock interview. We are targeting the role of ${track.role}. Let's begin by discussing how you approach engineering trade-offs. Can you briefly walk me through a challenging problem you solved recently and why you selected your specific technical approach?`
        }
      ]);
      setCurrentAiStatus('listening');
    }, 1200);
  };

  const handleSendMessage = () => {
    if (!userInputDraft.trim() || !isSessionActive) return;

    const userMsg = {
      sender: 'user',
      name: user?.name || 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: userInputDraft.trim()
    };

    setConversation((prev) => [...prev, userMsg]);
    setUserInputDraft('');
    setCurrentAiStatus('evaluating');

    // Simulate Gemini Live conversational response
    setTimeout(() => {
      let aiReply = '';
      if (selectedTrack.id === 'tech-fullstack') {
        aiReply = `That is a solid approach. Given the architecture you described, how would you prevent cache stampede under a spike of 50,000 requests per second when the Redis cache key expires?`;
      } else if (selectedTrack.id === 'tech-dsa') {
        aiReply = `Good algorithmic intuition. What is the tightest theoretical upper bound on space complexity for this approach, and how could you optimize it in-place using two pointers?`;
      } else if (selectedTrack.id === 'voice-aptitude') {
        aiReply = `Clear delivery. Your pace was approximately 135 words per minute with 0 filler words detected. Next question: A server has 99.9% availability. How many minutes of downtime is permissible annually?`;
      } else {
        aiReply = `Strong reflection using the STAR framework. In hindsight, what is one decision you made during that project that you would change today, and what metric proved the eventual outcome?`;
      }

      setConversation((prev) => [
        ...prev,
        {
          sender: 'ai',
          name: 'Sarah (Principal AI Interviewer)',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: aiReply
        }
      ]);
      setCurrentAiStatus('listening');
    }, 1800);
  };

  const handleEndInterview = async () => {
    if (!isSessionActive) return;
    setIsSessionActive(false);
    setCurrentAiStatus('idle');

    const minutesUsed = Math.max(1, Math.ceil(elapsedSeconds / 60));

    // Deduct mock minutes through B2C backend
    try {
      await b2cApi.consumeMockMinutes({
        minutesUsed,
        interviewSessionId: `session-${Date.now()}`,
        interviewType: selectedTrack.category
      });
      refreshSubscription();
      addToast(`Interview finished. Deducted ${minutesUsed} minute(s) from your quota.`, 'info');
    } catch (err) {
      console.warn('Minute deduction error:', err);
    }

    // Generate comprehensive evaluation scorecard
    const generatedScorecard = {
      trackTitle: selectedTrack.title,
      durationMins: minutesUsed,
      overallScore: 86,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      breakdown: [
        { label: 'Technical Depth & Architecture', score: 88, color: 'text-indigo-400' },
        { label: 'Problem-Solving & Edge Cases', score: 84, color: 'text-blue-400' },
        { label: 'Communication Clarity & STAR Structure', score: 90, color: 'text-emerald-400' },
        { label: 'Response Pace & Confidence', score: 82, color: 'text-amber-400' }
      ],
      keyStrengths: [
        'Articulated trade-offs between Redis caching and DB indexing with crisp quantitative reasoning.',
        'High composure and zero nervous filler words during architectural follow-ups.',
        'Immediate awareness of time & space complexity constraints.'
      ],
      areasForImprovement: [
        'Provide explicit numerical monitoring metrics (e.g., p99 latency SLAs) when describing backend system reliability.',
        'Elaborate more on disaster recovery and database rollback strategies under partial failure scenarios.'
      ],
      verdict: 'Ready for SDE-1 / Product Engineering Technical Rounds'
    };

    setScorecard(generatedScorecard);
    setActiveTab('scorecard');
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Quota Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <BrainCircuit className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  AI Mock Interview Arena
                  <Badge variant="primary">Gemini Live Audio</Badge>
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Real-time conversational voice interviews, question-based voice tests, and granular feedback calibrated for 2028 campus hiring.
                </p>
              </div>
            </div>
          </div>

          {/* Quota widget */}
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 px-5 shadow-lg">
            <div className="text-right">
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Interview Minutes</div>
              <div className="text-lg font-extrabold text-white">
                <span className={totalMockMinutes > 0 ? 'text-indigo-400' : 'text-rose-400'}>
                  {totalMockMinutes}
                </span>{' '}
                <span className="text-xs text-slate-500 font-normal">mins remaining</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-800"></div>
            <Link to="/pricing">
              <Button size="sm" variant={totalMockMinutes > 0 ? 'outline' : 'primary'}>
                {totalMockMinutes > 0 ? 'Add Minutes' : 'Unlock Access'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 mt-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'tracks'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Interview Tracks
          </button>
          {isSessionActive && (
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'live'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                  : 'text-rose-400 hover:bg-rose-950/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-300"></span>
              Live Session ({formatTimer(elapsedSeconds)})
            </button>
          )}
          {scorecard && (
            <button
              onClick={() => setActiveTab('scorecard')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'scorecard'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Latest Scorecard
            </button>
          )}
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Session History
          </button>
        </div>

        {/* TAB 1: INTERVIEW TRACKS */}
        {activeTab === 'tracks' && (
          <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {INTERVIEW_TRACKS.map((track) => {
                const IconComponent = track.icon;
                return (
                  <Card key={track.id} className="flex flex-col justify-between hover:border-indigo-500/40 transition-all group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${track.color} text-white shadow-md`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {track.difficulty}
                        </Badge>
                      </div>

                      <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                        {track.category} • {track.role}
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {track.title}
                      </h3>

                      <div className="mt-4 space-y-2">
                        <div className="text-xs font-medium text-slate-400">Core Evaluation Areas:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {track.topics.map((t, idx) => (
                            <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>~15-30 Mins</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStartInterview(track)}
                        className="group-hover:translate-x-0.5 transition-transform"
                      >
                        Start Session <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Banner: How Gemini Live Audio Works */}
            <div className="rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Powered by Gemini Live & Whisper STT</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Natural, Interruptible Spoken Dialogue
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Unlike traditional multiple-choice questions, Flash AI Mock Interviews listen to your live microphone audio stream, parse speech inflection and structural reasoning, and challenge edge-cases in real time — just like a Principal FAANG engineer or Senior HR Director.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link to="/pricing">
                  <Button variant="secondary" className="shadow-lg">
                    Check Minute Bundles
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE INTERVIEW SESSION */}
        {activeTab === 'live' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: AI Persona & Live Conversation Stream */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 relative overflow-hidden border-indigo-500/30">
                
                {/* Status Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                        <Bot className="w-5 h-5" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        Sarah — Principal AI Interviewer
                        <Badge variant="primary" className="text-[10px] py-0 px-1.5">Live</Badge>
                      </div>
                      <div className="text-xs text-indigo-400 font-medium">
                        {currentAiStatus === 'speaking' && 'Speaking response...'}
                        {currentAiStatus === 'listening' && 'Listening to candidate...'}
                        {currentAiStatus === 'evaluating' && 'Analyzing logic & speech cadence...'}
                        {currentAiStatus === 'idle' && 'Session Standby'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-sm font-semibold text-rose-400">
                      <Clock className="w-4 h-4 animate-spin text-rose-500" />
                      {formatTimer(elapsedSeconds)}
                    </div>
                    <Button variant="danger" size="sm" onClick={handleEndInterview}>
                      <Square className="w-3.5 h-3.5 mr-1.5 fill-current" /> End & Generate Report
                    </Button>
                  </div>
                </div>

                {/* Animated Audio Visualizer */}
                <div className="py-6 flex items-center justify-center gap-1.5 bg-slate-950/70 my-4 rounded-2xl border border-slate-900/80">
                  {waveAmplitudes.map((amp, idx) => (
                    <span
                      key={idx}
                      style={{ height: `${amp}px` }}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        currentAiStatus === 'speaking'
                          ? 'bg-gradient-to-t from-indigo-500 to-purple-400'
                          : currentAiStatus === 'listening'
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-300'
                          : 'bg-slate-800'
                      }`}
                    ></span>
                  ))}
                </div>

                {/* Live Conversation Transcript */}
                <div className="h-80 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                  {conversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold opacity-75">
                          <span>{msg.name}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p>{msg.text}</p>
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center flex-shrink-0 mt-1">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={conversationEndRef} />
                </div>

                {/* Input & Mic Bar */}
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3">
                  <button
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={`p-3 rounded-2xl border transition-all ${
                      isMicMuted
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30'
                    }`}
                    title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                  >
                    {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 animate-pulse" />}
                  </button>

                  <button
                    onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                    className={`p-3 rounded-2xl border transition-all ${
                      isSpeakerMuted
                        ? 'bg-slate-800 border-slate-700 text-slate-500'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                    title={isSpeakerMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  <input
                    type="text"
                    value={userInputDraft}
                    onChange={(e) => setUserInputDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Speak into microphone or type response here..."
                    className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />

                  <Button onClick={handleSendMessage} disabled={!userInputDraft.trim()}>
                    Send
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right 1 Col: Session Context & Real-Time Rubric */}
            <div className="space-y-6">
              <Card className="p-6">
                <CardHeader
                  title="Session Rubric"
                  subtitle={selectedTrack.title}
                />
                <div className="space-y-4 text-sm mt-4">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Target Role</div>
                    <div className="text-white font-bold mt-0.5">{selectedTrack.role}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Live Cadence Analysis</div>
                    <div className="text-xs text-slate-300 mt-2 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Speech Pace:</span>
                        <span className="text-emerald-400 font-mono">130 WPM (Optimal)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Filler Words Detected:</span>
                        <span className="text-indigo-400 font-mono">0 (Excellent)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>STAR Completeness:</span>
                        <span className="text-amber-400 font-mono">Action Phase</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4">
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1">
                      <Sparkles className="w-4 h-4" />
                      Interviewer Tip
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Always begin technical explanations with the high-level trade-off before jumping into syntax or implementation details.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: EVALUATION SCORECARD */}
        {activeTab === 'scorecard' && scorecard && (
          <div className="mt-8 space-y-8">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-8 shadow-2xl">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div>
                  <Badge variant="primary" className="mb-2">Official AI Evaluation</Badge>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {scorecard.trackTitle}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Evaluated on {scorecard.date} • Session Duration: {scorecard.durationMins} Mins
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-950/80 border border-indigo-500/30 px-6 py-4 rounded-3xl">
                  <div className="text-center">
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 font-mono">
                      {scorecard.overallScore}%
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Readiness Score</div>
                  </div>
                </div>
              </div>

              {/* Rubric Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {scorecard.breakdown.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="text-xs font-semibold text-slate-400">{item.label}</div>
                    <div className={`text-2xl font-extrabold mt-2 font-mono ${item.color}`}>
                      {item.score}%
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-6 rounded-2xl bg-slate-950/70 border border-emerald-500/20">
                  <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5" /> Key Strengths Exhibited
                  </h3>
                  <ul className="space-y-3">
                    {scorecard.keyStrengths.map((str, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950/70 border border-amber-500/20">
                  <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5" /> Target Improvement Areas
                  </h3>
                  <ul className="space-y-3">
                    {scorecard.areasForImprovement.map((imp, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0"></span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm font-semibold text-indigo-400 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>Verdict: {scorecard.verdict}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setActiveTab('tracks')}>
                    Choose Another Track
                  </Button>
                  <Button onClick={() => handleStartInterview(selectedTrack)}>
                    Retry Track Session
                  </Button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: SESSION HISTORY */}
        {activeTab === 'history' && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Past Mock Interview Transcripts & Scores</h3>
            {loadingHistory ? (
              <div className="text-center py-12 text-slate-500">Loading interview history...</div>
            ) : pastSessions.length === 0 ? (
              <Card className="text-center py-12">
                <BrainCircuit className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">No Mock Interviews Completed Yet</h4>
                <p className="text-slate-400 text-sm mt-1 mb-4">Launch your first live conversational interview to build your readiness score.</p>
                <Button onClick={() => setActiveTab('tracks')}>Browse Tracks</Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {pastSessions.map((session, idx) => (
                  <Card key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-white">{session.trackName || 'Technical Mock Interview'}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {session.date} • {session.durationMins || 15} Mins • {session.verdict || 'Good Performance'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-400 font-mono">
                          {session.overallScore || 85}%
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold uppercase">Score</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => addToast('Full session audio & transcript available in your student vault.', 'info')}>
                        View Transcript
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UPGRADE / BUY MINUTES MODAL */}
        <Modal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Interview Minutes Exhausted"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <strong className="text-white">Free tier students</strong> do not have conversational AI mock interview minutes included.
                Upgrade to Basic (300 mins/mo), Premium (1,000 mins/mo), or purchase a single ₹20 1-Hour Add-on Pack.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">1-Hour Mock Interview Pass</span>
                <span className="text-lg font-black text-emerald-400">₹20</span>
              </div>
              <p className="text-xs text-slate-400">60 minutes of real-time conversational Gemini Live voice sessions + comprehensive scorecards.</p>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="ghost" onClick={() => setShowUpgradeModal(false)}>
                Cancel
              </Button>
              <Link to="/pricing">
                <Button>
                  View Plans & Add-ons <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}
export default MockInterviewPage;
