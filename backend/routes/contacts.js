const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get all contacts for a specific client
router.get('/client/:clientId', authenticateToken, requirePermission('view_clients'), async (req, res) => {
  try {
    const { clientId } = req.params;
    const result = await db.query(
      `SELECT c.*, u.full_name as created_by_name 
       FROM contacts c 
       LEFT JOIN users u ON c.created_by = u.id 
       WHERE c.client_id = $1
       ORDER BY c.is_primary DESC, c.last_name, c.first_name`,
      [clientId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get single contact
router.get('/:id', authenticateToken, requirePermission('view_clients'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT c.*, u.full_name as created_by_name 
       FROM contacts c 
       LEFT JOIN users u ON c.created_by = u.id 
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Create contact
router.post('/', authenticateToken, requirePermission('create_clients'), async (req, res) => {
  try {
    const { 
      client_id, first_name, last_name, email, phone, 
      position, department, is_primary, notes 
    } = req.body;

    if (!client_id || !first_name || !last_name) {
      return res.status(400).json({ error: 'Client ID, first name, and last name are required' });
    }

    // Verify client exists
    const clientCheck = await db.query('SELECT id FROM clients WHERE id = $1', [client_id]);
    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const result = await db.query(
      `INSERT INTO contacts 
       (client_id, first_name, last_name, email, phone, position, department, is_primary, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [client_id, first_name, last_name, email, phone, position, department, is_primary || false, notes, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update contact
router.put('/:id', authenticateToken, requirePermission('edit_clients'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      first_name, last_name, email, phone, 
      position, department, is_primary, notes 
    } = req.body;

    const result = await db.query(
      `UPDATE contacts 
       SET first_name = $1, last_name = $2, email = $3, phone = $4, 
           position = $5, department = $6, is_primary = $7, notes = $8, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 
       RETURNING *`,
      [first_name, last_name, email, phone, position, department, is_primary, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Toggle primary contact
router.patch('/:id/primary', authenticateToken, requirePermission('edit_clients'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get the contact to find its client_id
    const contactResult = await db.query('SELECT client_id FROM contacts WHERE id = $1', [id]);
    
    if (contactResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Set this contact as primary (trigger will handle removing primary from others)
    const result = await db.query(
      `UPDATE contacts 
       SET is_primary = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle primary contact error:', error);
    res.status(500).json({ error: 'Failed to toggle primary contact' });
  }
});

// Delete contact
router.delete('/:id', authenticateToken, requirePermission('delete_clients'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM contacts WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;