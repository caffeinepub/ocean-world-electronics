import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsCallerAdmin();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  useEffect(() => {
    if (isAuthenticated && isAdmin === true) {
      navigate({ to: "/admin/dashboard" });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleLogin = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error("Login failed. Please try again.");
        }
      }
    }
  };

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

        <div className="space-y-5">
          {checkingAdmin && isAuthenticated ? (
            <div
              className="flex items-center justify-center gap-2 py-4 text-muted-foreground font-display"
              data-ocid="admin.loading_state"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying admin access...
            </div>
          ) : isAuthenticated && isAdmin === false ? (
            <div
              data-ocid="admin.error_state"
              className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"
            >
              <p className="font-heading font-semibold text-red-700 mb-1">
                Access Denied
              </p>
              <p className="text-sm text-red-600 font-display mb-3">
                Your account does not have admin privileges for Ocean World
                Electronics.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogin}
                className="font-display"
                data-ocid="admin.secondary_button"
              >
                Logout & Try Another Account
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-ocean-light rounded-xl p-4 border border-border">
                <p className="text-sm text-foreground font-display leading-relaxed">
                  {isAuthenticated
                    ? "You are logged in. Checking admin access..."
                    : "Log in to access the owner dashboard. Only authorized administrators can view orders and manage products."}
                </p>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-700 font-display font-medium">
                    Connected
                  </span>
                  <span className="text-xs text-green-600 font-display ml-auto truncate">
                    {identity?.getPrincipal().toString().slice(0, 20)}...
                  </span>
                </div>
              ) : null}

              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full btn-ocean h-12 rounded-xl font-display text-base"
                data-ocid="admin.primary_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : isAuthenticated ? (
                  "Logout"
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Login with Internet Identity
                  </>
                )}
              </Button>
            </>
          )}
        </div>

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
