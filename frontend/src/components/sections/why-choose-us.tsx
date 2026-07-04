"use client";

import { Check, X, ShieldAlert, Zap, BookOpen, Target, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function WhyChooseUs() {
  const traditionalPrep = [
    "Generic lists of standard LeetCode problems",
    "No feedback on speaking pace, tone, or confidence",
    "Needs human mock partners which are hard to schedule",
    "Outdated questions that don't reflect live interviews",
    "No tracking of history or analytics between sessions",
  ];

  const ourPlatform = [
    "Dynamic, resume-tailored coding & system design mocks",
    "Real-time speech & communication analysis",
    "On-demand 24/7 AI interviewer sessions",
    "Regularly updated rubrics matching Google/Meta standards",
    "Interactive performance charts and historical progression",
  ];

  return (
    <section id="why-us" className="py-24 bg-slate-50/50 border-b border-slate-100 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-base font-semibold uppercase tracking-wider text-blue-600">
            Why Choose Our Platform
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            A smarter way to prepare
          </p>
          <p className="mt-4 text-lg text-slate-600">
            Compare static preparation books with our adaptive, real-time evaluation ecosystem.
          </p>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch max-w-5xl mx-auto">
          
          {/* Traditional card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
            className="rounded-2xl border border-slate-200 bg-white p-8 lg:p-10 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <ShieldAlert className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Traditional Prep</h3>
                  <p className="text-xs font-semibold text-slate-400">Static & Manual</p>
                </div>
              </div>
              <ul className="space-y-4">
                {traditionalPrep.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 mt-0.5">
                      <X className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-slate-500 font-medium leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-slate-100 pt-6 mt-8">
              <p className="text-xs font-semibold text-slate-400 text-center uppercase tracking-wide">
                Often results in interview anxiety
              </p>
            </div>
          </motion.div>

          {/* AI platform card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
            className="rounded-2xl border-2 border-blue-600 bg-slate-900 p-8 lg:p-10 shadow-lg text-white flex flex-col justify-between relative overflow-hidden"
          >
            {/* Soft decorative background radial */}
            <div className="absolute top-0 right-0 -z-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                    <Zap className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Our AI Platform</h3>
                    <p className="text-xs font-semibold text-blue-400">Adaptive & Seamless</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xxs font-bold uppercase tracking-wider text-blue-400 ring-1 ring-inset ring-blue-500/20">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  Recommended
                </span>
              </div>
              <ul className="space-y-4">
                {ourPlatform.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-400 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-slate-300 font-medium leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-slate-800 pt-6 mt-8">
              <p className="text-xs font-semibold text-blue-400 text-center uppercase tracking-wide">
                Builds actionable skill competence
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
