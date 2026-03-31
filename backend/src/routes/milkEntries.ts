import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();

router.use(authenticateToken);

router.post('/', requireRole(['admin', 'milk-entry']), async (req: AuthRequest, res: Response) => {
    const { samiti_id, shift, entry_date, milk_quantity_liters } = req.body;

    try {
        // Simple transaction using connection pool
        const result = await pool.query(
            `INSERT INTO milk_entries (samiti_id, shift, entry_date, milk_quantity_liters, entered_by) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [samiti_id, shift, entry_date, milk_quantity_liters, req.user?.id]
        );
        res.status(201).json({ message: 'Milk entry submitted successfully', entryId: result.rows[0].id });
    } catch (error) {
        console.error('Milk entry error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.get('/today', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT m.id, m.shift, m.milk_quantity_liters, m.entry_date, s.name as samiti_name, s.code_4digit
             FROM milk_entries m
             JOIN samitis s ON m.samiti_id = s.id
             WHERE m.entry_date = CURRENT_DATE 
             ORDER BY m.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
