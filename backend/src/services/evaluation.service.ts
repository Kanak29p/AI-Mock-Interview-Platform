import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env";
import { pool } from "../config/db";

export interface PerAnswerFeedback {
  questionId: string;
  questionOrder: number;
  questionText: string;
  category: string;
  candidateAnswer: string;
  codeSubmission?: string;
  score: number; // 0 to 100
  strengths: string;
  missedPoints: string;
  idealAnswerSnippet: string;
}

export interface SessionEvaluationResult {
  technicalScore: number;
  communicationScore: number;
  overallScore: number;
  readinessLevel: "Strong Hire" | "Hire" | "Leaning Hire" | "Needs Preparation";
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  detailedFeedback: string;
  perAnswerFeedback: PerAnswerFeedback[];
}

interface TurnData {
  questionId: string;
  questionOrder: number;
  questionText: string;
  category: string;
  difficulty: string;
  expectedPoints: string[];
  codeStarterSnippet?: string;
  userResponseText?: string;
  codeSubmission?: string;
  codeLanguage?: string;
  executionOutput?: string;
}

/**
 * Fallback heuristic evaluator if Gemini is unreachable or offline
 */
const generateFallbackEvaluation = (
  roleTitle: string,
  interviewType: string,
  turns: TurnData[]
): SessionEvaluationResult => {
  let totalTurnScore = 0;
  const perAnswerFeedback: PerAnswerFeedback[] = [];

  for (const t of turns) {
    const textLen = (t.userResponseText || "").trim().length;
    const codeLen = (t.codeSubmission || "").trim().length;
    let turnScore = 65; // Baseline

    if (textLen > 150) turnScore += 15;
    else if (textLen > 60) turnScore += 10;

    if (t.codeSubmission && t.codeSubmission.length > 40) {
      turnScore += 15;
    }

    if (t.executionOutput && t.executionOutput.includes("passed")) {
      turnScore += 5;
    }

    turnScore = Math.min(100, Math.max(40, turnScore));
    totalTurnScore += turnScore;

    perAnswerFeedback.push({
      questionId: t.questionId,
      questionOrder: t.questionOrder,
      questionText: t.questionText,
      category: t.category || "Engineering Foundations",
      candidateAnswer: t.userResponseText || "No verbal explanation provided.",
      codeSubmission: t.codeSubmission || undefined,
      score: turnScore,
      strengths:
        textLen > 100
          ? "Demonstrated clear understanding of core concepts and articulated technical principles systematically."
          : "Addressed the primary requirements directly.",
      missedPoints:
        "Could elaborate further on edge cases, latency boundaries, and trade-offs under high scale.",
      idealAnswerSnippet:
        t.expectedPoints && t.expectedPoints.length > 0
          ? `Ideal response addresses: ${t.expectedPoints.join(", ")}.`
          : "A complete response covers architectural tradeoffs, failure recovery, and runtime complexity.",
    });
  }

  const avgTurnScore = turns.length > 0 ? Math.round(totalTurnScore / turns.length) : 70;
  const technicalScore = Math.min(100, Math.max(50, avgTurnScore + 2));
  const communicationScore = Math.min(100, Math.max(50, avgTurnScore - 1));
  const overallScore = Math.round(technicalScore * 0.6 + communicationScore * 0.4);

  let readinessLevel: "Strong Hire" | "Hire" | "Leaning Hire" | "Needs Preparation" = "Hire";
  if (overallScore >= 85) readinessLevel = "Strong Hire";
  else if (overallScore >= 70) readinessLevel = "Hire";
  else if (overallScore >= 55) readinessLevel = "Leaning Hire";
  else readinessLevel = "Needs Preparation";

  return {
    technicalScore,
    communicationScore,
    overallScore,
    readinessLevel,
    strengths: [
      `Solid grasp of core engineering foundations suitable for ${roleTitle}.`,
      "Good structure in problem identification and breaking down solutions.",
      "Clear syntax and logical organization in coding/technical discussions.",
    ],
    areasForImprovement: [
      "Include more explicit discussions of production observability, monitoring, and alerting.",
      "Quantify scale and latency constraints when proposing distributed designs.",
      "Highlight operational failure modes and rollback strategies.",
    ],
    recommendations: [
      "Review high-concurrency caching patterns (Cache-aside, dogpiling mitigation).",
      "Practice structured STAR methodology responses for scenario-based questions.",
      "Study time and space complexity boundaries for edge case inputs.",
    ],
    detailedFeedback: `Candidate demonstrated solid competence across the ${interviewType} interview track for ${roleTitle}. Answers showed practical domain knowledge with good problem-solving discipline. To progress to top-tier technical readiness, emphasize operational trade-offs, resilience patterns, and deeper metric quantification.`,
    perAnswerFeedback,
  };
};

/**
 * Generate full evaluation and structured report using Gemini
 */
