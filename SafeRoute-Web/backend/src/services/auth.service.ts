import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/database";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface GoogleLoginData {
  idToken: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET belum diatur di file .env");
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const registerUser = async ({
  name,
  email,
  phone,
  password,
}: RegisterData) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error("Email sudah terdaftar");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
    },
  });

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export const loginUser = async ({ email, password }: LoginData) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Email atau password salah");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new Error("Email atau password salah");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export const googleLogin = async ({ idToken }: GoogleLoginData) => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID belum diatur di file .env");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new Error("Token Google tidak valid atau sudah kedaluwarsa");
  }

  if (!payload || !payload.email) {
    throw new Error("Gagal membaca data akun Google");
  }

  const { email, name } = payload;

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const randomPassword = crypto.randomBytes(24).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        password: hashedPassword,
      },
    });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};