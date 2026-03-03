import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  ShoppingCart,
  Star,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

const values = [
  {
    icon: Shield,
    title: "Quality First",
    description:
      "Every product we sell is carefully selected to ensure it meets our high quality standards.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Heart,
    title: "Customer First",
    description:
      "Your satisfaction is our priority. We're here before, during, and after every purchase.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: Star,
    title: "Trust & Honesty",
    description:
      "Transparent pricing, genuine products, and honest communication — always.",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    icon: Zap,
    title: "Affordability",
    description:
      "Best electronics at the fairest prices. No hidden charges, no overpricing.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
];

const teamStats = [
  { value: "500+", label: "Happy Customers" },
  { value: "100+", label: "Products" },
  { value: "Delhi", label: "Based in" },
  { value: "24/7", label: "WhatsApp Support" },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative ocean-gradient overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ocean-navy/80 via-ocean-blue/60 to-transparent" />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <MapPin className="h-3.5 w-3.5 text-white" />
              <span className="text-white/90 text-xs font-display font-medium">
                Plot No. 4, Moti Nagar, Delhi
              </span>
            </div>
            <h1 className="font-heading text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              About Ocean World
              <br />
              <span className="text-white/70">Electronics</span>
            </h1>
            <p className="text-white/80 font-display text-lg leading-relaxed max-w-2xl mb-8">
              Ocean World Electronics was founded with a mission to bring
              quality electronics to every home in Delhi. Located in the heart
              of Moti Nagar, we serve customers with the best products at honest
              prices.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" data-ocid="about.shop_now.primary_button">
                <Button className="btn-ocean h-12 px-8 rounded-full font-display text-base">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Shop Now
                </Button>
              </Link>
              <Link to="/contact" data-ocid="about.contact.secondary_button">
                <Button
                  variant="outline"
                  className="h-12 px-8 rounded-full font-display text-base border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            aria-hidden="true"
          >
            <path
              d="M0 60L1440 60L1440 30C1200 60 960 0 720 30C480 60 240 0 0 30L0 60Z"
              fill="oklch(0.98 0.005 240)"
            />
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {teamStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="font-heading font-bold text-4xl text-ocean-blue mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-display">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-muted-foreground font-display leading-relaxed">
                <p>
                  Ocean World Electronics started as a small shop in Moti Nagar,
                  Delhi with a simple vision — to make quality electronics
                  accessible to everyone. We believe every family deserves
                  reliable gadgets without paying premium prices.
                </p>
                <p>
                  From smartphones and earphones to cables, chargers, and smart
                  accessories — we stock everything you need for your digital
                  life. Each product is hand-picked for quality, and we stand
                  behind everything we sell.
                </p>
                <p>
                  Today, we serve hundreds of happy customers across Delhi, with
                  fast delivery, easy returns, and genuine products. Our growth
                  is powered by the trust our customers place in us.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-ocean-light flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-ocean-blue" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-foreground">
                      Visit Our Store
                    </h3>
                    <p className="text-muted-foreground font-display text-sm mt-1">
                      Come experience our products in person
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm font-display">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-ocean-blue mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">
                        Plot No. 4, Moti Nagar
                      </p>
                      <p className="text-muted-foreground">
                        New Delhi – 110015, India
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-ocean-blue shrink-0" />
                    <a
                      href="tel:+919876543210"
                      className="text-ocean-blue hover:underline font-medium"
                    >
                      +91 98765 43210
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-ocean-blue shrink-0" />
                    <span className="text-muted-foreground">
                      Mon–Sat: 10 AM – 8 PM · Sun: 11 AM – 6 PM
                    </span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-display font-semibold text-green-700 bg-green-100 hover:bg-green-200 px-4 py-2.5 rounded-lg transition-colors w-full justify-center"
                    data-ocid="about.whatsapp.primary_button"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Our Values
            </h2>
            <p className="text-muted-foreground font-display max-w-xl mx-auto">
              These are the principles that guide every decision we make and
              every interaction we have.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl border border-border p-6 shadow-card text-center hover:shadow-ocean transition-shadow"
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${v.bg} mb-4`}
                >
                  <v.icon className={`h-7 w-7 ${v.color}`} />
                </div>
                <h3 className="font-heading font-bold text-base text-foreground mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-muted-foreground font-display leading-relaxed">
                  {v.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 ocean-gradient">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl font-bold text-white mb-3">
              Ready to shop?
            </h2>
            <p className="text-white/70 font-display mb-8 max-w-md mx-auto">
              Browse our full collection of quality electronics, or get in touch
              with any questions.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/products" data-ocid="about.cta.shop.primary_button">
                <Button className="bg-white text-ocean-blue hover:bg-white/90 h-12 px-8 rounded-full font-display font-semibold text-base">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Browse Products
                </Button>
              </Link>
              <Link
                to="/contact"
                data-ocid="about.cta.contact.secondary_button"
              >
                <Button
                  variant="outline"
                  className="h-12 px-8 rounded-full font-display text-base border-white/40 text-white bg-transparent hover:bg-white/10 hover:text-white"
                >
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
