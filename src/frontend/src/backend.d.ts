import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MonthlySales {
    month: bigint;
    revenue: bigint;
    year: bigint;
    orderCount: bigint;
}
export interface ProductSales {
    productId: string;
    productName: string;
    totalQuantity: bigint;
}
export interface Inquiry {
    name: string;
    message: string;
    timestamp: bigint;
    phone: string;
}
export interface Order {
    id: string;
    customerName: string;
    status: OrderStatus;
    specialDescription: string;
    courierName?: string;
    productId: string;
    courierTrackingNumber?: string;
    address: string;
    timestamp: bigint;
    quantity: bigint;
    phone: string;
}
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
}
export interface Product {
    id: string;
    stockQuantity: bigint;
    additionalDetails: string;
    manufacturer: string;
    name: string;
    isAvailable: boolean;
    description: string;
    imageUrl: string;
    category: string;
    price: bigint;
}
export enum OrderStatus {
    shipped = "shipped",
    cancelled = "cancelled",
    pending = "pending",
    out_for_delivery = "out_for_delivery",
    delivered = "delivered",
    confirmed = "confirmed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createProduct(product: Product): Promise<void>;
    deleteProduct(productId: string): Promise<void>;
    getAllInquiries(): Promise<Array<Inquiry>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMonthlySalesSummary(): Promise<Array<MonthlySales>>;
    getOrdersByStatus(status: OrderStatus): Promise<Array<Order>>;
    getOrdersCountByStatus(): Promise<Array<[string, bigint]>>;
    getProduct(productId: string): Promise<Product>;
    getRecentOrders(limit: bigint): Promise<Array<Order>>;
    getTopSellingProducts(limit: bigint): Promise<Array<ProductSales>>;
    getTotalOrdersCount(): Promise<bigint>;
    getTotalRevenue(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initialize(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(customerName: string, phone: string, address: string, quantity: bigint, productId: string, specialDescription: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitInquiry(name: string, phone: string, message: string): Promise<void>;
    updateOrderCourierInfo(orderId: string, courierName: string, courierTrackingNumber: string): Promise<void>;
    updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void>;
    updateProduct(productId: string, updatedProduct: Product): Promise<void>;
}
