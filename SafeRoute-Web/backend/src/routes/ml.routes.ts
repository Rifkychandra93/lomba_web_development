import { Router } from "express";
import { analyzeNewsResult } from "../controllers/ml.controller";
import { authenticateML } from "../middleware/auth.middleware";

const router = Router();

router.post("/news", authenticateML, analyzeNewsResult);

export default router;