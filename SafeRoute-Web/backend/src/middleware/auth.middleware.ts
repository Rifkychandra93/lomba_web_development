import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "USER" | "ADMIN";
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
      return;
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Format token tidak valid",
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: "USER" | "ADMIN";
    };

    req.user = decoded;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Token tidak valid atau sudah expired",
    });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  if (req.user.role !== "ADMIN") {
    res.status(403).json({
      success: false,
      message: "Akses hanya untuk admin",
    });
    return;
  }

  next();
};

export const authenticateML = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const mlApiKey = process.env.ML_API_KEY;
  const apiKey = req.headers["x-ml-key"];

  if (!apiKey || apiKey !== mlApiKey) {
    res.status(401).json({
      success: false,
      message: "ML Service Unauthorized: Invalid API Key",
    });
    return;
  }

  next();
};