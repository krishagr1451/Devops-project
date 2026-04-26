import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🛒 Inventory Manager</Link>
      <Link to="/add" className="navbar-btn">+ Add Product</Link>
    </nav>
  );
};

export default Navbar;