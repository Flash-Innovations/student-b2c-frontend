/**
 * Authoritative XP (Experience Points) Calculation Engine
 * 
 * Ratified Formula:
 * Total XP = max(0, 
 *   (mcqCorrect * 1) + 
 *   (codingTestcasesPassed * 2) + 
 *   (contestMarksScored * 0.5) + 
 *   (interviewScoreTotal * 0.5) + 
 *   (activeStreakDays * 5) - 
 *   (streakBreakEvents * 3)
 * )
 *
 * Rules:
 * 1. Hard Floor: Strict minimum at 0. Never displays negative XP.
 * 2. Coding Protection: Evaluated once per unique problem based on best accepted run (prevents farming and debugging penalties).
 * 3. Contest Performance: Calculated strictly from marks scored by the candidate in competitive rounds.
 * 4. Practice Hub: Incorrect MCQs have 0 penalty to encourage tackling challenging curriculum topics.
 * 5. Streak Penalty: -3 XP triggers only once per broken streak transition event.
 */

export function calculateXp(subscription, streakData = {}) {
  if (!subscription && !streakData) return 0;

  // 1. Correct MCQs (+1 XP per correct answer)
  let mcqCorrect = subscription?.mcqCorrectCount;
  if (mcqCorrect === undefined || mcqCorrect === null) {
    const stats = subscription?.subjectStats || {};
    const sumCorrect = Object.values(stats).reduce((acc, curr) => acc + (curr?.correct || 0), 0);
    mcqCorrect = sumCorrect > 0 ? sumCorrect : (subscription?.mcqAttemptedCount || 0);
  }

  // 2. Coding Passed Testcases (+2 XP per passed testcase, unique problem best run)
  let codingTestcases = subscription?.codingPassedTestcasesCount;
  if (codingTestcases === undefined || codingTestcases === null) {
    codingTestcases = (subscription?.dsaAttemptedCount || 0) * 5;
  }

  // 3. Contest Marks Scored (+0.5 XP per mark scored)
  const contestMarks = subscription?.contestMarksScored || 0;

  // 4. Mock Interview Score (+0.5 XP per score point)
  const interviewScore = subscription?.interviewScoreTotal || 0;

  // 5. Active Practice Streak (+5 XP per active consecutive day)
  const streakDays = typeof streakData?.currentStreak === "number"
    ? streakData.currentStreak
    : typeof streakData?.streak === "number"
    ? streakData.streak
    : (typeof streakData === "number" ? streakData : 0);

  // 6. Streak Breaks Penalty (-3 XP one-time on streak break)
  const streakBreaks = typeof streakData?.streakBreaks === "number"
    ? streakData.streakBreaks
    : (subscription?.streakBreakCount || 0);

  const rawXp =
    (Math.max(0, mcqCorrect) * 1) +
    (Math.max(0, codingTestcases) * 2) +
    (Math.max(0, contestMarks) * 0.5) +
    (Math.max(0, interviewScore) * 0.5) +
    (Math.max(0, streakDays) * 5) -
    (Math.max(0, streakBreaks) * 3);

  return Math.max(0, Math.round(rawXp));
}

export function formatXp(subscription, streakData = {}) {
  return calculateXp(subscription, streakData).toLocaleString("en-IN");
}
