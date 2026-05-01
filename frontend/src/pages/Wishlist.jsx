import { useEffect, useState } from "react";
import api from "../api";
import { useCart } from "../context/CartContext";

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const { addToCart } = useCart();

  const load = async () => {
    const { data } = await api.get("/wishlist");
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (productId) => {
    await api.delete(`/wishlist/${productId}`);
    load();
  };

  return (
    <div className="container section">
      <h1>Wishlist</h1>
      <div className="list">
        {items.map((item) => (
          <article className="glass list-item" key={item.id}>
            <img src={item.image} alt={item.title} />
            <div>
              <h3>{item.title}</h3>
              <p>${item.price.toFixed(2)}</p>
            </div>
            <button className="btn" onClick={() => addToCart(item)}>
              Add to cart
            </button>
            <button className="btn ghost" onClick={() => remove(item.id)}>
              Remove
            </button>
          </article>
        ))}
      </div>
      {items.length === 0 && <p className="muted">Your wishlist is empty.</p>}
    </div>
  );
};

export default Wishlist;
