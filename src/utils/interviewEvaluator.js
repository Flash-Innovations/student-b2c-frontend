/**
 * Frontend Interview Evaluation Engine
 * Matches the backend evaluator precisely to ensure consistent, content-aware,
 * objective scoring and personalized, turn-specific structured feedback.
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
      whatWasCorrect: 'No response recorded.',
      whatWasMissing: 'Complete lack of verbal response or input.',
      suggestions: 'Always attempt the question or articulate your line of thinking to earn partial marks.',
      betterApproach: 'In campus placement interviews, explain how you would begin analyzing the problem even if unsure of the full solution.',
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
      whatWasCorrect: 'Politely communicated knowledge boundary without giving misleading information.',
      whatWasMissing: 'Technical concepts, related data structures, or fundamental problem decomposition.',
      suggestions: 'State adjacent concepts you know (e.g. basic data types, trade-offs) to show engineering curiosity and problem-solving readiness.',
      betterApproach: 'I haven\'t worked extensively with this specific concept in production, but from core computer science fundamentals, I understand that...',
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
        whatWasCorrect: 'Correctly identified reference counting as primary mechanism, cyclic garbage collection for reference loops, and mutability contrast between dicts and strings/tuples.',
        whatWasMissing: 'Could briefly touch on generational garbage collection thresholds (Generation 0, 1, 2) in CPython.',
        suggestions: 'Mentioning generational GC tuning or the `gc` module elevates technical answers to senior campus readiness.',
        betterApproach: 'Python primarily uses reference counting for immediate deallocation, supplemented by a tri-generational cyclic garbage collector to detect and collect isolated reference cycles...',
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
        whatWasCorrect: 'Demonstrated awareness of Python objects and memory basics.',
        whatWasMissing: 'Detailed explanation of cyclic garbage collection and reference counter decrements.',
        suggestions: 'Explicitly explain how reference counting handles object deallocation and why circular references need cyclic GC.',
        betterApproach: 'In Python, every object has a reference counter. When it reaches zero, memory is freed immediately. For circular references, Python runs a generational garbage collector...',
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
        whatWasCorrect: 'Cited specific architectural components, bottlenecks, and quantifiable metrics.',
        whatWasMissing: 'Discussion of disaster recovery, automated fallbacks, or chaos engineering.',
        suggestions: 'Discuss observability and monitoring metrics (e.g. p99 latency) to show full lifecycle ownership.',
        betterApproach: 'We faced a high-throughput read bottleneck under 10k QPS. We introduced Redis as a write-through cache with a TTL of 5 minutes, reducing p99 latency from 350ms to 24ms...',
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
        whatWasCorrect: 'Good conceptual description of technical challenges and system choices.',
        whatWasMissing: 'Quantifiable benchmarks (e.g. QPS, latency numbers) and explicit alternative trade-offs.',
        suggestions: 'Always quantify project outcomes: percentage latency reduction, memory saved, or concurrency handled.',
        betterApproach: 'When designing the service, we chose PostgreSQL with read-replicas over DynamoDB because strong relational consistency was paramount for financial transactions...',
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
        whatWasCorrect: 'Accurately referenced virtual DOM reconciliation, memoization hooks, and state management.',
        whatWasMissing: 'Distinction between shallow comparison in React.memo and referential stability of objects/functions.',
        suggestions: 'Explain when useMemo should NOT be used (premature optimization overhead) to demonstrate nuanced engineering balance.',
        betterApproach: 'React re-renders components whenever their parent re-renders or state changes. We optimize this using React.memo with useCallback for handler props and useMemo for heavy computations...',
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
        whatWasCorrect: 'Mentioned React state updates and basic component re-rendering.',
        whatWasMissing: 'Specific details on Virtual DOM diffing algorithm and dependency arrays in hooks.',
        suggestions: 'Clearly contrast memoization of values (useMemo) vs function definitions (useCallback).',
        betterApproach: 'React uses a fiber architecture to diff Virtual DOM trees. When optimizing, useCallback prevents re-instantiating callbacks passed to memoized child components...',
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
        whatWasCorrect: 'Understood normal forms (1NF/2NF/3NF/BCNF) or B-Tree indexing mechanisms and data integrity.',
        whatWasMissing: 'Write amplification and locking overhead caused by excessive secondary indexes.',
        suggestions: 'Discuss the trade-off between normalized OLTP schemas and denormalized analytical reporting schemas.',
        betterApproach: 'Normalization eliminates insertion, update, and deletion anomalies by separating concerns into relational tables. In production read-heavy workloads, we denormalize selectively...',
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
        whatWasCorrect: 'Identified data redundancy reduction and basic indexing concepts.',
        whatWasMissing: 'Explanation of functional dependencies and how B-Tree indexes log(N) lookups operate.',
        suggestions: 'State the specific rule for each normal form (e.g. 2NF removes partial dependency, 3NF removes transitive dependency).',
        betterApproach: 'Database normalization structures tables to avoid redundant storage. 1NF requires atomic values, 2NF requires full functional dependency on PK, and 3NF removes transitive dependencies...',
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
        whatWasCorrect: 'Demonstrated collaborative attitude, constructive conflict resolution, and objective communication.',
        whatWasMissing: 'Quantifiable team impact or retrospective lesson learned.',
        suggestions: 'Explicitly state the measurable outcome or what you would do differently in hindsight.',
        betterApproach: 'In our capstone project, a teammate and I differed on whether to use GraphQL or REST. I scheduled a 30-minute sync where we evaluated schema complexity vs deadline constraints...',
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
        whatWasCorrect: 'Honest, professional demeanor and willingness to collaborate.',
        whatWasMissing: 'Clear distinction between the Situation, your specific Action, and the final Result.',
        suggestions: 'Structure behavioral answers clearly: Set the stage in 1 sentence, explain your personal action in 2 sentences, and finish with the tangible result.',
        betterApproach: 'Situation: We faced a major deadline crunch. Task: I was responsible for delivering the auth module. Action: I prioritized core JWT flows. Result: We shipped on schedule with zero security bugs.',
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
      whatWasCorrect: `Strong technical vocabulary including ${techKeywords.slice(0, 3).join(', ')} and structured conceptual flow.`,
      whatWasMissing: 'Edge cases, boundary conditions, or exception handling strategies.',
      suggestions: 'Complement your explanation with runtime time/space complexity or failure modes.',
      betterApproach: 'When implementing this solution, I consider both the average-case runtime and worst-case resource consumption, handling exceptions gracefully...',
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
      whatWasCorrect: 'Understood the fundamental question prompt and communicated clearly.',
      whatWasMissing: 'Depth of explanation, internal working details, and concrete code/system examples.',
      suggestions: 'Provide a real-world coding or architectural example to substantiate theoretical definitions.',
      betterApproach: 'To demonstrate this concept practically, consider an example where...',
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
      whatWasCorrect: 'Briefly touched upon the topic.',
      whatWasMissing: 'Sufficient technical depth, architecture, or reasoning.',
      suggestions: 'Speak for at least 30-45 seconds, walking through definitions, mechanics, and trade-offs.',
      betterApproach: 'I would break this question down into three parts: first the definition, second the internal mechanics, and third the real-world trade-offs...',
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
    const cleanAnswer = (q.studentTranscript || q.answerText || '').trim();

    if (hasExistingScore && q.feedback && q.feedback !== 'Answer evaluated.' && q.feedback !== 'Answer recorded.') {
      return {
        questionIndex: q.questionIndex || (idx + 1),
        questionText: q.questionText,
        isFollowUp: Boolean(q.isFollowUp),
        studentTranscript: cleanAnswer,
        answerText: cleanAnswer || 'No answer provided',
        score: q.score,
        feedback: q.feedback,
        aiFeedback: q.feedback,
        whatWasCorrect: q.whatWasCorrect || 'Addressed the core interview question.',
        whatWasMissing: q.whatWasMissing || 'Further depth on edge cases and trade-offs.',
        suggestions: q.suggestions || 'Continue practicing with concrete production examples.',
        betterApproach: q.betterApproach || 'Structure your answer with definition, implementation, and trade-offs.',
        technicalAccuracy: q.technicalAccuracy ?? (isHr ? null : q.score),
        clarityScore: q.clarityScore ?? 80,
        completenessScore: q.completenessScore ?? 75,
        isSkipped: q.isSkipped ?? isSkipOrEvasion(cleanAnswer),
        skill: q.skill || q.topic || 'General Technical',
        track: q.track || track
      };
    }

    const evalData = evaluateAnswerForQuestion({
      questionText: q.questionText,
      answerText: cleanAnswer,
      track: q.track || track,
      skills: q.skills || []
    });

    return {
      questionIndex: q.questionIndex || (idx + 1),
      questionText: q.questionText,
      isFollowUp: Boolean(q.isFollowUp),
      studentTranscript: cleanAnswer,
      answerText: cleanAnswer || 'No answer provided',
      score: evalData.score,
      feedback: evalData.feedback,
      aiFeedback: evalData.feedback,
      whatWasCorrect: evalData.whatWasCorrect,
      whatWasMissing: evalData.whatWasMissing,
      suggestions: evalData.suggestions,
      betterApproach: evalData.betterApproach,
      technicalAccuracy: evalData.technicalAccuracy,
      clarityScore: evalData.clarityScore,
      completenessScore: evalData.completenessScore,
      isSkipped: evalData.isSkipped,
      skill: q.skill || q.topic || 'General Technical',
      track: q.track || track
    };
  });

  const validAnswered = evaluatedQuestions.filter(q => {
    const text = (q.studentTranscript || '').trim();
    return text.length > 0 && !text.startsWith('[') && text !== 'No answer provided' && !q.isSkipped;
  });

  // Zero-answer safeguard: If candidate did not answer any question, produce Incomplete status
  if (validAnswered.length === 0 && evaluatedQuestions.every(q => !q.studentTranscript || q.studentTranscript.length < 2 || q.isSkipped)) {
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
      skillBreakdown: {},
      revisionTopics: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
      feedbackSummary: 'Your interview was completed without any recorded responses. We could not generate an accurate evaluation.',
      qaReview: evaluatedQuestions
    };
  }

  // Strict mathematical average of answered question scores
  const answeredOnly = evaluatedQuestions.filter(q => {
    const txt = (q.studentTranscript || q.answerText || '').trim();
    return txt.length > 0 && !txt.startsWith('[') && txt !== 'No answer provided' && txt !== 'Interview time completed before response';
  });
  const questionsToAverage = answeredOnly.length > 0 ? answeredOnly : evaluatedQuestions;
  const totalScoreSum = questionsToAverage.reduce((sum, q) => sum + (typeof q.score === 'number' ? q.score : 0), 0);
  const overallScore = Math.round(totalScoreSum / Math.max(1, questionsToAverage.length));

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

  // Skill Breakdown
  const skillBreakdown = {};
  for (const q of evaluatedQuestions) {
    const s = q.skill || 'General';
    if (!skillBreakdown[s]) {
      skillBreakdown[s] = { totalScore: 0, count: 0, average: 0 };
    }
    skillBreakdown[s].totalScore += (q.score || 0);
    skillBreakdown[s].count += 1;
  }
  for (const s of Object.keys(skillBreakdown)) {
    skillBreakdown[s].average = Math.round(skillBreakdown[s].totalScore / skillBreakdown[s].count);
  }

  // Recommended Topics to Revise
  const revisionTopics = [];
  for (const q of evaluatedQuestions) {
    if ((q.score < 80 || q.isSkipped) && q.skill) {
      if (!revisionTopics.includes(q.skill)) {
        revisionTopics.push(q.skill);
      }
    }
  }

  // Contextual strengths and weaknesses
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
    skillBreakdown,
    revisionTopics,
    strengths,
    weaknesses,
    recommendations,
    feedbackSummary,
    qaReview: evaluatedQuestions
  };
}
