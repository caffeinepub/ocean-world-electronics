import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  QrCode,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { usePlaceOrder } from "../hooks/useQueries";
import { getStoreSettings } from "../utils/storeSettings";

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

interface CheckoutForm {
  customerName: string;
  phone: string;
  address: string;
  specialInstructions: string;
}

const emptyForm: CheckoutForm = {
  customerName: "",
  phone: "",
  address: "",
  specialInstructions: "",
};

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQty,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();
  const placeOrder = usePlaceOrder();
  const settings = getStoreSettings();

  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderPhone, setOrderPhone] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);

  const hasPaymentInfo =
    settings.paymentUpiId ||
    settings.paymentQrBase64 ||
    settings.paymentUpiPhone;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.customerName.trim() ||
      !form.phone.trim() ||
      !form.address.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsPlacing(true);
    try {
      // Place one order per cart item in parallel
      await Promise.all(
        items.map((item) =>
          placeOrder.mutateAsync({
            customerName: form.customerName,
            phone: form.phone,
            address: form.address,
            quantity: BigInt(item.quantity),
            productId: item.product.id,
            specialDescription: form.specialInstructions,
          }),
        ),
      );

      setOrderPhone(form.phone);
      setOrderSuccess(true);
      clearCart();
      toast.success(
        `${items.length > 1 ? `${items.length} orders` : "Order"} placed successfully!`,
      );
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  }

  // Empty cart state
  if (items.length === 0 && !orderSuccess) {
    return (
      <div
        className="container mx-auto px-4 py-20 text-center"
        data-ocid="cart.empty_state"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm mx-auto"
        >
          <div className="w-20 h-20 rounded-full bg-ocean-light flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="h-9 w-9 text-ocean-blue" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-3">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground font-display mb-8">
            Browse our collection and add items to your cart to get started.
          </p>
          <Link to="/products" data-ocid="cart.primary_button">
            <Button className="btn-ocean rounded-full px-8 h-12 font-display text-base">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Order success state
  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-2xl overflow-hidden"
          data-ocid="cart.success_state"
        >
          <div className="bg-green-600 px-8 py-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-white mx-auto mb-3" />
            <h2 className="font-heading font-bold text-2xl text-white">
              Orders Placed!
            </h2>
            <p className="text-green-100 text-sm font-display mt-1">
              We'll contact you shortly to confirm your delivery.
            </p>
          </div>
          <div className="p-8 space-y-4">
            {hasPaymentInfo && (
              <div className="bg-white rounded-xl border border-green-200 p-4 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="h-4 w-4 text-ocean-blue" />
                  <h4 className="font-heading font-semibold text-sm text-foreground">
                    Complete Payment
                  </h4>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-1">
                    {settings.paymentUpiId && (
                      <p className="text-sm font-display text-foreground">
                        <span className="text-muted-foreground">UPI ID: </span>
                        <span className="font-semibold">
                          {settings.paymentUpiId}
                        </span>
                      </p>
                    )}
                    {settings.paymentUpiPhone && (
                      <p className="text-sm font-display text-foreground">
                        <span className="text-muted-foreground">
                          PhonePe / GPay:{" "}
                        </span>
                        <span className="font-semibold">
                          {settings.paymentUpiPhone}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground font-display mt-1">
                      Total:{" "}
                      <span className="font-semibold text-ocean-blue">
                        {formatPrice(totalPrice)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground font-display">
                      After payment, share screenshot on WhatsApp.
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

            <div className="flex flex-col gap-3">
              <Link
                to="/track-order"
                search={{ phone: orderPhone }}
                data-ocid="cart.track_button"
              >
                <Button className="btn-ocean w-full rounded-xl h-12 font-display text-sm">
                  <Truck className="h-4 w-4 mr-2" />
                  Track Your Order
                </Button>
              </Link>
              <Link to="/products" data-ocid="cart.secondary_button">
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-12 font-display text-sm"
                >
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <ShoppingCart className="h-7 w-7 text-ocean-blue" />
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Your Cart
        </h1>
        <Badge className="bg-ocean-light text-ocean-blue border-0 font-display">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4" data-ocid="cart.list">
          <AnimatePresence mode="popLayout">
            {items.map((item, idx) => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-card rounded-xl border border-border p-4 shadow-card"
                data-ocid={`cart.item.${idx + 1}`}
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">
                          {item.product.manufacturer}
                        </p>
                        <h3 className="font-heading font-semibold text-base text-foreground leading-snug line-clamp-1">
                          {item.product.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="text-xs font-display mt-1"
                        >
                          {item.product.category}
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        data-ocid={`cart.delete_button.${idx + 1}`}
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Qty Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(item.product.id, item.quantity - 1)
                          }
                          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                          data-ocid={`cart.decrease_button.${idx + 1}`}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-heading font-semibold text-base w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(item.product.id, item.quantity + 1)
                          }
                          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                          data-ocid={`cart.increase_button.${idx + 1}`}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-display">
                          {formatPrice(Number(item.product.price))} each
                        </p>
                        <p className="font-heading font-bold text-lg text-ocean-blue">
                          {formatPrice(
                            Number(item.product.price) * item.quantity,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Clear Cart */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                clearCart();
                toast.info("Cart cleared");
              }}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors font-display flex items-center gap-1.5"
              data-ocid="cart.delete_button"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary + Checkout Form */}
        <div className="space-y-4">
          {/* Order Summary Card */}
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">
              Order Summary
            </h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm font-display text-muted-foreground line-clamp-1 flex-1">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="text-sm font-display font-medium text-foreground shrink-0">
                    {formatPrice(Number(item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="font-heading font-semibold text-base text-foreground">
                Total
              </span>
              <span className="font-heading font-bold text-2xl text-ocean-blue">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-display mt-2">
              {totalItems} item{totalItems !== 1 ? "s" : ""} · Delivery charges
              may apply
            </p>
          </div>

          {/* Checkout Form */}
          <div
            className="bg-card rounded-xl border border-border shadow-card p-5"
            data-ocid="cart.panel"
          >
            <h2 className="font-heading font-bold text-lg text-foreground mb-5">
              Delivery Details
            </h2>
            <form onSubmit={handlePlaceOrder} className="space-y-4">
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
                  data-ocid="cart.input"
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
                  data-ocid="cart.input"
                  required
                />
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
                  data-ocid="cart.textarea"
                  required
                />
              </div>
              <div>
                <Label className="font-display text-sm font-medium mb-1.5 block">
                  Special Instructions{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  name="specialInstructions"
                  value={form.specialInstructions}
                  onChange={handleChange}
                  placeholder="Color preference, delivery timing, etc."
                  className="font-display resize-none"
                  rows={2}
                  data-ocid="cart.textarea"
                />
              </div>

              <Button
                type="submit"
                className="btn-ocean w-full h-12 rounded-xl font-display text-base"
                disabled={isPlacing || items.length === 0}
                data-ocid="cart.submit_button"
              >
                {isPlacing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Place Order · {formatPrice(totalPrice)}
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Payment Info */}
          {hasPaymentInfo && (
            <div className="bg-ocean-light rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="h-4 w-4 text-ocean-blue" />
                <h4 className="font-heading font-semibold text-sm text-foreground">
                  Payment Info
                </h4>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  {settings.paymentUpiId && (
                    <p className="text-sm font-display">
                      <span className="text-muted-foreground">UPI: </span>
                      <span className="font-semibold">
                        {settings.paymentUpiId}
                      </span>
                    </p>
                  )}
                  {settings.paymentUpiPhone && (
                    <p className="text-sm font-display">
                      <span className="text-muted-foreground">Phone: </span>
                      <span className="font-semibold">
                        {settings.paymentUpiPhone}
                      </span>
                    </p>
                  )}
                </div>
                {settings.paymentQrBase64 && (
                  <img
                    src={settings.paymentQrBase64}
                    alt="Payment QR"
                    className="w-16 h-16 object-contain rounded-lg border border-border bg-white shrink-0"
                  />
                )}
              </div>
            </div>
          )}

          {/* Delivery info */}
          <div className="flex flex-col gap-2 text-xs text-muted-foreground font-display">
            <div className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 shrink-0" />
              <span>Delivery within 2–5 business days in Delhi NCR</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>We'll call to confirm before dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>Plot No. 4, Motinagar, Delhi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
