import api from "@/src/lib/api";
import type { Incident } from "@/src/types/incident";

export const getMapIncidents = async () => {
  const response = await api.get<{
    success: boolean;
    data: Incident[];
  }>("/incidents/map");

  return response.data;
};