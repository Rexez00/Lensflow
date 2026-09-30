import postgres from "postgres";

let _sql: ReturnType<typeof postgres> | null = null;

/** Lazy Postgres client. Safe to import at build time: no connection opens
 *  until the first query, and every data page is force-dynamic. */
export function db() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 10 });
  }
  return _sql;
}

export type Row = Record<string, any>;
