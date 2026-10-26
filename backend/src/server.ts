import { createApp } from "./app";
import { config } from "./config/env";
import { testDbConnection, pool } from "./config/db";
import { runMigrations } from "./db/migrate";

const startServer = async () => {
  const app = createApp();

  // Test DB and run migrations if reachable
  const dbConnected = await testDbConnection();
  if (dbConnected) {
    try {
      await runMigrations();
    } catch (err) {
      console.error("Migration warning on startup:", err);
    }
  } else {
    console.warn(
      "⚠️ PostgreSQL connection could not be established immediately. The server will start, but database operations will wait until PostgreSQL is up (e.g. via 'docker compose up -d postgres')."
    );
  }

  const server = app.listen(config.PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 AI Mock Interview Backend running on port ${config.PORT}`);
    console.log(`📡 Health endpoint: http://localhost:${config.PORT}/api/health`);
    console.log(`🔐 Auth endpoint:   http://localhost:${config.PORT}/api/auth`);
    console.log(`Environment:      ${config.NODE_ENV}`);
    console.log(`===============================================`);
  });

  const handleShutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await pool.end();
        console.log("PostgreSQL pool closed.");
      } catch (err) {
        console.error("Error closing PostgreSQL pool:", err);
      }
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
};

startServer().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
