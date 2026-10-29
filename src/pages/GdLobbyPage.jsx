import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users2,
  Video,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  Lock,
  Zap,
  Crown,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Share2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { b2cApi } from "../services/b2cApi";
import { openRazorpayCheckout } from "../services/razorpayClient";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge, PlanBadge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";

const CASE_TOPICS = [
  {
    title: "AI Disruption in HR & Talent Acquisition",
    topic: "Algorithmic hiring screening vs human empathy: Ethical and workplace retention implications",
    category: "HR & Leadership"
  },
  {
    title: "Electric Vehicles (EV) Penetration in Tier 2/3 Markets",
    topic: "Charging infrastructure bottlenecks vs government subsidies: Market viability strategy",
    category: "Business Strategy"
  },
  {
    title: "FinTech Super Apps vs Traditional Commercial Banks",
    topic: "UPI convenience and micro-credit vs regulatory capital compliance & customer trust",
    category: "FinTech & Economics"
  },
  {
    title: "D2C Brand Retention in Post-Discounting Economy",
    topic: "Performance marketing CAC escalation vs customer lifetime value & omni-channel expansion",
    category: "Marketing Strategy"
  },
  {
    title: "Hybrid Work Models vs 5-Day Mandatory Return to Office",
    topic: "Cross-functional productivity and cultural alignment vs employee attrition and work-life balance",
    category: "Corporate Governance"
  }
];

