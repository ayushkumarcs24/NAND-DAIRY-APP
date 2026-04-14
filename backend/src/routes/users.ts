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

// GET single user by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, name, mobile_number, role, is_active, created_at FROM users WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST add a new accountant/user
router.post('/', async (req: AuthRequest, res: Response) => {
    const { name, mobile_number, password, role } = req.body;
    if (!name || !mobile_number || !password || !role) {
        res.status(400).json({ error: 'name, mobile_number, password, and role are all required.' });
        return;
    }
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, mobile_number, password_hash, role, created_by_admin) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, name, mobile_number, role, is_active`,
            [name, mobile_number, password_hash, role, req.user?.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Mobile number already exists.' });
        } else {
            res.status(500).json({ error: 'Database error' });
        }
    }
});

// PUT update user details (name, mobile, role; password optional)
router.put('/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, mobile_number, role, password } = req.body;
    try {
        let query = `UPDATE users SET name=$1, mobile_number=$2, role=$3 WHERE id=$4 RETURNING id, name, mobile_number, role, is_active`;
        let params: any[] = [name, mobile_number, role, id];

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            query = `UPDATE users SET name=$1, mobile_number=$2, role=$3, password_hash=$4 WHERE id=$5 RETURNING id, name, mobile_number, role, is_active`;
            params = [name, mobile_number, role, password_hash, id];
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }
        res.json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
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
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE user entirely from DB
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }
        res.json({ message: 'User and cascade-related data successfully deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Database error while deleting user' });
    }
});

export default router;
