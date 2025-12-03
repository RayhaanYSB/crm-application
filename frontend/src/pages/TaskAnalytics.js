import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  FaClipboardList, 
  FaCheckCircle, 
  FaFolderOpen, 
  FaBullseye, 
  FaExclamationTriangle, 
  FaBusinessTime,
  FaChartBar 
} from 'react-icons/fa';
import './TaskAnalytics.css';

const TaskAnalytics = () => {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    user_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/task-analytics/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams();
      if (filters.user_id) queryParams.append('user_id', filters.user_id);
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);

      const res = await fetch(`${API_URL}/api/task-analytics/overview?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch analytics');
      
      const data = await res.json();
      setAnalytics(data);
      setError('');
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ user_id: '', start_date: '', end_date: '' });
  };

  // Chart colors
  const COLORS = {
    primary: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    purple: '#6f42c1',
    teal: '#20c997',
    orange: '#fd7e14'
  };

  const PRIORITY_COLORS = {
    'P1': '#dc3545',
    'P2': '#fd7e14',
    'P3': '#ffc107',
    'P4': '#20c997',
    'P5': '#6c757d'
  };

  const STATUS_COLORS = {
    'pending': '#6c757d',
    'on-going': '#007bff',
    'awaiting_feedback': '#ffc107',
    'closed': '#28a745'
  };

  if (loading && !analytics) {
    return (
      <div className="main-content">
        <div className="analytics-container" data-theme={theme}>
          <div className="loading">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="main-content">
        <div className="analytics-container" data-theme={theme}>
          <div className="alert alert-error">{error}</div>
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const completionRate = overview.total_tasks > 0 
    ? ((overview.closed_tasks / overview.total_tasks) * 100).toFixed(1) 
    : 0;
  const onTimeRate = overview.closed_tasks > 0 
    ? ((overview.closed_on_time / overview.closed_tasks) * 100).toFixed(1) 
    : 0;

  return (
    <div className="main-content">
      <div className="analytics-container" data-theme={theme}>
        {/* Header */}
        <div className="analytics-header">
          <h1><FaChartBar style={{ marginRight: '12px', verticalAlign: 'middle' }} /> Task Analytics Dashboard</h1>
          <p className="subtitle">Comprehensive task performance and insights</p>
        </div>

        {/* Filters */}
        <div className="analytics-filters">
          <div className="filter-group">
            <label>User</label>
            <select 
              value={filters.user_id} 
              onChange={(e) => setFilters({...filters, user_id: e.target.value})}
            >
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input 
              type="date" 
              value={filters.start_date}
              onChange={(e) => setFilters({...filters, start_date: e.target.value})}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input 
              type="date" 
              value={filters.end_date}
              onChange={(e) => setFilters({...filters, end_date: e.target.value})}
            />
          </div>

          <button className="btn btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card" style={{ borderLeftColor: COLORS.primary }}>
            <div className="kpi-icon"><FaClipboardList /></div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.total_tasks || 0}</div>
              <div className="kpi-label">Total Tasks</div>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeftColor: COLORS.success }}>
            <div className="kpi-icon"><FaCheckCircle /></div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.closed_tasks || 0}</div>
              <div className="kpi-label">Closed Tasks</div>
              <div className="kpi-subtitle">{completionRate}% completion rate</div>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeftColor: COLORS.warning }}>
            <div className="kpi-icon"><FaFolderOpen /></div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.open_tasks || 0}</div>
              <div className="kpi-label">Open Tasks</div>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeftColor: COLORS.info }}>
            <div className="kpi-icon"><FaBullseye /></div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.closed_on_time || 0}</div>
              <div className="kpi-label">Closed On Time</div>
              <div className="kpi-subtitle">{onTimeRate}% on-time rate</div>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeftColor: COLORS.danger }}>
            <div className="kpi-icon"><FaExclamationTriangle /></div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.currently_overdue || 0}</div>
              <div className="kpi-label">Currently Overdue</div>
            </div>
          </div>

          <div className="kpi-card" style={{ borderLeftColor: COLORS.purple }}>
            <div className="kpi-icon"><FaBusinessTime /></div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.total_hours_logged || 0}</div>
              <div className="kpi-label">Total Hours</div>
              <div className="kpi-subtitle">Avg: {overview.avg_hours || 0}h</div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Status Distribution Pie Chart */}
          <div className="chart-card">
            <h3>Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.status_distribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {analytics.status_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS.info} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Distribution Bar Chart */}
          <div className="chart-card">
            <h3>Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.priority_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ddd'} />
                <XAxis dataKey="priority" stroke={theme === 'dark' ? '#e0e0e0' : '#333'} />
                <YAxis stroke={theme === 'dark' ? '#e0e0e0' : '#333'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                    border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
                  }}
                />
                <Bar dataKey="count" fill={COLORS.primary}>
                  {analytics.priority_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || COLORS.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Distribution */}
          <div className="chart-card chart-card-wide">
            <h3>Top Departments by Task Count</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.department_distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ddd'} />
                <XAxis type="number" stroke={theme === 'dark' ? '#e0e0e0' : '#333'} />
                <YAxis dataKey="department" type="category" width={150} stroke={theme === 'dark' ? '#e0e0e0' : '#333'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                    border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
                  }}
                />
                <Bar dataKey="count" fill={COLORS.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline */}
          <div className="chart-card chart-card-wide">
            <h3>Task Creation & Completion Timeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ddd'} />
                <XAxis 
                  dataKey="date" 
                  stroke={theme === 'dark' ? '#e0e0e0' : '#333'}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke={theme === 'dark' ? '#e0e0e0' : '#333'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                    border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line type="monotone" dataKey="created" stroke={COLORS.primary} strokeWidth={2} name="Created" />
                <Line type="monotone" dataKey="closed" stroke={COLORS.success} strokeWidth={2} name="Closed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Statistics Table */}
        {analytics.user_statistics.length > 0 && (
          <div className="chart-card">
            <h3>User Performance</h3>
            <div className="table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Total Tasks</th>
                    <th>Closed</th>
                    <th>Active</th>
                    <th>Hours Logged</th>
                    <th>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.user_statistics.map((user, index) => (
                    <tr key={index}>
                      <td><strong>{user.user_name}</strong></td>
                      <td>{user.total}</td>
                      <td><span className="badge badge-success">{user.closed}</span></td>
                      <td><span className="badge badge-primary">{user.active}</span></td>
                      <td>{user.hours || 0}h</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${(user.closed / user.total * 100)}%` }}
                          />
                          <span className="progress-text">
                            {((user.closed / user.total) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Clients */}
        {analytics.client_distribution.length > 0 && (
          <div className="chart-card">
            <h3>Top Clients by Task Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.client_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ddd'} />
                <XAxis dataKey="client_name" stroke={theme === 'dark' ? '#e0e0e0' : '#333'} />
                <YAxis stroke={theme === 'dark' ? '#e0e0e0' : '#333'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff',
                    border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
                  }}
                />
                <Bar dataKey="task_count" fill={COLORS.orange} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskAnalytics;