import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();
router.use(authenticateToken);

// ── GET /api/products  (any authenticated role can browse) ──────────────────
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price, unit, is_available, created_at
       FROM products
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── POST /api/products  (admin only) ───────────────────────────────────────
router.post('/', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { name, description, price, unit } = req.body;
  if (!name || price === undefined) {
    res.status(400).json({ error: 'name and price are required.' });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, unit, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, price, unit, is_available`,
      [name.trim(), description || null, price, unit || 'liter', req.user?.id]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── PUT /api/products/:id  (admin only) ────────────────────────────────────
router.put('/:id', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, price, unit } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, description=$2, price=$3, unit=$4
       WHERE id=$5 RETURNING id, name, description, price, unit, is_available`,
      [name, description || null, price, unit || 'liter', id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Product not found.' }); return; }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── PATCH /api/products/:id/toggle  (admin only) ───────────────────────────
router.patch('/:id/toggle', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { is_available } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET is_available=$1 WHERE id=$2 RETURNING id, name, is_available`,
      [is_available, id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Product not found.' }); return; }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
