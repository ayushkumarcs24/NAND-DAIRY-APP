import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const isSupabase = (process.env.DB_URL || '').includes('supabase.co');

export const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
