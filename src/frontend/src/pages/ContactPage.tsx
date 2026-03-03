import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSubmitInquiry } from "../hooks/useQueries";

interface InquiryForm {
  name: string;
  phone: string;
  message: string;
}

const emptyForm: InquiryForm = { name: "", phone: "", message: "" };

export default function ContactPage() {
  const submitInquiry = useSubmitInquiry();
  const [form, setForm] = useState<InquiryForm>(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await submitInquiry.mutateAsync({
        name: form.name,
        phone: form.phone,
        message: form.message,
      });
      setSubmitted(true);
      setForm(emptyForm);
      toast.success("Inquiry submitted! We'll get back to you soon.");
    } catch {
      toast.error(
        "Failed to submit inquiry. Please try again or call us directly.",
      );
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="ocean-gradient py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-heading text-4xl font-bold text-white mb-3">
              Contact Us
            </h1>
            <p className="text-white/70 font-display text-lg max-w-md mx-auto">
              We'd love to hear from you. Reach out for orders, queries, or
              product info.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Company Card */}
            <div className="bg-ocean-navy text-white rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src="/assets/generated/ocean-world-logo-transparent.dim_300x300.png"
                  alt="Ocean World Electronics"
                  className="h-14 w-14 object-contain brightness-200"
                />
                <div>
                  <h2 className="font-heading text-xl font-bold text-white">
                    Ocean World Electronics
                  </h2>
                  <p className="text-white/60 text-sm font-display">
                    Your trusted electronics partner
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/10 rounded-lg shrink-0">
                    <MapPin
                      className="h-5 w-5"
                      style={{ color: "oklch(0.72 0.16 212)" }}
                    />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-display uppercase tracking-wider mb-0.5">
                      Address
                    </p>
                    <p className="text-white font-display leading-relaxed text-sm">
                      Plot No. 4, Motinagar,
                      <br />
                      New Delhi – 110015, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/10 rounded-lg shrink-0">
                    <Phone
                      className="h-5 w-5"
                      style={{ color: "oklch(0.72 0.16 212)" }}
                    />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-display uppercase tracking-wider mb-0.5">
                      Phone
                    </p>
                    <a
                      href="tel:+919876543210"
                      data-ocid="contact.primary_button"
                      className="text-white font-display text-sm hover:text-ocean-cyan transition-colors"
                    >
                      +91 98765 43210
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/10 rounded-lg shrink-0">
                    <Mail
                      className="h-5 w-5"
                      style={{ color: "oklch(0.72 0.16 212)" }}
                    />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-display uppercase tracking-wider mb-0.5">
                      Email
                    </p>
                    <a
                      href="mailto:oceanworld.electronics@gmail.com"
                      data-ocid="contact.link"
                      className="text-white font-display text-sm hover:text-ocean-cyan transition-colors"
                    >
                      oceanworld.electronics@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/10 rounded-lg shrink-0">
                    <Clock
                      className="h-5 w-5"
                      style={{ color: "oklch(0.72 0.16 212)" }}
                    />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-display uppercase tracking-wider mb-0.5">
                      Business Hours
                    </p>
                    <p className="text-white font-display text-sm leading-relaxed">
                      Mon–Sat: 10:00 AM – 8:00 PM
                      <br />
                      Sunday: 11:00 AM – 6:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick contact buttons */}
            <div className="grid grid-cols-2 gap-4">
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="contact.secondary_button"
                className="flex flex-col items-center justify-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl p-5 transition-colors"
              >
                <MessageCircle className="h-8 w-8 text-green-600" />
                <div className="text-center">
                  <p className="font-heading font-semibold text-sm text-foreground">
                    WhatsApp Chat
                  </p>
                  <p className="text-xs text-muted-foreground font-display">
                    Fast reply guaranteed
                  </p>
                </div>
              </a>

              <a
                href="tel:+919876543210"
                data-ocid="contact.secondary_button"
                className="flex flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-5 transition-colors"
              >
                <Phone className="h-8 w-8 text-ocean-blue" />
                <div className="text-center">
                  <p className="font-heading font-semibold text-sm text-foreground">
                    Call Now
                  </p>
                  <p className="text-xs text-muted-foreground font-display">
                    +91 98765 43210
                  </p>
                </div>
              </a>
            </div>

            {/* Map placeholder */}
            <div className="rounded-2xl overflow-hidden border border-border bg-ocean-light h-52 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-10 w-10 text-ocean-blue mx-auto mb-2" />
                <p className="font-heading font-semibold text-foreground">
                  Find Us on Map
                </p>
                <p className="text-sm text-muted-foreground font-display">
                  Plot No. 4, Motinagar, Delhi
                </p>
                <a
                  href="https://maps.google.com/?q=Motinagar,+New+Delhi"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid="contact.link"
                  className="mt-2 inline-block text-xs text-ocean-blue font-display hover:underline"
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right: Inquiry Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                Send Us an Inquiry
              </h2>
              <p className="text-muted-foreground font-display text-sm mb-6">
                Fill the form below and we'll get back to you within a few
                hours.
              </p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  data-ocid="inquiry.success_state"
                  className="text-center py-12"
                >
                  <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
                  <h3 className="font-heading font-bold text-xl text-foreground mb-2">
                    Inquiry Sent!
                  </h3>
                  <p className="text-muted-foreground font-display text-sm mb-6">
                    Thank you for reaching out. We'll contact you at your phone
                    number soon.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    className="btn-ocean rounded-full"
                    data-ocid="inquiry.secondary_button"
                  >
                    Send Another Inquiry
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label className="font-display text-sm font-medium mb-1.5 block">
                      Your Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Amit Kumar"
                      className="font-display h-11"
                      data-ocid="inquiry.input"
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
                      data-ocid="inquiry.input"
                      required
                    />
                  </div>

                  <div>
                    <Label className="font-display text-sm font-medium mb-1.5 block">
                      Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="I'm interested in a specific product, need a bulk quote, or have a general inquiry..."
                      className="font-display resize-none"
                      rows={5}
                      data-ocid="inquiry.textarea"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="btn-ocean w-full h-12 rounded-lg font-display text-base"
                    disabled={submitInquiry.isPending}
                    data-ocid="inquiry.submit_button"
                  >
                    {submitInquiry.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Submit Inquiry"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
