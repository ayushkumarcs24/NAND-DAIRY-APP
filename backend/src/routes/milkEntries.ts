import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();

router.use(authenticateToken);

router.post('/', requireRole(['admin', 'milk-entry']), async (req: AuthRequest, res: Response) => {
    const { samiti_id, shift, entry_date, milk_quantity_liters } = req.body;

    if (!samiti_id || !shift || !entry_date || !milk_quantity_liters) {
        res.status(400).json({ error: 'samiti_id, shift, entry_date, and milk_quantity_liters are required.' });
        return;
    }

    try {
        const result = await pool.query(
            `INSERT INTO milk_entries (samiti_id, shift, entry_date, milk_quantity_liters, entered_by) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [samiti_id, shift, entry_date, milk_quantity_liters, req.user?.id]
        );
        res.status(201).json({ message: 'Milk entry submitted successfully', entryId: result.rows[0].id });
    } catch (error: any) {
        if (error.code === '23505') {
            res.status(409).json({ error: 'A milk entry for this samiti, shift, and date already exists.' });
        } else {
            console.error('Milk entry error:', error);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
});

// GET today's milk entries, with optional ?shift=morning|evening filter
router.get('/today', async (req: AuthRequest, res: Response) => {
    try {
        const { shift } = req.query;
        let query = `
            SELECT m.id, m.shift, m.milk_quantity_liters, m.entry_date, m.created_at,
                   s.name as samiti_name, s.code_4digit
            FROM milk_entries m
            JOIN samitis s ON m.samiti_id = s.id
            WHERE m.entry_date = CURRENT_DATE`;
        const params: any[] = [];

        if (shift) {
            params.push(shift);
            query += ` AND m.shift = $${params.length}`;
        }

        query += ' ORDER BY m.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;

