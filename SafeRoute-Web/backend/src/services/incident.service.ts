import prisma from "../config/database";

type IncidentType =
  | "BEGAL"
  | "KEBAKARAN"
  | "KECELAKAAN"
  | "TAWURAN"
  | "PENCURIAN"
  | "PEMBACOKAN"
  | "LAINNYA";

type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

interface CreateIncidentData {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  incidentType: IncidentType;
  riskLevel?: RiskLevel;
  mlConfidence?: number;
  newsId?: string;
  detectedAt?: Date;
}

export const createIncident = async (
  data: CreateIncidentData
) => {
  return prisma.incident.create({
    data: {
      title: data.title,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      incidentType: data.incidentType,
      riskLevel: data.riskLevel ?? "MEDIUM",
      mlConfidence: data.mlConfidence,
      newsId: data.newsId,
      detectedAt: data.detectedAt,
    },
    include: {
      news: true,
    },
  });
};

export const getAllIncidents = async () => {
  return prisma.incident.findMany({
    orderBy: {
      detectedAt: "desc",
    },
    include: {
      news: true,
    },
  });
};

export const getIncidentById = async (id: string) => {
  return prisma.incident.findUnique({
    where: {
      id,
    },
    include: {
      news: true,
    },
  });
};

export const getMapIncidents = async () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // 1. Ambil data insiden dari ML Crawler
  const incidents = await prisma.incident.findMany({
    where: {
      detectedAt: {
        gte: oneMonthAgo,
      },
    },
    orderBy: {
      detectedAt: "desc",
    },
    include: {
      news: {
        select: {
          id: true,
          title: true,
          url: true,
          source: true,
          publishedAt: true,
        },
      },
    },
  });

  const verifiedReports = await prisma.report.findMany({
    where: {
      status: "VERIFIED",
      createdAt: {
        gte: oneMonthAgo,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  const mapPoints = [
    ...incidents.map((inc) => ({
      id: inc.id,
      sourceType: "ML_CRAWLER",
      title: inc.title,
      description: inc.description,
      latitude: Number(inc.latitude),
      longitude: Number(inc.longitude),
      address: inc.address,
      incidentType: inc.incidentType,
      riskLevel: inc.riskLevel,
      detectedAt: inc.detectedAt,
      news: inc.news,
      mlConfidence: inc.mlConfidence ? Number(inc.mlConfidence) : null,
    })),
    ...verifiedReports.map((rep) => ({
      id: rep.id,
      sourceType: "USER_REPORT",
      title: rep.title,
      description: rep.description,
      latitude: Number(rep.latitude),
      longitude: Number(rep.longitude),
      address: rep.address || rep.location || null,
      incidentType: rep.incidentType,
      riskLevel: rep.riskLevel,
      detectedAt: rep.verifiedAt || rep.createdAt,
      news: null,
      mlConfidence: null,
      reporterName: rep.user.name,
      imageUrl: rep.imageUrl,
    })),
  ];

  return mapPoints.sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );
};