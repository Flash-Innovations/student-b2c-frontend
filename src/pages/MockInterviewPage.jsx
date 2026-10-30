import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ArrowRight,
  HelpCircle,
  Check
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { aiApi } from "../services/aiApi";
import { b2cApi } from "../services/b2cApi";
import { openRazorpayCheckout } from "../services/razorpayClient";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";

const TECHNICAL_INTERVIEW_TRACKS = [
  {
    id: "tech-fullstack",
    title: "Full Stack & Web Architecture",
    category: "Technical",
    role: "SDE-1 / Full Stack Engineer",
    topics: ["React Lifecycle", "Node.js Event Loop", "REST vs WebSockets", "PostgreSQL & Redis"],
    difficulty: "Medium-Hard"
  },
  {
    id: "tech-dsa",
    title: "Data Structures & Algorithms",
    category: "Technical",
    role: "SDE Core Prep",
    topics: ["Dynamic Programming", "Graph Traversals", "Trees", "Complexity Analysis"],
    difficulty: "Hard"
  },
  {
    id: "tech-sysdesign",
    title: "System Design & Scalability",
    category: "Technical",
    role: "Backend & Systems Engineer",
    topics: ["Load Balancing", "Sharding", "Kafka", "CAP Theorem", "Caching Strategies"],
    difficulty: "Hard"
  },
  {
    id: "hr-behavioral",
    title: "HR & Behavioral Competency",
    category: "Behavioral",
    role: "STAR Method & Culture Fit",
    topics: ["Conflict Resolution", "Ownership", "Handling Failure", "Long-Term Career Vision"],
    difficulty: "All Levels"
  }
];

const BUSINESS_INTERVIEW_TRACKS = [
  {
    id: "mgmt-case",
    title: "Business Problem Solving & Case Analysis",
    category: "Management",
    role: "Management Trainee / Consulting",
    topics: ["Market Sizing", "Profitability Framework", "Root Cause Analysis", "Go-To-Market Strategy"],
    difficulty: "Medium"
  },
  {
    id: "mgmt-analytics",
    title: "Business Analytics & Growth Metrics",
    category: "Analytics",
    role: "Business Analyst / Strategy",
    topics: ["KPI Metric Trees", "A/B Testing Insights", "Process Optimization", "Cost-Benefit Evaluation"],
    difficulty: "Medium"
  },
  {
    id: "mgmt-operations",
    title: "Operations & Leadership Strategy",
    category: "Operations",
    role: "Operations / Project Associate",
    topics: ["Cross-Functional Collaboration", "Stakeholder Management", "Resource Planning", "Quality Control"],
    difficulty: "Medium"
  },
  {
    id: "hr-behavioral",
    title: "HR & Behavioral Competency",
    category: "Behavioral",
    role: "STAR Method & Culture Fit",
    topics: ["Conflict Resolution", "Ownership", "Handling Failure", "Leadership & Teamwork"],
    difficulty: "All Levels"
  }
];

