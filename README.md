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
- Backend: Node.js + Express + MongoDB Atlas (`mongoose`)
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
copy backend\.env.example backend\.env
```

Then edit `backend/.env` as needed:

- `JWT_SECRET` — optional in development (a dev default is used if empty); **required in production**.
- `MONGO_URI` / `USE_MEMORY_DB` — `.env.example` defaults to `USE_MEMORY_DB=true` so the API runs without installing MongoDB (first launch downloads a local MongoDB binary once, ~600MB). For Docker or Atlas instead, set a real `MONGO_URI` and `USE_MEMORY_DB=false`. In development, an empty `MONGO_URI` or a template string with `<...>` placeholders also selects in-memory MongoDB.

**Optional: local MongoDB with Docker**

```bash
docker compose up -d
```

Then set `MONGO_URI=mongodb://127.0.0.1:27017/ecommerce` in `backend/.env`.

3. Run both frontend and backend:

```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5000](http://localhost:5000)

## MongoDB Atlas Setup

1. Create an Atlas cluster.
2. Create a database user and password.
3. In **Network Access**, allow your deployment IP (or `0.0.0.0/0` for initial setup).
4. Copy connection string and place it in `backend/.env` as `MONGO_URI`.

## Production Deployment (Ready)

### Backend (Render/Railway/Fly.io)

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `NODE_ENV=production`
  - `PORT=5000` (or platform default)
  - `JWT_SECRET=<strong-secret>`
  - `MONGO_URI=<atlas-or-hosted-mongodb-uri>`
  - `USE_MEMORY_DB=false` (in-memory MongoDB is disabled in production)
  - `CLIENT_URL=https://your-frontend-domain.com`

### Frontend (Vercel/Netlify)

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_URL=https://your-backend-domain.com/api`

### Important production notes

- `CLIENT_URL` supports comma-separated domains for CORS if needed.
- Seed data (categories/products/admin) auto-creates on first startup.
- Change default admin password immediately after first login.

## Demo Admin Credentials

- Email: `admin@shop.com`
- Password: `Admin@123`

## Notes

- Payment endpoint is scaffolded as a secure server-side "intent" step for demo purposes.
- Replace `/api/payment/intent` with Stripe/PayPal SDK calls for production use.
