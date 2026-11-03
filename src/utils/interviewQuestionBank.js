/**
 * Frontend Interview Question Bank & Anti-Repetition Engine
 * Mirrors the backend question bank and semantic deduplication engine.
 * Tailored for campus placement preparation focusing on Easy-to-Medium core questions.
 */

export const STOPWORDS = new Set([
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

export const SYNONYMS = {
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

export const DISTINCT_TECHNICAL_CONCEPTS = [
  'normalization', 'bcnf', '1nf', '2nf', '3nf',
  'btree', 'b-tree', 'clustered', 'non-clustered',
  'acid', 'wal', 'write-ahead', 'mvcc',
  'gil', 'global-interpreter-lock',
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
      id: 'py_fund_01',
      topic: 'Lists vs Tuples & Mutability',
      difficulty: 'EASY',
      question: 'What is the difference between a list and a tuple in Python, and what makes lists mutable while tuples are immutable?',
      followUp: 'How would you convert a list to a tuple, and in what practical placement scenario would you prefer using a tuple over a list?'
    },
    {
      id: 'py_dict_02',
      topic: 'Dictionaries & Key-Value Operations',
      difficulty: 'EASY',
      question: 'What are Python dictionaries, and how do they store and retrieve data using keys?',
      followUp: 'Can a mutable object like a list be used as a dictionary key in Python? Why or why not?'
    },
    {
      id: 'py_func_03',
      topic: 'Functions & Parameter Handling',
      difficulty: 'EASY',
      question: 'What is a function in Python, and what is the difference between *args and **kwargs when passing arguments?',
      followUp: 'What are lambda functions in Python and how do they differ from standard functions defined with def?'
    },
    {
      id: 'py_excep_04',
      topic: 'Exception Handling',
      difficulty: 'MEDIUM',
      question: 'How does exception handling work in Python using try, except, else, and finally blocks?',
      followUp: 'What is the purpose of the finally block, and does it execute if an exception is raised in the try block?'
    },
    {
      id: 'py_decor_05',
      topic: 'Decorators & Higher-Order Functions',
      difficulty: 'MEDIUM',
      question: 'What are decorators in Python, and how do they allow you to modify or extend the behavior of a function without altering its source code?',
      followUp: 'Can you give a practical example where a decorator is useful, such as measuring function execution time or logging?'
    },
    {
      id: 'py_dedup_06',
      topic: 'List Manipulation & Deduplication',
      difficulty: 'MEDIUM',
      question: 'How would you remove duplicate elements from a list in Python while maintaining the original insertion order?',
      followUp: 'What is the time complexity of converting a list to a set to remove duplicates, and why does a standard set lose the original order?'
    },
    {
      id: 'py_mem_07',
      topic: 'Memory Management & Mutability',
      difficulty: 'MEDIUM',
      question: 'In Python, how does memory management work with reference counting and garbage collection, and what is the difference between mutable and immutable objects?',
      followUp: 'What specific complications arise when dealing with circular references, and how does the generational cyclic garbage collector resolve them?'
    }
  ],

  'JavaScript': [
    {
      id: 'js_var_01',
      topic: 'Variable Declarations (var, let, const)',
      difficulty: 'EASY',
      question: 'What is the difference between var, let, and const in JavaScript regarding scope, re-assignment, and hoisting?',
      followUp: 'What is the Temporal Dead Zone (TDZ) in JavaScript when accessing let or const variables before their declaration?'
    },
    {
      id: 'js_equality_02',
      topic: 'Equality Operators & Type Coercion',
      difficulty: 'EASY',
      question: 'What is the difference between the double equals (==) and triple equals (===) operators in JavaScript?',
      followUp: 'What is type coercion, and can you give a common example where loose equality produces an unexpected result?'
    },
    {
      id: 'js_array_03',
      topic: 'Array Methods & Iteration',
      difficulty: 'EASY',
      question: 'What is the difference between map(), filter(), and forEach() array methods in JavaScript?',
      followUp: 'Do map() and filter() mutate the original array, and why is immutability preferred in modern web applications?'
    },
    {
      id: 'js_promises_04',
      topic: 'Promises & Asynchronous Programming',
      difficulty: 'MEDIUM',
      question: 'What are Promises in JavaScript, and what are their three states (pending, fulfilled, rejected)?',
      followUp: 'How does async/await make asynchronous code easier to write and debug compared to traditional promise chaining with .then()?'
    },
    {
      id: 'js_eventloop_05',
      topic: 'Event Loop & Call Stack',
      difficulty: 'MEDIUM',
      question: 'Can you explain how the JavaScript Event Loop works with the Call Stack, Microtask Queue (Promises), and Macrotask Queue (setTimeout)?',
      followUp: 'In what order will logs print when mixing a synchronous console.log, setTimeout with 0ms, and Promise.resolve().then()?'
    },
    {
      id: 'js_closures_06',
      topic: 'Closures & Lexical Scope',
      difficulty: 'MEDIUM',
      question: 'What is a closure in JavaScript, and how does an inner function retain access to variables in its outer enclosing scope?',
      followUp: 'How can closures be used in practical web development to create private variables or encapsulated counters?'
    }
  ],

  'React.js': [
    {
      id: 'react_fund_01',
      topic: 'React Components & JSX',
      difficulty: 'EASY',
      question: 'What is React, what are components, and what is the difference between functional components and class components?',
      followUp: 'Why does modern React prioritize functional components combined with React Hooks?'
    },
    {
      id: 'react_props_state_02',
      topic: 'Props vs State',
      difficulty: 'EASY',
      question: 'What is the difference between props and state in React, and can a child component modify props passed by its parent?',
      followUp: 'How can a child component communicate changes or send data back up to its parent component?'
    },
    {
      id: 'react_usestate_03',
      topic: 'useState Hook',
      difficulty: 'EASY',
      question: 'What is the useState hook in React, and how does calling the state setter function trigger a component re-render?',
      followUp: 'Why should you never mutate state directly (such as count = count + 1) instead of using the provided setter function?'
    },
    {
      id: 'react_useeffect_04',
      topic: 'useEffect vs useMemo',
      difficulty: 'MEDIUM',
      question: 'What is the difference between the useEffect hook and the useMemo hook in React, and when should you use each?',
      followUp: 'What happens if you provide an empty dependency array [] to useEffect versus omitting the dependency array entirely?'
    },
    {
      id: 'react_keys_05',
      topic: 'List Rendering & Keys',
      difficulty: 'MEDIUM',
      question: 'Why are unique and stable keys required when rendering lists of elements in React?',
      followUp: 'What visual or performance bugs occur if an array index is used as a key when items are dynamically reordered, inserted, or deleted?'
    },
    {
      id: 'react_state_mgmt_06',
      topic: 'State Management & Context API',
      difficulty: 'MEDIUM',
      question: 'How does state management work in React when multiple distant components need to share the same data?',
      followUp: 'What is prop drilling, and how does the React Context API help solve it without external libraries?'
    }
  ],

  'SQL': [
    {
      id: 'sql_keys_01',
      topic: 'Primary Key vs Foreign Key',
      difficulty: 'EASY',
      question: 'What is the difference between a Primary Key and a Foreign Key in a relational database?',
      followUp: 'Can a table have multiple Foreign Keys? Can a table have multiple Primary Keys?'
    },
    {
      id: 'sql_where_having_02',
      topic: 'WHERE vs HAVING Clauses',
      difficulty: 'EASY',
      question: 'What is the difference between the WHERE clause and the HAVING clause in SQL?',
      followUp: 'Can you use aggregate functions like COUNT() or AVG() inside a WHERE clause? Why or why not?'
    },
    {
      id: 'sql_joins_03',
      topic: 'INNER JOIN vs LEFT JOIN',
      difficulty: 'EASY',
      question: 'What is a SQL JOIN, and what is the difference between an INNER JOIN and a LEFT OUTER JOIN?',
      followUp: 'What does a LEFT JOIN produce for rows in the left table that have no matching records in the right table?'
    },
    {
      id: 'sql_second_salary_04',
      topic: 'Subqueries & Second Highest Salary',
      difficulty: 'MEDIUM',
      question: 'How would you write a SQL query to find the second highest salary from an Employee table?',
      followUp: 'How can you handle ties if two or more employees share the highest salary?'
    },
    {
      id: 'sql_indexes_05',
      topic: 'Database Indexes',
      difficulty: 'MEDIUM',
      question: 'What is an index in a database, and how does it speed up search queries? When can an index negatively impact performance?',
      followUp: 'What is the difference between a clustered index and a non-clustered index?'
    },
    {
      id: 'sql_delete_truncate_06',
      topic: 'DELETE vs TRUNCATE vs DROP',
      difficulty: 'MEDIUM',
      question: 'What is the difference between DELETE, TRUNCATE, and DROP statements in SQL?',
      followUp: 'Which of DELETE and TRUNCATE can be rolled back in a transaction in databases like MySQL or PostgreSQL?'
    }
  ],

  'DBMS': [
    {
      id: 'dbms_norm_01',
      topic: 'Normalization Fundamentals',
      difficulty: 'EASY',
      question: 'What is normalization in DBMS, and what are insertion, deletion, and update anomalies that it helps prevent?',
      followUp: 'What is the main goal of database normalization in relational schema design?'
    },
    {
      id: 'dbms_acid_02',
      topic: 'ACID Properties',
      difficulty: 'EASY',
      question: 'What are ACID properties in database management systems, and why are they crucial for reliable transaction processing?',
      followUp: 'Using a bank transfer scenario, can you explain the Atomicity and Consistency properties?'
    },
    {
      id: 'dbms_keys_03',
      topic: 'Candidate, Primary, and Super Keys',
      difficulty: 'EASY',
      question: 'What is the difference between a Super Key, a Candidate Key, and a Primary Key in DBMS?',
      followUp: 'What is the difference between a Primary Key and a Unique Key constraint?'
    },
    {
      id: 'dbms_forms_04',
      topic: '1NF, 2NF, and 3NF Normal Forms',
      difficulty: 'MEDIUM',
      question: 'Can you walk through the rules for First Normal Form (1NF), Second Normal Form (2NF), and Third Normal Form (3NF)?',
      followUp: 'What is partial dependency versus transitive dependency, and which normal form eliminates each?'
    },
    {
      id: 'dbms_trans_05',
      topic: 'Transactions & Commit/Rollback',
      difficulty: 'MEDIUM',
      question: 'What is a transaction in DBMS, and what states does it transition through from active to committed or aborted?',
      followUp: 'What happens during a database rollback when a transaction encounters a runtime error?'
    },
    {
      id: 'dbms_nosql_06',
      topic: 'Relational vs NoSQL Databases',
      difficulty: 'MEDIUM',
      question: 'What is the difference between SQL (relational) databases and NoSQL (document or key-value) databases?',
      followUp: 'In what scenario would you choose MongoDB over PostgreSQL for a student project or startup product?'
    }
  ],

  'Java': [
    {
      id: 'java_oop_01',
      topic: 'OOP Principles in Java',
      difficulty: 'EASY',
      question: 'What are the four core principles of Object-Oriented Programming (OOP) in Java: Encapsulation, Inheritance, Polymorphism, and Abstraction?',
      followUp: 'What is the difference between method overloading and method overriding in Java?'
    },
    {
      id: 'java_jvm_02',
      topic: 'JDK, JRE, and JVM',
      difficulty: 'EASY',
      question: 'What is the difference between JDK, JRE, and JVM in Java, and why is Java known as a platform-independent language?',
      followUp: 'What is bytecode, and how does the JVM execute it across different operating systems?'
    },
    {
      id: 'java_string_03',
      topic: 'String Immutability & StringBuilder',
      difficulty: 'EASY',
      question: 'What is the difference between String, StringBuilder, and StringBuffer in Java?',
      followUp: 'Why is the String class immutable in Java, and where are string literals stored in memory?'
    },
    {
      id: 'java_collections_04',
      topic: 'ArrayList vs LinkedList',
      difficulty: 'MEDIUM',
      question: 'What is the difference between ArrayList and LinkedList in Java Collections, and what are their time complexities for element access and insertion?',
      followUp: 'How does a HashMap work internally in Java when resolving collisions with hashCode() and equals()?'
    },
    {
      id: 'java_exceptions_05',
      topic: 'Checked vs Unchecked Exceptions',
      difficulty: 'MEDIUM',
      question: 'What is the difference between checked exceptions and unchecked (runtime) exceptions in Java?',
      followUp: 'How does the try-with-resources statement work in Java, and what interface must a resource implement?'
    },
    {
      id: 'java_interface_06',
      topic: 'Abstract Class vs Interface',
      difficulty: 'MEDIUM',
      question: 'What is the difference between an abstract class and an interface in Java, especially after Java 8 introduced default methods?',
      followUp: 'Can a Java class implement multiple interfaces? Can it extend multiple abstract classes?'
    }
  ],

  'Data Structures': [
    {
      id: 'ds_array_ll_01',
      topic: 'Arrays vs Linked Lists',
      difficulty: 'EASY',
      question: 'What is the difference between an Array and a Linked List in terms of memory allocation, insertion, and element access?',
      followUp: 'When would you prefer using a singly linked list over a dynamic array in a real software application?'
    },
    {
      id: 'ds_stack_queue_02',
      topic: 'Stacks & Queues (LIFO vs FIFO)',
      difficulty: 'EASY',
      question: 'What is the difference between a Stack and a Queue, and how do LIFO (Last-In First-Out) and FIFO (First-In First-Out) principles apply?',
      followUp: 'How can you implement a Queue data structure using two Stacks?'
    },
    {
      id: 'ds_tree_bst_03',
      topic: 'Binary Trees vs BST',
      difficulty: 'EASY',
      question: 'What is a Binary Tree, and what is the difference between a regular Binary Tree and a Binary Search Tree (BST)?',
      followUp: 'What are in-order, pre-order, and post-order traversals, and which traversal produces sorted output on a BST?'
    },
    {
      id: 'ds_cycle_04',
      topic: 'Linked List Cycle Detection',
      difficulty: 'MEDIUM',
      question: 'How would you detect a cycle or loop in a linked list? Can you explain Floyd\'s Tortoise and Hare algorithm?',
      followUp: 'What are the time and space complexities of Floyd\'s Cycle Detection algorithm?'
    },
    {
      id: 'ds_hashmap_05',
      topic: 'Hash Map Collision Handling',
      difficulty: 'MEDIUM',
      question: 'How does a Hash Table store key-value pairs, and how does it handle collisions using chaining versus open addressing?',
      followUp: 'What is the load factor in a hash table, and what happens when the load factor exceeds its threshold?'
    },
    {
      id: 'ds_heap_06',
      topic: 'Heaps & Priority Queues',
      difficulty: 'MEDIUM',
      question: 'What is a Min-Heap and a Max-Heap, and what are common real-world use cases for a Priority Queue?',
      followUp: 'What are the time complexities for inserting an element and extracting the minimum element from a binary Min-Heap?'
    }
  ],

  'Algorithms': [
    {
      id: 'algo_complexity_01',
      topic: 'Big-O Time & Space Complexity',
      difficulty: 'EASY',
      question: 'What is Big-O notation, and what is the difference between time complexity and space complexity of an algorithm?',
      followUp: 'Compare the growth rates of O(1), O(N), O(N log N), and O(N^2) as the input size scales.'
    },
    {
      id: 'algo_search_02',
      topic: 'Linear Search vs Binary Search',
      difficulty: 'EASY',
      question: 'What is the difference between Linear Search and Binary Search, and what condition must an array satisfy before Binary Search can be applied?',
      followUp: 'Why is Binary Search\'s time complexity O(log N) rather than O(N)?'
    },
    {
      id: 'algo_sort_basic_03',
      topic: 'Bubble Sort & Selection Sort',
      difficulty: 'EASY',
      question: 'How do basic sorting algorithms like Bubble Sort and Selection Sort work, and what is their average time complexity?',
      followUp: 'What does it mean for a sorting algorithm to be stable, and is Bubble Sort stable?'
    },
    {
      id: 'algo_recursion_04',
      topic: 'Recursion Fundamentals',
      difficulty: 'MEDIUM',
      question: 'What is recursion, and why is a base condition mandatory in every recursive function?',
      followUp: 'What causes a Stack Overflow error during recursive execution?'
    },
    {
      id: 'algo_quicksort_mergesort_05',
      topic: 'Merge Sort vs Quick Sort',
      difficulty: 'MEDIUM',
      question: 'What is the difference between Merge Sort and Quick Sort in terms of their divide-and-conquer strategy and worst-case time complexities?',
      followUp: 'Why is Quick Sort often faster in practice for contiguous array sorting despite its worst-case O(N^2) bound?'
    },
    {
      id: 'algo_twopointers_06',
      topic: 'Two-Pointer Technique',
      difficulty: 'MEDIUM',
      question: 'Can you explain the Two-Pointer technique or Sliding Window technique, and when would you use it over nested loops?',
      followUp: 'How would you use two pointers to check whether a given string is a palindrome in O(N) time and O(1) space?'
    }
  ],

  'HR': [
    {
      id: 'hr_intro_01',
      topic: 'Self-Introduction & Academic Background',
      difficulty: 'EASY',
      question: 'Could you introduce yourself, telling me about your educational journey, your primary technical interests, and what motivates you to begin your placement career?',
      followUp: 'What is one engineering project or academic milestone you are most proud of completing?'
    },
    {
      id: 'hr_strengths_02',
      topic: 'Strengths & Areas of Improvement',
      difficulty: 'EASY',
      question: 'What do you consider your greatest personal or technical strength, and what is one area you are actively working to improve?',
      followUp: 'What concrete steps or learning routines have you adopted recently to develop that area of improvement?'
    },
    {
      id: 'hr_conflict_03',
      topic: 'Teamwork & Conflict Resolution',
      difficulty: 'MEDIUM',
      question: 'Can you describe a situation where you worked on a team project and had a disagreement on approach or design? How did you communicate and resolve it?',
      followUp: 'What did that experience teach you about balancing technical viewpoints with team collaboration?'
    },
    {
      id: 'hr_deadline_04',
      topic: 'Handling Deadlines & Pressure',
      difficulty: 'MEDIUM',
      question: 'Tell me about a time when you faced a tight project submission deadline or competing academic priorities. How did you prioritize your tasks?',
      followUp: 'If you realize midway that a feature cannot be completed on time, how do you communicate that with teammates or leads?'
    },
    {
      id: 'hr_goals_05',
      topic: 'Career Aspirations & 3-Year Vision',
      difficulty: 'MEDIUM',
      question: 'Where do you see yourself professionally in two to three years, and how does this software engineering role align with your ambitions?',
      followUp: 'What kind of work culture and mentorship environment allows you to do your best engineering work?'
    }
  ]
};

export function resolveSkillKey(rawSkill) {
  if (!rawSkill) return null;
  const s = rawSkill.toLowerCase().trim();
  if (s.includes('python')) return 'Python';
  if (s.includes('react')) return 'React.js';
  if (s.includes('javascript') || s === 'js') return 'JavaScript';
  if (s.includes('java') && !s.includes('javascript')) return 'Java';
  if (s === 'sql' || s.includes('mysql') || s.includes('postgres')) return 'SQL';
  if (s.includes('dbms') || s.includes('database')) return 'DBMS';
  if (s.includes('structure') || s.includes('dsa') || s.includes('tree') || s.includes('graph') || s.includes('array')) return 'Data Structures';
  if (s.includes('algo')) return 'Algorithms';
  if (s.includes('node') || s.includes('express') || s.includes('backend')) return 'Node.js';
  if (s.includes('system design') || s.includes('architecture')) return 'System Design';
  if (s.includes('hr') || s.includes('behavioral') || s.includes('culture')) return 'HR';
  return null;
}

export function pickIntelligentNextQuestion({
  selectedSkills = [],
  sessionQuestionHistory = [],
  crossSessionHistory = [],
  track = 'TECHNICAL',
  resumeData = null,
  isFollowUp = false,
  previousQuestion = null,
  previousAnswer = '',
  difficultyPreference = null
}) {
  const isHr = (track === 'HR' || track === 'HR Interview');
  const isResume = (track === 'Based on Resume' || track === 'RESUME' || track === 'Resume-Based Interview');

  // Resume Track
  if (isResume) {
    const resumeProjects = Array.isArray(resumeData?.projects) ? resumeData.projects : [];
    const resumeSkills = Array.isArray(resumeData?.detectedSkills) && resumeData.detectedSkills.length > 0
      ? resumeData.detectedSkills
      : (Array.isArray(selectedSkills) && selectedSkills.length > 0 ? selectedSkills : ['Python', 'SQL', 'React.js']);
    const branch = resumeData?.education?.branch || resumeData?.branch || 'Computer Science';
    const college = resumeData?.education?.collegeName || resumeData?.collegeName || 'your university';
    const experienceList = Array.isArray(resumeData?.experience) ? resumeData.experience : [];

    // Follow-up for resume track
    if (isFollowUp && previousQuestion) {
      const prevText = previousQuestion.questionText || '';
      const matchingProj = resumeProjects.find(p => prevText.includes(p.name || p.title || ''));

      if (matchingProj) {
        const pName = matchingProj.name || matchingProj.title;
        const followUpOptions = [
          `What was the most challenging technical feature you personally implemented in "${pName}", and how did you overcome it?`,
          `If you were to re-architect "${pName}" today for high concurrency and production scale, what design choices would you change?`,
          `How did you test and validate that "${pName}" was robust and handled error states or edge cases gracefully?`
        ];
        const freshFollowUp = followUpOptions.find(f => !sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, f)));
        if (freshFollowUp) {
          return {
            questionText: freshFollowUp,
            skill: 'Resume Projects',
            topic: `Project Deep-Dive: ${pName}`,
            difficulty: 'MEDIUM',
            isFollowUp: true,
            parentQuestionId: previousQuestion.questionId || null
          };
        }
      }
    }

    // PHASE 1: Introduction and Academic Background (Turn 1 if no questions asked yet)
    const introQ = `Could you introduce yourself, telling me about your educational journey in ${branch} at ${college}, and what inspired you to build the technical projects listed on your resume?`;
    if (sessionQuestionHistory.length === 0 && !crossSessionHistory.some(past => isSemanticallySimilar(past, introQ))) {
      return {
        questionText: introQ,
        skill: 'Resume Introduction',
        topic: 'Candidate Background & Interests',
        difficulty: 'EASY',
        isFollowUp: false,
        parentQuestionId: null
      };
    }

    // PHASE 2: Projects Discussion (Major component of resume-based interview)
    const projectQuestions = [];
    for (const proj of resumeProjects) {
      const pName = proj.name || proj.title || 'your project';
      const tech = proj.technologies || proj.techStack || (Array.isArray(proj.tech) ? proj.tech.join(', ') : '');
      const desc = proj.description || '';

      const pQ1 = `Can you walk me through your project "${pName}"? What was the primary problem it solved and what was your specific technical role in building it?`;
      if (!sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, pQ1))) {
        projectQuestions.push({
          questionText: pQ1,
          skill: 'Resume Projects',
          topic: `Project: ${pName}`,
          difficulty: 'EASY'
        });
      }

      if (tech) {
        const pQ2 = `In your "${pName}" project, why did you decide to use ${tech}? What technical trade-offs did you consider when selecting those tools?`;
        if (!sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, pQ2))) {
          projectQuestions.push({
            questionText: pQ2,
            skill: 'Resume Projects',
            topic: `Technology Choice: ${pName}`,
            difficulty: 'MEDIUM'
          });
        }
      }

      const isMlProj = /machine\s*learning|deep\s*learning|nlp|cnn|model|dataset|prediction/i.test(`${pName} ${desc} ${tech}`);
      if (isMlProj) {
        const mlQ = `In "${pName}", which machine learning algorithm or model did you select, how did you clean and preprocess the dataset, and how did you evaluate its accuracy?`;
        if (!sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, mlQ))) {
          projectQuestions.push({
            questionText: mlQ,
            skill: 'Machine Learning',
            topic: `Model & Pipeline: ${pName}`,
            difficulty: 'MEDIUM'
          });
        }
      } else {
        const archQ = `How does the frontend communicate with the backend and database in "${pName}", and how do you handle error states and user authentication?`;
        if (!sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, archQ))) {
          projectQuestions.push({
            questionText: archQ,
            skill: 'System Architecture',
            topic: `Architecture: ${pName}`,
            difficulty: 'MEDIUM'
          });
        }
      }
    }

    const projectsAskedCount = sessionQuestionHistory.filter(h => h.skill === 'Resume Projects' || (h.category && String(h.category).startsWith('Project:'))).length;
    if (projectQuestions.length > 0 && projectsAskedCount < 2) {
      const chosen = projectQuestions[0];
      return {
        questionText: chosen.questionText,
        skill: chosen.skill,
        topic: chosen.topic,
        difficulty: chosen.difficulty,
        isFollowUp: false,
        parentQuestionId: null
      };
    }

    // PHASE 3: Work Experience / Internships (ONLY if mentioned in resume)
    if (experienceList.length > 0) {
      const expQuestions = [];
      for (const exp of experienceList) {
        const company = exp.company || exp.organization || 'your organization';
        const role = exp.role || exp.title || 'your role';
        const expQ = `In your experience as a ${role} at ${company}, what were your key technical deliverables and what technologies did you work with on a day-to-day basis?`;
        if (!sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, expQ))) {
          expQuestions.push({
            questionText: expQ,
            skill: 'Work Experience',
            topic: `Experience: ${company}`,
            difficulty: 'MEDIUM'
          });
        }
      }
      const expAsked = sessionQuestionHistory.some(h => h.skill === 'Work Experience');
      if (expQuestions.length > 0 && !expAsked) {
        const chosen = expQuestions[0];
        return {
          questionText: chosen.questionText,
          skill: chosen.skill,
          topic: chosen.topic,
          difficulty: chosen.difficulty,
          isFollowUp: false,
          parentQuestionId: null
        };
      }
    }

    // PHASE 4: Practical questions on technical skills mentioned in the resume
    const skillCandidates = [];
    for (const rSkill of resumeSkills) {
      const resolved = resolveSkillKey(rSkill);
      if (resolved && QUESTION_POOLS[resolved]) {
        for (const qObj of QUESTION_POOLS[resolved]) {
          if (!sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, qObj.question))) {
            skillCandidates.push({
              questionText: qObj.question,
              skill: resolved,
              topic: qObj.topic,
              difficulty: qObj.difficulty
            });
          }
        }
      }
    }

    const freshSkills = skillCandidates.filter(c => !crossSessionHistory.some(past => isSemanticallySimilar(past, c.questionText)));
    const skillPoolToUse = freshSkills.length > 0 ? freshSkills : skillCandidates;
    const skillsAskedCount = sessionQuestionHistory.filter(h => h.skill !== 'Resume Introduction' && h.skill !== 'Resume Projects' && h.skill !== 'Work Experience' && h.skill !== 'HR & Behavioral').length;

    if (skillPoolToUse.length > 0 && skillsAskedCount < 2) {
      const chosen = skillPoolToUse[Math.floor(Math.random() * skillPoolToUse.length)];
      return {
        questionText: chosen.questionText,
        skill: chosen.skill,
        topic: chosen.topic,
        difficulty: chosen.difficulty,
        isFollowUp: false,
        parentQuestionId: null
      };
    }

    // PHASE 5: Profile-based HR/Behavioral questions
    const hrProfileQ = `Reflecting on the projects listed in your resume, can you describe a time you faced a difficult technical bug or tight deadline? How did you diagnose the problem and resolve it?`;
    if (!sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, hrProfileQ))) {
      return {
        questionText: hrProfileQ,
        skill: 'HR & Behavioral',
        topic: 'Problem Solving & Resilience',
        difficulty: 'EASY',
        isFollowUp: false,
        parentQuestionId: null
      };
    }

    if (projectQuestions.length > 0) {
      const chosen = projectQuestions[0];
      return {
        questionText: chosen.questionText,
        skill: chosen.skill,
        topic: chosen.topic,
        difficulty: chosen.difficulty,
        isFollowUp: false,
        parentQuestionId: null
      };
    }

    if (skillPoolToUse.length > 0) {
      const chosen = skillPoolToUse[0];
      return {
        questionText: chosen.questionText,
        skill: chosen.skill,
        topic: chosen.topic,
        difficulty: chosen.difficulty,
        isFollowUp: false,
        parentQuestionId: null
      };
    }

    return {
      questionText: `Looking ahead, how do the technical skills and projects on your resume prepare you for a software engineering placement role?`,
      skill: 'Career Vision',
      topic: 'Placement Alignment',
      difficulty: 'EASY',
      isFollowUp: false,
      parentQuestionId: null
    };
  }

  // HR Track
  if (isHr) {
    const hrPool = QUESTION_POOLS['HR'];

    if (isFollowUp && previousQuestion) {
      const parentObj = hrPool.find(q => isSemanticallySimilar(q.question, previousQuestion.questionText));
      if (parentObj && parentObj.followUp && !sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, parentObj.followUp))) {
        return {
          questionText: parentObj.followUp,
          skill: 'HR',
          topic: parentObj.topic,
          difficulty: 'MEDIUM',
          isFollowUp: true,
          parentQuestionId: previousQuestion.questionId || null
        };
      }
    }

    const availableHr = hrPool.filter(candidate => {
      const inCurrent = sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, candidate.question));
      const inPast = crossSessionHistory.some(pastText => isSemanticallySimilar(pastText, candidate.question));
      return !inCurrent && !inPast;
    });

    const poolToUse = availableHr.length > 0
      ? availableHr
      : hrPool.filter(candidate => !sessionQuestionHistory.some(h => isSemanticallySimilar(h.questionText, candidate.question)));

    const chosen = poolToUse.length > 0
      ? poolToUse[Math.floor(Math.random() * poolToUse.length)]
      : hrPool[0];

    return {
      questionText: chosen.question,
      skill: 'HR',
      topic: chosen.topic,
      difficulty: chosen.difficulty,
      isFollowUp: false,
      parentQuestionId: null
    };
  }

  // Technical Track
  const normalizedCandidateSkills = (Array.isArray(selectedSkills) && selectedSkills.length > 0)
    ? selectedSkills.map(resolveSkillKey).filter(Boolean)
    : ['Python', 'SQL', 'DBMS', 'Data Structures'];

  const uniqueSkills = Array.from(new Set(normalizedCandidateSkills));
  if (uniqueSkills.length === 0) {
    uniqueSkills.push('Python', 'SQL', 'DBMS', 'Data Structures');
  }

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
          difficulty: 'MEDIUM',
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
    questionText: `Can you describe a practical project or problem where you utilized ${fallbackSkill}, and explain how you handled testing and error cases?`,
    skill: fallbackSkill,
    topic: 'Practical Implementation',
    difficulty: 'EASY',
    isFollowUp: false,
    parentQuestionId: null
  };
}
