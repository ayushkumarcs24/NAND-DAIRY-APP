import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import samitiRoutes from './routes/samitis';
import vehicleRoutes from './routes/vehicles';
import milkEntryRoutes from './routes/milkEntries';
import fatSnfRoutes from './routes/fatSnf';
import reportRoutes from './routes/reports';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import { pool } from './db/pool';

dotenv.config();

// ── Startup: validate required env vars ────────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'DB_URL'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10);

// ── Security & Parsing Middleware ──────────────────────────────────────────
app.use(helmet());                // Sets secure HTTP headers
app.use(cors());                  // Allow all origins (fine for Expo Go on LAN)
app.use(express.json());          // Parse JSON bodies

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const dbResult = await pool.query('SELECT NOW() as server_time');
    res.json({
      status: 'healthy',
      database: 'connected',
      server_time: dbResult.rows[0].server_time,
      timestamp: new Date(),
    });
  } catch {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', timestamp: new Date() });
  }
});

// ── App Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/samitis',      samitiRoutes);
app.use('/api/vehicles',     vehicleRoutes);
app.use('/api/milk-entries', milkEntryRoutes);
app.use('/api/fat-snf',      fatSnfRoutes);
app.use('/api/reports',      reportRoutes);
app.use('/api/products',     productRoutes);
app.use('/api/orders',       orderRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Start Server ──────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Nand Dairy API running on port ${PORT}`);
  console.log(`🌐 LAN access: http://<YOUR-LOCAL-IP>:${PORT}`);
  console.log(`🔒 Security headers: enabled (helmet)`);
});
