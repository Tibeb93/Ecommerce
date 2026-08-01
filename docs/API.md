# API Reference

Base URL: `http://localhost:5000/api`

## Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Auth Routes

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass1"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

### POST /api/auth/login

Login an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass1"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

### GET /api/auth/me

Get current authenticated user. **Requires auth.**

**Response (200):**
```json
{
  "id": "64f1a2b3c4d5e6f7g8h9i0j",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "customer"
}
```

### POST /api/auth/verify-email

Verify user email with token.

**Request Body:**
```json
{
  "token": "abc123..."
}
```

**Response (200):**
```json
{ "message": "Email verified successfully" }
```

### POST /api/auth/forgot-password

Request a password reset link.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{ "message": "If that email exists, a reset link has been sent" }
```

### POST /api/auth/reset-password

Reset password with token.

**Request Body:**
```json
{
  "token": "abc123...",
  "password": "NewSecurePass1"
}
```

**Response (200):**
```json
{ "message": "Password reset successful" }
```

---

## Category Routes

### GET /api/categories

Get all categories.

**Response (200):**
```json
[
  { "id": "64f1a2b3c4d5e6f7g8h9i0j", "name": "Electronics" },
  { "id": "64f1a2b3c4d5e6f7g8h9i0k", "name": "Clothing" }
]
```

---

## Product Routes

### GET /api/products

Get all products with optional filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | "" | Search by title (case-insensitive) |
| category | string | "" | Filter by category name |
| sort | string | "newest" | Sort: `newest`, `priceAsc`, `priceDesc`, `rating` |
| min | number | 0 | Minimum price |
| max | number | 999999 | Maximum price |

**Response (200):**
```json
[
  {
    "id": "64f1a2b3c4d5e6f7g8h9i0j",
    "title": "Wireless Headphones",
    "description": "Premium noise-cancelling headphones",
    "image": "https://...",
    "price": 99.99,
    "stock": 50,
    "category": "Electronics",
    "categoryId": "64f1a2b3c4d5e6f7g8h9i0k",
    "rating": 4.5,
    "reviewsCount": 12
  }
]
```

### GET /api/products/:id

Get a single product with reviews.

**Response (200):**
```json
{
  "id": "64f1a2b3c4d5e6f7g8h9i0j",
  "title": "Wireless Headphones",
  "description": "Premium noise-cancelling headphones",
  "image": "https://...",
  "price": 99.99,
  "stock": 50,
  "category": "Electronics",
  "rating": 4.5,
  "reviewsCount": 12,
  "reviews": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0l",
      "rating": 5,
      "comment": "Great sound quality!",
      "userName": "John Doe"
    }
  ]
}
```

### POST /api/products/:id/reviews

Add a review to a product. **Requires auth.**

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great product, highly recommend!"
}
```

**Response (201):**
```json
{ "message": "Review added" }
```

---

## Wishlist Routes

### GET /api/wishlist

Get user's wishlist. **Requires auth.**

### POST /api/wishlist/:productId

Add product to wishlist. **Requires auth.**

### DELETE /api/wishlist/:productId

Remove product from wishlist. **Requires auth.**

---

## Order Routes

### GET /api/orders

Get user's orders. **Requires auth.**

### POST /api/orders

Create a new order. **Requires auth.**

---

## Payment Routes

### POST /api/payment/intent

Create a payment intent (demo). **Requires auth.**

---

## Admin Routes

All admin routes require auth + admin role.

### GET /api/admin/stats

Get dashboard statistics.

### GET /api/admin/users

Get all users.

### GET /api/admin/orders

Get all orders.

### PATCH /api/admin/orders/:id

Update order status.

### POST /api/admin/products

Create a product.

### PUT /api/admin/products/:id

Update a product.

### DELETE /api/admin/products/:id

Delete a product.

---

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate review) |
| 500 | Internal server error |

**Error Response Format:**
```json
{ "message": "Error description" }
```
