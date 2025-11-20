const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get all clients
router.get('/', authenticateToken, requirePermission('view_clients'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, u.full_name as created_by_name 
       FROM clients c 
       LEFT JOIN users u ON c.created_by = u.id 
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get single client
router.get('/:id', authenticateToken, requirePermission('view_clients'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT c.*, u.full_name as created_by_name 
       FROM clients c 
       LEFT JOIN users u ON c.created_by = u.id 
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create client
router.post('/', authenticateToken, requirePermission('create_clients'), async (req, res) => {
  try {
    const { name, email, phone, company, address, city, country, tax_number, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO clients (name, email, phone, company, address, city, country, tax_number, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [name, email, phone, company, address, city, country, tax_number, notes, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
router.put('/:id', authenticateToken, requirePermission('edit_clients'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, address, city, country, tax_number, notes } = req.body;

    const result = await db.query(
      `UPDATE clients 
       SET name = $1, email = $2, phone = $3, company = $4, address = $5, 
           city = $6, country = $7, tax_number = $8, notes = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 
       RETURNING *`,
      [name, email, phone, company, address, city, country, tax_number, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete client
router.delete('/:id', authenticateToken, requirePermission('delete_clients'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
