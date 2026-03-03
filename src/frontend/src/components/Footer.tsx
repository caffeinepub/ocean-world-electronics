import { Link } from "@tanstack/react-router";
import { Cpu, Mail, MapPin, MessageCircle, Phone, Shield } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const utmLink = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "",
  )}`;

  return (
    <footer className="bg-ocean-navy text-white">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/assets/generated/ocean-world-logo-transparent.dim_300x300.png"
                alt="Ocean World Electronics"
                className="h-10 w-10 object-contain brightness-200"
              />
              <div>
                <span className="font-heading font-bold text-lg text-white block leading-tight">
                  Ocean World
                </span>
                <span className="text-xs text-white/60 font-display tracking-wide leading-none">
                  Electronics
                </span>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Quality electronics at your doorstep. Serving Delhi with the best
              in smartphones, accessories, and gadgets since day one.
            </p>
            <div className="flex gap-3">
              <a
                href="https://wa.me/919876543210"
                className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {(
                [
                  { to: "/", label: "Home" },
                  { to: "/products", label: "All Products" },
                  { to: "/contact", label: "Contact Us" },
                  { to: "/admin", label: "Admin Panel" },
                ] as const
              ).map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-white/70 hover:text-white text-sm transition-colors font-display"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/track-order"
                  search={{ phone: undefined }}
                  className="text-white/70 hover:text-white text-sm transition-colors font-display"
                >
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Categories
            </h4>
            <ul className="space-y-2">
              {[
                "Smartphones",
                "Headphones & Earbuds",
                "Cables & Chargers",
                "Power Banks",
                "Smart Gadgets",
                "Accessories",
              ].map((cat) => (
                <li key={cat}>
                  <Link
                    to="/products"
                    className="text-white/70 hover:text-white text-sm transition-colors font-display"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-ocean-blue mt-0.5 shrink-0" />
                <span className="text-white/70 text-sm leading-relaxed">
                  Plot No. 4, Motinagar,
                  <br />
                  New Delhi, India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-ocean-blue shrink-0" />
                <a
                  href="tel:+919876543210"
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-ocean-blue shrink-0" />
                <a
                  href="mailto:oceanworld.electronics@gmail.com"
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  oceanworld.electronics@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-ocean-blue mt-0.5 shrink-0" />
                <span className="text-white/70 text-sm">
                  Mon–Sat: 10 AM – 8 PM
                  <br />
                  Sun: 11 AM – 6 PM
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white/50 text-xs font-display">
            <Cpu className="h-3 w-3" />
            <span>© {year} Ocean World Electronics. All rights reserved.</span>
          </div>
          <a
            href={utmLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white/70 text-xs font-display transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
