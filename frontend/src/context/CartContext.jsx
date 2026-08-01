import { createContext, useContext, useMemo, useState, useCallback } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem("savedForLater") || "[]"));
  const [lastRemoved, setLastRemoved] = useState(null);

  const syncCart = (next) => {
    setCart(next);
    localStorage.setItem("cart", JSON.stringify(next));
  };

  const syncSaved = (next) => {
    setSaved(next);
    localStorage.setItem("savedForLater", JSON.stringify(next));
  };

  const addToCart = useCallback((product, quantity = 1) => {
    const exists = cart.find((item) => item.id === product.id);
    if (exists) {
      syncCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock || 99) } : item)));
      return;
    }
    syncCart([...cart, { ...product, quantity: Math.min(quantity, product.stock || 99) }]);
  }, [cart]);

  const removeFromCart = useCallback((id) => {
    const item = cart.find(i => i.id === id);
    setLastRemoved({ item, type: 'cart' });
    syncCart(cart.filter((item) => item.id !== id));
  }, [cart]);

  const undoRemove = useCallback(() => {
    if (!lastRemoved) return false;
    if (lastRemoved.type === 'cart' && lastRemoved.item) {
      syncCart([...cart, lastRemoved.item]);
    } else if (lastRemoved.type === 'saved' && lastRemoved.item) {
      syncSaved([...saved, lastRemoved.item]);
    }
    setLastRemoved(null);
    return true;
  }, [lastRemoved, cart, saved]);

  const clearCart = useCallback(() => syncCart([]), []);

  const updateQty = useCallback((id, quantity) => {
    const qty = Math.max(1, Number(quantity));
    syncCart(cart.map((item) => {
      if (item.id !== id) return item;
      const maxQty = item.stock || 99;
      return { ...item, quantity: Math.min(qty, maxQty) };
    }));
  }, [cart]);

  const saveForLater = useCallback((id) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    syncCart(cart.filter(i => i.id !== id));
    if (!saved.find(s => s.id === id)) {
      syncSaved([...saved, item]);
    }
  }, [cart, saved]);

  const moveToCart = useCallback((id) => {
    const item = saved.find(i => i.id === id);
    if (!item) return;
    syncSaved(saved.filter(i => i.id !== id));
    const exists = cart.find(c => c.id === id);
    if (exists) {
      syncCart(cart.map(c => c.id === id ? { ...c, quantity: c.quantity + item.quantity } : c));
    } else {
      syncCart([...cart, item]);
    }
  }, [cart, saved]);

  const removeSaved = useCallback((id) => {
    const item = saved.find(i => i.id === id);
    setLastRemoved({ item, type: 'saved' });
    syncSaved(saved.filter(i => i.id !== id));
  }, [saved]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(
    () => ({
      cart, saved, total, itemCount, lastRemoved,
      addToCart, removeFromCart, clearCart, updateQty,
      saveForLater, moveToCart, removeSaved, undoRemove,
    }),
    [cart, saved, total, itemCount, lastRemoved, addToCart, removeFromCart, clearCart, updateQty, saveForLater, moveToCart, removeSaved, undoRemove]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
