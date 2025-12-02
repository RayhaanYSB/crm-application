const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// ==================== DEPARTMENTS ====================

// Get all departments
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const { is_active } = req.query;
    
    let query = `
      SELECT d.*, 
             u.full_name as created_by_name,
             (SELECT COUNT(*) FROM task_subcategories WHERE department_id = d.id) as subcategory_count,
             (SELECT COUNT(*) FROM tasks WHERE department_id = d.id) as task_count
      FROM task_departments d
      LEFT JOIN users u ON d.created_by = u.id
      WHERE 1=1`;
    
    const params = [];
    
    if (is_active !== undefined) {
      query += ` AND d.is_active = $1`;
      params.push(is_active === 'true');
    }
    
    query += ` ORDER BY d.name ASC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get single department
router.get('/departments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT d.*, 
             u.full_name as created_by_name,
             (SELECT COUNT(*) FROM task_subcategories WHERE department_id = d.id) as subcategory_count,
             (SELECT COUNT(*) FROM tasks WHERE department_id = d.id) as task_count
      FROM task_departments d
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Create department
router.post('/departments', authenticateToken, requirePermission('manage_task_admin'), async (req, res) => {
  try {
    const { name, description, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const result = await db.query(
      `INSERT INTO task_departments (name, description, is_active, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, is_active !== false, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Department with this name already exists' });
    }
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update department
router.put('/departments/:id', authenticateToken, requirePermission('manage_task_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const result = await db.query(
      `UPDATE task_departments 
       SET name = $1, description = $2, is_active = $3
       WHERE id = $4
       RETURNING *`,
      [name, description, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete department
router.delete('/departments/:id', authenticateToken, requirePermission('manage_task_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if department has tasks
    const taskCheck = await db.query(
      'SELECT COUNT(*) as count FROM tasks WHERE department_id = $1',
      [id]
    );
    
    if (parseInt(taskCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with associated tasks. Please reassign tasks first.' 
      });
    }
    
    const result = await db.query('DELETE FROM task_departments WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// ==================== SUBCATEGORIES ====================

// Get all subcategories
router.get('/subcategories', authenticateToken, async (req, res) => {
  try {
    const { department_id, is_active } = req.query;
    
    let query = `
      SELECT s.*, 
             d.name as department_name,
             u.full_name as created_by_name,
             (SELECT COUNT(*) FROM tasks WHERE subcategory_id = s.id) as task_count
      FROM task_subcategories s
      LEFT JOIN task_departments d ON s.department_id = d.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE 1=1`;
    
    const params = [];
    let paramCount = 0;
    
    if (department_id) {
      paramCount++;
      query += ` AND s.department_id = $${paramCount}`;
      params.push(department_id);
    }
    
    if (is_active !== undefined) {
      paramCount++;
      query += ` AND s.is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }
    
    query += ` ORDER BY d.name ASC, s.name ASC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

// Get single subcategory
router.get('/subcategories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT s.*, 
             d.name as department_name,
             u.full_name as created_by_name,
             (SELECT COUNT(*) FROM tasks WHERE subcategory_id = s.id) as task_count
      FROM task_subcategories s
      LEFT JOIN task_departments d ON s.department_id = d.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get subcategory error:', error);
    res.status(500).json({ error: 'Failed to fetch subcategory' });
  }
});

// Create subcategory
router.post('/subcategories', authenticateToken, requirePermission('manage_task_admin'), async (req, res) => {
  try {
    const { department_id, name, description, is_active } = req.body;

    if (!department_id || !name) {
      return res.status(400).json({ error: 'Department and subcategory name are required' });
    }

    const result = await db.query(
      `INSERT INTO task_subcategories (department_id, name, description, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [department_id, name, description, is_active !== false, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Subcategory with this name already exists in this department' });
    }
    console.error('Create subcategory error:', error);
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
});

// Update subcategory
router.put('/subcategories/:id', authenticateToken, requirePermission('manage_task_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { department_id, name, description, is_active } = req.body;

    const result = await db.query(
      `UPDATE task_subcategories 
       SET department_id = $1, name = $2, description = $3, is_active = $4
       WHERE id = $5
       RETURNING *`,
      [department_id, name, description, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Subcategory with this name already exists in this department' });
    }
    console.error('Update subcategory error:', error);
    res.status(500).json({ error: 'Failed to update subcategory' });
  }
});

// Delete subcategory
router.delete('/subcategories/:id', authenticateToken, requirePermission('manage_task_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if subcategory has tasks
    const taskCheck = await db.query(
      'SELECT COUNT(*) as count FROM tasks WHERE subcategory_id = $1',
      [id]
    );
    
    if (parseInt(taskCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete subcategory with associated tasks. Please reassign tasks first.' 
      });
    }
    
    const result = await db.query('DELETE FROM task_subcategories WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
});

module.exports = router;
