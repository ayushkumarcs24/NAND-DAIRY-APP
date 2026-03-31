import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET all accountants / staff
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT id, name, mobile_number, role, is_active, created_at 
             FROM users 
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST add a new accountant/user
router.post('/', async (req: AuthRequest, res: Response) => {
    const { name, mobile_number, password, role } = req.body;
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, mobile_number, password_hash, role, created_by_admin) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, name, mobile_number, role, is_active`,
            [name, mobile_number, password_hash, role, req.user?.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') { // unique violation
            res.status(400).json({ error: 'Mobile number already exists.' });
        } else {
            res.status(500).json({ error: 'Database error' });
        }
    }
});

// PATCH toggle active status
router.patch('/:id/toggle-active', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { is_active } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, is_active',
            [is_active, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
