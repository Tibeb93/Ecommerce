import { useState, useEffect } from "react";
import { Heart, LayoutDashboard, LogOut, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../api";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistCount, setWishlistCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setWishlistCount(0); return; }
    api.get("/wishlist/count").then(({ data }) => setWishlistCount(data.count)).catch(() => {});
  }, [user]);

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
          <NavLink to="/cart" onClick={() => setMobileOpen(false)}>Cart</NavLink>
          {user && <NavLink to="/orders" onClick={() => setMobileOpen(false)}>Orders</NavLink>}
          <NavLink to="/contact" onClick={() => setMobileOpen(false)}>Contact</NavLink>
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
              {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
            </NavLink>
          )}
          <NavLink to="/cart" className="nav-icon-link cart-link">
            <ShoppingCart size={18} />
            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
          </NavLink>
          {user && <NotificationBell />}
          {user?.role === "admin" && (
            <NavLink to="/admin" className="nav-icon-link">
              <LayoutDashboard size={18} />
            </NavLink>
          )}
          <ThemeToggle />
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <NavLink to="/profile" className="nav-icon-link"><User size={18} /></NavLink>
              <button className="btn ghost nav-user-btn" onClick={logout}>
                <LogOut size={16} /> <span className="nav-user-name">{user.name}</span>
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="btn nav-login-btn">Login</NavLink>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
