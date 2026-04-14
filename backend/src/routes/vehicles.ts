import express, { Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = express.Router();

router.use(authenticateToken);

// GET all vehicles with their mapped samitis (grouped as an array)
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT v.id, v.vehicle_number, v.created_at,
                    COALESCE(
                        JSON_AGG(
                            JSON_BUILD_OBJECT(
                                'samiti_id', s.id,
                                'samiti_name', s.name,
                                'samiti_code', s.code_4digit
                            )
                        ) FILTER (WHERE s.id IS NOT NULL),
                        '[]'
                    ) AS samitis
             FROM vehicles v
             LEFT JOIN vehicle_samiti_mappings vsm ON v.id = vsm.vehicle_id
             LEFT JOIN samitis s ON vsm.samiti_id = s.id
             GROUP BY v.id, v.vehicle_number, v.created_at
             ORDER BY v.vehicle_number ASC`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST create a new vehicle (Admin only)
router.post('/', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
    const { vehicle_number } = req.body;
    if (!vehicle_number) {
        res.status(400).json({ error: 'vehicle_number is required.' });
        return;
    }
    try {
        const result = await pool.query(
            `INSERT INTO vehicles (vehicle_number) VALUES ($1) RETURNING *`,
            [vehicle_number]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Vehicle number already exists.' });
        } else {
            res.status(500).json({ error: 'Database error' });
        }
    }
});

// POST assign a samiti to an existing vehicle (Admin only)
// Body: { samiti_id: number }
router.post('/:id/samitis', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { samiti_id } = req.body;

    if (!samiti_id) {
        res.status(400).json({ error: 'samiti_id is required.' });
        return;
    }
    try {
        await pool.query(
            `INSERT INTO vehicle_samiti_mappings (vehicle_id, samiti_id) VALUES ($1, $2)`,
            [id, samiti_id]
        );
        res.status(201).json({ message: 'Samiti mapped to vehicle successfully.' });
    } catch (error: any) {
        if (error.code === '23505') {
            res.status(409).json({ error: 'This samiti is already mapped to this vehicle.' });
        } else if (error.code === '23503') {
            res.status(404).json({ error: 'Vehicle or Samiti not found.' });
        } else {
            res.status(500).json({ error: 'Database error' });
        }
    }
});

// DELETE remove a specific samiti from a vehicle (Admin only)
// DELETE /api/vehicles/:id/samitis/:samiti_id
router.delete('/:id/samitis/:samiti_id', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
    const { id, samiti_id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM vehicle_samiti_mappings WHERE vehicle_id = $1 AND samiti_id = $2 RETURNING id',
            [id, samiti_id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Mapping not found.' });
            return;
        }
        res.json({ message: 'Samiti removed from vehicle successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE remove a vehicle entirely (Admin only)
router.delete('/:id', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Vehicle not found.' });
            return;
        }
        res.json({ message: 'Vehicle removed successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// GET samiti list by vehicle number (for milk entry search)
// Returns ALL samitis mapped to the vehicle
router.get('/search/:vehicle_number', requireRole(['admin', 'milk-entry']), async (req: AuthRequest, res: Response) => {
    try {
        const { vehicle_number } = req.params;
        const result = await pool.query(
            `SELECT s.id as samiti_id, s.name as samiti_name, s.code_4digit
             FROM vehicles v
             JOIN vehicle_samiti_mappings vsm ON v.id = vsm.vehicle_id
             JOIN samitis s ON vsm.samiti_id = s.id
             WHERE v.vehicle_number = $1
             ORDER BY s.name ASC`,
            [vehicle_number]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Vehicle not found or no samitis mapped to it.' });
            return;
        }

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
