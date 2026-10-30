import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Hand,
  MessageSquare,
  Users2,
  Share2,
  Clock,
  Sparkles,
  Shield,
  Send,
  AlertTriangle,
  Crown,
  MonitorUp,
  FileText,
  X,
  Check,
  ChevronRight,
  HelpCircle,
  Lightbulb
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { b2cApi } from "../services/b2cApi";
import { Button } from "../components/common/Button";
import { Avatar } from "../components/common/Avatar";
import { RemoteVideoTile } from "../components/common/RemoteVideoTile";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

export function GdRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(900);
  const [isSessionEnded, setIsSessionEnded] = useState(false);

  // WebRTC remote stream map: { [userId]: MediaStream }
  const [remoteStreams, setRemoteStreams] = useState({});
  const peerConnectionsRef = useRef(new Map());

  // Media states
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasHandRaised, setHasHandRaised] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  // Local media stream refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Drawer states
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'participants' | 'guidelines'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const chatBottomRef = useRef(null);

  // Initialize room and local camera/microphone
  useEffect(() => {
    let isMounted = true;

    async function initRoomAndMedia() {
      try {
        setLoading(true);
        // Ensure user is joined in room
        const joinRes = await b2cApi.joinGdRoom(roomId).catch(async (err) => {
          // If already in room or join error, try fetching room
          return b2cApi.getGdRoom(roomId);
        });

        const roomData = joinRes.room || (await b2cApi.getGdRoom(roomId)).room;
        if (!isMounted) return;

        setRoom(roomData);
        setChatMessages(roomData.chatMessages || []);

        if (roomData.expiresAt) {
          const diff = Math.max(0, Math.floor((new Date(roomData.expiresAt).getTime() - Date.now()) / 1000));
          setRemainingSeconds(diff);
          if (diff === 0) setIsSessionEnded(true);
        }

        // Initialize local camera & mic
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 640 }, height: { ideal: 480 } },
              audio: true
            });
            if (isMounted) {
              localStreamRef.current = stream;
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
              }
            }
          }
        } catch (mediaErr) {
          console.warn("Camera/mic access unavailable or denied:", mediaErr.message);
          setMediaError("Camera/Mic not detected or permission denied. Participating in Voice/Tile mode.");
          setIsVideoMuted(true);
        }
      } catch (err) {
        if (isMounted) {
          showError(err.message || "Failed to load discussion room.");
          navigate("/gd");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initRoomAndMedia();

    const myId = String(user?.id || user?.userId || "");

    const getOrCreatePeer = (peerId) => {
      const pid = String(peerId);
      if (peerConnectionsRef.current.has(pid)) {
        return peerConnectionsRef.current.get(pid);
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);

      // Attach local tracks if ready
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStreams((prev) => ({ ...prev, [pid]: event.streams[0] }));
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          b2cApi.sendGdSignal(roomId, {
            targetUserId: pid,
            signal: { type: "candidate", candidate: event.candidate }
          }).catch(() => {});
        }
      };

      peerConnectionsRef.current.set(pid, pc);
      return pc;
    };

    // Periodic synchronization poll (every 3s)
    const pollInterval = setInterval(async () => {
      try {
        const res = await b2cApi.getGdRoom(roomId);
        if (res?.room && isMounted) {
          setRoom(res.room);
          setChatMessages(res.room.chatMessages || []);
          if (typeof res.remainingSeconds === "number") {
            setRemainingSeconds(res.remainingSeconds);
            if (res.remainingSeconds <= 0) {
              setIsSessionEnded(true);
            }
          }

          // Negotiate WebRTC mesh connections
          if (myId) {
            const peers = (res.room.participants || []).filter(
              (p) => String(p.userId) !== myId
            );

            for (const peer of peers) {
              const pid = String(peer.userId);
              const isInitiator = myId > pid;
              if (!peerConnectionsRef.current.has(pid) && isInitiator) {
                const pc = getOrCreatePeer(pid);
                try {
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  await b2cApi.sendGdSignal(roomId, {
                    targetUserId: pid,
                    signal: { type: "offer", sdp: pc.localDescription }
                  });
                } catch (e) {
                  console.warn("Failed creating WebRTC offer for peer", pid, e);
                }
              }
            }
          }
        }

        // Drain incoming WebRTC signals
        if (myId) {
          const sigRes = await b2cApi.getGdSignals(roomId).catch(() => null);
          const incoming = sigRes?.signals || [];
          for (const item of incoming) {
            const senderId = String(item.senderId);
            const { signal } = item;
            if (!signal) continue;

            const pc = getOrCreatePeer(senderId);

            if (signal.type === "offer" && signal.sdp) {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await b2cApi.sendGdSignal(roomId, {
                  targetUserId: senderId,
                  signal: { type: "answer", sdp: pc.localDescription }
                });
              } catch (err) {
                console.warn("Error handling WebRTC offer from", senderId, err);
              }
            } else if (signal.type === "answer" && signal.sdp) {
              try {
                if (pc.signalingState !== "stable") {
                  await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                }
              } catch (err) {
                console.warn("Error setting remote answer from", senderId, err);
              }
            } else if (signal.type === "candidate" && signal.candidate) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
              } catch (err) {
                console.warn("Error adding ICE candidate from", senderId, err);
              }
            }
          }
        }
      } catch (e) {
        // Silent poll error
      }
    }, 3000);

    // Countdown tick (every 1s)
    const timerInterval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsSessionEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearInterval(timerInterval);
      // Clean up WebRTC peer connections
      peerConnectionsRef.current.forEach((pc) => {
        try { pc.close(); } catch (_) {}
      });
      peerConnectionsRef.current.clear();
      // Clean up media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, user]);

  // Keep local video element synced with localStream
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current && !isVideoMuted) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isVideoMuted]);

  
  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isDrawerOpen]);

  // Media Toggles
  const toggleAudio = async () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
    await b2cApi.updateParticipantState(roomId, { isAudioMuted: nextState }).catch(() => {});
  };

  const toggleVideo = async () => {
    const nextState = !isVideoMuted;
    setIsVideoMuted(nextState);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    } else if (!nextState) {
      // Try acquiring video if not yet acquired
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !isAudioMuted });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (e) {
        showError("Could not access camera device.");
        setIsVideoMuted(true);
      }
    }
    await b2cApi.updateParticipantState(roomId, { isVideoMuted: nextState }).catch(() => {});
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.warn("Screen share cancelled", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    setIsScreenSharing(false);
  };

  const toggleHandRaise = async () => {
    const nextState = !hasHandRaised;
    setHasHandRaised(nextState);
    await b2cApi.updateParticipantState(roomId, { hasHandRaised: nextState }).catch(() => {});
    if (nextState) {
      showInfo("Hand raised. The moderator will acknowledge you.");
    }
  };

  const handleLeaveRoom = async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      await b2cApi.leaveGdRoom(roomId);
      showInfo("You left the discussion room.");
      navigate("/gd");
    } catch (err) {
      navigate("/gd");
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const textToSend = chatInput.trim();
    setChatInput("");

    try {
      const res = await b2cApi.sendGdChat(roomId, textToSend);
      if (res?.message) {
        setChatMessages((prev) => [...prev, res.message]);
      }
    } catch (err) {
      showError("Failed to deliver message.");
    }
  };

  const handleCopyLink = () => {
    const fullUrl = window.location.origin + `/gd/${roomId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    showSuccess("Invite link copied to clipboard! Share with your cohort peers.");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Timer Formatting
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isLowTime = remainingSeconds <= 180 && remainingSeconds > 0; // Under 3 mins

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 bg-slate-950 text-white rounded-3xl p-8">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Connecting to secure Group Discussion arena...</p>
      </div>
    );
  }

  const participants = room?.participants || [];
  const currentUserId = user?.id || user?.userId;

  // Compute grid layout class based on participant count
  const getGridColsClass = (count) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-1 sm:grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    if (count <= 8) return "grid-cols-2 md:grid-cols-4";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-6rem)] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-white select-none">
      
      {/* Top Header Bar */}
      <div className="h-16 px-4 sm:px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 z-20 backdrop-blur-md">
        {/* Left: Room Title & Topic */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                {room?.title || "Executive Group Discussion"}
              </h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {room?.category || "Strategy"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-sm sm:max-w-xl">
              Topic: {room?.topic}
            </p>
          </div>
        </div>

        {/* Center: Synchronized Timer */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm border transition-all ${
              isLowTime
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                : "bg-slate-800/80 text-slate-200 border-slate-700/80"
            }`}
          >
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>
          {isLowTime && (
            <span className="hidden md:inline-block text-[11px] font-semibold text-amber-400">
              Wrap Up Soon
            </span>
          )}
        </div>

        {/* Right: Copy Invite Link & Participants Count */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? "Link Copied!" : "Share Link"}</span>
          </Button>

          <button
            onClick={() => {
              setActiveTab("participants");
              setIsDrawerOpen(!isDrawerOpen);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>{participants.length}/{room?.maxParticipants || 4}</span>
          </button>
        </div>
      </div>

      {/* Main Video & Grid Canvas Area */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* Participants Video Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto no-scrollbar flex items-center justify-center">
          <div className={`grid ${getGridColsClass(participants.length)} gap-3 sm:gap-4 w-full h-full max-w-6xl mx-auto`}>
            {participants.map((p) => {
              const isMe = String(p.userId) === String(currentUserId);
              const isAudioOff = isMe ? isAudioMuted : p.isAudioMuted;
              const isVideoOff = isMe ? isVideoMuted : p.isVideoMuted;
              const hasHand = isMe ? hasHandRaised : p.hasHandRaised;

              return (
                <div
                  key={p.userId}
                  className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 flex flex-col justify-between p-3.5 shadow-lg min-h-[160px] sm:min-h-[200px] transition-all ${
                    !isAudioOff ? "ring-2 ring-emerald-500/40 shadow-emerald-500/10" : ""
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between w-full z-10">
                    <div className="flex items-center gap-1.5">
                      {p.isHost && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                          <Crown className="w-3 h-3 text-amber-400" />
                          Host
                        </span>
                      )}
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                          You
                        </span>
                      )}
                    </div>

                    {/* Raised Hand indicator */}
                    {hasHand && (
                      <div className="p-1.5 rounded-full bg-amber-500 text-slate-950 animate-bounce shadow-md" title="Hand Raised">
                        <Hand className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Tile Center Video or Avatar Fallback */}
                  <div className="flex-1 flex items-center justify-center my-2">
                    {isMe && !isVideoOff ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : !isMe && remoteStreams[p.userId] && !isVideoOff ? (
                      <RemoteVideoTile
                        stream={remoteStreams[p.userId]}
                        isVideoOff={isVideoOff}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        {/* Audio playback for remote peer in voice/avatar mode */}
                        {!isMe && remoteStreams[p.userId] && (
                          <audio
                            autoPlay
                            playsInline
                            ref={(el) => {
                              if (el && remoteStreams[p.userId] && el.srcObject !== remoteStreams[p.userId]) {
                                el.srcObject = remoteStreams[p.userId];
                              }
                            }}
                          />
                        )}
                        <div
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-black text-white bg-blue-600 ${
                            !isAudioOff ? "ring-4 ring-emerald-400/60 ring-offset-2 ring-offset-slate-900 animate-pulse" : ""
                          }`}
                        >
                          {p.name?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                          {p.degree || "MBA"} Candidate
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Bar: Name & Media Controls Indicator */}
                  <div className="flex items-center justify-between w-full pt-2 border-t border-slate-800/80 z-10">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {p.collegeName || "Student Community"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className={`p-1 rounded-md text-xs ${
                          isAudioOff ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {isAudioOff ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      </div>
                      <div
                        className={`p-1 rounded-md text-xs ${
                          isVideoOff ? "bg-slate-800 text-slate-500" : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {isVideoOff ? <VideoOff className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Drawer (Chat / Participants / Case Guidelines) */}
        {isDrawerOpen && (
          <div className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-20 animate-in slide-in-from-right duration-200">
            {/* Drawer Tabs */}
            <div className="flex items-center justify-between px-4 pt-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "chat"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  In-Room Chat
                </button>
                <button
                  onClick={() => setActiveTab("participants")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "participants"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Cohort ({participants.length})
                </button>
                <button
                  onClick={() => setActiveTab("guidelines")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "guidelines"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Case Framework
                </button>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab 1: Chat Messages */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar">
                  {chatMessages.map((msg, i) => {
                    const isSystem = msg.senderId === "SYSTEM";
                    const isMe = String(msg.senderId) === String(currentUserId);

                    if (isSystem) {
                      return (
                        <div key={msg.id || i} className="text-center my-2">
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[10px] text-slate-400 border border-slate-700/60 inline-block max-w-xs">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id || i}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[10px] text-slate-400 px-1 mb-0.5">
                          {isMe ? "You" : msg.senderName}
                        </span>
                        <div
                          className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                            isMe
                              ? "bg-indigo-600 text-white rounded-tr-xs"
                              : "bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a thought or supporting data point..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    disabled={!chatInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 p-2 h-auto"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            )}

            {/* Tab 2: Participants List */}
            {activeTab === "participants" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-2 no-scrollbar">
                {participants.map((p) => (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {p.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{p.name}</p>
                          {p.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {p.degree || "MBA"} • {p.collegeName || "Student"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {p.hasHandRaised && (
                        <Hand className="w-3.5 h-3.5 text-amber-400 mr-1 animate-bounce" />
                      )}
                      {p.isAudioMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Case Frameworks */}
            {activeTab === "guidelines" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs text-slate-300 no-scrollbar">
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    Recommended Discussion Blueprint
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                    <li><strong>0:00 - 2:00:</strong> Define problem scope & context</li>
                    <li><strong>2:00 - 9:00:</strong> Diverse analytical perspectives</li>
                    <li><strong>9:00 - 13:00:</strong> Synthesize trade-offs & strategy</li>
                    <li><strong>13:00 - 15:00:</strong> Consensus summary & closing</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-white">Management Frameworks to Reference:</p>
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                      <strong className="text-indigo-300">SWOT Analysis:</strong> Strengths, Weaknesses, Market Opportunities & Competitive Threats.
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                      <strong className="text-indigo-300">4Ps of Marketing:</strong> Product fit, Price elasticities, Place/distribution, Promotional ROI.
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                      <strong className="text-indigo-300">PESTLE Model:</strong> Political, Economic, Social, Technological, Legal & Environmental vectors.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-200">Recruiter Evaluation Rubric:</p>
                  <p>1. Clarity of thought & structured logical reasoning</p>
                  <p>2. Active listening and building on cohort points</p>
                  <p>3. Maintaining executive poise and conflict resolution</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Google Meet Bottom Control Bar */}
      <div className="h-20 px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Mute Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-3 sm:p-3.5 rounded-2xl font-bold transition-all cursor-pointer ${
              isAudioMuted
                ? "bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            }`}
            title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-3 sm:p-3.5 rounded-2xl font-bold transition-all cursor-pointer ${
              isVideoMuted
                ? "bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            }`}
            title={isVideoMuted ? "Turn On Camera" : "Turn Off Camera"}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            className={`hidden sm:flex p-3 sm:p-3.5 rounded-2xl font-bold transition-all cursor-pointer ${
              isScreenSharing
                ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            }`}
            title={isScreenSharing ? "Stop Screen Share" : "Share Your Screen"}
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          {/* Raise Hand Toggle */}
          <button
            onClick={toggleHandRaise}
            className={`p-3 sm:p-3.5 rounded-2xl font-bold transition-all cursor-pointer ${
              hasHandRaised
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/30 animate-pulse"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            }`}
            title={hasHandRaised ? "Lower Hand" : "Raise Hand"}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => {
              setActiveTab("chat");
              setIsDrawerOpen(!isDrawerOpen);
            }}
            className={`p-3 sm:p-3.5 rounded-2xl font-bold transition-all cursor-pointer ${
              isDrawerOpen && activeTab === "chat"
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            }`}
            title="Toggle In-Room Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          
          {/* Leave / End Call Button */}
          <button
            onClick={handleLeaveRoom}
            className="p-3 sm:p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-600/40 cursor-pointer ml-2"
            title="Leave Discussion Room"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Session Wrap-Up Modal when Timer expires */}
      {isSessionEnded && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Discussion Concluded</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The {room?.durationMinutes || 15}-minute time limit for this Group Discussion has completed.
              Your participation telemetry and room chat have been recorded.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleLeaveRoom}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Return to GD Arena Lobby
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default GdRoomPage;
