import { Router } from "express";
import {
  create,
  getAll,
  getById,
} from "../controllers/news.controller";
import {
  authenticate,
  requireAdmin,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  requireAdmin,
  getAll
);

router.get(
  "/:id",
  authenticate,
  requireAdmin,
  getById
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  create
);

export default router;