import { Request, Response } from "express";
import { createNewsArticle } from "../services/news.service";
import { createIncident } from "../services/incident.service";
import prisma from "../config/database";

export const analyzeNewsResult = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      url,
      description,
      source,
      publishedAt,

      incidentTitle,
      incidentDescription,
      location,
      latitude,
      longitude,
      incidentType,
      riskLevel,
      mlConfidence,
    } = req.body;

    if (
      !title ||
      !url ||
      !incidentTitle ||
      latitude === undefined ||
      longitude === undefined ||
      !incidentType
    ) {
      res.status(400).json({
        success: false,
        message:
          "Data berita dan hasil incident wajib diisi",
      });
      return;
    }

    const existingNews = await prisma.newsArticle.findUnique({
      where: {
        url,
      },
    });

    if (existingNews) {
      res.status(409).json({
        success: false,
        message: "Berita sudah pernah diproses (URL duplikat)",
        data: existingNews,
      });
      return;
    }

    const duplicateTitleNews = await prisma.newsArticle.findFirst({
      where: {
        title: {
          equals: title,
          mode: "insensitive",
        },
        source: source || undefined,
      },
    });

    if (duplicateTitleNews) {
      res.status(409).json({
        success: false,
        message: "Berita dengan judul serupa sudah pernah diproses",
        data: duplicateTitleNews,
      });
      return;
    }

    const publishedDate = publishedAt ? new Date(publishedAt) : new Date();
    const twoDaysBefore = new Date(publishedDate.getTime() - 2 * 24 * 60 * 60 * 1000);
    const twoDaysAfter = new Date(publishedDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    const duplicateIncident = await prisma.incident.findFirst({
      where: {
        incidentType,
        latitude: {
          gte: Number(latitude) - 0.005,
          lte: Number(latitude) + 0.005,
        },
        longitude: {
          gte: Number(longitude) - 0.005,
          lte: Number(longitude) + 0.005,
        },
        detectedAt: {
          gte: twoDaysBefore,
          lte: twoDaysAfter,
        },
      },
    });

    if (duplicateIncident) {
      res.status(409).json({
        success: false,
        message: "Insiden serupa di lokasi terdekat sudah tercatat",
        data: duplicateIncident,
      });
      return;
    }

    const news = await createNewsArticle({
      title,
      url,
      description,
      source,
      publishedAt: publishedAt
        ? new Date(publishedAt)
        : undefined,
    });

    const incident = await createIncident({
      title: incidentTitle,
      description: incidentDescription,
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: location,
      incidentType,
      riskLevel,
      mlConfidence:
        mlConfidence !== undefined
          ? Number(mlConfidence)
          : undefined,
      newsId: news.id,
    });

    res.status(201).json({
      success: true,
      message: "Hasil ML berhasil disimpan",
      data: {
        news,
        incident,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan hasil ML",
    });
  }
};