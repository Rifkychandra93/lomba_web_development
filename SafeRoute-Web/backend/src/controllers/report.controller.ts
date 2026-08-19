import { Response, Request } from "express";
import {
    createReport,
    getAllReports,
    getReportById,
    getReportsByUser,
    getVerifiedReports,
    updateReportStatus
} from "../services/report.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const create = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      latitude,
      longitude,
      location,
      incidentType,
      dangerLevel,
    } = req.body;

    if (
      !title ||
      !description ||
      latitude === undefined ||
      longitude === undefined ||
      !location ||
      !incidentType
    ) {
      res.status(400).json({
        success: false,
        message:
          "Title, description, latitude, longitude, location, dan incidentType wajib diisi",
      });
      return;
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      res.status(400).json({
        success: false,
        message: "Latitude dan longitude harus berupa angka",
      });
      return;
    }

    const validIncidentTypes = [
      "BEGAL",
      "KEBAKARAN",
      "KECELAKAAN",
      "TAWURAN",
      "PENCURIAN",
      "LAINNYA",
    ];

    if (!validIncidentTypes.includes(incidentType)) {
      res.status(400).json({
        success: false,
        message: "Incident type tidak valid",
      });
      return;
    }

    const validDangerLevels = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ];

    if (
      dangerLevel &&
      !validDangerLevels.includes(dangerLevel)
    ) {
      res.status(400).json({
        success: false,
        message: "Danger level tidak valid",
      });
      return;
    }

    const report = await createReport({
      title,
      description,
      latitude,
      longitude,
      location,
      incidentType,
      dangerLevel,
      userId: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      message: "Laporan berhasil dibuat",
      data: report,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal membuat laporan",
    });
  }
};

export const getAll = async (
    _req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const reports = await getAllReports();

        res.json({
            success: true,
            data: reports,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil laporan",
        });
    }
};

export const getById = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const report = await getReportById(id);

        if (!report) {
            res.status(404).json({
                success: false,
                message: "Laporan tidak ditemukan",
            });
            return;
        }

        res.json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil detail laporan",
        });
    }
};

export const getMine = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const reports = await getReportsByUser(req.user!.userId);

        res.json({
            success: true,
            data: reports,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil laporan user",
        });
    }
};

export const updateStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "PENDING",
      "VERIFIED",
      "REJECTED",
    ];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Status tidak valid",
      });
      return;
    }

    const existingReport = await getReportById(id);

    if (!existingReport) {
      res.status(404).json({
        success: false,
        message: "Laporan tidak ditemukan",
      });
      return;
    }

    const report = await updateReportStatus(id, status);

    res.json({
      success: true,
      message: `Status laporan berhasil diubah menjadi ${status}`,
      data: report,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengubah status laporan",
    });
  }
};

export const getVerified = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const reports = await getVerifiedReports();

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil laporan terverifikasi",
    });
  }
};