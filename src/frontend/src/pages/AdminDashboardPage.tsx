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
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  KeyRound,
  Loader2,
  LogOut,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  QrCode,
  Save,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
import type { Order, OrderStatus, Product } from "../backend.d";
import {
  useCreateProduct,
  useDeleteProduct,
  useGetAllInquiries,
  useGetAllOrders,
  useGetAllProducts,
  useGetMonthlySalesSummary,
  useGetOrdersCountByStatus,
  useGetRecentOrders,
  useGetTopSellingProducts,
  useGetTotalOrdersCount,
  useGetTotalRevenue,
  useUpdateOrderCourierInfo,
  useUpdateOrderStatus,
  useUpdateProduct,
} from "../hooks/useQueries";
import {
  type AdminCredentials,
  DEFAULT_STORE_SETTINGS,
  type OrderComplaint,
  type OrderFeedback,
  type OrderOverride,
  type ProductProfitEntry,
  type StoreSettings,
  getAdminCredentials,
  getComplaints,
  getCourierInfos,
  getEstimatedDeliveries,
  getFeedbacks,
  getOrderOverrides,
  getProfitData,
  getStoreSettings,
  saveAdminCredentials,
  saveComplaint,
  saveCourierInfo,
  saveEstimatedDelivery,
  saveOrderOverride,
  saveProfitEntry,
  saveStoreSettings,
} from "../utils/storeSettings";

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
  shipped: "bg-indigo-100 text-indigo-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
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

