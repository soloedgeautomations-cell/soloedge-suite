import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Phone, Shield, Zap, CheckCircle2, ArrowLeft } from "lucide-react";

type View = "login" | "register" | "forgot" | "reset" | "forgot-sent";

// Google "G" SVG icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Apple icon
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

export default function Login() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const resetToken = params.get("reset");
  const oauthError = params.get("error");

  const [view, setView] = useState<View>(resetToken ? "reset" : "login");
  const [error, setError] = useState(oauthError === "google_denied" ? "Google sign-in was cancelled." : oauthError === "google_failed" ? "Google sign-in failed. Please try again." : "");
  const [success, setSuccess] = useState("");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => navigate("/app"),
    onError: (err) => setError(err.message || "Invalid email or password"),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => navigate("/app"),
    onError: (err) => setError(err.message || "Failed to create account"),
  });

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => setView("forgot-sent"),
    onError: (err) => setError(err.message || "Something went wrong"),
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess("Password reset! Redirecting to your dashboard...");
      setTimeout(() => navigate("/app"), 1500);
    },
    onError: (err) => setError(err.message || "Invalid or expired reset link"),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    registerMutation.mutate({ name, email, password });
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    forgotMutation.mutate({ email });
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmNewPassword) { setError("Passwords do not match"); return; }
    if (!resetToken) { setError("Invalid reset link"); return; }
    resetMutation.mutate({ token: resetToken, newPassword });
  };

  const switchView = (v: View) => {
    setError("");
    setSuccess("");
    setView(v);
  };

  const isPending = loginMutation.isPending || registerMutation.isPending || forgotMutation.isPending || resetMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
        <a href="https://soloedgeautomations.com" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">SoloEdge</span>
        </a>
        <span className="text-gray-500 text-sm hidden sm:block">Customer Dashboard</span>
      </div>

      {/* Main */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px]">

          {/* ── LOGIN ── */}
          {view === "login" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
                <p className="text-gray-400 text-sm">Sign in to manage Riley and your business</p>
              </div>

              <Card className="bg-gray-900 border-gray-800 shadow-2xl">
                <CardContent className="pt-6 pb-6 px-6 space-y-4">
                  {error && (
                    <Alert className="border-red-800/60 bg-red-950/50">
                      <AlertDescription className="text-red-400 text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Social login */}
                  <div className="grid grid-cols-2 gap-3">
                    <a href="/api/auth/google">
                      <Button variant="outline" className="w-full bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600 text-white gap-2">
                        <GoogleIcon />
                        <span className="text-sm">Google</span>
                      </Button>
                    </a>
                    <Button variant="outline" className="w-full bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600 text-white gap-2" onClick={() => setError("Apple Sign-In coming soon.")}>
                      <AppleIcon />
                      <span className="text-sm">Apple</span>
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-800" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-gray-900 px-3 text-gray-500">or continue with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-gray-300 text-sm">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-sky-500 focus:ring-sky-500/20 h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
                        <button type="button" onClick={() => switchView("forgot")} className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-sky-500 focus:ring-sky-500/20 h-11"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold h-11 shadow-lg shadow-sky-600/20"
                      disabled={isPending}
                    >
                      {loginMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign In"}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-gray-500">
                    Don't have an account?{" "}
                    <button onClick={() => switchView("register")} className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
                      Create one free
                    </button>
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── REGISTER ── */}
          {view === "register" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
                <p className="text-gray-400 text-sm">Get started with SoloEdge in seconds</p>
              </div>

              <Card className="bg-gray-900 border-gray-800 shadow-2xl">
                <CardContent className="pt-6 pb-6 px-6 space-y-4">
                  {error && (
                    <Alert className="border-red-800/60 bg-red-950/50">
                      <AlertDescription className="text-red-400 text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Social login */}
                  <div className="grid grid-cols-2 gap-3">
                    <a href="/api/auth/google">
                      <Button variant="outline" className="w-full bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600 text-white gap-2">
                        <GoogleIcon />
                        <span className="text-sm">Google</span>
                      </Button>
                    </a>
                    <Button variant="outline" className="w-full bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600 text-white gap-2" onClick={() => setError("Apple Sign-In coming soon.")}>
                      <AppleIcon />
                      <span className="text-sm">Apple</span>
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-800" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-gray-900 px-3 text-gray-500">or sign up with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name" className="text-gray-300 text-sm">Full name</Label>
                      <Input id="reg-name" type="text" placeholder="John Smith" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-sky-500 h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email" className="text-gray-300 text-sm">Email address</Label>
                      <Input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-sky-500 h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password" className="text-gray-300 text-sm">Password</Label>
                      <Input id="reg-password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-sky-500 h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm" className="text-gray-300 text-sm">Confirm password</Label>
                      <Input id="reg-confirm" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-sky-500 h-11" />
                    </div>
                    <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold h-11 shadow-lg shadow-sky-600/20" disabled={isPending}>
                      {registerMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create Account"}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <button onClick={() => switchView("login")} className="text-sky-400 hover:text-sky-300 font-medium transition-colors">Sign in</button>
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {view === "forgot" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Reset password</h1>
                <p className="text-gray-400 text-sm">We'll send a reset link to your email</p>
              </div>

              <Card className="bg-gray-900 border-gray-800 shadow-2xl">
                <CardContent className="pt-6 pb-6 px-6 space-y-4">
                  {error && (
                    <Alert className="border-red-800/60 bg-red-950/50">
                      <AlertDescription className="text-red-400 text-sm">{error}</AlertDescription>
                    </Alert>
                  )}
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="forgot-email" className="text-gray-300 text-sm">Email address</Label>
                      <Input id="forgot-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-sky-500 h-11" />
                    </div>
                    <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold h-11" disabled={isPending}>
                      {forgotMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Send Reset Link"}
                    </Button>
                  </form>
                  <button onClick={() => switchView("login")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mx-auto">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                  </button>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── FORGOT SENT ── */}
          {view === "forgot-sent" && (
            <Card className="bg-gray-900 border-gray-800 shadow-2xl">
              <CardContent className="pt-8 pb-8 px-6 text-center space-y-4">
                <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Check your inbox</h2>
                <p className="text-gray-400 text-sm">If an account exists for <span className="text-white">{email}</span>, we've sent a reset link. Check your spam folder if you don't see it.</p>
                <button onClick={() => switchView("login")} className="flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 transition-colors mx-auto">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                </button>
              </CardContent>
            </Card>
          )}

          {/* ── RESET PASSWORD ── */}
          {view === "reset" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Set new password</h1>
                <p className="text-gray-400 text-sm">Choose a strong password for your account</p>
              </div>

              <Card className="bg-gray-900 border-gray-800 shadow-2xl">
                <CardContent className="pt-6 pb-6 px-6 space-y-4">
                  {error && (
                    <Alert className="border-red-800/60 bg-red-950/50">
                      <AlertDescription className="text-red-400 text-sm">{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="border-green-800/60 bg-green-950/50">
                      <AlertDescription className="text-green-400 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />{success}
                      </AlertDescription>
                    </Alert>
                  )}
                  <form onSubmit={handleReset} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password" className="text-gray-300 text-sm">New password</Label>
                      <Input id="new-password" type="password" placeholder="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-sky-500 h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-new-password" className="text-gray-300 text-sm">Confirm new password</Label>
                      <Input id="confirm-new-password" type="password" placeholder="••••••••" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required autoComplete="new-password"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-sky-500 h-11" />
                    </div>
                    <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold h-11" disabled={isPending}>
                      {resetMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Set New Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-6 text-gray-600 text-xs">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>256-bit encryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Riley is always on</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-gray-700 text-xs border-t border-gray-800/40">
        Powered by{" "}
        <a href="https://soloedgeautomations.com" className="text-gray-600 hover:text-sky-400 transition-colors">
          SoloEdge Automations
        </a>
      </div>
    </div>
  );
}
