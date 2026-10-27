import { Router } from "express";
import {
  getInterviews,
  createInterview,
  getInterviewById,
  generateQuestionsHandler,
  getQuestionsHandler,
  startSession,
  getSessionTurns,
  submitResponseAndGetNext,
  completeSession,
  evaluateSessionHandler,
  getFeedbackHandler,
} from "../controllers/interview.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/", getInterviews);
router.post("/", createInterview);
router.get("/:id", getInterviewById);
router.post("/:id/start", startSession);
router.get("/:id/turns", getSessionTurns);
router.post("/:id/respond", submitResponseAndGetNext);
router.post("/:id/complete", completeSession);
router.post("/:id/evaluate", evaluateSessionHandler);
router.get("/:id/feedback", getFeedbackHandler);
router.post("/:id/generate-questions", generateQuestionsHandler);
router.get("/:id/questions", getQuestionsHandler);

export default router;
