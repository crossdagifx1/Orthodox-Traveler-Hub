import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema/index.js";
import { readFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { seedExamples } from "./seed-examples.js";
import { BADGE_SEEDS } from "./seed-badges.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function init() {
  console.log("Initializing local PGlite database (in-memory)...");
  const pglite = new PGlite();
  const db = drizzle(pglite, { schema });

  // Apply all migrations in order
  const migrationsDir = path.resolve(__dirname, "../drizzle");
  const migrationFiles = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${migrationFiles.length} migration files...`);
  
  for (const file of migrationFiles) {
    console.log(`Applying ${file}...`);
    const migrationPath = path.resolve(migrationsDir, file);
    const sql = readFileSync(migrationPath, "utf8");
    await pglite.exec(sql);
  }

  console.log("Seeding admin user...");
  const passwordHash = await bcrypt.hash("guzo-admin-2026", 10);
  await db.insert(schema.usersTable).values({
    email: "admin@guzo.app",
    name: "Abune Guzo",
    passwordHash: passwordHash,
    role: "superadmin",
  }).onConflictDoNothing();

  console.log("Seeding badges...");
  for (const b of BADGE_SEEDS) {
    await db.insert(schema.badgesTable).values({
      key: b.key,
      name: b.name,
      description: b.description,
      iconKey: b.iconKey,
      tier: b.tier,
      sortOrder: b.sortOrder,
    }).onConflictDoNothing();
  }

  console.log("Seeding real examples...");
  await seedExamples(db);

  console.log("Database initialized successfully.");
  await pglite.close();
}

init().catch(console.error);
