import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));

  const sync = (next) => {
    setCart(next);
    localStorage.setItem("cart", JSON.stringify(next));
  };

  const addToCart = (product, quantity = 1) => {
    const exists = cart.find((item) => item.id === product.id);
    if (exists) {
      sync(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)));
      return;
    }
    sync([...cart, { ...product, quantity }]);
  };

  const removeFromCart = (id) => sync(cart.filter((item) => item.id !== id));
  const clearCart = () => sync([]);
  const updateQty = (id, quantity) =>
    sync(cart.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, Number(quantity)) } : item)));

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(
    () => ({ cart, addToCart, removeFromCart, clearCart, updateQty, total }),
    [cart, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
