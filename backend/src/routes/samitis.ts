import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();

router.use(authenticateToken);

// GET all samitis — available to all authenticated roles
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

// GET single samiti by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, name, code_4digit, created_at FROM samitis WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Samiti not found.' });
            return;
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST create samiti (Admin only)
router.post('/', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ error: 'Samiti name is required.' });
        return;
    }
    try {
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

