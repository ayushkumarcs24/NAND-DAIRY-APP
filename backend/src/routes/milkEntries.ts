import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();
router.use(authenticateToken);

// ── POST /api/milk-entries ──────────────────────────────────────────────
router.post('/', requireRole(['admin', 'milk-entry']), async (req: AuthRequest, res: Response) => {
    const { samiti_id, shift, entry_date, milk_quantity_liters } = req.body;

    if (!samiti_id || !shift || !entry_date || !milk_quantity_liters) {
        res.status(400).json({ error: 'samiti_id, shift, entry_date, and milk_quantity_liters are required.' });
        return;
    }
    if (!['morning', 'evening'].includes(shift)) {
        res.status(400).json({ error: "shift must be 'morning' or 'evening'." });
        return;
    }
    const qty = parseFloat(milk_quantity_liters);
    if (isNaN(qty) || qty <= 0) {
        res.status(400).json({ error: 'milk_quantity_liters must be a positive number.' });
        return;
    }

    try {
        const result = await pool.query(
            `INSERT INTO milk_entries (samiti_id, shift, entry_date, milk_quantity_liters, entered_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [samiti_id, shift, entry_date, qty, req.user?.id]
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

// ── GET /api/milk-entries/today ─────────────────────────────────────────
// Returns today's entries, optionally filtered by ?shift=morning|evening
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

// ── GET /api/milk-entries/stats ─────────────────────────────────────────
// Returns today vs yesterday totals for a specific samiti
// Used by the milk-entry UI to show "Yesterday: X L" hint
// Query: ?samiti_id=1
router.get('/stats', requireRole(['admin', 'milk-entry']), async (req: AuthRequest, res: Response) => {
    try {
        const { samiti_id } = req.query;
        if (!samiti_id) { res.status(400).json({ error: 'samiti_id is required.' }); return; }

        const result = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN entry_date = CURRENT_DATE     THEN milk_quantity_liters END), 0) AS today_total,
                COALESCE(SUM(CASE WHEN entry_date = CURRENT_DATE - 1 THEN milk_quantity_liters END), 0) AS yesterday_total
             FROM milk_entries
             WHERE samiti_id = $1 AND entry_date >= CURRENT_DATE - 1`,
            [samiti_id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
