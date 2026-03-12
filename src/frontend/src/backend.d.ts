// Principal type - simple string alias (ICP removed, using Firebase)
export type Principal = string;

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
    estimatedDelivery?: string;
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
    getAllProducts(): Promise<Array<Product>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllInquiries(): Promise<Array<Inquiry>>;
}
