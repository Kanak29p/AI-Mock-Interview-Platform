"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Github, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  Quote, 
  Mic, 
  MessageSquare,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Custom Google SVG Logo
const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-2 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#EA4335"
      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.197 2.698 1.24 6.65l4.026 3.115Z"
    />
    <path
      fill="#FBBC05"
      d="M1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.926.454 3.74 1.24 5.35l4.026-3.115A7.054 7.054 0 0 1 4.91 12c0-1.127.266-2.193.754-3.115L1.24 6.65Z"
    />
    <path
      fill="#34A853"
      d="M12 19.091c-1.69 0-3.218-.6-4.418-1.582L3.564 21C5.69 22.855 8.418 24 12 24c4.73 0 8.803-2.698 10.76-6.65l-4.027-3.115a7.078 7.078 0 0 1-6.733 4.856Z"
    />
    <path
      fill="#4285F4"
      d="M23.49 12.273c0-.818-.073-1.609-.21-2.364H12v4.51h6.464a5.532 5.532 0 0 1-2.4 3.636l4.027 3.115c2.355-2.17 3.4-5.36 3.4-8.9Z"
    />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Simple validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (val: string) => {
    if (!val) {
      setEmailError("Email address is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (val: string) => {
    if (!val) {
      setPasswordError("Password is required");
      return false;
    }
    if (val.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);

    // Simulate network authentication call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      // Simulate redirection to candidate dashboard
      setTimeout(() => {
        router.push("/");
      }, 1500);
    }, 2000);
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Return home link - top right absolute (visible on mobile / desktop) */}
      <div className="absolute top-6 right-6 z-50">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 bg-white/80 backdrop-blur-sm border border-slate-200/60 px-3.5 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Left Column: Visual Panel (Visible only on desktop lg+) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-slate-950 p-16 text-white lg:flex overflow-hidden">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(30,58,138,0.15),transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            AI Mock Interview
          </span>
        </div>

        {/* Left Hero Content Section - Minimal Style */}
        <div className="relative z-10 my-auto flex flex-col justify-center items-start text-left max-w-lg space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ace Your Next<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400">Technical Interview.</span>
            </h1>
            <p className="text-base text-slate-400 max-w-md leading-relaxed">
              Upload your resume, write live code in browser, practice behavioral answers, and receive detailed AI grading rubrics instantly.
            </p>
          </div>

          {/* Trust Indicators badges */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-sm">
              <span className="text-sm">🎤</span> AI HR Interviews
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-sm">
              <span className="text-sm">💻</span> Live Coding Challenges
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-sm">
              <span className="text-sm">📄</span> Resume-Based Questions
            </div>
          </div>
        </div>

        {/* Small branding footer / Trust detail */}
        <div className="relative z-10 pt-4 flex items-center justify-between text-slate-500 text-xs border-t border-white/5">
          <span>Practice smarter. Interview with confidence.</span>
          <span>v2.1</span>
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-[450px]">
          {/* Logo on Mobile (Hidden on Desktop) */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20">
              <Bot className="h-5.5 w-5.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              AI Mock Interview
            </span>
          </div>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-slate-100 shadow-xl shadow-slate-100/40">
                  <CardHeader className="text-center sm:text-left pb-4">
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                      Welcome back
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1">
                      Enter your credentials below to log into your workspace.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-5 pb-2">
                    {/* Email/Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                      {/* Email input field */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <Label htmlFor="email">Email Address</Label>
                          {emailError && (
                            <span className="text-xxs font-medium text-rose-500">
                              {emailError}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                            <Mail className="h-4 w-4" />
                          </div>
                          <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (emailError) validateEmail(e.target.value);
                            }}
                            onBlur={() => validateEmail(email)}
                            className={`pl-10 ${
                              emailError ? "border-rose-400 focus-visible:ring-rose-500" : ""
                            }`}
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Password input field */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <Label htmlFor="password">Password</Label>
                          {passwordError && (
                            <span className="text-xxs font-medium text-rose-500">
                              {passwordError}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                            <Lock className="h-4 w-4" />
                          </div>
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (passwordError) validatePassword(e.target.value);
                            }}
                            onBlur={() => validatePassword(password)}
                            className={`pl-10 pr-10 ${
                              passwordError ? "border-rose-400 focus-visible:ring-rose-500" : ""
                            }`}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4.5 w-4.5" />
                            ) : (
                              <Eye className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="remember" disabled={isLoading} />
                            <label
                              htmlFor="remember"
                              className="text-xs font-semibold text-slate-600 cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Remember me
                            </label>
                          </div>
                          <Link 
                            href="#forgot" 
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>
                      </div>

                      {/* Submit button */}
                      <Button
                        type="submit"
                        className="w-full mt-5 relative cursor-pointer"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                            Signing you in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>

                    {/* Divider separator */}
                    <div className="relative pt-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3.5 text-xxs font-bold tracking-wider text-slate-400">
                          Or sign in with
                        </span>
                      </div>
                    </div>

                    {/* Social Logins */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <Button 
                        variant="outline" 
                        type="button" 
                        className="w-full cursor-pointer"
                        onClick={() => {}}
                        aria-label="Log in with Google"
                      >
                        <GoogleIcon />
                        <span className="text-xs sm:text-sm font-semibold text-slate-700">Google</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        type="button" 
                        className="w-full cursor-pointer"
                        onClick={() => {}}
                        aria-label="Log in with GitHub"
                      >
                        <Github className="h-5 w-5 mr-2 text-slate-800 shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-slate-700">GitHub</span>
                      </Button>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-4 pt-4 pb-8 px-6 sm:px-8 text-center bg-transparent">
                    <p className="text-xs text-center text-slate-500 w-full">
                      Don&apos;t have an account?{" "}
                      <Link 
                        href="/signup" 
                        className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Create an account
                      </Link>
                    </p>
                  </CardFooter>
                </Card>
              </motion.div>
            ) : (
              // Success Animation Screen
              <motion.div
                key="success-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full text-center"
              >
                <Card className="border-slate-100 shadow-xl p-8 py-12 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6"
                  >
                    <CheckCircle2 className="h-10 w-10" />
                  </motion.div>
                  <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                    Authentication Successful
                  </CardTitle>
                  <CardDescription className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">
                    Welcome back! We are preparing your candidate workspace. Redirection in progress...
                  </CardDescription>
                  <div className="mt-8 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
