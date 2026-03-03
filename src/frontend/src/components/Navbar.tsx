import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@tanstack/react-router";
import { MapPin, Menu, Phone, ShoppingCart, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const simpleNavLinks = [
  { to: "/" as const, label: "Home" },
  { to: "/products" as const, label: "Products" },
  { to: "/contact" as const, label: "Contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  const isActive = (to: string) =>
    to === "/" ? currentPath === "/" : currentPath.startsWith(to);

  const trackActive = currentPath.startsWith("/track-order");

  const linkClass = (active: boolean) =>
    `px-3 py-2 rounded-md text-sm font-medium font-display transition-colors ${
      active
        ? "bg-ocean-light text-ocean-blue font-semibold"
        : "text-foreground hover:bg-secondary hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            data-ocid="nav.link.1"
            className="flex items-center gap-3 group"
          >
            <img
              src="/assets/generated/ocean-world-logo-transparent.dim_300x300.png"
              alt="Ocean World Electronics"
              className="h-10 w-10 object-contain"
            />
            <div>
              <span className="font-heading font-bold text-lg leading-tight text-foreground block">
                Ocean World
              </span>
              <span className="text-xs text-muted-foreground font-display tracking-wide leading-none">
                Electronics
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {simpleNavLinks.map((link, idx) => (
              <Link
                key={link.to}
                to={link.to}
                data-ocid={`nav.link.${idx + 2}`}
                className={linkClass(isActive(link.to))}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/track-order"
              search={{ phone: undefined }}
              data-ocid="nav.link.5"
              className={linkClass(trackActive)}
            >
              Track Order
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="tel:+919876543210"
              data-ocid="nav.primary_button"
              className="flex items-center gap-1.5 text-sm font-display font-medium text-ocean-blue hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              +91 98765 43210
            </a>
            <Link to="/products" data-ocid="nav.secondary_button">
              <Button className="btn-ocean rounded-full h-9 px-5 text-sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Shop Now
              </Button>
            </Link>
          </div>

          {/* Mobile: track order pill + hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/track-order"
              search={{ phone: undefined }}
              data-ocid="nav.mobile.link.track"
              className="flex items-center gap-1.5 text-xs font-display font-semibold text-ocean-blue bg-ocean-light border border-border px-3 py-1.5 rounded-full"
            >
              <MapPin className="h-3 w-3" />
              Track
            </Link>
            <button
              type="button"
              className="p-2 rounded-md text-foreground hover:bg-secondary transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              data-ocid="nav.toggle"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-border bg-white"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {simpleNavLinks.map((link, idx) => (
                <Link
                  key={link.to}
                  to={link.to}
                  data-ocid={`nav.mobile.link.${idx + 1}`}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-md text-sm font-medium font-display transition-colors ${
                    isActive(link.to)
                      ? "bg-ocean-light text-ocean-blue font-semibold"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/track-order"
                search={{ phone: undefined }}
                data-ocid="nav.mobile.link.4"
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-md text-sm font-medium font-display transition-colors ${
                  trackActive
                    ? "bg-ocean-light text-ocean-blue font-semibold"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                Track Order
              </Link>

              <div className="pt-2 border-t border-border mt-1">
                <a
                  href="tel:+919876543210"
                  data-ocid="nav.mobile.primary_button"
                  className="flex items-center gap-2 px-4 py-3 text-sm font-display font-medium text-ocean-blue"
                >
                  <Phone className="h-4 w-4" />
                  +91 98765 43210
                </a>
                <Link
                  to="/products"
                  data-ocid="nav.mobile.secondary_button"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-display font-medium text-white bg-ocean-blue rounded-lg mx-4 mt-1 justify-center"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Shop Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