function formatDateMs(ms: number): string {
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

  // Check localStorage auth first
  const isAuthed = localStorage.getItem("owAdmin") === "1";

  // Data queries
  const { data: orders, isLoading: ordersLoading } = useGetAllOrders();
  const { data: products, isLoading: productsLoading } = useGetAllProducts();
  const { data: inquiries, isLoading: inquiriesLoading } = useGetAllInquiries();
  const { data: totalOrders } = useGetTotalOrdersCount();
  const { data: totalRevenue } = useGetTotalRevenue();
  const { data: ordersByStatus } = useGetOrdersCountByStatus();
  const { data: monthlySales } = useGetMonthlySalesSummary();
  const { data: topSellingProducts } = useGetTopSellingProducts(BigInt(5));
  const { data: recentOrders } = useGetRecentOrders(BigInt(5));

  // Mutations
  const updateStatus = useUpdateOrderStatus();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateCourierInfo = useUpdateOrderCourierInfo();
  const qc = useQueryClient();

  // Product form state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] =
    useState<Omit<Product, "id">>(emptyProduct);

  // Order edit state
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderForm, setOrderForm] = useState<OrderOverride>({});
  const [orderCourierName, setOrderCourierName] = useState("");
  const [orderCourierTracking, setOrderCourierTracking] = useState("");
  const [orderEstDelivery, setOrderEstDelivery] = useState("");
  const [orderOverrides, setOrderOverrides] = useState<
    Record<string, OrderOverride>
  >(() => getOrderOverrides());

  // Store settings state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(() =>
    getStoreSettings(),
  );
  const [settingsSaving, setSettingsSaving] = useState(false);
  const qrFileRef = useRef<HTMLInputElement>(null);
  const productImageFileRef = useRef<HTMLInputElement>(null);
  const heroImageFileRef = useRef<HTMLInputElement>(null);

  // Admin credentials state
  const [credForm, setCredForm] = useState<AdminCredentials>(() =>
    getAdminCredentials(),
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCredPasswords, setShowCredPasswords] = useState(false);
  const [credSaving, setCredSaving] = useState(false);

  // Orders section expand/collapse per status
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({ pending: true });

  // Clear all orders dialog state
  const [clearOrdersDialogOpen, setClearOrdersDialogOpen] = useState(false);
  const [clearOrdersPassword, setClearOrdersPassword] = useState("");

  // Feedback + complaints (from localStorage)
  const [feedbacks, _setFeedbacks] = useState<Record<string, OrderFeedback>>(
    () => getFeedbacks(),
  );
  const [complaints, setComplaints] = useState<Record<string, OrderComplaint>>(
    () => getComplaints(),
  );

  // Profit tracker state
  const [profitData, setProfitData] = useState<
    Record<string, ProductProfitEntry>
  >(() => getProfitData());
  // Local edits to profit rows (not yet saved)
  const [profitEdits, setProfitEdits] = useState<
    Record<string, Partial<ProductProfitEntry>>
  >({});

  useEffect(() => {
    if (!isAuthed) {
      navigate({ to: "/admin" });
    }
  }, [isAuthed, navigate]);

  if (!isAuthed) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("owAdmin");
    navigate({ to: "/admin" });
  };

  function handleClearAllOrders() {
    const creds = getAdminCredentials();
    if (clearOrdersPassword !== creds.password) {
      toast.error("Incorrect password. Orders not cleared.");
      setClearOrdersPassword("");
      return;
    }
    localStorage.removeItem("ow_local_orders");
    qc.invalidateQueries({ queryKey: ["allOrders"] });
    toast.success("All orders have been permanently deleted.");
    setClearOrdersDialogOpen(false);
    setClearOrdersPassword("");
  }

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
      toast.error("Failed to save product. Please try again.");
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

  // Order edit handlers
  function openOrderEditDialog(order: Order) {
    setEditingOrder(order);
    const override = orderOverrides[order.id] ?? {};
    const courierInfos = getCourierInfos();
    const existing = courierInfos[order.id];
    const estDeliveries = getEstimatedDeliveries();
    setOrderForm({
      customerName: override.customerName ?? order.customerName,
      phone: override.phone ?? order.phone,
      address: override.address ?? order.address,
      quantity: override.quantity ?? order.quantity,
      specialDescription:
        override.specialDescription ?? order.specialDescription,
    });
    setOrderCourierName(existing?.courierName ?? order.courierName ?? "");
    setOrderCourierTracking(
      existing?.courierTrackingNumber ?? order.courierTrackingNumber ?? "",
    );
    setOrderEstDelivery(estDeliveries[order.id] ?? "");
    setOrderDialogOpen(true);
  }

  async function handleOrderEditSave() {
    if (!editingOrder) return;
    saveOrderOverride(editingOrder.id, orderForm);
    setOrderOverrides(getOrderOverrides());

    // Save estimated delivery date
    if (orderEstDelivery) {
      saveEstimatedDelivery(editingOrder.id, orderEstDelivery);
    }

    // Save courier info to localStorage
    if (orderCourierName || orderCourierTracking) {
      saveCourierInfo(editingOrder.id, {
        courierName: orderCourierName,
        courierTrackingNumber: orderCourierTracking,
      });
    }

    // Update courier info in backend if provided
    if (orderCourierName && orderCourierTracking) {
      try {
        await updateCourierInfo.mutateAsync({
          orderId: editingOrder.id,
          courierName: orderCourierName,
          courierTrackingNumber: orderCourierTracking,
        });
      } catch {
        // courier info saved locally even if backend fails
      }
    }

    setOrderDialogOpen(false);
    toast.success("Order details updated successfully");
  }

  // Get merged order data (backend + localStorage overrides)
  function getMergedOrder(order: Order): Order & { quantity: bigint } {
    const override = orderOverrides[order.id] ?? {};
    return {
      ...order,
      customerName: override.customerName ?? order.customerName,
      phone: override.phone ?? order.phone,
      address: override.address ?? order.address,
      quantity: override.quantity ?? order.quantity,
      specialDescription:
        override.specialDescription ?? order.specialDescription,
    };
  }

  // Settings save handler
  function handleSettingsSave() {
    setSettingsSaving(true);
    try {
      saveStoreSettings(settingsForm);
      toast.success("Store settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSettingsSaving(false);
    }
  }

  // Admin credentials save handler
  function handleCredentialsSave() {
    if (!credForm.username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      saveAdminCredentials({
        username: credForm.username.trim(),
        password: newPassword,
      });
      setNewPassword("");
      setConfirmPassword("");
    } else {
      saveAdminCredentials({
        ...getAdminCredentials(),
        username: credForm.username.trim(),
      });
    }
    setCredSaving(true);
    setTimeout(() => setCredSaving(false), 600);
    toast.success(
      "Login credentials updated. Please log in again with new credentials.",
    );
  }

  // QR file upload
  function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setSettingsForm((p) => ({ ...p, paymentQrBase64: result }));
    };
    reader.readAsDataURL(file);
  }

  // Hero image upload handler
  function handleHeroImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const updated = { ...settingsForm, heroImageBase64: result };
      setSettingsForm(updated);
      saveStoreSettings(updated);
      toast.success("Hero background image updated!");
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  // Product image upload handler
  function handleProductImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setProductForm((p) => ({ ...p, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  }

  // Complaint status toggle
  function toggleComplaintStatus(orderId: string) {
    const existing = complaints[orderId];
    if (!existing) return;
    const updated: OrderComplaint = {
      ...existing,
      status: existing.status === "open" ? "resolved" : "open",
    };
    saveComplaint(updated);
    setComplaints(getComplaints());
    toast.success(
      `Complaint marked as ${updated.status === "open" ? "open" : "resolved"}`,
    );
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

  const feedbackList = Object.values(feedbacks);
  const complaintList = Object.values(complaints);

  // ── Profit Tracker helpers ────────────────────────────────────
  function getProfitEntry(
    productId: string,
    productName: string,
    sellPrice: number,
  ): ProductProfitEntry {
    const saved = profitData[productId];
    const edits = profitEdits[productId] ?? {};
    return {
      productId,
      productName,
      costPrice: edits.costPrice ?? saved?.costPrice ?? 0,
      sellPrice: edits.sellPrice ?? saved?.sellPrice ?? sellPrice,
      labourCharges: edits.labourCharges ?? saved?.labourCharges ?? 0,
    };
  }

  function handleProfitEdit(
    productId: string,
    field: keyof ProductProfitEntry,
    value: number | string,
  ) {
    setProfitEdits((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]:
          typeof value === "string" ? Number.parseFloat(value) || 0 : value,
      },
    }));
  }

  function handleProfitSave(entry: ProductProfitEntry) {
    saveProfitEntry(entry);
    setProfitData(getProfitData());
    // Clear edits for this product
    setProfitEdits((prev) => {
      const next = { ...prev };
      delete next[entry.productId];
      return next;
    });
    toast.success(`Profit data saved for ${entry.productName}`);
  }

  // Calculate total profit metrics from orders + profit data
  const totalRevenueNum = totalRevenue !== undefined ? Number(totalRevenue) : 0;

  const totalCostEstimate = (products ?? []).reduce((sum, p) => {
    const entry = profitData[p.id];
    if (!entry) return sum;
    // Find how many of this product were sold from orders
    const soldQty = (orders ?? [])
      .filter((o) => o.productId === p.id && o.status !== "cancelled")
      .reduce((s, o) => s + Number(o.quantity), 0);
    return sum + (entry.costPrice + entry.labourCharges) * soldQty;
  }, 0);

  const totalProfitEstimate = totalRevenueNum - totalCostEstimate;
  const profitMarginPct =
    totalRevenueNum > 0
      ? ((totalProfitEstimate / totalRevenueNum) * 100).toFixed(1)
      : "0.0";

  // Build monthly profit chart data
  const profitChartData = (monthlySales ?? [])
    .sort((a, b) => {
      const yearDiff = Number(a.year) - Number(b.year);
      return yearDiff !== 0 ? yearDiff : Number(a.month) - Number(b.month);
    })
    .slice(-6)
    .map((s) => {
      const rev = Number(s.revenue);
      // Rough cost per month: totalCostEstimate / total sold * this month's orders
      const orderCount = Number(s.orderCount);
      const avgCostPerOrder =
        totalRevenueNum > 0 && (orders ?? []).length > 0
          ? totalCostEstimate / Math.max((orders ?? []).length, 1)
          : 0;
      const costEst = avgCostPerOrder * orderCount;
      return {
        name: `${MONTHS[Number(s.month) - 1]} '${String(Number(s.year)).slice(2)}`,
        revenue: rev,
        cost: Math.round(costEst),
        profit: Math.round(rev - costEst),
      };
    });

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
              Bhawna Paneru
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "shipped", label: "Shipped" },
            { value: "out_for_delivery", label: "Out for Delivery" },
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

        {/* Two-column: Chart + Recent/Top Selling */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Sales Chart */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-card p-6">
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

          {/* Right column: Top Selling + Recent Orders */}
          <div className="flex flex-col gap-4">
            {/* Top Selling Products */}
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-ocean-blue" />
                <h3 className="font-heading font-semibold text-sm text-foreground">
                  Top Selling Products
                </h3>
              </div>
              {!topSellingProducts || topSellingProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground font-display text-center py-4">
                  No sales data yet
                </p>
              ) : (
                <div className="space-y-2">
                  {topSellingProducts.map((ps, idx) => (
                    <div
                      key={ps.productId}
                      className="flex items-center gap-3"
                      data-ocid={`admin.top_selling.item.${idx + 1}`}
                    >
                      <span className="text-xs font-heading font-bold text-muted-foreground w-4">
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display font-medium text-foreground truncate">
                          {ps.productName}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs font-display shrink-0"
                      >
                        {Number(ps.totalQuantity)} sold
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-card rounded-xl border border-border shadow-card p-5 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-4 w-4 text-ocean-blue" />
                <h3 className="font-heading font-semibold text-sm text-foreground">
                  Recent Orders
                </h3>
              </div>
              {!recentOrders || recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground font-display text-center py-4">
                  No recent orders
                </p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order, idx) => (
                    <div
                      key={order.id}
                      className="flex items-start gap-2"
                      data-ocid={`admin.recent_orders.item.${idx + 1}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display font-medium text-foreground truncate">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground font-display truncate">
                          {order.productId.slice(0, 12)}...
                        </p>
                      </div>
                      <Badge
                        className={`text-xs font-display border-0 shrink-0 ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders">
          <TabsList
            className="mb-6 bg-secondary flex-wrap h-auto gap-1"
            data-ocid="admin.tab"
          >
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
            <TabsTrigger
              value="settings"
              className="font-display"
              data-ocid="admin.settings.tab"
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="feedback"
              className="font-display"
              data-ocid="admin.feedback.tab"
            >
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Feedback ({feedbackList.length})
            </TabsTrigger>
            <TabsTrigger
              value="complaints"
              className="font-display"
              data-ocid="admin.complaints.tab"
            >
              Complaints ({complaintList.length})
            </TabsTrigger>
            <TabsTrigger
              value="profit"
              className="font-display"
              data-ocid="admin.profit.tab"
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Profit Tracker
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  All Orders
                </h3>
                <Button
                  variant="destructive"
                  size="sm"
                  className="font-display gap-2"
                  onClick={() => {
                    setClearOrdersPassword("");
                    setClearOrdersDialogOpen(true);
                  }}
                  data-ocid="admin.orders.delete_button"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All Orders
                </Button>
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
                (() => {
                  const orderTableHeaders = (
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
                        Courier
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider">
                        Date
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wider">
                        Edit
                      </TableHead>
                    </TableRow>
                  );

                  const renderOrderRow = (
                    order: Order,
                    idx: number,
                    isCompleted = false,
                  ) => {
                    const merged = getMergedOrder(order);
                    const courierInfos = getCourierInfos();
                    const courier =
                      courierInfos[order.id] ??
                      (order.courierName
                        ? {
                            courierName: order.courierName,
                            courierTrackingNumber:
                              order.courierTrackingNumber ?? "",
                          }
                        : null);
                    return (
                      <TableRow
                        key={order.id}
                        data-ocid={`admin.orders.item.${idx + 1}`}
                        className={
                          isCompleted
                            ? "bg-green-50/40 hover:bg-green-50/60 transition-colors"
                            : "hover:bg-secondary/30 transition-colors"
                        }
                      >
                        <TableCell className="font-display text-xs text-muted-foreground max-w-24 truncate">
                          {isCompleted && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-1 inline-block" />
                          )}
                          {order.id.slice(0, 12)}...
                        </TableCell>
                        <TableCell className="font-display font-medium text-sm">
                          {merged.customerName}
                        </TableCell>
                        <TableCell className="font-display text-sm">
                          {merged.phone}
                        </TableCell>
                        <TableCell className="font-display text-sm max-w-32 truncate">
                          {order.productId.slice(0, 15)}...
                        </TableCell>
                        <TableCell className="font-display text-sm">
                          {Number(merged.quantity)}
                        </TableCell>
                        <TableCell className="font-display text-sm max-w-32 truncate text-muted-foreground">
                          {merged.address}
                        </TableCell>
                        <TableCell className="font-display text-xs max-w-24 truncate text-muted-foreground">
                          {courier ? (
                            <span>
                              {courier.courierName}
                              {courier.courierTrackingNumber
                                ? ` (${courier.courierTrackingNumber.slice(0, 8)}…)`
                                : ""}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={order.status}
                            onValueChange={(v) =>
                              handleStatusUpdate(order.id, v)
                            }
                          >
                            <SelectTrigger
                              className="h-8 text-xs font-display w-36"
                              data-ocid={`admin.orders.select.${idx + 1}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                              data-ocid={`admin.orders.dropdown_menu.${idx + 1}`}
                            >
                              {[
                                { value: "pending", label: "Pending" },
                                { value: "confirmed", label: "Confirmed" },
                                { value: "shipped", label: "Shipped" },
                                {
                                  value: "out_for_delivery",
                                  label: "Out for Delivery",
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
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => openOrderEditDialog(order)}
                            data-ocid={`admin.orders.edit_button.${idx + 1}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  };

                  // Status-grouped sections config
                  const STATUS_SECTIONS = [
                    {
                      key: "pending",
                      label: "Pending",
                      headerBg: "bg-yellow-50",
                      textColor: "text-yellow-800",
                      iconColor: "text-yellow-600",
                      icon: <ShoppingBag className="h-4 w-4 text-yellow-600" />,
                    },
                    {
                      key: "confirmed",
                      label: "Confirmed",
                      headerBg: "bg-blue-50",
                      textColor: "text-blue-800",
                      iconColor: "text-blue-600",
                      icon: <CheckCircle2 className="h-4 w-4 text-blue-600" />,
                    },
                    {
                      key: "shipped",
                      label: "Shipped",
                      headerBg: "bg-indigo-50",
                      textColor: "text-indigo-800",
                      iconColor: "text-indigo-600",
                      icon: <Package className="h-4 w-4 text-indigo-600" />,
                    },
                    {
                      key: "out_for_delivery",
                      label: "Out for Delivery",
                      headerBg: "bg-orange-50",
                      textColor: "text-orange-800",
                      iconColor: "text-orange-600",
                      icon: <TrendingUp className="h-4 w-4 text-orange-600" />,
                    },
                    {
                      key: "delivered",
                      label: "Delivered",
                      headerBg: "bg-green-50",
                      textColor: "text-green-800",
                      iconColor: "text-green-600",
                      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
                    },
                    {
                      key: "cancelled",
                      label: "Cancelled",
                      headerBg: "bg-red-50",
                      textColor: "text-red-800",
                      iconColor: "text-red-600",
                      icon: <X className="h-4 w-4 text-red-600" />,
                    },
                  ];

                  return (
                    <div className="divide-y divide-border">
                      {STATUS_SECTIONS.map((section) => {
                        const sectionOrders = orders.filter(
                          (o) => o.status === section.key,
                        );
                        if (sectionOrders.length === 0) return null;
                        const isExpanded =
                          expandedSections[section.key] ?? false;
                        return (
                          <div key={section.key}>
                            <button
                              type="button"
                              className={`w-full flex items-center justify-between px-5 py-3 ${section.headerBg} hover:brightness-95 transition-all text-left`}
                              onClick={() =>
                                setExpandedSections((prev) => ({
                                  ...prev,
                                  [section.key]: !prev[section.key],
                                }))
                              }
                              data-ocid={`admin.orders.${section.key}.toggle`}
                            >
                              <div className="flex items-center gap-2">
                                {section.icon}
                                <span
                                  className={`font-display font-semibold text-sm ${section.textColor}`}
                                >
                                  {section.label} ({sectionOrders.length})
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp
                                  className={`h-4 w-4 ${section.iconColor}`}
                                />
                              ) : (
                                <ChevronDown
                                  className={`h-4 w-4 ${section.iconColor}`}
                                />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>{orderTableHeaders}</TableHeader>
                                  <TableBody>
                                    {sectionOrders.map((order, idx) =>
                                      renderOrderRow(
                                        order,
                                        idx,
                                        section.key === "delivered",
                                      ),
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
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

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-border flex items-center gap-3">
                <Settings className="h-5 w-5 text-ocean-blue" />
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  Store Settings
                </h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground font-display mb-6">
                  Update your store's contact information and payment methods.
                </p>

                {/* Contact Info */}
                <h4 className="font-heading font-semibold text-base mb-4 text-foreground">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mb-8">
                  <div>
                    <Label className="font-display text-sm font-medium mb-1.5 block">
                      Phone Number
                    </Label>
                    <Input
                      value={settingsForm.phone}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          phone: e.target.value,
                        }))
                      }
                      placeholder={DEFAULT_STORE_SETTINGS.phone}
                      className="font-display h-11"
                      data-ocid="admin.settings.phone.input"
                    />
                  </div>
                  <div>
                    <Label className="font-display text-sm font-medium mb-1.5 block">
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          email: e.target.value,
                        }))
                      }
                      placeholder={DEFAULT_STORE_SETTINGS.email}
                      className="font-display h-11"
                      data-ocid="admin.settings.email.input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="font-display text-sm font-medium mb-1.5 block">
                      Full Address
                    </Label>
                    <Input
                      value={settingsForm.address}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          address: e.target.value,
                        }))
                      }
                      placeholder={DEFAULT_STORE_SETTINGS.address}
                      className="font-display h-11"
                      data-ocid="admin.settings.address.input"
                    />
                  </div>
                  <div>
                    <Label className="font-display text-sm font-medium mb-1.5 block">
                      WhatsApp Number{" "}
                      <span className="text-muted-foreground font-normal ml-1">
                        (digits only)
                      </span>
                    </Label>
                    <Input
                      value={settingsForm.whatsapp}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          whatsapp: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      placeholder={DEFAULT_STORE_SETTINGS.whatsapp}
                      className="font-display h-11"
                      data-ocid="admin.settings.whatsapp.input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="font-display text-sm font-medium mb-1.5 block">
                      Business Hours
                    </Label>
                    <Textarea
                      value={settingsForm.businessHours}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          businessHours: e.target.value,
                        }))
                      }
                      placeholder={DEFAULT_STORE_SETTINGS.businessHours}
                      className="font-display resize-none"
                      rows={3}
                      data-ocid="admin.settings.business_hours.textarea"
                    />
                  </div>
                </div>

                {/* Hero Background Image */}
                <div className="border-t border-border pt-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Upload className="h-5 w-5 text-ocean-blue" />
                    <h4 className="font-heading font-semibold text-base text-foreground">
                      Hero Background Image
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground font-display mb-4">
                    Upload a custom background image for the website's hero
                    section on the home page.
                  </p>
                  <div className="flex items-start gap-6 flex-wrap">
                    <div className="flex flex-col gap-2">
                      <img
                        src={
                          settingsForm.heroImageBase64 ||
                          "/assets/generated/hero-electronics.dim_1400x600.jpg"
                        }
                        alt="Hero background preview"
                        className="w-[200px] h-[100px] object-cover rounded-lg border border-border"
                      />
                      <p className="text-xs text-muted-foreground font-display">
                        Current hero image
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        ref={heroImageFileRef}
                        onChange={handleHeroImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => heroImageFileRef.current?.click()}
                        className="font-display h-11 border-ocean-blue text-ocean-blue hover:bg-ocean-light"
                        data-ocid="settings.hero_image.upload_button"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Image
                      </Button>
                      {settingsForm.heroImageBase64 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive font-display justify-start"
                          onClick={() => {
                            const updated = {
                              ...settingsForm,
                              heroImageBase64: "",
                            };
                            setSettingsForm(updated);
                            saveStoreSettings(updated);
                            toast.success(
                              "Hero image removed. Default image restored.",
                            );
                          }}
                          data-ocid="settings.hero_image.delete_button"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove Custom Image
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground font-display">
                        Recommended: 1400×600px or wider
                        <br />
                        Formats: JPG, PNG, WebP
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="border-t border-border pt-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <QrCode className="h-5 w-5 text-ocean-blue" />
                    <h4 className="font-heading font-semibold text-base text-foreground">
                      Payment Methods
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground font-display mb-4">
                    Set up UPI payment details so customers can pay easily.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                    <div>
                      <Label className="font-display text-sm font-medium mb-1.5 block">
                        UPI ID
                      </Label>
                      <Input
                        value={settingsForm.paymentUpiId}
                        onChange={(e) =>
                          setSettingsForm((p) => ({
                            ...p,
                            paymentUpiId: e.target.value,
                          }))
                        }
                        placeholder="oceanworld@upi"
                        className="font-display h-11"
                        data-ocid="admin.settings.upi_id.input"
                      />
                    </div>
                    <div>
                      <Label className="font-display text-sm font-medium mb-1.5 block">
                        UPI Phone Number
                      </Label>
                      <Input
                        value={settingsForm.paymentUpiPhone}
                        onChange={(e) =>
                          setSettingsForm((p) => ({
                            ...p,
                            paymentUpiPhone: e.target.value,
                          }))
                        }
                        placeholder="+91 98765 43210"
                        className="font-display h-11"
                        data-ocid="admin.settings.upi_phone.input"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="font-display text-sm font-medium mb-1.5 block">
                        QR Code Image
                      </Label>
                      <div className="flex items-start gap-4">
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            ref={qrFileRef}
                            onChange={handleQrUpload}
                            className="hidden"
                            data-ocid="admin.settings.upload_button"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => qrFileRef.current?.click()}
                            className="font-display h-11"
                            data-ocid="admin.settings.upload_button"
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            Upload QR Code
                          </Button>
                          <p className="text-xs text-muted-foreground font-display mt-1">
                            Upload your UPI QR code image
                          </p>
                        </div>
                        {settingsForm.paymentQrBase64 && (
                          <div className="flex flex-col items-center gap-1">
                            <img
                              src={settingsForm.paymentQrBase64}
                              alt="Payment QR Code"
                              className="w-[150px] h-[150px] object-contain border border-border rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-destructive font-display"
                              onClick={() =>
                                setSettingsForm((p) => ({
                                  ...p,
                                  paymentQrBase64: "",
                                }))
                              }
                            >
                              Remove QR
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change Login Credentials */}
                <div className="border-t border-border pt-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <KeyRound className="h-5 w-5 text-ocean-blue" />
                    <h4 className="font-heading font-semibold text-base text-foreground">
                      Change Login Credentials
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground font-display mb-4">
                    Update the admin username or password. Leave the password
                    fields blank to keep the current password.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mb-4">
                    <div className="sm:col-span-2">
                      <Label className="font-display text-sm font-medium mb-1.5 block">
                        Username
                      </Label>
                      <Input
                        value={credForm.username}
                        onChange={(e) =>
                          setCredForm((p) => ({
                            ...p,
                            username: e.target.value,
                          }))
                        }
                        placeholder="Admin username"
                        className="font-display h-11"
                        data-ocid="admin.settings.cred_username.input"
                      />
                    </div>
                    <div>
                      <Label className="font-display text-sm font-medium mb-1.5 block">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          type={showCredPasswords ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="font-display h-11 pr-10"
                          data-ocid="admin.settings.new_password.input"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowCredPasswords((v) => !v)}
                          data-ocid="admin.settings.toggle"
                        >
                          {showCredPasswords ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="font-display text-sm font-medium mb-1.5 block">
                        Confirm New Password
                      </Label>
                      <Input
                        type={showCredPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="font-display h-11"
                        data-ocid="admin.settings.confirm_password.input"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCredentialsSave}
                    variant="outline"
                    className="font-display border-ocean-blue text-ocean-blue hover:bg-ocean-light"
                    disabled={credSaving}
                    data-ocid="admin.settings.cred_save_button"
                  >
                    {credSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4 mr-2" />
                        Update Credentials
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSettingsSave}
                    className="btn-ocean font-display"
                    disabled={settingsSaving}
                    data-ocid="admin.settings.save_button"
                  >
                    {settingsSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSettingsForm(getStoreSettings())}
                    className="font-display"
                    data-ocid="admin.settings.cancel_button"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  Customer Feedback
                </h3>
              </div>
              {feedbackList.length === 0 ? (
                <div
                  className="p-10 text-center"
                  data-ocid="admin.feedback.empty_state"
                >
                  <Star className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <p className="font-display text-muted-foreground">
                    No feedback received yet
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
                          Rating
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Comment
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Date
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbackList
                        .sort((a, b) => b.submittedAt - a.submittedAt)
                        .map((fb, idx) => (
                          <TableRow
                            key={fb.orderId}
                            data-ocid={`admin.feedback.item.${idx + 1}`}
                            className="hover:bg-secondary/30 transition-colors"
                          >
                            <TableCell className="font-display text-xs text-muted-foreground">
                              {fb.orderId.slice(0, 12)}...
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <Star
                                    key={`admin-fb-star-${n}`}
                                    className={`h-4 w-4 ${n <= fb.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
                                  />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="font-display text-sm max-w-xs">
                              <span className="line-clamp-2">
                                {fb.comment || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="font-display text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateMs(fb.submittedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Profit Tracker Tab */}
          <TabsContent value="profit">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Revenue",
                    value: `₹${totalRevenueNum.toLocaleString("en-IN")}`,
                    color: "text-green-600",
                    bg: "bg-green-50",
                    ocid: "admin.profit.revenue.card",
                  },
                  {
                    label: "Est. Total Cost",
                    value: `₹${totalCostEstimate.toLocaleString("en-IN")}`,
                    color: "text-orange-600",
                    bg: "bg-orange-50",
                    ocid: "admin.profit.cost.card",
                  },
                  {
                    label: "Est. Profit",
                    value: `₹${totalProfitEstimate.toLocaleString("en-IN")}`,
                    color:
                      totalProfitEstimate >= 0
                        ? "text-blue-600"
                        : "text-red-600",
                    bg: totalProfitEstimate >= 0 ? "bg-blue-50" : "bg-red-50",
                    ocid: "admin.profit.profit.card",
                  },
                  {
                    label: "Profit Margin",
                    value: `${profitMarginPct}%`,
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                    ocid: "admin.profit.margin.card",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    data-ocid={stat.ocid}
                    className="bg-card rounded-xl border border-border p-5 shadow-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground font-display">
                        {stat.label}
                      </span>
                      <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                        <TrendingUp className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </div>
                    <div
                      className={`font-heading font-bold text-2xl ${stat.color}`}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Monthly Profit Chart */}
              <div className="bg-card rounded-xl border border-border shadow-card p-6">
                <h3 className="font-heading font-bold text-lg text-foreground mb-6">
                  Monthly Revenue vs Cost
                </h3>
                {profitChartData.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-muted-foreground font-display">
                    No sales data available yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={profitChartData}
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
                          `₹${value.toLocaleString("en-IN")}`,
                          name === "revenue"
                            ? "Revenue"
                            : name === "cost"
                              ? "Est. Cost"
                              : "Est. Profit",
                        ]}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="oklch(0.52 0.19 252)"
                        radius={[4, 4, 0, 0]}
                        name="revenue"
                      />
                      <Bar
                        dataKey="cost"
                        fill="oklch(0.68 0.18 40)"
                        radius={[4, 4, 0, 0]}
                        name="cost"
                      />
                      <Bar
                        dataKey="profit"
                        fill="oklch(0.55 0.18 155)"
                        radius={[4, 4, 0, 0]}
                        name="profit"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div className="flex items-center gap-6 mt-3 justify-center">
                  {[
                    { color: "bg-[oklch(0.52_0.19_252)]", label: "Revenue" },
                    { color: "bg-[oklch(0.68_0.18_40)]", label: "Est. Cost" },
                    {
                      color: "bg-[oklch(0.55_0.18_155)]",
                      label: "Est. Profit",
                    },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                      <span className="text-xs font-display text-muted-foreground">
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products Profit Table */}
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-heading font-semibold text-lg text-foreground">
                    Product Profit Data
                  </h3>
                  <p className="text-sm text-muted-foreground font-display mt-1">
                    Enter cost price, sell price, and labour charges for each
                    product to track profits.
                  </p>
                </div>
                {!products || products.length === 0 ? (
                  <div
                    className="p-10 text-center"
                    data-ocid="admin.profit.empty_state"
                  >
                    <Package className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-3" />
                    <p className="font-display text-muted-foreground">
                      No products yet. Add products first.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50">
                          <TableHead className="font-display text-xs uppercase tracking-wider">
                            Product
                          </TableHead>
                          <TableHead className="font-display text-xs uppercase tracking-wider">
                            Sell Price
                          </TableHead>
                          <TableHead className="font-display text-xs uppercase tracking-wider">
                            Cost Price (₹)
                          </TableHead>
                          <TableHead className="font-display text-xs uppercase tracking-wider">
                            Labour (₹)
                          </TableHead>
                          <TableHead className="font-display text-xs uppercase tracking-wider">
                            Profit/Unit
                          </TableHead>
                          <TableHead className="font-display text-xs uppercase tracking-wider">
                            Units Sold
                          </TableHead>
                          <TableHead className="font-display text-xs uppercase tracking-wider">
                            Save
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(products ?? []).map((p, idx) => {
                          const entry = getProfitEntry(
                            p.id,
                            p.name,
                            Number(p.price),
                          );
                          const profitPerUnit =
                            entry.sellPrice -
                            entry.costPrice -
                            entry.labourCharges;
                          const soldQty = (orders ?? [])
                            .filter(
                              (o) =>
                                o.productId === p.id &&
                                o.status !== "cancelled",
                            )
                            .reduce((s, o) => s + Number(o.quantity), 0);
                          const hasEdits = !!profitEdits[p.id];

                          return (
                            <TableRow
                              key={p.id}
                              data-ocid={`admin.profit.item.${idx + 1}`}
                              className="hover:bg-secondary/30 transition-colors"
                            >
                              <TableCell className="font-display font-medium text-sm max-w-40">
                                <div className="flex items-center gap-2">
                                  {p.imageUrl && (
                                    <img
                                      src={p.imageUrl}
                                      alt={p.name}
                                      className="h-8 w-8 rounded-md object-cover shrink-0"
                                    />
                                  )}
                                  <span className="line-clamp-2 leading-snug">
                                    {p.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-display font-semibold text-sm text-ocean-blue">
                                {formatPrice(p.price)}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  value={entry.costPrice}
                                  onChange={(e) =>
                                    handleProfitEdit(
                                      p.id,
                                      "costPrice",
                                      e.target.value,
                                    )
                                  }
                                  className="font-display h-9 w-28 text-sm"
                                  placeholder="0"
                                  data-ocid={`admin.profit.cost.input.${idx + 1}`}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  value={entry.labourCharges}
                                  onChange={(e) =>
                                    handleProfitEdit(
                                      p.id,
                                      "labourCharges",
                                      e.target.value,
                                    )
                                  }
                                  className="font-display h-9 w-24 text-sm"
                                  placeholder="0"
                                  data-ocid={`admin.profit.labour.input.${idx + 1}`}
                                />
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`font-heading font-bold text-sm ${
                                    profitPerUnit >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {profitPerUnit >= 0 ? "+" : ""}₹
                                  {profitPerUnit.toLocaleString("en-IN")}
                                </span>
                              </TableCell>
                              <TableCell className="font-display text-sm text-center">
                                <Badge
                                  variant="secondary"
                                  className="font-display text-xs"
                                >
                                  {soldQty}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant={hasEdits ? "default" : "outline"}
                                  className={`h-8 font-display text-xs px-3 ${hasEdits ? "btn-ocean" : ""}`}
                                  onClick={() => handleProfitSave(entry)}
                                  data-ocid={`admin.profit.save_button.${idx + 1}`}
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  Complaints & Return Requests
                </h3>
              </div>
              {complaintList.length === 0 ? (
                <div
                  className="p-10 text-center"
                  data-ocid="admin.complaints.empty_state"
                >
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <p className="font-display text-muted-foreground">
                    No complaints filed yet
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
                          Reason
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
                        <TableHead className="font-display text-xs uppercase tracking-wider">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complaintList
                        .sort((a, b) => b.submittedAt - a.submittedAt)
                        .map((c, idx) => (
                          <TableRow
                            key={c.orderId}
                            data-ocid={`admin.complaints.item.${idx + 1}`}
                            className="hover:bg-secondary/30 transition-colors"
                          >
                            <TableCell className="font-display text-xs text-muted-foreground">
                              {c.orderId.slice(0, 12)}...
                            </TableCell>
                            <TableCell className="font-display text-sm font-medium">
                              {c.reason}
                            </TableCell>
                            <TableCell className="font-display text-sm max-w-xs">
                              <span className="line-clamp-2">
                                {c.description || "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  c.status === "open"
                                    ? "bg-red-100 text-red-700 border-0 text-xs font-display"
                                    : "bg-green-100 text-green-700 border-0 text-xs font-display"
                                }
                              >
                                {c.status === "open" ? "Open" : "Resolved"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-display text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateMs(c.submittedAt)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs font-display h-7 px-3"
                                onClick={() => toggleComplaintStatus(c.orderId)}
                              >
                                {c.status === "open"
                                  ? "Mark Resolved"
                                  : "Reopen"}
                              </Button>
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

      {/* Clear All Orders Dialog */}
      <AlertDialog
        open={clearOrdersDialogOpen}
        onOpenChange={setClearOrdersDialogOpen}
      >
        <AlertDialogContent data-ocid="admin.orders.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Sabhi Orders Delete Karein?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-display text-sm leading-relaxed">
              <strong>
                Ye action sabhi orders permanently delete kar dega.
              </strong>{" "}
              Isse undo nahi kiya ja sakta. (This will permanently delete ALL
              orders. This cannot be undone.)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="font-display text-sm font-medium mb-1.5 block">
              Confirm karne ke liye admin password darj karein:
            </Label>
            <Input
              type="password"
              placeholder="Admin password"
              value={clearOrdersPassword}
              onChange={(e) => setClearOrdersPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleClearAllOrders();
              }}
              className="font-display h-11"
              data-ocid="admin.orders.input"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="font-display"
              onClick={() => setClearOrdersPassword("")}
              data-ocid="admin.orders.cancel_button"
            >
              Ruk Jao (Cancel)
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllOrders}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display"
              data-ocid="admin.orders.confirm_button"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Haan, Sab Delete Karo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Edit Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-lg" data-ocid="admin.orders.modal">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Edit Order Details
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div>
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Customer Name
              </Label>
              <Input
                value={orderForm.customerName ?? ""}
                onChange={(e) =>
                  setOrderForm((p) => ({ ...p, customerName: e.target.value }))
                }
                placeholder="Customer name"
                className="font-display h-11"
                data-ocid="admin.orders.customer_name.input"
              />
            </div>
            <div>
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Mobile Number
              </Label>
              <Input
                value={orderForm.phone ?? ""}
                onChange={(e) =>
                  setOrderForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+91 98765 43210"
                className="font-display h-11"
                data-ocid="admin.orders.phone.input"
              />
            </div>
            <div>
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Quantity
              </Label>
              <Input
                type="number"
                min={1}
                value={
                  orderForm.quantity !== undefined
                    ? Number(orderForm.quantity)
                    : ""
                }
                onChange={(e) =>
                  setOrderForm((p) => ({
                    ...p,
                    quantity: BigInt(Number.parseInt(e.target.value, 10) || 1),
                  }))
                }
                placeholder="1"
                className="font-display h-11"
                data-ocid="admin.orders.quantity.input"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Delivery Address
              </Label>
              <Input
                value={orderForm.address ?? ""}
                onChange={(e) =>
                  setOrderForm((p) => ({ ...p, address: e.target.value }))
                }
                placeholder="Full delivery address"
                className="font-display h-11"
                data-ocid="admin.orders.address.input"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Special Description / Notes
              </Label>
              <Textarea
                value={orderForm.specialDescription ?? ""}
                onChange={(e) =>
                  setOrderForm((p) => ({
                    ...p,
                    specialDescription: e.target.value,
                  }))
                }
                placeholder="Any special instructions or notes..."
                className="font-display resize-none"
                rows={2}
                data-ocid="admin.orders.description.textarea"
              />
            </div>

            {/* Courier Info section */}
            <div className="sm:col-span-2 border-t border-border pt-4">
              <p className="text-sm font-display font-medium text-foreground mb-3">
                Courier Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-display text-sm font-medium mb-1.5 block">
                    Courier Partner
                  </Label>
                  <Input
                    value={orderCourierName}
                    onChange={(e) => setOrderCourierName(e.target.value)}
                    placeholder="e.g. Delhivery, Bluedart"
                    className="font-display h-11"
                    data-ocid="admin.orders.courier_name.input"
                  />
                </div>
                <div>
                  <Label className="font-display text-sm font-medium mb-1.5 block">
                    Tracking Number
                  </Label>
                  <Input
                    value={orderCourierTracking}
                    onChange={(e) => setOrderCourierTracking(e.target.value)}
                    placeholder="e.g. DL1234567890"
                    className="font-display h-11"
                    data-ocid="admin.orders.courier_tracking.input"
                  />
                </div>
              </div>
            </div>

            {/* Estimated Delivery Date */}
            <div className="sm:col-span-2 border-t border-border pt-4">
              <p className="text-sm font-display font-medium text-foreground mb-3">
                Estimated Delivery Date
              </p>
              <Input
                type="date"
                value={orderEstDelivery}
                onChange={(e) => setOrderEstDelivery(e.target.value)}
                className="font-display h-11 max-w-xs"
                data-ocid="admin.orders.est_delivery.input"
              />
              <p className="text-xs text-muted-foreground font-display mt-1">
                This will be shown to the customer on the Track Order page
              </p>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setOrderDialogOpen(false)}
              className="font-display"
              data-ocid="admin.orders.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleOrderEditSave}
              className="btn-ocean font-display"
              data-ocid="admin.orders.save_button"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="sm:col-span-2">
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Product Image
              </Label>
              {/* Hidden file input */}
              <input
                ref={productImageFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProductImageUpload}
              />
              <div className="space-y-3">
                {/* Upload button + thumbnail preview */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => productImageFileRef.current?.click()}
                    className="font-display gap-2"
                    data-ocid="admin.products.upload_button"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </Button>
                  {productForm.imageUrl && (
                    <div className="relative inline-block">
                      <img
                        src={productForm.imageUrl}
                        alt="Product preview"
                        className="h-20 w-20 rounded-lg object-cover border border-border shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() =>
                          setProductForm((p) => ({ ...p, imageUrl: "" }))
                        }
                        data-ocid="admin.products.delete_button"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {/* Fallback URL input */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-display">
                    or
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div>
                  <Label className="font-display text-xs text-muted-foreground mb-1 block">
                    Paste image URL
                  </Label>
                  <Input
                    value={
                      productForm.imageUrl.startsWith("data:")
                        ? ""
                        : productForm.imageUrl
                    }
                    onChange={(e) =>
                      setProductForm((p) => ({
                        ...p,
                        imageUrl: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/image.jpg"
                    className="font-display h-9 text-sm"
                    data-ocid="admin.products.input"
                  />
                </div>
              </div>
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
