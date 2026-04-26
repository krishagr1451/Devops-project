import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, updateProduct } from '../services/api';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', description: '', price: '', quantity: '', category: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const res = await getProduct(Number(id));
      const p = res.data;
      setForm({ name: p.name, description: p.description,
        price: p.price, quantity: p.quantity, category: p.category });
    };
    fetch();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProduct(Number(id), {
        ...form,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
      });
      navigate('/');
    } catch (err) {
      setError('Failed to update product.');
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Edit Product</h1>
      {error && <p className="error-msg">{error}</p>}
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input type="text" className="form-input" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} />
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
              <label className="form-label">Price ($)</label>
              <input type="number" className="form-input" value={form.price}
                onChange={e => setForm({...form, price: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input type="number" className="form-input" value={form.quantity}
                onChange={e => setForm({...form, quantity: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn-submit">Update Product</button>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;