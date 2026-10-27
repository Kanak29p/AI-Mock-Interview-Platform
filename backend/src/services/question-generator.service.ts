import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env";
import { pool } from "../config/db";
import { RetrievedChunk } from "./rag.service";

export interface GeneratedQuestion {
  questionOrder: number;
  questionText: string;
  expectedPoints: string[];
  category: string;
  difficulty: string;
  codeStarterSnippet?: string;
  testCases?: Array<{ input: string; expectedOutput: string }>;
}

/**
 * Fallback questions if Gemini API key is not configured or offline
 */
const getCuratedFallbackQuestions = (
  roleTitle: string,
  difficulty: string,
  interviewType: string,
  retrievedChunks: RetrievedChunk[]
): GeneratedQuestion[] => {
  const contextSummary = retrievedChunks.map((c) => c.content).join(" ");
  const mentionsDb = /postgres|sql|mongo|redis|database/i.test(contextSummary);
  const mentionsReact = /react|next|frontend|css|ui/i.test(contextSummary);

  if (interviewType === "behavioral") {
    return [
      {
        questionOrder: 1,
        questionText: `Tell me about a time when you were working as a ${roleTitle} and faced a high-pressure technical roadblock. How did you diagnose and overcome it?`,
        expectedPoints: ["Situation & Task context", "Action taken & technical decision-making", "Measurable result"],
        category: "Conflict & Problem Solving",
        difficulty,
      },
      {
        questionOrder: 2,
        questionText: "Describe a situation where you had a disagreement with a product manager or teammate over architecture priorities. How did you reach consensus?",
        expectedPoints: ["Active listening", "Data-driven negotiation", "Focus on user/business impact"],
        category: "Collaboration",
        difficulty,
      },
      {
        questionOrder: 3,
        questionText: "Can you share an experience where a project you deployed to production failed or had a critical outage? How did you respond?",
        expectedPoints: ["Immediate triage & root cause analysis", "Blameless post-mortem", "Preventative measures implemented"],
        category: "Incident Response",
        difficulty,
      },
      {
        questionOrder: 4,
        questionText: "How do you handle technical debt when balancing fast delivery deadlines with maintainability?",
        expectedPoints: ["Pragmatic trade-offs", "Refactoring strategies", "Stakeholder communication"],
        category: "Delivery & Quality",
        difficulty,
      },
      {
        questionOrder: 5,
        questionText: "What was the most challenging feedback you ever received in your career, and how did you use it to grow?",
        expectedPoints: ["Humility and self-reflection", "Actionable behavior changes", "Long-term improvement"],
        category: "Growth Mindset",
        difficulty,
      },
    ];
  }

  if (interviewType === "coding") {
    return [
      {
        questionOrder: 1,
        questionText: "Given an array of integers representing request latencies and an integer window size, write an algorithm to find the maximum average latency of any contiguous sub-window.",
        expectedPoints: ["Sliding window technique", "O(N) time complexity", "O(1) extra space"],
        category: "Algorithms & Sliding Window",
        difficulty,
        codeStarterSnippet: `function maxAverageLatency(latencies, k) {
  // Implement sliding window algorithm
  let currentSum = 0;
  for (let i = 0; i < k; i++) {
    currentSum += latencies[i];
  }
  let maxAvg = currentSum / k;
  for (let i = k; i < latencies.length; i++) {
    currentSum += latencies[i] - latencies[i - k];
    maxAvg = Math.max(maxAvg, currentSum / k);
  }
  return maxAvg;
}

// Example invocation for sandbox test:
console.log(maxAverageLatency([1, 12, -5, -6, 50, 3], 4));
`,
        testCases: [
          {
            input: "[1, 12, -5, -6, 50, 3], 4",
            expectedOutput: "12.75",
          },
          {
            input: "[5], 1",
            expectedOutput: "5",
          },
        ],
      },
      {
        questionOrder: 2,
        questionText: "Implement a thread-safe LRU (Least Recently Used) cache with get(key) and put(key, value) in O(1) average time complexity.",
        expectedPoints: ["Hash map + Doubly linked list", "Node eviction logic", "Edge cases (empty, capacity 1)"],
        category: "Data Structures",
        difficulty,
        codeStarterSnippet: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
}

const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1));
`,
        testCases: [
          {
            input: "put(1, 1), put(2, 2), get(1)",
            expectedOutput: "1",
          },
        ],
      },
      {
        questionOrder: 3,
        questionText: "Given a list of microservice dependency pairs [A, B] indicating A depends on B, determine if there exists a circular dependency loop.",
        expectedPoints: ["Graph cycle detection (DFS / Topological Sort)", "Visited vs In-Stack states", "O(V + E) time"],
        category: "Graph Algorithms",
        difficulty,
        codeStarterSnippet: `function hasCircularDependency(numServices, dependencies) {
  const adj = Array.from({ length: numServices }, () => []);
  for (const [u, v] of dependencies) {
    adj[u].push(v);
  }
  const visited = new Array(numServices).fill(0); // 0=unvisited, 1=visiting, 2=visited

  function dfs(node) {
    if (visited[node] === 1) return true;
    if (visited[node] === 2) return false;
    visited[node] = 1;
    for (const neighbor of adj[node]) {
      if (dfs(neighbor)) return true;
    }
    visited[node] = 2;
    return false;
  }

  for (let i = 0; i < numServices; i++) {
    if (visited[i] === 0 && dfs(i)) return true;
  }
  return false;
}

console.log(hasCircularDependency(3, [[0, 1], [1, 2], [2, 0]]));
`,
        testCases: [
          {
            input: "3, [[0, 1], [1, 2], [2, 0]]",
            expectedOutput: "true",
          },
        ],
      },
    ];
  }

  // Technical Round
  return [
    {
      questionOrder: 1,
      questionText: mentionsDb
        ? `In your background, you worked with data stores like PostgreSQL and Redis. How do you design a database schema and caching layer to prevent cache stampedes and stale reads?`
        : `As a ${roleTitle}, how do you evaluate architectural trade-offs between monolithic and microservice architectures for high-growth applications?`,
      expectedPoints: ["Caching patterns (Cache-Aside, Write-Through)", "Invalidation strategies", "Failure handling"],
      category: "System Design & Data",
      difficulty,
    },
    {
      questionOrder: 2,
      questionText: mentionsReact
        ? "When optimizing frontend performance for complex stateful applications, how do you mitigate unnecessary re-renders and minimize bundle sizes?"
        : "Explain how you design resilient asynchronous messaging pipelines with message brokers like Kafka or RabbitMQ, ensuring at-least-once delivery.",
      expectedPoints: ["Concurrency models", "Backpressure handling", "Idempotency"],
      category: "Performance & Concurrency",
      difficulty,
    },
    {
      questionOrder: 3,
      questionText: "Walk me through how you implement zero-downtime deployments with database schema migrations in a continuous delivery environment.",
      expectedPoints: ["Blue/green or rolling deployments", "Expand-and-contract schema migrations", "Backward compatibility"],
      category: "DevOps & Reliability",
      difficulty,
    },
    {
      questionOrder: 4,
      questionText: "How do you approach authentication and authorization security, specifically protecting against CSRF, SSRF, and JWT token replay attacks?",
      expectedPoints: ["Secure cookie vs token storage", "Short-lived tokens + rotation", "Strict origin validation"],
      category: "Security & Auth",
      difficulty,
    },
    {
      questionOrder: 5,
      questionText: `Looking at your target role as a ${roleTitle}, what is one technical decision or architecture pattern you advocated for in the past that you would do differently today?`,
      expectedPoints: ["Lessons learned", "Evolving best practices", "Technical introspection"],
      category: "Architecture Reflection",
      difficulty,
    },
  ];
};

/**
 * Generate interview questions personalized to the candidate's resume via Gemini and RAG context
 */
export const generateQuestionsForSession = async (
  sessionId: string,
  roleTitle: string,
  difficulty: string,
  interviewType: string,
  retrievedChunks: RetrievedChunk[]
): Promise<GeneratedQuestion[]> => {
  const apiKey = config.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 0 && apiKey !== "your_gemini_api_key_here") {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const contextSnippet = retrievedChunks.length > 0
        ? retrievedChunks
            .map((c, i) => `[Resume Excerpt ${i + 1} - ${c.sectionTitle}]:\n${c.content}`)
            .join("\n\n")
        : "No specific resume provided. Use industry standard expectations for this role.";

      const prompt = `You are a Principal Engineering Interviewer conducting a mock interview.
Target Role: ${roleTitle}
Target Level: ${difficulty}
Interview Round: ${interviewType}

Candidate Resume Background (Retrieved Context):
${contextSnippet}

INSTRUCTIONS:
1. Generate between 4 and 5 realistic, deep, and challenging interview questions for this session.
2. CRITICAL: Personalize at least 2 questions directly referencing the candidate's specific technologies, projects, or achievements found in their resume background above.
3. For "coding" rounds, provide a clear algorithmic problem with a code starter snippet AND 1-3 test cases with sample input and expectedOutput.
4. Output MUST be valid JSON matching this exact structure:
[
  {
    "questionOrder": 1,
    "questionText": "Question string here...",
    "expectedPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "category": "Category title (e.g. Distributed Systems, Problem Solving)",
    "difficulty": "${difficulty}",
    "codeStarterSnippet": "Optional code starter string",
    "testCases": [{"input": "sample input", "expectedOutput": "expected output"}]
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText) as GeneratedQuestion[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((q, idx) => ({
            ...q,
            questionOrder: idx + 1,
            difficulty: q.difficulty || difficulty,
          }));
        }
      }
    } catch (err: any) {
      console.warn("Gemini question generation warning:", err?.message || err);
    }
  }

  // Fallback to high-quality curated questions if Gemini is unavailable
  return getCuratedFallbackQuestions(roleTitle, difficulty, interviewType, retrievedChunks);
};

/**
 * Persist generated questions into the PostgreSQL database
 */
export const saveQuestionsToDatabase = async (
  sessionId: string,
  questions: GeneratedQuestion[]
): Promise<void> => {
  // Clear any existing questions for this session to allow regeneration
  await pool.query("DELETE FROM interview_questions WHERE session_id = $1", [sessionId]);

  for (const q of questions) {
    await pool.query(
      `INSERT INTO interview_questions 
        (session_id, question_order, question_text, expected_points, category, difficulty, code_starter_snippet, test_cases)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        sessionId,
        q.questionOrder,
        q.questionText,
        q.expectedPoints,
        q.category,
        q.difficulty,
        q.codeStarterSnippet || null,
        JSON.stringify(q.testCases || []),
      ]
    );
  }
};
