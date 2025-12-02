import React, { useState, useEffect } from 'react';
import { 
  getQuotations, createQuotation, updateQuotation, deleteQuotation, downloadQuotationPDF,
  getClients, getProducts, getTemplates
} from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaFilePdf, FaArrowLeft } from 'react-icons/fa';
import './Quotations.css';

const Quotations = () => {
  const [view, setView] = useState('list'); // list, form
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingQuotation, setEditingQuotation] = useState(null);
  
  const [quotationForm, setQuotationForm] = useState({
    client_id: '',
    template_id: '',
    description: '',
    valid_until: '',
    prepared_by: '',
    tax_rate: 15,
    discount: 0,
    notes: '',
    terms: '',
    status: 'draft',
    items: []
  });

  useEffect(() => {
    if (view === 'list') {
      fetchQuotations();
    }
    fetchClients();
    fetchProducts();
    fetchTemplates();
  }, [view]);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const response = await getQuotations();
      setQuotations(response.data);
    } catch (err) {
      setError('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await getClients();
      setClients(response.data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProducts(true); // active only
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await getTemplates();
      setTemplates(response.data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingQuotation) {
        await updateQuotation(editingQuotation.id, quotationForm);
        setSuccess('Quotation updated successfully');
      } else {
        await createQuotation(quotationForm);
        setSuccess('Quotation created successfully');
      }
      
      setTimeout(() => {
        setView('list');
        resetForm();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Delete this quotation?')) return;
    try {
      await deleteQuotation(id);
      setSuccess('Quotation deleted successfully');
      fetchQuotations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete quotation');
    }
  };

  const handleDownloadPDF = async (id, quoteNumber) => {
    try {
      setLoading(true);
      // Ensure your API service returns the FULL response object, not just data
      const response = await downloadQuotationPDF(id);
      
      // 1. Try to get filename from backend header
      let filename = `${quoteNumber}.pdf`; // Default fallback
      
      // Check if headers exist (Axios usually provides them in response.headers)
      const disposition = response.headers['content-disposition'];
      
      if (disposition && disposition.indexOf('attachment') !== -1) {
          // Regex to extract filename="value"
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) { 
            filename = matches[1].replace(/['"]/g, '');
            // Decode URI component to handle spaces and special chars correctly
            filename = decodeURIComponent(filename);
          }
      }

      // 2. Create blob link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 3. Use the extracted filename
      link.setAttribute('download', filename); 
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccess('PDF downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const startEditQuotation = (quotation) => {
    setEditingQuotation(quotation);
    setQuotationForm({
      client_id: quotation.client_id || '',
      template_id: quotation.template_id || '',
      description: quotation.description || '',
      valid_until: quotation.valid_until ? quotation.valid_until.split('T')[0] : '',
      prepared_by: quotation.prepared_by || '',
      tax_rate: quotation.tax_rate || 15,
      discount: quotation.discount || 0,
      notes: quotation.notes || '',
      terms: quotation.terms || '',
      status: quotation.status || 'draft',
      items: typeof quotation.items === 'string' ? JSON.parse(quotation.items) : quotation.items || []
    });
    setView('form');
  };

  const resetForm = () => {
    setQuotationForm({
      client_id: '',
      template_id: '',
      description: '',
      valid_until: '',
      prepared_by: '',
      tax_rate: 15,
      discount: 0,
      notes: '',
      terms: '',
      status: 'draft',
      items: []
    });
    setEditingQuotation(null);
  };

  const addItem = () => {
    setQuotationForm({
      ...quotationForm,
      items: [...quotationForm.items, { 
        product_id: '', 
        name: '', 
        description: '', 
        quantity: 1, 
        price: 0 
      }]
    });
  };

  const removeItem = (index) => {
    const newItems = quotationForm.items.filter((_, i) => i !== index);
    setQuotationForm({ ...quotationForm, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...quotationForm.items];
    newItems[index][field] = value;
    
    // If product selected, populate details
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].name = product.name;
        newItems[index].description = product.description || '';
        newItems[index].price = product.product_type === 'item' ? product.price : product.rate;
      }
    }
    
    setQuotationForm({ ...quotationForm, items: newItems });
  };

  const calculateSubtotal = () => {
    return quotationForm.items.reduce((sum, item) => 
      sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(quotationForm.discount || 0);
    const taxable = subtotal - discount;
    const tax = (taxable * parseFloat(quotationForm.tax_rate || 0)) / 100;
    return taxable + tax;
  };

  // LIST VIEW
  if (view === 'list') {
    return (
      <div className="main-content">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">Quotations</h1>
            <button className="btn btn-primary" onClick={() => { resetForm(); setView('form'); }}>
              <FaPlus /> New Quotation
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {loading ? (
            <div className="loading">Loading quotations...</div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Quote #</th>
                      <th>Client</th>
                      <th>Description</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Valid Until</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                          No quotations found. Create your first quotation!
                        </td>
                      </tr>
                    ) : (
                      quotations.map(quote => (
                        <tr key={quote.id}>
                          <td><strong>{quote.quote_number}</strong></td>
                          <td>{quote.client_name}</td>
                          <td>{quote.description || '-'}</td>
                          <td>R{parseFloat(quote.total).toFixed(2)}</td>
                          <td>
                            <span className={`status-badge status-${quote.status}`}>
                              {quote.status}
                            </span>
                          </td>
                          <td>
                            {quote.valid_until 
                              ? new Date(quote.valid_until).toLocaleDateString()
                              : '-'}
                          </td>
                          <td>{new Date(quote.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-icon btn-primary" 
                                onClick={() => handleDownloadPDF(quote.id, quote.quote_number)}
                                title="Download PDF"
                              >
                                <FaFilePdf />
                              </button>
                              <button 
                                className="btn-icon btn-edit" 
                                onClick={() => startEditQuotation(quote)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="btn-icon btn-delete" 
                                onClick={() => handleDeleteQuotation(quote.id)}
                                title="Delete"
                              >
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

  // FORM VIEW
  if (view === 'form') {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(quotationForm.discount || 0);
    const taxable = subtotal - discount;
    const tax = (taxable * parseFloat(quotationForm.tax_rate || 0)) / 100;
    const total = calculateTotal();

    return (
      <div className="main-content">
        <div className="page-container">
          <div className="page-header">
            <button className="btn btn-secondary" onClick={() => { setView('list'); resetForm(); }}>
              <FaArrowLeft /> Back to List
            </button>
            <h1 className="page-title">{editingQuotation ? 'Edit' : 'New'} Quotation</h1>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-header">Quotation Details</div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Client *</label>
                  <select 
                    className="form-control" 
                    value={quotationForm.client_id}
                    onChange={(e) => setQuotationForm({...quotationForm, client_id: e.target.value})}
                    required
                  >
                    <option value="">Select client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Template</label>
                  <select 
                    className="form-control" 
                    value={quotationForm.template_id}
                    onChange={(e) => setQuotationForm({...quotationForm, template_id: e.target.value})}
                  >
                    <option value="">Default template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.is_default && '(Default)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Valid Until</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={quotationForm.valid_until}
                    onChange={(e) => setQuotationForm({...quotationForm, valid_until: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Prepared By</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={quotationForm.prepared_by}
                    onChange={(e) => setQuotationForm({...quotationForm, prepared_by: e.target.value})}
                    placeholder="Your name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-control" 
                    value={quotationForm.status}
                    onChange={(e) => setQuotationForm({...quotationForm, status: e.target.value})}
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  value={quotationForm.description}
                  onChange={(e) => setQuotationForm({...quotationForm, description: e.target.value})}
                  rows="2"
                  placeholder="Brief description of services/products"
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header-with-action">
                <h3>Line Items</h3>
                <button type="button" className="btn btn-primary btn-sm" onClick={addItem}>
                  <FaPlus /> Add Item
                </button>
              </div>

              {quotationForm.items.length === 0 ? (
                <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No items added. Click "Add Item" to start building your quotation.
                </p>
              ) : (
                <div className="items-list">
                  {quotationForm.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-fields">
                        <div className="form-group">
                          <label className="form-label">Product/Service</label>
                          <select 
                            className="form-control"
                            value={item.product_id}
                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                          >
                            <option value="">Select or enter manually...</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - R{parseFloat(product.product_type === 'item' ? product.price : product.rate).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Item Name *</label>
                          <input 
                            type="text" 
                            className="form-control"
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Description</label>
                          <input 
                            type="text" 
                            className="form-control"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Quantity *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Unit Price (ZAR) *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control"
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Total</label>
                          <div className="total-display">
                            R{(parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <button 
                        type="button" 
                        className="btn-icon btn-delete"
                        onClick={() => removeItem(index)}
                        title="Remove item"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">Totals & Additional Information</div>
              
              <div className="totals-section">
                <div className="totals-inputs">
                  <div className="form-group">
                    <label className="form-label">Tax Rate (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-control"
                      value={quotationForm.tax_rate}
                      onChange={(e) => setQuotationForm({...quotationForm, tax_rate: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Discount (ZAR)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-control"
                      value={quotationForm.discount}
                      onChange={(e) => setQuotationForm({...quotationForm, discount: e.target.value})}
                    />
                  </div>
                </div>

                <div className="totals-display">
                  <div className="total-line">
                    <span>Subtotal:</span>
                    <span>R{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="total-line">
                      <span>Discount:</span>
                      <span>-R{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="total-line">
                    <span>Tax ({quotationForm.tax_rate}%):</span>
                    <span>R{tax.toFixed(2)}</span>
                  </div>
                  <div className="total-line total-final">
                    <span>TOTAL:</span>
                    <span>R{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea 
                  className="form-control" 
                  value={quotationForm.notes}
                  onChange={(e) => setQuotationForm({...quotationForm, notes: e.target.value})}
                  rows="3"
                  placeholder="Internal notes (not shown on PDF)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Terms & Conditions</label>
                <textarea 
                  className="form-control" 
                  value={quotationForm.terms}
                  onChange={(e) => setQuotationForm({...quotationForm, terms: e.target.value})}
                  rows="4"
                  placeholder="Terms and conditions (shown on PDF)"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setView('list'); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || quotationForm.items.length === 0}>
                {loading ? 'Saving...' : (editingQuotation ? 'Update Quotation' : 'Create Quotation')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default Quotations;