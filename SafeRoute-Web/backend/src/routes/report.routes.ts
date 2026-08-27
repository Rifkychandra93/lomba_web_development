import { Router } from "express";
import {
  create,
  getAll,
  getById,
  getMine,
  getVerified,
  updateStatus
} from "../controllers/report.controller";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.get("/verified", getVerified);
router.use(authenticate);

router.post("/", create);
router.get("/", getAll);
router.get("/mine", getMine);
router.get("/:id", getById);
router.put("/:id/status", updateStatus);

export default router;