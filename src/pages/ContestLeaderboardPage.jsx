import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  Medal,
  Award,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Users,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { practiceApi } from "../services/practiceApi";
import { useAuth } from "../context/AuthContext";

export function ContestLeaderboardPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState({ entries: [], totalEntries: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchLeaderboard = useCallback(async (page = 1) => {
    if (!contestId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await practiceApi.getContestLeaderboard(contestId, {
        page,
        limit: pageSize
      });
      if (data && (data.entries || data.leaderboard)) {
        setLeaderboardData(data);
      } else {
        setLeaderboardData({ entries: [], totalEntries: 0 });
      }
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      setError("Unable to load leaderboard. Please check your connection.");
      setLeaderboardData({ entries: [], totalEntries: 0 });
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    fetchLeaderboard(1);
  }, [fetchLeaderboard]);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
          <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> #1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black bg-slate-100 text-slate-700 border border-slate-300">
          <Medal className="w-3.5 h-3.5 text-slate-500 fill-slate-400" /> #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black bg-amber-50 text-amber-900 border border-amber-200">
          <Award className="w-3.5 h-3.5 text-amber-700" /> #3
        </span>
      );
    }
    return (
      <span className="text-xs font-bold text-slate-600 font-mono">
        #{rank}
      </span>
    );
  };

  const {
    contestTitle = "Assessment Leaderboard",
    contestStatus = "LIVE",
    totalEntries = 0,
    myRank = null,
    entries = []
  } = leaderboardData || {};

  const filteredEntries = entries.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (e.name || "").toLowerCase().includes(q) || (e.studentId || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigate(`/contests/${contestId}`)}
            className="mb-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Assessment
          </Button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {contestTitle}
            </h1>
            <Badge variant="success" size="sm">
              {contestStatus}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Official institutional leaderboard • Standard competition ranking (1224)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={loading}
            onClick={() => fetchLeaderboard(currentPage)}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh Ranks
          </Button>
        </div>
      </div>

      {/* Authenticated Student "My Standing" Card */}
      {myRank && (
        <Card className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 block">
                  Your Assessment Standing
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">
                    {user?.name || myRank.name || "Candidate"}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white">
                    Rank #{myRank.rank}
                  </span>
                </div>
                <p className="text-xs text-indigo-200">
                  Total Score: <strong className="text-white font-mono">{myRank.totalScore} / {myRank.totalMarks || 100}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 md:pt-0">
              <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-200 block">
                  Aptitude
                </span>
                <span className="text-xs font-bold text-white font-mono">{myRank.aptitudeScore}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-200 block">
                  Technical
                </span>
                <span className="text-xs font-bold text-white font-mono">{myRank.technicalScore}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-200 block">
                  Coding
                </span>
                <span className="text-xs font-bold text-white font-mono">{myRank.codingScore}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-indigo-600/70 border border-indigo-400/30 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 block">
                  Total
                </span>
                <span className="text-xs font-bold text-white font-mono">{myRank.totalScore}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard Entries Table */}
      <Card className="overflow-hidden bg-white border border-slate-200 shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Contest Standings ({totalEntries || filteredEntries.length} Candidates)
            </h2>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-20 text-center">Rank</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4 text-center">Aptitude</th>
                <th className="py-3 px-4 text-center">Technical</th>
                <th className="py-3 px-4 text-center">Coding</th>
                <th className="py-3 px-4 text-right">Total Score</th>
                <th className="py-3 px-4 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEntries.map((entry) => {
                const isMe = entry.studentId === "STU-2028-0914" || entry.name?.includes("You");

                return (
                  <tr
                    key={entry.studentId || entry.rank}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isMe ? "bg-indigo-50/40 font-semibold" : ""
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      {getRankBadge(entry.rank)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{entry.name || "Candidate"}</span>
                        {isMe && <Badge variant="primary" size="xs">You</Badge>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">{entry.studentId}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-mono">
                      {entry.aptitudeScore}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-mono">
                      {entry.technicalScore}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-mono">
                      {entry.codingScore}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-extrabold text-slate-900 font-mono">{entry.totalScore}</span>
                      <span className="text-[10px] text-slate-400 font-normal ml-0.5">/ {entry.totalMarks || 100}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {entry.submittedAt ? new Date(entry.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default ContestLeaderboardPage;
