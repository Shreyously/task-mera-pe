import fs from "node:fs";
import path from "node:path";
import { pool } from "./pool";

async function main(): Promise<void> {
  const fileArg = process.argv[2];

  if (!fileArg) {
    throw new Error("Usage: ts-node src/db/run-sql.ts <path-to-sql-file>");
  }

  const resolvedPath = path.resolve(fileArg);
  const sql = fs.readFileSync(resolvedPath, "utf8");

  await pool.query(sql);
  await pool.end();

  console.log(`Executed SQL file: ${resolvedPath}`);
}

main().catch(async (error: unknown) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});