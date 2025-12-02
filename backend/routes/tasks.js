const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get all tasks
router.get('/', authenticateToken, requirePermission('view_tasks'), async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      project_id, 
      department_id, 
      created_by, 
      assigned_to,
      is_overdue 
    } = req.query;
    
    let query = `
      SELECT t.*, 
             p.name as project_name,
             d.name as department_name,
             s.name as subcategory_name,
             COALESCE(c.company, c.name) as client_name,
             u.full_name as created_by_name,
             CASE 
               WHEN t.status = 'closed' AND t.close_date IS NOT NULL AND t.due_date IS NOT NULL 
               THEN t.close_date > t.due_date
               WHEN t.status != 'closed' AND t.due_date IS NOT NULL 
               THEN CURRENT_DATE > t.due_date
               ELSE false
             END as is_overdue,
             (
               SELECT json_agg(json_build_object(
                 'id', tm.id,
                 'user_id', tm.user_id,
                 'full_name', users.full_name,
                 'email', users.email,
                 'hours_worked', tm.hours_worked
               ))
               FROM task_team_members tm
               JOIN users ON users.id = tm.user_id
               WHERE tm.task_id = t.id
             ) as team_members
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_departments d ON t.department_id = d.id
      LEFT JOIN task_subcategories s ON t.subcategory_id = s.id
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1`;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
    }
    
    if (priority) {
      paramCount++;
      query += ` AND t.priority = $${paramCount}`;
      params.push(priority);
    }
    
    if (project_id) {
      paramCount++;
      if (project_id === 'null' || project_id === 'adhoc') {
        query += ` AND t.project_id IS NULL`;
      } else {
        query += ` AND t.project_id = $${paramCount}`;
        params.push(project_id);
      }
    }
    
    if (department_id) {
      paramCount++;
      query += ` AND t.department_id = $${paramCount}`;
      params.push(department_id);
    }
    
    if (created_by) {
      paramCount++;
      query += ` AND t.created_by = $${paramCount}`;
      params.push(created_by);
    }
    
    if (assigned_to) {
      paramCount++;
      query += ` AND EXISTS (
        SELECT 1 FROM task_team_members 
        WHERE task_id = t.id AND user_id = $${paramCount}
      )`;
      params.push(assigned_to);
    }
    
    if (is_overdue !== undefined) {
      if (is_overdue === 'true') {
        query += ` AND t.status != 'closed' AND t.due_date IS NOT NULL AND CURRENT_DATE > t.due_date`;
      } else {
        query += ` AND (t.status = 'closed' OR t.due_date IS NULL OR CURRENT_DATE <= t.due_date)`;
      }
    }
    
    query += ` ORDER BY 
      CASE t.priority
        WHEN 'P1' THEN 1
        WHEN 'P2' THEN 2
        WHEN 'P3' THEN 3
        WHEN 'P4' THEN 4
        WHEN 'P5' THEN 5
      END ASC,
      t.due_date ASC NULLS LAST,
      t.created_at DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task
router.get('/:id', authenticateToken, requirePermission('view_tasks'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT t.*, 
             p.name as project_name,
             p.client_id as project_client_id,
             d.name as department_name,
             s.name as subcategory_name,
             COALESCE(c.company, c.name) as client_name,
             u.full_name as created_by_name,
             u.email as created_by_email,
             CASE 
               WHEN t.status = 'closed' AND t.close_date IS NOT NULL AND t.due_date IS NOT NULL 
               THEN t.close_date > t.due_date
               WHEN t.status != 'closed' AND t.due_date IS NOT NULL 
               THEN CURRENT_DATE > t.due_date
               ELSE false
             END as is_overdue,
             (
               SELECT json_agg(json_build_object(
                 'id', tm.id,
                 'user_id', tm.user_id,
                 'full_name', users.full_name,
                 'email', users.email,
                 'hours_worked', tm.hours_worked,
                 'added_at', tm.added_at
               ))
               FROM task_team_members tm
               JOIN users ON users.id = tm.user_id
               WHERE tm.task_id = t.id
             ) as team_members
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_departments d ON t.department_id = d.id
      LEFT JOIN task_subcategories s ON t.subcategory_id = s.id
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create task
router.post('/', authenticateToken, requirePermission('create_tasks'), async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const {
      title,
      description,
      ticket_number,
      ticket_url,
      priority,
      department_id,
      subcategory_id,
      project_id,
      client_id,
      status,
      start_date,
      due_date,
      total_hours,
      team_member_ids
    } = req.body;

    if (!title || !priority) {
      return res.status(400).json({ error: 'Title and priority are required' });
    }

    // Validate priority
    if (!['P1', 'P2', 'P3', 'P4', 'P5'].includes(priority)) {
      return res.status(400).json({ error: 'Priority must be P1, P2, P3, P4, or P5' });
    }

    // Create task
    const taskResult = await client.query(
      `INSERT INTO tasks 
       (title, description, ticket_number, ticket_url, priority, department_id, 
        subcategory_id, project_id, client_id, status, start_date, due_date, total_hours, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        title, 
        description || null, 
        ticket_number || null, 
        ticket_url || null, 
        priority, 
        department_id && department_id !== '' ? parseInt(department_id) : null,
        subcategory_id && subcategory_id !== '' ? parseInt(subcategory_id) : null, 
        project_id && project_id !== '' ? parseInt(project_id) : null,
        client_id && client_id !== '' ? parseInt(client_id) : null,
        status || 'pending', 
        start_date || null, 
        due_date || null, 
        total_hours || 0, 
        req.user.id
      ]
    );

    const task = taskResult.rows[0];

    // Add team members if provided
    if (team_member_ids && Array.isArray(team_member_ids) && team_member_ids.length > 0) {
      for (const user_id of team_member_ids) {
        await client.query(
          'INSERT INTO task_team_members (task_id, user_id) VALUES ($1, $2)',
          [task.id, user_id]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch complete task with relations
    const completeTask = await db.query(`
      SELECT t.*, 
             p.name as project_name,
             d.name as department_name,
             s.name as subcategory_name,
             COALESCE(c.company, c.name) as client_name,
             CASE 
               WHEN t.status = 'closed' AND t.close_date IS NOT NULL AND t.due_date IS NOT NULL 
               THEN t.close_date > t.due_date
               WHEN t.status != 'closed' AND t.due_date IS NOT NULL 
               THEN CURRENT_DATE > t.due_date
               ELSE false
             END as is_overdue,
             (
               SELECT json_agg(json_build_object(
                 'user_id', tm.user_id,
                 'full_name', users.full_name
               ))
               FROM task_team_members tm
               JOIN users ON users.id = tm.user_id
               WHERE tm.task_id = t.id
             ) as team_members
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_departments d ON t.department_id = d.id
      LEFT JOIN task_subcategories s ON t.subcategory_id = s.id
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.id = $1
    `, [task.id]);

    res.status(201).json(completeTask.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  } finally {
    client.release();
  }
});

// Update task
router.put('/:id', authenticateToken, requirePermission('edit_tasks'), async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      title,
      description,
      ticket_number,
      ticket_url,
      priority,
      department_id,
      subcategory_id,
      project_id,
      client_id,
      status,
      start_date,
      due_date,
      close_date,
      total_hours,
      team_member_ids
    } = req.body;

    // Validate priority if provided
    if (priority && !['P1', 'P2', 'P3', 'P4', 'P5'].includes(priority)) {
      return res.status(400).json({ error: 'Priority must be P1, P2, P3, P4, or P5' });
    }

    // Update task
    const taskResult = await client.query(
      `UPDATE tasks 
       SET title = $1, description = $2, ticket_number = $3, ticket_url = $4, 
           priority = $5, department_id = $6, subcategory_id = $7, project_id = $8,
           client_id = $9, status = $10, start_date = $11, due_date = $12, close_date = $13, 
           total_hours = $14
       WHERE id = $15
       RETURNING *`,
      [
        title, 
        description || null, 
        ticket_number || null, 
        ticket_url || null, 
        priority, 
        department_id && department_id !== '' ? parseInt(department_id) : null,
        subcategory_id && subcategory_id !== '' ? parseInt(subcategory_id) : null,
        project_id && project_id !== '' ? parseInt(project_id) : null,
        client_id && client_id !== '' ? parseInt(client_id) : null,
        status, 
        start_date || null, 
        due_date || null, 
        close_date || null, 
        total_hours, 
        id
      ]
    );

    if (taskResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update team members if provided
    if (team_member_ids && Array.isArray(team_member_ids)) {
      // Remove existing team members
      await client.query('DELETE FROM task_team_members WHERE task_id = $1', [id]);
      
      // Add new team members
      for (const user_id of team_member_ids) {
        await client.query(
          'INSERT INTO task_team_members (task_id, user_id) VALUES ($1, $2)',
          [id, user_id]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch complete task with relations
    const completeTask = await db.query(`
      SELECT t.*, 
             p.name as project_name,
             d.name as department_name,
             s.name as subcategory_name,
             COALESCE(c.company, c.name) as client_name,
             CASE 
               WHEN t.status = 'closed' AND t.close_date IS NOT NULL AND t.due_date IS NOT NULL 
               THEN t.close_date > t.due_date
               WHEN t.status != 'closed' AND t.due_date IS NOT NULL 
               THEN CURRENT_DATE > t.due_date
               ELSE false
             END as is_overdue,
             (
               SELECT json_agg(json_build_object(
                 'user_id', tm.user_id,
                 'full_name', users.full_name
               ))
               FROM task_team_members tm
               JOIN users ON users.id = tm.user_id
               WHERE tm.task_id = t.id
             ) as team_members
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_departments d ON t.department_id = d.id
      LEFT JOIN task_subcategories s ON t.subcategory_id = s.id
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.id = $1
    `, [id]);

    res.json(completeTask.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  } finally {
    client.release();
  }
});

// Delete task
router.delete('/:id', authenticateToken, requirePermission('delete_tasks'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Add team member to task
router.post('/:id/team-members', authenticateToken, requirePermission('edit_tasks'), async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, hours_worked } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await db.query(
      `INSERT INTO task_team_members (task_id, user_id, hours_worked)
       VALUES ($1, $2, $3)
       ON CONFLICT (task_id, user_id) DO UPDATE 
       SET hours_worked = task_team_members.hours_worked + EXCLUDED.hours_worked
       RETURNING *`,
      [id, user_id, hours_worked || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// Remove team member from task
router.delete('/:id/team-members/:userId', authenticateToken, requirePermission('edit_tasks'), async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    const result = await db.query(
      'DELETE FROM task_team_members WHERE task_id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found on this task' });
    }

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// Update team member hours
router.put('/:id/team-members/:userId/hours', authenticateToken, requirePermission('edit_tasks'), async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { hours_worked } = req.body;

    if (hours_worked === undefined) {
      return res.status(400).json({ error: 'Hours worked is required' });
    }

    const result = await db.query(
      `UPDATE task_team_members 
       SET hours_worked = $1
       WHERE task_id = $2 AND user_id = $3
       RETURNING *`,
      [hours_worked, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found on this task' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update team member hours error:', error);
    res.status(500).json({ error: 'Failed to update hours' });
  }
});

// Get task statistics for dashboard
router.get('/stats/overview', authenticateToken, requirePermission('view_tasks'), async (req, res) => {
  try {
    const { user_id } = req.query;
    
    let whereClause = '1=1';
    const params = [];
    
    if (user_id) {
      whereClause = `EXISTS (
        SELECT 1 FROM task_team_members 
        WHERE task_id = tasks.id AND user_id = $1
      )`;
      params.push(user_id);
    }
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'on-going' THEN 1 END) as ongoing_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'awaiting_feedback' THEN 1 END) as awaiting_feedback_tasks,
        COUNT(CASE 
          WHEN status != 'closed' AND due_date IS NOT NULL AND CURRENT_DATE > due_date 
          THEN 1 
        END) as overdue_tasks,
        COUNT(CASE WHEN priority = 'P1' THEN 1 END) as p1_tasks,
        COUNT(CASE WHEN priority = 'P2' THEN 1 END) as p2_tasks,
        SUM(total_hours) as total_hours_logged
      FROM tasks
      WHERE ${whereClause}
    `, params);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ error: 'Failed to fetch task statistics' });
  }
});

module.exports = router;