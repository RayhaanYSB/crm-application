import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './TaskTracker.css';

const TaskTracker = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    project_id: '',
    department_id: '',
    is_overdue: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ticket_number: '',
    ticket_url: '',
    priority: 'P3',
    department_id: '',
    subcategory_id: '',
    project_id: '',
    client_id: '',
    status: 'pending',
    start_date: '',
    due_date: '',
    close_date: '',
    total_hours: 0,
    team_member_ids: []
  });

  useEffect(() => {
    fetchAllData();
  }, [filters]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query string for filters
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      // Fetch tasks with filters
      const tasksRes = await fetch(`http://localhost:5000/api/tasks?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tasksData = await tasksRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      // Fetch other data (only once, not on filter change)
      if (projects.length === 0) {
        const [projectsRes, deptsRes, usersRes, clientsRes] = await Promise.all([
          fetch('http://localhost:5000/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/task-admin/departments', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/clients', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const projectsData = await projectsRes.json();
        const deptsData = await deptsRes.json();
        const usersData = await usersRes.json();
        const clientsData = await clientsRes.json();

        setProjects(Array.isArray(projectsData) ? projectsData : []);
        setDepartments(Array.isArray(deptsData) ? deptsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setClients(Array.isArray(clientsData) ? clientsData : []);
      }

      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (departmentId) => {
    if (!departmentId) {
      setSubcategories([]);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/task-admin/subcategories?department_id=${departmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSubcategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingTask 
        ? `http://localhost:5000/api/tasks/${editingTask.id}`
        : 'http://localhost:5000/api/tasks';
      
      const method = editingTask ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchAllData();
        resetForm();
        setShowForm(false);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to save task');
      }
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Failed to save task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      ticket_number: task.ticket_number || '',
      ticket_url: task.ticket_url || '',
      priority: task.priority,
      department_id: task.department_id || '',
      subcategory_id: task.subcategory_id || '',
      project_id: task.project_id || '',
      client_id: task.client_id || '',
      status: task.status,
      start_date: task.start_date || '',
      due_date: task.due_date || '',
      close_date: task.close_date || '',
      total_hours: task.total_hours || 0,
      team_member_ids: task.team_members ? task.team_members.map(tm => tm.user_id) : []
    });
    
    if (task.department_id) {
      fetchSubcategories(task.department_id);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchAllData();
      } else {
        setError('Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  const handleCloseTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to mark this task as closed?')) return;

    try {
      const token = localStorage.getItem('token');
      
      // Get the current task data
      const taskRes = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!taskRes.ok) {
        setError('Failed to fetch task');
        return;
      }
      
      const task = await taskRes.json();
      
      // Update task to closed status with today's date
      const today = new Date().toISOString().split('T')[0];
      const updateRes = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...task,
          status: 'closed',
          close_date: today
        })
      });

      if (updateRes.ok) {
        fetchAllData();
      } else {
        setError('Failed to close task');
      }
    } catch (err) {
      console.error('Error closing task:', err);
      setError('Failed to close task');
    }
  };

  const resetForm = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      ticket_number: '',
      ticket_url: '',
      priority: 'P3',
      department_id: '',
      subcategory_id: '',
      project_id: '',
      client_id: '',
      status: 'pending',
      start_date: '',
      due_date: '',
      close_date: '',
      total_hours: 0,
      team_member_ids: []
    });
    setSubcategories([]);
  };

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setFormData({ ...formData, department_id: deptId, subcategory_id: '' });
    fetchSubcategories(deptId);
  };

  const toggleTeamMember = (userId) => {
    const currentMembers = formData.team_member_ids || [];
    if (currentMembers.includes(userId)) {
      setFormData({
        ...formData,
        team_member_ids: currentMembers.filter(id => id !== userId)
      });
    } else {
      setFormData({
        ...formData,
        team_member_ids: [...currentMembers, userId]
      });
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'P1': '#dc3545',
      'P2': '#fd7e14',
      'P3': '#ffc107',
      'P4': '#20c997',
      'P5': '#6c757d'
    };
    return colors[priority] || '#6c757d';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'badge-secondary',
      'on-going': 'badge-primary',
      'awaiting_feedback': 'badge-warning',
      'closed': 'badge-success'
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="main-content">
        <div className="task-tracker" data-theme={theme}>
          <div className="loading">Loading tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="task-tracker" data-theme={theme}>
        <div className="page-header">
          <h1>Task Tracker</h1>
          <div className="header-actions">
            <div className="view-toggle">
              <button 
                className={`btn btn-toggle ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
                title="Card View"
              >
                <span>📋</span> Cards
              </button>
              <button 
                className={`btn btn-toggle ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <span>📊</span> List
              </button>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cancel' : '+ New Task'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="on-going">On-Going</option>
            <option value="awaiting_feedback">Awaiting Feedback</option>
            <option value="closed">Closed</option>
          </select>

          <select 
            value={filters.priority} 
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
            <option value="P5">P5 - Very Low</option>
          </select>

          <select 
            value={filters.project_id} 
            onChange={(e) => setFilters({...filters, project_id: e.target.value})}
            className="filter-select"
          >
            <option value="">All Projects</option>
            <option value="adhoc">Ad-hoc Tasks</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select 
            value={filters.department_id} 
            onChange={(e) => setFilters({...filters, department_id: e.target.value})}
            className="filter-select"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select 
            value={filters.is_overdue} 
            onChange={(e) => setFilters({...filters, is_overdue: e.target.value})}
            className="filter-select"
          >
            <option value="">All Tasks</option>
            <option value="true">Overdue Only</option>
            <option value="false">Not Overdue</option>
          </select>

          <button 
            className="btn btn-secondary"
            onClick={() => setFilters({ status: '', priority: '', project_id: '', department_id: '', is_overdue: '' })}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Task Form */}
      {showForm && (
        <div className="task-form-section">
          <h3>{editingTask ? 'Edit Task' : 'New Task'}</h3>
          <form onSubmit={handleSubmit} className="task-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  required
                >
                  <option value="P1">P1 - Critical</option>
                  <option value="P2">P2 - High</option>
                  <option value="P3">P3 - Medium</option>
                  <option value="P4">P4 - Low</option>
                  <option value="P5">P5 - Very Low</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ticket Number</label>
                <input
                  type="text"
                  value={formData.ticket_number}
                  onChange={(e) => setFormData({...formData, ticket_number: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Ticket URL (optional)</label>
                <input
                  type="url"
                  value={formData.ticket_url}
                  onChange={(e) => setFormData({...formData, ticket_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select
                  value={formData.department_id}
                  onChange={handleDepartmentChange}
                >
                  <option value="">Select Department</option>
                  {departments.filter(d => d.is_active).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subcategory</label>
                <select
                  value={formData.subcategory_id}
                  onChange={(e) => setFormData({...formData, subcategory_id: e.target.value})}
                  disabled={!formData.department_id}
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Project</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                >
                  <option value="">Ad-hoc Task (No Project)</option>
                  {projects.filter(p => p.status === 'active').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Client</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                >
                  <option value="">Select Client (Optional)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company || c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="on-going">On-Going</option>
                  <option value="awaiting_feedback">Awaiting Feedback</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                />
              </div>

              {formData.status === 'closed' && (
                <div className="form-group">
                  <label>Close Date</label>
                  <input
                    type="date"
                    value={formData.close_date}
                    onChange={(e) => setFormData({...formData, close_date: e.target.value})}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Total Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.total_hours}
                onChange={(e) => setFormData({...formData, total_hours: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div className="form-group">
              <label>Team Members</label>
              <div className="team-members-grid">
                {users.map(u => (
                  <label key={u.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(formData.team_member_ids || []).includes(u.id)}
                      onChange={() => toggleTeamMember(u.id)}
                    />
                    {u.full_name}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setShowForm(false);
                resetForm();
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Tasks Section */}
      <div className="tasks-section">
        <h3>Active Tasks ({tasks.filter(t => t.status !== 'closed').length})</h3>
        {tasks.filter(t => t.status !== 'closed').length === 0 ? (
          <p className="no-data">No active tasks.</p>
        ) : viewMode === 'card' ? (
          <div className="tasks-grid">{tasks.filter(t => t.status !== 'closed').map(task => (
              <div key={task.id} className="task-card">
                {task.created_by_name && (
                  <div className="task-owner">
                    <strong>Task Owner:</strong> {task.created_by_name}
                  </div>
                )}
                
                <div className="task-header">
                  <div className="task-title-row">
                    <h4>{task.title}</h4>
                    <span 
                      className="priority-badge" 
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <span className={`badge ${getStatusBadge(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-meta">
                  {task.ticket_number && (
                    <div className="meta-item">
                      <strong>Ticket:</strong>{' '}
                      {task.ticket_url ? (
                        <a href={task.ticket_url} target="_blank" rel="noopener noreferrer">
                          {task.ticket_number}
                        </a>
                      ) : (
                        task.ticket_number
                      )}
                    </div>
                  )}
                  
                  {task.department_name && (
                    <div className="meta-item">
                      <strong>Department:</strong> {task.department_name}
                      {task.subcategory_name && ` / ${task.subcategory_name}`}
                    </div>
                  )}

                  {task.project_name && (
                    <div className="meta-item">
                      <strong>Project:</strong> {task.project_name}
                    </div>
                  )}

                  {task.client_name && (
                    <div className="meta-item">
                      <strong>Client:</strong> {task.client_name}
                    </div>
                  )}

                  {task.due_date && (
                    <div className="meta-item">
                      <strong>Due:</strong>{' '}
                      <span className={task.is_overdue ? 'text-danger' : ''}>
                        {new Date(task.due_date).toLocaleDateString()}
                        {task.is_overdue && ' (OVERDUE)'}
                      </span>
                    </div>
                  )}

                  {task.total_hours > 0 && (
                    <div className="meta-item">
                      <strong>Hours:</strong> {task.total_hours}
                    </div>
                  )}

                  {task.team_members && task.team_members.length > 0 && (
                    <div className="meta-item">
                      <strong>Team:</strong> {task.team_members.map(tm => tm.full_name).join(', ')}
                    </div>
                  )}
                </div>

                <div className="task-actions">
                  <div className="task-actions-left">
                    <button className="btn btn-sm btn-primary" onClick={() => handleEdit(task)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(task.id)}>
                      Delete
                    </button>
                  </div>
                  <button className="btn btn-sm btn-success" onClick={() => handleCloseTask(task.id)}>
                    Close Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="task-table-container">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Client</th>
                  <th>Department</th>
                  <th>Due Date</th>
                  <th>Hours</th>
                  <th>Team</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.filter(t => t.status !== 'closed').map(task => (
                  <tr key={task.id} className={task.is_overdue ? 'row-overdue' : ''}>
                    <td>{task.created_by_name}</td>
                    <td>
                      <strong>{task.title}</strong>
                      {task.description && <div className="table-desc">{task.description.substring(0, 60)}...</div>}
                    </td>
                    <td>
                      <span 
                        className="priority-badge" 
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{task.client_name || '-'}</td>
                    <td>{task.department_name || '-'}</td>
                    <td>
                      {task.due_date ? (
                        <span className={task.is_overdue ? 'text-danger' : ''}>
                          {new Date(task.due_date).toLocaleDateString()}
                          {task.is_overdue && ' ⚠️'}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{task.total_hours || 0}</td>
                    <td>{task.team_members ? task.team_members.length : 0}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-xs btn-primary" onClick={() => handleEdit(task)} title="Edit">✏️</button>
                        <button className="btn btn-xs btn-danger" onClick={() => handleDelete(task.id)} title="Delete">🗑️</button>
                        <button className="btn btn-xs btn-success" onClick={() => handleCloseTask(task.id)} title="Close">✓</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Closed Tasks Section */}
      <div className="tasks-section">
        <h3>Closed Tasks ({tasks.filter(t => t.status === 'closed').length})</h3>
        {tasks.filter(t => t.status === 'closed').length === 0 ? (
          <p className="no-data">No closed tasks.</p>
        ) : viewMode === 'card' ? (
          <div className="tasks-grid">
            {tasks.filter(t => t.status === 'closed').map(task => (
              <div key={task.id} className="task-card task-card-closed">
                {task.created_by_name && (
                  <div className="task-owner">
                    <strong>Task Owner:</strong> {task.created_by_name}
                  </div>
                )}
                
                <div className="task-header">
                  <div className="task-title-row">
                    <h4>{task.title}</h4>
                    <span 
                      className="priority-badge" 
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <span className={`badge ${getStatusBadge(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-meta">
                  {task.ticket_number && (
                    <div className="meta-item">
                      <strong>Ticket:</strong>{' '}
                      {task.ticket_url ? (
                        <a href={task.ticket_url} target="_blank" rel="noopener noreferrer">
                          {task.ticket_number}
                        </a>
                      ) : (
                        task.ticket_number
                      )}
                    </div>
                  )}
                  
                  {task.department_name && (
                    <div className="meta-item">
                      <strong>Department:</strong> {task.department_name}
                      {task.subcategory_name && ` / ${task.subcategory_name}`}
                    </div>
                  )}

                  {task.project_name && (
                    <div className="meta-item">
                      <strong>Project:</strong> {task.project_name}
                    </div>
                  )}

                  {task.client_name && (
                    <div className="meta-item">
                      <strong>Client:</strong> {task.client_name}
                    </div>
                  )}

                  {task.close_date && (
                    <div className="meta-item">
                      <strong>Closed:</strong> {new Date(task.close_date).toLocaleDateString()}
                    </div>
                  )}

                  {task.due_date && (
                    <div className="meta-item">
                      <strong>Due:</strong>{' '}
                      <span className={task.is_overdue ? 'text-danger' : ''}>
                        {new Date(task.due_date).toLocaleDateString()}
                        {task.is_overdue && ' (OVERDUE)'}
                      </span>
                    </div>
                  )}

                  {task.total_hours > 0 && (
                    <div className="meta-item">
                      <strong>Hours:</strong> {task.total_hours}
                    </div>
                  )}

                  {task.team_members && task.team_members.length > 0 && (
                    <div className="meta-item">
                      <strong>Team:</strong> {task.team_members.map(tm => tm.full_name).join(', ')}
                    </div>
                  )}
                </div>

                <div className="task-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => handleEdit(task)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(task.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="task-table-container">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Client</th>
                  <th>Department</th>
                  <th>Closed Date</th>
                  <th>Due Date</th>
                  <th>Hours</th>
                  <th>Team</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.filter(t => t.status === 'closed').map(task => (
                  <tr key={task.id} className="row-closed">
                    <td>{task.created_by_name}</td>
                    <td>
                      <strong>{task.title}</strong>
                      {task.description && <div className="table-desc">{task.description.substring(0, 60)}...</div>}
                    </td>
                    <td>
                      <span 
                        className="priority-badge" 
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td>{task.client_name || '-'}</td>
                    <td>{task.department_name || '-'}</td>
                    <td>{task.close_date ? new Date(task.close_date).toLocaleDateString() : '-'}</td>
                    <td>
                      {task.due_date ? (
                        <span className={task.is_overdue ? 'text-danger' : ''}>
                          {new Date(task.due_date).toLocaleDateString()}
                          {task.is_overdue && ' ⚠️'}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{task.total_hours || 0}</td>
                    <td>{task.team_members ? task.team_members.length : 0}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-xs btn-primary" onClick={() => handleEdit(task)} title="Edit">✏️</button>
                        <button className="btn btn-xs btn-danger" onClick={() => handleDelete(task.id)} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default TaskTracker;