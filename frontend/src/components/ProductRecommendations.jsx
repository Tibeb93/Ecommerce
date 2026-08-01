import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import api from "../api";
import ProductCard from "./ProductCard";

export default function ProductRecommendations({ productId }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!productId) return;
    api.get(`/products/related/${productId}`)
      .then(({ data }) => setProducts(data))
      .catch(() => {});
  }, [productId]);

  if (!products.length) return null;

  return (
    <section className="container section fade-in-section">
      <div className="section-head">
        <div className="section-head-left">
          <Sparkles size={20} />
          <h2>You May Also Like</h2>
        </div>
      </div>
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
