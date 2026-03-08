import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { getAdminCredentials } from "../utils/storeSettings";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    // Simulate a brief loading delay for UX
    await new Promise((r) => setTimeout(r, 400));

    const creds = getAdminCredentials();
    if (username === creds.username && password === creds.password) {
      localStorage.setItem("owAdmin", "1");
      // Initialize backend to ensure data is seeded and backend is ready
      if (actor) {
        try {
          await actor.initialize();
        } catch {
          // Non-critical: backend may already be initialized
        }
      }
      toast.success("Welcome back, Bhawna!");
      navigate({ to: "/admin/dashboard" });
    } else {
      toast.error("Incorrect username or password");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen ocean-gradient flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-ocean-lg p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ocean-light mb-4">
            <Shield className="h-8 w-8 text-ocean-blue" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Admin Portal
          </h1>
          <p className="text-muted-foreground font-display text-sm mt-2">
            Ocean World Electronics — Owner Dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <Label className="font-display text-sm font-medium mb-1.5 block">
              Username
            </Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="font-display h-11"
              autoComplete="username"
              required
              data-ocid="admin.username.input"
            />
          </div>

          <div>
            <Label className="font-display text-sm font-medium mb-1.5 block">
              Password
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="font-display h-11 pr-11"
                autoComplete="current-password"
                required
                data-ocid="admin.password.input"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword((v) => !v)}
                data-ocid="admin.toggle"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim()}
            className="w-full btn-ocean h-12 rounded-xl font-display text-base"
            data-ocid="admin.primary_button"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Login to Dashboard
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-display">
            Only the store owner can access this panel.
          </p>
          <Link
            to="/"
            className="text-xs text-ocean-blue font-display hover:underline"
          >
            ← Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
