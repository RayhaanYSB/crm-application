const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get all products
router.get('/', authenticateToken, requirePermission('view_products'), async (req, res) => {
  try {
    const { active_only } = req.query;
    let query = `SELECT p.*, u.full_name as created_by_name 
                 FROM products p 
                 LEFT JOIN users u ON p.created_by = u.id`;
    
    if (active_only === 'true') {
      query += ' WHERE p.is_active = true';
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', authenticateToken, requirePermission('view_products'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT p.*, u.full_name as created_by_name 
       FROM products p 
       LEFT JOIN users u ON p.created_by = u.id 
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', authenticateToken, requirePermission('create_products'), async (req, res) => {
  try {
    const { name, description, sku, price, cost, category, unit, is_active } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const result = await db.query(
      `INSERT INTO products (name, description, sku, price, cost, category, unit, is_active, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name, description, sku, price, cost, category, unit, is_active !== false, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
});

// Update product
router.put('/:id', authenticateToken, requirePermission('edit_products'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sku, price, cost, category, unit, is_active } = req.body;

    const result = await db.query(
      `UPDATE products 
       SET name = $1, description = $2, sku = $3, price = $4, cost = $5, 
           category = $6, unit = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 
       RETURNING *`,
      [name, description, sku, price, cost, category, unit, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, requirePermission('delete_products'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
