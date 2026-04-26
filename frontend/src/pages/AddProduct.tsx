import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../services/api';

const AddProduct = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', description: '', price: '', quantity: '', category: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct({
        ...form,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
      });
      navigate('/');
    } catch (err) {
      setError('Failed to create product. Please try again.');
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Add New Product</h1>
      {error && <p className="error-msg">{error}</p>}
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input type="text" className="form-input" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input type="text" className="form-input" value={form.description}
              onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <input type="text" className="form-input" value={form.category}
              onChange={e => setForm({...form, category: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price ($) *</label>
              <input type="number" className="form-input" value={form.price}
                onChange={e => setForm({...form, price: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input type="number" className="form-input" value={form.quantity}
                onChange={e => setForm({...form, quantity: e.target.value})} required />
            </div>
          </div>
          <button type="submit" className="btn-submit">Add Product</button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;