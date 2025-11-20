const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get all leads
router.get('/', authenticateToken, requirePermission('view_leads'), async (req, res) => {
  try {
    const { client_id } = req.query;
    
    let query = `
      SELECT l.*, 
             u1.full_name as assigned_to_name,
             u2.full_name as created_by_name
      FROM leads l 
      LEFT JOIN users u1 ON l.assigned_to = u1.id 
      LEFT JOIN users u2 ON l.created_by = u2.id`;
    
    const params = [];
    
    if (client_id) {
      query += ` WHERE l.client_id = $1`;
      params.push(client_id);
    }
    
    query += ` ORDER BY l.created_at DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get single lead
router.get('/:id', authenticateToken, requirePermission('view_leads'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT l.*, 
              u1.full_name as assigned_to_name,
              u2.full_name as created_by_name
       FROM leads l 
       LEFT JOIN users u1 ON l.assigned_to = u1.id 
       LEFT JOIN users u2 ON l.created_by = u2.id 
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// Create lead
router.post('/', authenticateToken, requirePermission('create_leads'), async (req, res) => {
  try {
    const { name, email, phone, company, source, status, assigned_to, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO leads (name, email, phone, company, source, status, assigned_to, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name, email, phone, company, source, status || 'new', assigned_to, notes, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Update lead
router.put('/:id', authenticateToken, requirePermission('edit_leads'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, source, status, assigned_to, notes } = req.body;

    const result = await db.query(
      `UPDATE leads 
       SET name = $1, email = $2, phone = $3, company = $4, source = $5, 
           status = $6, assigned_to = $7, notes = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 
       RETURNING *`,
      [name, email, phone, company, source, status, assigned_to, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Delete lead
router.delete('/:id', authenticateToken, requirePermission('delete_leads'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM leads WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

module.exports = router;
