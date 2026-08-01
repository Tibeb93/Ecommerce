import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, BookmarkPlus, Undo2, Minus, Plus, ShoppingBag, CreditCard, Truck, Shield, Check, ChevronRight, MapPin, Package, Banknote, ArrowLeft, Tag, X } from "lucide-react";
import api from "../api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errors";

const STEPS = ["Cart", "Shipping", "Delivery", "Payment", "Confirm"];

const DELIVERY_OPTIONS = [
  { id: "standard", name: "Standard Shipping", days: "5-7 days", price: 9.99, icon: Package },
  { id: "express", name: "Express Shipping", days: "2-3 days", price: 19.99, icon: Truck },
  { id: "free", name: "Free Shipping", days: "7-10 days", price: 0, icon: Truck },
];

const CartCheckout = () => {
  const {
    cart, saved, total, itemCount, lastRemoved,
    removeFromCart, updateQty, clearCart,
    saveForLater, moveToCart, undoRemove,
  } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState({ fullName: "", address: "", city: "", state: "", zip: "", phone: "" });
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      api.get("/profile/addresses").then(({ data }) => setSavedAddresses(data)).catch(() => {});
    }
  }, [user]);

  const selectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setShipping({ fullName: addr.fullName, address: addr.address, city: addr.city, state: addr.state, zip: addr.zip, phone: addr.phone });
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      const { data } = await api.get(`/coupons/validate/${couponCode.trim()}`);
      if (total < data.minPurchase) {
        setCouponError(`Minimum purchase of $${data.minPurchase} required`);
        return;
      }
      setAppliedCoupon(data);
      toast.success(`Coupon "${data.code}" applied!`);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(getErrorMessage(err, "Invalid coupon"));
    }
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(""); toast.info("Coupon removed"); };

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === "fixed"
      ? Math.min(appliedCoupon.value, total)
      : Math.min((total * appliedCoupon.value) / 100, appliedCoupon.maxDiscount || Infinity)
    : 0;

  const shippingCost = deliveryMethod === "free" || total >= 100 ? 0 : DELIVERY_OPTIONS.find(d => d.id === deliveryMethod)?.price || 0;
  const tax = total * 0.08;
  const grandTotal = Math.max(0, total + shippingCost + tax - discountAmount);

  const handleRemove = (id, title) => {
    removeFromCart(id);
    toast.warning(`Removed "${title}"`, 5000);
  };

  const handleQtyChange = (id, newQty, stock) => {
    if (newQty > (stock || 99)) { toast.warning(`Only ${stock} available`); return; }
    updateQty(id, newQty);
  };

  const handleUndo = () => { if (undoRemove()) toast.success("Item restored"); };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!shipping.fullName.trim() || !shipping.address.trim() || !shipping.city.trim()) {
        setError("Please fill in all required fields"); return;
      }
      if (shipping.address.trim().length < 5) { setError("Address must be at least 5 characters"); return; }
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => { setError(""); setStep(s => Math.max(0, s - 1)); };

  const checkout = async () => {
    setError("");
    if (!user) return navigate("/login");
    if (!cart.length) { setError("Your cart is empty."); return; }
    try {
      setLoading(true);
      await api.post("/payment/intent", { amount: grandTotal });
      await api.post("/orders", {
        shippingAddress: shipping,
        addressId: selectedAddressId,
        paymentMethod,
        deliveryMethod,
        couponCode: appliedCoupon?.code || "",
        discount: discountAmount,
        items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
      });
      clearCart();
      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (err) {
      setError(getErrorMessage(err, "Checkout failed."));
    } finally {
      setLoading(false);
    }
  };

  if (!cart.length && !saved.length) {
    return (
      <div className="container section" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <ShoppingBag size={64} style={{ color: "var(--muted)", marginBottom: "1rem" }} />
        <h1 style={{ marginBottom: "0.5rem" }}>Your Cart is Empty</h1>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>Browse our products and find something you love!</p>
        <Link to="/" className="btn btn-primary-lg">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="cart-header">
        <h1>Checkout</h1>
      </div>

      <div className="checkout-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`checkout-step ${i === step ? "active" : i < step ? "completed" : ""}`}>
            <div className="step-circle">{i < step ? <Check size={14} /> : i + 1}</div>
            <span className="step-label">{s}</span>
            {i < STEPS.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

          {step === 0 && (
            <div className="checkout-step-content">
              <AnimatePresence>
                {lastRemoved && (
                  <motion.div className="undo-banner glass" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <span>Item removed</span>
                    <button className="btn ghost" onClick={handleUndo}><Undo2 size={14} /> Undo</button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="cart-layout">
                <div className="cart-items">
                  {cart.map((item) => {
                    const maxQty = item.stock || 99;
                    return (
                      <motion.article key={item.id} className="glass cart-item" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Link to={`/product/${item.id}`} className="cart-item-img"><img src={item.image} alt={item.title} /></Link>
                        <div className="cart-item-info">
                          <Link to={`/product/${item.id}`} className="cart-item-title">{item.title}</Link>
                          <p className="price-tag">${(item.price * item.quantity).toFixed(2)}</p>
                          {item.quantity > 1 && <span className="muted" style={{ fontSize: "12px" }}>${item.price.toFixed(2)} each</span>}
                          <div className="cart-item-qty">
                            <div className="quantity-selector">
                              <button onClick={() => handleQtyChange(item.id, item.quantity - 1, maxQty)} disabled={item.quantity <= 1}><Minus size={14} /></button>
                              <span>{item.quantity}</span>
                              <button onClick={() => handleQtyChange(item.id, item.quantity + 1, maxQty)} disabled={item.quantity >= maxQty}><Plus size={14} /></button>
                            </div>
                          </div>
                        </div>
                        <div className="cart-item-actions">
                          <button className="btn ghost" onClick={() => { saveForLater(item.id); toast.info("Saved for later"); }} title="Save for later"><BookmarkPlus size={14} /></button>
                          <button className="btn ghost" onClick={() => handleRemove(item.id, item.title)} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
                <div className="cart-summary glass">
                  <h3>Order Summary</h3>

                  <div className="coupon-input-wrap" style={{ display: "flex", gap: "0.4rem", marginBottom: "0.8rem" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <Tag size={14} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                      <input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon}
                        style={{ paddingLeft: "2rem", width: "100%", fontSize: "13px" }}
                      />
                    </div>
                    {appliedCoupon ? (
                      <button className="btn ghost" onClick={removeCoupon} style={{ color: "var(--red)" }}><X size={14} /></button>
                    ) : (
                      <button className="btn" onClick={applyCoupon} style={{ fontSize: "13px" }}>Apply</button>
                    )}
                  </div>
                  {couponError && <p className="form-error" style={{ fontSize: "12px", marginBottom: "0.5rem" }}>{couponError}</p>}
                  {appliedCoupon && <p style={{ fontSize: "12px", color: "var(--green)", margin: "0 0 0.5rem" }}>Coupon {appliedCoupon.code} applied! -{appliedCoupon.type === "fixed" ? `$${appliedCoupon.value}` : `${appliedCoupon.value}%`}</p>}

                  <div className="summary-rows">
                    <div className="summary-row"><span>Subtotal ({itemCount} items)</span><span>${total.toFixed(2)}</span></div>
                    <div className="summary-row"><span>Shipping</span><span>{shippingCost === 0 ? <span style={{ color: "var(--green)" }}>Free</span> : `$${shippingCost.toFixed(2)}`}</span></div>
                    <div className="summary-row"><span>Tax (est.)</span><span>${tax.toFixed(2)}</span></div>
                    {discountAmount > 0 && <div className="summary-row"><span>Discount</span><span style={{ color: "var(--green)" }}>-${discountAmount.toFixed(2)}</span></div>}
                    <div className="summary-row summary-total"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
                  </div>
                  <button className="btn btn-primary-lg" style={{ width: "100%", justifyContent: "center" }} onClick={nextStep}>
                    Continue to Shipping <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              {saved.length > 0 && (
                <section className="saved-section">
                  <details>
                    <summary className="saved-toggle"><BookmarkPlus size={18} /> Saved for Later ({saved.length})</summary>
                    <div className="saved-items">
                      {saved.map((item) => (
                        <div key={item.id} className="glass saved-item">
                          <img src={item.image} alt={item.title} className="saved-item-img" />
                          <div className="saved-item-info">
                            <Link to={`/product/${item.id}`}>{item.title}</Link>
                            <span className="price-tag">${item.price.toFixed(2)}</span>
                          </div>
                          <div className="saved-item-actions">
                            <button className="btn" onClick={() => { moveToCart(item.id); toast.success("Moved to cart"); }}>Move to Cart</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </section>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="checkout-step-content glass" style={{ padding: "1.5rem", maxWidth: 700, margin: "0 auto" }}>
              <h2 style={{ marginBottom: "1rem" }}><MapPin size={20} style={{ verticalAlign: "middle" }} /> Shipping Address</h2>
              {error && <p className="form-error" style={{ marginBottom: "1rem" }}>{error}</p>}

              {savedAddresses.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "0.5rem" }}>Select a saved address:</p>
                  <div className="address-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                    {savedAddresses.map((addr) => (
                      <div key={addr.id} className={`glass address-card ${selectedAddressId === addr.id ? "address-default" : ""}`}
                        onClick={() => selectAddress(addr)} style={{ cursor: "pointer", padding: "0.8rem" }}>
                        <strong style={{ fontSize: "13px" }}>{addr.label}</strong>
                        <p style={{ fontSize: "12px", margin: "0.2rem 0", color: "var(--muted)" }}>{addr.fullName}</p>
                        <p style={{ fontSize: "12px", margin: 0, color: "var(--muted)" }}>{addr.address}, {addr.city}</p>
                        {addr.isDefault && <span style={{ fontSize: "10px", color: "var(--primary)" }}>Default</span>}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0.5rem 0" }}>Or enter a new address:</p>
                </div>
              )}

              <div className="checkout-form-grid">
                <label>Full Name *
                  <input value={shipping.fullName} onChange={e => setShipping(s => ({ ...s, fullName: e.target.value }))} placeholder="John Doe" required />
                </label>
                <label>Phone
                  <input value={shipping.phone} onChange={e => setShipping(s => ({ ...s, phone: e.target.value }))} placeholder="+1 234 567 890" />
                </label>
                <label className="full-width">Street Address *
                  <input value={shipping.address} onChange={e => setShipping(s => ({ ...s, address: e.target.value }))} placeholder="123 Main St, Apt 4" required />
                </label>
                <label>City *
                  <input value={shipping.city} onChange={e => setShipping(s => ({ ...s, city: e.target.value }))} placeholder="New York" required />
                </label>
                <label>State
                  <input value={shipping.state} onChange={e => setShipping(s => ({ ...s, state: e.target.value }))} placeholder="NY" />
                </label>
                <label>ZIP Code
                  <input value={shipping.zip} onChange={e => setShipping(s => ({ ...s, zip: e.target.value }))} placeholder="10001" />
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button className="btn ghost" onClick={prevStep}><ArrowLeft size={14} /> Back</button>
                <button className="btn" onClick={nextStep}>Continue <ChevronRight size={14} /></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="checkout-step-content glass" style={{ padding: "1.5rem", maxWidth: 600, margin: "0 auto" }}>
              <h2 style={{ marginBottom: "1rem" }}><Truck size={20} style={{ verticalAlign: "middle" }} /> Delivery Method</h2>
              <div className="delivery-options">
                {DELIVERY_OPTIONS.map((opt) => (
                  <label key={opt.id} className={`delivery-option glass ${deliveryMethod === opt.id ? "selected" : ""}`}>
                    <input type="radio" name="delivery" value={opt.id} checked={deliveryMethod === opt.id} onChange={() => setDeliveryMethod(opt.id)} />
                    <opt.icon size={20} />
                    <div>
                      <strong>{opt.name}</strong>
                      <span className="muted">{opt.days}</span>
                    </div>
                    <span className="price-tag">{opt.price === 0 ? "Free" : `$${opt.price.toFixed(2)}`}</span>
                  </label>
                ))}
              </div>
              {total < 100 && deliveryMethod !== "free" && (
                <p className="muted" style={{ textAlign: "center", marginTop: "0.5rem" }}>Add ${(100 - total).toFixed(2)} more for free shipping!</p>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button className="btn ghost" onClick={prevStep}><ArrowLeft size={14} /> Back</button>
                <button className="btn" onClick={nextStep}>Continue <ChevronRight size={14} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="checkout-step-content glass" style={{ padding: "1.5rem", maxWidth: 600, margin: "0 auto" }}>
              <h2 style={{ marginBottom: "1rem" }}><CreditCard size={20} style={{ verticalAlign: "middle" }} /> Payment Method</h2>
              <div className="payment-options">
                {["Card", "PayPal", "CashOnDelivery"].map((method) => (
                  <label key={method} className={`payment-option glass ${paymentMethod === method ? "selected" : ""}`}>
                    <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                    <div>
                      <strong>{method === "CashOnDelivery" ? "Cash on Delivery" : method}</strong>
                      <span className="muted">{method === "Card" ? "Credit/Debit Card" : method === "PayPal" ? "Pay with PayPal" : "Pay when delivered"}</span>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button className="btn ghost" onClick={prevStep}><ArrowLeft size={14} /> Back</button>
                <button className="btn" onClick={nextStep}>Review Order <ChevronRight size={14} /></button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="checkout-step-content glass" style={{ padding: "1.5rem", maxWidth: 700, margin: "0 auto" }}>
              <h2 style={{ marginBottom: "1rem" }}><Check size={20} style={{ verticalAlign: "middle" }} /> Review & Confirm</h2>
              {error && <p className="form-error" style={{ marginBottom: "1rem" }}>{error}</p>}

              <div className="confirm-section">
                <h4>Shipping Address</h4>
                <p>{shipping.fullName}<br />{shipping.address}<br />{shipping.city}{shipping.state ? `, ${shipping.state}` : ""} {shipping.zip}</p>
                {shipping.phone && <p className="muted">Phone: {shipping.phone}</p>}
              </div>

              <div className="confirm-section">
                <h4>Delivery</h4>
                <p>{DELIVERY_OPTIONS.find(d => d.id === deliveryMethod)?.name} ({DELIVERY_OPTIONS.find(d => d.id === deliveryMethod)?.days})</p>
              </div>

              <div className="confirm-section">
                <h4>Payment</h4>
                <p>{paymentMethod === "CashOnDelivery" ? "Cash on Delivery" : paymentMethod}</p>
              </div>

              <div className="confirm-section">
                <h4>Items ({cart.length})</h4>
                {cart.map((item) => (
                  <div key={item.id} className="confirm-item">
                    <img src={item.image} alt={item.title} />
                    <div><span>{item.title}</span><span className="muted"> x{item.quantity}</span></div>
                    <span className="price-tag">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="summary-rows" style={{ marginTop: "1rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: 12 }}>
                <div className="summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                <div className="summary-row"><span>Shipping</span><span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span></div>
                <div className="summary-row"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                {discountAmount > 0 && <div className="summary-row"><span>Discount ({appliedCoupon?.code})</span><span style={{ color: "var(--green)" }}>-${discountAmount.toFixed(2)}</span></div>}
                <div className="summary-row summary-total"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <button className="btn ghost" onClick={prevStep}><ArrowLeft size={14} /> Back</button>
                <button className="btn btn-primary-lg" onClick={checkout} disabled={loading}>
                  <Shield size={16} /> {loading ? "Processing..." : `Pay $${grandTotal.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CartCheckout;
