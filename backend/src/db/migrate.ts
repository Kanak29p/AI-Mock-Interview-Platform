import fs from "fs";
import path from "path";
import { pool } from "../config/db";

export const runMigrations = async (): Promise<void> => {
  console.log("Running database migrations...");
  const schemaPath = path.join(__dirname, "schema.sql");
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query("COMMIT");
    console.log("Database schema migrated successfully (tables, indexes & pgvector extension).");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration error:", error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Migration complete!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
