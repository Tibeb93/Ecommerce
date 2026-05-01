import { Heart, LayoutDashboard, LogOut, ShoppingCart } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();

  return (
    <header className="glass nav-wrap">
      <nav className="container nav">
        <Link to="/" className="logo">
          NovaShop
        </Link>
        <div className="nav-links">
          <NavLink to="/">Shop</NavLink>
          {user && <NavLink to="/orders">Orders</NavLink>}
          {user && (
            <NavLink to="/wishlist">
              <Heart size={16} /> Wishlist
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin">
              <LayoutDashboard size={16} /> Admin
            </NavLink>
          )}
          <NavLink to="/cart">
            <ShoppingCart size={16} /> Cart ({cart.length})
          </NavLink>
          {user ? (
            <button className="btn ghost" onClick={logout}>
              <LogOut size={16} /> {user.name}
            </button>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