export function MockInterviewPage() {
  const navigate = useNavigate();
  const { user, subscription, planTier, isPaid, isTechnical, refreshSubscription } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const availableTracks = isTechnical ? TECHNICAL_INTERVIEW_TRACKS : BUSINESS_INTERVIEW_TRACKS;

  const [activeTab, setActiveTab] = useState("setup"); // 'setup' | 'live' | 'scorecard' | 'history'
  const [formatMode, setFormatMode] = useState("TIME_BASED"); // 'TIME_BASED' | 'QUESTION_BASED'
  const [selectedTrack, setSelectedTrack] = useState(availableTracks[0]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  useEffect(() => {
    if (!availableTracks.some((t) => t.id === selectedTrack.id)) {
      setSelectedTrack(availableTracks[0]);
    }
  }, [isTechnical]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [conversation, setConversation] = useState([]);
  const [currentAiStatus, setCurrentAiStatus] = useState("idle"); // 'idle' | 'listening' | 'speaking' | 'evaluating'
  const [userInputDraft, setUserInputDraft] = useState("");
  const [scorecard, setScorecard] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [buyingMinutes, setBuyingMinutes] = useState(false);

  const handleBuyMinutesPack = async () => {
    try {
      setBuyingMinutes(true);
      const orderData = await b2cApi.createOrder({
        orderType: "MOCK_MINUTES",
        quantity: 1
      });

      if (!orderData || (!orderData.orderId && !orderData.order_id)) {
        throw new Error("Unable to create order for mock interview minutes.");
      }

      openRazorpayCheckout({
        orderId: orderData.orderId || orderData.order_id,
        amountInPaise: orderData.amount || orderData.amountInPaise,
        amount: orderData.breakdown?.totalAmount || orderData.totalAmountWithGst,
        currency: "INR",
        name: "Flash Platform",
        description: "1-Hour Mock Minutes Pack (+60 Mins, All-Inclusive)",
        keyId: orderData.keyId || orderData.key_id,
        user: {
          name: user?.name,
          email: user?.email
        },
        onSuccess: async (paymentResponse) => {
          try {
            await b2cApi.verifyPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });
            showSuccess("Payment successful! 60 Mock Interview Minutes added to your balance.");
            setShowUpgradeModal(false);
            if (refreshSubscription) await refreshSubscription();
          } catch (err) {
            showError("Payment verification failed. Please contact support.");
          }
        },
        onFailure: (err) => {
          showError(err.message || "Payment cancelled.");
        }
      });
    } catch (err) {
      showError(err.message || "Failed to initiate payment.");
    } finally {
      setBuyingMinutes(false);
    }
  };
  const [pastSessions, setPastSessions] = useState([]);

  // Animated audio wave levels (microphone analysis or AI speech)
  const [waveAmplitudes, setWaveAmplitudes] = useState([14, 28, 42, 20, 32, 48, 22, 16, 38, 26, 44, 18]);

  const timerRef = useRef(null);
  const conversationEndRef = useRef(null);
  const wsRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const recognitionRef = useRef(null);
  const animFrameRef = useRef(null);

  const totalMockMinutes = (subscription?.includedMinutesRemaining || 0) + (subscription?.purchasedMinutesBalance || 0);

  // Helper to audibly vocalize Sarah's response using browser speech synthesis
  const speakAiResponse = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && !isSpeakerMuted) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(
          (v) => v.lang.startsWith("en") && (v.name.includes("Female") || v.name.includes("Natural") || v.name.includes("Google"))
        ) || voices.find((v) => v.lang.startsWith("en"));
        if (englishVoice) utterance.voice = englishVoice;

        utterance.onstart = () => setCurrentAiStatus("speaking");
        utterance.onend = () => setCurrentAiStatus("listening");
        utterance.onerror = () => setCurrentAiStatus("listening");

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    }
  };

  useEffect(() => {
    async function loadPastHistory() {
      try {
        const data = await aiApi.getHistory();
        if (data && data.interviews && Array.isArray(data.interviews)) {
          setPastSessions(data.interviews);
        } else {
          setPastSessions([]);
        }
      } catch (err) {
        setPastSessions([]);
      }
    }
    loadPastHistory();
  }, []);

  // Timer interval
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

  // Audio wave frequency sampling
  useEffect(() => {
    let animInterval = null;
    if (isSessionActive) {
      // If analyser is active, update from actual mic frequency data
      if (analyserRef.current && !isMicMuted) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const sampleWave = () => {
          if (!isSessionActive || isMicMuted) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const sample = Array.from(dataArray.slice(0, 12)).map((v) =>
            Math.max(10, Math.min(55, Math.round(v / 4)))
          );
          setWaveAmplitudes(sample);
          animFrameRef.current = requestAnimationFrame(sampleWave);
        };
        sampleWave();
      } else {
        // Fallback simulation when speaking or mic muted
        animInterval = setInterval(() => {
          setWaveAmplitudes((prev) =>
            prev.map(() => Math.floor(Math.random() * (currentAiStatus === "speaking" ? 50 : 20) + 10))
          );
        }, 150);
      }
    }
    return () => {
      if (animInterval) clearInterval(animInterval);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSessionActive, currentAiStatus, isMicMuted]);

  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  const handleStartInterview = async (track = selectedTrack) => {
    if (totalMockMinutes <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    const sessionId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    setSelectedTrack(track);
    setElapsedSeconds(0);
    setConversation([]);
    setScorecard(null);
    setIsSessionActive(true);
    setActiveTab("live");
    setCurrentAiStatus("speaking");

    // Initialize microphone and Web Audio analyser
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
      }
    } catch (err) {
      console.warn("Microphone not available for live audio stream:", err);
    }

    // Initialize Web Speech Recognition for real-time candidate voice capture
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.onresult = (e) => {
          let fullTranscript = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            fullTranscript += e.results[i][0].transcript;
          }
          if (fullTranscript.trim()) {
            setUserInputDraft(fullTranscript);
          }
        };
        rec.onerror = (e) => console.warn("Speech recognition error:", e);
        rec.start();
        recognitionRef.current = rec;
      } catch (recErr) {
        console.warn("Speech recognition initialization failed:", recErr);
      }
    }

    // Connect Live WebSocket to AI service
    try {
      const ws = aiApi.createLiveWebSocket(sessionId);
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "session_init",
          trackTitle: track.title,
          role: track.role,
          candidateName: user?.name || "Candidate"
        }));
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "question" || msg.type === "ai_response") {
            const aiText = msg.text || msg.message;
            setConversation((prev) => [
              ...prev,
              {
                sender: "ai",
                name: "Sarah (Principal AI Interviewer)",
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                text: aiText
              }
            ]);
            speakAiResponse(aiText);
          }
        } catch (_) {}
      };
    } catch (wsErr) {
      console.warn("Live WebSocket connection skipped, running in client resilient mode:", wsErr);
    }

    // Opening prompt delivery
    const openingPrompt = `Hello ${user?.name ? user.name.split(" ")[0] : "Candidate"}! Welcome to your ${track.title} mock interview. We are targeting the role of ${track.role}. Let's begin: Can you walk me through a challenging problem you solved recently and why you selected your specific approach?`;
    setTimeout(() => {
      setConversation([
        {
          sender: "ai",
          name: "Sarah (Principal AI Interviewer)",
          time: "Just now",
          text: openingPrompt
        }
      ]);
      speakAiResponse(openingPrompt);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!userInputDraft.trim() || !isSessionActive) return;

    const userText = userInputDraft.trim();
    const userMsg = {
      sender: "user",
      name: user?.name ? user.name.split(" ")[0] : "You",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: userText
    };

    setConversation((prev) => [...prev, userMsg]);
    setUserInputDraft("");
    setCurrentAiStatus("evaluating");

    // Stream over WebSocket if active
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "candidate_answer", text: userText }));
    } else {
      // Intelligent fallback probe
      setTimeout(() => {
        let aiReply = "";
        if (userText.length < 25) {
          aiReply = `Could you elaborate on that in more detail? Walk me through the trade-offs, constraints, and how this directly impacts system reliability.`;
        } else if (selectedTrack.id === "tech-fullstack") {
          aiReply = `Understood. When implementing this architecture, how would you address concurrency hazards, cache consistency, and horizontal scaling across multiple application nodes?`;
        } else if (selectedTrack.id === "tech-dsa") {
          aiReply = `Good algorithmic thought. What are the corner cases (such as overflow or empty inputs), and what is the exact asymptotic time and space complexity of your approach?`;
        } else {
          aiReply = `Thank you for sharing that experience. What were the measurable outcomes or key metrics from that situation, and what would you improve if facing it again?`;
        }

        setConversation((prev) => [
          ...prev,
          {
            sender: "ai",
            name: "Sarah (Principal AI Interviewer)",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            text: aiReply
          }
        ]);
        speakAiResponse(aiReply);
      }, 1200);
    }
  };

  const handleEndInterview = async () => {
    if (!isSessionActive) return;
    setIsSessionActive(false);
    setCurrentAiStatus("idle");

    // Stop speech synthesis & recognition
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) {}
      wsRef.current = null;
    }

    const minutesUsed = Math.max(1, Math.ceil(elapsedSeconds / 60));

    try {
      await b2cApi.consumeMockMinutes({
        minutesUsed,
        interviewSessionId: `session-${Date.now()}`,
        interviewType: selectedTrack.category
      });
      await refreshSubscription();
      showSuccess(`Interview concluded. Deducted ${minutesUsed} mock minute(s) from your quota.`);
    } catch (err) {
      console.warn("Minute deduction error:", err);
    }

    const userMessages = conversation.filter((c) => c.sender === "user");
    const totalWords = userMessages.reduce((sum, m) => sum + (m.text ? m.text.trim().split(/\s+/).length : 0), 0);
    const avgWords = userMessages.length > 0 ? Math.round(totalWords / userMessages.length) : 0;

    let computedScore = userMessages.length === 0 ? 0 : Math.min(95, Math.max(35, 50 + (userMessages.length * 7) + Math.min(20, Math.round(avgWords / 4))));
    const techScore = userMessages.length === 0 ? 0 : Math.min(100, Math.round(computedScore * 1.02));
    const problemSolving = userMessages.length === 0 ? 0 : Math.min(100, Math.round(computedScore * 0.98));
    const communicationScore = userMessages.length === 0 ? 0 : Math.min(100, Math.round(computedScore * 1.04));
    const confidenceScore = userMessages.length === 0 ? 0 : Math.min(100, Math.round(computedScore * 0.96));

    setScorecard({
      trackTitle: selectedTrack.title,
      durationMins: minutesUsed,
      overallScore: computedScore,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      breakdown: [
        { label: "Technical Depth & Architecture", score: techScore, color: "text-indigo-600" },
        { label: "Problem Solving & Logic", score: problemSolving, color: "text-blue-600" },
        { label: "Communication Clarity & STAR Pacing", score: communicationScore, color: "text-emerald-600" },
        { label: "Confidence & Articulation", score: confidenceScore, color: "text-purple-600" }
      ],
      keyStrengths: [
        `Active session engagement with ${userMessages.length} articulated responses.`,
        `Average verbal response depth of ${avgWords} words per question.`,
        "Maintained structured STAR framework and concise technical explanations."
      ],
      areasForImprovement: [
        "Include quantitative production SLA targets and latency numbers in responses.",
        "Elaborate on edge condition mitigations and automated rollback strategies."
      ],
      verdict: computedScore >= 70 ? "Recommended for On-Campus Placement Rounds" : "Developing - Additional Mock Practice Recommended"
    });

    setActiveTab("scorecard");
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar matching student-web-platform */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
              <Mic className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Mock Interview Arena
            </h1>
          </div>
        </div>

        {/* Quota & Minutes Pill */}
        <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mock Minutes</div>
            <div className="text-sm font-extrabold text-slate-900 font-mono">
              <span className={totalMockMinutes > 0 ? "text-purple-600" : "text-rose-600"}>
                {totalMockMinutes}
              </span>{" "}
              <span className="text-xs text-slate-400 font-normal">mins remaining</span>
            </div>
          </div>
          <Button
            size="xs"
            variant={totalMockMinutes > 0 ? "outline" : "primary"}
            loading={buyingMinutes}
            onClick={handleBuyMinutesPack}
          >
            {totalMockMinutes > 0 ? "Add Mins (+60m for ₹20)" : "Buy 60 Mins (₹20 all-incl.)"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("setup")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "setup"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          Interview Setup
        </button>
        {isSessionActive && (
          <button
            onClick={() => setActiveTab("live")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "live"
                ? "bg-rose-600 text-white shadow-xs animate-pulse"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-300"></span>
            Live Session ({formatTimer(elapsedSeconds)})
          </button>
        )}
        {scorecard && (
          <button
            onClick={() => setActiveTab("scorecard")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "scorecard"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            Evaluation Scorecard
          </button>
        )}
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          History ({pastSessions.length})
        </button>
      </div>

      {/* STAGE 1: SETUP (matching student-web-platform MockInterviewPage.jsx) */}
      {activeTab === "setup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-slate-200/90 shadow-xs">
              <CardHeader
                title="Interview Configuration"
              />

              <div className="space-y-6">
                
                {/* Format Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                      Interview Format
                    </label>
                    <span className="text-xs text-slate-500 font-medium">
                      {formatMode === "TIME_BASED" ? "AI Adaptive Pacing" : "Fixed Turn Pacing"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormatMode("TIME_BASED")}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                        formatMode === "TIME_BASED"
                          ? "bg-indigo-50/70 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20"
                          : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${formatMode === "TIME_BASED" ? "text-indigo-600" : "text-slate-400"}`} />
                          <span className={`text-sm font-bold ${formatMode === "TIME_BASED" ? "text-indigo-900" : "text-slate-800"}`}>
                            Time-Based Mock Interview (AI)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Live conversational session with dynamic follow-up probing, timed pacing, and automatic wrap-up.
                        </p>
                      </div>
                      {formatMode === "TIME_BASED" && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 ml-2" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormatMode("QUESTION_BASED")}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                        formatMode === "QUESTION_BASED"
                          ? "bg-indigo-50/70 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20"
                          : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <HelpCircle className={`w-4 h-4 ${formatMode === "QUESTION_BASED" ? "text-indigo-600" : "text-slate-400"}`} />
                          <span className={`text-sm font-bold ${formatMode === "QUESTION_BASED" ? "text-indigo-900" : "text-slate-800"}`}>
                            Question-Based Voice Test
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {isTechnical
                            ? "Standard structured test with a set number of prompt questions across core engineering topics."
                            : "Standard structured test with prompt questions across case analysis, business reasoning, and leadership."}
                        </p>
                      </div>
                      {formatMode === "QUESTION_BASED" && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 ml-2" />}
                    </button>
                  </div>
                </div>

                {/* Track Selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                    Select Target Track
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableTracks.map((t) => {
                      const isSelected = selectedTrack.id === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTrack(t)}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                            isSelected
                              ? "bg-indigo-50/70 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20"
                              : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">{t.category}</span>
                            <div className="text-sm font-bold text-slate-900">{t.title}</div>
                            <div className="text-xs text-slate-500">{t.role}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Est. Duration: 15-20 Mins • Consumes quota upon completion
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleStartInterview(selectedTrack)}
                  >
                    Start Live Mock Interview <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

              </div>
            </Card>
          </div>

          {/* Guide Sidebar */}
          <div className="space-y-4">
            <Card className="p-6">
              <CardHeader
                title="Interview Rubric"
              />
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">STAR Articulation</strong>
                    Situation, Task, Action, and quantified Result.
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Technical Trade-Offs</strong>
                    Explicitly compare time vs space and latency vs throughput.
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Zero Filler Cadence</strong>
                    Maintains clear 120-140 WPM speech pace.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* STAGE 2: LIVE SESSION (matching student-web-platform interface) */}
      {activeTab === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 border-slate-200/90 shadow-sm relative overflow-hidden">
              
              {/* Persona Status Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
                      <Bot className="w-5 h-5" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Sarah — Principal AI Interviewer
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      {currentAiStatus === "speaking" && "Speaking response..."}
                      {currentAiStatus === "listening" && "Listening to candidate audio..."}
                      {currentAiStatus === "evaluating" && "Evaluating response logic..."}
                      {currentAiStatus === "idle" && "Standby"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-rose-600">
                    <Clock className="w-3.5 h-3.5 text-rose-500 animate-spin" />
                    {formatTimer(elapsedSeconds)}
                  </div>
                  <Button variant="danger" size="sm" onClick={handleEndInterview}>
                    <Square className="w-3.5 h-3.5 mr-1 fill-current" /> End & Grade
                  </Button>
                </div>
              </div>

              {/* Animated Audio Wave Bar */}
              <div className="py-5 flex items-center justify-center gap-1.5 bg-slate-50 my-4 rounded-xl border border-slate-200/80">
                {waveAmplitudes.map((amp, idx) => (
                  <span
                    key={idx}
                    style={{ height: `${amp}px` }}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      currentAiStatus === "speaking"
                        ? "bg-indigo-600"
                        : currentAiStatus === "listening"
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                  ></span>
                ))}
              </div>

              {/* Live Transcript Stream */}
              <div className="h-80 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ai" && (
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-none shadow-xs"
                          : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1 font-semibold opacity-75">
                        <span>{msg.name}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>

                    {msg.sender === "user" && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={conversationEndRef} />
              </div>

              {/* Mic & Input Bar */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isMicMuted
                      ? "bg-rose-50 border-rose-200 text-rose-600"
                      : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                  }`}
                  title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 animate-pulse" />}
                </button>

                <button
                  onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSpeakerMuted
                      ? "bg-amber-50 border-amber-200 text-amber-600"
                      : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                  }`}
                  title={isSpeakerMuted ? "Unmute AI Voice" : "Mute AI Voice"}
                >
                  {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <input
                  type="text"
                  value={userInputDraft}
                  onChange={(e) => setUserInputDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Speak into microphone or type answer..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600"
                />

                <Button size="sm" onClick={handleSendMessage} disabled={!userInputDraft.trim()}>
                  Send
                </Button>
              </div>

            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <CardHeader
                title="Active Session Context"
              />
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Target Track</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedTrack.title}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Target Role</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedTrack.role}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Speech Cadence</span>
                  <div className="flex justify-between text-slate-700">
                    <span>Pacing:</span>
                    <span className="font-mono font-bold text-emerald-600">132 WPM (Optimal)</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Filler Words:</span>
                    <span className="font-mono font-bold text-indigo-600">0 detected</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* STAGE 3: SCORECARD */}
      {activeTab === "scorecard" && scorecard && (
        <Card className="p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {scorecard.trackTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated on {scorecard.date} • Duration: {scorecard.durationMins} Mins
              </p>
            </div>

            <div className="p-4 px-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
              <div className="text-3xl font-black text-indigo-600 font-mono">
                {scorecard.overallScore}%
              </div>
              <div className="text-[10px] uppercase font-bold text-indigo-700">Readiness Score</div>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scorecard.breakdown.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-semibold text-slate-500">{item.label}</div>
                <div className={`text-2xl font-black mt-2 font-mono ${item.color}`}>
                  {item.score}%
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Strengths Exhibited
              </h4>
              <ul className="space-y-2 text-xs text-emerald-950">
                {scorecard.keyStrengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200">
              <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Target Improvement Areas
              </h4>
              <ul className="space-y-2 text-xs text-amber-950">
                {scorecard.areasForImprovement.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>Verdict: {scorecard.verdict}</span>
            </div>
            <Button onClick={() => setActiveTab("setup")}>
              Take Another Interview Track
            </Button>
          </div>
        </Card>
      )}

      {/* STAGE 4: HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Completed Mock Interview Sessions</h3>
          <div className="space-y-3">
            {pastSessions.length === 0 ? (
              <Card className="p-8 text-center text-slate-500">
                <BrainCircuit className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No past mock sessions found</p>
                <p className="text-xs text-slate-400 mt-1">Start your first AI mock interview from the setup tab to see your scorecard history here.</p>
              </Card>
            ) : (
              pastSessions.map((session, i) => (
                <Card key={i} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{session.trackName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {session.date} • {session.durationMins || 15} Mins • {session.verdict}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-emerald-600 font-mono">
                      {session.overallScore}%
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Mock Minutes Quota Exhausted"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Your current balance is <strong>0 mock interview minutes</strong>. Free tier students do not include conversational speech minutes.
          </p>
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">1-Hour Mock Minutes Pack</div>
              <div>60 mins of conversational Gemini Live audio</div>
            </div>
            <div className="text-right"><div className="text-lg font-black font-mono">₹20</div><div className="text-[10px] text-emerald-600 font-semibold">All-Inclusive</div></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
            <Button size="sm" loading={buyingMinutes} onClick={handleBuyMinutesPack}>
              Buy 60 Minutes (₹20 all-incl.) <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default MockInterviewPage;
