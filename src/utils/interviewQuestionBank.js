/**
 * Frontend Interview Question Bank & Anti-Repetition Engine
 * Mirrors the backend question bank and semantic deduplication engine.
 */

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
  'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have',
  'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t',
  'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than',
  'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
  'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s',
  'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with',
  'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves', 'tell', 'explain', 'describe', 'briefly', 'difference', 'mean', 'concept', 'example', 'work', 'works',
  'say', 'said', 'please', 'hello', 'welcome', 'candidate'
]);

const SYNONYMS = {
  'dbms': 'database',
  'db': 'database',
  'databases': 'database',
  'indexes': 'index',
  'indexing': 'index',
  'indexed': 'index',
  'indices': 'index',
  'mutability': 'mutable',
  'immutability': 'immutable',
  'counting': 'count',
  'objects': 'object',
  'normalizing': 'normalization',
  'normalized': 'normalization',
  'rerender': 're-render',
  'rerendering': 're-render',
  're-rendering': 're-render',
  're-renders': 're-render',
  'rerenders': 're-render',
  'generators': 'generator',
  'decorators': 'decorator',
  'closures': 'closure',
  'coroutines': 'coroutine',
  'transactions': 'transaction',
  'queries': 'query',
  'joins': 'join',
  'threads': 'thread',
  'processes': 'process',
  'locks': 'lock',
  'locking': 'lock',
  'caches': 'cache',
  'caching': 'cache',
  'functions': 'function',
  'components': 'component',
  'hooks': 'hook',
  'shards': 'shard',
  'sharding': 'shard'
};

export function normalizeQuestionText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractConceptTokens(text) {
  const normalized = normalizeQuestionText(text);
  const words = normalized.split(/\s+/).filter(Boolean);
  return words
    .filter(w => !STOPWORDS.has(w) && w.length > 2)
    .map(w => SYNONYMS[w] || w);
}

const DISTINCT_TECHNICAL_CONCEPTS = [
  'normalization', 'bcnf', '1nf', '2nf', '3nf',
  'btree', 'b-tree', 'clustered', 'non-clustered',
  'acid', 'wal', 'write-ahead', 'mvcc',
  'gil', 'global-interpreter-lock', 'mutability', 'mutable', 'immutable',
  'reference-counting', 'garbage-collection',
  'virtual-dom', 'reconciliation', 'diffing', 'fiber',
  'useeffect', 'uselayouteffect', 'usememo', 'usecallback',
  'context-api', 'redux', 'zustand',
  'window-function', 'row_number', 'dense_rank',
  'cap-theorem', 'pacelc', 'sharding', 'consistent-hashing',
  'event-loop', 'libuv', 'microtask', 'macrotask', 'backpressure',
  'dijkstra', 'bellman-ford', 'sliding-window', 'two-pointer',
  'star-method', 'conflict-resolution'
];

export function isSemanticallySimilar(q1Text, q2Text) {
  if (!q1Text || !q2Text) return false;

  const norm1 = normalizeQuestionText(q1Text);
  const norm2 = normalizeQuestionText(q2Text);

  if (norm1 === norm2) return true;
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    if (Math.min(norm1.length, norm2.length) > 20) return true;
  }

  const tokens1 = extractConceptTokens(q1Text);
  const tokens2 = extractConceptTokens(q2Text);

  if (tokens1.length === 0 || tokens2.length === 0) return false;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  for (const concept of DISTINCT_TECHNICAL_CONCEPTS) {
    if (set1.has(concept) && set2.has(concept)) {
      return true;
    }
  }

  let intersectionCount = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      intersectionCount += 1;
    }
  }

  const unionCount = new Set([...tokens1, ...tokens2]).size;
  const jaccard = unionCount > 0 ? intersectionCount / unionCount : 0;

  if (jaccard >= 0.45) return true;
  if (intersectionCount >= 2 && (intersectionCount / Math.min(tokens1.length, tokens2.length)) >= 0.6) {
    return true;
  }

  return false;
}

