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
  getLocalOrders,
  getLocalProducts,
  localOrderToOrder,
  saveLocalOrder,
  updateLocalOrderCourier,
  updateLocalOrderStatus,
  updateLocalProduct,
} from "../utils/storeSettings";
import { useActor } from "./useActor";

// ── Products ────────────────────────────────────────────────────
export function useGetAllProducts() {
  const { actor } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const localProducts = getLocalProducts();
      const deletedIds = getDeletedProductIds();
      try {
        if (!actor) return localProducts.filter((p) => !deletedIds.has(p.id));
        const backendProducts = await actor.getAllProducts();
        // Merge: local products take priority; backend products fill the rest
        // but never include any product that has been explicitly deleted
        const localIds = new Set(localProducts.map((p) => p.id));
        const backendOnly = backendProducts.filter(
          (p) => !localIds.has(p.id) && !deletedIds.has(p.id),
        );
        return [
          ...localProducts.filter((p) => !deletedIds.has(p.id)),
          ...backendOnly,
        ];
      } catch {
        return localProducts.filter((p) => !deletedIds.has(p.id));
      }
    },
    enabled: true, // always run, even without actor
  });
}

export function useGetProduct(productId: string) {
  const { actor } = useActor();
  return useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: async () => {
      // If this product was explicitly deleted, don't return it
      const deletedIds = getDeletedProductIds();
      if (deletedIds.has(productId)) throw new Error("Product not found");
      // Always check localStorage first (admin-added products)
      const localProduct = getLocalProducts().find((p) => p.id === productId);
      if (localProduct) return localProduct;
      if (!actor) throw new Error("Actor not available");
      return actor.getProduct(productId);
    },
    enabled: !!productId,
    retry: 1,
  });
}

export function useCreateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      // Try backend first
      if (actor) {
        try {
          await actor.createProduct(product);
          // Also save locally for immediate availability
          addLocalProduct(product);
          return;
        } catch {
          // fall through to localStorage only
        }
      }
      // localStorage fallback
      addLocalProduct(product);
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
      // Try backend first
      if (actor) {
        try {
          await actor.updateProduct(productId, product);
          // Also update locally
          updateLocalProduct(productId, product);
          return;
        } catch {
          // fall through to localStorage only
        }
      }
      updateLocalProduct(productId, product);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      // Try backend first
      if (actor) {
        try {
          await actor.deleteProduct(productId);
          // Also delete locally
          deleteLocalProduct(productId);
          return;
        } catch {
          // fall through to localStorage only
        }
      }
      deleteLocalProduct(productId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ── Orders ────────────────────────────────────────────────────
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
      // Try backend first; fall back to localStorage
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
          // Also save locally so it shows up immediately
          const localProduct = getLocalProducts().find(
            (p) => p.id === productId,
          );
          const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
          return orderId;
        } catch {
          // fall through to localStorage
        }
      }

      // localStorage fallback
      const localProduct = getLocalProducts().find((p) => p.id === productId);
      const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
      return orderId;
    },
  });
}

export function useGetAllOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["allOrders"],
    queryFn: async () => {
      const localOrders = getLocalOrders().map(localOrderToOrder);
      if (!actor) return localOrders;
      try {
        const backendOrders = await actor.getAllOrders();
        // Merge: local orders + backend orders (avoid duplicates by id)
        const localIds = new Set(localOrders.map((o) => o.id));
        const backendOnly = backendOrders.filter((o) => !localIds.has(o.id));
        return [...localOrders, ...backendOnly];
      } catch {
        return localOrders;
      }
    },
    enabled: !isFetching, // run as soon as actor is ready (or immediately if null)
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
      // Always update locally first for immediate UI feedback
      updateLocalOrderStatus(orderId, newStatus as unknown as string);

      // Also try backend
      if (actor) {
        try {
          await actor.updateOrderStatus(orderId, newStatus);
        } catch {
          // local update already done, ignore backend error
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allOrders"] });
      qc.invalidateQueries({ queryKey: ["totalOrders"] });
      qc.invalidateQueries({ queryKey: ["ordersByStatus"] });
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
      // Always update locally first
      updateLocalOrderCourier(orderId, courierName, courierTrackingNumber);

      // Also try backend
      if (actor) {
        try {
          await actor.updateOrderCourierInfo(
            orderId,
            courierName,
            courierTrackingNumber,
          );
        } catch {
          // local update already done, ignore backend error
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allOrders"] }),
  });
}

export function useGetTotalOrdersCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalOrders"],
    queryFn: async () => {
      if (!actor) {
        // Fallback: count from localStorage
        return BigInt(getLocalOrders().length);
      }
      try {
        return await actor.getTotalOrdersCount();
      } catch {
        return BigInt(getLocalOrders().length);
      }
    },
    enabled: !isFetching,
  });
}

export function useGetTotalRevenue() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalRevenue"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      try {
        return await actor.getTotalRevenue();
      } catch {
        return BigInt(0);
      }
    },
    enabled: !isFetching,
  });
}

export function useGetMonthlySalesSummary() {
  const { actor, isFetching } = useActor();
  return useQuery<MonthlySales[]>({
    queryKey: ["monthlySales"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMonthlySalesSummary();
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
  });
}

export function useGetOrdersCountByStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["ordersByStatus"],
    queryFn: async () => {
      if (!actor) {
        // Fallback: compute from localStorage
        const orders = getLocalOrders();
        const counts: Record<string, number> = {};
        for (const o of orders) {
          const s = o.status.toLowerCase();
          counts[s] = (counts[s] ?? 0) + 1;
        }
        return Object.entries(counts).map(
          ([k, v]) => [k, BigInt(v)] as [string, bigint],
        );
      }
      try {
        return await actor.getOrdersCountByStatus();
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
  });
}

export function useGetTopSellingProducts(limit: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<ProductSales[]>({
    queryKey: ["topSellingProducts", limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getTopSellingProducts(limit);
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
  });
}

export function useGetRecentOrders(limit: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["recentOrders", limit.toString()],
    queryFn: async () => {
      if (!actor) {
        // Fallback: return most recent local orders
        return getLocalOrders().slice(0, Number(limit)).map(localOrderToOrder);
      }
      try {
        return await actor.getRecentOrders(limit);
      } catch {
        return getLocalOrders().slice(0, Number(limit)).map(localOrderToOrder);
      }
    },
    enabled: !isFetching,
  });
}

// ── Inquiries ────────────────────────────────────────────────────
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
      if (!actor) throw new Error("Actor not available");
      return actor.submitInquiry(name, phone, message);
    },
  });
}

export function useGetAllInquiries() {
  const { actor, isFetching } = useActor();
  return useQuery<Inquiry[]>({
    queryKey: ["inquiries"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllInquiries();
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
  });
}

export function useGetOrdersByPhone(phone: string) {
  const { actor } = useActor();
  return useQuery<Order[]>({
    queryKey: ["ordersByPhone", phone],
    queryFn: async () => {
      if (!phone.trim()) return [];
      const localOrders = getLocalOrders()
        .filter((o) => o.phone === phone.trim())
        .map(localOrderToOrder);
      if (!actor) return localOrders;
      try {
        const backendOrders = await actor.getOrdersByPhone(phone);
        const localIds = new Set(localOrders.map((o) => o.id));
        const backendOnly = backendOrders.filter((o) => !localIds.has(o.id));
        return [...localOrders, ...backendOnly];
      } catch {
        return localOrders;
      }
    },
    enabled: !!phone.trim(),
  });
}

// ── Auth / Admin ────────────────────────────────────────────────
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
