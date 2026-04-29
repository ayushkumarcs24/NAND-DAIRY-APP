import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole(['admin', 'report']));

// ── GET /api/reports/daily ────────────────────────────────────────────────
// Per-samiti aggregated stats for a given date (YYYY-MM-DD)
router.get('/daily', async (req: AuthRequest, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) { res.status(400).json({ error: 'date is required (YYYY-MM-DD).' }); return; }

        const result = await pool.query(
            `SELECT s.id as samiti_id, s.name as samiti_name, s.code_4digit as samiti_code,
                    SUM(m.milk_quantity_liters)        AS total_milk,
                    ROUND(AVG(f.fat_value), 2)         AS avg_fat,
                    ROUND(AVG(f.snf_value), 2)         AS avg_snf,
                    COALESCE(SUM(f.total_amount), 0)   AS total_amount
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

// ── GET /api/reports/bill ─────────────────────────────────────────────────
// Day-by-day bill rows for a samiti across a date range
router.get('/bill', async (req: AuthRequest, res: Response) => {
    try {
        const { samiti_id, from_date, to_date } = req.query;
        if (!samiti_id || !from_date || !to_date) {
            res.status(400).json({ error: 'samiti_id, from_date, and to_date are required.' });
            return;
        }

        const result = await pool.query(
            `SELECT m.entry_date                        AS date,
                    m.milk_quantity_liters              AS milk,
                    COALESCE(f.fat_value, 0)            AS fat,
                    COALESCE(f.snf_value, 0)            AS snf,
                    COALESCE(f.rate_per_liter, 0)       AS rate,
                    COALESCE(f.total_amount, 0)         AS amount
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

// ── GET /api/reports/summary ──────────────────────────────────────────────
// 7-day (or custom range) summary — used by the Reports hero banner
// Query: ?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD  (optional, defaults to last 7 days)
router.get('/summary', async (req: AuthRequest, res: Response) => {
    try {
        const { from_date, to_date } = req.query;

        const toD  = to_date   ? String(to_date)   : new Date().toISOString().split('T')[0];
        const fromD = from_date ? String(from_date) : (() => {
            const d = new Date();
            d.setDate(d.getDate() - 6);
            return d.toISOString().split('T')[0];
        })();

        // Aggregate totals across the period
        const totals = await pool.query(
            `SELECT
                COALESCE(SUM(m.milk_quantity_liters), 0) AS total_milk,
                COALESCE(SUM(f.total_amount), 0)          AS total_payout,
                ROUND(AVG(f.fat_value), 2)                AS avg_fat,
                ROUND(AVG(f.snf_value), 2)                AS avg_snf,
                COUNT(DISTINCT m.samiti_id)               AS active_samitis,
                COUNT(m.id)                               AS total_entries
             FROM milk_entries m
             LEFT JOIN fat_snf_entries f ON m.id = f.milk_entry_id
             WHERE m.entry_date BETWEEN $1 AND $2`,
            [fromD, toD]
        );

        // Top 4 samitis by total milk (leaderboard)
        const leaderboard = await pool.query(
            `SELECT s.name AS samiti_name, s.code_4digit,
                    SUM(m.milk_quantity_liters)         AS total_milk,
                    COALESCE(SUM(f.total_amount), 0)    AS total_amount
             FROM milk_entries m
             JOIN samitis s ON m.samiti_id = s.id
             LEFT JOIN fat_snf_entries f ON m.id = f.milk_entry_id
             WHERE m.entry_date BETWEEN $1 AND $2
             GROUP BY s.id, s.name, s.code_4digit
             ORDER BY total_milk DESC
             LIMIT 4`,
            [fromD, toD]
        );

        res.json({
            period:      { from: fromD, to: toD },
            summary:     totals.rows[0],
            leaderboard: leaderboard.rows,
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
