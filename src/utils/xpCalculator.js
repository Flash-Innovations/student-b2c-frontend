/**
 * Authoritative XP (Experience Points) Calculation Engine
 * 
 * Internal Valuation: 100 XP = 1 INR
 * Minimum XP floor: 0 (XP never goes negative)
 */

export function calculateXp(subscription, streakData = {}) {
  if (!subscription && !streakData) return 0;

  // Prioritize persistent ledger balance if defined
  if (typeof subscription?.totalXp === 'number') {
    return Math.max(0, Math.round(subscription.totalXp));
  }

  // Fallback calculation from activity counters
  let mcqCorrect = 0;
  if (typeof subscription?.mcqCorrectCount === 'number') {
    mcqCorrect = subscription.mcqCorrectCount;
  } else if (subscription?.subjectStats && Object.keys(subscription.subjectStats).length > 0) {
    const stats = subscription.subjectStats;
    mcqCorrect = Object.values(stats).reduce((acc, curr) => acc + (curr?.correct || 0), 0);
  }

  let codingTestcases = subscription?.codingPassedTestcasesCount;
  if (codingTestcases === undefined || codingTestcases === null) {
    codingTestcases = (subscription?.dsaAttemptedCount || 0) * 5;
  }

  const contestMarks = subscription?.contestMarksScored || 0;
  const interviewScore = subscription?.interviewScoreTotal || 0;

  const streakDays = typeof streakData?.currentStreak === "number"
    ? streakData.currentStreak
    : typeof streakData?.streak === "number"
    ? streakData.streak
    : (typeof streakData === "number" ? streakData : 0);

  const streakBreaks = typeof streakData?.streakBreaks === "number"
    ? streakData.streakBreaks
    : (subscription?.streakBreakCount || 0);

  const rawXp =
    (Math.max(0, mcqCorrect) * 1) +
    (Math.max(0, codingTestcases) * 1) +
    (Math.max(0, contestMarks) * 0.5) +
    (Math.max(0, interviewScore) * 0.5) +
    (Math.max(0, streakDays) * 1) -
    (Math.max(0, streakBreaks) * 5);

  return Math.max(0, Math.round(rawXp));
}

export function formatXp(subscription, streakData = {}) {
  return calculateXp(subscription, streakData).toLocaleString("en-IN");
}
