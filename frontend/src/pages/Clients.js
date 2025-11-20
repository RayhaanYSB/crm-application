import React, { useState, useEffect } from 'react';
import { 
  getClients, getClient, createClient, updateClient, deleteClient,
  getClientContacts, createContact, updateContact, deleteContact, togglePrimaryContact,
  getLeads, getQuotations
} from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaUser, FaStar, FaRegStar } from 'react-icons/fa';
import './Clients.css';

const Clients = () => {
  const [view, setView] = useState('list');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [clientForm, setClientForm] = useState({
    name: '', email: '', phone: '', company: '', address: '',
    city: '', country: '', tax_number: '', notes: ''
  });
  
  const [contactForm, setContactForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    position: '', department: '', is_primary: false, notes: ''
  });
  
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    if (view === 'list') fetchClients();
  }, [view]);

  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getClients();
      setClients(response.data);
    } catch (err) {
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetails = async (clientId) => {
    setLoading(true);
    setError('');
    try {
        const [clientResponse, contactsResponse, leadsResponse, quotationsResponse] = await Promise.all([
        getClient(clientId),
        getClientContacts(clientId),
        getLeads(clientId),
        getQuotations(clientId)
        ]);
        setSelectedClient(clientResponse.data);
        setContacts(contactsResponse.data);
        setLeads(leadsResponse.data);
        setQuotations(quotationsResponse.data);
        setView('detail');
    } catch (err) {
        setError('Failed to load client details');
        console.error(err);
    } finally {
        setLoading(false);
    }
    };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingClient) {
        await updateClient(editingClient.id, clientForm);
        setSuccess('Client updated successfully');
      } else {
        await createClient(clientForm);
        setSuccess('Client created successfully');
      }
      setTimeout(() => {
        setView('list');
        resetClientForm();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const contactData = { ...contactForm, client_id: selectedClient.id };
      if (editingContact) {
        await updateContact(editingContact.id, contactData);
        setSuccess('Contact updated successfully');
      } else {
        await createContact(contactData);
        setSuccess('Contact created successfully');
      }
      const response = await getClientContacts(selectedClient.id);
      setContacts(response.data);
      setShowContactForm(false);
      resetContactForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Delete this client and all contacts?')) return;
    try {
      await deleteClient(id);
      setSuccess('Client deleted successfully');
      fetchClients();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete client');
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await deleteContact(id);
      setSuccess('Contact deleted successfully');
      const response = await getClientContacts(selectedClient.id);
      setContacts(response.data);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete contact');
    }
  };

  const handleTogglePrimary = async (contactId) => {
    try {
      await togglePrimaryContact(contactId);
      setSuccess('Primary contact updated');
      const response = await getClientContacts(selectedClient.id);
      setContacts(response.data);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update primary contact');
    }
  };

  const startEditClient = (client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name || '', email: client.email || '', phone: client.phone || '',
      company: client.company || '', address: client.address || '', city: client.city || '',
      country: client.country || '', tax_number: client.tax_number || '', notes: client.notes || ''
    });
    setView('form');
  };

  const startEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      first_name: contact.first_name || '', last_name: contact.last_name || '',
      email: contact.email || '', phone: contact.phone || '', position: contact.position || '',
      department: contact.department || '', is_primary: contact.is_primary || false,
      notes: contact.notes || ''
    });
    setShowContactForm(true);
  };

  const resetClientForm = () => {
    setClientForm({ name: '', email: '', phone: '', company: '', address: '', city: '', country: '', tax_number: '', notes: '' });
    setEditingClient(null);
  };

  const resetContactForm = () => {
    setContactForm({ first_name: '', last_name: '', email: '', phone: '', position: '', department: '', is_primary: false, notes: '' });
    setEditingContact(null);
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedClient(null);
    setContacts([]);
    resetClientForm();
  };

  if (view === 'list') {
    return (
      <div className="main-content">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">Clients</h1>
            <button className="btn btn-primary" onClick={() => { resetClientForm(); setView('form'); }}>
              <FaPlus /> Add Client
            </button>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {loading ? (
            <div className="loading">Loading clients...</div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                        No clients found. Create your first client!
                      </td></tr>
                    ) : (
                      clients.map(client => (
                        <tr key={client.id}>
                          <td>
                            <button className="link-button" onClick={() => fetchClientDetails(client.id)}>
                              {client.name}
                            </button>
                          </td>
                          <td>{client.company || '-'}</td>
                          <td>{client.email || '-'}</td>
                          <td>{client.phone || '-'}</td>
                          <td>{client.city || '-'}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon btn-edit" onClick={() => startEditClient(client)} title="Edit">
                                <FaEdit />
                              </button>
                              <button className="btn-icon btn-delete" onClick={() => handleDeleteClient(client.id)} title="Delete">
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="main-content">
        <div className="page-container">
          <div className="page-header">
            <button className="btn btn-secondary" onClick={handleBackToList}>
              <FaArrowLeft /> Back to List
            </button>
            <h1 className="page-title">{editingClient ? 'Edit Client' : 'New Client'}</h1>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <div className="card">
            <form onSubmit={handleClientSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input type="text" className="form-control" value={clientForm.name}
                    onChange={(e) => setClientForm({...clientForm, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input type="text" className="form-control" value={clientForm.company}
                    onChange={(e) => setClientForm({...clientForm, company: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={clientForm.email}
                    onChange={(e) => setClientForm({...clientForm, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-control" value={clientForm.phone}
                    onChange={(e) => setClientForm({...clientForm, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" className="form-control" value={clientForm.address}
                  onChange={(e) => setClientForm({...clientForm, address: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-control" value={clientForm.city}
                    onChange={(e) => setClientForm({...clientForm, city: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input type="text" className="form-control" value={clientForm.country}
                    onChange={(e) => setClientForm({...clientForm, country: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Number</label>
                  <input type="text" className="form-control" value={clientForm.tax_number}
                    onChange={(e) => setClientForm({...clientForm, tax_number: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" value={clientForm.notes}
                  onChange={(e) => setClientForm({...clientForm, notes: e.target.value})} rows="4" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingClient ? 'Update Client' : 'Create Client')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'detail' && selectedClient) {
    return (
      <div className="main-content">
        <div className="page-container">
          <div className="page-header">
            <button className="btn btn-secondary" onClick={handleBackToList}>
              <FaArrowLeft /> Back to List
            </button>
            <div>
              <h1 className="page-title">{selectedClient.name}</h1>
              {selectedClient.company && <p className="page-subtitle">{selectedClient.company}</p>}
            </div>
            <button className="btn btn-primary" onClick={() => startEditClient(selectedClient)}>
              <FaEdit /> Edit Client
            </button>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <div className="card">
            <div className="card-header">Client Information</div>
            <div className="info-grid">
              <div className="info-item"><label>Email:</label><span>{selectedClient.email || '-'}</span></div>
              <div className="info-item"><label>Phone:</label><span>{selectedClient.phone || '-'}</span></div>
              <div className="info-item"><label>Address:</label><span>{selectedClient.address || '-'}</span></div>
              <div className="info-item"><label>City:</label><span>{selectedClient.city || '-'}</span></div>
              <div className="info-item"><label>Country:</label><span>{selectedClient.country || '-'}</span></div>
              <div className="info-item"><label>Tax Number:</label><span>{selectedClient.tax_number || '-'}</span></div>
              {selectedClient.notes && (
                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes:</label><span>{selectedClient.notes}</span>
                </div>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-header-with-action">
              <h3><FaUser /> Contacts</h3>
              {!showContactForm && (
                <button className="btn btn-primary btn-sm" onClick={() => { resetContactForm(); setShowContactForm(true); }}>
                  <FaPlus /> Add Contact
                </button>
              )}
            </div>
            {showContactForm && (
              <div className="contact-form-container">
                <h4>{editingContact ? 'Edit Contact' : 'New Contact'}</h4>
                <form onSubmit={handleContactSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input type="text" className="form-control" value={contactForm.first_name}
                        onChange={(e) => setContactForm({...contactForm, first_name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input type="text" className="form-control" value={contactForm.last_name}
                        onChange={(e) => setContactForm({...contactForm, last_name: e.target.value})} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input type="tel" className="form-control" value={contactForm.phone}
                        onChange={(e) => setContactForm({...contactForm, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Position</label>
                      <input type="text" className="form-control" value={contactForm.position}
                        onChange={(e) => setContactForm({...contactForm, position: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input type="text" className="form-control" value={contactForm.department}
                        onChange={(e) => setContactForm({...contactForm, department: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" value={contactForm.notes}
                      onChange={(e) => setContactForm({...contactForm, notes: e.target.value})} rows="2" />
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={contactForm.is_primary}
                        onChange={(e) => setContactForm({...contactForm, is_primary: e.target.checked})} />
                      <span>Set as primary contact</span>
                    </label>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => {
                      setShowContactForm(false);
                      resetContactForm();
                    }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : (editingContact ? 'Update Contact' : 'Add Contact')}
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Primary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      No contacts found. Add the first contact for this client!
                    </td></tr>
                  ) : (
                    contacts.map(contact => (
                      <tr key={contact.id} className={contact.is_primary ? 'primary-contact' : ''}>
                        <td><strong>{contact.first_name} {contact.last_name}</strong></td>
                        <td>{contact.position || '-'}</td>
                        <td>{contact.email || '-'}</td>
                        <td>{contact.phone || '-'}</td>
                        <td>{contact.department || '-'}</td>
                        <td>
                          <button 
                            className={`btn-icon ${contact.is_primary ? 'btn-primary-active' : 'btn-primary-inactive'}`}
                            onClick={() => handleTogglePrimary(contact.id)}
                            disabled={contact.is_primary}
                            title={contact.is_primary ? 'Primary contact' : 'Set as primary'}
                          >
                            {contact.is_primary ? <FaStar /> : <FaRegStar />}
                          </button>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-icon btn-edit" onClick={() => startEditContact(contact)} title="Edit">
                              <FaEdit />
                            </button>
                            <button className="btn-icon btn-delete" onClick={() => handleDeleteContact(contact.id)} title="Delete">
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Leads Section */}
          <div className="card">
            <div className="card-header-with-action">
              <h3>📋 Ongoing Leads</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lead Name</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                        No leads associated with this client yet.
                      </td>
                    </tr>
                  ) : (
                    leads.map(lead => (
                      <tr key={lead.id}>
                        <td><strong>{lead.name}</strong></td>
                        <td>{lead.company || '-'}</td>
                        <td>
                          <span className={`status-badge status-${lead.status}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td>{lead.source || '-'}</td>
                        <td>{lead.assigned_to_name || '-'}</td>
                        <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quotations Section */}
          <div className="card">
            <div className="card-header-with-action">
              <h3>📄 Quotations</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Quote #</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Valid Until</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        No quotations generated for this client yet.
                      </td>
                    </tr>
                  ) : (
                    quotations.map(quote => (
                      <tr key={quote.id}>
                        <td><strong>{quote.quote_number}</strong></td>
                        <td>
                          <span className={`status-badge status-${quote.status}`}>
                            {quote.status}
                          </span>
                        </td>
                        <td>${parseFloat(quote.total).toFixed(2)}</td>
                        <td>
                          {quote.valid_until 
                            ? new Date(quote.valid_until).toLocaleDateString()
                            : '-'}
                        </td>
                        <td>{new Date(quote.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default Clients;