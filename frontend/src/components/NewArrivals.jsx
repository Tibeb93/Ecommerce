import ProductCard from "./ProductCard";

const NewArrivals = ({ products }) => {
  if (!products.length) return null;
  return (
    <section className="shop-section">
      <div className="shop-head">
        <h2>New Arrivals</h2>
        <p className="muted">Fresh picks just added to our store</p>
      </div>
      <div className="grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default NewArrivals;
