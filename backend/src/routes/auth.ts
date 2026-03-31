import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile_number, password } = req.body;

        if (!mobile_number || !password) {
            res.status(400).json({ error: 'Mobile number and password are required.' });
            return;
        }

        const userResult = await pool.query(
            'SELECT * FROM users WHERE mobile_number = $1 AND is_active = true',
            [mobile_number]
        );

        if (userResult.rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials or inactive user.' });
            return;
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            res.status(401).json({ error: 'Invalid credentials.' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, mobile_number: user.mobile_number },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, role: user.role, mobile_number: user.mobile_number }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;
