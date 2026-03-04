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
import { Textarea } from "@/components/ui/textarea";
import { Link, useSearch } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Package,
  Phone,
  Search,
  ShoppingBag,
  Star,
  Truck,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { OrderStatus, type Product } from "../backend.d";
import OrderStepper from "../components/OrderStepper";
import { useGetAllProducts, useGetOrdersByPhone } from "../hooks/useQueries";
import {
  type OrderComplaint,
  type OrderFeedback,
  cancelLocalOrder,
  getComplaints,
  getCourierInfos,
  getEstimatedDeliveries,
  getFeedbacks,
  getStoreSettings,
  saveComplaint,
  saveFeedback,
  updateLocalOrderStatus,
} from "../utils/storeSettings";

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
  [OrderStatus.shipped]: {
    label: "Shipped",
    cls: "bg-indigo-100 text-indigo-700",
  },
  [OrderStatus.out_for_delivery]: {
    label: "Out for Delivery",
    cls: "bg-orange-100 text-orange-700",
  },
  [OrderStatus.delivered]: {
    label: "Delivered",
    cls: "bg-green-100 text-green-700",
  },
  [OrderStatus.cancelled]: {
    label: "Cancelled",
    cls: "bg-red-100 text-red-700",
  },
};

const COURIER_LINKS: Record<string, string> = {
  bluedart: "https://www.bluedart.com/tracking",
  delhivery: "https://www.delhivery.com/tracking",
  dtdc: "https://www.dtdc.in/trace-tracking.asp",
  fedex: "https://www.fedex.com/en-in/tracking.html",
};

function getCourierLink(courierName: string): string | null {
  const key = courierName.toLowerCase().trim();
  return COURIER_LINKS[key] ?? null;
}

interface TrackSearch {
  phone?: string;
}

// Per-order feedback form component
function FeedbackForm({
  orderId,
  onSubmit,
}: { orderId: string; onSubmit: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    const feedback: OrderFeedback = {
      orderId,
      rating,
      comment,
      submittedAt: Date.now(),
    };
    saveFeedback(feedback);
    toast.success("Thank you for your feedback!");
    setSubmitting(false);
    onSubmit();
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-sm font-heading font-semibold text-foreground mb-3">
        Rate Your Experience
      </p>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={`track-star-${n}`}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110"
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(n)}
            data-ocid={`track.feedback.rating.${n}`}
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                n <= (hoverRating || rating)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-display text-muted-foreground">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
          </span>
        )}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)..."
        className="font-display resize-none mb-3"
        rows={2}
        data-ocid="track.feedback.textarea.1"
      />
      <Button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="btn-ocean h-9 font-display text-sm"
        data-ocid="track.feedback.submit_button.1"
      >
        <Star className="h-3.5 w-3.5 mr-2" />
        Submit Feedback
      </Button>
    </div>
  );
}