export const QUESTION_POOLS = {
  'Python': [
    {
      id: 'py_mem_01',
      topic: 'Memory Management & Mutability',
      difficulty: 'BASIC',
      question: 'In Python, how does memory management work with reference counting and garbage collection, and what is the difference between mutable and immutable objects?',
      followUp: 'What specific complications arise when dealing with circular references, and how does the generational cyclic garbage collector resolve them?'
    },
    {
      id: 'py_decor_02',
      topic: 'Decorators & Closures',
      difficulty: 'INTERMEDIATE',
      question: 'Can you explain how Python decorators work under the hood using closures, and how you would design a decorator that accepts custom configuration arguments?',
      followUp: 'Why is functools.wraps essential when creating decorators, and what happens to introspection metadata if it is omitted?'
    },
    {
      id: 'py_gen_03',
      topic: 'Generators & Memory Streaming',
      difficulty: 'INTERMEDIATE',
      question: 'How do Python generators and the yield keyword work internally, and what specific memory advantages do they offer when streaming large datasets over list comprehensions?',
      followUp: 'Can you explain the difference between yield and yield from, and how generator state is preserved across multiple next() calls?'
    },
    {
      id: 'py_gil_04',
      topic: 'Global Interpreter Lock (GIL)',
      difficulty: 'ADVANCED',
      question: 'Can you explain the Global Interpreter Lock (GIL) in CPython and how it fundamentally impacts CPU-bound versus I/O-bound multithreaded applications?',
      followUp: 'When architecting a CPU-intensive Python service, how would you design around the GIL using multiprocessing or worker pools?'
    },
    {
      id: 'py_async_05',
      topic: 'Asyncio & Coroutines',
      difficulty: 'ADVANCED',
      question: 'How does Python\'s asyncio event loop schedule and execute coroutines, and how does cooperative multitasking differ from OS-level threading?',
      followUp: 'What happens if a CPU-intensive blocking operation is executed inside an async coroutine without run_in_executor?'
    }
  ],
  'React.js': [
    {
      id: 'react_vdom_01',
      topic: 'Virtual DOM & Reconciliation',
      difficulty: 'BASIC',
      question: 'How does the React Virtual DOM diffing algorithm work, and why are stable unique keys essential for efficient list reconciliation?',
      followUp: 'What specific rendering bugs and performance penalties occur when an array index is used as a component key in dynamic lists?'
    },
    {
      id: 'react_hooks_02',
      topic: 'Hooks & Dependency Semantics',
      difficulty: 'INTERMEDIATE',
      question: 'Can you explain the difference between useEffect and useLayoutEffect, and how React 18 concurrent rendering affects state batching and updates?',
      followUp: 'How do you prevent infinite re-render loops when an object or function reference is passed into a useEffect dependency array?'
    },
    {
      id: 'react_perf_03',
      topic: 'Rendering Optimization & Memoization',
      difficulty: 'ADVANCED',
      question: 'When optimizing a React application, how do you determine when to use React.memo, useMemo, and useCallback, and what are the overhead costs of over-memoization?',
      followUp: 'How do you profile component re-render trees using React DevTools to detect unnecessary re-renders?'
    }
  ],
  'SQL': [
    {
      id: 'sql_idx_01',
      topic: 'Clustered vs Non-Clustered Indexes',
      difficulty: 'BASIC',
      question: 'What is the difference between Clustered and Non-Clustered indexes, and how do B-Tree structures optimize query retrieval in relational databases?',
      followUp: 'What are the performance trade-offs of creating multiple indexes on a table subjected to high-throughput write operations?'
    },
    {
      id: 'sql_acid_02',
      topic: 'ACID & Transaction Isolation',
      difficulty: 'INTERMEDIATE',
      question: 'Can you explain the ACID properties in database transactions and how isolation levels prevent dirty reads, non-repeatable reads, and phantom reads?',
      followUp: 'What occurs under Read Committed versus Serializable isolation when two concurrent transactions attempt to update the same record?'
    },
    {
      id: 'sql_win_03',
      topic: 'Window Functions & Query Optimization',
      difficulty: 'ADVANCED',
      question: 'How do window functions like ROW_NUMBER(), RANK(), and DENSE_RANK() differ, and in what query scenarios do you use them over GROUP BY?',
      followUp: 'How would you analyze a slow query using EXPLAIN ANALYZE to identify sequential table scans or missing composite indexes?'
    }
  ],
  'DBMS': [
    {
      id: 'dbms_norm_01',
      topic: 'Database Normalization',
      difficulty: 'BASIC',
      question: 'Can you explain Database Normalization up to 3NF and BCNF, and when might intentional denormalization be justified in production architectures?',
      followUp: 'What specific anomalies—insertion, update, and deletion—are eliminated when transitioning a relational schema from 2NF to 3NF?'
    },
    {
      id: 'dbms_concurr_02',
      topic: 'Concurrency Control & Locking',
      difficulty: 'INTERMEDIATE',
      question: 'What is the difference between optimistic concurrency control and pessimistic locking in relational database engines?',
      followUp: 'Under what specific conditions can deadlocks occur in two-phase locking, and how does the engine detect and break them?'
    }
  ],
  'Data Structures': [
    {
      id: 'ds_bst_01',
      topic: 'Binary Search Trees & Complexity',
      difficulty: 'BASIC',
      question: 'Can you explain how a Binary Search Tree maintains ordering, and analyze its worst-case versus average-case time complexities for insertion and lookup?',
      followUp: 'How do self-balancing trees like AVL or Red-Black trees guarantee O(log N) lookup under skewed insertion sequences?'
    },
    {
      id: 'ds_hash_02',
      topic: 'Hash Maps & Collision Resolution',
      difficulty: 'INTERMEDIATE',
      question: 'How does a Hash Table resolve collisions using separate chaining versus open addressing, and what determines its optimal load factor?',
      followUp: 'What is the impact of clustering on search performance in open addressing with linear probing versus quadratic probing?'
    }
  ],
  'Algorithms': [
    {
      id: 'algo_sort_01',
      topic: 'Divide & Conquer',
      difficulty: 'BASIC',
      question: 'Explain the Divide and Conquer paradigm using Quicksort or Mergesort, and analyze their respective time and space complexities.',
      followUp: 'Why is Mergesort preferred for sorting linked lists while Quicksort is often preferred for in-place array sorting in memory?'
    },
    {
      id: 'algo_dp_02',
      topic: 'Dynamic Programming',
      difficulty: 'INTERMEDIATE',
      question: 'How do you identify whether a problem should be solved with Dynamic Programming, and what is the difference between Top-Down Memoization and Bottom-Up Tabulation?',
      followUp: 'Can you walk through the state definition, recurrence relation, and base cases for the 0/1 Knapsack problem?'
    }
  ],
  'HR': [
    {
      id: 'hr_intro_01',
      topic: 'Introduction & Career Trajectory',
      difficulty: 'BASIC',
      question: 'Can you walk me through your engineering journey, key academic or technical milestones, and why you are excited about this placement opportunity?',
      followUp: 'Looking at your technical interests, what is a specific domain or engineering technology you are actively striving to master this year?'
    },
    {
      id: 'hr_conflict_02',
      topic: 'Conflict Resolution & Team Collaboration',
      difficulty: 'INTERMEDIATE',
      question: 'Describe a situation in a team project where you had a significant technical or organizational disagreement with a peer. How did you navigate the conversation and what was the outcome?',
      followUp: 'If you had to do that project again today, what would you do differently to improve team alignment earlier?'
    },
    {
      id: 'hr_pressure_03',
      topic: 'Pressure, Deadlines & Prioritization',
      difficulty: 'SCENARIO',
      question: 'Tell me about a time when you had to deliver on an aggressive project deadline with incomplete specifications or sudden roadblocks. How did you prioritize tasks?',
      followUp: 'How did you communicate with stakeholders or teammates when unexpected hurdles threatened the scheduled delivery?'
    }
  ]
};

