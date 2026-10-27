import { Router } from "express";
import { runCode, getSupportedLanguages } from "../controllers/code.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Retrieve supported languages and boilerplates (public or authenticated)
router.get("/languages", getSupportedLanguages);

// Run code execution (protected route)
router.post("/run", authenticateToken, runCode);

export default router;
