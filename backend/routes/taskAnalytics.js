const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get comprehensive task analytics
router.get('/overview', authenticateToken, requirePermission('manage_task_admin'), async (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;
    
    let whereConditions = ['1=1'];
    let params = [];
    let paramCount = 1;

    // User filter
    if (user_id) {
      whereConditions.push(`t.created_by = $${paramCount}`);
      params.push(parseInt(user_id));
      paramCount++;
    }

    // Date range filter
    if (start_date) {
      whereConditions.push(`t.created_at >= $${paramCount}`);
      params.push(start_date);
      paramCount++;
    }
    if (end_date) {
      whereConditions.push(`t.created_at <= $${paramCount}`);
      params.push(end_date);
      paramCount++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tasks,
        COUNT(CASE WHEN status != 'closed' THEN 1 END) as open_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'on-going' THEN 1 END) as ongoing_tasks,
        COUNT(CASE WHEN status = 'awaiting_feedback' THEN 1 END) as awaiting_feedback_tasks,
        COUNT(CASE 
          WHEN status = 'closed' AND due_date IS NOT NULL AND close_date IS NOT NULL 
          AND close_date <= due_date 
          THEN 1 
        END) as closed_on_time,
        COUNT(CASE 
          WHEN status = 'closed' AND due_date IS NOT NULL AND close_date IS NOT NULL 
          AND close_date > due_date 
          THEN 1 
        END) as closed_late,
        COUNT(CASE 
          WHEN status != 'closed' AND due_date IS NOT NULL 
          AND CURRENT_DATE > due_date 
          THEN 1 
        END) as currently_overdue,
        ROUND(AVG(total_hours), 2) as avg_hours,
        SUM(total_hours) as total_hours_logged
      FROM tasks t
      WHERE ${whereClause}
    `;

    const stats = await db.query(statsQuery, params);

    // Priority distribution
    const priorityQuery = `
      SELECT 
        priority,
        COUNT(*) as count
      FROM tasks t
      WHERE ${whereClause}
      GROUP BY priority
      ORDER BY priority
    `;
    const priorityDist = await db.query(priorityQuery, params);

    // Status distribution
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks t
      WHERE ${whereClause}
      GROUP BY status
    `;
    const statusDist = await db.query(statusQuery, params);

    // Department distribution
    const deptQuery = `
      SELECT 
        d.name as department,
        COUNT(*) as count
      FROM tasks t
      LEFT JOIN task_departments d ON t.department_id = d.id
      WHERE ${whereClause}
      GROUP BY d.name
      ORDER BY count DESC
      LIMIT 10
    `;
    const deptDist = await db.query(deptQuery, params);

    // Tasks by user
    const userQuery = `
      SELECT 
        u.full_name as user_name,
        COUNT(*) as total,
        COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as closed,
        COUNT(CASE WHEN t.status != 'closed' THEN 1 END) as active,
        SUM(t.total_hours) as hours
      FROM tasks t
      JOIN users u ON t.created_by = u.id
      WHERE ${whereClause}
      GROUP BY u.id, u.full_name
      ORDER BY total DESC
      LIMIT 15
    `;
    const userStats = await db.query(userQuery, params);

    // Tasks over time (last 30 days or filtered range)
    const timelineQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as created,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed
      FROM tasks t
      WHERE ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;
    const timeline = await db.query(timelineQuery, params);

    // Client distribution (top clients)
    const clientQuery = `
      SELECT 
        COALESCE(c.company, c.name) as client_name,
        COUNT(*) as task_count
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE ${whereClause} AND t.client_id IS NOT NULL
      GROUP BY c.id, c.company, c.name
      ORDER BY task_count DESC
      LIMIT 10
    `;
    const clientDist = await db.query(clientQuery, params);

    res.json({
      overview: stats.rows[0],
      priority_distribution: priorityDist.rows,
      status_distribution: statusDist.rows,
      department_distribution: deptDist.rows,
      user_statistics: userStats.rows,
      timeline: timeline.rows.reverse(),
      client_distribution: clientDist.rows
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get user list for filtering
router.get('/users', authenticateToken, requirePermission('manage_task_admin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT u.id, u.full_name
      FROM users u
      INNER JOIN tasks t ON u.id = t.created_by
      ORDER BY u.full_name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;