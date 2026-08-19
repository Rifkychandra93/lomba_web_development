import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import reportRoutes from "./routes/report.routes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "SafeRoute API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

export default app;