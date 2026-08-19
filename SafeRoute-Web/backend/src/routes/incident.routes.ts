import { Router } from "express";
import {
  getAll,
  getById,
  getMap,
} from "../controllers/incident.controller";
import {
  authenticate,
  requireAdmin,
} from "../middleware/auth.middleware";

const router = Router();

router.get("/map", getMap);

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

export default router;