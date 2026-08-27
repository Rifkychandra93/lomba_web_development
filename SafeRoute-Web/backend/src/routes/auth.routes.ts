import { Router } from "express";
import { login, register, googleLoginHandler } from "../controllers/auth.controller";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/database";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLoginHandler);

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});

export default router;