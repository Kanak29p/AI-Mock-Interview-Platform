import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { pool } from "../config/db";
import { retrieveRelevantResumeContext } from "../services/rag.service";
import {
  generateQuestionsForSession,
  saveQuestionsToDatabase,
} from "../services/question-generator.service";
import {
  generateNextInterviewQuestion,
  ConversationTurn,
} from "../services/interview-flow.service";
import {
  evaluateInterviewSession,
  getSessionFeedback,
} from "../services/evaluation.service";

const createInterviewSchema = z.object({
  roleTitle: z.string().min(2, "Role title must be at least 2 characters"),
  difficulty: z.enum(["junior", "intermediate", "senior", "lead"]).default("intermediate"),
  interviewType: z.enum(["technical", "behavioral", "coding"]).default("technical"),
  resumeId: z.string().uuid("Invalid resume ID").optional().nullable(),
});

const submitResponseSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  userResponseText: z.string().optional().default(""),
  codeSubmission: z.string().optional(),
  codeLanguage: z.string().optional().default("javascript"),
  executionOutput: z.string().optional(),
});

export const getInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      `SELECT 
        i.id, 
        i.role_title AS "roleTitle", 
        i.difficulty, 
        i.interview_type AS "interviewType", 
        i.status, 
        i.score, 
        i.started_at AS "startedAt", 
        i.completed_at AS "completedAt", 
        i.created_at AS "createdAt",
        r.id AS "resumeId",
        r.file_name AS "resumeFileName"
       FROM interview_sessions i
       LEFT JOIN resumes r ON i.resume_id = r.id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        interviews: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const validatedData = createInterviewSchema.parse(req.body);
    const { roleTitle, difficulty, interviewType, resumeId } = validatedData;

    // Verify resume belongs to user if specified
    if (resumeId) {
      const resumeCheck = await pool.query(
        "SELECT id FROM resumes WHERE id = $1 AND user_id = $2",
        [resumeId, userId]
      );
      if (resumeCheck.rows.length === 0) {
        res.status(400).json({
          success: false,
          message: "The specified resume was not found or does not belong to you.",
        });
        return;
      }
    }

    const insertResult = await pool.query(
      `INSERT INTO interview_sessions 
        (user_id, resume_id, role_title, difficulty, interview_type, status)
       VALUES ($1, $2, $3, $4, $5, 'scheduled')
       RETURNING 
        id, 
        role_title AS "roleTitle", 
        difficulty, 
        interview_type AS "interviewType", 
        status, 
        created_at AS "createdAt"`,
      [userId, resumeId || null, roleTitle, difficulty, interviewType]
    );

    const newSession = insertResult.rows[0];

    // Automatically generate initial question set using RAG
    let questionsCount = 0;
    try {
      const retrievedChunks = resumeId
        ? await retrieveRelevantResumeContext(
            userId,
            resumeId,
            `${roleTitle} ${interviewType} skills projects architecture`,
            4
          )
        : [];

      const questions = await generateQuestionsForSession(
        newSession.id,
        roleTitle,
        difficulty,
        interviewType,
        retrievedChunks
      );

      await saveQuestionsToDatabase(newSession.id, questions);
      questionsCount = questions.length;
    } catch (qErr) {
      console.warn("Could not auto-generate questions during session creation:", qErr);
    }

    res.status(201).json({
      success: true,
      message: "Interview session created and personalized questions prepared successfully",
      data: {
        interview: {
          ...newSession,
          questionsCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      `SELECT 
        i.id, 
        i.role_title AS "roleTitle", 
        i.difficulty, 
        i.interview_type AS "interviewType", 
        i.status, 
        i.score, 
        i.started_at AS "startedAt", 
        i.completed_at AS "completedAt", 
        i.created_at AS "createdAt",
        r.id AS "resumeId",
        r.file_name AS "resumeFileName",
        r.parsed_skills AS "parsedSkills"
       FROM interview_sessions i
       LEFT JOIN resumes r ON i.resume_id = r.id
       WHERE i.id = $1 AND i.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Interview session not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        interview: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start or resume an interview room session
 * Sets status to 'in_progress', ensures initial question exists, and returns current state
 */
