import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();

router.use(authenticateToken);

// Gets milk entries that don't have fat/snf calculated yet
router.get('/pending', requireRole(['admin', 'fat-snf']), async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT m.id as milk_entry_id, m.shift, m.milk_quantity_liters, m.entry_date,
                    s.name as samiti_name, s.code_4digit as samiti_code
             FROM milk_entries m
             JOIN samitis s ON m.samiti_id = s.id
             LEFT JOIN fat_snf_entries f ON m.id = f.milk_entry_id
             WHERE f.id IS NULL
             ORDER BY m.created_at ASC`
        );
        res.json(result.rows);
    } catch (error) {
         res.status(500).json({ error: 'Database error' });
    }
});

router.post('/', requireRole(['admin', 'fat-snf']), async (req: AuthRequest, res: Response) => {
    const { milk_entry_id, fat_value, snf_value, rate_per_liter } = req.body;

    // Validate ranges
    if (fat_value < 0 || fat_value > 10) {
        res.status(400).json({ error: 'Fat value must be between 0 and 10.' });
        return;
    }
    if (snf_value < 0 || snf_value > 15) {
        res.status(400).json({ error: 'SNF value must be between 0 and 15.' });
        return;
    }
    if (rate_per_liter < 0) {
        res.status(400).json({ error: 'Rate per liter cannot be negative.' });
        return;
    }
    
    try {
        const milkEntry = await pool.query('SELECT milk_quantity_liters FROM milk_entries WHERE id = $1', [milk_entry_id]);
        
        if (milkEntry.rows.length === 0) {
             res.status(404).json({ error: 'Milk entry not found' });
             return;
        }

        const quantity = milkEntry.rows[0].milk_quantity_liters;
        const total_amount = parseFloat((quantity * rate_per_liter).toFixed(2));

        const result = await pool.query(
            `INSERT INTO fat_snf_entries (milk_entry_id, fat_value, snf_value, rate_per_liter, total_amount, entered_by) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [milk_entry_id, fat_value, snf_value, rate_per_liter, total_amount, req.user?.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
             res.status(400).json({ error: 'Fat/SNF already submitted for this milk entry.' });
        } else {
             res.status(500).json({ error: 'Database error' });
        }
    }
});

export default router;

