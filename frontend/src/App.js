import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import PlaceholderPage from './pages/PlaceholderPage';
import Quotations from './pages/Quotations';
import TaskTracker from './pages/TaskTracker';
import TaskAnalytics from './pages/TaskAnalytics';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <><Navbar /><Dashboard /></>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/clients"
          element={
            <ProtectedRoute permission="view_clients">
              <><Navbar /><Clients /></>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/products"
          element={
            <ProtectedRoute permission="view_products">
              <><Navbar /><Products /></>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/leads"
          element={
            <ProtectedRoute permission="view_leads">
              <><Navbar /><PlaceholderPage 
                title="Leads" 
                description="Track and manage your sales leads through the pipeline." 
              /></>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/opportunities"
          element={
            <ProtectedRoute permission="view_opportunities">
              <><Navbar /><PlaceholderPage 
                title="Opportunities" 
                description="Track sales opportunities and manage your sales pipeline." 
              /></>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/quotations"
          element={
            <ProtectedRoute permission="view_quotations">
              <><Navbar /><Quotations /></>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute permission="view_tasks">
              <><Navbar /><TaskTracker /></>
            </ProtectedRoute>
          }
        />
        
        <Route 
          path="/task-analytics" 
          element={
            <ProtectedRoute permission="manage_task_admin">
              <>
                <Navbar />
                <TaskAnalytics />
              </>
            </ProtectedRoute>
          } 
        />
        
        <Route
          path="/users"
          element={
            <ProtectedRoute permission="manage_users">
              <><Navbar /><PlaceholderPage 
                title="User Management" 
                description="Manage user accounts, roles, and permissions." 
              /></>
            </ProtectedRoute>
          }
        />

        
        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
