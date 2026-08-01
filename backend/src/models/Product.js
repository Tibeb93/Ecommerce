import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    options: [
      {
        label: { type: String, required: true, trim: true },
        sku: { type: String, default: "", trim: true },
        price: { type: Number, default: 0, min: 0 },
        stock: { type: Number, default: 0, min: 0 },
        image: { type: String, default: "", trim: true },
      },
    ],
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    images: [{ type: String, trim: true }],
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    salePrice: { type: Number, default: 0, min: 0 },
    saleEnds: { type: Date, default: null },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockAlert: { type: Number, default: 5, min: 0 },
    sku: { type: String, default: "", trim: true, sparse: true },
    barcode: { type: String, default: "", trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, default: "", trim: true },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["draft", "published", "out_of_stock", "archived", "coming_soon", "discontinued"],
      default: "published",
    },
    slug: { type: String, default: "", trim: true, sparse: true },
    seoTitle: { type: String, default: "", trim: true },
    seoDescription: { type: String, default: "", trim: true },
    seoKeywords: { type: String, default: "", trim: true },
    weight: { type: Number, default: 0, min: 0 },
    dimensions: {
      length: { type: Number, default: 0, min: 0 },
      width: { type: Number, default: 0, min: 0 },
      height: { type: Number, default: 0, min: 0 },
    },
    variants: [variantSchema],
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", brand: "text", tags: "text" });

export default mongoose.model("Product", productSchema);
