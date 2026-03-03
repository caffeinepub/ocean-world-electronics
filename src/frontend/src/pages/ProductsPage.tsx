import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useGetAllProducts } from "../hooks/useQueries";

const ALL_CATEGORY = "All";

type SortOption = "default" | "price_asc" | "price_desc" | "name_asc";

export default function ProductsPage() {
  const { data: products, isLoading } = useGetAllProducts();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const categories = useMemo(() => {
    if (!products) return [ALL_CATEGORY];
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return [ALL_CATEGORY, ...cats.sort()];
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = products.filter((p) => {
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

    // Sort
    if (sortBy === "price_asc") {
      result = [...result].sort((a, b) => Number(a.price - b.price));
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a, b) => Number(b.price - a.price));
    } else if (sortBy === "name_asc") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, search, activeCategory, sortBy]);

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
        {/* Search + Sort + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger
              className="h-11 font-display w-full sm:w-48"
              data-ocid="products.category_filter.select"
            >
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="font-display">
                  {cat === ALL_CATEGORY ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger
              className="h-11 font-display w-full sm:w-48"
              data-ocid="products.sort.select"
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default" className="font-display">
                Default
              </SelectItem>
              <SelectItem value="price_asc" className="font-display">
                Price: Low to High
              </SelectItem>
              <SelectItem value="price_desc" className="font-display">
                Price: High to Low
              </SelectItem>
              <SelectItem value="name_asc" className="font-display">
                Name: A–Z
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Count + Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-display">
            <SlidersHorizontal className="h-4 w-4" />
            <span>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {products?.length ?? 0}
              </span>{" "}
              products
            </span>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                data-ocid="products.tab"
                className={`rounded-full font-display text-sm h-8 px-3 ${
                  activeCategory === cat
                    ? "btn-ocean border-0"
                    : "border-border text-foreground hover:bg-secondary"
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
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
                <div className="aspect-square w-full bg-secondary animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-24 bg-secondary animate-pulse rounded" />
                  <div className="h-5 w-full bg-secondary animate-pulse rounded" />
                  <div className="h-10 w-full bg-secondary animate-pulse rounded mt-2" />
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
            {(search || activeCategory !== ALL_CATEGORY) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 font-display"
                onClick={() => {
                  setSearch("");
                  setActiveCategory(ALL_CATEGORY);
                  setSortBy("default");
                }}
              >
                Clear Filters
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
