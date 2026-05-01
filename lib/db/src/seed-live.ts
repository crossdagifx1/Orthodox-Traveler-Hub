import path from "node:path";
import { fileURLToPath } from "node:url";

// Load env file before any other imports
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../../.env");

import { seedExamples } from "./seed-examples.js";

async function main() {
  // Now import db
  const { db } = await import("./index.js");

  console.log("Starting live database seeding...");
  try {
    await seedExamples(db);
    console.log("Live database seeding completed successfully!");
    process.exit(0);
  } catch (error: any) {
    console.error("Live database seeding failed!");
    console.error("Error Message:", error?.message);
    process.exit(1);
  }
}

main();
