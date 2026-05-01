import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";

const CartCheckout = () => {
  const { cart, removeFromCart, updateQty, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    setError("");
    if (!user) return navigate("/login");
    if (shippingAddress.trim().length < 10) {
      setError("Please enter a complete shipping address (min 10 chars).");
      return;
    }
    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }
    try {
      setLoading(true);
      await api.post("/payment/intent", { amount: total });
      await api.post("/orders", {
        shippingAddress,
        paymentMethod: "Card",
        items: cart.map((item) => ({ productId: item.id, quantity: item.quantity }))
      });
      clearCart();
      navigate("/orders");
    } catch (err) {
      setError(getErrorMessage(err, "Checkout failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section">
      <h1>Cart & Checkout</h1>
      <div className="list">
        {cart.map((item) => (
          <article className="glass list-item" key={item.id}>
            <img src={item.image} alt={item.title} />
            <div>
              <h3>{item.title}</h3>
              <p>${item.price.toFixed(2)}</p>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateQty(item.id, Number(e.target.value))}
              />
            </div>
            <button className="btn ghost" onClick={() => removeFromCart(item.id)}>
              Remove
            </button>
          </article>
        ))}
      </div>
      <article className="glass checkout-card">
        <h3>Total: ${total.toFixed(2)}</h3>
        {error && <p className="form-error">{error}</p>}
        <textarea
          placeholder="Shipping address"
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
        />
        <button className="btn" onClick={checkout} disabled={loading}>
          {loading ? "Processing..." : "Secure checkout"}
        </button>
      </article>
    </div>
  );
};

export default CartCheckout;
