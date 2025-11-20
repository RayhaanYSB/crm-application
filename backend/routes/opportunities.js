const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get all opportunities
router.get('/', authenticateToken, requirePermission('view_opportunities'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, 
              c.name as client_name,
              l.name as lead_name,
              u1.full_name as assigned_to_name,
              u2.full_name as created_by_name
       FROM opportunities o 
       LEFT JOIN clients c ON o.client_id = c.id
       LEFT JOIN leads l ON o.lead_id = l.id
       LEFT JOIN users u1 ON o.assigned_to = u1.id 
       LEFT JOIN users u2 ON o.created_by = u2.id 
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Get single opportunity
router.get('/:id', authenticateToken, requirePermission('view_opportunities'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT o.*, 
              c.name as client_name,
              l.name as lead_name,
              u1.full_name as assigned_to_name,
              u2.full_name as created_by_name
       FROM opportunities o 
       LEFT JOIN clients c ON o.client_id = c.id
       LEFT JOIN leads l ON o.lead_id = l.id
       LEFT JOIN users u1 ON o.assigned_to = u1.id 
       LEFT JOIN users u2 ON o.created_by = u2.id 
       WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

// Create opportunity
router.post('/', authenticateToken, requirePermission('create_opportunities'), async (req, res) => {
  try {
    const { title, client_id, lead_id, value, stage, probability, expected_close_date, assigned_to, notes } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await db.query(
      `INSERT INTO opportunities (title, client_id, lead_id, value, stage, probability, expected_close_date, assigned_to, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [title, client_id, lead_id, value, stage || 'prospecting', probability, expected_close_date, assigned_to, notes, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Update opportunity
router.put('/:id', authenticateToken, requirePermission('edit_opportunities'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, client_id, lead_id, value, stage, probability, expected_close_date, assigned_to, notes } = req.body;

    const result = await db.query(
      `UPDATE opportunities 
       SET title = $1, client_id = $2, lead_id = $3, value = $4, stage = $5, 
           probability = $6, expected_close_date = $7, assigned_to = $8, notes = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 
       RETURNING *`,
      [title, client_id, lead_id, value, stage, probability, expected_close_date, assigned_to, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

// Delete opportunity
router.delete('/:id', authenticateToken, requirePermission('delete_opportunities'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM opportunities WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

module.exports = router;
