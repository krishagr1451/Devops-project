import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct, Product } from '../services/api';

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">All Products</h1>
      {products.length === 0 ? (
        <div className="text-center text-gray-400 mt-20">
          <p className="text-xl">No products yet.</p>
          <Link to="/add" className="text-blue-500 underline mt-2 block">Add your first product</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: any) => (
            <div key={product.id} className="bg-white rounded-lg shadow p-5 border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{product.category}</span>
              </div>
              <p className="text-gray-500 text-sm mb-3">{product.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-green-600 font-bold text-lg">${product.price}</span>
                <span className="text-gray-500 text-sm">Qty: {product.quantity}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/edit/${product.id}`}
                  className="flex-1 text-center bg-blue-500 text-white py-1.5 rounded hover:bg-blue-600 text-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-red-500 text-white py-1.5 rounded hover:bg-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;