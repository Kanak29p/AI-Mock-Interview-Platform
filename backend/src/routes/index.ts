import { Router } from "express";
import authRoutes from "./auth.routes";
import resumeRoutes from "./resume.routes";
import interviewRoutes from "./interview.routes";
import codeRoutes from "./code.routes";
import { pool } from "../config/db";
import { redis } from "../config/redis";

const router = Router();

// Health check endpoint
router.get("/health", async (req, res) => {
  let dbStatus = "disconnected";
  let redisStatus = "disconnected";

  try {
    const dbRes = await pool.query("SELECT 1 as alive");
    if (dbRes.rows[0]?.alive === 1) dbStatus = "connected";
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  try {
    if (redis && redis.status === "ready") {
      redisStatus = "connected";
    } else if (redis) {
      redisStatus = redis.status;
    }
  } catch (err: any) {
    redisStatus = `error: ${err.message}`;
  }

  const isHealthy = dbStatus === "connected";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

// Mounted sub-routes
router.use("/auth", authRoutes);
router.use("/resumes", resumeRoutes);
router.use("/interviews", interviewRoutes);
router.use("/code", codeRoutes);

export default router;
