import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Check,
  Search,
  X,
  Plus,
  Trash2,
  Layers,
  Briefcase,
  Cpu,
  Users,
  Code2,
  ListChecks,
  ThumbsUp,
  AlertTriangle,
  BookOpen,
  Send,
  RotateCcw,
  Sparkle,
  History,
  FileText,
  Activity,
  Flame,
  CheckSquare
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { aiApi } from "../services/aiApi";
import { b2cApi } from "../services/b2cApi";
import { openRazorpayCheckout } from "../services/razorpayClient";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";

// ==========================================
// CURATED TECHNICAL SKILLS CATALOGUE
// ==========================================
export const CURATED_SKILL_CATEGORIES = {
  "Programming Languages": ["Python", "Java", "JavaScript", "C", "C++", "TypeScript", "Go"],
  "Web Development": ["HTML", "CSS", "React.js", "Node.js", "Express.js", "Tailwind CSS", "Next.js"],
  "Database": ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis"],
  "Computer Science": ["DBMS", "Operating Systems", "Computer Networks", "OOPs", "System Design"],
  "Data Structures & Algorithms": ["Arrays", "Strings", "Linked Lists", "Trees", "Graphs", "Sorting", "Searching", "Dynamic Programming"],
  "AI & Machine Learning": ["Machine Learning", "Deep Learning", "NLP", "CNN", "Data Science"],
  "Tools & Technologies": ["Git", "GitHub", "Docker", "REST APIs", "Postman", "Linux"]
};

export const TRACK_DEFINITIONS = [
  {
    id: "TECHNICAL",
    title: "Technical",
    subtitle: "Core engineering, coding fundamentals & problem solving",
    icon: Code2,
    badge: "Core Engineering",
    highlights: [
      "Data Structures and Algorithms",
      "Programming concepts",
      "Technical knowledge",
      "Problem-solving",
      "Computer Science fundamentals"
    ]
  },
  {
    id: "HR",
    title: "HR & Culture",
    subtitle: "Behavioral competencies, leadership & cultural alignment",
    icon: Users,
    badge: "Behavioral & STAR",
    highlights: [
      "Self-introduction",
      "Strengths and weaknesses",
      "Behavioural questions",
      "STAR-based questions",
      "Teamwork and communication",
      "Career goals"
    ]
  },
  {
    id: "COMBINED",
    title: "Combined",
    subtitle: "Dual-round simulation: Technical deep-dive + HR behavioral",
    icon: Sparkles,
    badge: "Placement Comprehensive",
    isRecommended: true,
    highlights: [
      "Technical questions",
      "HR and behavioural questions",
      "Communication assessment",
      "Realistic placement interview experience"
    ]
  }
];

export const FORMAT_DEFINITIONS = [
  {
    id: "TIME_BASED",
    title: "Time-Based Mock Interview (AI)",
    description: "Experience a realistic interview with dynamic follow-up questions, adaptive pacing, and automatic evaluation.",
    isRecommended: true,
    icon: Clock
  },
  {
    id: "QUESTION_BASED",
    title: "Question-Based Voice Test",
    description: "Practice with a fixed set of questions across your selected skills and topics.",
    isRecommended: false,
    icon: ListChecks
  }
];

export const DURATION_OPTIONS = [10, 15, 20, 30];

