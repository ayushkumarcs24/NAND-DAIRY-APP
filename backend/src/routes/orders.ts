import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();
router.use(authenticateToken);

// ── Helper: check if distributor has any overdue unpaid order ───────────────
async function hasOverdueOrder(distributorId: number): Promise<boolean> {
  const result = await pool.query(
    `SELECT id FROM orders
     WHERE distributor_id = $1
       AND status = 'pending'
       AND due_date < CURRENT_DATE
     LIMIT 1`,
    [distributorId]
  );
  return result.rows.length > 0;
}

// ── GET /api/orders/pending-balance  ──────────────────────────────────────
// Distributor: check if they are currently blocked
router.get('/pending-balance', requireRole(['distributor', 'admin']), async (req: AuthRequest, res: Response) => {
  const distId = req.user!.id;
  try {
    // Mark any pending orders past due_date as overdue first
    await pool.query(
      `UPDATE orders SET status = 'overdue'
       WHERE distributor_id = $1 AND status = 'pending' AND due_date < CURRENT_DATE`,
      [distId]
    );

    const overdueResult = await pool.query(
      `SELECT id, total_amount, due_date, created_at
       FROM orders
       WHERE distributor_id = $1 AND status = 'overdue'
       ORDER BY created_at ASC LIMIT 1`,
      [distId]
    );

    if (overdueResult.rows.length > 0) {
      res.json({ blocked: true, overdueOrder: overdueResult.rows[0] });
    } else {
      res.json({ blocked: false });
    }
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── GET /api/orders  ──────────────────────────────────────────────────────
// Distributor: their own orders | Admin: all orders with distributor info
router.get('/', requireRole(['distributor', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    // Auto-mark overdue before returning
    if (req.user!.role === 'distributor') {
      await pool.query(
        `UPDATE orders SET status = 'overdue'
         WHERE distributor_id = $1 AND status = 'pending' AND due_date < CURRENT_DATE`,
        [req.user!.id]
      );
    } else {
      await pool.query(
        `UPDATE orders SET status = 'overdue'
         WHERE status = 'pending' AND due_date < CURRENT_DATE`
      );
    }

    let query: string;
    let params: any[];

    if (req.user!.role === 'admin') {
      query = `
        SELECT o.id, o.total_amount, o.status, o.due_date, o.paid_at, o.notes, o.created_at,
               u.name AS distributor_name, u.mobile_number AS distributor_mobile
        FROM orders o
        JOIN users u ON o.distributor_id = u.id
        ORDER BY o.created_at DESC`;
      params = [];
    } else {
      query = `
        SELECT id, total_amount, status, due_date, paid_at, notes, created_at
        FROM orders
        WHERE distributor_id = $1
        ORDER BY created_at DESC`;
      params = [req.user!.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── GET /api/orders/:id/items  ────────────────────────────────────────────
router.get('/:id/items', requireRole(['distributor', 'admin']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    // Distributors can only see their own order items
    if (req.user!.role === 'distributor') {
      const check = await pool.query(
        `SELECT id FROM orders WHERE id=$1 AND distributor_id=$2`,
        [id, req.user!.id]
      );
      if (check.rows.length === 0) { res.status(403).json({ error: 'Forbidden.' }); return; }
    }

    const result = await pool.query(
      `SELECT oi.id, oi.quantity, oi.unit_price, oi.subtotal,
              p.name AS product_name, p.unit
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1
       ORDER BY oi.id ASC`,
      [id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── POST /api/orders  ─────────────────────────────────────────────────────
// Distributor places a new order
// Body: { items: [{product_id, quantity}], notes? }
router.post('/', requireRole(['distributor']), async (req: AuthRequest, res: Response) => {
  const { items, notes } = req.body;
  const distId = req.user!.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'items array is required and must not be empty.' });
    return;
  }

  // Block if overdue balance exists
  const blocked = await hasOverdueOrder(distId);
  if (blocked) {
    res.status(403).json({ error: 'You have an overdue unpaid order. Please clear your balance before placing a new order.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    const enrichedItems: { product_id: number; quantity: number; unit_price: number; subtotal: number }[] = [];

    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity || quantity <= 0) {
        throw new Error('Each item needs a valid product_id and quantity > 0');
      }
      const pRes = await client.query(
        `SELECT id, price, is_available FROM products WHERE id=$1`,
        [product_id]
      );
      if (pRes.rows.length === 0) throw new Error(`Product ${product_id} not found.`);
      if (!pRes.rows[0].is_available) throw new Error(`Product ${product_id} is not currently available.`);

      const unit_price = parseFloat(pRes.rows[0].price);
      const subtotal = unit_price * quantity;
      totalAmount += subtotal;
      enrichedItems.push({ product_id, quantity, unit_price, subtotal });
    }

    const due_date = new Date();
    due_date.setDate(due_date.getDate() + 1);
    const dueDateStr = due_date.toISOString().split('T')[0];

    const orderRes = await client.query(
      `INSERT INTO orders (distributor_id, total_amount, due_date, notes)
       VALUES ($1, $2, $3, $4) RETURNING id, total_amount, status, due_date, created_at`,
      [distId, totalAmount.toFixed(2), dueDateStr, notes || null]
    );

    const orderId = orderRes.rows[0].id;

    for (const ei of enrichedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, ei.product_id, ei.quantity, ei.unit_price, ei.subtotal]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Order placed successfully', order: orderRes.rows[0] });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message || 'Failed to place order.' });
  } finally {
    client.release();
  }
});

// ── PATCH /api/orders/:id/pay  (admin only) ─────────────────────────────
router.patch('/:id/pay', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE orders
       SET status = 'paid', paid_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status != 'paid'
       RETURNING id, status, paid_at`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Order not found or already paid.' });
      return;
    }
    res.json({ message: 'Order marked as paid', order: result.rows[0] });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
