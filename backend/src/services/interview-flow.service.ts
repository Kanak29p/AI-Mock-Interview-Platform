import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env";
import { RetrievedChunk } from "./rag.service";

export interface ConversationTurn {
  questionId: string;
  questionOrder: number;
  questionText: string;
  category: string;
  userResponseText?: string;
  codeSubmission?: string;
  createdAt?: string;
}

export interface NextQuestionResult {
  questionOrder: number;
  questionText: string;
  expectedPoints: string[];
  category: string;
  difficulty: string;
  codeStarterSnippet?: string;
  testCases?: Array<{ input: string; expectedOutput: string }>;
  interviewerFeedbackSnippet?: string;
  isCompleted: boolean;
}

/**
 * Generate dynamic next question based on candidate's previous response, conversation history, and resume context
 */
export const generateNextInterviewQuestion = async (
  roleTitle: string,
  difficulty: string,
  interviewType: string,
  history: ConversationTurn[],
  retrievedChunks: RetrievedChunk[],
  maxTurns = 5
): Promise<NextQuestionResult> => {
  const nextOrder = history.length + 1;

  if (nextOrder > maxTurns) {
    return {
      questionOrder: nextOrder,
      questionText: "Thank you for answering all the questions in this mock interview session! We have collected sufficient responses to evaluate your performance.",
      expectedPoints: [],
      category: "Conclusion",
      difficulty,
      interviewerFeedbackSnippet: "Interview questions completed.",
      isCompleted: true,
    };
  }

  const apiKey = config.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 0 && apiKey !== "your_gemini_api_key_here") {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const resumeContextStr = retrievedChunks.length > 0
        ? retrievedChunks.map((c, i) => `[Resume Excerpt ${i + 1} - ${c.sectionTitle}]: ${c.content}`).join("\n")
        : "No specific resume provided.";

      const historyFormatted = history
        .map(
          (t) =>
            `Interviewer (Q${t.questionOrder}): ${t.questionText}\nCandidate Answer: ${
              t.userResponseText || t.codeSubmission || "[No response provided]"
            }`
        )
        .join("\n\n");

      const prompt = `You are an expert technical interviewer at a tier-1 technology company.
Target Role: ${roleTitle}
Seniority: ${difficulty}
Round Type: ${interviewType}

Candidate Resume Background:
${resumeContextStr}

Conversation History So Far:
${historyFormatted}

CURRENT TASK:
1. Provide a brief 1-sentence interviewer acknowledgment/feedback note on the candidate's last answer in "interviewerFeedbackSnippet".
2. Generate Question ${nextOrder} of ${maxTurns}.
   - The question must logically progress the interview.
   - If the candidate mentioned a specific technology or decision, ask a thoughtful follow-up probe OR transition to an important competency for ${roleTitle} (e.g. system reliability, edge cases, scalability, or collaboration).
   - If round is "coding", provide an algorithmic problem with starter code snippet AND 1-3 test cases in "testCases".
3. Set "isCompleted": false.

Respond ONLY with valid JSON in this exact structure:
{
  "questionOrder": ${nextOrder},
  "questionText": "Your dynamic question here...",
  "expectedPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "category": "Topic category",
  "difficulty": "${difficulty}",
  "codeStarterSnippet": "Optional code starter",
  "testCases": [{"input": "sample input", "expectedOutput": "expected output"}],
  "interviewerFeedbackSnippet": "Brief 1-sentence acknowledgment of previous answer",
  "isCompleted": false
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText) as NextQuestionResult;
        return {
          ...parsed,
          questionOrder: nextOrder,
          difficulty: parsed.difficulty || difficulty,
          isCompleted: false,
        };
      }
    } catch (err: any) {
      console.warn("Gemini dynamic turn generation warning:", err?.message || err);
    }
  }

  // Fallback dynamic progression when Gemini API key is offline
  const fallbackTopics = [
    { category: "Core Fundamentals", q: `Can you dive deeper into how you handle error boundaries and graceful degradation in ${roleTitle} systems?` },
    { category: "System Architecture", q: "How do you approach database schema migrations and data consistency when rolling out breaking changes with zero downtime?" },
    { category: "Scalability & Concurrency", q: "Imagine user traffic spikes by 10x during a peak event. What bottlenecks would fail first in your architecture, and how would you resolve them?" },
    { category: "Production Debugging", q: "Tell me about a time when a critical bug slipped into production. How did you triage the issue under pressure and what automated tests did you add to prevent recurrence?" },
    { category: "Leadership & Trade-offs", q: "How do you balance shipping fast product iterations with paying down technical debt in engineering roadmaps?" }
  ];

  const topicIndex = Math.min(nextOrder - 1, fallbackTopics.length - 1);
  const selectedTopic = fallbackTopics[topicIndex];

  return {
    questionOrder: nextOrder,
    questionText: selectedTopic.q,
    expectedPoints: ["Sound architectural reasoning", "Pragmatic trade-offs", "Production mindset"],
    category: selectedTopic.category,
    difficulty,
    interviewerFeedbackSnippet: "Thank you for that answer. Let's move to the next technical topic.",
    isCompleted: false,
  };
};
