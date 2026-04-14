import { pool } from '../db/pool';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('Running migrations...');
  const migrationsDir = path.join(__dirname, '../db/migrations');

  // Get all .sql files sorted alphabetically (001, 002, ...)
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    try {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await pool.query(sql);
      console.log(`✅ Migration successful: ${file}`);
    } catch (error: any) {
      // If table/column already exists, skip gracefully
      if (error.code === '42701' || error.code === '42P07') {
        console.log(`⚠️  Skipped (already applied): ${file}`);
      } else {
        console.error(`❌ Migration failed: ${file}`, error.message);
        process.exit(1);
      }
    }
  }

  await pool.end();
  console.log('All migrations complete.');
}

runMigrations();
