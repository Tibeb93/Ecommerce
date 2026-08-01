import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const from = process.env.EMAIL_FROM || "NovaShop <noreply@novashop.com>";
const clientUrl = process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173";

const send = async (to, subject, html) => {
  try {
    await transporter.sendMail({ from, to, subject, html });
    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error("Email send failed:", err.message);
    return false;
  }
};

export const sendWelcomeEmail = (user) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:#6c7dff">Welcome to NovaShop!</h1>
      <p>Hi ${user.name},</p>
      <p>Thank you for joining NovaShop. We're excited to have you on board!</p>
      <p>Explore our wide range of products and enjoy fast, reliable shipping.</p>
      <a href="${clientUrl}" style="display:inline-block;padding:12px 24px;background:#6c7dff;color:white;text-decoration:none;border-radius:8px;margin:16px 0">Start Shopping</a>
      <p style="color:#888;font-size:12px;margin-top:32px">If you didn't create this account, please ignore this email.</p>
    </div>`;
  return send(user.email, "Welcome to NovaShop!", html);
};

export const sendOrderConfirmation = (user, order) => {
  const items = order.items.map(i => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${i.title}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${i.unitPrice.toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${(i.unitPrice * i.quantity).toFixed(2)}</td>
    </tr>`).join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:#6c7dff">Order Confirmed!</h1>
      <p>Hi ${user.name},</p>
      <p>Your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#f5f5f5">
          <th style="padding:8px;text-align:left">Item</th>
          <th style="padding:8px;text-align:center">Qty</th>
          <th style="padding:8px;text-align:right">Price</th>
          <th style="padding:8px;text-align:right">Total</th>
        </tr></thead>
        <tbody>${items}</tbody>
      </table>
      <div style="text-align:right;margin:16px 0">
        <p>Subtotal: $${order.subtotal.toFixed(2)}</p>
        <p>Shipping: ${order.shippingCost === 0 ? "Free" : "$" + order.shippingCost.toFixed(2)}</p>
        <p>Tax: $${order.tax.toFixed(2)}</p>
        ${order.discount ? `<p>Discount: -$${order.discount.toFixed(2)}</p>` : ""}
        <p style="font-size:18px;font-weight:bold">Total: $${order.total.toFixed(2)}</p>
      </div>
      <p><strong>Shipping to:</strong><br/>${order.shippingAddress.fullName}<br/>${order.shippingAddress.address}<br/>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}</p>
      <p><strong>Tracking:</strong> ${order.trackingCode}</p>
      <p><strong>Payment:</strong> ${order.paymentMethod}</p>
      <a href="${clientUrl}/orders" style="display:inline-block;padding:12px 24px;background:#6c7dff;color:white;text-decoration:none;border-radius:8px;margin:16px 0">View Order</a>
    </div>`;
  return send(user.email, `Order Confirmation - ${order.orderNumber}`, html);
};

export const sendOrderStatusUpdate = (user, order, oldStatus) => {
  const statusMessages = {
    Processing: "Your order is now being processed and will be prepared for shipping.",
    Shipped: `Your order has been shipped! Tracking code: ${order.trackingCode}`,
    Delivered: "Your order has been delivered. We hope you enjoy your purchase!",
    Cancelled: "Your order has been cancelled. If you have questions, please contact support.",
    Refunded: "Your order has been refunded. The refund will appear in your account within 5-10 business days.",
  };
  const message = statusMessages[order.status];
  if (!message) return Promise.resolve();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:#6c7dff">Order ${order.status}</h1>
      <p>Hi ${user.name},</p>
      <p>Your order <strong>#${order.orderNumber}</strong> status has been updated.</p>
      <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0"><strong>Status:</strong> ${order.status}</p>
        <p style="margin:8px 0 0">${message}</p>
      </div>
      <a href="${clientUrl}/orders" style="display:inline-block;padding:12px 24px;background:#6c7dff;color:white;text-decoration:none;border-radius:8px;margin:16px 0">View Order</a>
    </div>`;
  return send(user.email, `Order ${order.status} - ${order.orderNumber}`, html);
};

export const sendPasswordResetEmail = (user, token) => {
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:#6c7dff">Password Reset</h1>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6c7dff;color:white;text-decoration:none;border-radius:8px;margin:16px 0">Reset Password</a>
      <p style="color:#888;font-size:12px">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
    </div>`;
  return send(user.email, "Password Reset Request", html);
};

export const sendContactForm = (name, email, subject, message) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:#6c7dff">New Contact Form Submission</h1>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0;white-space:pre-wrap">${message}</p>
      </div>
      <p style="color:#888;font-size:12px">Reply to: ${email}</p>
    </div>`;
  return send(process.env.ADMIN_EMAIL || from, `Contact: ${subject}`, html);
};

export const sendLowStockAlert = (adminEmail, product) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:#f59e0b">Low Stock Alert</h1>
      <p>The following product is running low on stock:</p>
      <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0"><strong>${product.title}</strong></p>
        <p style="margin:8px 0 0">Stock remaining: <strong style="color:red">${product.stock}</strong></p>
      </div>
      <a href="${clientUrl}/admin" style="display:inline-block;padding:12px 24px;background:#6c7dff;color:white;text-decoration:none;border-radius:8px;margin:16px 0">View in Admin</a>
    </div>`;
  return send(adminEmail, `Low Stock Alert - ${product.title}`, html);
};

export default { sendWelcomeEmail, sendOrderConfirmation, sendOrderStatusUpdate, sendPasswordResetEmail, sendContactForm, sendLowStockAlert };
