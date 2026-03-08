# Ocean World Electronics

## Current State
- Full e-commerce website with HomePage, ProductsPage, ProductDetailPage, CartPage, ContactPage, AboutPage, TrackOrderPage, MyOrdersPage
- AdminLoginPage at /admin with hardcoded credentials (localStorage-based)
- AdminDashboardPage at /admin/dashboard with tabs: Orders, Products, Analytics, Profit Tracker, Feedback, Complaints, Settings
- Navbar component with links: Home, Products, About, Contact, Track Order, My Orders -- active link styling uses `bg-ocean-light text-ocean-blue` class
- Hero background image in HomePage is a static generated file `/assets/generated/hero-electronics.dim_1400x600.jpg`
- StoreSettings stored in localStorage via `storeSettings.ts` -- has phone, email, address, whatsapp, paymentQrBase64 etc.
- No dark mode support
- No admin ability to change the hero background image

## Requested Changes (Diff)

### Add
- **Dark mode toggle**: A sun/moon icon button in the Navbar (both desktop and mobile) that toggles between light and dark mode. Use localStorage to persist preference. Apply `dark` class to `<html>` element. All existing Tailwind classes should support dark mode variants.
- **Admin hero image upload**: In the Admin Dashboard Settings tab, add an "Upload Hero Background Image" section. Admin can upload a photo from their device (base64 stored in localStorage under key `heroImageBase64`). If set, HomePage hero section uses this uploaded image instead of the static generated file.

### Modify
- **Navbar active link highlight**: The current active link already has `bg-ocean-light text-ocean-blue` styling. Enhance it to be more visually prominent -- add a colored bottom border or stronger color contrast so it is clearly highlighted. Ensure it works in both light and dark mode.
- **Dark mode**: Update `index.css` / `App.tsx` root layout to support dark mode. Add `dark:` variants where needed for background and text on key layout elements (navbar, footer, main bg).

### Remove
- Nothing removed

## Implementation Plan
1. Create a `useDarkMode` hook (or inline in Navbar) that reads/writes `localStorage.theme` and toggles `dark` class on `<html>`.
2. Add dark mode toggle button (Sun/Moon icon) to Navbar desktop actions area and mobile menu area.
3. In `storeSettings.ts`, add `heroImageBase64` field to StoreSettings interface.
4. In `HomePage.tsx`, read heroImageBase64 from localStorage on render; if present use it as the `src` for the hero `<img>` tag (as a data URL), otherwise fall back to the static asset path.
5. In `AdminDashboardPage.tsx` Settings tab, add "Upload Hero Background Image" section with a file input (accept="image/*"), preview of current image, and a remove button. Save base64 to storeSettings.
6. Ensure navbar active link has a more prominent highlight -- add `border-b-2 border-ocean-blue` or similar to the active link class.
7. Add `dark:` Tailwind variants to Navbar, Footer, and root layout bg for dark mode support.
