import { useState } from "react";
import { Heart, LayoutDashboard, LogOut, Menu, Search, ShoppingCart, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileOpen(false);
    }
  };

  return (
    <header className="nav-wrap glass">
      <nav className="container nav">
        <div className="nav-left">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="logo">NovaShop</Link>
        </div>

        <div className={`nav-center ${mobileOpen ? "open" : ""}`}>
          <NavLink to="/" onClick={() => setMobileOpen(false)}>Home</NavLink>
          <NavLink to="/?category=electronics" onClick={() => setMobileOpen(false)}>Shop</NavLink>
          <NavLink to="/cart" onClick={() => setMobileOpen(false)}>Categories</NavLink>
          {user && <NavLink to="/orders" onClick={() => setMobileOpen(false)}>Orders</NavLink>}
        </div>

        <div className="nav-right">
          <form className="nav-search" onSubmit={handleSearch}>
            <Search size={16} />
            <input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          {user && (
            <NavLink to="/wishlist" className="nav-icon-link">
              <Heart size={18} />
            </NavLink>
          )}
          <NavLink to="/cart" className="nav-icon-link cart-link">
            <ShoppingCart size={18} />
            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className="nav-icon-link">
              <LayoutDashboard size={18} />
            </NavLink>
          )}
          <ThemeToggle />
          {user ? (
            <button className="btn ghost nav-user-btn" onClick={logout}>
              <LogOut size={16} /> <span className="nav-user-name">{user.name}</span>
            </button>
          ) : (
            <NavLink to="/login" className="btn nav-login-btn">Login</NavLink>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
