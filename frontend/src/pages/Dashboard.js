import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaUsers, FaBox, FaUserTie, FaBullseye, 
  FaFileInvoice, FaUserCog, FaTasks 
} from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const { user, hasPermission } = useAuth();

  const modules = [
    { 
      name: 'Clients', 
      path: '/clients', 
      icon: <FaUsers />, 
      permission: 'view_clients',
      description: 'Manage your client database',
      color: '#3182ce'
    },
    { 
      name: 'Products', 
      path: '/products', 
      icon: <FaBox />, 
      permission: 'view_products',
      description: 'Manage products and pricing',
      color: '#38a169'
    },
    { 
      name: 'Leads', 
      path: '/leads', 
      icon: <FaUserTie />, 
      permission: 'view_leads',
      description: 'Track and manage leads',
      color: '#dd6b20'
    },
    { 
      name: 'Opportunities', 
      path: '/opportunities', 
      icon: <FaBullseye />, 
      permission: 'view_opportunities',
      description: 'Track sales opportunities',
      color: '#9f7aea'
    },
    { 
      name: 'Quotations', 
      path: '/quotations', 
      icon: <FaFileInvoice />, 
      permission: 'view_quotations',
      description: 'Create and manage quotations',
      color: '#d53f8c'
    },
    { 
      name: 'Task Tracker',           // ADD THIS MODULE
      path: '/tasks', 
      icon: <FaTasks />, 
      permission: 'view_tasks',
      description: 'Track and manage all tasks',
      color: '#00a8cc'
    },
    { 
      name: 'Users', 
      path: '/users', 
      icon: <FaUserCog />, 
      permission: 'manage_users',
      description: 'Manage users and permissions',
      color: '#2c5282'
    },
  ];

  const accessibleModules = modules.filter(module => 
    hasPermission(module.permission)
  );

  return (
    <div className="main-content">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.full_name}!</p>
          </div>
        </div>

        <div className="dashboard-grid">
          {accessibleModules.map((module) => (
            <Link
              key={module.path}
              to={module.path}
              className="dashboard-card"
              style={{ '--card-color': module.color }}
            >
              <div className="dashboard-card-icon" style={{ color: module.color }}>
                {module.icon}
              </div>
              <h3 className="dashboard-card-title">{module.name}</h3>
              <p className="dashboard-card-description">{module.description}</p>
            </Link>
          ))}
        </div>

        {accessibleModules.length === 0 && (
          <div className="alert alert-info">
            <h3>No Access</h3>
            <p>You don't have access to any modules yet. Please contact your administrator.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
