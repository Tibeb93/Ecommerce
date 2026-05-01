# Modern E-Commerce Web Application

Full-stack e-commerce platform with:

- Dark/Light theme toggle (glassmorphism UI)
- Product listing, search, category filtering
- Product details, ratings, and reviews
- Cart and secure checkout flow (demo payment intent)
- Authentication/authorization (customer + admin)
- Wishlist functionality
- Order tracking system
- Admin dashboard (products, users, orders, insights)

## Tech Stack

- Frontend: React + Vite + React Router + Framer Motion
- Backend: Node.js + Express + SQLite (`better-sqlite3`)
- Auth: JWT

## Folder Structure

```text
E-commerce/
  backend/
    src/
      middleware/
      routes/
      db.js
      server.js
  frontend/
    src/
      components/
      context/
      pages/
      api.js
      App.jsx
      main.jsx
      styles.css
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure backend env:

```bash
copy backend/.env.example backend/.env
```

Then edit `backend/.env` and set a strong `JWT_SECRET`.

3. Run both frontend and backend:

```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5000](http://localhost:5000)

## Demo Admin Credentials

- Email: `admin@shop.com`
- Password: `Admin@123`

## Notes

- Payment endpoint is scaffolded as a secure server-side "intent" step for demo purposes.
- Replace `/api/payment/intent` with Stripe/PayPal SDK calls for production use.
