import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FaBars, FaTimes, FaUsers, FaBox, FaUserTie, FaBullseye, 
  FaFileInvoice, FaUserCog, FaMoon, FaSun, FaSignOutAlt, FaHome 
} from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <FaHome />, permission: null },
    { path: '/clients', label: 'Clients', icon: <FaUsers />, permission: 'view_clients' },
    { path: '/products', label: 'Products', icon: <FaBox />, permission: 'view_products' },
    { path: '/leads', label: 'Leads', icon: <FaUserTie />, permission: 'view_leads' },
    { path: '/opportunities', label: 'Opportunities', icon: <FaBullseye />, permission: 'view_opportunities' },
    { path: '/quotations', label: 'Quotations', icon: <FaFileInvoice />, permission: 'view_quotations' },
    { path: '/users', label: 'Users', icon: <FaUserCog />, permission: 'manage_users' },
  ];

  const accessibleMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <button className="burger-menu" onClick={toggleMenu}>
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
          <Link to="/" className="navbar-logo">
            <img 
              src={isDark ? "/logo-dark.png" : "/logo-light.png"} 
              alt="Company Logo" 
              className="navbar-logo-img"
            />
            <span className="navbar-logo-text">CRM System</span>
          </Link>
        </div>

        <div className="navbar-right">
          <span className="navbar-user">
            {user?.full_name}
            {user?.role === 'admin' && <span className="admin-badge">Admin</span>}
          </span>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {isDark ? <FaSun /> : <FaMoon />}
          </button>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      {/* Sidebar Menu */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button className="close-btn" onClick={toggleMenu}>
            <FaTimes />
          </button>
        </div>
        <ul className="sidebar-menu">
          {accessibleMenuItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                onClick={toggleMenu}
                className="sidebar-link"
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleMenu}></div>}
    </nav>
  );
};

export default Navbar;
