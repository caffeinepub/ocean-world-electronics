# Ocean World Electronics

## Current State
- Full e-commerce website with product listing, product detail, cart, order placement, order tracking by phone number, contact page, admin dashboard with orders/products/inquiries/settings tabs, and a monthly sales chart.
- Admin login uses Internet Identity (ICP's decentralized auth) -- causes "You are logged in. Checking admin access..." message and "Access Denied" for the owner because it requires an ICP principal to be registered as admin, which isn't set up in the live environment.
- Order status: pending, confirmed, delivered, cancelled.
- Analytics: total orders, revenue, products count, pending orders, monthly bar chart, status breakdown cards.
- Settings: phone, email, address, WhatsApp, business hours (stored in localStorage).
- No payment method info or QR code upload.
- No product search/filter on ProductsPage.
- No user feedback/review after delivery.
- No user complaint/return request system.
- No courier tracking number field on orders.
- No "About Us" page.
- No WhatsApp order button on product pages.
- Admin login is Internet Identity based -- not a simple username/password system.

## Requested Changes (Diff)

### Add
1. **Simple username/password admin login** -- Replace Internet Identity with a hardcoded credential check: username = "bhawna paneru", password = "1995@Bhawna". Store session in localStorage. No ICP identity required. Admin dashboard fully accessible to anyone with correct credentials.
2. **Payment Methods section in Admin Settings** -- Admin can enter UPI ID, UPI phone number, and upload a QR code image (stored as base64 in localStorage). Payment info displayed to customers at checkout/order confirmation page.
3. **Product search & filter on ProductsPage** -- Search bar by product name, category filter dropdown, price sort (low-high, high-low).
4. **Post-delivery feedback/review** -- On TrackOrderPage, if order is "delivered", show a feedback form (1-5 star rating + comment). Store feedback in localStorage. Admin can see feedback in a new "Feedback" tab in the dashboard.
5. **User complaint & return request** -- On TrackOrderPage, if order status is not cancelled, show a "Complaint / Return Request" button that opens a form (reason dropdown + description). Store in localStorage. Admin sees complaints in a new "Complaints" tab.
6. **Courier tracking number field** -- Admin can add a courier tracking number + courier partner name (e.g. Bluedart, Delhivery) to any order via the order edit dialog. On TrackOrderPage, if courier tracking number exists, show a link like "Track with [Courier Name]" that opens the relevant courier tracking page in a new tab.
7. **About Us page** (/about) -- Company story, address (Plot No. 4, Moti Nagar, Delhi), founding info, values. Link in navbar and footer.
8. **WhatsApp quick order button** -- On ProductDetailPage, a "Order on WhatsApp" button that pre-fills a WhatsApp message with product name and price.
9. **Enhanced admin analytics** -- Additional stat cards: confirmed orders count, delivered orders count, cancelled orders count (already have breakdown but make it more prominent). Top-selling products list (by order count). Recent orders list (last 5 orders).
10. **Order history page** (/my-orders) -- Separate page where user enters phone number to see full order history with all statuses, feedback given, complaints filed.

### Modify
- **AdminLoginPage**: Replace Internet Identity login UI with a simple username + password form. On submit, check credentials locally. If correct, set `adminLoggedIn=true` in localStorage and redirect to dashboard. Logout clears localStorage flag.
- **AdminDashboardPage**: Remove `useIsCallerAdmin` / `useInternetIdentity` checks. Instead read `adminLoggedIn` from localStorage. If not set, redirect to `/admin`. Add Feedback tab and Complaints tab.
- **OrderStepper**: Add "Shipped" and "Out for Delivery" steps between Confirmed and Delivered for a 5-step flow.
- **Order edit dialog**: Add courier name + tracking number fields.
- **TrackOrderPage**: Show courier tracking info if available. Show feedback form after delivery. Show complaint/return button.
- **Navbar**: Add "About" link. Add "My Orders" link.
- **storeSettings.ts**: Add `paymentUpiId`, `paymentUpiPhone`, `paymentQrBase64` fields.

### Remove
- All `useInternetIdentity` imports and usage from admin pages (replace with localStorage-based auth).
- `useIsCallerAdmin` check from dashboard gate (replace with localStorage flag).

## Implementation Plan
1. Update `storeSettings.ts` to add payment fields and helpers for feedback/complaints/courier data in localStorage.
2. Rewrite `AdminLoginPage.tsx` with username/password form, credential check, localStorage session.
3. Rewrite `AdminDashboardPage.tsx` to use localStorage auth gate, add Payment settings section, add Feedback + Complaints tabs, add courier tracking fields in order edit dialog, enhance analytics section with top products and recent orders.
4. Update `ProductsPage.tsx` to add search bar, category filter, and price sort.
5. Update `ProductDetailPage.tsx` to add WhatsApp order button.
6. Update `TrackOrderPage.tsx` to show courier tracking link, post-delivery feedback form, complaint/return button.
7. Update `OrderStepper.tsx` to show 5 steps (Placed, Confirmed, Shipped, Out for Delivery, Delivered).
8. Create `AboutPage.tsx`.
9. Create `MyOrdersPage.tsx` (phone-based order history with feedback/complaint actions).
10. Update `App.tsx` to add /about and /my-orders routes.
11. Update `Navbar.tsx` and `Footer.tsx` to include new links.
12. Update `ContactPage.tsx` to show payment QR if set.
