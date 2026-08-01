import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, default: "" },
    image: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, unique: true },
    total: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Processing", "Shipped", "Delivered", "Cancelled", "Refunded"],
      default: "Pending",
    },
    paymentStatus: { type: String, enum: ["Unpaid", "Paid", "Refunded"], default: "Unpaid" },
    paymentMethod: { type: String, required: true },
    shippingAddress: {
      fullName: { type: String, default: "" },
      address: { type: String, required: true, trim: true },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zip: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    deliveryMethod: { type: String, enum: ["standard", "express", "free"], default: "standard" },
    trackingCode: { type: String, required: true, trim: true },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: "" },
    items: { type: [orderItemSchema], default: [] },
    statusHistory: [{
      status: String,
      date: { type: Date, default: Date.now },
      note: { type: String, default: "" },
    }],
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });

export default mongoose.model("Order", orderSchema);
