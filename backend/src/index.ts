import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import samitiRoutes from './routes/samitis';
import vehicleRoutes from './routes/vehicles';
import milkEntryRoutes from './routes/milkEntries';
import fatSnfRoutes from './routes/fatSnf';
import reportRoutes from './routes/reports';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Enable CORS for all origins so mobile devices (Expo Go) can connect
app.use(cors());
app.use(express.json());

// Main basic health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date(), message: 'Nand Dairy API is running' });
});

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/samitis', samitiRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/milk-entries', milkEntryRoutes);
app.use('/api/fat-snf', fatSnfRoutes);
app.use('/api/reports', reportRoutes);

// Start Express server on 0.0.0.0 for LAN access
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Accessible on network at http://<YOUR-LOCAL-IP>:${PORT}`);
});
