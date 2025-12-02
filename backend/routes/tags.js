const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get all tags
router.get('/', authenticateToken, requirePermission('view_products'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM product_tags ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create tag
router.post('/', authenticateToken, requirePermission('create_products'), async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const result = await db.query(
      'INSERT INTO product_tags (name, color, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, color || '#3182ce', req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create tag error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Tag already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create tag' });
    }
  }
});

// Delete tag
router.delete('/:id', authenticateToken, requirePermission('delete_products'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM product_tags WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

module.exports = router;