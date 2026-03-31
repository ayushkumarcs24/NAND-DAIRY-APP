import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();

router.use(authenticateToken);
// GET all samitis available to admin, milk-entry
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT id, name, code_4digit, created_at 
             FROM samitis 
             ORDER BY name ASC`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin only routes for managing samitis
router.post('/', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
    const { name } = req.body;
    try {
        // Generate random 4 digit code for the samiti. Ensure we retry if collision.
        let code_4digit;
        let isUnique = false;
        while (!isUnique) {
            code_4digit = Math.floor(1000 + Math.random() * 9000).toString();
            const existing = await pool.query('SELECT id FROM samitis WHERE code_4digit = $1', [code_4digit]);
            if (existing.rows.length === 0) {
                isUnique = true;
            }
        }

        const result = await pool.query(
            `INSERT INTO samitis (name, code_4digit, created_by) 
             VALUES ($1, $2, $3) RETURNING *`,
            [name, code_4digit, req.user?.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
