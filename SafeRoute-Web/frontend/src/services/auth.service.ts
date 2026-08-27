import api from "@/src/lib/api";
import type { AuthResponse } from "@/src/types/auth";

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export const registerUser = async (
  payload: RegisterPayload
) => {
  const response = await api.post<AuthResponse>(
    "/auth/register",
    payload
  );

  return response.data;
};

export const loginUser = async (
  payload: LoginPayload
) => {
  const response = await api.post<AuthResponse>(
    "/auth/login",
    payload
  );

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};

export const googleLogin = async (idToken: string) => {
  const response = await api.post<AuthResponse>("/auth/google",{
    credential: idToken,
  });

  return response.data;
};