import type { Order } from "../backend.d";

export interface StoreSettings {
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  businessHours: string;
  paymentUpiId: string;
  paymentUpiPhone: string;
  paymentQrBase64: string;
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
