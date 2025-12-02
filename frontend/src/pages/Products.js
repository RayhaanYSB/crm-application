import React, { useState, useEffect } from 'react';
import { 
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getTags, createTag, deleteTag, getUnits, createUnit, deleteUnit
} from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaBox, FaCog, FaTimes, FaTag } from 'react-icons/fa';
import './Products.css';

const Products = () => {
  const [view, setView] = useState('list');
  const [products, setProducts] = useState([]);
  const [tags, setTags] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState('item');
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Settings modals
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3182ce');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitAbbr, setNewUnitAbbr] = useState('');
  
  // Item form
  const [itemForm, setItemForm] = useState({
    name: '', description: '', sku: '', price: '', cost: '',
    category: '', unit: '', item_type: '', tags: [], is_active: true
  });
  
  // Service form
  const [serviceForm, setServiceForm] = useState({
    name: '', description: '', category: '', rate: '',
    service_unit: '', tags: [], is_active: true
  });

  useEffect(() => {
    if (view === 'list') {
      fetchProducts();
    }
    fetchTags();
    fetchUnits();
  }, [view]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await getTags();
      setTags(response.data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await getUnits();
      setUnits(response.data);
    } catch (err) {
      console.error('Failed to load units:', err);
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const productData = { ...itemForm, product_type: 'item' };
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setSuccess('Item updated successfully');
      } else {
        await createProduct(productData);
        setSuccess('Item created successfully');
      }
      setTimeout(() => {
        setView('list');
        resetForms();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const productData = { ...serviceForm, product_type: 'service' };
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setSuccess('Service updated successfully');
      } else {
        await createProduct(productData);
        setSuccess('Service created successfully');
      }
      setTimeout(() => {
        setView('list');
        resetForms();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setSuccess('Product deleted successfully');
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const startEditProduct = async (product) => {
    setEditingProduct(product);
    if (product.product_type === 'item') {
      setItemForm({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price || '',
        cost: product.cost || '',
        category: product.category || '',
        unit: product.unit || '',
        item_type: product.item_type || '',
        tags: product.tags || [],
        is_active: product.is_active !== false
      });
      setSelectedProductType('item');
    } else {
      setServiceForm({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        rate: product.rate || '',
        service_unit: product.service_unit || '',
        tags: product.tags || [],
        is_active: product.is_active !== false
      });
      setSelectedProductType('service');
    }
    setView('form');
  };

  const resetForms = () => {
    setItemForm({
      name: '', description: '', sku: '', price: '', cost: '',
      category: '', unit: '', item_type: '', tags: [], is_active: true
    });
    setServiceForm({
      name: '', description: '', category: '', rate: '',
      service_unit: '', tags: [], is_active: true
    });
    setEditingProduct(null);
    setSelectedProductType('item');
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    try {
      await createTag({ name: newTagName, color: newTagColor });
      setSuccess('Tag created successfully');
      setNewTagName('');
      setNewTagColor('#3182ce');
      fetchTags();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create tag');
    }
  };

  const handleDeleteTag = async (id) => {
    if (!window.confirm('Delete this tag?')) return;
    try {
      await deleteTag(id);
      setSuccess('Tag deleted successfully');
      fetchTags();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete tag');
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    try {
      await createUnit({ name: newUnitName, abbreviation: newUnitAbbr });
      setSuccess('Unit created successfully');
      setNewUnitName('');
      setNewUnitAbbr('');
      fetchUnits();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create unit');
    }
  };

  const handleDeleteUnit = async (id) => {
    if (!window.confirm('Delete this unit?')) return;
    try {
      await deleteUnit(id);
      setSuccess('Unit deleted successfully');
      fetchUnits();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete unit');
    }
  };

  const toggleTag = (tagName, formType) => {
    if (formType === 'item') {
      const newTags = itemForm.tags.includes(tagName)
        ? itemForm.tags.filter(t => t !== tagName)
        : [...itemForm.tags, tagName];
      setItemForm({ ...itemForm, tags: newTags });
    } else {
      const newTags = serviceForm.tags.includes(tagName)
        ? serviceForm.tags.filter(t => t !== tagName)
        : [...serviceForm.tags, tagName];
      setServiceForm({ ...serviceForm, tags: newTags });
    }
  };

  // LIST VIEW
if (view === 'list') {
  // Separate products by type
  const items = products.filter(p => p.product_type === 'item');
  const services = products.filter(p => p.product_type === 'service');

  return (
    <div className="main-content">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Products</h1>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setShowTagsModal(true)}>
              <FaTag /> Manage Tags
            </button>
            <button className="btn btn-secondary" onClick={() => setShowUnitsModal(true)}>
              <FaCog /> Manage Units
            </button>
            <button className="btn btn-primary" onClick={() => setShowTypeSelector(true)}>
              <FaPlus /> Add Product
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <>
            {/* ITEMS TABLE */}
            <div className="card">
              <div className="card-header-with-action">
                <h3>📦 Items</h3>
                <span className="count-badge">{items.length} item{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Item Type</th>
                      <th>Unit Cost</th>
                      <th>Unit Price</th>
                      <th>Unit</th>
                      <th>Tags</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>
                          No items found. Create your first item!
                        </td>
                      </tr>
                    ) : (
                      items.map(product => (
                        <tr key={product.id}>
                          <td><strong>{product.name}</strong></td>
                          <td>{product.sku || '-'}</td>
                          <td>{product.category || '-'}</td>
                          <td>{product.item_type || '-'}</td>
                          <td>R{parseFloat(product.cost || 0).toFixed(2)}</td>
                          <td>R{parseFloat(product.price || 0).toFixed(2)}</td>
                          <td>{product.unit || '-'}</td>
                          <td>
                            <div className="tags-display">
                              {product.tags && product.tags.length > 0 ? (
                                product.tags.map((tag, idx) => {
                                  const tagObj = tags.find(t => t.name === tag);
                                  return (
                                    <span 
                                      key={idx} 
                                      className="tag-badge"
                                      style={{ backgroundColor: tagObj?.color || '#3182ce' }}
                                    >
                                      {tag}
                                    </span>
                                  );
                                })
                              ) : '-'}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${product.is_active ? 'status-active' : 'status-inactive'}`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon btn-edit" onClick={() => startEditProduct(product)} title="Edit">
                                <FaEdit />
                              </button>
                              <button className="btn-icon btn-delete" onClick={() => handleDeleteProduct(product.id)} title="Delete">
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

            {/* SERVICES TABLE */}
            <div className="card">
              <div className="card-header-with-action">
                <h3>⚙️ Services</h3>
                <span className="count-badge">{services.length} service{services.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Rate</th>
                      <th>Unit</th>
                      <th>Tags</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                          No services found. Create your first service!
                        </td>
                      </tr>
                    ) : (
                      services.map(product => (
                        <tr key={product.id}>
                          <td>
                            <strong>{product.name}</strong>
                            {product.description && (
                              <div className="text-muted small-text">{product.description.substring(0, 60)}{product.description.length > 60 ? '...' : ''}</div>
                            )}
                          </td>
                          <td>{product.category || '-'}</td>
                          <td>R{parseFloat(product.rate || 0).toFixed(2)}</td>
                          <td>{product.service_unit || '-'}</td>
                          <td>
                            <div className="tags-display">
                              {product.tags && product.tags.length > 0 ? (
                                product.tags.map((tag, idx) => {
                                  const tagObj = tags.find(t => t.name === tag);
                                  return (
                                    <span 
                                      key={idx} 
                                      className="tag-badge"
                                      style={{ backgroundColor: tagObj?.color || '#3182ce' }}
                                    >
                                      {tag}
                                    </span>
                                  );
                                })
                              ) : '-'}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${product.is_active ? 'status-active' : 'status-inactive'}`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon btn-edit" onClick={() => startEditProduct(product)} title="Edit">
                                <FaEdit />
                              </button>
                              <button className="btn-icon btn-delete" onClick={() => handleDeleteProduct(product.id)} title="Delete">
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
          </>
        )}
      </div>

      {/* Product Type Selector Modal */}
      {showTypeSelector && (
        <div className="modal-overlay" onClick={() => setShowTypeSelector(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Product Type</h2>
              <button className="modal-close" onClick={() => setShowTypeSelector(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="product-type-selector">
              <button 
                className="type-card"
                onClick={() => {
                  setSelectedProductType('item');
                  setShowTypeSelector(false);
                  setView('form');
                }}
              >
                <div className="type-icon">📦</div>
                <h3>Item</h3>
                <p>Physical products with SKU, cost, and pricing</p>
              </button>
              <button 
                className="type-card"
                onClick={() => {
                  setSelectedProductType('service');
                  setShowTypeSelector(false);
                  setView('form');
                }}
              >
                <div className="type-icon">⚙️</div>
                <h3>Service</h3>
                <p>Services with hourly/project rates</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Management Modal */}
      {showTagsModal && (
        <div className="modal-overlay" onClick={() => setShowTagsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Tags</h2>
              <button className="modal-close" onClick={() => setShowTagsModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddTag} className="tag-form">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  required
                />
                <input
                  type="color"
                  className="color-picker"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">Add Tag</button>
              </form>
              <div className="tags-list">
                {tags.map(tag => (
                  <div key={tag.id} className="tag-item">
                    <span className="tag-badge" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                    <button className="btn-icon btn-delete" onClick={() => handleDeleteTag(tag.id)}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Units Management Modal */}
      {showUnitsModal && (
        <div className="modal-overlay" onClick={() => setShowUnitsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Service Units</h2>
              <button className="modal-close" onClick={() => setShowUnitsModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddUnit} className="unit-form">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Unit name (e.g., Hour)"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Abbreviation (e.g., hr)"
                  value={newUnitAbbr}
                  onChange={(e) => setNewUnitAbbr(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">Add Unit</button>
              </form>
              <div className="units-list">
                {units.map(unit => (
                  <div key={unit.id} className="unit-item">
                    <span>
                      <strong>{unit.name}</strong>
                      {unit.abbreviation && <span className="text-muted"> ({unit.abbreviation})</span>}
                    </span>
                    <button className="btn-icon btn-delete" onClick={() => handleDeleteUnit(unit.id)}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  // FORM VIEW
  if (view === 'form') {
    return (
      <div className="main-content">
        <div className="page-container">
          <div className="page-header">
            <button className="btn btn-secondary" onClick={() => { setView('list'); resetForms(); }}>
              ← Back to List
            </button>
            <h1 className="page-title">
              {editingProduct ? 'Edit' : 'New'} {selectedProductType === 'item' ? 'Item' : 'Service'}
            </h1>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="card">
            {selectedProductType === 'item' ? (
              <form onSubmit={handleItemSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Item Name *</label>
                    <input type="text" className="form-control" value={itemForm.name}
                      onChange={(e) => setItemForm({...itemForm, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input type="text" className="form-control" value={itemForm.sku}
                      onChange={(e) => setItemForm({...itemForm, sku: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={itemForm.description}
                    onChange={(e) => setItemForm({...itemForm, description: e.target.value})} rows="3" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input type="text" className="form-control" value={itemForm.category}
                      onChange={(e) => setItemForm({...itemForm, category: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Item Type</label>
                    <input type="text" className="form-control" value={itemForm.item_type}
                      onChange={(e) => setItemForm({...itemForm, item_type: e.target.value})} 
                      placeholder="e.g., Hardware, Software, Consumable" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unit Cost *</label>
                    <input type="number" step="0.01" className="form-control" value={itemForm.cost}
                      onChange={(e) => setItemForm({...itemForm, cost: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Price *</label>
                    <input type="number" step="0.01" className="form-control" value={itemForm.price}
                      onChange={(e) => setItemForm({...itemForm, price: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input type="text" className="form-control" value={itemForm.unit}
                      onChange={(e) => setItemForm({...itemForm, unit: e.target.value})} 
                      placeholder="e.g., piece, box, kg" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <div className="tags-selector">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        className={`tag-badge ${itemForm.tags.includes(tag.name) ? 'selected' : ''}`}
                        style={{ backgroundColor: itemForm.tags.includes(tag.name) ? tag.color : '#e2e8f0' }}
                        onClick={() => toggleTag(tag.name, 'item')}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={itemForm.is_active}
                      onChange={(e) => setItemForm({...itemForm, is_active: e.target.checked})} />
                    <span>Active</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => { setView('list'); resetForms(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (editingProduct ? 'Update Item' : 'Create Item')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleServiceSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Service Name *</label>
                    <input type="text" className="form-control" value={serviceForm.name}
                      onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input type="text" className="form-control" value={serviceForm.category}
                      onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={serviceForm.description}
                    onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})} rows="3" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Rate *</label>
                    <input type="number" step="0.01" className="form-control" value={serviceForm.rate}
                      onChange={(e) => setServiceForm({...serviceForm, rate: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit *</label>
                    <select className="form-control" value={serviceForm.service_unit}
                      onChange={(e) => setServiceForm({...serviceForm, service_unit: e.target.value})} required>
                      <option value="">Select unit...</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.name}>
                          {unit.name} {unit.abbreviation && `(${unit.abbreviation})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <div className="tags-selector">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        className={`tag-badge ${serviceForm.tags.includes(tag.name) ? 'selected' : ''}`}
                        style={{ backgroundColor: serviceForm.tags.includes(tag.name) ? tag.color : '#e2e8f0' }}
                        onClick={() => toggleTag(tag.name, 'service')}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={serviceForm.is_active}
                      onChange={(e) => setServiceForm({...serviceForm, is_active: e.target.checked})} />
                    <span>Active</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => { setView('list'); resetForms(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (editingProduct ? 'Update Service' : 'Create Service')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Products;