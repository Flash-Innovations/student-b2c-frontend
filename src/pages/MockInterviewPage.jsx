import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Loader2,
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
  CheckSquare,
  Video,
  VideoOff,
  Printer,
  ChevronDown,
  ChevronUp,
  Filter,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { aiApi } from "../services/aiApi";
import { b2cApi } from "../services/b2cApi";
import { openRazorpayCheckout } from "../services/razorpayClient";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { evaluateAnswerForQuestion, calculateOverallReport, isSkipOrEvasion } from "../utils/interviewEvaluator";
import { pickIntelligentNextQuestion, isSemanticallySimilar } from "../utils/interviewQuestionBank";

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

export const POPULAR_TECHNICAL_SKILLS = [
  "Python",
  "Java",
  "JavaScript",
  "React.js",
  "Node.js",
  "SQL",
  "DBMS",
  "Operating Systems",
  "Arrays & Strings",
  "Trees & Graphs",
  "System Design",
  "Docker"
];

export const CURATED_HR_COMPETENCIES = [
  "STAR Method (Situation, Task, Action, Result)",
  "Conflict Resolution & Teamwork",
  "Leadership & Ownership",
  "Strengths, Weaknesses & Self-Awareness",
  "Career Goals & 5-Year Vision",
  "Handling Deadlines & Pressure",
  "Adaptability & Culture Fit",
  "Project Walkthrough & Impact"
];

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

export const INTERVIEW_STATES = {
  INITIALIZING: "INITIALIZING",
  AI_SPEAKING: "AI_SPEAKING",
  WAITING_FOR_STUDENT: "WAITING_FOR_STUDENT",
  RECORDING: "RECORDING",
  TRANSCRIBING: "TRANSCRIBING",
  EVALUATING: "EVALUATING",
  INTERVIEW_COMPLETED: "INTERVIEW_COMPLETED",
  ERROR: "ERROR"
};

export const DURATION_OPTIONS = [10, 15, 20, 30];

// Minutes Pricing Tiers: ₹20 = 60 mins (₹1 per 3 mins)
export const MINUTE_PACKS = [
  {
    hours: 1,
    minutes: 60,
    price: 20,
    badge: "1 Hour Pack",
    rateNote: "₹1 for every 3 mins",
    desc: "Includes 60 live minutes of real-time speech mock interview, adaptive follow-ups, and AI scorecard."
  },
  {
    hours: 2,
    minutes: 120,
    price: 40,
    badge: "2 Hours Pack",
    isPopular: true,
    rateNote: "Most Popular • ₹1 for every 3 mins",
    desc: "120 minutes of comprehensive placement practice covering technical depth and behavioral questions."
  },
  {
    hours: 5,
    minutes: 300,
    price: 100,
    badge: "5 Hours Pack",
    isBestValue: true,
    rateNote: "Best Value • ₹1 for every 3 mins",
    desc: "300 minutes of intensive campus drive preparation. Practice multiple tracks and master full interviews."
  }
];

// Phonetic & Technical Terminology Correction Dictionary
export const TECHNICAL_TERM_PATTERNS = [
  [/\b(s\s*q\s*l|sequel|seek wel|s\.q\.l\.)\b/gi, "SQL"],
  [/\b(d\s*b\s*m\s*s|d\.b\.m\.s\.)\b/gi, "DBMS"],
  [/\b(r\s*d\s*b\s*m\s*s)\b/gi, "RDBMS"],
  [/\b(a\s*p\s*i\s*s?|a\.p\.i\.)\b/gi, "API"],
  [/\b(pie\s*thon|py\s*thon)\b/gi, "Python"],
  [/\b(react\s*js|react\s*j\s*s|reactjs)\b/gi, "React.js"],
  [/\b(mongo\s*db|mongo\s*d\s*b|mongodb)\b/gi, "MongoDB"],
  [/\b(post\s*gres|postgress|post\s*gre\s*s\s*q\s*l|postgresql)\b/gi, "PostgreSQL"],
  [/\b(poly\s*morphism|poly-morphism)\b/gi, "polymorphism"],
  [/\b(a\s*sync|a\s*sink)\b/gi, "async"],
  [/\b(call\s*back|call\s*backs)\b/gi, "callback"],
  [/\b(event\s*loop)\b/gi, "event loop"],
  [/\b(b\s*tree|b\s*trees|b-tree)\b/gi, "B-Tree"],
  [/\b(a\s*c\s*i\s*d(\s*properties)?)\b/gi, "ACID properties"],
  [/\b(s\s*t\s*a\s*r(\s*method)?)\b/gi, "STAR method"],
  [/\b(git\s*hub)\b/gi, "GitHub"],
  [/\b(micro\s*task)\b/gi, "microtask"],
  [/\b(macro\s*task)\b/gi, "macrotask"],
  [/\b(o\s*o\s*p\s*s?|oops)\b/gi, "OOP"],
  [/\b(d\s*s\s*a|d\.s\.a\.)\b/gi, "DSA"],
  [/\b(node\s*js|node\s*j\s*s|nodejs)\b/gi, "Node.js"],
  [/\b(express\s*js|express\s*j\s*s|expressjs)\b/gi, "Express.js"],
  [/\b(read\s*is|red\s*is)\b/gi, "Redis"],
  [/\b(c\s*plus\s*plus|c\s*\+\s*\+)\b/gi, "C++"],
  [/\b(java\s*script|j\s*s)\b/gi, "JavaScript"],
  [/\b(type\s*script|t\s*s)\b/gi, "TypeScript"],
  [/\b(doc\s*ker)\b/gi, "Docker"],
  [/\b(kubernetes|k8s)\b/gi, "Kubernetes"],
  [/\b(rest\s*api|rest\s*apis|restful\s*api)\b/gi, "REST API"],
  [/\b(graph\s*ql)\b/gi, "GraphQL"],
  [/\b(crud)\b/gi, "CRUD"],
  [/\b(j\s*son|jay\s*son)\b/gi, "JSON"],
  [/\b(j\s*w\s*t|jot)\b/gi, "JWT"],
  [/\b(html\s*5?)\b/gi, "HTML"],
  [/\b(css\s*3?)\b/gi, "CSS"],
  [/\b(tailwind(\s*css)?)\b/gi, "Tailwind CSS"],
  [/\b(multithreading|multi\s*threading)\b/gi, "multithreading"],
  [/\b(concurrency|con\s*currency)\b/gi, "concurrency"],
  [/\b(normalization|normalisation)\b/gi, "normalization"],
  [/\b(denormalization|denormalisation)\b/gi, "denormalization"],
  [/\b(encapsulation|in\s*capsulation)\b/gi, "encapsulation"],
  [/\b(inheritance|in\s*heritance)\b/gi, "inheritance"],
  [/\b(virtual\s*dom)\b/gi, "Virtual DOM"],
  [/\b(garbage\s*collection|g\s*c)\b/gi, "garbage collection"],
  [/\b(time\s*complexity)\b/gi, "time complexity"],
  [/\b(space\s*complexity)\b/gi, "space complexity"],
  [/\b(big\s*o)\b/gi, "Big-O"]
];

export function normalizeTranscript(rawText) {
  if (!rawText) return "";
  let text = rawText;
  for (const [pattern, replacement] of TECHNICAL_TERM_PATTERNS) {
    text = text.replace(pattern, replacement);
  }
  return text.replace(/\s+/g, " ").trim();
}

