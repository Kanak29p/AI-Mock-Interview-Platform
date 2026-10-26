import { pool } from "../config/db";
import { generateEmbedding, toPgVector } from "./embedding.service";

export interface ResumeChunk {
  chunkIndex: number;
  sectionTitle: string;
  content: string;
}

export interface RetrievedChunk {
  id: string;
  sectionTitle: string;
  content: string;
  similarity: number;
}

/**
 * Intelligent section-based chunker for resumes
 */
export const chunkResumeText = (rawText: string): ResumeChunk[] => {
  if (!rawText || rawText.trim().length === 0) return [];

  // Common section headings in software engineering resumes
  const sectionKeywords = [
    "experience",
    "work experience",
    "employment",
    "projects",
    "technical projects",
    "skills",
    "technical skills",
    "technologies",
    "education",
    "certifications",
    "summary",
    "professional summary",
    "objective",
    "achievements",
    "publications",
  ];

  const lines = rawText.split(/\r?\n/);
  const chunks: ResumeChunk[] = [];
  let currentSection = "General Overview";
  let currentParagraphs: string[] = [];

  const flushChunk = () => {
    const content = currentParagraphs.join("\n").trim();
    if (content.length > 30) {
      // If a section is very large (> 1500 chars), split it into smaller overlapping pieces
      if (content.length > 1500) {
        const sentences = content.split(/(?<=[.?!])\s+/);
        let piece = "";
        for (const sentence of sentences) {
          if ((piece + sentence).length > 1200 && piece.length > 0) {
            chunks.push({
              chunkIndex: chunks.length,
              sectionTitle: currentSection,
              content: piece.trim(),
            });
            piece = "";
          }
          piece += sentence + " ";
        }
        if (piece.trim().length > 30) {
          chunks.push({
            chunkIndex: chunks.length,
            sectionTitle: currentSection,
            content: piece.trim(),
          });
        }
      } else {
        chunks.push({
          chunkIndex: chunks.length,
          sectionTitle: currentSection,
          content,
        });
      }
    }
    currentParagraphs = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line looks like a section header
    const cleanLine = trimmed.replace(/^[^a-zA-Z0-9]+|[:#*-]+$/g, "").toLowerCase();
    const isSectionHeader =
      sectionKeywords.some((k) => cleanLine === k || cleanLine.startsWith(k + " ")) &&
      trimmed.length < 40;

    if (isSectionHeader) {
      flushChunk();
      currentSection = trimmed.replace(/[:#*]/g, "").trim();
    } else {
      currentParagraphs.push(trimmed);
      // Periodic flush if current block exceeds 1000 characters without a heading
      if (currentParagraphs.join("\n").length > 1000) {
        flushChunk();
      }
    }
  }

  flushChunk();

  // If no structured chunks were created, fallback to splitting by paragraphs
  if (chunks.length === 0) {
    const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
    paragraphs.forEach((p, idx) => {
      chunks.push({
        chunkIndex: idx,
        sectionTitle: `Section ${idx + 1}`,
        content: p.trim(),
      });
    });
  }

  return chunks;
};

/**
 * Process resume: generates full-document embedding + section chunk embeddings and saves into pgvector
 */
export const indexResumeWithEmbeddings = async (
  resumeId: string,
  userId: string,
  rawText: string
): Promise<number> => {
  if (!rawText || rawText.trim().length === 0) return 0;

  // 1. Generate and store overall document embedding
  const docEmbedding = await generateEmbedding(rawText.slice(0, 4000));
  const docVectorStr = toPgVector(docEmbedding);

  await pool.query("UPDATE resumes SET embedding = $1::vector WHERE id = $2 AND user_id = $3", [
    docVectorStr,
    resumeId,
    userId,
  ]);

  // 2. Break down into semantic chunks
  const chunks = chunkResumeText(rawText);
  if (chunks.length === 0) return 0;

  // Delete previous chunks if re-indexing
  await pool.query("DELETE FROM resume_chunks WHERE resume_id = $1", [resumeId]);

  // 3. Generate embeddings and insert each chunk
  for (const chunk of chunks) {
    const chunkEmbedding = await generateEmbedding(`${chunk.sectionTitle}: ${chunk.content}`);
    const chunkVectorStr = toPgVector(chunkEmbedding);

    await pool.query(
      `INSERT INTO resume_chunks (resume_id, user_id, chunk_index, section_title, content, embedding)
       VALUES ($1, $2, $3, $4, $5, $6::vector)`,
      [resumeId, userId, chunk.chunkIndex, chunk.sectionTitle, chunk.content, chunkVectorStr]
    );
  }

  console.log(`Successfully indexed ${chunks.length} chunks with embeddings for resume ${resumeId}`);
  return chunks.length;
};

/**
 * Semantic retrieval: Performs vector similarity search over candidate resume chunks
 */
export const retrieveRelevantResumeContext = async (
  userId: string,
  resumeId: string | null | undefined,
  queryText: string,
  limit = 3
): Promise<RetrievedChunk[]> => {
  if (!resumeId || !queryText) return [];

  try {
    const queryEmbedding = await generateEmbedding(queryText);
    const queryVectorStr = toPgVector(queryEmbedding);

    const result = await pool.query(
      `SELECT 
        id, 
        section_title AS "sectionTitle", 
        content, 
        1 - (embedding <=> $1::vector) AS similarity
       FROM resume_chunks
       WHERE user_id = $2 AND resume_id = $3
       ORDER BY embedding <=> $1::vector ASC
       LIMIT $4`,
      [queryVectorStr, userId, resumeId, limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      sectionTitle: row.sectionTitle,
      content: row.content,
      similarity: Number(row.similarity) || 0,
    }));
  } catch (error) {
    console.error("Error executing semantic resume retrieval:", error);
    return [];
  }
};
