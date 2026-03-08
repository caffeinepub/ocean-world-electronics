# Ocean World Electronics

## Current State
The app has a fully built Motoko backend (main.mo) with all required APIs for products, orders, inquiries, and analytics. However, the frontend entirely bypasses the backend -- all products, orders, and analytics are stored in browser localStorage only. This means data is lost when browser is cleared or when the owner uses a different device.

The `useActor.ts` calls `actor._initializeAccessControlWithSecret` which does not exist in the backend, causing Authorization errors. All queries in `useQueries.ts` use localStorage helper functions instead of backend actor calls.

## Requested Changes (Diff)

### Add
- Backend-first data flow: try ICP backend first, fall back to localStorage if backend unavailable

### Modify
- `useActor.ts`: Remove the broken `_initializeAccessControlWithSecret` call. Create a simple anonymous actor for public operations and an authenticated actor for admin operations using the existing `initialize()` call pattern.
- `useQueries.ts`: 
  - Products: Try backend `getAllProducts`, `createProduct`, `updateProduct`, `deleteProduct` -- fall back to localStorage on error
  - Orders: Try backend `placeOrder`, `getAllOrders`, `updateOrderStatus`, `updateOrderCourierInfo` -- fall back to localStorage on error
  - Analytics: Use backend `getTotalRevenue`, `getOrdersCountByStatus`, `getMonthlySalesSummary`, `getTopSellingProducts`, `getRecentOrders`, `getTotalOrdersCount` -- fall back to localStorage-computed values
  - Inquiries: Already has backend + localStorage merge -- keep as is
- `AdminLoginPage.tsx`: After successful login, call `actor.initialize()` to seed backend data

### Remove
- The `_initializeAccessControlWithSecret` call in `useActor.ts`

## Implementation Plan
1. Fix `useActor.ts` -- remove broken method call, create actor properly without any admin token secret
2. Update product queries to try backend first, fall back to localStorage
3. Update order queries to try backend first, fall back to localStorage
4. Update analytics queries to try backend first, fall back to localStorage-computed values
5. Admin login: call initialize() on backend after login to ensure backend is seeded
6. All fallbacks must be silent -- no error toasts for backend unavailability
