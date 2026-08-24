import { Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service";

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, nomor telepon, dan password wajib diisi",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter",
      });
      return;
    }

    const result = await registerUser({
      name,
      email,
      phone,
      password,
    });

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi",
      });
      return;
    }

    const result = await loginUser({
      email,
      password,
    });

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan";

    res.status(401).json({
      success: false,
      message,
    });
  }
};