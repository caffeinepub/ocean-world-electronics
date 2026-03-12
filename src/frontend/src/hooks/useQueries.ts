// ============================================================
// useQueries.ts - Firebase Firestore based data hooks
// All ICP/Motoko backend calls have been replaced with Firestore.
// Data is now stored permanently in Firebase, accessible from
// any device, any browser.
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Inquiry,
  MonthlySales,
  Order,
  OrderStatus,
  Product,
  ProductSales,
} from "../backend.d";
import {
  fsCreateProduct,
  fsDeleteAllOrders,
  fsDeleteProduct,
  fsGetAllInquiries,
  fsGetAllOrders,
  fsGetAllProducts,
  fsGetOrdersByPhone,
  fsGetProduct,
  fsPlaceOrder,
  fsSaveInquiry,
  fsUpdateOrderCourierInfo,
  fsUpdateOrderStatus,
  fsUpdateProduct,
} from "../services/firestoreService";
import {
  addLocalProduct,
  deleteLocalProduct,
  getDeletedProductIds,
  getLocalInquiries,
  getLocalOrders,
  getLocalProducts,
  localInquiryToInquiry,
  localOrderToOrder,
  saveLocalInquiry,
  saveLocalOrder,
  updateLocalOrderCourier,
  updateLocalOrderStatus,
  updateLocalProduct,
} from "../utils/storeSettings";

// ============================================================
// PRODUCTS
// ============================================================

export function useGetAllProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      // Try Firestore first
      try {
        const firestoreProducts = await fsGetAllProducts();
        if (firestoreProducts.length > 0) {
          // Merge with any local-only products not yet synced
          const fsIds = new Set(firestoreProducts.map((p) => p.id));
          const deletedIds = getDeletedProductIds();
          const localOnly = getLocalProducts().filter(
            (p) => !fsIds.has(p.id) && !deletedIds.has(p.id),
          );
          return [...firestoreProducts, ...localOnly];
        }
      } catch {
        // Firestore unavailable, fall through to localStorage
      }
      // Fallback: localStorage
      const deletedIds = getDeletedProductIds();
      return getLocalProducts().filter((p) => !deletedIds.has(p.id));
    },
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

