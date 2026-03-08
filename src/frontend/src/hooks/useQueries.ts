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
import { useActor } from "./useActor";

// ── Products ─────────────────────────────────────────────────────
// Try ICP backend first, fall back to localStorage silently.

export function useGetAllProducts() {
  const { actor } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      // Try backend first
      if (actor) {
        try {
          const backendProducts = await actor.getAllProducts();
          if (backendProducts && backendProducts.length > 0) {
            return backendProducts;
          }
        } catch {
          // fall through to localStorage
        }
      }
      // Fall back to localStorage
      const deletedIds = getDeletedProductIds();
      return getLocalProducts().filter((p) => !deletedIds.has(p.id));
    },
    enabled: true,
  });
}

export function useGetProduct(productId: string) {
  const { actor } = useActor();
  return useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: async () => {
      // Try backend first
      if (actor) {
        try {
          return await actor.getProduct(productId);
        } catch {
          // fall through to localStorage
        }
      }
      // Fall back to localStorage
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
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      // Save locally first (guaranteed)
      addLocalProduct(product);
      // Also try backend (best-effort)
      if (actor) {
        try {
          await actor.createProduct(product);
        } catch {
          // saved locally — ignore error
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      product,
    }: { productId: string; product: Product }) => {
      // Update locally first
      updateLocalProduct(productId, product);
      // Also try backend (best-effort)
      if (actor) {
        try {
          await actor.updateProduct(productId, product);
        } catch {
          // saved locally — ignore error
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      // Delete locally first
      deleteLocalProduct(productId);
      // Also try backend (best-effort)
      if (actor) {
        try {
          await actor.deleteProduct(productId);
        } catch {
          // deleted locally — ignore error
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ── Orders ────────────────────────────────────────────────────────
// Save locally always, also try backend.

export function usePlaceOrder() {
  const { actor } = useActor();
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
      const localProduct = getLocalProducts().find((p) => p.id === productId);
      const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // Save locally always (guaranteed to work)
      saveLocalOrder({
        id: orderId,
        customerName,
        phone,
        address,
        quantity: quantity.toString(),
        productId,
        productName: localProduct?.name ?? productId,
        productPrice: localProduct?.price?.toString() ?? "0",
        specialDescription,
        status: "Pending",
        createdAt: Date.now().toString(),
        courierName: "",
        courierTrackingNumber: "",
      });

      // Also try backend (best-effort)
      if (actor) {
        try {
          await actor.placeOrder(
            customerName,
            phone,
            address,
            quantity,
            productId,
            specialDescription,
          );
        } catch {
          // saved locally — ignore error
        }
      }

      return orderId;
    },
  });
}

export function useGetAllOrders() {
  const { actor } = useActor();
  return useQuery<Order[]>({
    queryKey: ["allOrders"],
    queryFn: async () => {
      // Try backend first
      if (actor) {
        try {
          const backendOrders = await actor.getAllOrders();
          if (backendOrders && backendOrders.length > 0) {
            return backendOrders;
          }
        } catch {
          // fall through to localStorage
        }
      }
      // Fall back to localStorage
      return getLocalOrders().map(localOrderToOrder);
    },
    enabled: true,
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
    }: { orderId: string; newStatus: OrderStatus }) => {
      // Update locally first
      updateLocalOrderStatus(orderId, newStatus as unknown as string);
      // Also try backend (best-effort)
      if (actor) {
        try {
          await actor.updateOrderStatus(orderId, newStatus);
        } catch {
          // updated locally — ignore error
        }
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
  const { actor } = useActor();
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
      // Update locally first
      updateLocalOrderCourier(orderId, courierName, courierTrackingNumber);
      // Also try backend (best-effort)
      if (actor) {
        try {
          await actor.updateOrderCourierInfo(
            orderId,
            courierName,
            courierTrackingNumber,
          );
        } catch {
          // updated locally — ignore error
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allOrders"] }),
  });
}

// ── Analytics (try backend, fall back to localStorage) ────────────

/** Statuses that count toward revenue */
const REVENUE_STATUSES = new Set([
  "confirmed",
  "Confirmed",
  "delivered",
  "Delivered",
]);

export function useGetTotalOrdersCount() {
  const { actor } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalOrders"],
    queryFn: async () => {
      if (actor) {
        try {
          return await actor.getTotalOrdersCount();
        } catch {
          // fall through
        }
      }
      return BigInt(getLocalOrders().length);
    },
    enabled: true,
  });
}

export function useGetTotalRevenue() {
  const { actor } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalRevenue"],
    queryFn: async () => {
      if (actor) {
        try {
          return await actor.getTotalRevenue();
        } catch {
          // fall through
        }
      }
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
    },
    enabled: true,
  });
}

export function useGetOrdersCountByStatus() {
  const { actor } = useActor();
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["ordersByStatus"],
    queryFn: async () => {
      if (actor) {
        try {
          return await actor.getOrdersCountByStatus();
        } catch {
          // fall through
        }
      }
      const orders = getLocalOrders();
      const counts: Record<string, number> = {};
      for (const o of orders) {
        const s = o.status.toLowerCase();
        counts[s] = (counts[s] ?? 0) + 1;
      }
      return Object.entries(counts).map(
        ([k, v]) => [k, BigInt(v)] as [string, bigint],
      );
    },
    enabled: true,
  });
}

