# Ocean World Electronics

## Current State
Full-stack e-commerce website for Ocean World Electronics (Delhi). Features: admin login (username: bhawna paneru / password: 1995@Bhawna), product management, order management, cart, track order, feedback, complaints, profit tracker, settings (UPI/QR/contact), delivery partner tracking. Products are stored in localStorage. Product image is currently set via a text URL input field. Orders tab shows all orders in a flat list sorted by timestamp.

## Requested Changes (Diff)

### Add
- Product image upload button in the Add/Edit Product dialog: admin can pick a photo from their device (file picker), which gets stored as a base64 data URL in `productForm.imageUrl`. Show a preview thumbnail once selected. Keep the URL text input as a secondary/fallback option (or replace entirely with upload).
- "Completed Orders" section in the Orders tab: a separate collapsible/section below the main orders table that shows only delivered orders, with a green checkmark (CheckCircle2 icon) badge on each row.
- Pending orders sort priority: non-delivered, non-cancelled orders appear at the top of the main orders table. Delivered and cancelled orders sink to the bottom (or move to Completed section only).

### Modify
- AdminDashboardPage.tsx: 
  - In the Product Add/Edit dialog, replace the plain "Image URL" text input with an "Upload Photo" button (file input hidden, triggered by button click). Display a thumbnail preview below the button when an image is loaded. Keep an optional URL fallback input below the upload section labeled "Or paste image URL".
  - In the Orders tab, split rendering into two sections: (1) Active Orders table (pending/confirmed/shipped/out_for_delivery/cancelled) sorted so pending+confirmed first, then shipped/out_for_delivery, then cancelled. (2) Completed Orders section (delivered) below, with a green CheckCircle2 icon on each row and a "Completed" green badge.

### Remove
- Nothing removed.

## Implementation Plan
1. In `AdminDashboardPage.tsx`, add a `productImageFileRef` ref and a `handleProductImageUpload` handler that reads the selected file as base64 and sets `productForm.imageUrl`.
2. Replace the Image URL `<Input>` field in the product dialog with:
   - Hidden `<input type="file" accept="image/*">` tied to the ref
   - "Upload Photo" button that triggers the hidden input
   - Thumbnail preview (`<img>`) shown when `productForm.imageUrl` is set
   - Small "Or paste image URL" text input below as fallback
3. In the Orders tab rendering, split `orders` into:
   - `activeOrders`: filter out `delivered`, sort by status priority (pending > confirmed > shipped > out_for_delivery > cancelled)
   - `completedOrders`: filter for `delivered`
4. Render `activeOrders` in the existing table.
5. Below that, render a "Completed Orders" collapsible section with `completedOrders`, each row having a `<CheckCircle2 className="text-green-500">` icon and a green "Delivered" badge.
