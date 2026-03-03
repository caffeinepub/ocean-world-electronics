import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useSearch } from "@tanstack/react-router";
import {
  Calendar,
  MapPin,
  Package,
  Phone,
  Search,
  ShoppingBag,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { type Order, OrderStatus, type Product } from "../backend.d";
import OrderStepper from "../components/OrderStepper";
import { useGetAllOrders, useGetAllProducts } from "../hooks/useQueries";

function formatPrice(price: bigint): string {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  [OrderStatus.pending]: {
    label: "Order Placed",
    cls: "bg-yellow-100 text-yellow-700",
  },
  [OrderStatus.confirmed]: {
    label: "Confirmed",
    cls: "bg-blue-100 text-blue-700",
  },
  [OrderStatus.delivered]: {
    label: "Delivered",
    cls: "bg-green-100 text-green-700",
  },
  [OrderStatus.cancelled]: {
    label: "Cancelled",
    cls: "bg-red-100 text-red-700",
  },
  shipped: { label: "Shipped", cls: "bg-indigo-100 text-indigo-700" },
  out_for_delivery: {
    label: "Out for Delivery",
    cls: "bg-orange-100 text-orange-700",
  },
};

interface TrackSearch {
  phone?: string;
}

export default function TrackOrderPage() {
  // Read phone from URL query param
  const search = useSearch({ strict: false }) as TrackSearch;
  const prefilled = search.phone ?? "";

  const [phoneInput, setPhoneInput] = useState(prefilled);
  const [submittedPhone, setSubmittedPhone] = useState(prefilled);
  const [hasSearched, setHasSearched] = useState(!!prefilled);

  const { data: allOrders, isLoading: ordersLoading } = useGetAllOrders();
  const { data: allProducts, isLoading: productsLoading } = useGetAllProducts();

  // Auto-search when prefilled phone from query param
  useEffect(() => {
    if (prefilled) {
      setSubmittedPhone(prefilled);
      setHasSearched(true);
    }
  }, [prefilled]);

  const productMap = useMemo(() => {
    if (!allProducts) return new Map<string, Product>();
    return new Map(allProducts.map((p) => [p.id, p]));
  }, [allProducts]);

  const matchedOrders = useMemo<Order[]>(() => {
    if (!allOrders || !submittedPhone.trim()) return [];
    const q = submittedPhone.trim();
    return allOrders.filter((o) => o.phone.includes(q));
  }, [allOrders, submittedPhone]);

  const isLoading = ordersLoading || productsLoading;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSubmittedPhone(phoneInput.trim());
    setHasSearched(true);
  }

  return (
    <div>
      {/* Header */}
      <div className="ocean-gradient py-14">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur mb-4">
              <ShoppingBag className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-heading text-4xl font-bold text-white mb-2">
              Track Your Order
            </h1>
            <p className="text-white/70 font-display text-base max-w-md mx-auto">
              Enter your phone number to see all orders and their live status.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Search form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-card mb-8"
        >
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1">
              <Label
                htmlFor="phone-input"
                className="font-display text-sm font-medium mb-1.5 block"
              >
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone-input"
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="pl-10 h-11 font-display"
                  data-ocid="track.input"
                  required
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="btn-ocean h-11 px-6 rounded-lg font-display w-full sm:w-auto"
                disabled={isLoading || !phoneInput.trim()}
                data-ocid="track.submit_button"
              >
                <Search className="h-4 w-4 mr-2" />
                Track Orders
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading && hasSearched ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
              data-ocid="track.loading_state"
            >
              {Array.from({ length: 2 }, (_, i) => i).map((i) => (
                <div
                  key={`tsk-${i}`}
                  className="rounded-2xl border border-border p-6 space-y-4"
                >
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </motion.div>
          ) : hasSearched && matchedOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              data-ocid="track.empty_state"
              className="text-center py-16 rounded-2xl border border-dashed border-border bg-secondary/20"
            >
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="font-heading font-semibold text-foreground text-lg">
                No orders found
              </p>
              <p className="text-muted-foreground font-display text-sm mt-1 max-w-xs mx-auto">
                No orders placed with this phone number. Double-check and try
                again.
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-block text-sm text-ocean-blue font-display hover:underline"
              >
                Need help? Contact us →
              </Link>
            </motion.div>
          ) : hasSearched && matchedOrders.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <p className="text-sm text-muted-foreground font-display">
                Found{" "}
                <span className="font-semibold text-foreground">
                  {matchedOrders.length}
                </span>{" "}
                order{matchedOrders.length !== 1 ? "s" : ""} for{" "}
                <span className="font-semibold text-ocean-blue">
                  {submittedPhone}
                </span>
              </p>

              {matchedOrders
                .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                .map((order, idx) => {
                  const product = productMap.get(order.productId);
                  const statusInfo =
                    STATUS_BADGE[order.status] ??
                    STATUS_BADGE[OrderStatus.pending];
                  const isCancelled = order.status === OrderStatus.cancelled;

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      data-ocid={`track.item.${idx + 1}`}
                      className={`bg-card rounded-2xl border shadow-card overflow-hidden ${
                        isCancelled
                          ? "border-destructive/20 opacity-80"
                          : "border-border"
                      }`}
                    >
                      {/* Card header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-border">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-heading font-bold text-sm text-foreground">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <Badge
                              className={`text-xs font-display border-0 ${statusInfo.cls}`}
                            >
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground font-display">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(order.timestamp)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {order.address.slice(0, 40)}
                              {order.address.length > 40 ? "…" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-heading font-bold text-lg text-ocean-blue">
                            {product
                              ? formatPrice(product.price * order.quantity)
                              : "—"}
                          </div>
                          <div className="text-xs text-muted-foreground font-display">
                            Qty: {Number(order.quantity)}
                          </div>
                        </div>
                      </div>

                      {/* Product info */}
                      <div className="px-5 py-4 flex items-center gap-4 border-b border-border">
                        <div className="h-14 w-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                          {product?.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground opacity-40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading font-semibold text-sm text-foreground leading-snug line-clamp-1">
                            {product?.name ??
                              `Product ${order.productId.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-muted-foreground font-display mt-0.5">
                            {product?.manufacturer ?? ""}{" "}
                            {product?.category ? `· ${product.category}` : ""}
                          </p>
                          {order.specialDescription && (
                            <p className="text-xs text-muted-foreground font-display mt-1 italic line-clamp-1">
                              "{order.specialDescription}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="px-5 py-5">
                        <p className="text-xs font-display font-medium text-muted-foreground uppercase tracking-wider mb-3">
                          Order Progress
                        </p>
                        <OrderStepper status={order.status} />
                      </div>
                    </motion.div>
                  );
                })}

              {/* Help strip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-ocean-light border border-border">
                <p className="text-sm text-foreground font-display">
                  Have a question about your order?
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="track.primary_button"
                    className="inline-flex items-center gap-1.5 text-sm font-display font-semibold text-green-700 bg-green-100 hover:bg-green-200 px-4 py-2 rounded-lg transition-colors"
                  >
                    WhatsApp Us
                  </a>
                  <a
                    href="tel:+919876543210"
                    data-ocid="track.secondary_button"
                    className="inline-flex items-center gap-1.5 text-sm font-display font-semibold text-ocean-blue bg-white hover:bg-secondary border border-border px-4 py-2 rounded-lg transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call Us
                  </a>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
