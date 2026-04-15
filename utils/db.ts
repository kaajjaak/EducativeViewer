import Database from "better-sqlite3";
import path from "node:path";

let dbSingleton: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbSingleton) {
    const dbPath =
      process.env.DB_PATH ||
      path.join(process.cwd(), "data", "javascript-in-detail.db");
    dbSingleton = new Database(dbPath, { readonly: true, fileMustExist: true });
  }
  return dbSingleton;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rows<T = any>(sql: string, params: unknown[] = []): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function row<T = any>(sql: string, params: unknown[] = []): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}
