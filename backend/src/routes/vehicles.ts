import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();

router.use(authenticateToken);

// GET all vehicles and their mapped samitis
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT v.id, v.vehicle_number, v.samiti_id, s.name as samiti_name, s.code_4digit as samiti_code
             FROM vehicles v
             LEFT JOIN samitis s ON v.samiti_id = s.id
             ORDER BY v.vehicle_number ASC`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST assign vehicle to samiti (Admin only)
router.post('/', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
    const { vehicle_number, samiti_id } = req.body;
    if (!vehicle_number || !samiti_id) {
        res.status(400).json({ error: 'vehicle_number and samiti_id are required.' });
        return;
    }
    try {
        const result = await pool.query(
            `INSERT INTO vehicles (vehicle_number, samiti_id) 
             VALUES ($1, $2) RETURNING *`,
            [vehicle_number, samiti_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Vehicle number already exists.' });
        } else {
             res.status(500).json({ error: 'Database error' });
        }
    }
});

// DELETE vehicle mapping (Admin only)
router.delete('/:id', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Vehicle not found.' });
            return;
        }
        res.json({ message: 'Vehicle removed successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// GET samiti details by vehicle number (for milk entry screen search)
router.get('/search/:vehicle_number', requireRole(['admin', 'milk-entry']), async (req: AuthRequest, res: Response) => {
     try {
         const { vehicle_number } = req.params;
         const result = await pool.query(
               `SELECT s.id as samiti_id, s.name as samiti_name, s.code_4digit
                FROM vehicles v
                JOIN samitis s ON v.samiti_id = s.id
                WHERE v.vehicle_number = $1`,
                [vehicle_number]
         );

         if (result.rows.length === 0) {
              res.status(404).json({ error: 'Vehicle mapping to Samiti not found.' });
              return;
         }

         res.json(result.rows[0]);
     } catch (error) {
         res.status(500).json({ error: 'Database error' });
     }
});

export default router;

