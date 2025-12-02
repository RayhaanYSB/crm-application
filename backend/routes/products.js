const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get all products
router.get('/', authenticateToken, requirePermission('view_products'), async (req, res) => {
  try {
    const { active_only, product_type } = req.query;
    let query = `SELECT p.*, u.full_name as created_by_name 
                 FROM products p 
                 LEFT JOIN users u ON p.created_by = u.id WHERE 1=1`;
    const params = [];
    let paramCount = 1;
    
    if (active_only === 'true') {
      query += ` AND p.is_active = true`;
    }

    if (product_type) {
      query += ` AND p.product_type = $${paramCount}`;
      params.push(product_type);
      paramCount++;
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await db.query(query, params);
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
    const { 
      name, description, sku, price, cost, category, unit, is_active,
      product_type, item_type, service_unit, rate, tags
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (product_type === 'service' && !rate) {
      return res.status(400).json({ error: 'Rate is required for services' });
    }

    if (product_type === 'item' && !price) {
      return res.status(400).json({ error: 'Price is required for items' });
    }

    // For services, use rate as price for backward compatibility
  const finalPrice = product_type === 'service' ? rate : price;

  const result = await db.query(
    `INSERT INTO products 
    (name, description, sku, price, cost, category, unit, is_active, 
      product_type, item_type, service_unit, rate, tags, created_by) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
    RETURNING *`,
    [name, description, sku, finalPrice, cost, category, unit, is_active !== false, 
    product_type || 'item', item_type, service_unit, rate, tags || [], req.user.id]
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
    const { 
      name, description, sku, price, cost, category, unit, is_active,
      product_type, item_type, service_unit, rate, tags
    } = req.body;

    // For services, use rate as price for backward compatibility
  const finalPrice = product_type === 'service' ? rate : price;

  const result = await db.query(
    `UPDATE products 
    SET name = $1, description = $2, sku = $3, price = $4, cost = $5, 
        category = $6, unit = $7, is_active = $8, product_type = $9,
        item_type = $10, service_unit = $11, rate = $12, tags = $13,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $14 
    RETURNING *`,
    [name, description, sku, finalPrice, cost, category, unit, is_active,
    product_type, item_type, service_unit, rate, tags || [], id]
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