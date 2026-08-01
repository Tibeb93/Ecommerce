import { useEffect, useState } from "react";
import api from "../api";
import HeroBanner from "../components/HeroBanner";
import CategoryGrid from "../components/CategoryGrid";
import FlashDeals from "../components/FlashDeals";
import { BestSellers, NewArrivals, FeaturedProducts } from "../components/ProductSection";
import PromotionalBanner from "../components/PromotionalBanner";
import Brands from "../components/Brands";
import WhyShopWithUs from "../components/WhyShopWithUs";
import CustomerReviews from "../components/CustomerReviews";
import InstagramGallery from "../components/InstagramGallery";
import Newsletter from "../components/Newsletter";
import ProductCard from "../components/ProductCard";
import HomeSkeleton from "../components/HomeSkeleton";

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [brands, setBrands] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ q: "", category: "", sort: "newest" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [catRes, featRes, bestRes, flashRes, newRes, brandRes, revRes, prodRes] = await Promise.all([
          api.get("/categories"),
          api.get("/products/featured"),
          api.get("/products/best-sellers"),
          api.get("/products/flash-deals"),
          api.get("/products/new"),
          api.get("/products/brands"),
          api.get("/reviews/recent", { params: { limit: 6 } }),
          api.get("/products", { params: { sort: "newest" } }),
        ]);
        setCategories(catRes.data);
        setFeatured(featRes.data.slice(0, 4));
        setBestSellers(bestRes.data.slice(0, 4));
        setFlashDeals(flashRes.data.slice(0, 4));
        setNewArrivals(newRes.data.slice(0, 4));
        setBrands(brandRes.data.slice(0, 8));
        setRecentReviews(revRes.data);
        setProducts(prodRes.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const fetchProducts = async () => {
    const { data } = await api.get("/products", { params: filters });
    setProducts(data);
  };

  useEffect(() => {
    if (filters.q || filters.category) fetchProducts();
  }, [filters.q, filters.category, filters.sort]);

  const isFiltering = filters.q || filters.category;
  const grouped = products.reduce((acc, item) => {
    const key = item.category || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (loading) return <HomeSkeleton />;

  return (
    <div>
      {!isFiltering && (
        <>
          <HeroBanner productCount={products.length} categoryCount={categories.length} />
          <CategoryGrid categories={categories} onSelect={(name) => setFilters((s) => ({ ...s, category: name }))} />
          <FlashDeals products={flashDeals} />
          <FeaturedProducts products={featured} />
          <BestSellers products={bestSellers} />
          <NewArrivals products={newArrivals} />
          <PromotionalBanner />
          <Brands brands={brands} onSelect={(name) => setFilters((s) => ({ ...s, q: name }))} />
          <WhyShopWithUs />

          {categories.map((cat) => {
            const items = grouped[cat.name] || [];
            if (!items.length) return null;
            return (
              <section key={cat.id} className="section fade-in-section">
                <div className="container">
                  <div className="section-head">
                    <h2>{cat.name}</h2>
                    <button className="btn ghost" onClick={() => setFilters((s) => ({ ...s, category: cat.name }))}>
                      View All
                    </button>
                  </div>
                  <div className="grid">
                    {items.slice(0, 4).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}

          <CustomerReviews reviews={recentReviews} />
          <InstagramGallery />
          <Newsletter />
        </>
      )}

      {isFiltering && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2>{filters.category ? `${filters.category} Shop` : "Search Results"}</h2>
              <button className="btn ghost" onClick={() => setFilters({ q: "", category: "", sort: "newest" })}>
                Clear Filters
              </button>
            </div>
            <div className="glass filter-bar">
              <input
                placeholder="Search products..."
                value={filters.q}
                onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
              />
              <select value={filters.category} onChange={(e) => setFilters((s) => ({ ...s, category: e.target.value }))}>
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
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
            {products.length === 0 && <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>No products found.</p>}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