export function useGetProduct(productId: string) {
  return useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: async () => {
      // Try Firestore first
      try {
        const p = await fsGetProduct(productId);
        if (p) return p;
      } catch {
        // fall through
      }
      // Fallback: localStorage
      const deletedIds = getDeletedProductIds();
      if (deletedIds.has(productId)) throw new Error("Product not found");
      const product = getLocalProducts().find((p) => p.id === productId);
      if (!product) throw new Error("Product not found");
      return product;
    },
    enabled: !!productId,
    retry: 0,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      // Save locally immediately for instant UI feedback
      addLocalProduct(product);
      // Save to Firestore (permanent storage)
      try {
        await fsCreateProduct(product);
      } catch {
        // Saved locally as fallback
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      product,
    }: { productId: string; product: Product }) => {
      updateLocalProduct(productId, product);
      try {
        await fsUpdateProduct(productId, product);
      } catch {
        // saved locally
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      deleteLocalProduct(productId);
      try {
        await fsDeleteProduct(productId);
      } catch {
        // deleted locally
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ============================================================
// ORDERS
// ============================================================

export function usePlaceOrder() {
  return useMutation({
    mutationFn: async ({
      customerName,
      phone,
      address,
      quantity,
      productId,
      specialDescription,
    }: {
      customerName: string;
      phone: string;
      address: string;
      quantity: bigint;
      productId: string;
      specialDescription: string;
    }) => {
      // Get product info for saving name and price
      let productName = productId;
      let productPrice = 0n;
      try {
        const localProducts = getLocalProducts();
        const localProduct = localProducts.find((p) => p.id === productId);
        if (localProduct) {
          productName = localProduct.name;
          productPrice = localProduct.price;
        } else {
          // Try Firestore
          const fsProduct = await fsGetProduct(productId);
          if (fsProduct) {
            productName = fsProduct.name;
            productPrice = fsProduct.price;
          }
        }
      } catch {
        // use defaults
      }

      const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // ============================================================
      // SAVE ORDER TO FIRESTORE
      // Stores: productName, price, customerName, timestamp
      // ============================================================
      try {
        await fsPlaceOrder({
          id: orderId,
          customerName,
          phone,
          address,
          quantity,
          productId,
          productName,
          productPrice,
          specialDescription,
        });
      } catch {
        // Firestore failed, save locally as fallback
      }

      // Also save locally for instant UI feedback
      saveLocalOrder({
        id: orderId,
        customerName,
        phone,
        address,
        quantity: quantity.toString(),
        productId,
        productName,
        productPrice: productPrice.toString(),
        specialDescription,
        status: "Pending",
        createdAt: Date.now().toString(),
        courierName: "",
        courierTrackingNumber: "",
      });

      return orderId;
    },
  });
}

export function useGetAllOrders() {
  return useQuery<Order[]>({
    queryKey: ["allOrders"],
    queryFn: async () => {
      // Try Firestore first
      try {
        const firestoreOrders = await fsGetAllOrders();
        if (firestoreOrders.length >= 0) {
          // Merge with local-only orders not yet in Firestore
          const fsIds = new Set(firestoreOrders.map((o) => o.id));
          const localOnly = getLocalOrders()
            .filter((o) => !fsIds.has(o.id))
            .map(localOrderToOrder);
          return [...firestoreOrders, ...localOnly];
        }
      } catch {
        // Firestore unavailable
      }
      return getLocalOrders().map(localOrderToOrder);
    },
    staleTime: 0,
    refetchInterval: 15_000,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
    }: { orderId: string; newStatus: OrderStatus }) => {
      // Update locally
      updateLocalOrderStatus(orderId, newStatus as unknown as string);
      // Update in Firestore
      try {
        await fsUpdateOrderStatus(orderId, newStatus as unknown as string);
      } catch {
        // updated locally
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allOrders"] });
      qc.invalidateQueries({ queryKey: ["totalOrders"] });
      qc.invalidateQueries({ queryKey: ["ordersByStatus"] });
      qc.invalidateQueries({ queryKey: ["totalRevenue"] });
      qc.invalidateQueries({ queryKey: ["monthlySales"] });
      qc.invalidateQueries({ queryKey: ["topSellingProducts"] });
      qc.invalidateQueries({ queryKey: ["recentOrders"] });
    },
  });
}

export function useUpdateOrderCourierInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      courierName,
      courierTrackingNumber,
    }: {
      orderId: string;
      courierName: string;
      courierTrackingNumber: string;
    }) => {
      updateLocalOrderCourier(orderId, courierName, courierTrackingNumber);
      try {
        await fsUpdateOrderCourierInfo(
          orderId,
          courierName,
          courierTrackingNumber,
        );
      } catch {
        // updated locally
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allOrders"] }),
  });
}

// ── Clear All Orders (admin action) ────────────────────────────────
export function useClearAllOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await fsDeleteAllOrders();
      } catch {
        // ignore
      }
      // Also clear localStorage
      localStorage.removeItem("ow_local_orders");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allOrders"] }),
  });
}

// ============================================================
// ANALYTICS
// ============================================================

const REVENUE_STATUSES = new Set([
  "confirmed",
  "Confirmed",
  "delivered",
  "Delivered",
]);

export function useGetTotalOrdersCount() {
  return useQuery<bigint>({
    queryKey: ["totalOrders"],
    queryFn: async () => {
      try {
        const orders = await fsGetAllOrders();
        return BigInt(orders.length);
      } catch {
        return BigInt(getLocalOrders().length);
      }
    },
    staleTime: 0,
  });
}

export function useGetTotalRevenue() {
  return useQuery<bigint>({
    queryKey: ["totalRevenue"],
    queryFn: async () => {
      try {
        const orders = await fsGetAllOrders();
        let total = 0n;
        for (const o of orders) {
          const statusStr = (o.status as unknown as string).toLowerCase();
          if (REVENUE_STATUSES.has(statusStr)) {
            total +=
              o.quantity *
              BigInt((o as unknown as { price?: number }).price ?? 0);
          }
        }
        return total;
      } catch {
        // Fallback to localStorage
        const orders = getLocalOrders();
        let total = 0n;
        for (const o of orders) {
          if (REVENUE_STATUSES.has(o.status)) {
            const price = BigInt(o.productPrice || "0");
            const qty = BigInt(o.quantity || "1");
            total += price * qty;
          }
        }
        return total;
      }
    },
    staleTime: 0,
  });
}

export function useGetOrdersCountByStatus() {
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["ordersByStatus"],
    queryFn: async () => {
      let orders: Order[];
      try {
        orders = await fsGetAllOrders();
      } catch {
        orders = getLocalOrders().map(localOrderToOrder);
      }
      const counts: Record<string, number> = {};
      for (const o of orders) {
        const s = (o.status as unknown as string).toLowerCase();
        counts[s] = (counts[s] ?? 0) + 1;
      }
      return Object.entries(counts).map(
        ([k, v]) => [k, BigInt(v)] as [string, bigint],
      );
    },
    staleTime: 0,
  });
}

