import api from "@/src/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export const getAllUsers = async () => {
  const response = await api.get<{
    success: boolean;
    data: User[];
  }>("/auth/users");

  return response.data;
};
