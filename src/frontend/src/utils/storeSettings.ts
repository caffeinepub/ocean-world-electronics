import type { Order } from "../backend.d";
import { OrderStatus } from "../backend.d";

export interface StoreSettings {
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  businessHours: string;
  paymentUpiId: string;
  paymentUpiPhone: string;
  paymentQrBase64: string;
  heroImageBase64: string;
  logoBase64: string;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  phone: "+91 98765 43210",
  email: "oceanworld.electronics@gmail.com",
  address: "Plot No. 4, Motinagar, New Delhi – 110015, India",
  whatsapp: "919876543210",
  businessHours: "Mon–Sat: 10:00 AM – 8:00 PM\nSunday: 11:00 AM – 6:00 PM",
  paymentUpiId: "",
  paymentUpiPhone: "",
  paymentQrBase64: "",
  heroImageBase64: "",
  logoBase64: "",
};

const STORE_SETTINGS_KEY = "store_settings";
const ORDER_OVERRIDES_KEY = "order_overrides";
const FEEDBACKS_KEY = "order_feedbacks";
const COMPLAINTS_KEY = "order_complaints";
const COURIER_INFOS_KEY = "courier_infos";

export function getStoreSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORE_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_STORE_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<StoreSettings>;
    return { ...DEFAULT_STORE_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_STORE_SETTINGS };
  }
}

export function saveStoreSettings(s: StoreSettings): void {
  localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(s));
}

export type OrderOverride = Partial<
  Pick<
    Order,
    "customerName" | "phone" | "address" | "quantity" | "specialDescription"
  >
>;

export function getOrderOverrides(): Record<string, OrderOverride> {
  try {
    const raw = localStorage.getItem(ORDER_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, OrderOverride>;
  } catch {
    return {};
  }
}

export function saveOrderOverride(orderId: string, data: OrderOverride): void {
  const existing = getOrderOverrides();
  existing[orderId] = { ...existing[orderId], ...data };
  localStorage.setItem(ORDER_OVERRIDES_KEY, JSON.stringify(existing));
}

// ── Feedback ─────────────────────────────────────────────────────
export interface OrderFeedback {
  orderId: string;
  rating: number; // 1-5
  comment: string;
  submittedAt: number;
}

export function getFeedbacks(): Record<string, OrderFeedback> {
  try {
    const raw = localStorage.getItem(FEEDBACKS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, OrderFeedback>;
  } catch {
    return {};
  }
}

export function saveFeedback(feedback: OrderFeedback): void {
  const existing = getFeedbacks();
  existing[feedback.orderId] = feedback;
  localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(existing));
}

// ── Complaints ────────────────────────────────────────────────────
export interface OrderComplaint {
  orderId: string;
  reason: string;
  description: string;
  submittedAt: number;
  status: "open" | "resolved";
}

export function getComplaints(): Record<string, OrderComplaint> {
  try {
    const raw = localStorage.getItem(COMPLAINTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, OrderComplaint>;
  } catch {
    return {};
  }
}

export function saveComplaint(complaint: OrderComplaint): void {
  const existing = getComplaints();
  existing[complaint.orderId] = complaint;
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(existing));
}

// ── Courier Info ─────────────────────────────────────────────────
export interface CourierInfo {
  courierName: string;
  courierTrackingNumber: string;
}

export function getCourierInfos(): Record<string, CourierInfo> {
  try {
    const raw = localStorage.getItem(COURIER_INFOS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CourierInfo>;
  } catch {
    return {};
  }
}

export function saveCourierInfo(orderId: string, info: CourierInfo): void {
  const existing = getCourierInfos();
  existing[orderId] = info;
  localStorage.setItem(COURIER_INFOS_KEY, JSON.stringify(existing));
}

// ── Products (Admin localStorage) ────────────────────────────────
import type { Product } from "../backend.d";

const PRODUCTS_KEY = "ow_products";

export function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return [];
    // Parse and convert price/stockQuantity back to bigint
    const arr = JSON.parse(raw) as Array<Record<string, unknown>>;
    return arr.map((p) => ({
      ...p,
      price: BigInt(p.price as string),
      stockQuantity: BigInt(p.stockQuantity as string),
    })) as Product[];
  } catch {
    return [];
  }
}

export function saveLocalProducts(products: Product[]): void {
  // Serialize bigint as string
  const serializable = products.map((p) => ({
    ...p,
    price: p.price.toString(),
    stockQuantity: p.stockQuantity.toString(),
  }));
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(serializable));
}

export function addLocalProduct(product: Product): void {
  const existing = getLocalProducts();
  existing.push(product);
  saveLocalProducts(existing);
}

export function updateLocalProduct(productId: string, updated: Product): void {
  const existing = getLocalProducts();
  const idx = existing.findIndex((p) => p.id === productId);
  if (idx !== -1) {
    existing[idx] = updated;
  } else {
    existing.push(updated);
  }
  saveLocalProducts(existing);
}

const DELETED_PRODUCTS_KEY = "ow_deleted_products";

export function getDeletedProductIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_PRODUCTS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function markProductDeleted(productId: string): void {
  const ids = getDeletedProductIds();
  ids.add(productId);
  localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify([...ids]));
}

export function deleteLocalProduct(productId: string): void {
  const existing = getLocalProducts().filter((p) => p.id !== productId);
  saveLocalProducts(existing);
  markProductDeleted(productId);
}

// ── Local Orders (fallback when backend unavailable) ──────────────
const LOCAL_ORDERS_KEY = "ow_local_orders";

