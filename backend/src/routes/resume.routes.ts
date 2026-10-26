import { Router } from "express";
import multer from "multer";
import { uploadResume, getResumes, deleteResume } from "../controllers/resume.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max limit
  },
});

router.use(authenticateToken);

router.get("/", getResumes);
router.post("/upload", upload.single("resume"), uploadResume);
router.delete("/:id", deleteResume);

export default router;
