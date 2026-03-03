import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useParams } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronLeft,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  QrCode,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useGetProduct, usePlaceOrder } from "../hooks/useQueries";
import { getStoreSettings } from "../utils/storeSettings";

function formatPrice(price: bigint): string {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

interface OrderForm {
  customerName: string;
  phone: string;
  address: string;
  quantity: string;
  specialDescription: string;
}

const emptyForm: OrderForm = {
  customerName: "",
  phone: "",
  address: "",
  quantity: "1",
  specialDescription: "",
};

interface SubmittedOrder {
  customerName: string;
  phone: string;
  address: string;
  quantity: number;
}

export default function ProductDetailPage() {
  const { id } = useParams({ from: "/products/$id" });
  const { data: product, isLoading, isError } = useGetProduct(id ?? "");
  const placeOrder = usePlaceOrder();
  const settings = getStoreSettings();

  const [form, setForm] = useState<OrderForm>(emptyForm);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrder | null>(
    null,
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;

    const qty = Number.parseInt(form.quantity, 10);
    if (
      !form.customerName.trim() ||
      !form.phone.trim() ||
      !form.address.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    if (Number.isNaN(qty) || qty < 1) {
      toast.error("Enter a valid quantity");
      return;
    }

    try {
      await placeOrder.mutateAsync({
        customerName: form.customerName,
        phone: form.phone,
        address: form.address,
        quantity: BigInt(qty),
        productId: product.id,
        specialDescription: form.specialDescription,
      });
      setSubmittedOrder({
        customerName: form.customerName,
        phone: form.phone,
        address: form.address,
        quantity: qty,
      });
      setOrderSuccess(true);
      setForm(emptyForm);
      toast.success("Order placed successfully! We'll contact you shortly.");
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  }

  function handleWhatsAppOrder() {
    if (!product) return;
    const waNumber = settings.whatsapp || "919876543210";
    const msg = `I want to order: ${product.name} - ${formatPrice(product.price)}. Please confirm availability.`;
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (isLoading) {
    return (
      <div
        className="container mx-auto px-4 py-12"
        data-ocid="product.loading_state"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div
        className="container mx-auto px-4 py-20 text-center"
        data-ocid="product.error_state"
      >
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
        <h2 className="font-heading text-2xl font-bold">Product Not Found</h2>
        <p className="text-muted-foreground font-display mt-2">
          This product may no longer be available.
        </p>
        <Link to="/products" className="mt-6 inline-block">
          <Button className="btn-ocean rounded-full">
            Browse All Products
          </Button>
        </Link>
      </div>
    );
  }

  const hasPaymentInfo =
    settings.paymentUpiId ||
    settings.paymentQrBase64 ||
    settings.paymentUpiPhone;

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link
          to="/products"
          data-ocid="product.link"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ocean-blue transition-colors font-display"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Left: Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl overflow-hidden bg-secondary aspect-square shadow-ocean-lg">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Package className="h-20 w-20 opacity-30" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Right: Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col"
        >
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="font-display text-xs">
                {product.category}
              </Badge>
              {product.isAvailable ? (
                <Badge className="bg-green-100 text-green-700 border-0 text-xs font-display">
                  In Stock ({Number(product.stockQuantity)} units)
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 border-0 text-xs font-display">
                  Out of Stock
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground font-display uppercase tracking-wider mb-1">
              {product.manufacturer}
            </p>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-3">
              {product.name}
            </h1>
            <p className="text-muted-foreground font-display leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="text-3xl font-heading font-bold text-ocean-blue mb-6">
            {formatPrice(product.price)}
          </div>

          {product.additionalDetails && (
            <div className="bg-ocean-light rounded-xl p-5 mb-6 border border-border">
              <h3 className="font-heading font-semibold text-sm text-foreground mb-2 uppercase tracking-wider">
                Additional Details
              </h3>
              <p className="text-sm text-muted-foreground font-display leading-relaxed whitespace-pre-line">
                {product.additionalDetails}
              </p>
            </div>
          )}

          {/* Order Form / Success */}
          {orderSuccess && submittedOrder ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              data-ocid="order.success_state"
              className="bg-green-50 border border-green-200 rounded-xl overflow-hidden"
            >
              {/* Success header */}
              <div className="bg-green-600 px-6 py-5 text-center">
                <CheckCircle2 className="h-10 w-10 text-white mx-auto mb-2" />
                <h3 className="font-heading font-bold text-xl text-white">
                  Order Placed Successfully!
                </h3>
                <p className="text-green-100 text-sm font-display mt-1">
                  We'll contact you shortly to confirm.
                </p>
              </div>

              {/* Order summary */}
              <div className="p-5 space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-white border border-green-200 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-display text-xs text-muted-foreground">
                      Product
                    </p>
                    <p className="font-heading font-semibold text-foreground text-sm">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-display">
                      Qty: {submittedOrder.quantity} ·{" "}
                      {formatPrice(
                        product.price * BigInt(submittedOrder.quantity),
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-white border border-green-200 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-display text-xs text-muted-foreground">
                      Contact
                    </p>
                    <p className="font-display font-medium text-foreground text-sm">
                      {submittedOrder.customerName} · {submittedOrder.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-white border border-green-200 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-display text-xs text-muted-foreground">
                      Delivery to
                    </p>
                    <p className="font-display font-medium text-foreground text-sm line-clamp-2">
                      {submittedOrder.address}
                    </p>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/track-order"
                    search={{ phone: submittedOrder.phone }}
                    data-ocid="order.primary_button"
                  >
                    <Button className="btn-ocean w-full rounded-lg h-10 font-display text-sm">
                      <Truck className="h-4 w-4 mr-2" />
                      Track Your Order
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setOrderSuccess(false)}
                    className="w-full rounded-lg h-10 font-display text-sm"
                    data-ocid="order.secondary_button"
                  >
                    Place Another Order
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <h3 className="font-heading font-bold text-lg text-foreground mb-5">
                Place Order
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-display text-sm font-medium mb-1.5 block">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      name="customerName"
                      value={form.customerName}
                      onChange={handleChange}
                      placeholder="Rahul Sharma"
                      className="font-display h-11"
                      data-ocid="order.input"
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-display text-sm font-medium mb-1.5 block">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="font-display h-11"
                      data-ocid="order.input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-display text-sm font-medium mb-1.5 block">
                    Delivery Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="House/Flat No., Street, Area, City, Delhi - 110XXX"
                    className="font-display resize-none"
                    rows={2}
                    data-ocid="order.textarea"
                    required
                  />
                </div>

                <div>
                  <Label className="font-display text-sm font-medium mb-1.5 block">
                    Quantity
                  </Label>
                  <Input
                    name="quantity"
                    type="number"
                    value={form.quantity}
                    onChange={handleChange}
                    min="1"
                    max={Number(product.stockQuantity)}
                    className="font-display h-11 w-32"
                    data-ocid="order.input"
                  />
                </div>

                <div>
                  <Label className="font-display text-sm font-medium mb-1.5 block">
                    Special Instructions (optional)
                  </Label>
                  <Textarea
                    name="specialDescription"
                    value={form.specialDescription}
                    onChange={handleChange}
                    placeholder="Any specific requirements, color preference, etc."
                    className="font-display resize-none"
                    rows={2}
                    data-ocid="order.textarea"
                  />
                </div>

                <Button
                  type="submit"
                  className="btn-ocean w-full h-12 rounded-lg font-display text-base"
                  disabled={placeOrder.isPending || !product.isAvailable}
                  data-ocid="order.submit_button"
                >
                  {placeOrder.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Confirm Order
                    </>
                  )}
                </Button>

                {/* WhatsApp Order Button */}
                <Button
                  type="button"
                  onClick={handleWhatsAppOrder}
                  className="w-full h-12 rounded-lg font-display text-base bg-[#25D366] hover:bg-[#20c05c] text-white border-0"
                  data-ocid="product_detail.whatsapp_button"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Order via WhatsApp
                </Button>
              </form>

              {/* Payment Info section */}
              {hasPaymentInfo && (
                <div className="mt-5 pt-5 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="h-4 w-4 text-ocean-blue" />
                    <h4 className="font-heading font-semibold text-sm text-foreground">
                      Payment Information
                    </h4>
                  </div>
                  <div className="bg-ocean-light rounded-xl p-4 flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex-1 space-y-1">
                      {settings.paymentUpiId && (
                        <p className="text-sm font-display text-foreground">
                          <span className="text-muted-foreground">
                            UPI ID:{" "}
                          </span>
                          <span className="font-semibold">
                            {settings.paymentUpiId}
                          </span>
                        </p>
                      )}
                      {settings.paymentUpiPhone && (
                        <p className="text-sm font-display text-foreground">
                          <span className="text-muted-foreground">
                            Phone Pay / GPay:{" "}
                          </span>
                          <span className="font-semibold">
                            {settings.paymentUpiPhone}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-display mt-2">
                        After payment, share screenshot on WhatsApp for order
                        confirmation.
                      </p>
                    </div>
                    {settings.paymentQrBase64 && (
                      <img
                        src={settings.paymentQrBase64}
                        alt="Payment QR Code"
                        className="w-24 h-24 object-contain rounded-lg border border-border bg-white shrink-0"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
