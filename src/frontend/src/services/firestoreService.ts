// ============================================================
// ADMIN PAGE FIREBASE CONNECTION HERE
// This file handles all Firestore read/write operations.
// Collections used:
//   - "orders"   -> customer orders
//   - "products" -> store products
// ============================================================

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Inquiry, Order, Product } from "../backend.d";
import { OrderStatus } from "../backend.d";
import { db } from "../firebase";

// ── Helper: Convert Firestore doc to Product (uses bigint for UI compat) ──
function docToProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: (data.name as string) || "",
    description: (data.description as string) || "",
    additionalDetails: (data.additionalDetails as string) || "",
    manufacturer: (data.manufacturer as string) || "",
    imageUrl: (data.imageUrl as string) || "",
    category: (data.category as string) || "",
    isAvailable: (data.isAvailable as boolean) ?? true,
    price: BigInt(Math.round((data.price as number) || 0)),
    stockQuantity: BigInt(Math.round((data.stockQuantity as number) || 0)),
  };
}

// ── Helper: Convert Product to plain object for Firestore ──
function productToDoc(product: Product): Record<string, unknown> {
  return {
    name: product.name,
    description: product.description,
    additionalDetails: product.additionalDetails || "",
    manufacturer: product.manufacturer || "",
    imageUrl: product.imageUrl || "",
    category: product.category || "",
    isAvailable: product.isAvailable ?? true,
    price: Number(product.price),
    stockQuantity: Number(product.stockQuantity),
    updatedAt: serverTimestamp(),
  };
}

// ── Helper: Convert Firestore doc to Order (uses bigint for UI compat) ──
function docToOrder(id: string, data: Record<string, unknown>): Order {
  let timestamp: bigint;
  if (data.createdAt instanceof Timestamp) {
    timestamp = BigInt(data.createdAt.toMillis());
  } else {
    timestamp = BigInt((data.timestamp as number) || Date.now());
  }

  const statusMap: Record<string, OrderStatus> = {
    pending: OrderStatus.pending,
    Pending: OrderStatus.pending,
    confirmed: OrderStatus.confirmed,
    Confirmed: OrderStatus.confirmed,
    shipped: OrderStatus.shipped,
    Shipped: OrderStatus.shipped,
    out_for_delivery: OrderStatus.out_for_delivery,
    Out_for_delivery: OrderStatus.out_for_delivery,
    delivered: OrderStatus.delivered,
    Delivered: OrderStatus.delivered,
    cancelled: OrderStatus.cancelled,
    Cancelled: OrderStatus.cancelled,
  };

  return {
    id,
    customerName: (data.customerName as string) || "",
    phone: (data.phone as string) || "",
    address: (data.address as string) || "",
    quantity: BigInt(Math.round((data.quantity as number) || 1)),
    productId: (data.productId as string) || "",
    specialDescription: (data.specialDescription as string) || "",
    status: statusMap[data.status as string] || OrderStatus.pending,
    timestamp,
    courierName: (data.courierName as string) || undefined,
    courierTrackingNumber: (data.courierTrackingNumber as string) || undefined,
  };
}

// ============================================================
// PRODUCTS - Firestore CRUD
// ============================================================

export async function fsGetAllProducts(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, "products"));
    return snap.docs.map((d) =>
      docToProduct(d.id, d.data() as Record<string, unknown>),
    );
  } catch (err) {
    console.error("Firestore: Error fetching products", err);
    return [];
  }
}

export async function fsGetProduct(productId: string): Promise<Product | null> {
  try {
    const snap = await getDoc(doc(db, "products", productId));
    if (!snap.exists()) return null;
    return docToProduct(snap.id, snap.data() as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function fsCreateProduct(product: Product): Promise<void> {
  try {
    const data = productToDoc(product);
    // Use product.id as Firestore document ID for stable references
    await setDoc(doc(db, "products", product.id), {
      ...data,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Firestore: Error creating product", err);
    throw err;
  }
}

export async function fsUpdateProduct(
  productId: string,
  product: Product,
): Promise<void> {
  try {
    await setDoc(doc(db, "products", productId), productToDoc(product), {
      merge: true,
    });
  } catch (err) {
    console.error("Firestore: Error updating product", err);
    throw err;
  }
}

export async function fsDeleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "products", productId));
  } catch (err) {
    console.error("Firestore: Error deleting product", err);
    throw err;
  }
}

// ============================================================
// ORDERS - Firestore CRUD
// ============================================================
// Orders are saved to the "orders" collection in Firestore.
// Each order stores: productName, price, customerName, timestamp
// as required.

export async function fsGetAllOrders(): Promise<Order[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
    );
    return snap.docs.map((d) =>
      docToOrder(d.id, d.data() as Record<string, unknown>),
    );
  } catch (err) {
    console.error("Firestore: Error fetching orders", err);
    return [];
  }
}

