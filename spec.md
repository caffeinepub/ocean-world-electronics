# Ocean World Electronics

## Current State
Full e-commerce website with admin dashboard, product management, order tracking, cart, feedback, complaints, courier info, and profit tracker. All data stored in localStorage. Admin login via hardcoded credentials. Track Order page lets customers find orders by phone number.

## Requested Changes (Diff)

### Add
- Cancel Order button on Track Order page (only visible when order status is "pending" or "confirmed")
- Estimated Delivery Date field in Admin Order Edit dialog
- Estimated delivery date display on Track Order page per order
- Delivery disclaimer text on About Us page

### Modify
- `storeSettings.ts`: Add `estimatedDeliveryDate` to `LocalOrder` and `updateLocalOrderDetails` already supports partials; add `saveOrderEstimatedDelivery` helper and `getOrderEstimatedDeliveries` map
- `TrackOrderPage.tsx`: Show estimated delivery date badge; show Cancel button only for pending/confirmed; call cancel handler that updates localStorage status
- `AdminDashboardPage.tsx`: Add estimated delivery date input in Order Edit dialog; save to localStorage on save
- `AboutPage.tsx`: Add delivery disclaimer card/callout in "Our Story" section or just before CTA

### Remove
- Nothing

## Implementation Plan
1. Add `ORDER_ESTIMATED_DELIVERY_KEY` storage helpers in `storeSettings.ts`
2. Add cancel order function in `storeSettings.ts`
3. Update `AdminDashboardPage.tsx` Order Edit dialog to include estimated delivery date field
4. Update `TrackOrderPage.tsx` to show estimated delivery date and cancel button
5. Update `AboutPage.tsx` with delivery disclaimer
