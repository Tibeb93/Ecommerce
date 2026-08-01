# Database Models

MongoDB collections managed via Mongoose.

---

## User

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | Yes | Trimmed |
| email | String | Yes | Unique, lowercase, trimmed |
| password | String | Yes | bcrypt hashed |
| role | String | Yes | Enum: `customer`, `admin`. Default: `customer` |
| isEmailVerified | Boolean | No | Default: false |
| emailVerificationToken | String | No | Hashed token, null when verified |
| emailVerificationExpires | Date | No | 24h expiry |
| passwordResetToken | String | No | Hashed token |
| passwordResetExpires | Date | No | 1h expiry |
| createdAt | Date | Auto | Timestamps enabled |
| updatedAt | Date | Auto | Timestamps enabled |

**Methods:**
- `createEmailVerificationToken()` — generates hashed token, sets 24h expiry
- `createPasswordResetToken()` — generates hashed token, sets 1h expiry

---

## Category

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | Yes | Unique, trimmed |
| createdAt | Date | Auto | Timestamps enabled |
| updatedAt | Date | Auto | Timestamps enabled |

---

## Product

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | String | Yes | Trimmed |
| description | String | Yes | Trimmed |
| image | String | Yes | URL string |
| price | Number | Yes | Min: 0 |
| stock | Number | Yes | Min: 0, Default: 0 |
| categoryId | ObjectId | Yes | Ref: Category |
| rating | Number | No | Default: 0. Aggregated from reviews |
| reviewsCount | Number | No | Default: 0. Aggregated from reviews |
| createdAt | Date | Auto | Timestamps enabled |
| updatedAt | Date | Auto | Timestamps enabled |

---

## Review

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | ObjectId | Yes | Ref: User |
| productId | ObjectId | Yes | Ref: Product |
| rating | Number | Yes | Min: 1, Max: 5 |
| comment | String | Yes | Trimmed |
| createdAt | Date | Auto | Timestamps enabled |
| updatedAt | Date | Auto | Timestamps enabled |

**Index:** Compound unique index on `(userId, productId)` — one review per user per product.

---

## Wishlist

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | ObjectId | Yes | Ref: User |
| productId | ObjectId | Yes | Ref: Product |
| createdAt | Date | Auto | Timestamps enabled |
| updatedAt | Date | Auto | Timestamps enabled |

**Index:** Compound unique index on `(userId, productId)`.

---

## Order

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | ObjectId | Yes | Ref: User |
| total | Number | Yes | Min: 0 |
| status | String | Yes | Enum: `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`. Default: `Pending` |
| paymentStatus | String | Yes | Enum: `Unpaid`, `Paid`, `Refunded`. Default: `Unpaid` |
| paymentMethod | String | Yes | e.g. `card`, `paypal` |
| shippingAddress | String | Yes | Trimmed |
| trackingCode | String | Yes | Trimmed |
| items | Array | Yes | Array of order items (see below) |
| createdAt | Date | Auto | Timestamps enabled |
| updatedAt | Date | Auto | Timestamps enabled |

### Order Item (subdocument)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productId | ObjectId | Yes | Ref: Product |
| quantity | Number | Yes | Min: 1 |
| unitPrice | Number | Yes | Min: 0 |

---

## Relationships

```
User ──┬── Review (userId)
       ├── Wishlist (userId)
       └── Order (userId)

Category ── Product (categoryId)

Product ──┬── Review (productId)
          ├── Wishlist (productId)
          └── Order.items[].productId
```
