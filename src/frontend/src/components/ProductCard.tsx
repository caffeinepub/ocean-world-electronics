import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Package, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "../backend.d";

interface ProductCardProps {
  product: Product;
  index: number;
}

function formatPrice(price: bigint): string {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

const categoryColors: Record<string, string> = {
  Smartphones: "bg-blue-100 text-blue-700",
  Headphones: "bg-purple-100 text-purple-700",
  Earbuds: "bg-violet-100 text-violet-700",
  Cables: "bg-orange-100 text-orange-700",
  Chargers: "bg-yellow-100 text-yellow-700",
  "Power Banks": "bg-green-100 text-green-700",
  "Smart Gadgets": "bg-teal-100 text-teal-700",
  Accessories: "bg-slate-100 text-slate-700",
};

export default function ProductCard({ product, index }: ProductCardProps) {
  const badgeClass =
    categoryColors[product.category] ?? "bg-slate-100 text-slate-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      data-ocid={`products.item.${index + 1}`}
      className="group bg-card rounded-xl overflow-hidden shadow-card card-hover border border-border flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square bg-secondary overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Package className="h-12 w-12 opacity-40" />
          </div>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-foreground font-display font-semibold text-xs px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge
            className={`${badgeClass} text-xs font-display border-0 px-2 py-0.5`}
          >
            {product.category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-1">
          <p className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1">
            {product.manufacturer}
          </p>
          <h3 className="font-heading font-semibold text-base text-foreground leading-snug line-clamp-2">
            {product.name}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          <span className="font-heading font-bold text-xl text-ocean-blue">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs text-muted-foreground font-display">
            Stock: {Number(product.stockQuantity)}
          </span>
        </div>

        <Link
          to="/products/$id"
          params={{ id: product.id }}
          data-ocid={`products.primary_button.${index + 1}`}
          className="mt-3 block"
        >
          <Button
            className="w-full btn-ocean rounded-lg h-10 text-sm font-display"
            disabled={!product.isAvailable}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.isAvailable ? "Order Now" : "Unavailable"}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
