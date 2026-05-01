import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import api from "../api";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: "", category: "", sort: "newest" });

  const fetchProducts = async () => {
    const { data } = await api.get("/products", { params: filters });
    setProducts(data);
  };

  useEffect(() => {
    Promise.all([api.get("/categories"), fetchProducts()]).then(([cat]) => setCategories(cat.data));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters.q, filters.category, filters.sort]);

  return (
    <div className="container section">
      <div className="glass filter-bar">
        <input
          placeholder="Search products..."
          value={filters.q}
          onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
        />
        <select value={filters.category} onChange={(e) => setFilters((s) => ({ ...s, category: e.target.value }))}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={filters.sort} onChange={(e) => setFilters((s) => ({ ...s, sort: e.target.value }))}>
          <option value="newest">Newest</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>
      <div className="grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {products.length === 0 && <p className="muted">No products found for current filters.</p>}
    </div>
  );
};

export default Home;