export function GdLobbyPage() {
  const navigate = useNavigate();
  const { user, planTier, refreshSubscription, isTechnical } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [status, setStatus] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create room modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedPresetTopic, setSelectedPresetTopic] = useState(CASE_TOPICS[0].topic);
  const [customTopic, setCustomTopic] = useState("");
  const [useCustomTopic, setUseCustomTopic] = useState(false);
  const [category, setCategory] = useState("Business Strategy");
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Join room by code state
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);

  // Power-up pass purchase state
  const [purchasingPowerUp, setPurchasingPowerUp] = useState(false);

  useEffect(() => {
    loadLobbyData();
    const interval = setInterval(loadLobbyData, 10000); // Auto-poll every 10s for open rooms
    return () => clearInterval(interval);
  }, []);

  async function loadLobbyData() {
    try {
      const [statusRes, roomsRes] = await Promise.all([
        b2cApi.getGdStatus().catch(() => null),
        b2cApi.listGdRooms().catch(() => ({ rooms: [] }))
      ]);

      if (statusRes?.status) {
        setStatus(statusRes.status);
        // Default max participants to tier max
        if (statusRes.status.maxAllowedParticipants) {
          setMaxParticipants(Math.min(4, statusRes.status.maxAllowedParticipants));
        }
      }
      if (roomsRes?.rooms) {
        setRooms(roomsRes.rooms);
      }
    } catch (err) {
      console.error("Failed to load GD lobby data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showError("Please enter a title for the discussion room.");
      return;
    }

    const finalTopic = useCustomTopic ? customTopic.trim() : selectedPresetTopic;
    if (!finalTopic) {
      showError("Please specify a case discussion topic.");
      return;
    }

    try {
      setCreatingRoom(true);
      const res = await b2cApi.createGdRoom({
        title: title.trim(),
        topic: finalTopic,
        category,
        maxParticipants: Number(maxParticipants),
        durationMinutes: Number(durationMinutes)
      });

      if (res.success && res.roomId) {
        showSuccess("Discussion room created! Entering live arena...");
        setCreateModalOpen(false);
        navigate(`/gd/${res.roomId}`);
      } else {
        showError(res.message || "Failed to create room.");
      }
    } catch (err) {
      showError(err.message || "Could not launch room.");
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const cleanInput = joinCodeInput.trim();
    if (!cleanInput) {
      showError("Enter a valid room code or link.");
      return;
    }

    // Extract roomId if full URL was pasted
    let targetRoomId = cleanInput;
    if (cleanInput.includes("/gd/")) {
      targetRoomId = cleanInput.split("/gd/")[1].split("?")[0].replace(/\/+$/, "");
    }

    try {
      setJoiningCode(true);
      const res = await b2cApi.joinGdRoom(targetRoomId);
      if (res.success) {
        showSuccess("Joining room...");
        navigate(`/gd/${targetRoomId}`);
      }
    } catch (err) {
      showError(err.message || "Unable to join room.");
    } finally {
      setJoiningCode(false);
    }
  };

  const handleJoinDirect = async (roomId) => {
    try {
      const res = await b2cApi.joinGdRoom(roomId);
      if (res.success) {
        showSuccess("Entering discussion room...");
        navigate(`/gd/${roomId}`);
      }
    } catch (err) {
      showError(err.message || "Failed to join discussion.");
    }
  };

  const handleBuyPowerUp = async () => {
    try {
      setPurchasingPowerUp(true);
      const orderData = await b2cApi.createOrder({
        orderType: "GD_POWERUP",
        quantity: 1
      });

      if (!orderData || !orderData.orderId) {
        throw new Error("Unable to create order for Power-Up Pass.");
      }

      openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.breakdown?.totalAmount || orderData.totalAmountWithGst,
        currency: "INR",
        name: "Flash Executive Platform",
        description: "GD Session Power-Up Pass (₹30 all-inclusive)",
        user: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone
        },
        onSuccess: async (paymentResponse) => {
          try {
            await b2cApi.verifyPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });

            showSuccess("₹30 Power-Up Pass activated! 1 extra GD session credited.");
            await refreshSubscription();
            await loadLobbyData();
          } catch (err) {
            showError("Payment verification failed.");
          }
        },
        onFailure: (err) => {
          showError(err.message || "Payment cancelled.");
        }
      });
    } catch (err) {
      showError(err.message || "Failed to initiate Power-Up checkout.");
    } finally {
      setPurchasingPowerUp(false);
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (selectedCategory !== "ALL" && r.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (r.title || "").toLowerCase().includes(q);
      const matchTopic = (r.topic || "").toLowerCase().includes(q);
      const matchHost = (r.creatorName || "").toLowerCase().includes(q);
      return matchTitle || matchTopic || matchHost;
    }
    return true;
  });

  const categories = ["ALL", "Business Strategy", "Marketing Strategy", "FinTech & Economics", "HR & Leadership"];

  if (isTechnical) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6 animate-in fade-in duration-300">
        <Card className="p-8 sm:p-12 text-center border-indigo-100 bg-gradient-to-b from-indigo-50/40 via-white to-white shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Users2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Group Discussion is for Management Students
          </h2>

          <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            The Group Discussion Arena is exclusively tailored for <strong>Management, MBA, and BBA</strong> recruitment rounds.
            As an engineering / technical candidate, your placement pipeline focuses on <strong>Coding Arenas, Assessments, and Technical Interviews</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-8 max-w-md mx-auto">
            <Link to="/coding" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto font-semibold">
                Go to Coding Arena <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/interview" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto font-semibold">
                AI Mock Technical Interview
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Users2 className="w-3.5 h-3.5" />
                Executive Assessment Centre
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Video & Audio
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Group Discussion Arena
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Simulated corporate assessment centre discussions for Management, MBA & BBA students.
              Collaborate on real-world case studies with peers under realistic recruiter evaluation conditions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
              disabled={status && !status.canJoinOrCreate && !status.currentActiveGdId}
              className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Discussion
            </Button>
            <Button
              variant="outline"
              onClick={handleBuyPowerUp}
              loading={purchasingPowerUp}
              className="border-indigo-400/40 text-indigo-200 hover:bg-indigo-900/40 flex items-center justify-center gap-2 text-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Get ₹30 Power-Up Pass (all-incl.)
            </Button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Active Session Alert (Single Concurrency Invariant) */}
      {status?.currentActiveGdId && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                You currently have an active discussion in progress
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Each student can participate in only one GD at a time. Reconnect or leave your active room.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              onClick={() => navigate(`/gd/${status.currentActiveGdId}`)}
            >
              Rejoin Active Room
            </Button>
          </div>
        </div>
      )}

      {/* Quota & Plan Entitlements Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tier Card */}
        <Card className="p-4 bg-white border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Plan</span>
            <PlanBadge tier={status?.planTier || planTier} />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">
            {status?.planTier === "PREMIUM" ? "2 GDs / Day (30m)" : status?.planTier === "BASIC" ? "1 GD / Day (15m)" : "1 GD / Month (15m)"}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Max capacity: {status?.maxAllowedParticipants || 4} participants
          </p>
        </Card>

        {/* Daily Quota Card */}
        <Card className="p-4 bg-white border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Allowance</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {status?.planTier === "FREE" ? "—" : status?.dailyRemaining || 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {status?.planTier === "FREE" ? "Upgrade for daily" : `/ ${status?.gdDailyLimit || 1} available today`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Resets automatically each midnight
          </p>
        </Card>

        {/* Monthly Quota Card */}
        <Card className="p-4 bg-white border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Allowance</span>
            <Crown className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-purple-600 font-mono">
              {status?.planTier === "FREE" ? (status?.monthlyRemaining || 0) : "Unlimited Daily"}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {status?.planTier === "FREE" ? "/ 1 free per month" : "included in plan"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {status?.planTier === "FREE" ? "Next reset on 1st of next month" : "Premium & Basic daily quota"}
          </p>
        </Card>

        {/* Power-Up Balance Card */}
        <Card className="p-4 bg-gradient-to-br from-indigo-50/50 to-white border-indigo-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Power-Up Credits</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-700 font-mono">
                {status?.purchasedGdCredits || 0}
              </span>
              <span className="text-xs text-indigo-500 font-medium">sessions</span>
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={handleBuyPowerUp}
              loading={purchasingPowerUp}
              className="text-xs font-semibold text-indigo-700 border-indigo-300 hover:bg-indigo-50"
            >
              Buy Power-Up (₹30 all-incl.)
            </Button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Never expires • Use anytime beyond daily quota
          </p>
        </Card>
      </div>

      {/* Join Room by Code / Direct Link Card */}
      <Card className="p-5 border-slate-200/90 bg-white shadow-xs">
        <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="Enter Room Code (e.g. gd-abc-123) or paste full discussion link..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            loading={joiningCode}
            className="w-full sm:w-auto shrink-0 border-indigo-500 text-indigo-600 hover:bg-indigo-50"
          >
            Join with Link / Code
          </Button>
        </form>
      </Card>

      {/* Peer Discovery Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Peer Discussions</h2>
            <p className="text-xs text-slate-500">
              Join open discussion rooms created by batch mates or launch your own room.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case studies..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Room Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <Card className="p-8 text-center bg-white border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
              <Users2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No open discussions currently</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Be the first to host! Create a room with a management case study and share the invite link with your peers.
            </p>
            <div className="mt-4">
              <Button
                size="sm"
                variant="primary"
                onClick={() => setCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Launch Discussion Room
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => {
              const seatsLeft = (room.maxParticipants || 4) - (room.participantCount || 1);
              const isFull = seatsLeft <= 0;
              const minsLeft = Math.ceil((room.remainingSeconds || 900) / 60);

              return (
                <div
                  key={room.roomId}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full truncate">
                        {room.category || "Business Strategy"}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {room.status === "ACTIVE" ? `${minsLeft}m left` : "Waiting"}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {room.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {room.topic}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Host: <strong className="text-slate-700">{room.creatorName}</strong></span>
                      <span className="font-mono font-medium text-slate-600">
                        {room.participantCount || 1}/{room.maxParticipants} seats
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {room.durationMinutes} min session
                    </span>
                    <Button
                      size="sm"
                      variant={isFull ? "outline" : "primary"}
                      disabled={isFull}
                      onClick={() => handleJoinDirect(room.roomId)}
                      className={isFull ? "text-slate-400" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
                    >
                      {isFull ? "Room Full" : "Join Discussion"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Discussion Room Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Launch Executive Group Discussion"
        subtitle="Configure room capacity, case study topic, and recruit cohort participants."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateRoom} className="space-y-5">
          {/* Room Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Room Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. FMCG Omni-channel Brand Repositioning Round"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Discussion Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
            >
              <option value="Business Strategy">Business Strategy & Operations</option>
              <option value="Marketing Strategy">Marketing & Consumer Behaviour</option>
              <option value="FinTech & Economics">FinTech, Banking & Macroeconomics</option>
              <option value="HR & Leadership">HR, Workplace Ethics & Leadership</option>
              <option value="Corporate Governance">Corporate Governance & ESG</option>
            </select>
          </div>

          {/* Case Study Topic Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Case Study Scenario
              </label>
              <button
                type="button"
                onClick={() => setUseCustomTopic(!useCustomTopic)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                {useCustomTopic ? "← Pick from Case Presets" : "+ Enter Custom Case Scenario"}
              </button>
            </div>

            {useCustomTopic ? (
              <textarea
                rows={3}
                required
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="State the prompt, case dilemma, or business debate topic..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {CASE_TOPICS.map((item, idx) => (
                  <label
                    key={idx}
                    onClick={() => {
                      setSelectedPresetTopic(item.topic);
                      setCategory(item.category);
                      if (!title) setTitle(item.title);
                    }}
                    className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedPresetTopic === item.topic
                        ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {item.topic}
                    </p>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Capacity & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Participant Capacity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Participants: <span className="text-indigo-600 font-mono text-sm">{maxParticipants}</span>
              </label>
              <input
                type="range"
                min={2}
                max={status?.maxAllowedParticipants || 4}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>2 min</span>
                <span>Max {status?.maxAllowedParticipants || 4} ({planTier} Tier)</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Duration (Minutes)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                <option value={15}>15 Minutes (Standard Round)</option>
                {status?.maxAllowedDuration >= 30 && (
                  <option value={30}>30 Minutes (Deep Case Simulation - Premium)</option>
                )}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Auto-wrap timer with 3-minute remaining alert
              </p>
            </div>
          </div>

          {/* Quota Deduction Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Consumes 1 session quota on room creation
            </span>
            <span className="font-semibold text-slate-900">
              {status?.purchasedGdCredits > 0
                ? `${status.purchasedGdCredits} Power-Up credit(s) available`
                : status?.planTier === "FREE"
                ? `${status?.monthlyRemaining || 1} monthly GD left`
                : `${status?.dailyRemaining || 1} daily GD left`}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={creatingRoom}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Launch Room & Copy Link
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

export default GdLobbyPage;
