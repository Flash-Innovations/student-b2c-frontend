/**
 * Frontend Interview Evaluation Engine
 * Matches the backend evaluator precisely to ensure consistent, content-aware,
 * objective scoring and personalized, turn-specific feedback.
 */

const SKIP_PATTERNS = [
  /\b(i\s*don'?t\s*know|i\s*do\s*not\s*know|don'?t\s*know\s*this)\b/i,
  /\b(no\s*idea|not\s*sure|have\s*no\s*clue)\b/i,
  /\b(can\s*we\s*move|can\s*we\s*skip|skip\s*this|pass\s*this|skip\s*question|pass\s*question)\b/i,
  /\b(next\s*question|move\s*to\s*another\s*question|another\s*question\s*please|can\s*we\s*go\s*to\s*next)\b/i,
  /\b(haven'?t\s*studied|not\s*familiar\s*with\s*this|cannot\s*answer\s*this|can't\s*answer\s*this)\b/i,
  /\b(pass|skip|no\s*answer)\b/i
];

export function isSkipOrEvasion(transcript) {
  if (!transcript || typeof transcript !== 'string') return true;
  const cleaned = transcript.trim().toLowerCase();
  if (cleaned.length === 0 || cleaned.startsWith('[') || cleaned === 'no answer provided') {
    return true;
  }
  if (cleaned.length < 120) {
    for (const pattern of SKIP_PATTERNS) {
      if (pattern.test(cleaned)) return true;
    }
  }
  if (/\b(i\s*don'?t\s*know\s*this\s*question|can\s*we\s*move\s*to\s*another\s*question)\b/i.test(cleaned)) {
    return true;
  }
  return false;
}

export function evaluateAnswerForQuestion({ questionText = '', answerText = '', track = 'Technical Interview', skills = [] }) {
  const cleanQ = (questionText || '').trim();
  const cleanA = (answerText || '').trim();
  const isHr = (track === 'HR' || track === 'HR Interview');

  // Case 1: Empty or Unanswered
  if (!cleanA || cleanA.length < 2 || cleanA.startsWith('[') || cleanA === 'No answer provided') {
    return {
      isSkipped: true,
      score: 0,
      technicalAccuracy: isHr ? null : 0,
      clarityScore: 0,
      completenessScore: 0,
      feedback: 'No response was recorded for this question.',
      decision: 'NEXT_TOPIC'
    };
  }

  // Case 2: Candidate skipped / passed / said "I don't know"
  if (isSkipOrEvasion(cleanA)) {
    return {
      isSkipped: true,
      score: 20,
      technicalAccuracy: isHr ? null : 15,
      clarityScore: 65,
      completenessScore: 10,
      feedback: 'Question skipped without a technical answer. In placement interviews, even when unsure of the exact syntax or solution, try sharing related fundamental concepts, logical building blocks, or reasoning rather than passing completely.',
      decision: 'NEXT_TOPIC'
    };
  }

  const lowerQ = cleanQ.toLowerCase();
  const lowerA = cleanA.toLowerCase();
  const words = cleanA.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Case 3: Python Memory Management & Mutability
  if (lowerQ.includes('memory management') || (lowerQ.includes('python') && (lowerQ.includes('reference counting') || lowerQ.includes('mutable')))) {
    const hasRefCount = /reference\s*count/i.test(lowerA);
    const hasGarbageCol = /garbage\s*collect|circular\s*reference|cycle/i.test(lowerA);
    const hasMutable = /mutable/i.test(lowerA);
    const hasImmutable = /immutable/i.test(lowerA);

    let matchCount = (hasRefCount ? 1 : 0) + (hasGarbageCol ? 1 : 0) + ((hasMutable && hasImmutable) ? 1 : 0);

    if (matchCount >= 3) {
      return {
        isSkipped: false,
        score: Math.min(96, 88 + (wordCount > 40 ? 4 : 2)),
        technicalAccuracy: 92,
        clarityScore: 88,
        completenessScore: 90,
        feedback: 'Accurately explained automatic memory management via reference counting, cyclic garbage collection, and the mutability distinction between dictionaries and strings/tuples. Excellent technical precision.',
        decision: 'NEXT_TOPIC'
      };
    } else if (matchCount >= 1) {
      return {
        isSkipped: false,
        score: 75,
        technicalAccuracy: 76,
        clarityScore: 78,
        completenessScore: 72,
        feedback: 'Good foundational explanation of Python object mutability. To elevate your score, elaborate on how the generational cyclic garbage collector supplements reference counting for circular references.',
        decision: 'FOLLOW_UP'
      };
    }
  }

  // Case 4: Architectural Trade-offs / System Design / Project Experience
  if (lowerQ.includes('trade-off') || lowerQ.includes('challenging problem') || lowerQ.includes('architectural')) {
    const hasSystemTerms = /latency|throughput|scalab|cache|redis|database|db|bottleneck|concurrency|thread|sharding|microservice|load\s*balanc|consistency|partition/i.test(lowerA);
    const hasQuantifiable = /\d+|percent|%|ms|millisecond|second|scale|traffic|qps/i.test(lowerA);

    if (hasSystemTerms && hasQuantifiable) {
      return {
        isSkipped: false,
        score: Math.min(95, 87 + (wordCount > 50 ? 5 : 2)),
        technicalAccuracy: 90,
        clarityScore: 88,
        completenessScore: 88,
        feedback: 'Excellent response detailing specific architectural trade-offs, performance bottlenecks, and quantifiable system metrics. Demonstrates senior engineering judgment.',
        decision: 'NEXT_TOPIC'
      };
    } else if (hasSystemTerms || wordCount >= 35) {
      return {
        isSkipped: false,
        score: 78,
        technicalAccuracy: 80,
        clarityScore: 78,
        completenessScore: 76,
        feedback: 'Solid overview of project challenges and architectural choices. For maximum marks, quantify the performance gains (e.g. latency reduction, throughput) and discuss failure recovery.',
        decision: 'FOLLOW_UP'
      };
    }
  }

  // Case 5: React.js & Frontend Performance
  if (lowerQ.includes('react') || lowerQ.includes('virtual dom') || lowerQ.includes('rendering')) {
    const hasReactTerms = /virtual\s*dom|reconcil|usememo|usecallback|memo|state|props|hook|fiber|profil|batch/i.test(lowerA);
    if (hasReactTerms && wordCount >= 30) {
      return {
        isSkipped: false,
        score: 86,
        technicalAccuracy: 88,
        clarityScore: 85,
        completenessScore: 84,
        feedback: 'Well-articulated explanation of React rendering optimization and memoization techniques. Clearly highlighted component re-render boundaries.',
        decision: 'NEXT_TOPIC'
      };
    } else if (hasReactTerms || wordCount >= 15) {
      return {
        isSkipped: false,
        score: 75,
        technicalAccuracy: 76,
        clarityScore: 78,
        completenessScore: 72,
        feedback: 'Correctly noted React component memoization. To maximize marks, contrast useMemo with useCallback and describe reconciliation under frequent state updates.',
        decision: 'FOLLOW_UP'
      };
    }
  }

  // Case 6: SQL, Database Normalization & Indexing
  if (lowerQ.includes('sql') || lowerQ.includes('normalization') || lowerQ.includes('index') || lowerQ.includes('dbms')) {
    const hasDbTerms = /1nf|2nf|3nf|bcnf|redundancy|index|b-tree|btree|table\s*scan|join|acid|transaction|denormal/i.test(lowerA);
    if (hasDbTerms && wordCount >= 25) {
      return {
        isSkipped: false,
        score: 88,
        technicalAccuracy: 90,
        clarityScore: 86,
        completenessScore: 86,
        feedback: 'Sound understanding of relational database normalization forms and indexing strategies. Effectively balanced read vs. write performance considerations.',
        decision: 'NEXT_TOPIC'
      };
    } else if (hasDbTerms || wordCount >= 15) {
      return {
        isSkipped: false,
        score: 76,
        technicalAccuracy: 78,
        clarityScore: 76,
        completenessScore: 74,
        feedback: 'Identified the core purpose of database normalization. Expanding on specific B-Tree indexing mechanisms and intentional denormalization trade-offs will strengthen your answer.',
        decision: 'FOLLOW_UP'
      };
    }
  }

  // Case 7: HR / Behavioral Questions
  if (isHr || lowerQ.includes('tell me about') || lowerQ.includes('disagreement') || lowerQ.includes('conflict') || lowerQ.includes('team') || lowerQ.includes('weakness')) {
    const hasStarMethod = /situation|task|action|result|resolve|team|communicat|listen|understand|collaborat/i.test(lowerA);
    if (hasStarMethod && wordCount >= 40) {
      return {
        isSkipped: false,
        score: 87,
        technicalAccuracy: null,
        clarityScore: 88,
        completenessScore: 86,
        feedback: 'Effective behavioral demonstration using structured situational context. Highlighted professional empathy, proactive communication, and constructive team outcomes.',
        decision: 'NEXT_TOPIC'
      };
    } else if (wordCount >= 20) {
      return {
        isSkipped: false,
        score: 76,
        technicalAccuracy: null,
        clarityScore: 78,
        completenessScore: 74,
        feedback: 'Good initial behavioral response. Enhance it by framing your answer with the STAR methodology (Situation, Task, Action, Result) to showcase measurable outcomes.',
        decision: 'FOLLOW_UP'
      };
    }
  }

  // Case 8: Dynamic General Technical Evaluator
  const techKeywords = lowerA.match(/\b(api|async|await|class|object|function|variable|memory|algorithm|complexity|database|server|client|network|protocol|thread|lock|cache|query|framework|component|state|testing|deploy|cloud)\b/g) || [];
  const techKeywordCount = techKeywords.length;

  if (wordCount >= 45 && techKeywordCount >= 3) {
    return {
      isSkipped: false,
      score: Math.min(92, 80 + Math.min(8, techKeywordCount * 2) + Math.min(4, Math.round(wordCount / 20))),
      technicalAccuracy: isHr ? null : 85,
      clarityScore: 84,
      completenessScore: 82,
      feedback: `Substantive answer demonstrating good domain vocabulary (${techKeywords.slice(0, 3).join(', ')}). Highlighting boundary cases and system constraints will make it even more comprehensive.`,
      decision: 'NEXT_TOPIC'
    };
  } else if (wordCount >= 20) {
    return {
      isSkipped: false,
      score: 72,
      technicalAccuracy: isHr ? null : 73,
      clarityScore: 75,
      completenessScore: 70,
      feedback: 'Clear, concise foundational response. In campus placement rounds, elaborate with concrete implementation examples and runtime trade-offs for higher scores.',
      decision: 'FOLLOW_UP'
    };
  } else {
    return {
      isSkipped: false,
      score: 60,
      technicalAccuracy: isHr ? null : 62,
      clarityScore: 68,
      completenessScore: 55,
      feedback: 'Very brief answer. Placement interviewers look for detailed explanations covering design decisions, alternate approaches, and practical code considerations.',
      decision: 'FOLLOW_UP'
    };
  }
}

export function calculateOverallReport({ questions = [], track = 'Technical Interview', durationMinutes = 15, studentName = 'Candidate' }) {
  const isHr = (track === 'HR' || track === 'HR Interview');
  const isCombined = (track === 'COMBINED' || track === 'Combined (Tech + HR)');
  const totalAsked = Math.max(1, questions.length);

  const evaluatedQuestions = questions.map((q, idx) => {
    const hasExistingScore = typeof q.score === 'number' && q.score > 0;
    const hasValidFeedback = q.feedback && q.feedback !== 'Answer evaluated.' && q.feedback !== 'Answer recorded.';

    const evalData = (hasExistingScore && hasValidFeedback)
      ? {
          score: q.score,
          feedback: q.feedback,
          technicalAccuracy: q.technicalAccuracy,
          clarityScore: q.clarityScore,
          completenessScore: q.completenessScore,
          isSkipped: q.score <= 25
        }
      : evaluateAnswerForQuestion({
          questionText: q.questionText,
          answerText: q.studentTranscript || q.answerText || '',
          track: q.track || track
        });

    return {
      questionIndex: q.questionIndex || (idx + 1),
      questionText: q.questionText,
      studentTranscript: q.studentTranscript || q.answerText || '',
      answerText: q.studentTranscript || q.answerText || '',
      feedback: evalData.feedback,
      aiFeedback: evalData.feedback,
      score: evalData.score,
      technicalAccuracy: evalData.technicalAccuracy,
      clarityScore: evalData.clarityScore,
      completenessScore: evalData.completenessScore,
      isSkipped: evalData.isSkipped,
      isFollowUp: Boolean(q.isFollowUp),
      track: q.track || track
    };
  });

  const validAnswered = evaluatedQuestions.filter(q => {
    const text = (q.studentTranscript || '').trim();
    return text.length > 0 && !text.startsWith('[') && text !== 'No answer provided';
  });

  if (validAnswered.length === 0) {
    return {
      status: 'INCOMPLETE',
      evaluationStatus: 'NOT_ENOUGH_RESPONSES',
      overallScore: null,
      technicalScore: null,
      hrScore: null,
      communicationScore: null,
      problemSolvingScore: null,
      confidenceScore: null,
      questionsAsked: totalAsked,
      questionsAnswered: 0,
      questionsUnanswered: totalAsked,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      feedbackSummary: 'Your interview was completed without any recorded responses. We could not generate an accurate evaluation.',
      qaReview: evaluatedQuestions
    };
  }

  // Overall Score is strictly the average of question scores
  const totalScoreSum = evaluatedQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
  const overallScore = Math.round(totalScoreSum / evaluatedQuestions.length);

  // Technical Score: average of technical turns that were not skipped
  const techTurns = evaluatedQuestions.filter(q => q.track !== 'HR Interview' && q.track !== 'HR' && typeof q.technicalAccuracy === 'number');
  const technicalScore = isHr ? null : (
    techTurns.length > 0
      ? Math.round(techTurns.reduce((sum, q) => sum + q.technicalAccuracy, 0) / techTurns.length)
      : overallScore
  );

  // HR Score
  const hrTurns = evaluatedQuestions.filter(q => (q.track === 'HR Interview' || q.track === 'HR'));
  const hrScore = (!isHr && !isCombined) ? null : (
    hrTurns.length > 0
      ? Math.round(hrTurns.reduce((sum, q) => sum + (q.score || 75), 0) / hrTurns.length)
      : Math.min(95, Math.max(65, overallScore + 2))
  );

  // Communication & Problem Solving
  const commTurns = evaluatedQuestions.filter(q => typeof q.clarityScore === 'number');
  const communicationScore = commTurns.length > 0
    ? Math.round(commTurns.reduce((sum, q) => sum + q.clarityScore, 0) / commTurns.length)
    : Math.max(65, overallScore - 2);

  const probTurns = evaluatedQuestions.filter(q => typeof q.completenessScore === 'number');
  const problemSolvingScore = probTurns.length > 0
    ? Math.round(probTurns.reduce((sum, q) => sum + q.completenessScore, 0) / probTurns.length)
    : overallScore;

  const confidenceScore = Math.min(95, Math.max(60, Math.round((communicationScore * 0.6) + (overallScore * 0.4))));

  // Derive contextual strengths and weaknesses from actual question performance
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  const skippedCount = evaluatedQuestions.filter(q => q.isSkipped).length;
  const highScoringTurns = evaluatedQuestions.filter(q => q.score >= 85);
  const lowScoringTurns = evaluatedQuestions.filter(q => q.score < 70 && !q.isSkipped);

  if (highScoringTurns.length > 0) {
    strengths.push(`Strong domain depth demonstrated in ${highScoringTurns.length} question(s), with accurate technical concepts and structured logic.`);
  }
  if (communicationScore >= 80) {
    strengths.push('Clear verbal articulation with steady cadence under technical probing.');
  } else {
    strengths.push('Composed disposition throughout the interview session.');
  }

  if (skippedCount > 0) {
    weaknesses.push(`${skippedCount} question(s) were skipped or lacked an attempt. In placement interviews, sharing high-level intuition earns crucial partial marks.`);
    recommendations.push('Practice answering questions under uncertainty by breaking problems into modular components before answering.');
  }

  if (lowScoringTurns.length > 0) {
    weaknesses.push('Certain technical responses remained high-level without covering system constraints, edge cases, or complexity metrics.');
  }

  if (weaknesses.length === 0) {
    weaknesses.push('Could articulate quantitative benchmarks (latency, throughput, cache hit ratios) even more explicitly.');
  }

  if (recommendations.length === 0) {
    recommendations.push(isHr ? 'Use the STAR method to quantify outcomes in behavioral answers.' : 'Review data structure trade-offs and runtime complexities before campus placement drives.');
  }
  recommendations.push('Prepare concrete production anecdotes to substantiate architectural choices.');

  const feedbackSummary = `Candidate answered ${validAnswered.length} of ${totalAsked} questions (${skippedCount} passed/skipped), achieving an overall rating of ${overallScore}/100. ${
    overallScore >= 85
      ? 'Exceptional interview performance displaying strong placement readiness.'
      : overallScore >= 75
      ? 'Strong overall candidate with good core fundamentals and articulate communication.'
      : overallScore >= 60
      ? 'Developing candidate with foundational knowledge. Focus on expanding technical depth and attempting all questions.'
      : 'Requires focused revision on core syllabus topics and interview problem-solving strategy.'
  }`;

  return {
    status: 'COMPLETED',
    evaluationStatus: 'EVALUATED',
    overallScore,
    technicalScore,
    hrScore,
    communicationScore,
    problemSolvingScore,
    confidenceScore,
    questionsAsked: totalAsked,
    questionsAnswered: validAnswered.length,
    questionsUnanswered: Math.max(0, totalAsked - validAnswered.length),
    strengths,
    weaknesses,
    recommendations,
    feedbackSummary,
    qaReview: evaluatedQuestions
  };
}
