# Local Farmer Marketplace - Microservices Architecture

## 1. Overview & System Architecture

The **Local Farmer Marketplace** backend has been transformed from a single Spring Boot monolith into an independently deployable, domain-driven **Microservices Architecture**.

All external traffic from the React frontend (`http://localhost:5173`) connects to the **API Gateway** on port `8080`, which routes requests seamlessly to individual domain microservices.

```
                      +-----------------------------+
                      | React Frontend (Vite 7.3)   |
                      | http://localhost:5173       |
                      +--------------+--------------+
                                     |
                                     v HTTP / REST
                      +-----------------------------+
                      | API Gateway (:8080)         |
                      +--------------+--------------+
                                     |
    +-----------------+--------------+--------------+-----------------+
    |                 |                             |                 |
    v                 v                             v                 v
+-----------+   +-------------+               +-----------+     +-------------+
| Auth Svc  |   | Product Svc |               | Cart Svc  |     | Order Svc   |
| (:8081)   |   | (:8082)     |               | (:8083)   |     | (:8084)     |
+-----+-----+   +------+------+               +-----+-----+     +------+------+
      |                |                            |                  |
      v                v                            v                  v
 [auth_db]       [product_db]                  [cart_db]          [order_db]
   (MySQL)          (MySQL)                     (MySQL)            (MySQL)
                       ^                            |                  |
                       |                            |                  |
                       +----------------------------+------------------+
                                REST Inter-Service Calls
                                       (Stock / Hydration)
                                           ^
                                           |
                                 +---------+---------+
                                 | Admin Service     |
                                 | (:8085)           |
                                 | (No DB - REST Agg)|
                                 +-------------------+
```

---

## 2. Service Directory & Port Map

| Service | Port | Database | Primary Entities / Tables | Responsibilities |
|---|---|---|---|---|
| **API Gateway** | `8080` | None | Reverse Proxy | Central routing (`/api/auth/**`, `/api/products/**`, `/api/cart/**`, `/api/orders/**`, `/api/admin/**`, `/uploads/**`), CORS handling for `http://localhost:5173`. |
| **Auth Service** | `8081` | `auth_db` | `users` | User registration, authentication, HMAC token generation/validation, profile management, PIN-based password reset, user activation/deactivation. |
| **Product Service** | `8082` | `product_db` | `products` | Product catalog, category listings, search & price filtering, farmer product CRUD, image uploads, authoritative stock management (deduct & restore). |
| **Cart Service** | `8083` | `cart_db` | `carts` | Buyer cart management, stock limit validation via Product Service REST calls, product & farmer metadata hydration for cart view. |
| **Order Service** | `8084` | `order_db` | `orders` | Order creation, atomic stock deduction, buyer & farmer order lifecycle management (`PENDING` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PACKED` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`, `CANCELLED`), order cancellation with automatic stock restoration. |
| **Admin Service** | `8085` | None (REST Aggregator) | Aggregated DTOs | Dashboard analytics, multi-service metrics calculation, platform-wide user moderation, product moderation, full order audit, self-deactivation protection. |

---

## 3. Database Separation & Ownership

1. **Database-Per-Service:**
   - `auth_db`: Exclusively owned by `auth-service`.
   - `product_db`: Exclusively owned by `product-service`.
   - `cart_db`: Exclusively owned by `cart-service`.
   - `order_db`: Exclusively owned by `order-service`.
   - `admin-service`: Operates as a pure stateless REST aggregator and does not possess a private database.
2. **No Cross-Database Foreign Keys:**
   - All relational `@ManyToOne` entities across domain boundaries were replaced with primitive surrogate keys (`farmerId`, `buyerId`, `productId`).
   - Responses hydrate client-required nested structures (e.g. `farmer: { name, village, mobile }` or `product: { name, price, imageUrl }`) dynamically through synchronous REST API calls.

---

## 4. Authoritative Stock Management & Order State Protocol

`product-service` is the sole authoritative owner of stock and product active status.

### State Transitions & Stock Impact

| Initial State | Target State | Triggered By | Stock Action | Technical Behavior |
|---|---|---|---|---|
| *None* | `PENDING` | Buyer creates order | **Deduct Stock** | `order-service` calls `product-service` `/api/products/{id}/deduct-stock?quantity=N`. Fails if insufficient stock. |
| `PENDING` | `ACCEPTED` | Farmer accepts order | *None* | Order status updated to `ACCEPTED`. Stock remains reserved. |
| `ACCEPTED` | `PACKED` | Farmer packs order | *None* | Order status updated to `PACKED`. |
| `PACKED` | `SHIPPED` | Farmer ships order | *None* | Order status updated to `SHIPPED`. |
| `SHIPPED` | `DELIVERED` | Farmer marks delivered | *None* | Order status updated to `DELIVERED`. Final successful state. |
| `PENDING` | `CANCELLED` | Buyer cancels order | **Restore Stock** | `order-service` calls `product-service` `/api/products/{id}/restore-stock?quantity=N`. Stock added back. |
| `PENDING` | `REJECTED` | Farmer rejects order | **Restore Stock** | `order-service` calls `product-service` `/api/products/{id}/restore-stock?quantity=N`. Stock added back. |
| `ACCEPTED`+ | `CANCELLED` | Buyer cancels order | **Rejected (400)** | Cancellation is forbidden once an order is accepted, packed, shipped, or delivered. |

---

## 5. Security & Authentication Architecture

1. **Token Standard:**
   - Tokens use HMAC-SHA256 formatted as `userId:role:expiryTimestamp.signature`.
   - The signing secret is uniform across services (`marketplace_secret_key_2026`).
2. **Stateless Verification:**
   - Every microservice parses and validates the token signature independently using `TokenService` and Spring Security `UserTokenFilter`.
   - Role enforcement (`BUYER`, `FARMER`, `ADMIN`) is strictly validated against the cryptographic signature, preventing frontend token spoofing.
3. **Password & PIN Security:**
   - BCrypt is used for password and reset PIN hashing.
   - Farmer profiles and public product endpoints explicitly sanitize sensitive fields to prevent data leakage.

---

## 6. How to Run the System

### Prerequisites
- Java 17+ (Java 22 runtime)
- Maven 3.8+
- MySQL 8.0+ running with databases: `auth_db`, `product_db`, `cart_db`, `order_db`
- Node.js 18+

### Starting Microservices

In separate terminal windows or as background processes:

```powershell
# 1. Auth Service (Port 8081)
cd services/auth-service
$env:APP_TOKEN_SECRET="marketplace_secret_key_2026"
mvn spring-boot:run

# 2. Product Service (Port 8082)
cd services/product-service
$env:APP_TOKEN_SECRET="marketplace_secret_key_2026"
mvn spring-boot:run

# 3. Cart Service (Port 8083)
cd services/cart-service
$env:APP_TOKEN_SECRET="marketplace_secret_key_2026"
mvn spring-boot:run

# 4. Order Service (Port 8084)
cd services/order-service
$env:APP_TOKEN_SECRET="marketplace_secret_key_2026"
mvn spring-boot:run

# 5. Admin Service (Port 8085)
cd services/admin-service
$env:APP_TOKEN_SECRET="marketplace_secret_key_2026"
mvn spring-boot:run

# 6. API Gateway (Port 8080)
cd services/api-gateway
mvn spring-boot:run
```

### Starting Frontend
```bash
cd frontend
npm run dev
```

Visit the application at `http://localhost:5173`. All backend API calls route to `http://localhost:8080` transparently.
