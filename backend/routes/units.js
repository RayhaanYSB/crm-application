const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get all service units
router.get('/', authenticateToken, requirePermission('view_products'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM service_units ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// Create service unit
router.post('/', authenticateToken, requirePermission('create_products'), async (req, res) => {
  try {
    const { name, abbreviation } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Unit name is required' });
    }

    const result = await db.query(
      'INSERT INTO service_units (name, abbreviation, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, abbreviation, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create unit error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Unit already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create unit' });
    }
  }
});

// Delete service unit
router.delete('/:id', authenticateToken, requirePermission('delete_products'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM service_units WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ error: 'Failed to delete unit' });
  }
});

module.exports = router;