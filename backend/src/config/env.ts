import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Fallback to local .env if present
dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || "",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",
  DB_NAME: process.env.DB_NAME || "mock_interview_db",
  
  // Redis configuration
  REDIS_URL: process.env.REDIS_URL || "",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  
  // JWT settings
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret_change_in_production_key_32chars",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "default_refresh_secret_change_in_production_key_32chars",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  
  // AI & Code execution services
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY || "",
  JUDGE0_API_URL: process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com",
  JUDGE0_API_HOST: process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com",
};

