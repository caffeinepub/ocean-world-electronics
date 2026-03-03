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
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProduct(productId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getProduct(productId);
    },
    enabled: !!actor && !isFetching && !!productId,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      const actor = await getAdminActor();
      return actor.createProduct(product);
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
      const actor = await getAdminActor();
      return actor.updateProduct(productId, product);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const actor = await getAdminActor();
      return actor.deleteProduct(productId);
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
      if (!actor) throw new Error("Actor not available");
      return actor.placeOrder(
        customerName,
        phone,
        address,
        quantity,
        productId,
        specialDescription,
      );
    },
  });
}

export function useGetAllOrders() {
  return useQuery<Order[]>({
    queryKey: ["allOrders"],
    queryFn: async () => {
      const actor = await getAdminActor();
      return actor.getAllOrders();
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
      const actor = await getAdminActor();
      return actor.updateOrderStatus(orderId, newStatus);
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
      const actor = await getAdminActor();
      return actor.updateOrderCourierInfo(
        orderId,
        courierName,
        courierTrackingNumber,
      );
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
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["ordersByPhone", phone],
    queryFn: async () => {
      if (!actor || !phone.trim()) return [];
      return actor.getOrdersByPhone(phone);
    },
    enabled: !!actor && !isFetching && !!phone.trim(),
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
