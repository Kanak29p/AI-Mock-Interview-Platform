import { Request, Response, NextFunction } from "express";
import { PDFParse } from "pdf-parse";
import { pool } from "../config/db";
import { indexResumeWithEmbeddings, retrieveRelevantResumeContext } from "../services/rag.service";

// Common tech keywords to extract from resumes
const TECH_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Golang", "Rust", "Ruby",
  "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express", "NestJS", "FastAPI", "Django", "Spring Boot",
  "Tailwind CSS", "HTML5", "CSS3", "Redux", "GraphQL", "REST API", "gRPC", "WebSockets",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "Prisma",
  "Docker", "Kubernetes", "AWS", "Google Cloud", "GCP", "Azure", "Terraform", "CI/CD", "GitHub Actions",
  "System Design", "Microservices", "Data Structures", "Algorithms", "Kafka", "RabbitMQ", "Linux", "Git"
];

const extractSkills = (text: string): string[] => {
  const lowerText = text.toLowerCase();
  const matched = new Set<string>();

  for (const skill of TECH_SKILLS) {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(lowerText)) {
      matched.add(skill);
    }
  }

  return Array.from(matched);
};

export const uploadResume = async (
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

    if (!req.file) {
      res.status(400).json({ success: false, message: "No resume file uploaded" });
      return;
    }

    const { originalname, mimetype, buffer } = req.file;
    let rawText = "";

    if (mimetype === "application/pdf" || originalname.toLowerCase().endsWith(".pdf")) {
      try {
        const parser = new PDFParse({ data: buffer });
        const parsed = await parser.getText();
        rawText = parsed.text || "";
      } catch (pdfErr) {
        console.warn("Could not parse PDF using pdf-parse, extracting raw buffer snippet", pdfErr);
        rawText = buffer.toString("utf-8", 0, Math.min(buffer.length, 50000));
      }
    } else {
      // Plain text or markdown
      rawText = buffer.toString("utf-8");
    }

    // Extract detected skills
    const parsedSkills = extractSkills(rawText);

    // Insert into resumes table
    const result = await pool.query(
      `INSERT INTO resumes (user_id, file_name, raw_text, parsed_skills)
       VALUES ($1, $2, $3, $4)
       RETURNING id, file_name AS "fileName", parsed_skills AS "parsedSkills", created_at AS "createdAt"`,
      [userId, originalname, rawText.trim(), parsedSkills]
    );

    const newResume = result.rows[0];

    // Generate embeddings and index semantic chunks for RAG
    let indexedChunks = 0;
    try {
      indexedChunks = await indexResumeWithEmbeddings(newResume.id, userId, rawText);
    } catch (embedErr) {
      console.warn("Could not index resume chunks with embeddings:", embedErr);
    }

    res.status(201).json({
      success: true,
      message: "Resume uploaded, parsed, and embedded for RAG successfully",
      data: {
        resume: {
          ...newResume,
          indexedChunks,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const searchResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { query, limit } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!query || typeof query !== "string") {
      res.status(400).json({ success: false, message: "Search query is required" });
      return;
    }

    const matches = await retrieveRelevantResumeContext(
      userId,
      id,
      query,
      typeof limit === "number" ? limit : 3
    );

    res.status(200).json({
      success: true,
      data: {
        query,
        matches,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getResumes = async (
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
        id, 
        file_name AS "fileName", 
        parsed_skills AS "parsedSkills", 
        created_at AS "createdAt"
       FROM resumes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        resumes: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResume = async (
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
      "DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Resume not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
