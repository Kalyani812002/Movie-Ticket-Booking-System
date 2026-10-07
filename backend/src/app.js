import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { getClientOrigin } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import showRoutes from "./routes/showRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: getClientOrigin(), credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_request, response) => {
  const connected = mongoose.connection.readyState === 1;
  response.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "unavailable",
    database: connected ? "connected" : "disconnected"
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/bookings", bookingRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
