import api from "@/src/lib/api";
import type { Report } from "@/src/types/report";

export interface CreateReportPayload {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location?: string;
  address?: string;
  incidentType: Report["incidentType"];
  riskLevel?: Report["riskLevel"];
  imageUrl?: string;
  createdAt?: string;
}

export const createReport = async (
  payload: CreateReportPayload
) => {
  const response = await api.post("/reports", payload);

  return response.data;
};

export const getMyReports = async () => {
  const response = await api.get<{
    success: boolean;
    data: Report[];
  }>("/reports/mine");

  return response.data;
};

export const getVerifiedReports = async () => {
  const response = await api.get<{
    success: boolean;
    data: Report[];
  }>("/reports/verified");

  return response.data;
};

export const getAllReports = async () => {
  const response = await api.get<{
    success: boolean;
    data: Report[];
  }>("/reports");

  return response.data;
};

export const updateReportStatus = async (id: string, status: "PENDING" | "VERIFIED" | "REJECTED" | "TERVERIFIKASI") => {
  // If the frontend uses "TERVERIFIKASI", map it to "VERIFIED" for the backend
  const backendStatus = status === "TERVERIFIKASI" ? "VERIFIED" : status;
  const response = await api.put<{ success: boolean; data: Report }>(`/reports/${id}/status`, { status: backendStatus });
  return response.data;
};