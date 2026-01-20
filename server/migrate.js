import path from "path";
import { db, runMigrations } from "./db.js";

const migrationsDir = path.resolve("server/migrations");

runMigrations(db, migrationsDir);
console.log("Migrations applied.");
