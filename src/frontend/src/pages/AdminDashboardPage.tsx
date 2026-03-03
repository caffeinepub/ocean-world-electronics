import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  IndianRupee,
  Loader2,
  LogOut,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Shield,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { OrderStatus, Product } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateProduct,
  useDeleteProduct,
  useGetAllInquiries,
  useGetAllOrders,
  useGetAllProducts,
  useGetMonthlySalesSummary,
  useGetOrdersCountByStatus,
  useGetTotalOrdersCount,
  useGetTotalRevenue,
  useIsCallerAdmin,
  useUpdateOrderStatus,
  useUpdateProduct,
} from "../hooks/useQueries";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatPrice(price: bigint): string {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  manufacturer: "",
  category: "",
  price: BigInt(0),
  description: "",
  imageUrl: "",
  stockQuantity: BigInt(0),
  additionalDetails: "",
  isAvailable: true,
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  // Data queries
  const { data: orders, isLoading: ordersLoading } = useGetAllOrders();
  const { data: products, isLoading: productsLoading } = useGetAllProducts();
  const { data: inquiries, isLoading: inquiriesLoading } = useGetAllInquiries();
  const { data: totalOrders } = useGetTotalOrdersCount();
  const { data: totalRevenue } = useGetTotalRevenue();
  const { data: ordersByStatus } = useGetOrdersCountByStatus();
  const { data: monthlySales } = useGetMonthlySalesSummary();

  // Mutations
  const updateStatus = useUpdateOrderStatus();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Product form state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] =
    useState<Omit<Product, "id">>(emptyProduct);

  const isAuthenticated = !!identity;

  // Redirect if not admin
  if (adminLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-ocid="admin.loading_state"
      >
        <Loader2 className="h-8 w-8 animate-spin text-ocean-blue" />
      </div>
    );
  }

  if (!isAuthenticated || isAdmin === false) {
    return (
      <div
        className="min-h-screen flex items-center justify-center ocean-gradient"
        data-ocid="admin.error_state"
      >
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
          <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="font-heading font-bold text-xl mb-2">Access Denied</h2>
          <p className="text-muted-foreground font-display text-sm mb-6">
            You don't have permission to view the admin dashboard.
          </p>
          <Link to="/admin" data-ocid="admin.primary_button">
            <Button className="btn-ocean rounded-full w-full">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/admin" });
  };

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    try {
      await updateStatus.mutateAsync({
        orderId,
        newStatus: newStatus as OrderStatus,
      });
      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update status");
    }
  }

  function openCreateDialog() {
    setEditingProduct(null);
    setProductForm(emptyProduct);
    setProductDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      manufacturer: product.manufacturer,
      category: product.category,
      price: product.price,
      description: product.description,
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity,
      additionalDetails: product.additionalDetails,
      isAvailable: product.isAvailable,
    });
    setProductDialogOpen(true);
  }

  async function handleProductSubmit() {
    if (!productForm.name.trim() || !productForm.category.trim()) {
      toast.error("Name and category are required");
      return;
    }
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          productId: editingProduct.id,
          product: { ...productForm, id: editingProduct.id },
        });
        toast.success("Product updated successfully");
      } else {
        const newId = `prod_${Date.now()}`;
        await createProduct.mutateAsync({ ...productForm, id: newId });
        toast.success("Product added successfully");
      }
      setProductDialogOpen(false);
    } catch {
      toast.error("Failed to save product");
    }
  }

  async function handleDeleteProduct(productId: string) {
    try {
      await deleteProduct.mutateAsync(productId);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  }

  // Chart data
  const chartData = (monthlySales ?? [])
    .sort((a, b) => {
      const yearDiff = Number(a.year) - Number(b.year);
      return yearDiff !== 0 ? yearDiff : Number(a.month) - Number(b.month);
    })
    .slice(-6)
    .map((s) => ({
      name: `${MONTHS[Number(s.month) - 1]} '${String(Number(s.year)).slice(2)}`,
      revenue: Number(s.revenue),
      orders: Number(s.orderCount),
    }));

  const statusSummary = (ordersByStatus ?? []).reduce<Record<string, number>>(
    (acc, [status, count]) => {
      acc[status] = Number(count);
      return acc;
    },
    {},
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-ocean-navy text-white shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/ocean-world-logo-transparent.dim_300x300.png"
              alt="Ocean World Electronics"
              className="h-9 w-9 object-contain brightness-200"
            />
            <div>
              <span className="font-heading font-bold text-base text-white">
                Ocean World
              </span>
              <span className="text-white/50 text-xs font-display ml-2">
                Admin Dashboard
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 font-display hidden sm:block">
              {identity?.getPrincipal().toString().slice(0, 16)}...
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white font-display"
              data-ocid="admin.secondary_button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            {
              label: "Total Orders",
              value:
                totalOrders !== undefined
                  ? Number(totalOrders).toString()
                  : "—",
              icon: ShoppingBag,
              color: "text-blue-600",
              bg: "bg-blue-50",
              ocid: "admin.total_orders.card",
            },
            {
              label: "Total Revenue",
              value:
                totalRevenue !== undefined ? formatPrice(totalRevenue) : "—",
              icon: IndianRupee,
              color: "text-green-600",
              bg: "bg-green-50",
              ocid: "admin.revenue.card",
            },
            {
              label: "Products Listed",
              value: products !== undefined ? products.length.toString() : "—",
              icon: Package,
              color: "text-orange-600",
              bg: "bg-orange-50",
              ocid: "admin.products.card",
            },
            {
              label: "Pending Orders",
              value:
                statusSummary.pending !== undefined
                  ? statusSummary.pending.toString()
                  : "—",
              icon: MessageSquare,
              color: "text-purple-600",
              bg: "bg-purple-50",
              ocid: "admin.pending.card",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              data-ocid={stat.ocid}
              className="bg-card rounded-xl border border-border p-6 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground font-display">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="font-heading font-bold text-3xl text-foreground">
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" },
          ].map((s) => (
            <div
              key={s.value}
              className="bg-card rounded-xl border border-border p-4 flex flex-col items-center text-center"
            >
              <Badge
                className={`${STATUS_COLORS[s.value]} text-xs font-display border-0 mb-2`}
              >
                {s.label}
              </Badge>
              <span className="font-heading font-bold text-2xl text-foreground">
                {statusSummary[s.value] ?? 0}
              </span>
            </div>
          ))}
        </div>

        {/* Monthly Sales Chart */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6 mb-8">
          <h2 className="font-heading font-bold text-lg text-foreground mb-6">
            Monthly Sales Overview
          </h2>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground font-display">
              No sales data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.02 240)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontFamily: "Satoshi", fontSize: 12 }}
                />
                <YAxis tick={{ fontFamily: "Satoshi", fontSize: 12 }} />
                <RechartTooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid oklch(0.88 0.02 240)",
                    fontFamily: "Satoshi",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "revenue"
                      ? `₹${value.toLocaleString("en-IN")}`
                      : value,
                    name === "revenue" ? "Revenue" : "Orders",
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  fill="oklch(0.52 0.19 252)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="orders"
                  fill="oklch(0.72 0.16 212)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tabs: Orders, Inquiries, Products */}
        <Tabs defaultValue="orders">
          <TabsList className="mb-6 bg-secondary" data-ocid="admin.tab">
            <TabsTrigger
              value="orders"
              className="font-display"
              data-ocid="admin.orders.tab"
            >
              Orders ({orders?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="inquiries"
              className="font-display"
              data-ocid="admin.inquiries.tab"
            >
              Inquiries ({inquiries?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="font-display"
              data-ocid="admin.products.tab"
            >
              Products ({products?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  All Orders
                </h3>
              </div>
              {ordersLoading ? (
                <div
                  className="p-8 space-y-3"
                  data-ocid="admin.orders.loading_state"
                >
                  {Array.from({ length: 4 }, (_, i) => i).map((i) => (
                    <Skeleton key={`skel-${i}`} className="h-12 w-full" />
                  ))}
                </div>
              ) : !orders || orders.length === 0 ? (
                <div
                  className="p-10 text-center"
                  data-ocid="admin.orders.empty_state"
                >
                  <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <p className="font-display text-muted-foreground">
                    No orders yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Order ID
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Customer
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Phone
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Product
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Qty
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Address
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Description
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Status
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Date
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order, idx) => (
                        <TableRow
                          key={order.id}
                          data-ocid={`admin.orders.item.${idx + 1}`}
                          className="hover:bg-secondary/30 transition-colors"
                        >
                          <TableCell className="font-display text-xs text-muted-foreground max-w-24 truncate">
                            {order.id.slice(0, 12)}...
                          </TableCell>
                          <TableCell className="font-display font-medium text-sm">
                            {order.customerName}
                          </TableCell>
                          <TableCell className="font-display text-sm">
                            {order.phone}
                          </TableCell>
                          <TableCell className="font-display text-sm max-w-32 truncate">
                            {order.productId.slice(0, 15)}...
                          </TableCell>
                          <TableCell className="font-display text-sm">
                            {Number(order.quantity)}
                          </TableCell>
                          <TableCell className="font-display text-sm max-w-32 truncate text-muted-foreground">
                            {order.address}
                          </TableCell>
                          <TableCell className="font-display text-sm max-w-32 truncate text-muted-foreground">
                            {order.specialDescription || "—"}
                          </TableCell>
                          <TableCell>
                            <Select
                              defaultValue={order.status}
                              onValueChange={(v) =>
                                handleStatusUpdate(order.id, v)
                              }
                            >
                              <SelectTrigger
                                className="h-8 text-xs font-display w-32"
                                data-ocid={`admin.orders.select.${idx + 1}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
                                data-ocid={`admin.orders.dropdown_menu.${idx + 1}`}
                              >
                                {[
                                  { value: "pending", label: "Pending" },
                                  {
                                    value: "confirmed",
                                    label: "Confirmed / Order Accepted",
                                  },
                                  { value: "delivered", label: "Delivered" },
                                  { value: "cancelled", label: "Cancelled" },
                                ].map((s) => (
                                  <SelectItem
                                    key={s.value}
                                    value={s.value}
                                    className="font-display text-xs"
                                  >
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="font-display text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(order.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  Customer Inquiries
                </h3>
              </div>
              {inquiriesLoading ? (
                <div
                  className="p-8 space-y-3"
                  data-ocid="admin.inquiries.loading_state"
                >
                  {Array.from({ length: 3 }, (_, i) => i).map((i) => (
                    <Skeleton key={`skel-${i}`} className="h-12 w-full" />
                  ))}
                </div>
              ) : !inquiries || inquiries.length === 0 ? (
                <div
                  className="p-10 text-center"
                  data-ocid="admin.inquiries.empty_state"
                >
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <p className="font-display text-muted-foreground">
                    No inquiries yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Name
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Phone
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Message
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Date
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inquiries.map((inq, idx) => (
                        <TableRow
                          key={`${inq.name}-${inq.phone}-${inq.timestamp}`}
                          data-ocid={`admin.inquiries.item.${idx + 1}`}
                          className="hover:bg-secondary/30 transition-colors"
                        >
                          <TableCell className="font-display font-medium text-sm">
                            {inq.name}
                          </TableCell>
                          <TableCell className="font-display text-sm">
                            {inq.phone}
                          </TableCell>
                          <TableCell className="font-display text-sm max-w-xs">
                            <span className="line-clamp-2">{inq.message}</span>
                          </TableCell>
                          <TableCell className="font-display text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(inq.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  Product Management
                </h3>
                <Button
                  onClick={openCreateDialog}
                  className="btn-ocean h-9 rounded-lg font-display text-sm"
                  data-ocid="admin.products.open_modal_button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>

              {productsLoading ? (
                <div
                  className="p-8 space-y-3"
                  data-ocid="admin.products.loading_state"
                >
                  {Array.from({ length: 4 }, (_, i) => i).map((i) => (
                    <Skeleton key={`skel-${i}`} className="h-12 w-full" />
                  ))}
                </div>
              ) : !products || products.length === 0 ? (
                <div
                  className="p-10 text-center"
                  data-ocid="admin.products.empty_state"
                >
                  <Package className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <p className="font-display text-muted-foreground">
                    No products yet. Add your first product.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Image
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Name
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Manufacturer
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Category
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Price
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Stock
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Status
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product, idx) => (
                        <TableRow
                          key={product.id}
                          data-ocid={`admin.products.item.${idx + 1}`}
                          className="hover:bg-secondary/30 transition-colors"
                        >
                          <TableCell>
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-display font-medium text-sm max-w-40 truncate">
                            {product.name}
                          </TableCell>
                          <TableCell className="font-display text-sm text-muted-foreground">
                            {product.manufacturer}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="font-display text-xs"
                            >
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-display font-semibold text-sm text-ocean-blue">
                            {formatPrice(product.price)}
                          </TableCell>
                          <TableCell className="font-display text-sm">
                            {Number(product.stockQuantity)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                product.isAvailable
                                  ? "bg-green-100 text-green-700 border-0 text-xs font-display"
                                  : "bg-red-100 text-red-700 border-0 text-xs font-display"
                              }
                            >
                              {product.isAvailable
                                ? "Available"
                                : "Unavailable"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => openEditDialog(product)}
                                data-ocid={`admin.products.edit_button.${idx + 1}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                                    data-ocid={`admin.products.delete_button.${idx + 1}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent data-ocid="admin.products.dialog">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-heading">
                                      Delete Product?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="font-display">
                                      Are you sure you want to delete "
                                      {product.name}"? This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel
                                      className="font-display"
                                      data-ocid="admin.products.cancel_button"
                                    >
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteProduct(product.id)
                                      }
                                      className="bg-destructive text-destructive-foreground font-display"
                                      data-ocid="admin.products.confirm_button"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Add/Edit Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="admin.products.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div>
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Samsung Galaxy S24"
                className="font-display h-11"
                data-ocid="admin.products.input"
              />
            </div>
            <div>
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Manufacturer <span className="text-destructive">*</span>
              </Label>
              <Input
                value={productForm.manufacturer}
                onChange={(e) =>
                  setProductForm((p) => ({
                    ...p,
                    manufacturer: e.target.value,
                  }))
                }
                placeholder="Samsung"
                className="font-display h-11"
                data-ocid="admin.products.input"
              />
            </div>
            <div>
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Category <span className="text-destructive">*</span>
              </Label>
              <Input
                value={productForm.category}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, category: e.target.value }))
                }
                placeholder="Smartphones"
                className="font-display h-11"
                data-ocid="admin.products.input"
              />
            </div>
            <div>
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Price (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                value={Number(productForm.price).toString()}
                onChange={(e) =>
                  setProductForm((p) => ({
                    ...p,
                    price: BigInt(Number.parseInt(e.target.value, 10) || 0),
                  }))
                }
                placeholder="15999"
                className="font-display h-11"
                data-ocid="admin.products.input"
              />
            </div>
            <div>
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Stock Quantity
              </Label>
              <Input
                type="number"
                value={Number(productForm.stockQuantity).toString()}
                onChange={(e) =>
                  setProductForm((p) => ({
                    ...p,
                    stockQuantity: BigInt(
                      Number.parseInt(e.target.value, 10) || 0,
                    ),
                  }))
                }
                placeholder="50"
                className="font-display h-11"
                data-ocid="admin.products.input"
              />
            </div>
            <div>
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Image URL
              </Label>
              <Input
                value={productForm.imageUrl}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, imageUrl: e.target.value }))
                }
                placeholder="https://..."
                className="font-display h-11"
                data-ocid="admin.products.input"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Description
              </Label>
              <Textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Product description..."
                className="font-display resize-none"
                rows={3}
                data-ocid="admin.products.textarea"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Additional Details
              </Label>
              <Textarea
                value={productForm.additionalDetails}
                onChange={(e) =>
                  setProductForm((p) => ({
                    ...p,
                    additionalDetails: e.target.value,
                  }))
                }
                placeholder="Specifications, warranty info, etc."
                className="font-display resize-none"
                rows={3}
                data-ocid="admin.products.textarea"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAvailable"
                checked={productForm.isAvailable}
                onChange={(e) =>
                  setProductForm((p) => ({
                    ...p,
                    isAvailable: e.target.checked,
                  }))
                }
                data-ocid="admin.products.checkbox"
                className="h-4 w-4 rounded border-border"
              />
              <Label
                htmlFor="isAvailable"
                className="font-display text-sm cursor-pointer"
              >
                Available for purchase
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setProductDialogOpen(false)}
              className="font-display"
              data-ocid="admin.products.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProductSubmit}
              className="btn-ocean font-display"
              disabled={createProduct.isPending || updateProduct.isPending}
              data-ocid="admin.products.save_button"
            >
              {createProduct.isPending || updateProduct.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingProduct ? (
                "Save Changes"
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