export function resolveSkillKey(skillName = '') {
  if (!skillName) return 'Data Structures';
  const clean = skillName.trim().toLowerCase();
  if (clean.includes('python')) return 'Python';
  if (clean.includes('react')) return 'React.js';
  if (clean.includes('sql') || clean.includes('postgres') || clean.includes('mysql')) return 'SQL';
  if (clean.includes('dbms') || clean.includes('database')) return 'DBMS';
  if (clean.includes('data structure') || clean.includes('dsa') || clean.includes('tree') || clean.includes('graph')) return 'Data Structures';
  if (clean.includes('algo') || clean.includes('dynamic program')) return 'Algorithms';
  if (clean.includes('hr') || clean.includes('behavioral') || clean.includes('management')) return 'HR';
  return 'Data Structures';
}

export function pickIntelligentNextQuestion({
  selectedSkills = [],
  track = 'Technical Interview',
  sessionQuestionHistory = [],
  crossSessionHistory = [],
  isFollowUp = false,
  previousQuestion = null
}) {
  const isHr = (track === 'HR' || track === 'HR Interview');

  if (isHr) {
    const hrPool = QUESTION_POOLS['HR'];
    const askedIds = new Set(sessionQuestionHistory.map(q => q.questionId));

    if (isFollowUp && previousQuestion) {
      const parentObj = hrPool.find(q => isSemanticallySimilar(q.question, previousQuestion.questionText));
      if (parentObj && parentObj.followUp) {
        return {
          questionText: parentObj.followUp,
          skill: 'HR',
          topic: parentObj.topic,
          difficulty: 'INTERMEDIATE',
          isFollowUp: true,
          parentQuestionId: previousQuestion.questionId || null
        };
      }
    }

    const availableMain = hrPool.filter(cand => {
      const inCurrent = sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, cand.question));
      const inPast = crossSessionHistory.some(past => isSemanticallySimilar(past, cand.question));
      return !inCurrent && !inPast;
    });

    const chosen = availableMain.length > 0 ? availableMain[0] : hrPool[sessionQuestionHistory.length % hrPool.length];
    return {
      questionText: chosen.question,
      skill: 'HR',
      topic: chosen.topic,
      difficulty: chosen.difficulty,
      isFollowUp: false,
      parentQuestionId: null
    };
  }

  const rawSkills = Array.isArray(selectedSkills) && selectedSkills.length > 0
    ? selectedSkills
    : ['Data Structures', 'Algorithms', 'SQL', 'Python'];

  const uniqueSkills = [...new Set(rawSkills.map(resolveSkillKey))];

  if (isFollowUp && previousQuestion) {
    const prevSkill = resolveSkillKey(previousQuestion.skill) || uniqueSkills[0];
    const skillPool = QUESTION_POOLS[prevSkill] || QUESTION_POOLS['Data Structures'];

    const parentObj = skillPool.find(q => isSemanticallySimilar(q.question, previousQuestion.questionText));
    if (parentObj && parentObj.followUp) {
      const alreadyAskedFollowUp = sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, parentObj.followUp));
      if (!alreadyAskedFollowUp) {
        return {
          questionText: parentObj.followUp,
          skill: prevSkill,
          topic: parentObj.topic,
          difficulty: 'ADVANCED',
          isFollowUp: true,
          parentQuestionId: previousQuestion.questionId || null
        };
      }
    }
  }

  const skillCountMap = {};
  for (const skill of uniqueSkills) {
    skillCountMap[skill] = 0;
  }
  for (const item of sessionQuestionHistory) {
    const s = resolveSkillKey(item.skill);
    if (s && skillCountMap[s] !== undefined) {
      skillCountMap[s] += 1;
    }
  }

  const sortedSkills = [...uniqueSkills].sort((a, b) => skillCountMap[a] - skillCountMap[b]);

  for (const targetSkill of sortedSkills) {
    const pool = QUESTION_POOLS[targetSkill] || [];

    const freshForStudent = pool.filter(cand => {
      const inCurrent = sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, cand.question));
      const inPast = crossSessionHistory.some(pastText => isSemanticallySimilar(pastText, cand.question));
      return !inCurrent && !inPast;
    });

    if (freshForStudent.length > 0) {
      const chosen = freshForStudent[Math.floor(Math.random() * freshForStudent.length)];
      return {
        questionText: chosen.question,
        skill: targetSkill,
        topic: chosen.topic,
        difficulty: chosen.difficulty,
        isFollowUp: false,
        parentQuestionId: null
      };
    }

    const freshInSessionOnly = pool.filter(cand => {
      return !sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, cand.question));
    });

    if (freshInSessionOnly.length > 0) {
      const chosen = freshInSessionOnly[Math.floor(Math.random() * freshInSessionOnly.length)];
      return {
        questionText: chosen.question,
        skill: targetSkill,
        topic: chosen.topic,
        difficulty: chosen.difficulty,
        isFollowUp: false,
        parentQuestionId: null
      };
    }
  }

  const fallbackSkill = sortedSkills[0] || 'Technical Skills';
  return {
    questionText: `Can you explain a complex architectural or performance challenge you faced when building with ${fallbackSkill}, and detail the engineering trade-offs you evaluated?`,
    skill: fallbackSkill,
    topic: 'Architectural Trade-offs',
    difficulty: 'SCENARIO',
    isFollowUp: false,
    parentQuestionId: null
  };
}

