import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useGetAllProducts } from "../hooks/useQueries";

const ALL_CATEGORY = "All";

export default function ProductsPage() {
  const { data: products, isLoading } = useGetAllProducts();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);

  const categories = useMemo(() => {
    if (!products) return [ALL_CATEGORY];
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return [ALL_CATEGORY, ...cats.sort()];
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchCat =
        activeCategory === ALL_CATEGORY || p.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, search, activeCategory]);

  return (
    <div>
      {/* Banner */}
      <div
        className="relative h-40 lg:h-52 overflow-hidden"
        style={{
          backgroundImage: "url(/assets/generated/products-bg.dim_800x200.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 ocean-gradient opacity-90" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl lg:text-4xl font-bold text-white"
          >
            Our Products
          </motion.h1>
          <p className="text-white/70 font-display mt-1">
            {isLoading
              ? "Loading..."
              : `${products?.length ?? 0} products available`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 font-display"
              data-ocid="products.search_input"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-display">
            <SlidersHorizontal className="h-4 w-4" />
            <span>{filtered.length} results</span>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8" role="tablist">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              data-ocid="products.tab"
              className={`rounded-full font-display text-sm h-9 px-4 ${
                activeCategory === cat
                  ? "btn-ocean border-0"
                  : "border-border text-foreground hover:bg-secondary"
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Products grid */}
        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            data-ocid="products.loading_state"
          >
            {Array.from({ length: 8 }, (_, i) => i).map((i) => (
              <div
                key={`skel-${i}`}
                className="rounded-xl overflow-hidden border border-border"
              >
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-10 w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="products.empty_state"
            className="text-center py-24 rounded-xl border border-dashed border-border bg-secondary/20"
          >
            <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-40" />
            <p className="font-heading font-semibold text-foreground text-lg">
              No products found
            </p>
            <p className="text-muted-foreground font-display text-sm mt-1">
              Try a different search term or category
            </p>
            {search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 font-display"
                onClick={() => setSearch("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
