import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Lock, User, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getAdminCredentials } from "../utils/storeSettings";

// ============================================================
// ADMIN PAGE FIREBASE CONNECTION HERE
// Admin login uses local username/password (stored in browser).
// Change the default credentials in storeSettings.ts:
//   DEFAULT_ADMIN_CREDENTIALS.username
//   DEFAULT_ADMIN_CREDENTIALS.password
// ============================================================

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    // Simulate a small delay for UX
    await new Promise((r) => setTimeout(r, 400));

    const creds = getAdminCredentials();
    if (username === creds.username && password === creds.password) {
      localStorage.setItem("owAdmin", "1");
      toast.success("Welcome back!");
      navigate({ to: "/admin/dashboard" });
    } else {
      toast.error("Incorrect username or password");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Ocean World</h1>
          <p className="text-blue-300 mt-1">Admin Panel</p>
        </div>

        <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" />
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="username"
                    data-ocid="admin.login.input"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    data-ocid="admin.password.input"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                data-ocid="admin.login.submit_button"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login to Admin Panel"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-6">
          Ocean World Electronics &copy; 2025
        </p>
      </div>
    </div>
  );
}