export function useGetMonthlySalesSummary() {
  const { actor } = useActor();
  return useQuery<MonthlySales[]>({
    queryKey: ["monthlySales"],
    queryFn: async () => {
      if (actor) {
        try {
          return await actor.getMonthlySalesSummary();
        } catch {
          // fall through
        }
      }
      const orders = getLocalOrders();
      const map = new Map<
        string,
        { year: number; month: number; revenue: bigint; count: number }
      >();

      for (const o of orders) {
        const ts = Number(o.createdAt);
        const d = new Date(Number.isNaN(ts) ? Date.now() : ts);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const key = `${year}-${month}`;

        const existing = map.get(key) ?? { year, month, revenue: 0n, count: 0 };
        existing.count += 1;

        if (REVENUE_STATUSES.has(o.status)) {
          const price = BigInt(o.productPrice || "0");
          const qty = BigInt(o.quantity || "1");
          existing.revenue += price * qty;
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
    enabled: true,
  });
}

export function useGetTopSellingProducts(limit: bigint) {
  const { actor } = useActor();
  return useQuery<ProductSales[]>({
    queryKey: ["topSellingProducts", limit.toString()],
    queryFn: async () => {
      if (actor) {
        try {
          return await actor.getTopSellingProducts(limit);
        } catch {
          // fall through
        }
      }
      const orders = getLocalOrders();
      const products = getLocalProducts();
      const productNameMap = new Map(products.map((p) => [p.id, p.name]));

      const qtys = new Map<string, bigint>();
      for (const o of orders) {
        const prev = qtys.get(o.productId) ?? 0n;
        qtys.set(o.productId, prev + BigInt(o.quantity || "1"));
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
    enabled: true,
  });
}

export function useGetRecentOrders(limit: bigint) {
  const { actor } = useActor();
  return useQuery<Order[]>({
    queryKey: ["recentOrders", limit.toString()],
    queryFn: async () => {
      if (actor) {
        try {
          return await actor.getRecentOrders(limit);
        } catch {
          // fall through
        }
      }
      return getLocalOrders()
        .slice()
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
        .slice(0, Number(limit))
        .map(localOrderToOrder);
    },
    enabled: true,
  });
}

// ── Inquiries ────────────────────────────────────────────────────
// Try actor first; fall back to localStorage so messages are never lost.

export function useSubmitInquiry() {
  const { actor } = useActor();
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
      // Save locally always (guaranteed to work)
      const localInquiry = {
        id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        phone,
        message,
        timestamp: Date.now().toString(),
      };
      saveLocalInquiry(localInquiry);

      // Also try backend (best-effort, non-blocking)
      if (actor) {
        try {
          await actor.submitInquiry(name, phone, message);
        } catch {
          // already saved locally — ignore error
        }
      }
    },
  });
}

export function useGetAllInquiries() {
  const { actor } = useActor();
  return useQuery<Inquiry[]>({
    queryKey: ["inquiries"],
    queryFn: async () => {
      // Always include local inquiries
      const localInquiries = getLocalInquiries().map(localInquiryToInquiry);

      if (!actor) return localInquiries;

      try {
        const backendInquiries = await actor.getAllInquiries();
        // Merge: local + backend (deduplicate by timestamp+phone combo)
        const backendKeys = new Set(
          backendInquiries.map((i) => `${i.phone}_${i.timestamp}`),
        );
        const localOnly = localInquiries.filter(
          (i) => !backendKeys.has(`${i.phone}_${i.timestamp}`),
        );
        return [...localOnly, ...backendInquiries];
      } catch {
        return localInquiries;
      }
    },
    enabled: true,
  });
}

export function useGetOrdersByPhone(phone: string) {
  const { actor } = useActor();
  return useQuery<Order[]>({
    queryKey: ["ordersByPhone", phone],
    queryFn: async () => {
      if (!phone.trim()) return [];

      // Try backend first
      if (actor) {
        try {
          const backendOrders = await actor.getOrdersByPhone(phone.trim());
          if (backendOrders && backendOrders.length > 0) {
            return backendOrders;
          }
        } catch {
          // fall through
        }
      }

      // Fall back to localStorage
      return getLocalOrders()
        .filter((o) => o.phone === phone.trim())
        .map(localOrderToOrder);
    },
    enabled: !!phone.trim(),
  });
}

// ── Auth / Admin ──────────────────────────────────────────────────
// isCallerAdmin is backend-only; keep it as a lightweight check.
// Admin auth in this app is handled by localStorage credential check,
// so this always returns false when backend unavailable — that is fine.

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}