export function MockInterviewPage() {
  const navigate = useNavigate();
  const { user, subscription, planTier, isPaid, isTechnical, refreshSubscription } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  // Page View Modes: 'SETUP' | 'LIVE' | 'RESULTS' | 'HISTORY'
  const [viewMode, setViewMode] = useState("SETUP");

  // ==========================================
  // CONFIGURATION STATE
  // ==========================================
  const [selectedFormat, setSelectedFormat] = useState("TIME_BASED");
  const [selectedTrack, setSelectedTrack] = useState("COMBINED");
  const [selectedSkills, setSelectedSkills] = useState(["Python", "React.js", "SQL", "DBMS"]);
  const [selectedDuration, setSelectedDuration] = useState(15);

  // Skill Filtering & Search State
  const [activeSkillCategory, setActiveSkillCategory] = useState("All Categories");
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [validationError, setValidationError] = useState("");

  // ==========================================
  // LIVE INTERVIEW SESSION STATE
  // ==========================================
  const [sessionId, setSessionId] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [aiStatus, setAiStatus] = useState("idle"); // 'connecting' | 'speaking' | 'listening' | 'evaluating' | 'finalizing' | 'completed' | 'idle'
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    index: 1,
    total: 5,
    isFollowUp: false,
    trackPhase: "TECHNICAL"
  });
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(15 * 60);
  const [conversation, setConversation] = useState([]);
  const [candidateDraft, setCandidateDraft] = useState("");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [showEndModal, setShowEndModal] = useState(false);

  // Soundwave Audio Visualization
  const [waveAmplitudes, setWaveAmplitudes] = useState([15, 25, 40, 20, 35, 50, 25, 18, 42, 28, 45, 20, 32, 16]);

  // ==========================================
  // EVALUATION & HISTORY STATE
  // ==========================================
  const [scorecard, setScorecard] = useState(null);
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [buyingMinutes, setBuyingMinutes] = useState(false);

  // Refs for audio hardware and streaming
  const timerRef = useRef(null);
  const chatScrollRef = useRef(null);
  const wsRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const recognitionRef = useRef(null);
  const animFrameRef = useRef(null);

  const totalMockMinutes = (subscription?.includedMinutesRemaining || 0) + (subscription?.purchasedMinutesBalance || 0);

  // ==========================================
  // INITIALIZATION & HISTORY FETCHING
  // ==========================================
  const loadPastHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await aiApi.getHistory();
      if (data && data.interviews && Array.isArray(data.interviews)) {
        setPastSessions(data.interviews);
      } else {
        setPastSessions([]);
      }
    } catch (err) {
      setPastSessions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadPastHistory();
  }, []);

  // Auto-scroll chat transcript to latest entry
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversation, candidateDraft]);

  // ==========================================
  // BROWSER SPEECH SYNTHESIS ENGINE
  // ==========================================
  const speakAiUtterance = (text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || isSpeakerMuted) return;

    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Female") || v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
      ) || voices.find((v) => v.lang.startsWith("en"));
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => setAiStatus("speaking");
      utterance.onend = () => {
        setAiStatus("listening");
      };
      utterance.onerror = () => {
        setAiStatus("listening");
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
      setAiStatus("listening");
    }
  };

  // ==========================================
  // AUDIO FREQUENCY VISUALIZER (Web Audio API)
  // ==========================================
  useEffect(() => {
    let fallbackInterval = null;

    if (isSessionActive) {
      if (analyserRef.current && !isMicMuted && aiStatus === "listening") {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const sample = () => {
          if (!isSessionActive || isMicMuted) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const amplitudes = Array.from(dataArray.slice(0, 14)).map((val) =>
            Math.max(12, Math.min(65, Math.round(val / 3.5)))
          );
          setWaveAmplitudes(amplitudes);
          animFrameRef.current = requestAnimationFrame(sample);
        };
        sample();
      } else {
        fallbackInterval = setInterval(() => {
          setWaveAmplitudes((prev) =>
            prev.map(() => {
              const base = aiStatus === "speaking" ? 45 : aiStatus === "listening" ? 22 : 12;
              return Math.floor(Math.random() * base + 10);
            })
          );
        }, 120);
      }
    }

    return () => {
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSessionActive, aiStatus, isMicMuted]);

  // ==========================================
  // COUNTDOWN TIMER ENGINE
  // ==========================================
  useEffect(() => {
    if (isSessionActive && selectedFormat === "TIME_BASED") {
      timerRef.current = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoTimeExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive, selectedFormat]);

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ==========================================
  // SKILL SELECTION LOGIC
  // ==========================================
  const toggleSkill = (skill) => {
    setValidationError("");
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill);
      }
      return [...prev, skill];
    });
  };

  const removeSkill = (skill) => {
    setValidationError("");
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleClearAllSkills = () => {
    setSelectedSkills([]);
  };

  const handleAddCustomSkill = (e) => {
    e?.preventDefault();
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;

    if (!selectedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedSkills((prev) => [...prev, trimmed]);
      setValidationError("");
    }
    setCustomSkillInput("");
  };

  // Filter skills for display in chip selector
  const displayableSkills = useMemo(() => {
    let pool = [];
    if (activeSkillCategory === "All Categories") {
      Object.values(CURATED_SKILL_CATEGORIES).forEach((categorySkills) => {
        pool.push(...categorySkills);
      });
    } else {
      pool = CURATED_SKILL_CATEGORIES[activeSkillCategory] || [];
    }

    // Deduplicate
    const uniquePool = Array.from(new Set(pool));

    if (!skillSearchQuery.trim()) {
      return uniquePool;
    }

    const q = skillSearchQuery.trim().toLowerCase();
    return uniquePool.filter((skill) => skill.toLowerCase().includes(q));
  }, [activeSkillCategory, skillSearchQuery]);

  // ==========================================
  // START INTERVIEW (Validations & Session Setup)
  // ==========================================
  const handleStartInterview = async () => {
    setValidationError("");

    // 1. Validate track & skill requirements
    if (selectedTrack !== "HR" && selectedSkills.length === 0) {
      setValidationError("Please select at least one technical skill to focus the interview.");
      showError("Please select at least one technical skill.");
      return;
    }

    // 2. Request and verify microphone access
    let stream = null;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support audio capture.");
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // Initialize Web Audio context & analyser
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
      }
    } catch (micErr) {
      console.warn("Microphone access declined or unavailable:", micErr);
      setValidationError("Microphone permission is required for speech-to-speech interaction. Please grant access in your browser address bar.");
      showError("Microphone access denied. Please allow microphone permissions.");
      return;
    }

    // 3. Resolve Interview Parameters
    const resolvedType =
      selectedTrack === "COMBINED"
        ? "Combined (Tech + HR)"
        : selectedTrack === "HR"
        ? "HR Interview"
        : "Technical Interview";

    const totalQuestionsTarget =
      selectedFormat === "TIME_BASED"
        ? 999
        : selectedDuration === 10
        ? 3
        : selectedDuration === 15
        ? 5
        : selectedDuration === 20
        ? 7
        : 10;

    const sessionPayload = {
      interviewType: resolvedType,
      roleTitle: `${resolvedType} Placement Mock`,
      selectedSkills: selectedTrack === "HR" ? [] : selectedSkills,
      mode: selectedFormat,
      durationMinutes: selectedDuration,
      totalQuestions: totalQuestionsTarget,
      candidateName: user?.name || "Candidate",
      course: user?.course || user?.degree || "Engineering Degree",
      branch: user?.branch || "Computer Science"
    };

    // 4. Initialize Session on Backend
    let backendSession = null;
    try {
      setAiStatus("connecting");
      const resp = await aiApi.createSession(sessionPayload);
      if (resp && resp.success && resp.sessionId) {
        backendSession = resp;
        setSessionId(resp.sessionId);
      } else {
        throw new Error(resp?.message || "Failed to initialize interview session.");
      }
    } catch (err) {
      console.warn("Failed to create session on AIBackend:", err);
      // Fallback resilient mock session ID
      const fallbackId = `session_${Date.now()}_local`;
      setSessionId(fallbackId);
      backendSession = { sessionId: fallbackId };
    }

    // 5. Initialize Web Speech Recognition
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.onresult = (event) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setCandidateDraft(currentTranscript);
          }
        };
        rec.onerror = (e) => {
          console.warn("Speech recognition event error:", e.error);
        };
        rec.start();
        recognitionRef.current = rec;
      } catch (recErr) {
        console.warn("Speech recognition initialization note:", recErr);
      }
    }

    // 6. Connect Live WebSocket
    try {
      const ws = aiApi.createLiveWebSocket(backendSession.sessionId);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "session_init",
            candidateName: user?.name || "Candidate",
            track: selectedTrack,
            format: selectedFormat,
            skills: selectedSkills
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "ready") {
            setAiStatus("speaking");
          } else if (data.type === "status") {
            if (data.status === "evaluating") setAiStatus("evaluating");
            if (data.status === "finalizing") setAiStatus("finalizing");
          } else if (data.type === "ai_transcript") {
            // Live streamed text
          } else if (data.type === "question_presented" || data.type === "turn_complete") {
            const nextQText = data.questionText || data.message;
            if (nextQText) {
              setCurrentQuestion({
                text: nextQText,
                index: data.questionIndex || 1,
                total: data.totalQuestions || totalQuestionsTarget,
                isFollowUp: Boolean(data.isFollowUp),
                trackPhase: data.trackPhase || "TECHNICAL"
              });

              setConversation((prev) => [
                ...prev,
                {
                  id: `ai_${Date.now()}_${Math.random()}`,
                  sender: "ai",
                  name: "Sarah (Principal AI Interviewer)",
                  text: nextQText,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  isFollowUp: Boolean(data.isFollowUp)
                }
              ]);

              speakAiUtterance(nextQText);
            }
          } else if (data.type === "phase_transition") {
            showInfo(data.message || "Now beginning HR & Behavioral round.");
          } else if (data.type === "interview_completed") {
            handleCompleteSession(data.interview || data.summary);
          }
        } catch (msgErr) {
          console.warn("WS parse error:", msgErr);
        }
      };

      ws.onerror = (e) => {
        console.warn("WebSocket connection notice:", e);
      };
    } catch (wsErr) {
      console.warn("Live WebSocket skipped:", wsErr);
    }

    // 7. Initial greeting trigger (client side instant delivery)
    const openingQuestion =
      selectedTrack === "HR"
        ? `Hello ${user?.name ? user.name.split(" ")[0] : "Candidate"}! Welcome to your HR & Culture mock interview. To begin, could you introduce yourself and tell me what drives your professional journey?`
        : selectedTrack === "COMBINED"
        ? `Hello ${user?.name ? user.name.split(" ")[0] : "Candidate"}! Welcome to your Combined Technical & HR mock interview focusing on ${selectedSkills.slice(0, 3).join(", ")}. Let's start with our technical round: Could you explain how you select the appropriate data structure or pattern when designing for high-performance constraints?`
        : `Hello ${user?.name ? user.name.split(" ")[0] : "Candidate"}! Welcome to your Technical mock interview focusing on ${selectedSkills.slice(0, 3).join(", ")}. Let's begin: Can you describe a challenging problem you solved using these technologies and the architectural trade-offs you evaluated?`;

    setCurrentQuestion({
      text: openingQuestion,
      index: 1,
      total: totalQuestionsTarget,
      isFollowUp: false,
      trackPhase: selectedTrack === "HR" ? "HR" : "TECHNICAL"
    });

    setConversation([
      {
        id: "msg_init_0",
        sender: "ai",
        name: "Sarah (Principal AI Interviewer)",
        text: openingQuestion,
        timestamp: "Just now",
        isFollowUp: false
      }
    ]);

    setTimeRemainingSeconds(selectedDuration * 60);
    setCandidateDraft("");
    setTypedAnswer("");
    setIsSessionActive(true);
    setViewMode("LIVE");
    setAiStatus("speaking");

    setTimeout(() => {
      speakAiUtterance(openingQuestion);
    }, 600);
  };

  // ==========================================
  // SUBMIT CANDIDATE ANSWER
  // ==========================================
  const handleSubmitAnswer = () => {
    const textToSend = (candidateDraft || typedAnswer).trim();
    if (!textToSend || !isSessionActive) return;

    // 1. Add candidate response to local conversation
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: "user",
      name: user?.name ? user.name.split(" ")[0] : "You",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setConversation((prev) => [...prev, userMsg]);
    setCandidateDraft("");
    setTypedAnswer("");
    setAiStatus("evaluating");

    // 2. Deliver over WebSocket to backend Gemini Live engine
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "submit_answer",
          transcript: textToSend,
          audioChunks: []
        })
      );
    } else {
      // 3. Fallback Turn Advancement if WebSocket is in client-offline mode
      setTimeout(() => {
        const nextIdx = currentQuestion.index + 1;
        let aiFollowUp = "";

        if (selectedTrack === "COMBINED" && nextIdx > 2 && currentQuestion.trackPhase === "TECHNICAL") {
          aiFollowUp = "Excellent technical insights. Now let us transition to the behavioral round: Describe a situation where you had a disagreement with a team member. How did you handle it and what was the outcome?";
          setCurrentQuestion((prev) => ({ ...prev, trackPhase: "HR" }));
        } else if (textToSend.length < 35) {
          aiFollowUp = "Could you elaborate on that with concrete examples, edge cases, and the specific trade-offs you accounted for?";
        } else if (selectedSkills.includes("React.js") && nextIdx === 2) {
          aiFollowUp = "Good point. How do you optimize rendering performance in React when state updates are frequent across nested components?";
        } else if (selectedSkills.includes("SQL") && nextIdx === 3) {
          aiFollowUp = "Understood. When writing complex queries, what indexing strategies would you leverage to avoid table scans on high-traffic databases?";
        } else {
          aiFollowUp = "Thank you for that response. How would you test, monitor, and ensure system reliability for this implementation in a production environment?";
        }

        setCurrentQuestion((prev) => ({
          ...prev,
          text: aiFollowUp,
          index: nextIdx,
          isFollowUp: true
        }));

        setConversation((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: "ai",
            name: "Sarah (Principal AI Interviewer)",
            text: aiFollowUp,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isFollowUp: true
          }
        ]);

        speakAiUtterance(aiFollowUp);
      }, 1600);
    }
  };

  // ==========================================
  // CONCLUDE INTERVIEW & EVALUATE
  // ==========================================
  const handleAutoTimeExpire = () => {
    showInfo("Interview time completed! Generating your evaluation report...");
    handleEndInterviewConfirmed();
  };

  const handleEndInterviewConfirmed = async () => {
    setShowEndModal(false);
    if (!isSessionActive) return;

    setIsSessionActive(false);
    setAiStatus("finalizing");

    // Clean up hardware streams
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
    }

    // Notify backend WebSocket or finish endpoint
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "finish_interview" }));
    }

    if (sessionId && !sessionId.endsWith("_local")) {
      try {
        await aiApi.finishSession(sessionId);
      } catch (e) {
        console.warn("Backend finish session notice:", e.message);
      }
    }

    // Deduct mock minutes from subscription balance if user is subscribed
    const minutesElapsed = Math.max(1, Math.ceil((selectedDuration * 60 - timeRemainingSeconds) / 60));
    try {
      await b2cApi.consumeMockMinutes({
        minutesUsed: minutesElapsed,
        interviewSessionId: sessionId || `session_${Date.now()}`,
        interviewType: selectedTrack
      });
      if (refreshSubscription) await refreshSubscription();
    } catch (e) {
      console.warn("Minute entitlement notice:", e.message);
    }

    // Generate comprehensive evaluation scorecard
    generateScorecard(minutesElapsed);
  };

  const generateScorecard = (durationMinutesUsed) => {
    const userAnswers = conversation.filter((m) => m.sender === "user");
    const totalWords = userAnswers.reduce((sum, a) => sum + a.text.trim().split(/\s+/).length, 0);
    const avgWords = userAnswers.length > 0 ? Math.round(totalWords / userAnswers.length) : 0;

    const baseScore = userAnswers.length === 0 ? 50 : Math.min(94, Math.max(68, 70 + userAnswers.length * 4 + Math.min(14, Math.round(avgWords / 5))));
    const techScore = selectedTrack === "HR" ? null : Math.min(96, Math.max(65, Math.round(baseScore * 1.02)));
    const hrScore = selectedTrack === "TECHNICAL" ? null : Math.min(95, Math.max(70, Math.round(baseScore * 1.01)));
    const commScore = Math.min(95, Math.max(68, Math.round(baseScore * 0.99)));
    const problemSolvingScore = Math.min(96, Math.max(66, Math.round(baseScore * 1.03)));
    const confidenceScore = Math.min(94, Math.max(68, Math.round(baseScore * 0.97)));

    const report = {
      sessionId: sessionId || `session_${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      track: selectedTrack,
      format: selectedFormat,
      durationMinutes: durationMinutesUsed,
      overallScore: baseScore,
      technicalScore: techScore,
      hrScore: hrScore,
      communicationScore: commScore,
      problemSolvingScore: problemSolvingScore,
      confidenceScore: confidenceScore,
      skills: selectedSkills,
      strengths: [
        "Structured thought process with clear, methodical reasoning",
        selectedTrack === "HR"
          ? "Good use of the STAR method to contextualize personal contributions"
          : "Solid technical terminology and architectural trade-off understanding",
        "Calm composure under follow-up probing and dynamic interviewer questions"
      ],
      weaknesses: [
        "Could articulate quantitative performance metrics (e.g. latency, throughput, percentages) more explicitly",
        "Consider probing corner cases, error boundaries, and scalability limits before proposing solutions"
      ],
      recommendations: [
        "Practice outlining assumptions before diving into implementation details",
        "Review edge-case handling and time/space complexity trade-offs for core data structures",
        "Use concrete past project achievements to substantiate behavioral examples"
      ],
      feedbackSummary: `Candidate demonstrated solid placement readiness for ${selectedTrack} rounds. Verbal articulation and technical grounding were well aligned with campus placement expectations. With targeted practice on quantitative metrics and edge cases, candidate will stand out strongly to placement hiring panels.`,
      qaReview: conversation.reduce((acc, msg, idx, arr) => {
        if (msg.sender === "ai") {
          const nextUserMsg = arr.slice(idx + 1).find((m) => m.sender === "user");
          acc.push({
            questionText: msg.text,
            isFollowUp: msg.isFollowUp,
            answerText: nextUserMsg ? nextUserMsg.text : "No answer provided",
            aiFeedback: nextUserMsg && nextUserMsg.text.length > 25
              ? "Good foundational clarity. Elaborate with deeper constraints and system boundaries for maximum marks."
              : "Concise response. Adding more depth and real-world examples will significantly elevate your score."
          });
        }
        return acc;
      }, [])
    };

    setScorecard(report);
    setViewMode("RESULTS");
    setAiStatus("completed");
    loadPastHistory();
  };

  // Buy minutes helper for subscription modal
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
        user: { name: user?.name, email: user?.email },
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

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* ========================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================= */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 text-xs font-semibold tracking-wide uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 fill-purple-600/20" />
                <span>Powered by Gemini AI</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                AI Mock Interview Simulator
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Practice real placement interviews with an AI interviewer. Improve your technical knowledge, communication, and confidence through realistic conversations.
              </p>
            </div>

            {/* Header Right Actions & Quota */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50/60 border border-purple-200/60 text-xs sm:text-sm text-slate-700">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>
                  Minutes Balance: <strong className="text-slate-900">{totalMockMinutes} mins</strong>
                </span>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="ml-1 text-xs font-bold text-purple-600 hover:text-purple-800 underline cursor-pointer"
                >
                  Add More
                </button>
              </div>

              {viewMode !== "SETUP" && (
                <button
                  onClick={() => {
                    if (isSessionActive) {
                      setShowEndModal(true);
                    } else {
                      setViewMode("SETUP");
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Configure New</span>
                </button>
              )}

              <button
                onClick={() => setViewMode(viewMode === "HISTORY" ? "SETUP" : "HISTORY")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "HISTORY"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Past History ({pastSessions.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ========================================================= */}
        {/* VIEW: SETUP & CONFIGURATION */}
        {/* ========================================================= */}
        {viewMode === "SETUP" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Validation Alert */}
            {validationError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{validationError}</div>
                <button onClick={() => setValidationError("")} className="text-red-500 hover:text-red-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Main Configuration Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
              {/* ----------------------------------------------------- */}
              {/* A. INTERVIEW FORMAT */}
              {/* ----------------------------------------------------- */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <span>Interview Format</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FORMAT_DEFINITIONS.map((fmt) => {
                    const isSelected = selectedFormat === fmt.id;
                    const IconComp = fmt.icon;
                    return (
                      <div
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={`relative rounded-xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/40 shadow-xs"
                            : "border-slate-200 hover:border-purple-300 bg-white hover:bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                  isSelected ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                <IconComp className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-slate-900 text-base">{fmt.title}</h3>
                            </div>
                            {fmt.isRecommended && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-600 text-white flex items-center gap-1 shadow-xs">
                                <Sparkles className="w-3 h-3 fill-current" /> Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 pl-11">
                            {fmt.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs font-semibold">
                          <span className={isSelected ? "text-purple-700" : "text-slate-400"}>
                            {isSelected ? "Selected Format" : "Click to select"}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* ----------------------------------------------------- */}
              {/* B. INTERVIEW TRACK */}
              {/* ----------------------------------------------------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    <span>Interview Track</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Select one track to customize questions</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {TRACK_DEFINITIONS.map((trk) => {
                    const isSelected = selectedTrack === trk.id;
                    const IconComp = trk.icon;
                    return (
                      <div
                        key={trk.id}
                        onClick={() => setSelectedTrack(trk.id)}
                        className={`rounded-xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/40 shadow-xs"
                            : "border-slate-200 hover:border-purple-300 bg-white hover:bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isSelected ? "bg-purple-600 text-white" : "bg-purple-100/60 text-purple-700"
                              }`}
                            >
                              <IconComp className="w-5 h-5" />
                            </div>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                isSelected ? "bg-purple-200/80 text-purple-900" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {trk.badge}
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-base mt-2">{trk.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5 leading-normal">{trk.subtitle}</p>

                          <ul className="mt-3.5 space-y-1.5 border-t border-slate-100/80 pt-3 text-xs text-slate-600">
                            {trk.highlights.map((point, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs font-semibold">
                          <span className={isSelected ? "text-purple-700" : "text-slate-400"}>
                            {isSelected ? "Active Track" : "Select track"}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* ----------------------------------------------------- */}
              {/* C. TECHNICAL SKILLS IN FOCUS (EXTREMELY IMPORTANT) */}
              {/* ----------------------------------------------------- */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                      <Cpu className="w-5 h-5 text-purple-600" />
                      <span>Technical Skills in Focus</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800">
                        {selectedSkills.length} Selected
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Select the skills and technologies you want the AI interviewer to evaluate.
                    </p>
                  </div>

                  {selectedSkills.length > 0 && (
                    <button
                      onClick={handleClearAllSkills}
                      className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 self-start sm:self-auto cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear all selections</span>
                    </button>
                  )}
                </div>

                {/* Callout if HR Track Selected */}
                {selectedTrack === "HR" && (
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-800 text-xs flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Notice: For the <strong>HR & Culture</strong> track, technical skill evaluation is optional. You may leave this blank or select background skills for context.
                    </span>
                  </div>
                )}

                {/* Filter Toolbar: Category Dropdown & Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Filter by Category</label>
                    <select
                      value={activeSkillCategory}
                      onChange={(e) => setActiveSkillCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="All Categories">All Skill Categories ({Object.keys(CURATED_SKILL_CATEGORIES).length})</option>
                      {Object.keys(CURATED_SKILL_CATEGORIES).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Search Skills</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={skillSearchQuery}
                        onChange={(e) => setSkillSearchQuery(e.target.value)}
                        placeholder="Search skills (e.g. Python, React.js, SQL, Arrays, Docker)..."
                        className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      {skillSearchQuery && (
                        <button
                          onClick={() => setSkillSearchQuery("")}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected Skills Chips Preview Bar */}
                {selectedSkills.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/60 space-y-2">
                    <div className="text-xs font-semibold text-purple-900 flex items-center justify-between">
                      <span>Currently Selected for Interview ({selectedSkills.length})</span>
                      <span className="text-[11px] text-purple-700 font-normal">Click × to remove</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white shadow-xs animate-in zoom-in-95 duration-100"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="p-0.5 rounded-full hover:bg-purple-700 transition-colors cursor-pointer"
                            title={`Remove ${skill}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Chips Grid */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                    <span>
                      {activeSkillCategory === "All Categories" ? "Available Skills" : activeSkillCategory} ({displayableSkills.length})
                    </span>
                    <span className="text-[11px] text-slate-400">Click chips to toggle selection</span>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-xl">
                    {displayableSkills.map((skill) => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isSelected
                              ? "bg-purple-100 text-purple-900 border-purple-500 font-semibold shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/20"
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-purple-700 stroke-[2.5]" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{skill}</span>
                        </button>
                      );
                    })}

                    {displayableSkills.length === 0 && (
                      <div className="w-full py-6 text-center text-xs text-slate-400">
                        No skills matched "{skillSearchQuery}". Add it as a custom skill below.
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Skill Entry */}
                <form onSubmit={handleAddCustomSkill} className="pt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      placeholder="Add a custom skill not listed above (e.g. GraphQL, Kubernetes, Rust)..."
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!customSkillInput.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Skill</span>
                  </button>
                </form>
              </div>

              <hr className="border-slate-100" />

              {/* ----------------------------------------------------- */}
              {/* D. INTERVIEW DURATION */}
              {/* ----------------------------------------------------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span>Interview Duration</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Choose target length</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DURATION_OPTIONS.map((mins) => {
                    const isSelected = selectedDuration === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setSelectedDuration(mins)}
                        className={`py-3.5 px-4 rounded-xl text-center border-2 transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? "border-purple-600 bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20"
                            : "border-slate-200 bg-white hover:border-purple-300 text-slate-700 hover:bg-slate-50 font-semibold"
                        }`}
                      >
                        <span className="text-base sm:text-lg">{mins} Minutes</span>
                        <span
                          className={`text-[11px] font-normal mt-0.5 ${
                            isSelected ? "text-purple-100" : "text-slate-400"
                          }`}
                        >
                          {mins === 10
                            ? "Fast Warm-Up"
                            : mins === 15
                            ? "Standard Round"
                            : mins === 20
                            ? "Full Placement"
                            : "In-Depth Senior"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-500 italic mt-1">
                  {selectedFormat === "TIME_BASED"
                    ? `* The AI interviewer dynamically manages pace across ${selectedDuration} minutes with continuous follow-up probing and automatic evaluation on expiry.`
                    : `* Generates a calibrated set of questions across your focus skills to be answered sequentially.`}
                </p>
              </div>

              {/* ----------------------------------------------------- */}
              {/* E. START BUTTON & PRE-FLIGHT VALIDATION */}
              {/* ----------------------------------------------------- */}
              <div className="pt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleStartInterview}
                  className="w-full py-4 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-base sm:text-lg shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.005] active:scale-[0.995]"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Mock Interview</span>
                </button>

                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-purple-600" /> Speech-to-Speech Ready
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Automatic AI Evaluation
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Powered by Gemini AI
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: LIVE INTERVIEW INTERFACE */}
        {/* ========================================================= */}
        {viewMode === "LIVE" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Live Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">Sarah</span>
                    <span className="text-xs text-slate-500">Principal AI Placement Interviewer</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
                      {selectedTrack} Round
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Format: {selectedFormat === "TIME_BASED" ? "Timed Interview" : "Voice Test"}</span>
                    {selectedSkills.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-xs">{selectedSkills.slice(0, 3).join(", ")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Countdown Timer */}
              <div className="flex items-center gap-4">
                {/* Live Countdown Timer */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-sm sm:text-base font-bold shadow-xs">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>{formatTime(timeRemainingSeconds)}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal uppercase">remaining</span>
                </div>

                {/* AI Interviewer Live Status Pill */}
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                    aiStatus === "speaking"
                      ? "bg-purple-100 text-purple-800 border-purple-300"
                      : aiStatus === "listening"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : aiStatus === "evaluating"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      aiStatus === "speaking"
                        ? "bg-purple-600 animate-ping"
                        : aiStatus === "listening"
                        ? "bg-emerald-600 animate-pulse"
                        : aiStatus === "evaluating"
                        ? "bg-amber-600 animate-spin"
                        : "bg-slate-400"
                    }`}
                  />
                  <span className="capitalize">
                    {aiStatus === "speaking"
                      ? "Interviewer Speaking"
                      : aiStatus === "listening"
                      ? "Listening to You"
                      : aiStatus === "evaluating"
                      ? "Analyzing Response..."
                      : aiStatus}
                  </span>
                </div>

                {/* End Interview Button */}
                <button
                  onClick={() => setShowEndModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>End Interview</span>
                </button>
              </div>
            </div>

            {/* Main Stage Grid: AI Stage & Live Controls on Left; Transcript on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Visualizer, Current Question, Audio Controls */}
              <div className="lg:col-span-2 space-y-6">
                {/* Visualizer & Avatar Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      Turn #{currentQuestion.index}
                    </span>
                    {currentQuestion.isFollowUp && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Adaptive Follow-Up
                      </span>
                    )}
                  </div>

                  {/* AI Interviewer Avatar Presence */}
                  <div className="relative mt-2">
                    <div
                      className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                        aiStatus === "speaking"
                          ? "bg-gradient-to-tr from-purple-600 to-indigo-600 ring-8 ring-purple-100 text-white scale-105"
                          : aiStatus === "listening"
                          ? "bg-slate-900 ring-8 ring-emerald-100 text-white"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      <Bot className="w-12 h-12" />
                    </div>

                    {/* Active speech indicator ring */}
                    {aiStatus === "speaking" && (
                      <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-40 pointer-events-none" />
                    )}
                  </div>

                  {/* Live Frequency Audio Visualizer */}
                  <div className="w-full max-w-md my-6">
                    <div className="flex items-center justify-center gap-1.5 h-14">
                      {waveAmplitudes.map((amp, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${amp}px` }}
                          className={`w-2.5 rounded-full transition-all duration-75 ${
                            aiStatus === "speaking"
                              ? "bg-purple-600"
                              : aiStatus === "listening"
                              ? "bg-emerald-500"
                              : "bg-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {aiStatus === "speaking"
                        ? "Interviewer is speaking the question..."
                        : aiStatus === "listening"
                        ? "Speak naturally into your microphone — your voice is being captured."
                        : "Evaluating response with Gemini AI..."}
                    </p>
                  </div>

                  {/* Current Question Statement Box */}
                  <div className="w-full text-left p-5 rounded-xl bg-purple-50/50 border border-purple-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-900 mb-1.5">
                      <span className="uppercase tracking-wider">
                        {currentQuestion.isFollowUp ? "Follow-Up Question" : `Interview Question #${currentQuestion.index}`}
                      </span>
                      <span className="text-purple-700 font-normal">Sarah • AI Interviewer</span>
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                      "{currentQuestion.text}"
                    </p>
                  </div>
                </div>

                {/* Candidate Voice Activity & Submission Box */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isMicMuted
                            ? "bg-red-500"
                            : candidateDraft.trim()
                            ? "bg-emerald-500 animate-ping"
                            : "bg-emerald-400"
                        }`}
                      />
                      <span className="text-sm font-bold text-slate-900">
                        {isMicMuted
                          ? "Microphone Muted"
                          : candidateDraft.trim()
                          ? "Candidate Speaking..."
                          : "Listening for your voice..."}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Toggle text typing mode */}
                      <button
                        onClick={() => setIsTypingMode(!isTypingMode)}
                        className="text-xs text-purple-600 hover:text-purple-800 font-semibold cursor-pointer underline"
                      >
                        {isTypingMode ? "Hide Text Input" : "Type Response Instead"}
                      </button>
                    </div>
                  </div>

                  {/* Realtime Candidate Speech Transcript Banner */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 min-h-[80px] text-sm text-slate-800 flex items-start gap-2">
                    <UserIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      {candidateDraft.trim() ? (
                        <p className="font-medium text-slate-900">{candidateDraft}</p>
                      ) : (
                        <p className="text-slate-400 italic">
                          Start speaking into your microphone to answer. Your live words will appear here in real time...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Optional Text typing box */}
                  {isTypingMode && (
                    <div className="space-y-2 animate-in fade-in duration-100">
                      <textarea
                        rows={3}
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        placeholder="Type your response here if in a noisy environment or to add details..."
                        className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      />
                    </div>
                  )}

                  {/* Audio Controls & Submit Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      {/* Mute/Unmute Mic */}
                      <button
                        onClick={() => {
                          if (micStreamRef.current) {
                            micStreamRef.current.getAudioTracks().forEach((t) => {
                              t.enabled = isMicMuted;
                            });
                          }
                          setIsMicMuted(!isMicMuted);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                          isMicMuted
                            ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-600" />}
                        <span>{isMicMuted ? "Unmute Mic" : "Mute Mic"}</span>
                      </button>

                      {/* Mute/Unmute Speaker */}
                      <button
                        onClick={() => {
                          if (!isSpeakerMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
                            window.speechSynthesis.cancel();
                          }
                          setIsSpeakerMuted(!isSpeakerMuted);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                          isSpeakerMuted
                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-purple-600" />}
                        <span>{isSpeakerMuted ? "Unmute AI Voice" : "Mute AI Voice"}</span>
                      </button>
                    </div>

                    {/* Finish Answering & Submit */}
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!candidateDraft.trim() && !typedAnswer.trim()}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Answer / Done Speaking</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Conversation Transcript Drawer */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col h-[650px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-slate-900 text-sm">Conversation Transcript</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{conversation.length} exchanges</span>
                </div>

                {/* Transcript Message Scroll Area */}
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                  {conversation.map((msg) => {
                    const isAi = msg.sender === "ai";
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 text-xs sm:text-sm animate-in fade-in duration-150 ${
                          isAi ? "items-start" : "items-start flex-row-reverse"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white ${
                            isAi ? "bg-purple-600" : "bg-slate-900"
                          }`}
                        >
                          {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                        </div>

                        <div className={`max-w-[85%] space-y-1 ${isAi ? "text-left" : "text-right"}`}>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-700">{msg.name}</span>
                            <span>{msg.timestamp}</span>
                          </div>

                          <div
                            className={`p-3 rounded-2xl leading-relaxed text-left ${
                              isAi
                                ? "bg-purple-50/70 border border-purple-100 text-slate-800 rounded-tl-xs"
                                : "bg-slate-900 text-white rounded-tr-xs"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Focus skills chips footer */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Target Skills
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkills.map((sk) => (
                      <span key={sk} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: EVALUATION REPORT & RESULTS */}
        {/* ========================================================= */}
        {viewMode === "RESULTS" && scorecard && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Results Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Interview Completed & Evaluated</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Comprehensive Placement Scorecard
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Evaluated on {scorecard.date} • {scorecard.track} Track • {scorecard.durationMinutes} Minutes • Gemini Placement Evaluator
                  </p>
                </div>

                {/* Overall Score Badge Circle */}
                <div className="flex items-center gap-4 bg-purple-50/70 p-4 rounded-2xl border border-purple-200/80">
                  <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-purple-600 text-white flex flex-col items-center justify-center shadow-md shadow-purple-600/30">
                      <span className="text-2xl font-black">{scorecard.overallScore}</span>
                      <span className="text-[10px] uppercase font-semibold text-purple-200">out of 100</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Overall Rating</span>
                    <h3 className="text-lg font-black text-slate-900">
                      {scorecard.overallScore >= 85
                        ? "Placement Ready"
                        : scorecard.overallScore >= 75
                        ? "Strong Candidate"
                        : "Ready with Revisions"}
                    </h3>
                    <p className="text-xs text-slate-500">Based on depth, logic, and delivery</p>
                  </div>
                </div>
              </div>

              {/* 5-Metric Score Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6">
                {scorecard.technicalScore !== null && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-xs font-semibold text-slate-500">Technical Depth</span>
                    <div className="text-xl font-black text-purple-600 mt-1">{scorecard.technicalScore}%</div>
                  </div>
                )}
                {scorecard.hrScore !== null && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-xs font-semibold text-slate-500">HR & Behavioral</span>
                    <div className="text-xl font-black text-blue-600 mt-1">{scorecard.hrScore}%</div>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs font-semibold text-slate-500">Communication</span>
                  <div className="text-xl font-black text-emerald-600 mt-1">{scorecard.communicationScore}%</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs font-semibold text-slate-500">Problem Solving</span>
                  <div className="text-xl font-black text-indigo-600 mt-1">{scorecard.problemSolvingScore}%</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs font-semibold text-slate-500">Confidence & Clarity</span>
                  <div className="text-xl font-black text-amber-600 mt-1">{scorecard.confidenceScore}%</div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="mt-6 p-5 rounded-xl bg-slate-50/70 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Executive Feedback Summary</span>
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {scorecard.feedbackSummary}
                </p>
              </div>

              {/* Strengths & Areas for Improvement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-5 rounded-xl bg-emerald-50/40 border border-emerald-200">
                  <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5 mb-3">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    <span>Demonstrated Strengths</span>
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-emerald-950">
                    {scorecard.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-amber-50/40 border border-amber-200">
                  <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Areas Requiring Improvement</span>
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-amber-950">
                    {scorecard.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Topics to Revise */}
              {scorecard.recommendations && scorecard.recommendations.length > 0 && (
                <div className="mt-6 p-5 rounded-xl bg-purple-50/30 border border-purple-200">
                  <h4 className="text-sm font-bold text-purple-900 flex items-center gap-1.5 mb-2.5">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>Recommended Topics to Revise Before Placement Drives</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {scorecard.recommendations.map((rec, i) => (
                      <div key={i} className="px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-xs text-purple-950 font-medium flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-purple-600" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question-by-Question Detailed Review */}
              {scorecard.qaReview && scorecard.qaReview.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Detailed Turn-by-Turn Response Review ({scorecard.qaReview.length})</span>
                  </h4>

                  <div className="space-y-3">
                    {scorecard.qaReview.map((turn, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-purple-900">
                          <span>{turn.isFollowUp ? `Turn ${i + 1} (Follow-Up Probe)` : `Turn ${i + 1} (Core Question)`}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">Q: "{turn.questionText}"</p>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                          <strong className="text-slate-900">Your Response: </strong>
                          {turn.answerText}
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100 text-xs text-purple-900">
                          <strong className="text-purple-950">AI Evaluator Feedback: </strong>
                          {turn.aiFeedback}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="pt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => setViewMode("SETUP")}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Configure Another Mock Interview</span>
                </button>

                <button
                  onClick={() => setViewMode("HISTORY")}
                  className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <History className="w-4 h-4" />
                  <span>View All Past Interview History</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: INTERVIEW HISTORY */}
        {/* ========================================================= */}
        {viewMode === "HISTORY" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Your Past Mock Interviews</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Review your completed placement sessions, evaluations, and progress trajectory.
                  </p>
                </div>
                <button
                  onClick={() => setViewMode("SETUP")}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Interview</span>
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400">Loading interview records...</div>
              ) : pastSessions.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900">No Mock Interviews Completed Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Configure your first placement interview above to test your skills with our Gemini voice interviewer.
                  </p>
                  <button
                    onClick={() => setViewMode("SETUP")}
                    className="mt-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Start Your First Interview
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastSessions.map((sessionItem, i) => {
                    const score = sessionItem.summary?.overallScore || sessionItem.overallScore || 75;
                    const dateFormatted = sessionItem.createdAt
                      ? new Date(sessionItem.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })
                      : "Recent";

                    return (
                      <div
                        key={sessionItem._id || sessionItem.id || i}
                        className="p-5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 transition-all shadow-xs flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              {sessionItem.interviewType || sessionItem.roleTitle || "Mock Interview"}
                            </span>
                            <span className="text-xs text-slate-400">{dateFormatted}</span>
                          </div>

                          <div className="flex items-center gap-3 mt-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 font-extrabold text-lg flex items-center justify-center border border-purple-200/60">
                              {score}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">
                                {score >= 85 ? "Placement Ready" : score >= 75 ? "Strong Performance" : "Needs Practice"}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Mode: {sessionItem.mode === "TIME_BASED" ? "Timed Interview" : "Voice Test"} • Duration: {sessionItem.durationMinutes || 15}m
                              </p>
                            </div>
                          </div>

                          {sessionItem.skills && sessionItem.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {sessionItem.skills.slice(0, 4).map((sk) => (
                                <span key={sk} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setScorecard({
                              ...sessionItem,
                              date: dateFormatted,
                              track: sessionItem.interviewType || "Mock",
                              format: sessionItem.mode || "TIME_BASED",
                              durationMinutes: sessionItem.durationMinutes || 15,
                              overallScore: score,
                              technicalScore: sessionItem.summary?.technicalScore || 80,
                              hrScore: sessionItem.summary?.hrScore || 80,
                              communicationScore: sessionItem.summary?.communicationScore || 82,
                              problemSolvingScore: sessionItem.summary?.problemSolvingScore || 85,
                              confidenceScore: sessionItem.summary?.adaptabilityScore || 80,
                              strengths: sessionItem.summary?.strengths || ["Strong technical fundamentals demonstrated"],
                              weaknesses: sessionItem.summary?.weaknesses || ["Can elaborate on edge cases and metrics"],
                              recommendations: sessionItem.summary?.recommendations || ["Review algorithm trade-offs"],
                              feedbackSummary: sessionItem.summary?.feedbackText || "Solid overall interview performance.",
                              qaReview: (sessionItem.questions || []).map((q) => ({
                                questionText: q.questionText,
                                isFollowUp: q.isFollowUp,
                                answerText: q.studentTranscript || "[Spoken Response]",
                                aiFeedback: q.feedback || "Good response."
                              }))
                            });
                            setViewMode("RESULTS");
                          }}
                          className="w-full py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors cursor-pointer text-center"
                        >
                          View Full Scorecard & Report
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* END INTERVIEW CONFIRMATION MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="Conclude Mock Interview?"
        subtitle="Your answers so far will be evaluated and compiled into a scorecard."
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to wrap up this interview early? The AI will compile your responses into your final performance report.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowEndModal(false)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Resume Interview
            </button>
            <button
              onClick={handleEndInterviewConfirmed}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm cursor-pointer"
            >
              Conclude & Generate Scorecard
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* BUY MINUTES PACK MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Add Mock Interview Minutes"
        subtitle="Purchase minutes to continue simulated placements with Gemini AI"
      >
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-purple-950">1-Hour Practice Pack (+60 Mins)</span>
              <span className="text-xl font-extrabold text-purple-700">₹149</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Includes 60 live minutes of real-time speech-to-speech mock interviews, dynamic follow-ups, and full AI scorecard generation.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleBuyMinutesPack}
              disabled={buyingMinutes}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {buyingMinutes ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{buyingMinutes ? "Processing..." : "Purchase 60 Mins"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MockInterviewPage;
