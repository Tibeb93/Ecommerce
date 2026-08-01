import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api";

const RECENT_KEY = "recentlyViewed";
const MAX_ITEMS = 12;

export function trackRecent(productId) {
  if (!productId) return;
  try {
    let recent = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    recent = recent.filter(id => id !== productId);
    recent.unshift(productId);
    recent = recent.slice(0, MAX_ITEMS);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {}
}

export default function RecentlyViewed() {
  const [products, setProducts] = useState([]);
  const [scrollPos, setScrollPos] = useState(0);

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    if (!ids.length) return;
    api.get(`/products/recently-viewed?ids=${ids.join(",")}`)
      .then(({ data }) => setProducts(data))
      .catch(() => {});
  }, []);

  const scroll = (dir) => {
    const container = document.getElementById("recently-viewed-scroll");
    if (!container) return;
    const amount = dir === "left" ? -300 : 300;
    container.scrollBy({ left: amount, behavior: "smooth" });
    setScrollPos(container.scrollLeft + amount);
  };

  if (!products.length) return null;

  return (
    <section className="container section fade-in-section">
      <div className="section-head">
        <div className="section-head-left">
          <Clock size={20} />
          <h2>Recently Viewed</h2>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button className="pc-action" onClick={() => scroll("left")}><ChevronLeft size={16} /></button>
          <button className="pc-action" onClick={() => scroll("right")}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="recently-viewed-scroll" id="recently-viewed-scroll">
        {products.map((p) => (
          <Link key={p.id} to={`/product/${p.id}`} className="recently-viewed-card glass">
            <img src={p.image} alt={p.title} />
            <p className="recently-viewed-title">{p.title}</p>
            <p className="price-tag" style={{ fontSize: "0.9rem" }}>${p.price.toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
