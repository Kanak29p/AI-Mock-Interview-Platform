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
  User,
  Star,
  Activity,
  Award,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authApi, tokenStorage } from "@/lib/api";

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

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (password !== confirmPassword) {
      setGeneralError("Passwords do not match");
      return;
    }

    if (!agreeTerms) {
      setGeneralError("Please accept the Terms of Service to continue");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        fullName,
        email,
        password,
        role: "candidate",
      });

      tokenStorage.setAuthData(response.data.tokens, response.data.user);
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setIsLoading(false);
      setGeneralError(err.message || "Failed to create account. Please check your information.");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Return home link - top right absolute */}
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
      <div className="relative hidden w-1/2 flex-col justify-between bg-slate-950 p-16 text-white lg:flex overflow-y-auto max-h-screen">
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

        {/* Hero Content Section */}
        <div className="relative z-10 my-auto flex flex-col justify-center items-stretch text-left max-w-xl space-y-8 py-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Start Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400">Interview Journey</span>
            </h1>
            <p className="text-base text-slate-400 max-w-md leading-relaxed">
              Create your account to practice technical interviews, solve coding challenges, upload your resume, and receive personalized AI feedback.
            </p>
          </div>

          {/* Premium Dashboard SVG Illustration */}
          <div className="relative border border-white/10 bg-white/5 rounded-2xl p-5 backdrop-blur-md shadow-2xl overflow-hidden group">
            {/* Top Bar with mock window controls */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/5">
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="text-xxs text-slate-500 font-mono font-medium">interview_report.json</div>
            </div>

            {/* Mock Dashboard Layout */}
            <div className="grid grid-cols-5 gap-4">
              {/* Circular score display */}
              <div className="col-span-2 flex flex-col items-center justify-center bg-white/5 rounded-xl p-3.5 border border-white/5">
                <div className="relative flex items-center justify-center h-20 w-20">
                  <svg className="absolute transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2563eb" strokeWidth="8" strokeDasharray="251" strokeDashoffset="40" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-white tracking-tight">84%</span>
                    <span className="text-slate-500 text-xxs uppercase tracking-wider font-semibold scale-90">Score</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-300 mt-2.5">Confidence Meter</span>
              </div>

              {/* Bar stats */}
              <div className="col-span-3 space-y-3.5 bg-white/5 rounded-xl p-3.5 border border-white/5 flex flex-col justify-center">
                <div className="space-y-1">
                  <div className="flex justify-between text-xxs font-semibold">
                    <span className="text-slate-300">Technical Skills</span>
                    <span className="text-blue-400">92%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "92%" }} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xxs font-semibold">
                    <span className="text-slate-300">System Design</span>
                    <span className="text-blue-400">78%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full opacity-85" style={{ width: "78%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xxs font-semibold">
                    <span className="text-slate-300">Communication</span>
                    <span className="text-blue-400">85%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom mini-timeline log */}
            <div className="mt-4 flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 border border-white/5 text-xxs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
                <span>Interview Feedback grading complete</span>
              </div>
              <span className="text-slate-500">Just now</span>
            </div>
          </div>

          {/* 4 Feature Badges/Cards in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              "AI Mock Interviews",
              "Coding Challenges",
              "Resume Analysis",
              "Performance Reports"
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs font-semibold text-slate-300 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Testimonial Card */}
          <div className="relative border border-white/10 bg-white/5 rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-3.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4.5 w-4.5 fill-current" />
              ))}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed italic">
              &ldquo;Within two months of using this platform, I became much more confident in technical interviews and landed multiple internship offers.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-white/10 text-sm font-semibold text-blue-400">
                SC
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Sarah Chen</h4>
                <p className="text-xs text-slate-500 font-medium">Software Engineer Intern</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer branding */}
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
                key="signup-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-slate-100 shadow-xl shadow-slate-100/40">
                  <CardHeader className="text-center sm:text-left pb-4">
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                      Create your account
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1">
                      Join thousands of learners preparing for technical interviews.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-5 pb-2">
                    {/* Social Logins */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <Button 
                        variant="outline" 
                        type="button" 
                        className="w-full cursor-pointer border-slate-200 shadow-sm"
                        onClick={() => {}}
                        aria-label="Continue with Google"
                      >
                        <GoogleIcon />
                        <span className="text-xs sm:text-sm font-semibold text-slate-700">Google</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        type="button" 
                        className="w-full cursor-pointer border-slate-200 shadow-sm"
                        onClick={() => {}}
                        aria-label="Continue with GitHub"
                      >
                        <Github className="h-5 w-5 mr-2 text-slate-800 shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-slate-700">GitHub</span>
                      </Button>
                    </div>

                    {/* Divider separator */}
                    <div className="relative pt-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3.5 text-xxs font-bold tracking-wider text-slate-400">
                          Or sign up with email
                        </span>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {generalError && (
                        <div className="p-3 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200/80 rounded-xl">
                          {generalError}
                        </div>
                      )}
                      {/* Full Name input field */}
                      <div className="space-y-1.5">
                        <Label htmlFor="fullname">Full Name</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                            <User className="h-4 w-4" />
                          </div>
                          <Input
                            id="fullname"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Email input field */}
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email Address</Label>
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
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Password input field */}
                      <div className="space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                            <Lock className="h-4 w-4" />
                          </div>
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-10 pr-10"
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
                      </div>

                      {/* Confirm Password input field */}
                      <div className="space-y-1.5">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                            <Lock className="h-4 w-4" />
                          </div>
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="pl-10 pr-10"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isLoading}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4.5 w-4.5" />
                            ) : (
                              <Eye className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Terms and Privacy Checkbox */}
                      <div className="flex items-start space-x-2 pt-1">
                        <Checkbox 
                          id="terms" 
                          checked={agreeTerms} 
                          onCheckedChange={(checked) => setAgreeTerms(!!checked)}
                          disabled={isLoading} 
                          required
                        />
                        <label
                          htmlFor="terms"
                          className="text-xs font-semibold text-slate-600 cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 leading-normal"
                        >
                          I agree to the{" "}
                          <Link href="#terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                          {" "}and{" "}
                          <Link href="#privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                        </label>
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
                            Creating your account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-4 pt-4 pb-8 px-6 sm:px-8 text-center bg-transparent">
                    <p className="text-xs text-center text-slate-500 w-full">
                      Already have an account?{" "}
                      <Link 
                        href="/login" 
                        className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Sign In
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
                    Account Created Successfully!
                  </CardTitle>
                  <CardDescription className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">
                    Welcome to the platform! We are preparing your personalized mock interview dashboard. Redirection to Sign In...
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
