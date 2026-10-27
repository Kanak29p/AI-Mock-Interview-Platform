import { Pool } from "pg";
import { config } from "./env";

const poolConfig = config.DATABASE_URL
  ? { connectionString: config.DATABASE_URL }
  : {
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
    };

export const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export const query = (text: string, params?: unknown[]) => {
  return pool.query(text, params);
};

export const testDbConnection = async (): Promise<boolean> => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Connected to PostgreSQL successfully at", res.rows[0].now);
    return true;
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
    return false;
  }
};