export interface LocalOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  quantity: string; // stored as string (was bigint)
  productId: string;
  productName: string;
  productPrice: string; // stored as string (was bigint)
  specialDescription: string;
  status: string;
  createdAt: string; // ISO timestamp as string
  courierName: string;
  courierTrackingNumber: string;
}

export function getLocalOrders(): LocalOrder[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalOrder[];
  } catch {
    return [];
  }
}

export function saveLocalOrder(order: LocalOrder): void {
  const existing = getLocalOrders();
  existing.unshift(order); // newest first
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing));
}

export function updateLocalOrderStatus(orderId: string, status: string): void {
  const existing = getLocalOrders();
  const idx = existing.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    existing[idx].status = status;
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing));
  }
}

export function updateLocalOrderCourier(
  orderId: string,
  courierName: string,
  courierTrackingNumber: string,
): void {
  const existing = getLocalOrders();
  const idx = existing.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    existing[idx].courierName = courierName;
    existing[idx].courierTrackingNumber = courierTrackingNumber;
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing));
  }
}

export function updateLocalOrderDetails(
  orderId: string,
  details: Partial<LocalOrder>,
): void {
  const existing = getLocalOrders();
  const idx = existing.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    existing[idx] = { ...existing[idx], ...details };
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing));
  }
}

// Convert LocalOrder to Order (backend type shape) for UI compatibility
export function localOrderToOrder(o: LocalOrder): Order {
  // Map the string status key to the OrderStatus enum value
  const statusMap: Record<string, OrderStatus> = {
    Pending: OrderStatus.pending,
    pending: OrderStatus.pending,
    Confirmed: OrderStatus.confirmed,
    confirmed: OrderStatus.confirmed,
    Shipped: OrderStatus.shipped,
    shipped: OrderStatus.shipped,
    Out_for_delivery: OrderStatus.out_for_delivery,
    out_for_delivery: OrderStatus.out_for_delivery,
    Delivered: OrderStatus.delivered,
    delivered: OrderStatus.delivered,
    Cancelled: OrderStatus.cancelled,
    cancelled: OrderStatus.cancelled,
  };
  const resolvedStatus = statusMap[o.status] ?? OrderStatus.pending;

  return {
    id: o.id,
    customerName: o.customerName,
    phone: o.phone,
    address: o.address,
    quantity: BigInt(o.quantity),
    productId: o.productId,
    specialDescription: o.specialDescription,
    status: resolvedStatus,
    timestamp: BigInt(o.createdAt),
    courierName: o.courierName || undefined,
    courierTrackingNumber: o.courierTrackingNumber || undefined,
  };
}

// ── Estimated Delivery Dates ─────────────────────────────────────
const ESTIMATED_DELIVERY_KEY = "ow_estimated_deliveries";

export function getEstimatedDeliveries(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ESTIMATED_DELIVERY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveEstimatedDelivery(orderId: string, date: string): void {
  const existing = getEstimatedDeliveries();
  existing[orderId] = date;
  localStorage.setItem(ESTIMATED_DELIVERY_KEY, JSON.stringify(existing));
}

// ── Cancel Order (by customer on Track Order page) ────────────────
export function cancelLocalOrder(orderId: string): void {
  updateLocalOrderStatus(orderId, "cancelled");
}

// ── Admin Credentials ─────────────────────────────────────────────
const ADMIN_CREDENTIALS_KEY = "ow_admin_credentials";

export interface AdminCredentials {
  username: string;
  password: string;
}

export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  username: "bhawna paneru",
  password: "1995@Bhawna",
};

export function getAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (!raw) return { ...DEFAULT_ADMIN_CREDENTIALS };
    const parsed = JSON.parse(raw) as Partial<AdminCredentials>;
    return {
      username: parsed.username || DEFAULT_ADMIN_CREDENTIALS.username,
      password: parsed.password || DEFAULT_ADMIN_CREDENTIALS.password,
    };
  } catch {
    return { ...DEFAULT_ADMIN_CREDENTIALS };
  }
}

export function saveAdminCredentials(creds: AdminCredentials): void {
  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(creds));
}

// ── Local Inquiries ────────────────────────────────────────────────
const LOCAL_INQUIRIES_KEY = "ow_local_inquiries";

export interface LocalInquiry {
  id: string;
  name: string;
  phone: string;
  message: string;
  timestamp: string; // milliseconds as string
}

export function getLocalInquiries(): LocalInquiry[] {
  try {
    const raw = localStorage.getItem(LOCAL_INQUIRIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalInquiry[];
  } catch {
    return [];
  }
}

export function saveLocalInquiry(inquiry: LocalInquiry): void {
  const existing = getLocalInquiries();
  existing.unshift(inquiry); // newest first
  localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(existing));
}

export function localInquiryToInquiry(
  o: LocalInquiry,
): import("../backend.d").Inquiry {
  return {
    name: o.name,
    phone: o.phone,
    message: o.message,
    timestamp: BigInt(o.timestamp),
  };
}

// ── Profit Tracker ────────────────────────────────────────────────
export interface ProductProfitEntry {
  productId: string;
  productName: string;
  costPrice: number;
  sellPrice: number;
  labourCharges: number;
}

const PROFIT_DATA_KEY = "ow_profit_data";

export function getProfitData(): Record<string, ProductProfitEntry> {
  try {
    const raw = localStorage.getItem(PROFIT_DATA_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ProductProfitEntry>;
  } catch {
    return {};
  }
}

export function saveProfitEntry(entry: ProductProfitEntry): void {
  const existing = getProfitData();
  existing[entry.productId] = entry;
  localStorage.setItem(PROFIT_DATA_KEY, JSON.stringify(existing));
}