// Per-order complaint dialog
function ComplaintSection({
  orderId,
  orderIdx,
  complaint,
  onSubmit,
}: {
  orderId: string;
  orderIdx: number;
  complaint: OrderComplaint | undefined;
  onSubmit: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit() {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }
    const c: OrderComplaint = {
      orderId,
      reason,
      description,
      submittedAt: Date.now(),
      status: "open",
    };
    saveComplaint(c);
    toast.success("Complaint filed successfully. We'll get back to you soon.");
    setDialogOpen(false);
    onSubmit();
  }

  if (complaint) {
    return (
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs font-display border-0 ${
              complaint.status === "open"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            Complaint {complaint.status === "open" ? "Filed" : "Resolved"}
          </Badge>
          <span className="text-xs text-muted-foreground font-display">
            {complaint.reason}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-display h-7 text-orange-600 border-orange-200 hover:bg-orange-50"
          onClick={() => setDialogOpen(true)}
          data-ocid={`track.complaint_button.${orderIdx}`}
        >
          Complaint / Return Request
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-ocid="track.complaint.dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">
              File a Complaint / Return Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger
                  className="h-11 font-display"
                  data-ocid={`track.complaint.reason.select.${orderIdx}`}
                >
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Product damaged" className="font-display">
                    Product damaged
                  </SelectItem>
                  <SelectItem value="Wrong product" className="font-display">
                    Wrong product delivered
                  </SelectItem>
                  <SelectItem value="Not delivered" className="font-display">
                    Not delivered / Missing
                  </SelectItem>
                  <SelectItem value="Return request" className="font-display">
                    Return request
                  </SelectItem>
                  <SelectItem value="Other" className="font-display">
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-display text-sm font-medium mb-1.5 block">
                Description (optional)
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                className="font-display resize-none"
                rows={3}
                data-ocid={`track.complaint.description.textarea.${orderIdx}`}
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="font-display"
              data-ocid="track.complaint.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="btn-ocean font-display"
              data-ocid={`track.complaint.submit_button.${orderIdx}`}
            >
              Submit Complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function TrackOrderPage() {
  const search = useSearch({ strict: false }) as TrackSearch;
  const prefilled = search.phone ?? "";

  const [phoneInput, setPhoneInput] = useState(prefilled);
  const [submittedPhone, setSubmittedPhone] = useState(prefilled);
  const [hasSearched, setHasSearched] = useState(!!prefilled);
  const [feedbacks, setFeedbacks] = useState<Record<string, OrderFeedback>>(
    () => getFeedbacks(),
  );
  const [complaints, setComplaints] = useState<Record<string, OrderComplaint>>(
    () => getComplaints(),
  );
  const [estimatedDeliveries, setEstimatedDeliveries] = useState<
    Record<string, string>
  >(() => getEstimatedDeliveries());
  // Local cancelled order IDs (so cancel reflects immediately without refetch)
  const [localCancelledIds, setLocalCancelledIds] = useState<Set<string>>(
    () => new Set(),
  );

  const {
    data: matchedOrders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useGetOrdersByPhone(submittedPhone);
  const { data: allProducts, isLoading: productsLoading } = useGetAllProducts();
  const settings = getStoreSettings();
  const courierInfos = getCourierInfos();

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

  const isLoading = (ordersLoading || productsLoading) && hasSearched;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phoneInput.trim();
    setSubmittedPhone(trimmed);
    setHasSearched(true);
    // If phone didn't change, manually refetch
    if (trimmed === submittedPhone) {
      refetchOrders();
    }
  }

  function refreshLocalStorage() {
    setFeedbacks(getFeedbacks());
    setComplaints(getComplaints());
    setEstimatedDeliveries(getEstimatedDeliveries());
  }

  function handleCancelOrder(orderId: string) {
    cancelLocalOrder(orderId);
    updateLocalOrderStatus(orderId, "cancelled");
    setLocalCancelledIds((prev) => new Set([...prev, orderId]));
    toast.success("Order cancelled successfully.");
    refetchOrders();
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
          {isLoading ? (
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
          ) : hasSearched && (!matchedOrders || matchedOrders.length === 0) ? (
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
          ) : hasSearched && matchedOrders && matchedOrders.length > 0 ? (
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
                  const isCancelled =
                    order.status === OrderStatus.cancelled ||
                    localCancelledIds.has(order.id);
                  const isDelivered = order.status === OrderStatus.delivered;
                  const canCancel =
                    !isCancelled &&
                    !isDelivered &&
                    (order.status === OrderStatus.pending ||
                      order.status === OrderStatus.confirmed);
                  const estDelivery = estimatedDeliveries[order.id];

                  // Get courier info
                  const courierFromStore = courierInfos[order.id];
                  const courierName =
                    courierFromStore?.courierName ?? order.courierName ?? "";
                  const courierTracking =
                    courierFromStore?.courierTrackingNumber ??
                    order.courierTrackingNumber ??
                    "";

                  // Get feedback for this order
                  const feedback = feedbacks[order.id];
                  const complaint = complaints[order.id];

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

                        {/* Estimated Delivery Date */}
                        {estDelivery && !isCancelled && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-ocean-blue" />
                              <span className="text-xs font-display text-muted-foreground">
                                Estimated Delivery:{" "}
                                <span className="font-semibold text-foreground">
                                  {new Date(estDelivery).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-display mt-1 ml-5 italic">
                              Note: Delivery dates are approximate and may vary
                              slightly. We ensure delivery as soon as possible.
                            </p>
                          </div>
                        )}

                        {/* Courier tracking */}
                        {courierName && courierTracking && (
                          <div className="mt-4 pt-3 border-t border-border">
                            <div className="flex items-center gap-2">
                              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-display text-muted-foreground">
                                Shipped via{" "}
                                <span className="font-semibold text-foreground">
                                  {courierName}
                                </span>
                                {" · "}
                                <span className="font-mono text-xs">
                                  {courierTracking}
                                </span>
                              </span>
                              {getCourierLink(courierName) ? (
                                <a
                                  href={getCourierLink(courierName) ?? "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-ocean-blue font-display hover:underline ml-auto"
                                  data-ocid={`track.courier_link.${idx + 1}`}
                                >
                                  Track on {courierName}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        )}

                        {/* Post-delivery feedback */}
                        {isDelivered &&
                          (feedback ? (
                            <div className="mt-4 pt-3 border-t border-border">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <Star
                                      key={`track-fb-star-${n}`}
                                      className={`h-4 w-4 ${n <= feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-display text-muted-foreground">
                                  Thank you for your feedback! ⭐
                                </span>
                              </div>
                            </div>
                          ) : (
                            <FeedbackForm
                              orderId={order.id}
                              onSubmit={refreshLocalStorage}
                            />
                          ))}

                        {/* Complaint/Return section */}
                        {!isCancelled && (
                          <ComplaintSection
                            orderId={order.id}
                            orderIdx={idx + 1}
                            complaint={complaint}
                            onSubmit={refreshLocalStorage}
                          />
                        )}

                        {/* Cancel Order button - only for pending/confirmed */}
                        {canCancel && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs font-display h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                                  data-ocid={`track.cancel_button.${idx + 1}`}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                  Cancel Order
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent
                                data-ocid={`track.cancel.dialog.${idx + 1}`}
                              >
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-heading">
                                    Cancel this order?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="font-display">
                                    Are you sure you want to cancel Order #
                                    {order.id.slice(0, 8).toUpperCase()}? This
                                    action cannot be undone. If you already
                                    paid, please contact us for a refund.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    className="font-display"
                                    data-ocid={`track.cancel.cancel_button.${idx + 1}`}
                                  >
                                    Keep Order
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="bg-destructive text-destructive-foreground font-display hover:bg-destructive/90"
                                    data-ocid={`track.cancel.confirm_button.${idx + 1}`}
                                  >
                                    Yes, Cancel Order
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <p className="text-xs text-muted-foreground font-display mt-1.5">
                              Orders can only be cancelled before shipping.
                            </p>
                          </div>
                        )}
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
                    href={`https://wa.me/${settings.whatsapp || "919876543210"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="track.primary_button"
                    className="inline-flex items-center gap-1.5 text-sm font-display font-semibold text-green-700 bg-green-100 hover:bg-green-200 px-4 py-2 rounded-lg transition-colors"
                  >
                    WhatsApp Us
                  </a>
                  <a
                    href={`tel:${settings.phone || "+919876543210"}`}
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
