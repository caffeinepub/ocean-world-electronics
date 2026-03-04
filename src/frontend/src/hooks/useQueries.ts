import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Inquiry,
  MonthlySales,
  Order,
  OrderStatus,
  Product,
  ProductSales,
} from "../backend.d";
import { createActorWithConfig } from "../config";
import {
  addLocalProduct,
  deleteLocalProduct,
  getLocalOrders,
  getLocalProducts,
  localOrderToOrder,
  saveLocalOrder,
  updateLocalOrderCourier,
  updateLocalOrderStatus,
  updateLocalProduct,
} from "../utils/storeSettings";
import { useActor } from "./useActor";

// ── Admin Actor ─────────────────────────────────────────────────
const ADMIN_TOKEN = "1995@Bhawna";

async function getAdminActor() {
  const actor = await createActorWithConfig();
  try {
    // _initializeAccessControlWithSecret is not in the public type but exists at runtime
    await (actor as any)._initializeAccessControlWithSecret(ADMIN_TOKEN);
  } catch {
    // ignore — may already be initialized or caller already has admin role
  }
  return actor;
}

// ── Products ────────────────────────────────────────────────────
export function useGetAllProducts() {
  const { actor } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const localProducts = getLocalProducts();
      try {
        if (!actor) return localProducts;
        const backendProducts = await actor.getAllProducts();
        // Merge: local products override backend by id, backend products fill the rest
        const localIds = new Set(localProducts.map((p) => p.id));
        const backendOnly = backendProducts.filter((p) => !localIds.has(p.id));
        return [...localProducts, ...backendOnly];
      } catch {
        return localProducts;
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      addLocalProduct(product);
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
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
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
          const result = await actor.placeOrder(
            customerName,
            phone,
            address,
            quantity,
            productId,
            specialDescription,
          );
          return result;
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
  return useQuery<Order[]>({
    queryKey: ["allOrders"],
    queryFn: async () => {
      const localOrders = getLocalOrders().map(localOrderToOrder);
      try {
        const actor = await getAdminActor();
        const backendOrders = await actor.getAllOrders();
        // Merge: local orders + backend orders (avoid duplicates by id)
        const localIds = new Set(localOrders.map((o) => o.id));
        const backendOnly = backendOrders.filter((o) => !localIds.has(o.id));
        return [...localOrders, ...backendOnly];
      } catch {
        return localOrders;
      }
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
    }: { orderId: string; newStatus: OrderStatus }) => {
      // If local order, update locally
      const localOrders = getLocalOrders();
      const isLocal = localOrders.some((o) => o.id === orderId);
      if (isLocal) {
        updateLocalOrderStatus(orderId, newStatus as unknown as string);
        return;
      }
      try {
        const actor = await getAdminActor();
        return actor.updateOrderStatus(orderId, newStatus);
      } catch {
        updateLocalOrderStatus(orderId, newStatus as unknown as string);
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
      const localOrders = getLocalOrders();
      const isLocal = localOrders.some((o) => o.id === orderId);
      if (isLocal) {
        updateLocalOrderCourier(orderId, courierName, courierTrackingNumber);
        return;
      }
      try {
        const actor = await getAdminActor();
        return actor.updateOrderCourierInfo(
          orderId,
          courierName,
          courierTrackingNumber,
        );
      } catch {
        updateLocalOrderCourier(orderId, courierName, courierTrackingNumber);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allOrders"] }),
  });
}

export function useGetTotalOrdersCount() {
  return useQuery<bigint>({
    queryKey: ["totalOrders"],
    queryFn: async () => {
      const actor = await getAdminActor();
      return actor.getTotalOrdersCount();
    },
  });
}

export function useGetTotalRevenue() {
  return useQuery<bigint>({
    queryKey: ["totalRevenue"],
    queryFn: async () => {
      const actor = await getAdminActor();
      return actor.getTotalRevenue();
    },
  });
}

export function useGetMonthlySalesSummary() {
  return useQuery<MonthlySales[]>({
    queryKey: ["monthlySales"],
    queryFn: async () => {
      const actor = await getAdminActor();
      return actor.getMonthlySalesSummary();
    },
  });
}

export function useGetOrdersCountByStatus() {
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["ordersByStatus"],
    queryFn: async () => {
      const actor = await getAdminActor();
      return actor.getOrdersCountByStatus();
    },
  });
}

export function useGetTopSellingProducts(limit: bigint) {
  return useQuery<ProductSales[]>({
    queryKey: ["topSellingProducts", limit.toString()],
    queryFn: async () => {
      const actor = await getAdminActor();
      return actor.getTopSellingProducts(limit);
    },
  });
}

export function useGetRecentOrders(limit: bigint) {
  return useQuery<Order[]>({
    queryKey: ["recentOrders", limit.toString()],
    queryFn: async () => {
      const actor = await getAdminActor();
      return actor.getRecentOrders(limit);
    },
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
  return useQuery<Inquiry[]>({
    queryKey: ["inquiries"],
    queryFn: async () => {
      const actor = await getAdminActor();
      return actor.getAllInquiries();
    },
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
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
