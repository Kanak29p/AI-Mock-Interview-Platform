"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, LogIn } from "lucide-react";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="py-24 bg-white overflow-hidden relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="relative rounded-3xl bg-slate-900 px-6 py-20 text-center shadow-xl sm:px-12 lg:px-16 overflow-hidden border border-slate-800"
        >
          {/* Subtle backgrounds */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.15),transparent)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />

          {/* Sparkles icon badge */}
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 ring-1 ring-inset ring-blue-500/20 mb-6">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Ready to transform your interview prep?</span>
          </div>

          {/* Heading */}
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Start practicing in minutes. <br />
            Get hired with confidence.
          </h2>

          {/* Supporting paragraph */}
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300">
            Join thousands of developers using our AI-driven environment to refine their system design, coding, and communication skills. Sign up today and get your first session free.
          </p>

          {/* Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#practice"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition-all active:scale-98"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 text-slate-900" />
            </Link>
            <Link
              href="#signin"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-700 bg-transparent px-6 py-3.5 text-base font-semibold text-white hover:bg-slate-800/50 hover:border-slate-600 transition-all"
            >
              <LogIn className="mr-2 h-5 w-5 text-slate-400" />
              Sign In
            </Link>
          </div>

          {/* Technology quick-icons or small text details below buttons */}
          <p className="mt-8 text-xxs font-semibold uppercase tracking-wider text-slate-500 font-mono">
            No credit card required • Standard Free tier • Instant access
          </p>
        </motion.div>
      </div>
    </section>
  );
}
