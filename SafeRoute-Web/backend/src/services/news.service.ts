import prisma from "../config/database";

interface CreateNewsArticleData {
  title: string;
  url: string;
  description?: string;
  source?: string;
  publishedAt?: Date;
}

export const createNewsArticle = async (
  data: CreateNewsArticleData
) => {
  return prisma.newsArticle.create({
    data,
    include: {
      incidents: true,
    },
  });
};

export const findNewsByUrl = async (url: string) => {
  return prisma.newsArticle.findUnique({
    where: {
      url,
    },
    include: {
      incidents: true,
    },
  });
};

export const getAllNewsArticles = async () => {
  return prisma.newsArticle.findMany({
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      incidents: true,
    },
  });
};

export const getNewsArticleById = async (id: string) => {
  return prisma.newsArticle.findUnique({
    where: {
      id,
    },
    include: {
      incidents: true,
    },
  });
};