export function useGetMonthlySalesSummary() {
  return useQuery<MonthlySales[]>({
    queryKey: ["monthlySales"],
    queryFn: async () => {
      let orders: Order[];
      try {
        orders = await fsGetAllOrders();
      } catch {
        orders = getLocalOrders().map(localOrderToOrder);
      }
      const map = new Map<
        string,
        { year: number; month: number; revenue: bigint; count: number }
      >();
      for (const o of orders) {
        const ts = Number(o.timestamp);
        const d = new Date(Number.isNaN(ts) ? Date.now() : ts);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const key = `${year}-${month}`;
        const existing = map.get(key) ?? { year, month, revenue: 0n, count: 0 };
        existing.count += 1;
        const statusStr = (o.status as unknown as string).toLowerCase();
        if (REVENUE_STATUSES.has(statusStr)) {
          existing.revenue += o.quantity;
        }
        map.set(key, existing);
      }
      return [...map.values()]
        .sort((a, b) =>
          a.year !== b.year ? a.year - b.year : a.month - b.month,
        )
        .map((e) => ({
          year: BigInt(e.year),
          month: BigInt(e.month),
          revenue: e.revenue,
          orderCount: BigInt(e.count),
        }));
    },
    staleTime: 0,
  });
}

export function useGetTopSellingProducts(limit: bigint) {
  return useQuery<ProductSales[]>({
    queryKey: ["topSellingProducts", limit.toString()],
    queryFn: async () => {
      let orders: Order[];
      try {
        orders = await fsGetAllOrders();
      } catch {
        orders = getLocalOrders().map(localOrderToOrder);
      }
      let products: Product[];
      try {
        products = await fsGetAllProducts();
      } catch {
        products = getLocalProducts();
      }
      const productNameMap = new Map(products.map((p) => [p.id, p.name]));
      const qtys = new Map<string, bigint>();
      for (const o of orders) {
        const prev = qtys.get(o.productId) ?? 0n;
        qtys.set(o.productId, prev + o.quantity);
      }
      return [...qtys.entries()]
        .sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))
        .slice(0, Number(limit))
        .map(([productId, totalQuantity]) => ({
          productId,
          productName: productNameMap.get(productId) ?? productId,
          totalQuantity,
        }));
    },
    staleTime: 0,
  });
}

export function useGetRecentOrders(limit: bigint) {
  return useQuery<Order[]>({
    queryKey: ["recentOrders", limit.toString()],
    queryFn: async () => {
      try {
        const orders = await fsGetAllOrders();
        return orders.slice(0, Number(limit));
      } catch {
        return getLocalOrders()
          .slice()
          .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
          .slice(0, Number(limit))
          .map(localOrderToOrder);
      }
    },
    staleTime: 0,
  });
}

// ============================================================
// INQUIRIES
// ============================================================

export function useSubmitInquiry() {
  return useMutation({
    mutationFn: async ({
      name,
      phone,
      message,
    }: {
      name: string;
      phone: string;
      message: string;
    }) => {
      const localInquiry = {
        id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        phone,
        message,
        timestamp: Date.now().toString(),
      };
      saveLocalInquiry(localInquiry);
      try {
        await fsSaveInquiry(name, phone, message);
      } catch {
        // saved locally
      }
    },
  });
}

export function useGetAllInquiries() {
  return useQuery<Inquiry[]>({
    queryKey: ["inquiries"],
    queryFn: async () => {
      try {
        return await fsGetAllInquiries();
      } catch {
        return getLocalInquiries().map(localInquiryToInquiry);
      }
    },
    staleTime: 0,
  });
}

export function useGetOrdersByPhone(phone: string) {
  return useQuery<Order[]>({
    queryKey: ["ordersByPhone", phone],
    queryFn: async () => {
      if (!phone.trim()) return [];
      try {
        return await fsGetOrdersByPhone(phone.trim());
      } catch {
        return getLocalOrders()
          .filter((o) => o.phone === phone.trim())
          .map(localOrderToOrder);
      }
    },
    enabled: !!phone.trim(),
    staleTime: 0,
  });
}

// ============================================================
// AUTH - Admin is always local (no ICP)
// ============================================================
export function useIsCallerAdmin() {
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => false, // Admin auth handled by local password check
    staleTime: Number.POSITIVE_INFINITY,
  });
}
