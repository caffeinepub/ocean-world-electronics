import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Headphones,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Tag,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import ProductCard from "../components/ProductCard";
import { useGetAllProducts } from "../hooks/useQueries";
import { getStoreSettings } from "../utils/storeSettings";

const features = [
  {
    icon: ShieldCheck,
    title: "Quality Assured",
    desc: "Every product is tested and verified before listing. We stock only genuine electronics.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Quick delivery across Delhi NCR. Same-day delivery available for select areas.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Tag,
    title: "Best Prices",
    desc: "Competitive pricing with no hidden charges. Price match guarantee on all products.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Our customer support team is always available via WhatsApp, call, or email.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const testimonials = [
  {
    name: "Rahul Sharma",
    rating: 5,
    text: "Bought a power bank and earphones. Delivered in 2 hours, great quality!",
  },
  {
    name: "Priya Singh",
    rating: 5,
    text: "Excellent service. The owner personally called to confirm my order. Highly recommended!",
  },
  {
    name: "Amit Kumar",
    rating: 4,
    text: "Good collection and prices. Will definitely order again from Ocean World Electronics.",
  },
];

const DEFAULT_HERO = "/assets/generated/hero-electronics.dim_1400x600.jpg";

export default function HomePage() {
  const { data: products, isLoading } = useGetAllProducts();
  const featured = products?.slice(0, 6) ?? [];

  const [heroSrc] = useState<string>(() => {
    const settings = getStoreSettings();
    return settings.heroImageBase64 || DEFAULT_HERO;
  });

  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden min-h-[500px] lg:min-h-[580px]">
        <img
          src={heroSrc}
          alt="Ocean World Electronics"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        <div className="relative container mx-auto px-4 py-20 lg:py-28 flex flex-col items-start max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur text-white text-xs font-display font-medium px-3 py-1.5 rounded-full border border-white/25 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              New Delhi's Trusted Electronics Store
            </span>

            <h1 className="font-heading text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Ocean World{" "}
              <span style={{ color: "oklch(0.72 0.16 212)" }}>Electronics</span>
            </h1>

            <p className="text-white/80 text-lg lg:text-xl mb-8 leading-relaxed font-display">
              Quality Electronics at Your Doorstep.
              <br />
              Smartphones, Accessories, Gadgets & More.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/products" data-ocid="hero.primary_button">
                <Button className="btn-ocean h-12 px-8 text-base rounded-full shadow-ocean">
                  Shop Now
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/contact" data-ocid="hero.secondary_button">
                <Button
                  variant="outline"
                  className="h-12 px-8 text-base rounded-full bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <div className="bg-ocean-navy text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "500+", label: "Products" },
              { value: "1000+", label: "Happy Customers" },
              { value: "Same Day", label: "Delivery Available" },
              { value: "100%", label: "Genuine Products" },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-2xl font-heading font-bold"
                  style={{ color: "oklch(0.72 0.16 212)" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-white/60 font-display mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured Products ── */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground">
              Featured Products
            </h2>
            <p className="text-muted-foreground mt-1 font-display">
              Top picks for you
            </p>
          </div>
          <Link
            to="/products"
            data-ocid="home.products.link"
            className="flex items-center gap-1 text-sm font-display font-medium text-ocean-blue hover:text-primary transition-colors"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            data-ocid="home.products.loading_state"
          >
            {Array.from({ length: 6 }, (_, i) => i).map((i) => (
              <div
                key={`skel-${i}`}
                className="rounded-xl overflow-hidden border border-border"
              >
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div
            data-ocid="home.products.empty_state"
            className="text-center py-20 rounded-xl border border-dashed border-border bg-secondary/30"
          >
            <p className="text-muted-foreground font-display">
              Products are being added. Check back soon!
            </p>
            <Link
              to="/contact"
              className="mt-3 inline-block text-sm text-ocean-blue font-display hover:underline"
            >
              Contact us for availability
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── Why Choose Us ── */}
      <section className="bg-ocean-light py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-foreground">
              Why Choose Ocean World?
            </h2>
            <p className="text-muted-foreground mt-2 font-display max-w-md mx-auto">
              We're committed to providing the best electronics shopping
              experience in Delhi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-white rounded-xl p-6 shadow-card border border-border hover:shadow-card-hover transition-shadow"
              >
                <div className={`inline-flex p-3 rounded-lg ${feat.bg} mb-4`}>
                  <feat.icon className={`h-6 w-6 ${feat.color}`} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-display">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-foreground">
            What Customers Say
          </h2>
          <p className="text-muted-foreground mt-2 font-display">
            Trusted by hundreds in Delhi NCR
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-6 border border-border shadow-card"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }, (_, j) => j).map((j) => (
                  <Star
                    key={`star-${t.name}-${j}`}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4 font-display italic">
                "{t.text}"
              </p>
              <p className="text-xs font-heading font-semibold text-ocean-blue">
                — {t.name}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="ocean-gradient py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-4">
              Need Help or Have a Query?
            </h2>
            <p className="text-white/80 font-display text-lg mb-8 max-w-lg mx-auto">
              Reach out to us anytime. We're here to help you find the perfect
              electronic product.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="cta.primary_button"
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-display font-semibold h-12 px-8 rounded-full transition-colors shadow-lg"
              >
                <MessageCircle className="h-5 w-5" />
                Chat on WhatsApp
              </a>
              <Link to="/contact" data-ocid="cta.secondary_button">
                <Button
                  variant="outline"
                  className="h-12 px-8 rounded-full border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white font-display font-semibold"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
