"use client";

import { UserPlus, FileUp, Mic2, Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Account",
      description: "Sign up in 30 seconds. Choose your target roles, seniority level, and core technologies.",
      icon: UserPlus,
      color: "border-blue-200 bg-blue-50 text-blue-600",
    },
    {
      number: "02",
      title: "Upload Resume",
      description: "Our parser extracts your projects, experiences, and technical stacks to customize your prompts.",
      icon: FileUp,
      color: "border-indigo-200 bg-indigo-50 text-indigo-600",
    },
    {
      number: "03",
      title: "Practice Interview",
      description: "Conduct standard 30-minute sessions with video, voice, and interactive coding panels.",
      icon: Mic2,
      color: "border-emerald-200 bg-emerald-50 text-emerald-600",
    },
    {
      number: "04",
      title: "Receive Feedback",
      description: "Review a deep report comparing your performance to actual L4/L5 FAANG grading rubrics.",
      icon: Star,
      color: "border-purple-200 bg-purple-50 text-purple-600",
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section id="how-it-works" className="py-24 bg-white relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-20">
          <h2 className="text-base font-semibold uppercase tracking-wider text-blue-600">
            Workflow
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Four simple steps to success
          </p>
          <p className="mt-4 text-lg text-slate-600">
            How the platform aligns your current experience level with realistic mock environments.
          </p>
        </div>

        {/* Steps container */}
        <motion.div
          className="relative grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Connecting line (Desktop) */}
          <div className="absolute top-1/2 left-[12%] right-[12%] h-[1.5px] bg-slate-100 hidden md:block -translate-y-9.5 z-0" />

          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="relative flex flex-col items-center text-center z-10 group"
              >
                {/* Step Circle Marker */}
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-white shadow-sm transition-transform duration-300 group-hover:scale-105 mb-6 z-10 border-slate-100">
                  <div className={`flex h-15 w-15 items-center justify-center rounded-xl border ${step.color}`}>
                    <IconComponent className="h-7 w-7" />
                  </div>

                  {/* Step index badge */}
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white font-mono">
                    {step.number}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-2.5">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed text-slate-500 max-w-[240px] md:max-w-none px-4">
                  {step.description}
                </p>

                {/* Subconnecting Arrow/Line for Mobile */}
                {index < steps.length - 1 && (
                  <div className="h-8 w-[1.5px] bg-slate-100 md:hidden mt-6" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