export async function fsGetOrdersByPhone(phone: string): Promise<Order[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "orders"), where("phone", "==", phone.trim())),
    );
    return snap.docs.map((d) =>
      docToOrder(d.id, d.data() as Record<string, unknown>),
    );
  } catch (err) {
    console.error("Firestore: Error fetching orders by phone", err);
    return [];
  }
}

export interface PlaceOrderInput {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  quantity: bigint;
  productId: string;
  productName: string; // REQUIRED: product name saved in Firestore
  productPrice: bigint; // REQUIRED: product price saved in Firestore
  specialDescription: string;
}

// ============================================================
// When user clicks "Order" or completes checkout, this function
// saves the order to Firestore "orders" collection with:
//   - product name
//   - price
//   - customer name
//   - timestamp (via Firestore serverTimestamp)
// ============================================================
export async function fsPlaceOrder(input: PlaceOrderInput): Promise<void> {
  try {
    await setDoc(doc(db, "orders", input.id), {
      customerName: input.customerName,
      phone: input.phone,
      address: input.address,
      quantity: Number(input.quantity),
      productId: input.productId,
      productName: input.productName, // Saved as required
      price: Number(input.productPrice), // Saved as required
      specialDescription: input.specialDescription,
      status: "pending",
      courierName: "",
      courierTrackingNumber: "",
      createdAt: serverTimestamp(), // Timestamp saved as required
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Firestore: Error placing order", err);
    throw err;
  }
}

export async function fsUpdateOrderStatus(
  orderId: string,
  status: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, "orders", orderId), { status });
  } catch (err) {
    console.error("Firestore: Error updating order status", err);
    throw err;
  }
}

export async function fsUpdateOrderCourierInfo(
  orderId: string,
  courierName: string,
  courierTrackingNumber: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      courierName,
      courierTrackingNumber,
    });
  } catch (err) {
    console.error("Firestore: Error updating courier info", err);
    throw err;
  }
}

export async function fsUpdateOrderDetails(
  orderId: string,
  details: Partial<{
    customerName: string;
    phone: string;
    address: string;
    quantity: bigint;
    specialDescription: string;
    estimatedDelivery: string;
  }>,
): Promise<void> {
  try {
    const data: Record<string, unknown> = { ...details };
    if (details.quantity !== undefined) {
      data.quantity = Number(details.quantity);
    }
    await updateDoc(doc(db, "orders", orderId), data);
  } catch (err) {
    console.error("Firestore: Error updating order details", err);
    throw err;
  }
}

export async function fsDeleteOrder(orderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "orders", orderId));
  } catch (err) {
    console.error("Firestore: Error deleting order", err);
    throw err;
  }
}

export async function fsDeleteAllOrders(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, "orders"));
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    console.error("Firestore: Error deleting all orders", err);
    throw err;
  }
}

// ── Inquiries ─────────────────────────────────────────────────
export async function fsSaveInquiry(
  name: string,
  phone: string,
  message: string,
): Promise<void> {
  try {
    await addDoc(collection(db, "inquiries"), {
      name,
      phone,
      message,
      createdAt: serverTimestamp(),
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Firestore: Error saving inquiry", err);
    throw err;
  }
}

export async function fsGetAllInquiries(): Promise<Inquiry[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "inquiries"), orderBy("createdAt", "desc")),
    );
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      let ts: bigint;
      if (data.createdAt instanceof Timestamp) {
        ts = BigInt(data.createdAt.toMillis());
      } else {
        ts = BigInt((data.timestamp as number) || Date.now());
      }
      return {
        name: (data.name as string) || "",
        phone: (data.phone as string) || "",
        message: (data.message as string) || "",
        timestamp: ts,
      } as Inquiry;
    });
  } catch (err) {
    console.error("Firestore: Error fetching inquiries", err);
    return [];
  }
}
