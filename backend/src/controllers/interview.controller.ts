import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { pool } from "../config/db";

const createInterviewSchema = z.object({
  roleTitle: z.string().min(2, "Role title must be at least 2 characters"),
  difficulty: z.enum(["junior", "intermediate", "senior", "lead"]).default("intermediate"),
  interviewType: z.enum(["technical", "behavioral", "coding"]).default("technical"),
  resumeId: z.string().uuid("Invalid resume ID").optional().nullable(),
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

    res.status(201).json({
      success: true,
      message: "Interview session created successfully",
      data: {
        interview: newSession,
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
