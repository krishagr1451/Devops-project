import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '../services/api';

const ProductList = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this product?')) {
      await deleteProduct(id);
      fetchProducts();
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const categories = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean))) as string[];
  const filtered = products.filter((p: any) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === '' || p.category === category;
    return matchSearch && matchCategory;
  });

  const totalValue = products.reduce((sum: number, p: any) => sum + p.price * p.quantity, 0);
  const lowStock = products.filter((p: any) => p.quantity < 5).length;

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="page">
      <h1 className="page-title">All Products</h1>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-number">{products.length}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{categories.length}</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">${totalValue.toFixed(0)}</div>
          <div className="stat-label">Total Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: lowStock > 0 ? '#e53e3e' : '#38a169' }}>{lowStock}</div>
          <div className="stat-label">Low Stock Items</div>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat: any) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h2>No products found</h2>
          <Link to="/add">Add your first product</Link>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((product: any) => (
            <div key={product.id} className="product-card">
              <div className="product-card-header">
                <span className="product-name">{product.name}</span>
                <span className="product-category">{product.category}</span>
              </div>
              <p className="product-description">{product.description}</p>
              <div className="product-footer">
                <span className="product-price">${product.price}</span>
                <span className={`product-qty ${product.quantity < 5 ? 'low' : ''}`}>
                  Qty: {product.quantity} {product.quantity < 5 ? '⚠️' : ''}
                </span>
              </div>
              <div className="product-actions">
                <Link to={`/edit/${product.id}`} className="btn btn-edit">✏️ Edit</Link>
                <button onClick={() => handleDelete(product.id)} className="btn btn-delete">🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;