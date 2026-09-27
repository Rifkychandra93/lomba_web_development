import { Router } from "express";
import { login, register, googleLoginHandler } from "../controllers/auth.controller";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/database";
import bcrypt from "bcrypt";

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
        phone: true,
        role: true,
        notifNewReport: true,
        notifHighRisk: true,
        notifSystemUpdate: true,
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

router.put("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, notifNewReport, notifHighRisk, notifSystemUpdate } = req.body;
    
    // Check if email is being taken by another user
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.user!.userId) {
        res.status(400).json({ success: false, message: "Email sudah digunakan oleh pengguna lain" });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user!.userId,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(notifNewReport !== undefined && { notifNewReport }),
        ...(notifHighRisk !== undefined && { notifHighRisk }),
        ...(notifSystemUpdate !== undefined && { notifSystemUpdate }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        notifNewReport: true,
        notifHighRisk: true,
        notifSystemUpdate: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: "Pengaturan berhasil diperbarui",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui pengaturan",
    });
  }
});

router.put("/password", authenticate, async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({ success: false, message: "Password lama dan baru wajib diisi" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ success: false, message: "User tidak ditemukan" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ success: false, message: "Password lama salah" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: "Password berhasil diubah" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengubah password" });
  }
});

router.get("/users", authenticate, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data pengguna",
    });
  }
});

export default router;