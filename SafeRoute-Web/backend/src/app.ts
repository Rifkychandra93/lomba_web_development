import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import reportRoutes from "./routes/report.routes";
import newsRoutes from "./routes/news.routes";
import incidentRoutes from "./routes/incident.routes";
import mlRoutes from "./routes/ml.routes";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://lomba-web-development-o7jy.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "SafeRoute API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/incident", incidentRoutes);
app.use("/api/ml", mlRoutes);

export default app;