export const startSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Load session
    const sessionRes = await pool.query(
      `SELECT 
        i.id, 
        i.role_title AS "roleTitle", 
        i.difficulty, 
        i.interview_type AS "interviewType", 
        i.status, 
        i.started_at AS "startedAt",
        i.resume_id AS "resumeId",
        r.file_name AS "resumeFileName"
       FROM interview_sessions i
       LEFT JOIN resumes r ON i.resume_id = r.id
       WHERE i.id = $1 AND i.user_id = $2`,
      [id, userId]
    );

    if (sessionRes.rows.length === 0) {
      res.status(404).json({ success: false, message: "Interview session not found" });
      return;
    }

    const session = sessionRes.rows[0];

    // If scheduled, mark as in_progress
    if (session.status === "scheduled") {
      await pool.query(
        "UPDATE interview_sessions SET status = 'in_progress', started_at = COALESCE(started_at, NOW()) WHERE id = $1",
        [id]
      );
      session.status = "in_progress";
    }

    // Ensure at least 1 question is in the session
    const existingQ = await pool.query(
      `SELECT 
        q.id, 
        q.question_order AS "questionOrder", 
        q.question_text AS "questionText", 
        q.expected_points AS "expectedPoints", 
        q.category, 
        q.difficulty, 
        q.code_starter_snippet AS "codeStarterSnippet",
        q.test_cases AS "testCases"
       FROM interview_questions q
       WHERE q.session_id = $1
       ORDER BY q.question_order ASC`,
      [id]
    );

    let questions = existingQ.rows;

    if (questions.length === 0) {
      // Auto-generate first batch
      const retrievedChunks = session.resumeId
        ? await retrieveRelevantResumeContext(
            userId,
            session.resumeId,
            `${session.roleTitle} ${session.interviewType} technical projects`,
            4
          )
        : [];

      const generated = await generateQuestionsForSession(
        session.id,
        session.roleTitle,
        session.difficulty,
        session.interviewType,
        retrievedChunks
      );

      await saveQuestionsToDatabase(session.id, generated);

      const reloadQ = await pool.query(
        `SELECT id, question_order AS "questionOrder", question_text AS "questionText", 
                expected_points AS "expectedPoints", category, difficulty, code_starter_snippet AS "codeStarterSnippet",
                test_cases AS "testCases"
         FROM interview_questions WHERE session_id = $1 ORDER BY question_order ASC`,
        [id]
      );
      questions = reloadQ.rows;
    }

    // Find the first unanswered question
    const answeredRes = await pool.query(
      "SELECT question_id FROM responses WHERE session_id = $1",
      [id]
    );
    const answeredSet = new Set(answeredRes.rows.map((r) => r.question_id));
    const currentQuestion = questions.find((q) => !answeredSet.has(q.id)) || questions[questions.length - 1];

    res.status(200).json({
      success: true,
      data: {
        session,
        currentQuestion,
        totalQuestionsCount: questions.length,
        answeredCount: answeredSet.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all conversation turns (Q&A history) for a session
 */
export const getSessionTurns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const turnsResult = await pool.query(
      `SELECT 
        q.id AS "questionId",
        q.question_order AS "questionOrder",
        q.question_text AS "questionText",
        q.expected_points AS "expectedPoints",
        q.category,
        q.difficulty,
        q.code_starter_snippet AS "codeStarterSnippet",
        q.test_cases AS "testCases",
        r.id AS "responseId",
        r.user_response_text AS "userResponseText",
        r.code_submission AS "codeSubmission",
        r.code_language AS "codeLanguage",
        r.execution_output AS "executionOutput",
        r.created_at AS "answeredAt"
       FROM interview_questions q
       LEFT JOIN responses r ON q.id = r.question_id
       WHERE q.session_id = $1
       ORDER BY q.question_order ASC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        turns: turnsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit candidate answer, persist to responses table, and generate next question with Gemini
 */
export const submitResponseAndGetNext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id: sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const validatedData = submitResponseSchema.parse(req.body);
    const { questionId, userResponseText, codeSubmission, codeLanguage, executionOutput } = validatedData;

    // Verify session belongs to user
    const sessionRes = await pool.query(
      `SELECT id, role_title AS "roleTitle", difficulty, interview_type AS "interviewType", resume_id AS "resumeId", status
       FROM interview_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    if (sessionRes.rows.length === 0) {
      res.status(404).json({ success: false, message: "Interview session not found" });
      return;
    }

    const session = sessionRes.rows[0];

    // 1. Record candidate response in database
    const responseInsert = await pool.query(
      `INSERT INTO responses 
        (question_id, session_id, user_response_text, code_submission, code_language, execution_output)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at AS "createdAt"`,
      [questionId, sessionId, userResponseText, codeSubmission || null, codeLanguage, executionOutput || null]
    );

    const savedResponse = responseInsert.rows[0];

    // 2. Fetch full conversation history so far
    const historyRes = await pool.query(
      `SELECT 
        q.id AS "questionId",
        q.question_order AS "questionOrder",
        q.question_text AS "questionText",
        q.category,
        r.user_response_text AS "userResponseText",
        r.code_submission AS "codeSubmission",
        r.created_at AS "createdAt"
       FROM interview_questions q
       JOIN responses r ON q.id = r.question_id
       WHERE q.session_id = $1
       ORDER BY q.question_order ASC`,
      [sessionId]
    );

    const history: ConversationTurn[] = historyRes.rows;
    const turnsCount = history.length;
    const maxInterviewTurns = 5;

    // If candidate has completed 5 turns, mark session completed
    if (turnsCount >= maxInterviewTurns) {
      await pool.query(
        "UPDATE interview_sessions SET status = 'completed', completed_at = NOW() WHERE id = $1",
        [sessionId]
      );

      res.status(200).json({
        success: true,
        message: "Final response recorded. Interview session completed!",
        data: {
          responseId: savedResponse.id,
          isCompleted: true,
          turnsCount,
          interviewerFeedbackSnippet: "Excellent! You have answered all 5 questions for this mock interview round.",
          nextQuestion: null,
        },
      });
      return;
    }

    // 3. Retrieve relevant resume context via RAG for the next topic
    const queryContextText = userResponseText
      ? `${session.roleTitle} ${userResponseText}`
      : `${session.roleTitle} ${session.interviewType}`;

    const retrievedChunks = session.resumeId
      ? await retrieveRelevantResumeContext(userId, session.resumeId, queryContextText, 3)
      : [];

    // 4. Generate dynamic next question with Gemini
    const nextQData = await generateNextInterviewQuestion(
      session.roleTitle,
      session.difficulty,
      session.interviewType,
      history,
      retrievedChunks,
      maxInterviewTurns
    );

    // 5. Persist the new question into interview_questions
    const newQInsert = await pool.query(
      `INSERT INTO interview_questions 
        (session_id, question_order, question_text, expected_points, category, difficulty, code_starter_snippet, test_cases)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING 
        id, 
        question_order AS "questionOrder", 
        question_text AS "questionText", 
        expected_points AS "expectedPoints", 
        category, 
        difficulty, 
        code_starter_snippet AS "codeStarterSnippet",
        test_cases AS "testCases"`,
      [
        sessionId,
        nextQData.questionOrder,
        nextQData.questionText,
        nextQData.expectedPoints,
        nextQData.category,
        nextQData.difficulty,
        nextQData.codeStarterSnippet || null,
        JSON.stringify(nextQData.testCases || []),
      ]
    );

    const nextQuestion = newQInsert.rows[0];

    res.status(200).json({
      success: true,
      message: "Answer recorded and next question generated successfully",
      data: {
        responseId: savedResponse.id,
        isCompleted: false,
        turnsCount,
        interviewerFeedbackSnippet: nextQData.interviewerFeedbackSnippet,
        nextQuestion,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually end / complete an interview session
 */
export const completeSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id: sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      "UPDATE interview_sessions SET status = 'completed', completed_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id, status, completed_at AS \"completedAt\"",
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Interview session not found" });
      return;
    }

    // Trigger background evaluation so feedback report is ready immediately
    evaluateInterviewSession(sessionId, userId).catch((evalErr) => {
      console.warn("Background evaluation notice:", evalErr?.message || evalErr);
    });

    res.status(200).json({
      success: true,
      message: "Interview session concluded successfully",
      data: {
        session: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generateQuestionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const sessionRes = await pool.query(
      `SELECT id, role_title, difficulty, interview_type, resume_id 
       FROM interview_sessions 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (sessionRes.rows.length === 0) {
      res.status(404).json({ success: false, message: "Interview session not found" });
      return;
    }

    const session = sessionRes.rows[0];

    const retrievedChunks = session.resume_id
      ? await retrieveRelevantResumeContext(
          userId,
          session.resume_id,
          `${session.role_title} ${session.interview_type} projects architecture skills`,
          4
        )
      : [];

    const questions = await generateQuestionsForSession(
      session.id,
      session.role_title,
      session.difficulty,
      session.interview_type,
      retrievedChunks
    );

    await saveQuestionsToDatabase(session.id, questions);

    res.status(200).json({
      success: true,
      message: "Personalized questions generated via semantic RAG retrieval successfully",
      data: {
        sessionId: session.id,
        questions,
        retrievedContext: retrievedChunks,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const sessionRes = await pool.query(
      "SELECT id FROM interview_sessions WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (sessionRes.rows.length === 0) {
      res.status(404).json({ success: false, message: "Interview session not found" });
      return;
    }

    const qRes = await pool.query(
      `SELECT 
        id, 
        question_order AS "questionOrder", 
        question_text AS "questionText", 
        expected_points AS "expectedPoints", 
        category, 
        difficulty, 
        code_starter_snippet AS "codeStarterSnippet",
        created_at AS "createdAt"
       FROM interview_questions
       WHERE session_id = $1
       ORDER BY question_order ASC`,
      [id]
    );

    if (qRes.rows.length === 0) {
      return generateQuestionsHandler(req, res, next);
    }

    res.status(200).json({
      success: true,
      data: {
        questions: qRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger structured evaluation & scoring with Gemini
 * POST /api/interviews/:id/evaluate
 */
export const evaluateSessionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id: sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const feedback = await evaluateInterviewSession(sessionId, userId);

    res.status(200).json({
      success: true,
      message: "Session evaluated successfully",
      data: {
        feedback,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve feedback and structured score report for an interview session
 * GET /api/interviews/:id/feedback
 */
export const getFeedbackHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id: sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const data = await getSessionFeedback(sessionId, userId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