export async function getOptimalAudioStream() {
  const constraints = {
    audio: {
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
      autoGainControl: { ideal: true },
      channelCount: { ideal: 1 },
      sampleRate: { ideal: 16000 }
    }
  };
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    console.warn("Optimized audio constraints rejected, falling back to basic audio capture:", err);
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

export function MockInterviewPage() {
  const navigate = useNavigate();
  const { user, subscription, setSubscription, updateSubscription, deductMockMinutes, planTier, isPaid, isTechnical, refreshSubscription } = useAuth();
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
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [validationError, setValidationError] = useState("");

  // Top-Up Minutes Pack State
  const [selectedMinutePack, setSelectedMinutePack] = useState(MINUTE_PACKS[0]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [buyingMinutes, setBuyingMinutes] = useState(false);

  // ==========================================
  // LIVE INTERVIEW SESSION STATE
  // ==========================================
  const [sessionId, setSessionId] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [interviewState, setInterviewState] = useState(INTERVIEW_STATES.INITIALIZING);
  const interviewStateRef = useRef(INTERVIEW_STATES.INITIALIZING);
  const accumulatedTranscriptRef = useRef("");
  const currentSessionFinalRef = useRef("");
  const interimTranscriptRef = useRef("");
  const speechSafetyTimerRef = useRef(null);
  const [speechLanguage, setSpeechLanguage] = useState("en-IN"); // Default Indian English with en-US toggle

  useEffect(() => {
    interviewStateRef.current = interviewState;
  }, [interviewState]);
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
  const [turnEvaluations, setTurnEvaluations] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Refs for audio hardware and streaming
  const timerRef = useRef(null);
  const chatScrollRef = useRef(null);
  const searchContainerRef = useRef(null);
  const wsRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const recognitionRef = useRef(null);
  const animFrameRef = useRef(null);
  const isEndingRef = useRef(false);
  const [startingInterview, setStartingInterview] = useState(false);

  // Local Webcam Self-Preview State (Client-Side Only)
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // Turn Review Filtering & Accordion Expansion State
  const [turnFilter, setTurnFilter] = useState("ALL"); // 'ALL' | 'NEEDS_WORK' | 'STRONG'
  const [expandedTurns, setExpandedTurns] = useState({});

  // Toggle Candidate Local Webcam
  const toggleCamera = async () => {
    if (showCamera) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      setShowCamera(false);
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          showInfo("Webcam is not supported in this browser.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: "user" }
        });
        cameraStreamRef.current = stream;
        setShowCamera(true);
      } catch (camErr) {
        console.warn("Webcam access notice:", camErr);
        showInfo("Camera access was not granted or is unavailable.");
      }
    }
  };

  useEffect(() => {
    if (showCamera && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [showCamera]);

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  // Turn accordion handlers
  const toggleTurnAccordion = (index) => {
    setExpandedTurns((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleExpandAllTurns = (expand) => {
    if (!scorecard?.qaReview) return;
    const nextState = {};
    scorecard.qaReview.forEach((_, i) => {
      nextState[i] = expand;
    });
    setExpandedTurns(nextState);
  };

  const totalMockMinutes = (subscription?.includedMinutesRemaining || 0) + (subscription?.purchasedMinutesBalance || 0);

  // ==========================================
  // CLOSE SEARCH DROPDOWN ON OUTSIDE CLICK
  // ==========================================
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSkillDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (refreshSubscription) {
      try { refreshSubscription(); } catch (_) {}
    }
  }, []);

  // Auto-scroll chat transcript to latest entry
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversation, candidateDraft]);

  // ==========================================
  // TRACK CHANGE HANDLER
  // ==========================================
  const handleSelectTrack = (trackId) => {
    setSelectedTrack(trackId);
    setValidationError("");
    if (trackId === "HR") {
      setSelectedSkills([
        "STAR Method (Situation, Task, Action, Result)",
        "Conflict Resolution & Teamwork",
        "Leadership & Ownership"
      ]);
      setShowSkillDropdown(false);
      setSkillSearchQuery("");
    } else {
      if (selectedSkills.length === 0 || selectedSkills.some((s) => CURATED_HR_COMPETENCIES.includes(s))) {
        setSelectedSkills(["Python", "React.js", "SQL", "DBMS"]);
      }
    }
  };

  // ==========================================
  // BROWSER SPEECH SYNTHESIS ENGINE
  // ==========================================
  const speakAiUtterance = (text, onFinished) => {
    if (speechSafetyTimerRef.current) {
      clearTimeout(speechSafetyTimerRef.current);
      speechSafetyTimerRef.current = null;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window) || isSpeakerMuted) {
      setInterviewState(INTERVIEW_STATES.WAITING_FOR_STUDENT);
      setAiStatus("listening");
      if (onFinished) onFinished();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = (text || "").replace(/[*_#`]/g, "").trim();
      if (!cleanText) {
        setInterviewState(INTERVIEW_STATES.WAITING_FOR_STUDENT);
        setAiStatus("listening");
        if (onFinished) onFinished();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.02;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Female") || v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
      ) || voices.find((v) => v.lang.startsWith("en"));
      if (naturalVoice) utterance.voice = naturalVoice;

      setInterviewState(INTERVIEW_STATES.AI_SPEAKING);
      setAiStatus("speaking");

      const handleSpeechDone = () => {
        if (speechSafetyTimerRef.current) {
          clearTimeout(speechSafetyTimerRef.current);
          speechSafetyTimerRef.current = null;
        }
        setInterviewState(INTERVIEW_STATES.WAITING_FOR_STUDENT);
        setAiStatus("listening");
        if (onFinished) onFinished();
      };

      utterance.onstart = () => {
        setInterviewState(INTERVIEW_STATES.AI_SPEAKING);
        setAiStatus("speaking");
      };

      utterance.onend = handleSpeechDone;
      utterance.onerror = (e) => {
        console.warn("Speech synthesis notice:", e);
        handleSpeechDone();
      };

      const wordsCount = cleanText.split(/\s+/).length;
      const expectedDurationMs = Math.max(2500, wordsCount * 360 + 1500);
      speechSafetyTimerRef.current = setTimeout(() => {
        if (interviewStateRef.current === INTERVIEW_STATES.AI_SPEAKING) {
          handleSpeechDone();
        }
      }, expectedDurationMs);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
      setInterviewState(INTERVIEW_STATES.WAITING_FOR_STUDENT);
      setAiStatus("listening");
      if (onFinished) onFinished();
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

  const formatTime = (seconds) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ==========================================
  // SKILL SELECTION LOGIC
  // ==========================================
  const removeSkill = (skill) => {
    setValidationError("");
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleClearAllSkills = () => {
    setSelectedSkills([]);
    setValidationError("");
  };

  const handleSelectSkillFromDropdown = (skill) => {
    setValidationError("");
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills((prev) => [...prev, skill]);
    }
    setSkillSearchQuery("");
    setShowSkillDropdown(false);
  };

  const handleAddCustomSkill = (skillName) => {
    const trimmed = (skillName || skillSearchQuery || customSkillInput).trim();
    if (!trimmed) return;

    if (!selectedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedSkills((prev) => [...prev, trimmed]);
      setValidationError("");
    }
    setSkillSearchQuery("");
    setCustomSkillInput("");
    setShowSkillDropdown(false);
  };

  // Matching skills in search dropdown
  const matchingSkills = useMemo(() => {
    let pool = [];
    if (activeSkillCategory === "All Categories") {
      Object.entries(CURATED_SKILL_CATEGORIES).forEach(([cat, skills]) => {
        skills.forEach((s) => pool.push({ name: s, category: cat }));
      });
    } else {
      const skills = CURATED_SKILL_CATEGORIES[activeSkillCategory] || [];
      skills.forEach((s) => pool.push({ name: s, category: activeSkillCategory }));
    }

    // Deduplicate by name
    const uniquePool = [];
    const seen = new Set();
    for (const item of pool) {
      if (!seen.has(item.name.toLowerCase())) {
        seen.add(item.name.toLowerCase());
        uniquePool.push(item);
      }
    }

    if (!skillSearchQuery.trim()) {
      return uniquePool;
    }

    const q = skillSearchQuery.trim().toLowerCase();
    return uniquePool.filter((item) => item.name.toLowerCase().includes(q));
  }, [activeSkillCategory, skillSearchQuery]);

  // ==========================================
  // START INTERVIEW (Validations & Session Setup)
  // ==========================================
  const handleStartInterview = async () => {
    if (startingInterview) return;
    setValidationError("");

    // 1. Authoritative Minutes Balance Check: Duration cannot exceed remaining balance
    if (totalMockMinutes === 0) {
      const errorMsg = "No interview minutes remaining. You have used all your interview minutes. Please add more minutes to continue practising with Sarah.";
      setValidationError(errorMsg);
      showError(errorMsg);
      setShowUpgradeModal(true);
      return;
    }

    if (totalMockMinutes < selectedDuration) {
      const errorMsg = `Insufficient interview minutes. Please add more minutes to continue (Available: ${totalMockMinutes} mins, Required: ${selectedDuration} mins).`;
      setValidationError(errorMsg);
      showError(errorMsg);
      setShowUpgradeModal(true);
      return;
    }

    setStartingInterview(true);

    // 2. Validate track & skill requirements
    if (selectedSkills.length === 0) {
      const msg =
        selectedTrack === "HR"
          ? "Please select at least one behavioral competency for your HR interview."
          : "Please select at least one technical skill to focus the interview.";
      setValidationError(msg);
      showError(msg);
      return;
    }

    // 3. Request and verify microphone access with optimized noise suppression & echo cancellation
    let stream = null;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support audio capture.");
      }
      stream = await getOptimalAudioStream();
      micStreamRef.current = stream;

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
      setStartingInterview(false);
      setValidationError("Microphone permission is required for speech-to-speech interaction. Please grant access in your browser address bar.");
      showError("Microphone access denied. Please allow microphone permissions.");
      return;
    }

    // 4. Resolve Interview Parameters
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
      selectedSkills: selectedSkills,
      mode: selectedFormat,
      durationMinutes: selectedDuration,
      totalQuestions: totalQuestionsTarget,
      candidateName: user?.name || "Candidate",
      course: user?.course || user?.degree || "Engineering Degree",
      branch: user?.branch || "Computer Science",
      availableMinutes: totalMockMinutes,
      includedMinutesRemaining: subscription?.includedMinutesRemaining || 0,
      purchasedMinutesBalance: subscription?.purchasedMinutesBalance || 0
    };

    // 5. Initialize Session on Backend
    let backendSession = null;
    try {
      setAiStatus("connecting");
      const resp = await aiApi.createSession(sessionPayload);
      if (resp && resp.success && resp.sessionId) {
        backendSession = resp;
        setSessionId(resp.sessionId);

        // Deduct complete scheduled duration immediately from Core Backend
        try {
          const deductRes = await b2cApi.consumeMockMinutes({
            minutesUsed: selectedDuration,
            interviewType: resolvedType,
            sessionId: resp.sessionId
          });
          if (deductRes && deductRes.subscription) {
            updateSubscription(deductRes.subscription);
          } else if (resp.subscription) {
            updateSubscription(resp.subscription);
          } else {
            deductMockMinutes(selectedDuration);
          }
        } catch (consumeErr) {
          console.warn("Core backend deduction notice, applying live client deduction:", consumeErr?.message);
          if (resp.subscription) {
            updateSubscription(resp.subscription);
          } else {
            deductMockMinutes(selectedDuration);
          }
        }

        if (refreshSubscription) {
          try { await refreshSubscription(); } catch (_) {}
        }
      } else {
        throw new Error(resp?.message || "Failed to initialize interview session.");
      }
    } catch (err) {
      setStartingInterview(false);
      const userTrulyInsufficient = totalMockMinutes === 0 || totalMockMinutes < selectedDuration;

      // Only block if the student's authenticated subscription truly has zero or insufficient minutes
      if (userTrulyInsufficient) {
        if (stream) {
          try { stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
        }
        const errorMsg = totalMockMinutes === 0
          ? "No interview minutes remaining. You have used all your interview minutes. Please add more minutes to continue practising with Sarah."
          : `Insufficient interview minutes. Please add more minutes to continue (Available: ${totalMockMinutes} mins, Required: ${selectedDuration} mins).`;
        setValidationError(errorMsg);
        showError(errorMsg);
        setShowUpgradeModal(true);
        setAiStatus("idle");
        return;
      }

      console.warn("Session init note, falling back to client mode:", err);
      // Student has valid minutes (e.g. 55 minutes) - consume in core backend and proceed so they are never blocked!
      try {
        const deductRes = await b2cApi.consumeMockMinutes({
          minutesUsed: selectedDuration,
          interviewType: resolvedType,
          sessionId: `fallback_${Date.now()}`
        });
        if (deductRes && deductRes.subscription) {
          updateSubscription(deductRes.subscription);
        } else {
          deductMockMinutes(selectedDuration);
        }
      } catch (_) {
        deductMockMinutes(selectedDuration);
      }
      if (refreshSubscription) {
        try { refreshSubscription(); } catch (_) {}
      }

      const fallbackId = `session_${Date.now()}_local`;
      setSessionId(fallbackId);
      backendSession = { sessionId: fallbackId };
    }
    setStartingInterview(false);

    // 6. Initialize Web Speech Recognition
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
          console.warn("Speech recognition event notice:", e.error);
        };
        // Recognition will start when candidate clicks Start Speaking
        recognitionRef.current = rec;
      } catch (recErr) {
        console.warn("Speech recognition initialization note:", recErr);
      }
    }

    // 7. Connect Live WebSocket
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
            skills: selectedTrack === "HR" ? [] : selectedSkills
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
          } else if (data.type === "question_presented" || data.type === "turn_complete") {
            if (data.previousTurn) {
              setTurnEvaluations((prev) => {
                const existingIdx = prev.findIndex((t) => t.questionIndex === data.previousTurn.questionIndex);
                if (existingIdx >= 0) {
                  const updated = [...prev];
                  updated[existingIdx] = data.previousTurn;
                  return updated;
                }
                return [...prev, data.previousTurn];
              });
            }

            const nextQText = data.questionText || data.message;
            if (nextQText) {
              setCurrentQuestion({
                text: nextQText,
                index: data.questionIndex || 1,
                total: data.totalQuestions || totalQuestionsTarget,
                isFollowUp: Boolean(data.isFollowUp),
                trackPhase: data.trackPhase || (selectedTrack === "HR" ? "HR" : "TECHNICAL")
              });

              setConversation((prev) => [
                ...prev,
                {
                  id: `ai_${Date.now()}_${Math.random()}`,
                  sender: "ai",
                  name: "Sarah – Principal (Principal AI Placement Interviewer)",
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

    // 8. Dynamic Initial Greeting Trigger with Fresh Question 1
    const candidateFirstName = user?.name ? user.name.split(" ")[0] : "Candidate";
    let firstCoreQuestion = backendSession?.session?.firstQuestion?.text || backendSession?.firstQuestion?.text;

    if (!firstCoreQuestion) {
      const pastQuestionTexts = pastSessions.flatMap((s) => (s.qaReview || s.questions || []).map((q) => q.questionText)).filter(Boolean);
      const pickedQ = pickIntelligentNextQuestion({
        selectedSkills: selectedSkills,
        track: resolvedType,
        sessionQuestionHistory: [],
        crossSessionHistory: pastQuestionTexts,
        isFollowUp: false
      });
      firstCoreQuestion = pickedQ.questionText;
    }

    const openingQuestion =
      selectedTrack === "HR"
        ? `Hello ${candidateFirstName}! Welcome to your HR & Culture placement mock interview. Let's begin: ${firstCoreQuestion}`
        : selectedTrack === "COMBINED"
        ? `Hello ${candidateFirstName}! Welcome to your Combined Technical & HR mock interview focusing on ${selectedSkills.slice(0, 3).join(", ")}. Let's start with our technical round: ${firstCoreQuestion}`
        : `Hello ${candidateFirstName}! Welcome to your Technical placement mock interview focusing on ${selectedSkills.slice(0, 3).join(", ")}. Let's begin: ${firstCoreQuestion}`;

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
  // VOICE-BASED INTERVIEW FLOW HANDLERS (SARAH - PRINCIPAL)
  // ==========================================
  const handleStartSpeaking = async () => {
    if (interviewState !== INTERVIEW_STATES.WAITING_FOR_STUDENT) return;

    try {
      if (!micStreamRef.current) {
        const stream = await getOptimalAudioStream();
        micStreamRef.current = stream;
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
      } else {
        micStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        setIsMicMuted(false);
      }
    } catch (err) {
      console.warn("Microphone access check notice:", err);
    }

    setCandidateDraft("");
    accumulatedTranscriptRef.current = "";
    currentSessionFinalRef.current = "";
    interimTranscriptRef.current = "";

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (_) {}
        }
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = speechLanguage || "en-IN";
        if ("maxAlternatives" in rec) {
          rec.maxAlternatives = 3;
        }

        rec.onresult = (event) => {
          let sessionFinal = "";
          let sessionInterim = "";
          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
              sessionFinal += res[0].transcript + " ";
            } else {
              sessionInterim += res[0].transcript;
            }
          }
          currentSessionFinalRef.current = sessionFinal;
          interimTranscriptRef.current = sessionInterim;

          const rawCombined = [
            accumulatedTranscriptRef.current,
            sessionFinal,
            sessionInterim
          ].filter(Boolean).join(" ").trim();

          const normalized = normalizeTranscript(rawCombined);
          if (normalized) {
            setCandidateDraft(normalized);
          }
        };

        rec.onerror = (e) => {
          console.warn("Speech recognition notice:", e.error);
        };

        rec.onend = () => {
          if (interviewStateRef.current === INTERVIEW_STATES.RECORDING) {
            accumulatedTranscriptRef.current = [
              accumulatedTranscriptRef.current,
              currentSessionFinalRef.current
            ].filter(Boolean).join(" ").trim();
            currentSessionFinalRef.current = "";
            interimTranscriptRef.current = "";
            try {
              rec.start();
            } catch (_) {}
          }
        };

        rec.start();
        recognitionRef.current = rec;
      } catch (recErr) {
        console.warn("Speech recognition start failed:", recErr);
      }
    }

    setInterviewState(INTERVIEW_STATES.RECORDING);
    setAiStatus("listening");
  };

  const handleStopRecording = () => {
    if (interviewState !== INTERVIEW_STATES.RECORDING) return;

    setInterviewState(INTERVIEW_STATES.TRANSCRIBING);
    setAiStatus("evaluating");

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }

    // Quick 200ms buffer flush for clean interim transcript finalization
    setTimeout(() => {
      const fullSpoken = [
        accumulatedTranscriptRef.current,
        currentSessionFinalRef.current,
        interimTranscriptRef.current
      ].filter(Boolean).join(" ").trim();

      const normalized = normalizeTranscript(fullSpoken || candidateDraft || typedAnswer || "");

      if (!normalized || normalized.length < 2) {
        showInfo("No response detected. Please try speaking again.");
        setInterviewState(INTERVIEW_STATES.WAITING_FOR_STUDENT);
        setAiStatus("listening");
        return;
      }

      dispatchStudentAnswer(normalized);
    }, 200);
  };

  // Repeat AI Interviewer Question Prompt
  const handleReplayQuestion = () => {
    if (!currentQuestion.text || interviewStateRef.current === INTERVIEW_STATES.AI_SPEAKING) return;
    speakAiUtterance(currentQuestion.text);
  };

  // Keyboard Ergonomics Shortcut Listener in LIVE Mode
  useEffect(() => {
    if (viewMode !== "LIVE") return;

    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (interviewStateRef.current === INTERVIEW_STATES.WAITING_FOR_STUDENT) {
          handleStartSpeaking();
        } else if (interviewStateRef.current === INTERVIEW_STATES.RECORDING) {
          handleStopRecording();
        }
      } else if (e.code === "KeyR") {
        e.preventDefault();
        handleReplayQuestion();
      } else if (e.code === "KeyT") {
        e.preventDefault();
        setIsTypingMode((prev) => !prev);
      } else if (e.code === "Escape") {
        e.preventDefault();
        setShowEndModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, currentQuestion.text]);

  const handleIncomingTurn = (turnData) => {
    if (turnData.previousTurn) {
      setTurnEvaluations((prev) => {
        const existingIdx = prev.findIndex((t) => t.questionIndex === turnData.previousTurn.questionIndex);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = turnData.previousTurn;
          return updated;
        }
        return [...prev, turnData.previousTurn];
      });
    }

    if (turnData.isFinished || turnData.event === "interview_ready_for_evaluation") {
      setInterviewState(INTERVIEW_STATES.INTERVIEW_COMPLETED);
      showInfo("All questions completed. Finalizing evaluation...");
      handleCompleteSession();
      return;
    }

    const nextQText = turnData.questionText || turnData.message;
    if (nextQText) {
      setCurrentQuestion({
        text: nextQText,
        index: turnData.questionIndex || (currentQuestion.index + 1),
        total: turnData.totalQuestions || currentQuestion.total,
        isFollowUp: Boolean(turnData.isFollowUp),
        trackPhase: turnData.trackPhase || (selectedTrack === "HR" ? "HR" : "TECHNICAL")
      });

      setConversation((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}_${Math.random()}`,
          sender: "ai",
          name: "Sarah – Principal (Principal AI Placement Interviewer)",
          text: nextQText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isFollowUp: Boolean(turnData.isFollowUp)
        }
      ]);

      speakAiUtterance(nextQText);
    }
  };

  const handleFallbackLocalTurn = (textToSend) => {
    const evalData = evaluateAnswerForQuestion({
      questionText: currentQuestion.text,
      answerText: textToSend,
      track: currentQuestion.trackPhase || selectedTrack,
      skills: selectedSkills
    });

    const completedTurn = {
      questionIndex: currentQuestion.index,
      questionText: currentQuestion.text,
      studentTranscript: textToSend,
      answerText: textToSend,
      feedback: evalData.feedback,
      aiFeedback: evalData.feedback,
      score: evalData.score,
      technicalAccuracy: evalData.technicalAccuracy,
      clarityScore: evalData.clarityScore,
      completenessScore: evalData.completenessScore,
      isSkipped: evalData.isSkipped,
      isFollowUp: Boolean(currentQuestion.isFollowUp),
      track: currentQuestion.trackPhase || selectedTrack
    };

    setTurnEvaluations((prev) => {
      const existingIdx = prev.findIndex((t) => t.questionIndex === completedTurn.questionIndex);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = completedTurn;
        return updated;
      }
      return [...prev, completedTurn];
    });

    setTimeout(() => {
      const nextIdx = currentQuestion.index + 1;
      let aiFollowUp = "";
      let isFollowUp = false;

      const pastQuestionTexts = pastSessions.flatMap((s) => (s.qaReview || s.questions || []).map((q) => q.questionText)).filter(Boolean);
      const sessionHistory = conversation.filter((m) => m.sender === "ai").map((m, idx) => ({
        questionId: `q_${idx + 1}`,
        questionText: m.text
      }));

      const isNextFollowUp = evalData.decision === "FOLLOW_UP" && !currentQuestion.isFollowUp;
      const picked = pickIntelligentNextQuestion({
        selectedSkills: selectedSkills,
        track: currentQuestion.trackPhase || selectedTrack,
        sessionQuestionHistory: sessionHistory,
        crossSessionHistory: pastQuestionTexts,
        isFollowUp: isNextFollowUp,
        previousQuestion: { questionText: currentQuestion.text }
      });

      aiFollowUp = picked.questionText;
      isFollowUp = picked.isFollowUp;

      handleIncomingTurn({
        questionText: aiFollowUp,
        questionIndex: nextIdx,
        isFollowUp,
        trackPhase: currentQuestion.trackPhase,
        previousTurn: completedTurn
      });
    }, 350);
  };

  const dispatchStudentAnswer = async (spokenText) => {
    if (!spokenText || !isSessionActive) return;

    setInterviewState(INTERVIEW_STATES.EVALUATING);
    setAiStatus("evaluating");

    const userMsg = {
      id: `user_${Date.now()}`,
      sender: "user",
      name: user?.name ? user.name.split(" ")[0] : "You",
      text: spokenText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setConversation((prev) => [...prev, userMsg]);
    setCandidateDraft("");
    setTypedAnswer("");

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "submit_answer",
          transcript: spokenText,
          audioChunks: []
        })
      );
    } else {
      try {
        const resp = await aiApi.submitAnswer(sessionId, spokenText);
        if (resp && resp.success && resp.turn) {
          handleIncomingTurn(resp.turn);
        } else {
          handleFallbackLocalTurn(spokenText);
        }
      } catch (err) {
        console.warn("REST turn evaluation fallback:", err);
        handleFallbackLocalTurn(spokenText);
      }
    }
  };

  const handleSubmitAnswer = () => {
    const textToSend = (candidateDraft || typedAnswer).trim();
    if (!textToSend || !isSessionActive) return;
    dispatchStudentAnswer(textToSend);
  };

  // ==========================================
  // CONCLUDE INTERVIEW & EVALUATE
  // ==========================================
  const handleAutoTimeExpire = () => {
    showInfo("Interview time completed! Generating your evaluation report...");
    handleEndInterviewConfirmed();
  };

  const handleEndInterviewConfirmed = async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    setShowEndModal(false);

    setIsSessionActive(false);
    setAiStatus("finalizing");

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
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setShowCamera(false);

    // Capture in-flight student answer from candidateDraft if they were speaking
    const inFlightAnswer = (candidateDraft || "").trim();
    let updatedConversation = conversation;
    if (inFlightAnswer && inFlightAnswer !== "[Listening...]" && inFlightAnswer.length > 0) {
      const pendingUserMsg = {
        sender: "user",
        text: inFlightAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      updatedConversation = [...conversation, pendingUserMsg];
      setConversation(updatedConversation);
      setCandidateDraft("");
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: "finish_interview",
          pendingTranscript: inFlightAnswer
        }));
      } catch (_) {}
    }

    let finishResponse = null;
    if (sessionId && !sessionId.endsWith("_local")) {
      try {
        finishResponse = await aiApi.finishSession(sessionId, { pendingTranscript: inFlightAnswer });
      } catch (e) {
        console.warn("Backend finish session notice:", e.message);
      }
    }

    // Scheduled duration is the final chargeable duration, not the actual time spent
    // Refresh subscription to reflect updated balance
    if (refreshSubscription) {
      try { await refreshSubscription(); } catch (_) {}
    }

    generateScorecard(selectedDuration, finishResponse, updatedConversation);
    setViewMode("RESULTS");
    setAiStatus("completed");
    isEndingRef.current = false;
  };

  const handleCompleteSession = (data) => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    setIsSessionActive(false);
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setShowCamera(false);
    generateScorecard(selectedDuration, { interview: data, summary: data?.summary || data });
    setViewMode("RESULTS");
    setAiStatus("completed");
    isEndingRef.current = false;
  };

  // ==========================================
  // SCORECARD GENERATION LOGIC (Guaranteed accurate, no fabricated scores)
  // ==========================================
  const generateScorecard = (durationMinutesUsed, backendResult = null, activeConversation = null) => {
    const activeChat = Array.isArray(activeConversation) && activeConversation.length > 0 ? activeConversation : conversation;
    const aiQuestions = activeChat.filter((m) => m.sender === "ai");
    const userAnswers = activeChat.filter(
      (m) => m.sender === "user" && m.text && m.text.trim().length > 0 && !m.text.startsWith("[")
    );
    const totalQuestionsAsked = Math.max(1, aiQuestions.length, currentQuestion.index);
    const validAnswersCount = userAnswers.length;

    // -------------------------------------------------------------
    // ZERO-ANSWER SAFEGUARD: If candidate answered 0 questions,
    // NEVER generate fabricated scores (no 50/100, no fake strengths)
    // -------------------------------------------------------------
    if (validAnswersCount === 0) {
      const incompleteReport = {
        sessionId: sessionId || `session_${Date.now()}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        track: selectedTrack,
        format: selectedFormat,
        durationMinutes: durationMinutesUsed,
        status: "INCOMPLETE",
        evaluationStatus: "NOT_ENOUGH_RESPONSES",
        overallScore: null,
        technicalScore: null,
        hrScore: null,
        communicationScore: null,
        problemSolvingScore: null,
        confidenceScore: null,
        questionsAsked: totalQuestionsAsked,
        questionsAnswered: 0,
        questionsUnanswered: totalQuestionsAsked,
        skills: selectedSkills,
        strengths: [],
        weaknesses: [],
        recommendations: [],
        feedbackSummary: "Your interview was completed without any recorded responses. We could not generate an accurate evaluation.",
        qaReview: activeChat.reduce((acc, msg, idx, arr) => {
          if (msg.sender === "ai") {
            const nextUserMsg = arr.slice(idx + 1).find((m) => m.sender === "user");
            acc.push({
              questionIndex: acc.length + 1,
              questionText: msg.text,
              isFollowUp: msg.isFollowUp,
              answerText: nextUserMsg ? nextUserMsg.text : "No answer provided",
              aiFeedback: "No audible response was recorded for this question.",
              score: 0,
              isSkipped: true
            });
          }
          return acc;
        }, [])
      };

      setScorecard(incompleteReport);
      setViewMode("RESULTS");
      setAiStatus("completed");
      loadPastHistory();
      return;
    }

    // -------------------------------------------------------------
    // PARTIALLY OR FULLY ANSWERED INTERVIEW:
    // Evaluate strictly based on valid answers provided
    // -------------------------------------------------------------
    const backendSummary = backendResult?.summary || backendResult?.interview?.summary;
    const backendQuestions = backendResult?.interview?.questions || backendSummary?.questionsFeedback;

    let finalReport;

    if (backendSummary && typeof backendSummary.overallScore === "number") {
      const rawQa = (Array.isArray(backendQuestions) && backendQuestions.length > 0)
        ? backendQuestions
        : activeChat.reduce((acc, msg, idx, arr) => {
            if (msg.sender === "ai") {
              const nextUserMsg = arr.slice(idx + 1).find((m) => m.sender === "user");
              const hasAnswer = nextUserMsg && nextUserMsg.text && nextUserMsg.text.trim().length > 0;
              const evalData = evaluateAnswerForQuestion({
                questionText: msg.text,
                answerText: hasAnswer ? nextUserMsg.text : "",
                track: selectedTrack,
                skills: selectedSkills
              });
              acc.push({
                questionIndex: acc.length + 1,
                questionText: msg.text,
                isFollowUp: msg.isFollowUp,
                answerText: hasAnswer ? nextUserMsg.text : "No answer provided",
                aiFeedback: evalData.feedback,
                score: evalData.score,
                isSkipped: evalData.isSkipped
              });
            }
            return acc;
          }, []);

      finalReport = {
        sessionId: sessionId || `session_${Date.now()}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        track: selectedTrack,
        format: selectedFormat,
        durationMinutes: durationMinutesUsed,
        status: "COMPLETED",
        evaluationStatus: "EVALUATED",
        overallScore: backendSummary.overallScore,
        technicalScore: selectedTrack === "HR" ? null : (backendSummary.technicalScore ?? backendSummary.overallScore),
        hrScore: selectedTrack === "TECHNICAL" ? null : (backendSummary.hrScore ?? backendSummary.overallScore),
        communicationScore: backendSummary.communicationScore || 82,
        problemSolvingScore: backendSummary.problemSolvingScore || backendSummary.overallScore,
        confidenceScore: backendSummary.adaptabilityScore || 80,
        questionsAsked: backendSummary.questionsAsked || rawQa.length,
        questionsAnswered: backendSummary.questionsAnswered || validAnswersCount,
        questionsUnanswered: backendSummary.questionsUnanswered || 0,
        skills: selectedSkills,
        strengths: backendSummary.strengths || [],
        weaknesses: backendSummary.weaknesses || [],
        recommendations: backendSummary.recommendations || [],
        feedbackSummary: backendSummary.feedbackText || "Interview completed and evaluated.",
        skillBreakdown: backendSummary.skillBreakdown || {},
        revisionTopics: backendSummary.revisionTopics || [],
        qaReview: rawQa.map((q, idx) => {
          const stored = turnEvaluations.find((t) => t.questionIndex === q.questionIndex || t.questionText === q.questionText);
          const ans = q.studentTranscript || q.answerText || stored?.studentTranscript || "No answer provided";
          const fallbackEval = evaluateAnswerForQuestion({
            questionText: q.questionText,
            answerText: ans,
            track: selectedTrack,
            skills: selectedSkills
          });
          return {
            questionIndex: q.questionIndex || (idx + 1),
            questionText: q.questionText,
            isFollowUp: Boolean(q.isFollowUp),
            answerText: ans,
            aiFeedback: q.feedback || q.aiFeedback || stored?.feedback || fallbackEval.feedback,
            whatWasCorrect: q.whatWasCorrect || stored?.whatWasCorrect || fallbackEval.whatWasCorrect,
            whatWasMissing: q.whatWasMissing || stored?.whatWasMissing || fallbackEval.whatWasMissing,
            suggestions: q.suggestions || stored?.suggestions || fallbackEval.suggestions,
            betterApproach: q.betterApproach || stored?.betterApproach || fallbackEval.betterApproach,
            score: typeof q.score === "number" ? q.score : (stored?.score ?? fallbackEval.score),
            isSkipped: (q.score !== undefined && q.score <= 25) || isSkipOrEvasion(ans)
          };
        })
      };
    } else {
      // Fallback: evaluate each question directly using client evaluator
      const questionsToEval = conversation.reduce((acc, msg, idx, arr) => {
        if (msg.sender === "ai") {
          const nextUserMsg = arr.slice(idx + 1).find((m) => m.sender === "user");
          const hasAnswer = nextUserMsg && nextUserMsg.text && nextUserMsg.text.trim().length > 0;
          const userText = hasAnswer ? nextUserMsg.text : "";

          // Check if turnEvaluations has stored evaluation from WS turn_complete
          const storedEval = turnEvaluations.find(t => t.questionText === msg.text || t.questionIndex === (acc.length + 1));

          acc.push({
            questionIndex: acc.length + 1,
            questionText: msg.text,
            isFollowUp: msg.isFollowUp,
            studentTranscript: userText,
            answerText: userText || "No answer provided",
            score: storedEval?.score,
            feedback: storedEval?.feedback || storedEval?.writtenFeedback,
            technicalAccuracy: storedEval?.technicalAccuracy,
            clarityScore: storedEval?.clarityScore,
            completenessScore: storedEval?.completenessScore
          });
        }
        return acc;
      }, []);

      const reportData = calculateOverallReport({
        questions: questionsToEval,
        track: selectedTrack,
        durationMinutes: durationMinutesUsed,
        studentName: user?.name || "Candidate"
      });

      finalReport = {
        sessionId: sessionId || `session_${Date.now()}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        track: selectedTrack,
        format: selectedFormat,
        durationMinutes: durationMinutesUsed,
        ...reportData,
        skills: selectedSkills
      };
    }

    setScorecard(finalReport);
    if (finalReport?.qaReview && Array.isArray(finalReport.qaReview)) {
      const initialExpanded = {};
      finalReport.qaReview.forEach((turn, i) => {
        if ((turn.score || 0) < 70 || turn.isFollowUp || turn.isSkipped) {
          initialExpanded[i] = true;
        }
      });
      setExpandedTurns(initialExpanded);
    }
    if (finalReport && typeof finalReport.overallScore === "number" && finalReport.overallScore > 0) {
      b2cApi.recordQuestionAttempt({
        type: "INTERVIEW",
        score: finalReport.overallScore,
        sessionId: finalReport.sessionId || sessionId
      }).then(() => {
        if (typeof refreshSubscription === "function") {
          try { refreshSubscription(); } catch (_) {}
        }
      }).catch((e) => console.warn("Interview XP recording warning:", e));
    }
    setViewMode("RESULTS");
    setAiStatus("completed");
    loadPastHistory();
  };

  // ==========================================
  // BUY MINUTES PACK (₹20 = 60m, ₹40 = 120m, ₹100 = 300m)
  // ==========================================
  const handleBuyMinutesPack = async (packToBuy = selectedMinutePack) => {
    try {
      setBuyingMinutes(true);
      const orderData = await b2cApi.createOrder({
        orderType: "MOCK_MINUTES",
        mockHoursCount: packToBuy.hours
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
        description: `${packToBuy.minutes} Mock Interview Minutes Pack (₹${packToBuy.price}, All-Inclusive)`,
        keyId: orderData.keyId || orderData.key_id,
        user: { name: user?.name, email: user?.email },
        onSuccess: async (paymentResponse) => {
          try {
            await b2cApi.verifyPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });
            showSuccess(`Payment successful! ${packToBuy.minutes} Mock Interview Minutes added to your balance.`);
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

  const filteredQaReview = useMemo(() => {
    if (!scorecard?.qaReview || !Array.isArray(scorecard.qaReview)) return [];
    if (turnFilter === "NEEDS_WORK") {
      return scorecard.qaReview
        .map((turn, originalIndex) => ({ ...turn, originalIndex }))
        .filter((turn) => (turn.score || 0) < 70 || turn.isSkipped);
    }
    if (turnFilter === "STRONG") {
      return scorecard.qaReview
        .map((turn, originalIndex) => ({ ...turn, originalIndex }))
        .filter((turn) => (turn.score || 0) >= 70 && !turn.isSkipped);
    }
    return scorecard.qaReview.map((turn, originalIndex) => ({ ...turn, originalIndex }));
  }, [scorecard?.qaReview, turnFilter]);

  const qaStats = useMemo(() => {
    const list = scorecard?.qaReview || [];
    const needsWork = list.filter((t) => (t.score || 0) < 70 || t.isSkipped).length;
    const strong = list.filter((t) => (t.score || 0) >= 70 && !t.isSkipped).length;
    return { total: list.length, needsWork, strong };
  }, [scorecard?.qaReview]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* ========================================================= */}
      {/* PAGE HEADER */}
      {/* ========================================================= */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-semibold tracking-wide uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-600/20" />
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
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs sm:text-sm text-slate-700">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>
                  Minutes Balance: <strong className="text-slate-900 font-bold">{totalMockMinutes} mins</strong>
                </span>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="ml-1 px-2.5 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
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
                    ? "bg-blue-600 text-white border-blue-600"
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
            {/* Prominent Zero Minutes / Insufficient Balance Card */}
            {totalMockMinutes === 0 ? (
              <div className="p-6 rounded-2xl bg-amber-50/90 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-amber-950">No Interview Minutes Remaining</h3>
                    <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                      You have used all your interview minutes. Please add more minutes to continue practising with Sarah.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shrink-0 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Minutes</span>
                </button>
              </div>
            ) : totalMockMinutes < selectedDuration ? (
              <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-950">Insufficient Interview Minutes</h4>
                    <p className="text-xs sm:text-sm text-blue-800 mt-0.5">
                      Available: <strong className="font-semibold">{totalMockMinutes} mins</strong>, Required: <strong className="font-semibold">{selectedDuration} mins</strong>. Please select a shorter duration or add more minutes.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Minutes</span>
                </button>
              </div>
            ) : null}

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
              {/* ----------------------------------------------------- */}
              {/* A. INTERVIEW FORMAT */}
              {/* ----------------------------------------------------- */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                  <Layers className="w-5 h-5 text-blue-600" />
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
                            ? "border-blue-600 bg-blue-50/40 shadow-xs"
                            : "border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                  isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                <IconComp className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-slate-900 text-base">{fmt.title}</h3>
                            </div>
                            {fmt.isRecommended && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                                <Sparkles className="w-3 h-3 fill-current" /> Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 pl-11">
                            {fmt.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs font-semibold">
                          <span className={isSelected ? "text-blue-700" : "text-slate-400"}>
                            {isSelected ? "Selected Format" : "Click to select"}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
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
                    <Briefcase className="w-5 h-5 text-blue-600" />
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
                        onClick={() => handleSelectTrack(trk.id)}
                        className={`rounded-xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/40 shadow-xs"
                            : "border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isSelected ? "bg-blue-600 text-white" : "bg-blue-100/60 text-blue-700"
                              }`}
                            >
                              <IconComp className="w-5 h-5" />
                            </div>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                isSelected ? "bg-blue-200/80 text-blue-900" : "bg-slate-100 text-slate-600"
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
                                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs font-semibold">
                          <span className={isSelected ? "text-blue-700" : "text-slate-400"}>
                            {isSelected ? "Active Track" : "Select track"}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
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
              {/* C. TECHNICAL SKILLS IN FOCUS (REDESIGNED COMPACT) */}
              {/* ----------------------------------------------------- */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                      <Cpu className="w-5 h-5 text-blue-600" />
                      <span>Technical Skills in Focus</span>
                      {selectedTrack !== "HR" && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                          {selectedSkills.length} Selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Select the skills and technologies you want the AI interviewer to evaluate.
                    </p>
                  </div>

                  {selectedTrack !== "HR" && selectedSkills.length > 0 && (
                    <button
                      onClick={handleClearAllSkills}
                      className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 self-start sm:self-auto cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear all selections</span>
                    </button>
                  )}
                </div>

                {/* HR & Culture Behavioral Competencies or Technical Skill Search */}
                {selectedTrack === "HR" ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                      <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-950">Behavioral Competency Framework (STAR Method)</p>
                        <p className="text-blue-700 mt-0.5">
                          Select the behavioral competencies and communication aspects you want the AI interviewer to assess during this round.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>Select Focus Competencies ({selectedSkills.length} selected):</span>
                        {selectedSkills.length > 0 && (
                          <button
                            onClick={handleClearAllSkills}
                            className="text-slate-500 hover:text-red-600 cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Clear selections</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {CURATED_HR_COMPETENCIES.map((comp) => {
                          const isSelected = selectedSkills.includes(comp);
                          return (
                            <button
                              key={comp}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  removeSkill(comp);
                                } else {
                                  setSelectedSkills((prev) => [...prev, comp]);
                                }
                              }}
                              className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? "bg-blue-50/80 border-blue-600 text-blue-950 font-semibold shadow-xs"
                                  : "bg-white border-slate-200 hover:border-blue-300 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span>{comp}</span>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Quick Popular Skills Pills */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Quick Add Popular Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_TECHNICAL_SKILLS.map((sk) => {
                          const isSelected = selectedSkills.includes(sk);
                          return (
                            <button
                              key={sk}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  removeSkill(sk);
                                } else {
                                  setSelectedSkills((prev) => [...prev, sk]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? "bg-blue-100 text-blue-800 border-blue-300 font-semibold"
                                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3 text-blue-700" /> : <Plus className="w-3 h-3 text-slate-400" />}
                              <span>{sk}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filter Toolbar: Category Dropdown & Interactive Search Input */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                        <select
                          value={activeSkillCategory}
                          onChange={(e) => setActiveSkillCategory(e.target.value)}
                          className="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white border-slate-300 text-slate-700"
                        >
                          <option value="All Categories">All Categories ({Object.keys(CURATED_SKILL_CATEGORIES).length})</option>
                          {Object.keys(CURATED_SKILL_CATEGORIES).map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 relative" ref={searchContainerRef}>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Skill Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={skillSearchQuery}
                            onFocus={() => setShowSkillDropdown(true)}
                            onChange={(e) => {
                              setSkillSearchQuery(e.target.value);
                              setShowSkillDropdown(true);
                            }}
                            placeholder="Search skills (e.g. Python, React.js, SQL, Arrays, Docker)..."
                            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                          {skillSearchQuery && (
                            <button
                              onClick={() => {
                                setSkillSearchQuery("");
                                setShowSkillDropdown(false);
                              }}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Dynamic Search Dropdown (Only appears on click/search) */}
                        {showSkillDropdown && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                            {matchingSkills.map((item) => {
                              const isAlreadySelected = selectedSkills.includes(item.name);
                              return (
                                <button
                                  key={item.name}
                                  type="button"
                                  onClick={() => handleSelectSkillFromDropdown(item.name)}
                                  className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm hover:bg-blue-50/70 flex items-center justify-between cursor-pointer transition-colors group"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${isAlreadySelected ? "text-blue-700 font-bold" : "text-slate-800"}`}>
                                      {item.name}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-normal">
                                      ({item.category})
                                    </span>
                                  </div>
                                  {isAlreadySelected ? (
                                    <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1 bg-blue-100 px-2 py-0.5 rounded-full">
                                      <Check className="w-3 h-3 stroke-[3]" /> Selected
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                      + Add
                                    </span>
                                  )}
                                </button>
                              );
                            })}

                            {matchingSkills.length === 0 && (
                              <div className="p-4 text-center space-y-2">
                                <p className="text-xs text-slate-500">
                                  No matching skills found for "{skillSearchQuery}".
                                </p>
                                {skillSearchQuery.trim() && (
                                  <button
                                    type="button"
                                    onClick={() => handleAddCustomSkill(skillSearchQuery)}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add "{skillSearchQuery.trim()}" as custom skill</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Skills Chips Display (Blue chips with remove icon) */}
                    <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200/60 space-y-2">
                      <div className="text-xs font-semibold text-blue-900 flex items-center justify-between">
                        <span>Currently Selected for Interview ({selectedSkills.length})</span>
                        {selectedSkills.length > 0 && (
                          <span className="text-[11px] text-blue-700 font-normal">Click × to remove</span>
                        )}
                      </div>

                      {selectedSkills.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-1">
                          No skills selected. Use the quick pills or search above to choose technologies.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-xs animate-in zoom-in-95 duration-100"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="p-0.5 rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                                title={`Remove ${skill}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* ----------------------------------------------------- */}
              {/* D. INTERVIEW DURATION */}
              {/* ----------------------------------------------------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
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
                            ? "border-blue-600 bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
                            : "border-slate-200 bg-white hover:border-blue-300 text-slate-700 hover:bg-slate-50 font-semibold"
                        }`}
                      >
                        <span className="text-base sm:text-lg">{mins} Minutes</span>
                        <span
                          className={`text-[11px] font-normal mt-0.5 ${
                            isSelected ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {mins === 10
                            ? "Fast Warm-Up • ~3-4 Qs"
                            : mins === 15
                            ? "Standard Round • ~5-6 Qs"
                            : mins === 20
                            ? "Full Placement • ~7-9 Qs"
                            : "In-Depth Senior • ~10-12 Qs"}
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
                  disabled={totalMockMinutes === 0 || totalMockMinutes < selectedDuration || startingInterview || selectedSkills.length === 0}
                  onClick={handleStartInterview}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-base sm:text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                    totalMockMinutes === 0 || totalMockMinutes < selectedDuration || startingInterview || selectedSkills.length === 0
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 cursor-pointer hover:scale-[1.005] active:scale-[0.995]"
                  }`}
                >
                  {startingInterview ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Initializing Interview with Sarah...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>Start Mock Interview</span>
                    </>
                  )}
                </button>

                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-blue-600" /> Speech-to-Speech Ready
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Automatic AI Evaluation
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Powered by Gemini AI
                  </span>
                </div>
              </div>
            </div>

            {/* Sticky Pre-Flight Summary Bar */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>
                      {selectedTrack === "COMBINED"
                        ? "Combined Placement Round"
                        : selectedTrack === "HR"
                        ? "HR & Culture Round"
                        : "Technical Round"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-blue-600 font-extrabold">{selectedDuration} Mins</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                    {selectedSkills.length > 0
                      ? `${selectedSkills.length} selected: ${selectedSkills.slice(0, 4).join(", ")}${
                          selectedSkills.length > 4 ? ` +${selectedSkills.length - 4} more` : ""
                        }`
                      : "Please select focus skills/competencies"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  totalMockMinutes === 0 ||
                  totalMockMinutes < selectedDuration ||
                  startingInterview ||
                  selectedSkills.length === 0
                }
                onClick={handleStartInterview}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  totalMockMinutes === 0 ||
                  totalMockMinutes < selectedDuration ||
                  startingInterview ||
                  selectedSkills.length === 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 hover:scale-[1.01] active:scale-[0.99]"
                }`}
              >
                {startingInterview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initializing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Interview ({selectedDuration}m)</span>
                  </>
                )}
              </button>
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
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">Sarah</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">Principal</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                      {selectedTrack} Round
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Format: {selectedFormat === "TIME_BASED" ? "Timed Interview" : "Voice Test"}</span>
                    {selectedSkills.length > 0 && selectedTrack !== "HR" && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-xs">{selectedSkills.slice(0, 3).join(", ")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Countdown Timer */}
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Live Remaining Balance Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/90 border border-blue-200 text-xs font-semibold text-slate-700 shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Balance: <strong className="text-slate-900 font-bold">{totalMockMinutes}m</strong></span>
                </div>

                {/* Live Countdown Timer */}
                <div
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm sm:text-base font-bold shadow-xs transition-colors ${
                    timeRemainingSeconds <= 120
                      ? "bg-rose-50 text-rose-700 border border-rose-300 animate-pulse font-mono"
                      : timeRemainingSeconds <= 300
                      ? "bg-amber-50 text-amber-800 border border-amber-300 font-mono"
                      : "bg-slate-100 text-slate-800 border border-slate-200 font-mono"
                  }`}
                >
                  <Clock
                    className={`w-4 h-4 ${
                      timeRemainingSeconds <= 120
                        ? "text-rose-600"
                        : timeRemainingSeconds <= 300
                        ? "text-amber-600"
                        : "text-blue-600"
                    }`}
                  />
                  <span>{formatTime(timeRemainingSeconds)}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal uppercase">remaining</span>
                </div>

                {/* AI Interviewer Live Status Pill */}
                <div
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border ${
                    interviewState === INTERVIEW_STATES.AI_SPEAKING
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : interviewState === INTERVIEW_STATES.WAITING_FOR_STUDENT
                      ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                      : interviewState === INTERVIEW_STATES.RECORDING
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : interviewState === INTERVIEW_STATES.EVALUATING || interviewState === INTERVIEW_STATES.TRANSCRIBING
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      interviewState === INTERVIEW_STATES.AI_SPEAKING
                        ? "bg-blue-600 animate-ping"
                        : interviewState === INTERVIEW_STATES.WAITING_FOR_STUDENT
                        ? "bg-indigo-600 animate-pulse"
                        : interviewState === INTERVIEW_STATES.RECORDING
                        ? "bg-rose-600 animate-ping"
                        : interviewState === INTERVIEW_STATES.EVALUATING || interviewState === INTERVIEW_STATES.TRANSCRIBING
                        ? "bg-amber-600 animate-spin"
                        : "bg-slate-400"
                    }`}
                  />
                  <span>
                    {interviewState === INTERVIEW_STATES.AI_SPEAKING
                      ? "Interviewer Speaking"
                      : interviewState === INTERVIEW_STATES.WAITING_FOR_STUDENT
                      ? "Your Turn to Answer"
                      : interviewState === INTERVIEW_STATES.RECORDING
                      ? "Listening to You"
                      : interviewState === INTERVIEW_STATES.EVALUATING || interviewState === INTERVIEW_STATES.TRANSCRIBING
                      ? "Analyzing Response..."
                      : "Ready"}
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

                  {/* Camera Self-Preview Toggle Button */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        showCamera
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      }`}
                      title={showCamera ? "Hide self camera preview" : "Enable camera preview to monitor posture and eye contact"}
                    >
                      {showCamera ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                      <span>{showCamera ? "Hide Camera" : "Self Camera"}</span>
                    </button>
                  </div>

                  {/* Interview Avatars Stage */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
                    {/* Sarah Interviewer Avatar */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div
                          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                            interviewState === INTERVIEW_STATES.AI_SPEAKING
                              ? "bg-gradient-to-tr from-blue-600 to-indigo-600 ring-8 ring-blue-100 text-white scale-105"
                              : interviewState === INTERVIEW_STATES.RECORDING
                              ? "bg-rose-900 ring-8 ring-rose-100 text-white"
                              : interviewState === INTERVIEW_STATES.WAITING_FOR_STUDENT
                              ? "bg-blue-900 ring-8 ring-blue-100 text-white"
                              : "bg-slate-800 text-white"
                          }`}
                        >
                          <Bot className="w-12 h-12" />
                        </div>

                        {aiStatus === "speaking" && (
                          <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-40 pointer-events-none" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700 mt-2">Sarah – Principal</span>
                    </div>

                    {/* Local Candidate Camera Mirror Preview */}
                    {showCamera && (
                      <div className="flex flex-col items-center animate-in zoom-in-95 duration-150">
                        <div className="w-28 h-28 sm:w-32 sm:h-28 rounded-2xl overflow-hidden border-2 border-blue-400 shadow-md bg-slate-900 relative">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                          <div className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-medium">
                            You
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-500 mt-1">Camera Preview (Local)</span>
                      </div>
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
                              ? "bg-blue-600"
                              : aiStatus === "listening"
                              ? "bg-emerald-500"
                              : "bg-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {interviewState === INTERVIEW_STATES.AI_SPEAKING
                        ? "Sarah is speaking the question aloud. Listening is active."
                        : interviewState === INTERVIEW_STATES.WAITING_FOR_STUDENT
                        ? "Sarah has finished speaking. Click \"Start Speaking\" (or press Space) when ready."
                        : interviewState === INTERVIEW_STATES.RECORDING
                        ? "Listening... Speak your answer. Click \"Done Speaking\" (or press Space) when finished."
                        : "Evaluating response with Gemini AI..."}
                    </p>
                  </div>

                  {/* Current Question Statement Box */}
                  <div className="w-full text-left p-5 rounded-xl bg-blue-50/50 border border-blue-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1.5">
                      <span className="uppercase tracking-wider">
                        {currentQuestion.isFollowUp ? "Follow-Up Question" : `Interview Question #${currentQuestion.index}`}
                      </span>
                      <button
                        type="button"
                        onClick={handleReplayQuestion}
                        disabled={interviewState === INTERVIEW_STATES.AI_SPEAKING}
                        className="text-xs text-blue-700 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Replay Sarah's spoken question (Press R)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Repeat Audio (R)</span>
                      </button>
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
                          interviewState === INTERVIEW_STATES.RECORDING
                            ? "bg-rose-500 animate-ping"
                            : interviewState === INTERVIEW_STATES.WAITING_FOR_STUDENT
                            ? "bg-blue-600 animate-pulse"
                            : interviewState === INTERVIEW_STATES.AI_SPEAKING
                            ? "bg-blue-400"
                            : interviewState === INTERVIEW_STATES.EVALUATING
                            ? "bg-amber-500 animate-spin"
                            : "bg-slate-400"
                        }`}
                      />
                      <span className="text-sm font-bold text-slate-900">
                        {interviewState === INTERVIEW_STATES.RECORDING
                          ? "Listening... Speak your answer."
                          : interviewState === INTERVIEW_STATES.WAITING_FOR_STUDENT
                          ? "Your turn to answer"
                          : interviewState === INTERVIEW_STATES.AI_SPEAKING
                          ? "Interviewer is speaking..."
                          : interviewState === INTERVIEW_STATES.EVALUATING || interviewState === INTERVIEW_STATES.TRANSCRIBING
                          ? "Evaluating your response..."
                          : "Interview ready"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSpeechLanguage((prev) => (prev === "en-IN" ? "en-US" : "en-IN"))}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer flex items-center gap-1"
                        title="Toggle speech recognition accent"
                      >
                        <span>Accent:</span>
                        <span className="font-bold">{speechLanguage === "en-IN" ? "Indian English (en-IN)" : "US English (en-US)"}</span>
                      </button>

                      <button
                        onClick={() => setIsTypingMode(!isTypingMode)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                      >
                        {isTypingMode ? "Hide Text Input" : "Type Response Instead"}
                      </button>
                    </div>
                  </div>

                  {/* Realtime Candidate Speech Transcript Banner */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 min-h-[90px] text-sm text-slate-800 flex items-start gap-2.5">
                    <UserIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      {candidateDraft.trim() ? (
                        <p className="font-medium text-slate-900 leading-relaxed">{candidateDraft}</p>
                      ) : (
                        <p className="text-slate-400 italic">
                          {interviewState === INTERVIEW_STATES.RECORDING
                            ? "Listening... Speak your answer. Your speech appears here in real time."
                            : interviewState === INTERVIEW_STATES.WAITING_FOR_STUDENT
                            ? "Click \"Start Speaking\" to begin your answer."
                            : interviewState === INTERVIEW_STATES.AI_SPEAKING
                            ? "Sarah is speaking. Please listen carefully..."
                            : "Your live speech will appear here automatically as you talk..."}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Typing input alternative */}
                  {isTypingMode && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">Type Your Answer</label>
                        <button
                          onClick={() => {
                            if (!typedAnswer.trim()) {
                              showInfo("Please enter your answer text.");
                              return;
                            }
                            dispatchStudentAnswer(typedAnswer.trim());
                          }}
                          disabled={interviewState === INTERVIEW_STATES.AI_SPEAKING || interviewState === INTERVIEW_STATES.EVALUATING || !typedAnswer.trim()}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Typed Response</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        placeholder="Type your response here if speech recognition is noisy or unavailable..."
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* UNIFIED HERO VOICE ACTION BAR */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                      {interviewState === INTERVIEW_STATES.RECORDING ? (
                        <button
                          onClick={handleStopRecording}
                          className="px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-md bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 cursor-pointer ring-4 ring-rose-100 animate-pulse active:scale-98"
                        >
                          <Square className="w-4 h-4 fill-current" />
                          <span>Done Speaking • Submit Answer</span>
                          <span className="text-xs font-normal opacity-80 border-l border-rose-400 pl-2 ml-1 hidden sm:inline">Space</span>
                        </button>
                      ) : interviewState === INTERVIEW_STATES.WAITING_FOR_STUDENT ? (
                        <button
                          onClick={handleStartSpeaking}
                          className="px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-md bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 cursor-pointer ring-4 ring-blue-100 active:scale-98"
                        >
                          <Mic className="w-5 h-5 animate-bounce" />
                          <span>Start Speaking</span>
                          <span className="text-xs font-normal opacity-80 border-l border-blue-400 pl-2 ml-1 hidden sm:inline">Space</span>
                        </button>
                      ) : interviewState === INTERVIEW_STATES.AI_SPEAKING ? (
                        <button
                          disabled
                          className="px-6 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2.5 bg-blue-50 text-blue-700 border border-blue-200 cursor-not-allowed opacity-80"
                        >
                          <Volume2 className="w-5 h-5 text-blue-600 animate-pulse" />
                          <span>Interviewer is Speaking...</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-6 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2.5 bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed"
                        >
                          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                          <span>Evaluating Response...</span>
                        </button>
                      )}

                      {/* Repeat Audio Button */}
                      <button
                        type="button"
                        onClick={handleReplayQuestion}
                        disabled={interviewState === INTERVIEW_STATES.AI_SPEAKING}
                        className="px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Repeat question audio (Press R)"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Repeat Question</span>
                      </button>
                    </div>

                    {/* Audio mute toggles */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!isSpeakerMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
                            window.speechSynthesis.cancel();
                          }
                          setIsSpeakerMuted(!isSpeakerMuted);
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                          isSpeakerMuted
                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
                        <span>{isSpeakerMuted ? "Unmute AI Voice" : "Mute AI Voice"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Conversation Transcript Drawer */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col h-[650px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
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
                            isAi ? "bg-blue-600" : "bg-slate-900"
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
                                ? "bg-blue-50/70 border border-blue-100 text-slate-800 rounded-tl-xs"
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
                {selectedTrack !== "HR" && selectedSkills.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Target Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSkills.map((sk) => (
                        <span key={sk} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW: EVALUATION REPORT & RESULTS */}
        {/* ========================================================= */}
        {viewMode === "RESULTS" && scorecard && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* ZERO-ANSWER / INCOMPLETE INTERVIEW SCREEN */}
            {scorecard.evaluationStatus === "NOT_ENOUGH_RESPONSES" || scorecard.overallScore === null ? (
              <div className="bg-white rounded-2xl border border-amber-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-amber-100">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Interview Incomplete</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      Interview Incomplete
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      Your interview was completed without any recorded responses. We could not generate an accurate evaluation.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-100 px-4 py-3 rounded-2xl border border-slate-200 self-start md:self-auto">
                    <div className="text-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Score</span>
                      <div className="text-2xl font-black text-slate-400">N/A</div>
                    </div>
                  </div>
                </div>

                {/* Required Stats Grid: Questions Asked, Questions Answered (0), Questions Unanswered, Evaluation Status, Overall Score */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-xs font-semibold text-slate-500">Questions Asked</span>
                    <div className="text-xl font-black text-slate-800 mt-1">{scorecard.questionsAsked || 1}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 text-center">
                    <span className="text-xs font-semibold text-red-600">Questions Answered</span>
                    <div className="text-xl font-black text-red-700 mt-1">0</div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
                    <span className="text-xs font-semibold text-amber-700">Questions Unanswered</span>
                    <div className="text-xl font-black text-amber-800 mt-1">
                      {scorecard.questionsUnanswered || scorecard.questionsAsked || 1}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-center col-span-2 sm:col-span-1">
                    <span className="text-xs font-semibold text-blue-700">Evaluation Status</span>
                    <div className="text-sm font-bold text-blue-900 mt-1.5">Not enough responses</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center col-span-2 sm:col-span-1">
                    <span className="text-xs font-semibold text-slate-500">Overall Score</span>
                    <div className="text-xl font-black text-slate-400 mt-1">N/A</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Why didn't I receive an evaluation score?</p>
                    <p className="text-amber-800 mt-0.5">
                      To provide genuine placement feedback, the AI evaluator requires at least one recorded spoken or typed response.
                      Ensure your microphone is enabled or use the text answer box during the session.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <button
                    onClick={() => setViewMode("SETUP")}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Another Interview</span>
                  </button>

                  <button
                    onClick={() => setViewMode("HISTORY")}
                    className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <History className="w-4 h-4" />
                    <span>View Past History</span>
                  </button>
                </div>
              </div>
            ) : (
              /* REGULAR SCORECARD FOR EVALUATED SESSIONS */
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
                    {scorecard.questionsAnswered !== undefined && (
                      <p className="text-xs text-blue-700 font-semibold mt-1">
                        Evaluation based on {scorecard.questionsAnswered} answered question(s) out of {scorecard.questionsAsked}.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Overall Score Badge Circle */}
                    <div className="flex items-center gap-4 bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80">
                      <div className="relative flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center shadow-md shadow-blue-600/30">
                          <span className="text-2xl font-black">{scorecard.overallScore}</span>
                          <span className="text-[10px] uppercase font-semibold text-blue-200">out of 100</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Overall Rating</span>
                        <h3 className="text-lg font-black text-slate-900">
                          {scorecard.overallScore >= 85
                            ? "Placement Ready"
                            : scorecard.overallScore >= 75
                            ? "Strong Candidate"
                            : scorecard.overallScore >= 60
                            ? "Developing Candidate"
                            : "Ready with Revisions"}
                        </h3>
                        <p className="text-xs text-slate-500">Calculated directly from your question turn evaluations</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs shrink-0"
                      title="Print or Save Scorecard as PDF"
                    >
                      <Printer className="w-4 h-4 text-blue-600" />
                      <span>Print Scorecard</span>
                    </button>
                  </div>
                </div>

                {/* Metric Breakdown Grid (Relevant metrics only) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6">
                  {scorecard.technicalScore !== null && selectedTrack !== "HR" && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-xs font-semibold text-slate-500">Technical Depth</span>
                      <div className="text-xl font-black text-blue-600 mt-1">{scorecard.technicalScore}%</div>
                    </div>
                  )}
                  {scorecard.hrScore !== null && selectedTrack !== "TECHNICAL" && (
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
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
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

                {/* Recommended Topics to Revise (Actionable Practice Loop) */}
                {scorecard.recommendations && scorecard.recommendations.length > 0 && (
                  <div className="mt-6 p-5 rounded-xl bg-blue-50/40 border border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                      <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>Recommended Topics to Revise Before Placement Drives</span>
                      </h4>
                      <span className="text-xs text-blue-700 font-medium">Click any topic to practice directly</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {scorecard.recommendations.map((rec, i) => {
                        const isCoding = /array|string|tree|graph|dp|dynamic|algorithm|pointer|stack|queue|sort|search|recursion|linked|matrix|sliding|greedy/i.test(
                          rec
                        );
                        return (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-white border border-blue-200/90 shadow-xs flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <BookOpen className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-semibold text-slate-800">{rec}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isCoding ? (
                                <Link
                                  to="/coding"
                                  state={{ topic: rec }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                                >
                                  <Code2 className="w-3 h-3" />
                                  <span>Coding Arena</span>
                                </Link>
                              ) : (
                                <Link
                                  to="/practice"
                                  state={{ query: rec }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Practice Hub</span>
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Skill-by-Skill Performance Breakdown */}
                {scorecard.skillBreakdown && Object.keys(scorecard.skillBreakdown).length > 0 && (
                  <div className="mt-6 p-5 rounded-xl bg-white border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-3">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Skill-by-Skill Placement Breakdown</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {Object.entries(scorecard.skillBreakdown).map(([skillName, data]) => (
                        <div key={skillName} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-xs font-semibold text-slate-600 truncate block">{skillName}</span>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-lg font-black text-slate-900">{data.average || data.score || 0}</span>
                            <span className="text-[10px] text-slate-400 font-medium">/100</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                            {data.count || 1} question(s)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question-by-Question Detailed Review with Filtering & Accordions */}
                {scorecard.qaReview && scorecard.qaReview.length > 0 && (
                  <div className="mt-8 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>Detailed Turn-by-Turn Response Review</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Review AI analysis and recommended improvements for each interview question.
                        </p>
                      </div>

                      {/* Filter Tabs & Expand/Collapse All */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => setTurnFilter("ALL")}
                            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                              turnFilter === "ALL"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            All ({qaStats.total})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTurnFilter("NEEDS_WORK")}
                            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                              turnFilter === "NEEDS_WORK"
                                ? "bg-white text-amber-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Needs Work ({qaStats.needsWork})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTurnFilter("STRONG")}
                            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                              turnFilter === "STRONG"
                                ? "bg-white text-emerald-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Strong ({qaStats.strong})
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const anyOpen = Object.values(expandedTurns).some(Boolean);
                            handleExpandAllTurns(!anyOpen);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          {Object.values(expandedTurns).some(Boolean) ? "Collapse All" : "Expand All"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {filteredQaReview.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                          No turns match the selected filter.
                        </div>
                      ) : (
                        filteredQaReview.map((turn) => {
                          const originalIdx = turn.originalIndex;
                          const isExpanded = expandedTurns[originalIdx] !== false; // Default expanded unless collapsed
                          return (
                            <div
                              key={originalIdx}
                              className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all"
                            >
                              {/* Accordion Header */}
                              <button
                                type="button"
                                onClick={() => toggleTurnAccordion(originalIdx)}
                                className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-50/60 transition-colors cursor-pointer"
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-blue-900">
                                      {turn.isFollowUp
                                        ? `Turn ${originalIdx + 1} (Follow-Up Probe)`
                                        : `Turn ${originalIdx + 1} (Core Question)`}
                                    </span>
                                    {typeof turn.score === "number" && (
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                          turn.score >= 85
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : turn.score >= 70
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : turn.score >= 50
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}
                                      >
                                        {turn.score >= 85
                                          ? "Excellent"
                                          : turn.score >= 70
                                          ? "Strong"
                                          : turn.score >= 50
                                          ? "Needs Depth"
                                          : "Needs Revision"} • {turn.score}/100
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm font-bold text-slate-900 leading-snug">
                                    Q: "{turn.questionText}"
                                  </p>
                                </div>

                                <div className="shrink-0 text-slate-400 mt-1">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </div>
                              </button>

                              {/* Accordion Content */}
                              {isExpanded && (
                                <div className="p-4 pt-0 space-y-3 border-t border-slate-100 mt-1 animate-in fade-in duration-150">
                                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                                    <strong className="text-slate-900">Your Response: </strong>
                                    {turn.answerText}
                                  </div>

                                  <div
                                    className={`p-3 rounded-lg border text-xs ${
                                      turn.score < 50 || turn.isSkipped
                                        ? "bg-rose-50/40 border-rose-200 text-rose-950"
                                        : turn.score >= 85
                                        ? "bg-emerald-50/40 border-emerald-200 text-emerald-950"
                                        : "bg-blue-50/50 border-blue-100 text-blue-900"
                                    }`}
                                  >
                                    <strong
                                      className={
                                        turn.score < 50 || turn.isSkipped
                                          ? "text-rose-900"
                                          : turn.score >= 85
                                          ? "text-emerald-900"
                                          : "text-blue-950"
                                      }
                                    >
                                      AI Evaluator Feedback:{" "}
                                    </strong>
                                    {turn.aiFeedback}
                                  </div>

                                  {/* Structured Turn Evaluation Cards */}
                                  {(turn.whatWasCorrect ||
                                    turn.whatWasMissing ||
                                    turn.suggestions ||
                                    turn.betterApproach) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                      {turn.whatWasCorrect && (
                                        <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950">
                                          <strong className="text-emerald-900 block font-bold mb-0.5">
                                            What was good:
                                          </strong>
                                          {turn.whatWasCorrect}
                                        </div>
                                      )}
                                      {turn.whatWasMissing && (
                                        <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-950">
                                          <strong className="text-amber-900 block font-bold mb-0.5">
                                            What was missing:
                                          </strong>
                                          {turn.whatWasMissing}
                                        </div>
                                      )}
                                      {turn.suggestions && (
                                        <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-950">
                                          <strong className="text-blue-900 block font-bold mb-0.5">
                                            Suggested improvement:
                                          </strong>
                                          {turn.suggestions}
                                        </div>
                                      )}
                                      {turn.betterApproach && (
                                        <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-950">
                                          <strong className="text-indigo-900 block font-bold mb-0.5">
                                            Recommended approach:
                                          </strong>
                                          {turn.betterApproach}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Action Buttons */}
                <div className="pt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <button
                    onClick={() => setViewMode("SETUP")}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-colors"
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
            )}
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Interview</span>
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400">Loading interview records...</div>
              ) : pastSessions.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900">No Mock Interviews Completed Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Configure your first placement interview above to test your skills with our Gemini voice interviewer.
                  </p>
                  <button
                    onClick={() => setViewMode("SETUP")}
                    className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Start Your First Interview
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastSessions.map((sessionItem, i) => {
                    const isIncomplete = sessionItem.status === "INCOMPLETE" || sessionItem.summary?.overallScore === null;
                    const score = isIncomplete ? "N/A" : (sessionItem.summary?.overallScore || sessionItem.overallScore || 75);
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
                        className="p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {sessionItem.interviewType || sessionItem.roleTitle || "Mock Interview"}
                            </span>
                            <span className="text-xs text-slate-400">{dateFormatted}</span>
                          </div>

                          <div className="flex items-center gap-3 mt-3">
                            <div className={`w-12 h-12 rounded-xl font-extrabold text-base flex items-center justify-center border ${
                              isIncomplete
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200/60"
                            }`}>
                              {score}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">
                                {isIncomplete
                                  ? "Interview Incomplete"
                                  : score >= 85
                                  ? "Placement Ready"
                                  : score >= 75
                                  ? "Strong Performance"
                                  : "Needs Practice"}
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
                              overallScore: isIncomplete ? null : (sessionItem.summary?.overallScore || 75),
                              evaluationStatus: isIncomplete ? "NOT_ENOUGH_RESPONSES" : "EVALUATED",
                              technicalScore: isIncomplete ? null : (sessionItem.summary?.technicalScore || 80),
                              hrScore: isIncomplete ? null : (sessionItem.summary?.hrScore || 80),
                              communicationScore: isIncomplete ? null : (sessionItem.summary?.communicationScore || 82),
                              problemSolvingScore: isIncomplete ? null : (sessionItem.summary?.problemSolvingScore || 85),
                              confidenceScore: isIncomplete ? null : (sessionItem.summary?.adaptabilityScore || 80),
                              questionsAsked: sessionItem.summary?.questionsAsked || sessionItem.questions?.length || 1,
                              questionsAnswered: sessionItem.summary?.questionsAnswered || 0,
                              questionsUnanswered: sessionItem.summary?.questionsUnanswered || 1,
                              strengths: sessionItem.summary?.strengths || [],
                              weaknesses: sessionItem.summary?.weaknesses || [],
                              recommendations: sessionItem.summary?.recommendations || [],
                              feedbackSummary: sessionItem.summary?.feedbackText || (isIncomplete ? "Interview concluded without recorded answers." : "Solid overall performance."),
                              qaReview: (sessionItem.questions || []).map((q) => ({
                                questionText: q.questionText,
                                isFollowUp: q.isFollowUp,
                                answerText: q.studentTranscript || "[No answer provided]",
                                aiFeedback: q.feedback || "Evaluated response.",
                                score: typeof q.score === "number" ? q.score : 70
                              }))
                            });
                            setViewMode("RESULTS");
                          }}
                          className="w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer text-center"
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
        title="End Interview?"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to end this interview? Your scheduled interview minutes will remain deducted.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowEndModal(false)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Continue Interview
            </button>
            <button
              onClick={handleEndInterviewConfirmed}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm cursor-pointer"
            >
              End Interview
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* BUY MINUTES PACK MODAL (₹20 = 60m, ₹40 = 120m, ₹100 = 300m) */}
      {/* ========================================================= */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Add Mock Interview Minutes"
        subtitle="Choose a minutes pack to practice with Gemini AI (Rate: ₹1 for every 3 minutes)"
      >
        <div className="p-6 space-y-5">
          <div className="space-y-3">
            {MINUTE_PACKS.map((pack) => {
              const isSelected = selectedMinutePack.hours === pack.hours;
              return (
                <div
                  key={pack.hours}
                  onClick={() => setSelectedMinutePack(pack)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">{pack.minutes} Minutes</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? "bg-blue-200 text-blue-900" : "bg-slate-100 text-slate-600"
                      }`}>
                        {pack.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">{pack.desc}</p>
                    <span className="text-[11px] font-semibold text-blue-700 block">{pack.rateNote}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-blue-700">₹{pack.price}</div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase">All-Inclusive</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Current Balance: <strong className="text-slate-800">{totalMockMinutes} mins</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBuyMinutesPack(selectedMinutePack)}
                disabled={buyingMinutes}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {buyingMinutes ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{buyingMinutes ? "Processing..." : `Pay ₹${selectedMinutePack.price} for ${selectedMinutePack.minutes} Mins`}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MockInterviewPage;
