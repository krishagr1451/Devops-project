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
      setForm({
        name: p.name, description: p.description,
        price: p.price, quantity: p.quantity, category: p.category
      });
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
      setError('Failed to update product. Please try again.');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Product</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        {['name', 'description', 'category'].map(field => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 capitalize mb-1">{field}</label>
            <input
              type="text"
              value={(form as any)[field]}
              onChange={e => setForm({ ...form, [field]: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        ))}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              type="number"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
        >
          Update Product
        </button>
      </form>
    </div>
  );
};

export default EditProduct;