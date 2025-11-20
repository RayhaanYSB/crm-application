const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, requireAdmin, requirePermission, getUserPermissions } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, full_name, role, is_active, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user with permissions
router.get('/:id', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, username, email, full_name, role, is_active, created_at 
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const permissions = await getUserPermissions(id);

    res.json({ ...user, permissions });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user (admin only)
router.post('/', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (username, email, password, full_name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, full_name, role, is_active, created_at`,
      [username, email, hashedPassword, full_name, role || 'user']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, role, is_active, password } = req.body;

    let query = `UPDATE users SET username = $1, email = $2, full_name = $3, role = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP`;
    let params = [username, email, full_name, role, is_active];

    // If password is provided, hash and update it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password = $6`;
      params.push(hashedPassword);
    }

    query += ` WHERE id = $${params.length + 1} RETURNING id, username, email, full_name, role, is_active`;
    params.push(id);

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all available permissions
router.get('/permissions/all', authenticateToken, requirePermission('manage_permissions'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM permissions ORDER BY category, name'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Update user permissions (admin only)
router.put('/:id/permissions', authenticateToken, requirePermission('manage_permissions'), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // Array of permission IDs

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    // Start transaction
    await db.query('BEGIN');

    // Delete existing permissions
    await db.query('DELETE FROM user_permissions WHERE user_id = $1', [id]);

    // Insert new permissions
    for (const permissionId of permissions) {
      await db.query(
        'INSERT INTO user_permissions (user_id, permission_id, granted_by) VALUES ($1, $2, $3)',
        [id, permissionId, req.user.id]
      );
    }

    await db.query('COMMIT');

    res.json({ message: 'Permissions updated successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

module.exports = router;
