import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin', 'report']));

router.get('/daily', async (req: AuthRequest, res: Response) => {
    try {
        const { date } = req.query; // format 'YYYY-MM-DD'

        if (!date) {
             res.status(400).json({ error: 'Date is required.' });
             return;
        }

        const result = await pool.query(
            `SELECT s.id as samiti_id, s.name as samiti_name, s.code_4digit as samiti_code,
                    SUM(m.milk_quantity_liters) as total_milk,
                    ROUND(AVG(f.fat_value), 2) as avg_fat,
                    ROUND(AVG(f.snf_value), 2) as avg_snf,
                    SUM(f.total_amount) as total_amount
             FROM milk_entries m
             JOIN samitis s ON m.samiti_id = s.id
             LEFT JOIN fat_snf_entries f ON m.id = f.milk_entry_id
             WHERE m.entry_date = $1
             GROUP BY s.id, s.name, s.code_4digit
             ORDER BY s.name ASC`,
            [date]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/bill', async (req: AuthRequest, res: Response) => {
    try {
        const { samiti_id, from_date, to_date } = req.query;

        if (!samiti_id || !from_date || !to_date) {
            res.status(400).json({ error: 'samiti_id, from_date, and to_date are required.' });
            return;
        }

        const result = await pool.query(
            `SELECT m.entry_date as date, 
                    m.milk_quantity_liters as milk, 
                    COALESCE(f.fat_value, 0) as fat, 
                    COALESCE(f.snf_value, 0) as snf, 
                    COALESCE(f.rate_per_liter, 0) as rate,
                    COALESCE(f.total_amount, 0) as amount
             FROM milk_entries m
             LEFT JOIN fat_snf_entries f ON m.id = f.milk_entry_id
             WHERE m.samiti_id = $1 AND m.entry_date BETWEEN $2 AND $3
             ORDER BY m.entry_date ASC, m.created_at ASC`,
            [samiti_id, from_date, to_date]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
