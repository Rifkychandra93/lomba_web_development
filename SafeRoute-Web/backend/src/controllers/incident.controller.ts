import { Request, Response } from "express";
import {
  getAllIncidents,
  getIncidentById,
  getMapIncidents,
} from "../services/incident.service";

export const getAll = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const incidents = await getAllIncidents();

    res.json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil incident",
    });
  }
};

export const getById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const incident = await getIncidentById(req.params.id as string);

    if (!incident) {
      res.status(404).json({
        success: false,
        message: "Incident tidak ditemukan",
      });
      return;
    }

    res.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail incident",
    });
  }
};

export const getMap = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const incidents = await getMapIncidents();

    res.json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data peta",
    });
  }
};