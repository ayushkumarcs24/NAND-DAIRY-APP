import { pool } from '../db/pool';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const result = await pool.query(
      `INSERT INTO users (name, mobile_number, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (mobile_number) DO NOTHING
       RETURNING *`,
      ['Admin User', '9999999999', passwordHash, 'admin', true]
    );
    if (result.rows.length > 0) {
        console.log('Seed successful: Created default admin user +91 9999999999 with pass admin123');
    } else {
        console.log('Seed message: Admin user already exists');
    }
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

seed();