export const evaluateInterviewSession = async (
  sessionId: string,
  userId: string
): Promise<SessionEvaluationResult> => {
  // 1. Fetch session metadata
  const sessionRes = await pool.query(
    `SELECT i.id, i.role_title AS "roleTitle", i.difficulty, i.interview_type AS "interviewType",
            r.parsed_skills AS "parsedSkills", r.file_name AS "resumeFileName"
     FROM interview_sessions i
     LEFT JOIN resumes r ON i.resume_id = r.id
     WHERE i.id = $1 AND i.user_id = $2`,
    [sessionId, userId]
  );

  if (sessionRes.rows.length === 0) {
    throw new Error("Interview session not found or unauthorized.");
  }

  const session = sessionRes.rows[0];

  // 2. Fetch all questions and responses for the session
  const turnsRes = await pool.query(
    `SELECT 
      q.id AS "questionId",
      q.question_order AS "questionOrder",
      q.question_text AS "questionText",
      q.category,
      q.difficulty,
      q.expected_points AS "expectedPoints",
      q.code_starter_snippet AS "codeStarterSnippet",
      r.user_response_text AS "userResponseText",
      r.code_submission AS "codeSubmission",
      r.code_language AS "codeLanguage",
      r.execution_output AS "executionOutput"
     FROM interview_questions q
     LEFT JOIN responses r ON q.id = r.question_id
     WHERE q.session_id = $1
     ORDER BY q.question_order ASC`,
    [sessionId]
  );

  const turns: TurnData[] = turnsRes.rows;

  if (turns.length === 0) {
    throw new Error("Cannot evaluate an interview with no questions recorded.");
  }

  let evaluation: SessionEvaluationResult;
  const apiKey = config.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 0 && apiKey !== "your_gemini_api_key_here") {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const transcriptFormatted = turns
        .map(
          (t) => `--- Turn Q${t.questionOrder} [Category: ${t.category || "General"}, Level: ${t.difficulty}] ---
Interviewer Question: ${t.questionText}
Expected Key Points: ${(t.expectedPoints || []).join(", ") || "Industry standards"}
Candidate Response: ${t.userResponseText || "[No verbal response]"}
Candidate Code (${t.codeLanguage || "none"}):
${t.codeSubmission || "[No code submitted]"}
Execution Diagnostics: ${t.executionOutput || "[None]"}`
        )
        .join("\n\n");

      const prompt = `You are a Principal Engineering Director and Staff Hiring Bar Raiser at a premier technology company.
Conduct a comprehensive, structured evaluation of this candidate's mock interview.

Target Role: ${session.roleTitle}
Target Seniority: ${session.difficulty}
Interview Track: ${session.interviewType}
Resume Grounding: ${session.resumeFileName || "General Candidate"}

INTERVIEW TRANSCRIPT:
${transcriptFormatted}

SCORING GUIDELINES:
1. Technical Score (0-100): Depth, correctness, systems thinking, algorithmic complexity, architectural tradeoffs.
2. Communication Score (0-100): Clarity, structure, articulation, STAR framing, conciseness.
3. Overall Score (0-100): Weighted readiness rating (60% tech + 40% comms for technical/coding, 50/50 for behavioral).
4. Readiness Level: Exactly one of ["Strong Hire", "Hire", "Leaning Hire", "Needs Preparation"].
5. Strengths: 3 to 5 specific, evidence-backed positive observations from their responses.
6. Areas for Improvement: 3 to 5 constructive, concrete technical or communication areas to sharpen.
7. Recommendations: 3 to 4 actionable learning resources or practice strategies.
8. Per-Answer Feedback: One detailed entry for EVERY turn (Q1 to Q${turns.length}) with a score (0-100), what they did well, what they missed, and a concise 2-sentence ideal answer snippet.

Respond ONLY with valid JSON in this exact structure:
{
  "technicalScore": 85,
  "communicationScore": 80,
  "overallScore": 83,
  "readinessLevel": "Hire",
  "strengths": ["...", "...", "..."],
  "areasForImprovement": ["...", "...", "..."],
  "recommendations": ["...", "...", "..."],
  "detailedFeedback": "Comprehensive summary paragraph...",
  "perAnswerFeedback": [
    {
      "questionId": "${turns[0]?.questionId}",
      "questionOrder": 1,
      "questionText": "...",
      "category": "...",
      "candidateAnswer": "...",
      "codeSubmission": "...",
      "score": 85,
      "strengths": "...",
      "missedPoints": "...",
      "idealAnswerSnippet": "..."
    }
  ]
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
        const parsed = JSON.parse(responseText) as SessionEvaluationResult;
        // Ensure perAnswerFeedback question IDs match actual turns
        const matchedPerAnswer = turns.map((t, idx) => {
          const aiItem = parsed.perAnswerFeedback?.[idx] || parsed.perAnswerFeedback?.find((p) => p.questionOrder === t.questionOrder);
          return {
            questionId: t.questionId,
            questionOrder: t.questionOrder,
            questionText: t.questionText,
            category: t.category || "Technical",
            candidateAnswer: t.userResponseText || "[No verbal response]",
            codeSubmission: t.codeSubmission,
            score: typeof aiItem?.score === "number" ? aiItem.score : Math.round(parsed.overallScore || 75),
            strengths: aiItem?.strengths || "Provided clear solution steps.",
            missedPoints: aiItem?.missedPoints || "Could detail scalability edge cases.",
            idealAnswerSnippet: aiItem?.idealAnswerSnippet || (t.expectedPoints || []).join(", "),
          };
        });

        evaluation = {
          technicalScore: Number(parsed.technicalScore) || 75,
          communicationScore: Number(parsed.communicationScore) || 75,
          overallScore: Number(parsed.overallScore) || 75,
          readinessLevel: parsed.readinessLevel || "Hire",
          strengths: parsed.strengths || [],
          areasForImprovement: parsed.areasForImprovement || [],
          recommendations: parsed.recommendations || [],
          detailedFeedback: parsed.detailedFeedback || "Evaluation generated successfully.",
          perAnswerFeedback: matchedPerAnswer,
        };
      } else {
        evaluation = generateFallbackEvaluation(session.roleTitle, session.interviewType, turns);
      }
    } catch (err: any) {
      console.warn("Gemini evaluation error, using fallback evaluation:", err?.message || err);
      evaluation = generateFallbackEvaluation(session.roleTitle, session.interviewType, turns);
    }
  } else {
    evaluation = generateFallbackEvaluation(session.roleTitle, session.interviewType, turns);
  }

  // 3. Persist feedback into the database
  // Remove any prior feedback row for this session to update with latest evaluation
  await pool.query("DELETE FROM feedback WHERE session_id = $1", [sessionId]);

  const insertResult = await pool.query(
    `INSERT INTO feedback 
      (session_id, technical_score, communication_score, overall_score, strengths, 
       areas_for_improvement, detailed_feedback, per_answer_feedback, recommendations, readiness_level)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING 
      id,
      session_id AS "sessionId",
      technical_score AS "technicalScore",
      communication_score AS "communicationScore",
      overall_score AS "overallScore",
      strengths,
      areas_for_improvement AS "areasForImprovement",
      detailed_feedback AS "detailedFeedback",
      per_answer_feedback AS "perAnswerFeedback",
      recommendations,
      readiness_level AS "readinessLevel",
      created_at AS "createdAt"`,
    [
      sessionId,
      evaluation.technicalScore,
      evaluation.communicationScore,
      evaluation.overallScore,
      evaluation.strengths,
      evaluation.areasForImprovement,
      evaluation.detailedFeedback,
      JSON.stringify(evaluation.perAnswerFeedback),
      evaluation.recommendations,
      evaluation.readinessLevel,
    ]
  );

  // 4. Update the interview_sessions table with score & status
  await pool.query(
    `UPDATE interview_sessions 
     SET score = $1, status = 'completed', completed_at = COALESCE(completed_at, NOW()) 
     WHERE id = $2`,
    [evaluation.overallScore, sessionId]
  );

  return insertResult.rows[0];
};

/**
 * Retrieve existing feedback for a session
 */
export const getSessionFeedback = async (
  sessionId: string,
  userId: string
): Promise<any> => {
  // Check ownership
  const sessionCheck = await pool.query(
    `SELECT id, role_title AS "roleTitle", difficulty, interview_type AS "interviewType", 
            score, status, started_at AS "startedAt", completed_at AS "completedAt",
            created_at AS "createdAt"
     FROM interview_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );

  if (sessionCheck.rows.length === 0) {
    throw new Error("Interview session not found or unauthorized.");
  }

  const session = sessionCheck.rows[0];

  const feedbackRes = await pool.query(
    `SELECT 
      id,
      session_id AS "sessionId",
      technical_score AS "technicalScore",
      communication_score AS "communicationScore",
      overall_score AS "overallScore",
      strengths,
      areas_for_improvement AS "areasForImprovement",
      detailed_feedback AS "detailedFeedback",
      per_answer_feedback AS "perAnswerFeedback",
      recommendations,
      readiness_level AS "readinessLevel",
      created_at AS "createdAt"
     FROM feedback
     WHERE session_id = $1`,
    [sessionId]
  );

  if (feedbackRes.rows.length > 0) {
    return {
      session,
      feedback: feedbackRes.rows[0],
    };
  }

  // If not yet evaluated, run evaluation automatically
  const newFeedback = await evaluateInterviewSession(sessionId, userId);
  return {
    session: { ...session, score: newFeedback.overallScore, status: "completed" },
    feedback: newFeedback,
  };
};
