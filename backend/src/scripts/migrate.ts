import { pool } from '../db/pool';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('Running migrations...');
  try {
    const migrationPath = path.join(__dirname, '../db/migrations/001_init.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    await pool.query(migrationSql);
    console.log('Migration successful: 001_init.sql');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();
