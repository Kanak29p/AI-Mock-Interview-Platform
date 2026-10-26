import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { config } from "./config/env";

export const createApp = (): Application => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: [config.CORS_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Request logger
  if (config.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use("/api", routes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
