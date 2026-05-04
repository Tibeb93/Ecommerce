import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending"
    },
    paymentStatus: { type: String, enum: ["Unpaid", "Paid", "Refunded"], default: "Unpaid" },
    paymentMethod: { type: String, required: true },
    shippingAddress: { type: String, required: true, trim: true },
    trackingCode: { type: String, required: true, trim: true },
    items: { type: [orderItemSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
