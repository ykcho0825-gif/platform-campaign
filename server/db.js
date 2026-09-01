import { Pool } from "pg";
import "dotenv/config";

export const pool = new Pool({
  connectionString: process.env.CAMPAIGN_DATABASE_URL || undefined,
  host: process.env.LDAS_POSTGRES_HOST || process.env.PGHOST,
  port: Number(process.env.LDAS_POSTGRES_PORT || process.env.PGPORT) || undefined,
  database: process.env.LDAS_POSTGRES_DATABASE || process.env.PGDATABASE,
  user: process.env.LDAS_POSTGRES_USER || process.env.PGUSER,
  password: process.env.LDAS_POSTGRES_PASSWORD || process.env.PGPASSWORD,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
  max: Number(process.env.PGPOOL_MAX) || 10,
  statement_timeout: Number(process.env.PGSTATEMENT_TIMEOUT_MS) || 30000,
});

export const SCHEMA = process.env.CAMPAIGN_DB_SCHEMA || process.env.PGSCHEMA || "skb_3984";