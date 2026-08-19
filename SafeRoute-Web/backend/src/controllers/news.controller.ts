import { Request, Response } from "express";
import {
  createNewsArticle,
  findNewsByUrl,
  getAllNewsArticles,
  getNewsArticleById,
} from "../services/news.service";

export const create = async (
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
    } = req.body;

    if (!title || !url) {
      res.status(400).json({
        success: false,
        message: "Title dan URL wajib diisi",
      });
      return;
    }

    const existingNews = await findNewsByUrl(url);

    if (existingNews) {
      res.status(409).json({
        success: false,
        message: "Berita sudah terdaftar",
        data: existingNews,
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

    res.status(201).json({
      success: true,
      message: "Berita berhasil disimpan",
      data: news,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan berita",
    });
  }
};

export const getAll = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const news = await getAllNewsArticles();

    res.json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil berita",
    });
  }
};

export const getById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const news = await getNewsArticleById(req.params.id as string);

    if (!news) {
      res.status(404).json({
        success: false,
        message: "Berita tidak ditemukan",
      });
      return;
    }

    res.json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil berita",
    });
  }
};