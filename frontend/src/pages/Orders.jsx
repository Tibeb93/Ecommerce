import { useEffect, useState } from "react";
import api from "../api";

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders/my").then((res) => setOrders(res.data));
  }, []);

  return (
    <div className="container section">
      <h1>Order Tracking</h1>
      <div className="list">
        {orders.map((order) => (
          <article className="glass list-item order-item" key={order.id}>
            <div>
              <h3>Order #{order.id}</h3>
              <p className="muted">Tracking: {order.trackingCode}</p>
              <p className="muted">Placed: {new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p>Status: {order.status}</p>
              <p>Payment: {order.paymentStatus}</p>
              <strong>${order.total.toFixed(2)}</strong>
            </div>
          </article>
        ))}
      </div>
      {orders.length === 0 && <p className="muted">No orders yet. Start shopping to place your first order.</p>}
    </div>
  );
};

export default Orders;
