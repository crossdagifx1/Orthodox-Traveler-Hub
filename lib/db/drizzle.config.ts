import { defineConfig } from "drizzle-kit";
import path from "path";

const databaseUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/placeholder";

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
