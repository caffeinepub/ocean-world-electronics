import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Inquiry,
  MonthlySales,
  Order,
  OrderStatus,
  Product,
  ProductSales,
} from "../backend.d";
import { useActor } from "./useActor";

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
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createProduct(product);
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
      if (!actor) throw new Error("Actor not available");
      return actor.updateProduct(productId, product);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!actor) throw new Error("Actor not available");
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
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["allOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
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
      if (!actor) throw new Error("Actor not available");
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
      if (!actor) throw new Error("Actor not available");
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
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalOrders"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalOrdersCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTotalRevenue() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalRevenue"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalRevenue();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMonthlySalesSummary() {
  const { actor, isFetching } = useActor();
  return useQuery<MonthlySales[]>({
    queryKey: ["monthlySales"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlySalesSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOrdersCountByStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["ordersByStatus"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrdersCountByStatus();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTopSellingProducts(limit: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<ProductSales[]>({
    queryKey: ["topSellingProducts", limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopSellingProducts(limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRecentOrders(limit: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["recentOrders", limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentOrders(limit);
    },
    enabled: !!actor && !isFetching,
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
      return actor.getAllInquiries();
    },
    enabled: !!actor && !isFetching,
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
