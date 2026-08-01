import ProductCard from "./ProductCard";

const BestSellers = ({ products }) => {
  if (!products.length) return null;
  return (
    <section className="shop-section">
      <div className="shop-head">
        <h2>Best Sellers</h2>
        <p className="muted">Most popular products loved by customers</p>
      </div>
      <div className="grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default BestSellers;
