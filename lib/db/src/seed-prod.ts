import { db, pool } from "./index.js";
import { seedExamples } from "./seed-examples.js";

async function run() {
  console.log("Seeding production database...");
  try {
    await seedExamples(db);
    console.log("Successfully seeded production database!");
  } catch (err) {
    console.error("Error seeding production database:", err);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

run();
