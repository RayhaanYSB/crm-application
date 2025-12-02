const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get all projects
router.get('/', authenticateToken, requirePermission('view_projects'), async (req, res) => {
  try {
    const { status, client_id } = req.query;
    
    let query = `
      SELECT p.*, 
             c.name as client_name,
             c.company as client_company,
             u.full_name as project_manager_name,
             cu.full_name as created_by_name,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'closed') as completed_tasks
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.project_manager_id = u.id
      LEFT JOIN users cu ON p.created_by = cu.id
      WHERE 1=1`;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }
    
    if (client_id) {
      paramCount++;
      query += ` AND p.client_id = $${paramCount}`;
      params.push(client_id);
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', authenticateToken, requirePermission('view_projects'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT p.*, 
             c.name as client_name,
             c.company as client_company,
             c.email as client_email,
             c.phone as client_phone,
             u.full_name as project_manager_name,
             u.email as project_manager_email,
             cu.full_name as created_by_name,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'closed') as completed_tasks,
             (SELECT SUM(total_hours) FROM tasks WHERE project_id = p.id) as total_hours
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.project_manager_id = u.id
      LEFT JOIN users cu ON p.created_by = cu.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', authenticateToken, requirePermission('create_projects'), async (req, res) => {
  try {
    const {
      name,
      description,
      client_id,
      status,
      priority,
      start_date,
      due_date,
      budget,
      project_manager_id
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const result = await db.query(
      `INSERT INTO projects 
       (name, description, client_id, status, priority, start_date, due_date, 
        budget, project_manager_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, description, client_id, status || 'active', priority || 'medium',
       start_date, due_date, budget, project_manager_id, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authenticateToken, requirePermission('edit_projects'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      client_id,
      status,
      priority,
      start_date,
      due_date,
      completion_date,
      budget,
      actual_cost,
      project_manager_id
    } = req.body;

    const result = await db.query(
      `UPDATE projects 
       SET name = $1, description = $2, client_id = $3, status = $4, 
           priority = $5, start_date = $6, due_date = $7, completion_date = $8,
           budget = $9, actual_cost = $10, project_manager_id = $11
       WHERE id = $12
       RETURNING *`,
      [name, description, client_id, status, priority, start_date, due_date,
       completion_date, budget, actual_cost, project_manager_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, requirePermission('delete_projects'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if project has tasks
    const taskCheck = await db.query(
      'SELECT COUNT(*) as count FROM tasks WHERE project_id = $1',
      [id]
    );
    
    if (parseInt(taskCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete project with associated tasks. Please reassign or delete tasks first.' 
      });
    }
    
    const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get project statistics
router.get('/:id/stats', authenticateToken, requirePermission('view_projects'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'on-going' THEN 1 END) as ongoing_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE 
          WHEN status != 'closed' AND due_date IS NOT NULL AND CURRENT_DATE > due_date 
          THEN 1 
        END) as overdue_tasks,
        SUM(total_hours) as total_hours,
        COUNT(DISTINCT department_id) as departments_involved
      FROM tasks
      WHERE project_id = $1
    `, [id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ error: 'Failed to fetch project statistics' });
  }
});

module.exports = router;
