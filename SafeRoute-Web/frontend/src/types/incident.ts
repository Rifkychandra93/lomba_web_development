import type {
  IncidentType,
  RiskLevel,
} from "./report";

export interface Incident {
  id: string;

  title: string;
  description?: string | null;

  latitude: string | number;
  longitude: string | number;

  address?: string | null;

  incidentType: IncidentType;
  riskLevel: RiskLevel;

  mlConfidence?: string | number | null;

  detectedAt: string;
  createdAt?: string;
  updatedAt?: string;

  news?: {
    id: string;
    title: string;
    url: string;
    source?: string | null;
    publishedAt?: string | null;
  } | null;
}