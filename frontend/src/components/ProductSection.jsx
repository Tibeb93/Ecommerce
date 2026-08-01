import ProductCard from "./ProductCard";

const ProductSection = ({ title, subtitle, products, id }) => {
  if (!products.length) return null;
  return (
    <section className="section fade-in-section" id={id}>
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export const BestSellers = ({ products }) => (
  <ProductSection title="Best Sellers" subtitle="Most popular products loved by customers" products={products} id="best-sellers" />
);

export const NewArrivals = ({ products }) => (
  <ProductSection title="New Arrivals" subtitle="Fresh picks just added to our store" products={products} id="new-arrivals" />
);

export const FeaturedProducts = ({ products }) => (
  <ProductSection title="Featured Picks" subtitle="Handpicked products with great value" products={products} id="featured" />
);

export default ProductSection;
