import { IncidentType } from "@prisma/client";
import prisma from "../config/database";

interface CreateReportData {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location: string;
  incidentType: IncidentType;
  dangerLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  userId: string;
}

export const createReport = async ({
  title,
  description,
  latitude,
  longitude,
  location,
  incidentType,
  dangerLevel = "MEDIUM",
  userId,
}: CreateReportData) => {
  return prisma.report.create({
    data: {
      title,
      description,
      latitude,
      longitude,
      location,
      incidentType,
      dangerLevel,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const getAllReports = async () => {
  return prisma.report.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const getReportById = async (id: string) => {
  return prisma.report.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const getReportsByUser = async (userId: string) => {
  return prisma.report.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const updateReportStatus = async (
  id: string,
  status: "PENDING" | "VERIFIED" | "REJECTED"
) => {
  return prisma.report.update({
    where: {
      id,
    },
    data: {
      status,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const getVerifiedReports = async () => {
  return prisma.report.findMany({
    where: {
      status: "VERIFIED",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};