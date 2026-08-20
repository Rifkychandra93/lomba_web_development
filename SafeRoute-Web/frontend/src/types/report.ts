export type IncidentType =
  | "BEGAL"
  | "KEBAKARAN"
  | "KECELAKAAN"
  | "TAWURAN"
  | "PENCURIAN"
  | "PEMBACOKAN"
  | "LAINNYA";

export type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type ReportStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export interface Report {
  id: string;
  title: string;
  description: string;

  latitude: string | number;
  longitude: string | number;

  location?: string | null;
  address?: string | null;

  incidentType: IncidentType;
  riskLevel: RiskLevel;
  status: ReportStatus;

  imageUrl?: string | null;

  userId: string;

  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}