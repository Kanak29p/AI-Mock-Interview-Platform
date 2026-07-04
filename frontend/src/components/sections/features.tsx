"use client";

import { Cpu, FileText, Code2, Building2, History, BarChart3, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Features() {
  const featuresList = [
    {
      title: "AI Interview Practice",
      description: "Engage in lifelike conversational interviews. Our AI asks follow-up questions, evaluates pacing, and tracks your tone of voice.",
      icon: Cpu,
      color: "text-blue-600 bg-blue-50",
      link: "#"
    },
    {
      title: "Resume-Based Questions",
      description: "Upload your resume to receive tailored questions targetting your specific experiences, tech stack, and career history.",
      icon: FileText,
      color: "text-indigo-600 bg-indigo-50",
      link: "#"
    },
    {
      title: "Coding Challenges",
      description: "Solve algorithmic and system design questions in our browser IDE with real-time compilers and auto-evaluation of complexity.",
      icon: Code2,
      color: "text-emerald-600 bg-emerald-50",
      link: "#"
    },
    {
      title: "Company-Specific Prep",
      description: "Prepare for specific interviews at Meta, Google, Stripe, or Netflix with custom rubrics modeled after their actual procedures.",
      icon: Building2,
      color: "text-amber-600 bg-amber-50",
      link: "#"
    },
    {
      title: "Detailed Interview History",
      description: "Review audio transcripts, saved code revisions, and chronological feedback reports from every session you've ever run.",
      icon: History,
      color: "text-purple-600 bg-purple-50",
      link: "#"
    },
    {
      title: "Performance Analytics",
      description: "Track progress over time with rich analytics charts grading your communication clarity, syntax proficiency, and problem solving speed.",
      icon: BarChart3,
      color: "text-rose-600 bg-rose-50",
      link: "#"
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section id="features" className="py-24 bg-slate-50/50 border-y border-slate-100 relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-base font-semibold uppercase tracking-wider text-blue-600">
            Platform Capabilities
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to land the offer
          </p>
          <p className="mt-4 text-lg text-slate-600">
            A comprehensive suite of evaluation tools designed by industry experts to simulate real modern interview environments.
          </p>
        </div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {featuresList.map((feat, idx) => {
            const IconComponent = feat.icon;
            return (
              <motion.div
                key={feat.title}
                variants={cardVariants}
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200/80 hover:shadow-md card-glow flex flex-col justify-between"
              >
                <div>
                  {/* Icon Circle */}
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feat.color} mb-6 transition-transform duration-300 group-hover:scale-110`}>
                    <IconComponent className="h-6 w-6" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {feat.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-slate-600 mb-6">
                    {feat.description}
                  </p>
                </div>

                {/* Learn More link inside card */}
                <div className="flex items-center gap-1 text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors mt-auto pt-2 cursor-pointer">
                  <span>Learn more</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
