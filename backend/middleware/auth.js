const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      // Get user info from database
      const result = await db.query(
        'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(403).json({ error: 'User not found or inactive' });
      }

      req.user = result.rows[0];
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Check if user has specific permission
const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // Admins have all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user has the specific permission
      const result = await db.query(
        `SELECT p.name 
         FROM permissions p
         JOIN user_permissions up ON p.id = up.permission_id
         WHERE up.user_id = $1 AND p.name = $2`,
        [req.user.id, permissionName]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Permission denied',
          required: permissionName 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Get all user permissions
const getUserPermissions = async (userId) => {
  try {
    const result = await db.query(
      `SELECT p.name, p.category, p.description
       FROM permissions p
       JOIN user_permissions up ON p.id = up.permission_id
       WHERE up.user_id = $1`,
      [userId]
    );
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requirePermission,
  getUserPermissions,
};
