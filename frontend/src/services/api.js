import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const getCurrentUser = () => api.get('/auth/me');

// Users
export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getAllPermissions = () => api.get('/users/permissions/all');
export const updateUserPermissions = (id, permissions) => 
  api.put(`/users/${id}/permissions`, { permissions });

// Clients
export const getClients = () => api.get('/clients');
export const getClient = (id) => api.get(`/clients/${id}`);
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// Contacts
export const getClientContacts = (clientId) => api.get(`/contacts/client/${clientId}`);
export const getContact = (id) => api.get(`/contacts/${id}`);
export const createContact = (data) => api.post('/contacts', data);
export const updateContact = (id, data) => api.put(`/contacts/${id}`, data);
export const togglePrimaryContact = (id) => api.patch(`/contacts/${id}/primary`);
export const deleteContact = (id) => api.delete(`/contacts/${id}`);

// Products
export const getProducts = (activeOnly = false) => 
  api.get(`/products${activeOnly ? '?active_only=true' : ''}`);
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Leads
export const getLeads = (clientId = null) => 
  api.get(`/leads${clientId ? `?client_id=${clientId}` : ''}`);
export const getLead = (id) => api.get(`/leads/${id}`);
export const createLead = (data) => api.post('/leads', data);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data);
export const deleteLead = (id) => api.delete(`/leads/${id}`);

// Opportunities
export const getOpportunities = () => api.get('/opportunities');
export const getOpportunity = (id) => api.get(`/opportunities/${id}`);
export const createOpportunity = (data) => api.post('/opportunities', data);
export const updateOpportunity = (id, data) => api.put(`/opportunities/${id}`, data);
export const deleteOpportunity = (id) => api.delete(`/opportunities/${id}`);

// Quotations
export const getQuotations = (clientId = null) => 
  api.get(`/quotations${clientId ? `?client_id=${clientId}` : ''}`);
export const getQuotation = (id) => api.get(`/quotations/${id}`);
export const createQuotation = (data) => api.post('/quotations', data);
export const updateQuotation = (id, data) => api.put(`/quotations/${id}`, data);
export const deleteQuotation = (id) => api.delete(`/quotations/${id}`);
export const downloadQuotationPDF = (id) => 
  api.get(`/quotations/${id}/pdf`, { responseType: 'blob' });

export default api;
