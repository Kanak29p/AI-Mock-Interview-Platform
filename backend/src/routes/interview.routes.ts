import { Router } from "express";
import {
  getInterviews,
  createInterview,
  getInterviewById,
} from "../controllers/interview.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/", getInterviews);
router.post("/", createInterview);
router.get("/:id", getInterviewById);

export default router;
