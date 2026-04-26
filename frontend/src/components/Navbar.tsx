import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold">🛒 Inventory Manager</Link>
      <Link
        to="/add"
        className="bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-blue-50"
      >
        + Add Product
      </Link>
    </nav>
  );
};

export default Navbar;