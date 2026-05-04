import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import api from "../api";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: "", category: "", sort: "newest" });
  const [featured, setFeatured] = useState([]);

  const fetchProducts = async () => {
    const { data } = await api.get("/products", { params: filters });
    setProducts(data);
  };

  const fetchFeatured = async () => {
    const { data } = await api.get("/products", {
      params: { sort: "rating", min: 0, max: 999999 }
    });
    setFeatured(data.slice(0, 4));
  };

  useEffect(() => {
    Promise.all([api.get("/categories"), fetchProducts(), fetchFeatured()]).then(([cat]) => setCategories(cat.data));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters.q, filters.category, filters.sort]);

  const grouped = products.reduce((acc, item) => {
    const key = item.category || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="container section">
      <section className="glass hero-banner">
        <div>
          <p className="pill">Trending Marketplace</p>
          <h1>Shop more categories with better deals</h1>
          <p className="muted">Discover fresh arrivals, popular picks, and best prices across every category.</p>
        </div>
        <div className="hero-stats">
          <div className="glass mini-stat">
            <strong>{products.length}</strong>
            <span>Products</span>
          </div>
          <div className="glass mini-stat">
            <strong>{categories.length}</strong>
            <span>Categories</span>
          </div>
          <div className="glass mini-stat">
            <strong>{featured.length}</strong>
            <span>Featured</span>
          </div>
        </div>
      </section>

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

      {!!featured.length && !filters.q && !filters.category && (
        <section className="shop-section">
          <div className="shop-head">
            <h2>Featured Picks</h2>
            <p className="muted">Handpicked products with great value.</p>
          </div>
          <div className="grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {!filters.category && !filters.q ? (
        <div className="shop-by-category">
          {categories.map((cat) => {
            const items = grouped[cat.name] || [];
            if (!items.length) return null;
            return (
              <section key={cat.id} className="shop-section">
                <div className="shop-head">
                  <h2>{cat.name}</h2>
                  <button className="btn ghost" onClick={() => setFilters((s) => ({ ...s, category: cat.name }))}>
                    View all
                  </button>
                </div>
                <div className="grid">
                  {items.slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="shop-section">
          <div className="shop-head">
            <h2>{filters.category ? `${filters.category} Shop` : "Search Results"}</h2>
            {(filters.category || filters.q) && (
              <button className="btn ghost" onClick={() => setFilters({ q: "", category: "", sort: "newest" })}>
                Clear filters
              </button>
            )}
          </div>
          <div className="grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
      {products.length === 0 && <p className="muted">No products found for current filters.</p>}
    </div>
  );
};

export default Home;
