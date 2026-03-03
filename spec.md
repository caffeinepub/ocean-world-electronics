# Ocean World Electronics

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Public-facing storefront for Ocean World Electronics (Plot No. 4, Motinagar, Delhi)
- Product listing page with product image, name, manufacturer, price, additional details
- Individual product detail page with order form (quantity, description/special requirements)
- Order placement flow for customers (name, phone, address, description, quantity)
- Owner/admin dashboard (protected by password) showing:
  - All orders with status
  - Sales rate / total revenue
  - Monthly sales chart/summary
  - Product management (add/edit/delete products)
- Contact page: company address, phone number, WhatsApp chat link, inquiry form
- Hero section with electronics-themed background imagery
- Navigation: Home, Products, Contact, Admin Login

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
- `Product` type: id, name, manufacturer, price, description, imageUrl, category, stock, additionalDetails
- `Order` type: id, productId, customerName, phone, address, quantity, description, status, timestamp
- Functions:
  - `addProduct`, `updateProduct`, `deleteProduct`, `getProducts`, `getProduct`
  - `placeOrder` (public), `getOrders` (admin), `updateOrderStatus` (admin)
  - `getSalesStats` (total revenue, monthly breakdown, order counts)
  - `adminLogin` (simple password check returning session token)
- Seed sample products (electronics: phones, chargers, cables, socks/accessories)

### Frontend (React + TypeScript)
- Landing page: hero with electronics background, featured products, company tagline
- Products page: grid of product cards with image, name, price, manufacturer, "Order Now" button
- Product detail page: full info + order form
- Admin dashboard (password-protected route):
  - Stats cards: total orders, total revenue, monthly sales
  - Orders table with status management
  - Products management table
- Contact page: address card, phone/WhatsApp links, inquiry form
- Responsive design, clean and modern look
