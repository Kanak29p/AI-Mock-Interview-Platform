"use client";

import Link from "next/link";
import { ArrowRight, Play, Terminal, Code, Sparkles, User, MessageSquareCode, BadgeAlert, Mic } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  // Animation variants for smooth entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const mockupVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-20 sm:pt-32 lg:pb-28">
      {/* Decorative background grid and blurs */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.50),white)] opacity-70" />
      <div className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="absolute top-1/2 left-10 -z-10 h-96 w-96 rounded-full bg-indigo-50/45 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left column - Content */}
          <motion.div
            className="lg:col-span-5 max-w-2xl lg:max-w-none text-center lg:text-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Tagline Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Practice smarter. Interview with confidence.</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6"
            >
              Master Technical <br className="hidden sm:inline" />
              Interviews with <span className="text-blue-600">AI</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-lg leading-8 text-slate-600 mb-8 max-w-lg mx-auto lg:mx-0"
            >
              Upload your resume, practice role-specific coding & behavioral challenges, and receive instant, personalized AI assessment. Build real confidence before your big day.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link
                href="#practice"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 hover:shadow-blue-500/20 transition-all active:scale-98"
              >
                Start Practicing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <Play className="mr-2 h-4 w-4 text-slate-500 fill-slate-500" />
                How It Works
              </Link>
            </motion.div>

            {/* Statistics Quick-view */}
            <motion.div
              variants={itemVariants}
              className="mt-10 border-t border-slate-100 pt-8 grid grid-cols-3 gap-4 text-left max-w-md mx-auto lg:mx-0"
            >
              <div>
                <p className="text-2xl font-bold text-slate-900">10k+</p>
                <p className="text-xs text-slate-500 font-medium">Interviews conducted</p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-2xl font-bold text-slate-900">95%</p>
                <p className="text-xs text-slate-500 font-medium">Success rate increase</p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-2xl font-bold text-slate-900">50+</p>
                <p className="text-xs text-slate-500 font-medium">Supported stacks</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right column - Premium Dashboard Mockup */}
          <motion.div
            className="lg:col-span-7 flex justify-center lg:justify-end"
            variants={mockupVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="relative w-full max-w-[620px] rounded-2xl border border-slate-200/80 bg-slate-50 p-3 shadow-2xl shadow-slate-200/80 ring-1 ring-slate-900/5">
              {/* Top window control buttons */}
              <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-200/50">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="text-[11px] font-semibold text-slate-400 font-mono">
                  mock-interview-session_04.sh
                </div>
                <div className="w-12" /> {/* spacer */}
              </div>

              {/* Main Dashboard Layout inside mockup */}
              <div className="grid grid-cols-12 gap-3 mt-3">
                {/* Left Side inside Mockup: Coding Panel (7 cols) */}
                <div className="col-span-7 flex flex-col gap-3">
                  {/* Code Editor */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">solution.py</span>
                      </div>
                      <span className="rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Active Coding
                      </span>
                    </div>
                    {/* Fake Code lines */}
                    <pre className="text-[11px] font-mono leading-5 text-slate-600 overflow-x-auto">
                      <code>
                        <span className="text-indigo-600">def</span>{" "}
                        <span className="text-blue-600">find_longest_path</span>
                        (graph, start):{"\n"}
                        {"  "}visited = <span className="text-purple-600">set</span>()
                        {"\n"}
                        {"  "}path = []{"\n"}
                        {"  "}
                        <span className="text-indigo-600">def</span>{" "}
                        <span className="text-blue-600">dfs</span>(node):{"\n"}
                        {"    "}visited.add(node){"\n"}
                        {"    "}...{"\n"}
                        {"  "}
                        <span className="text-indigo-600">return</span> dfs(start)
                      </code>
                    </pre>
                  </div>

                  {/* Interview Question */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="h-4 w-4 text-blue-600" />
                      <h4 className="text-xs font-bold text-slate-800">Coding Question 2</h4>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Implement a depth-first search (DFS) pathfinder algorithm to determine the longest path between any two nodes in a directed acyclic graph.
                    </p>
                  </div>
                </div>

                {/* Right Side inside Mockup: Webcam & AI Feed (5 cols) */}
                <div className="col-span-5 flex flex-col gap-3">
                  {/* Fake Webcam Preview */}
                  <div className="relative aspect-video rounded-xl border border-slate-200 bg-slate-900 overflow-hidden shadow-sm flex items-center justify-center min-h-[110px]">
                    {/* Fake Video feed placeholder */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10" />
                    <div className="text-center z-10">
                      <User className="h-8 w-8 text-slate-400 mx-auto mb-1 animate-pulse" />
                      <span className="text-[9px] font-semibold text-slate-300 font-mono tracking-wider">
                        CANDIDATE FEED
                      </span>
                    </div>

                    {/* AI Indicator badge */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded bg-blue-600/90 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider">
                      <Mic className="h-2 w-2 animate-bounce" />
                      <span>Audio Active</span>
                    </div>
                  </div>

                  {/* Real-time feedback analytics card */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">AI Co-pilot Feed</span>
                    </div>
                    <div className="space-y-2.5">
                      {/* Metric 1 */}
                      <div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-0.5">
                          <span>Communication Clarity</span>
                          <span className="text-blue-600 font-mono">92%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "92%" }}
                            transition={{ duration: 1.2, delay: 0.5 }}
                            className="bg-blue-600 h-full rounded-full"
                          />
                        </div>
                      </div>
                      {/* Metric 2 */}
                      <div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-0.5">
                          <span>Algorithm Progress</span>
                          <span className="text-emerald-600 font-mono">75%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "75%" }}
                            transition={{ duration: 1.2, delay: 0.7 }}
                            className="bg-emerald-500 h-full rounded-full"
                          />
                        </div>
                      </div>
                      {/* Live AI transcription preview */}
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <p className="text-[8px] leading-3 text-slate-500 italic font-mono">
                          <span className="text-[8px] font-bold text-blue-600">AI Tip:</span> &quot;Excellent approach explaining your space complexity before writing the search loops.&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating review card overlay */}
              <div className="absolute -bottom-6 -left-6 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl hidden md:flex items-center gap-3.5 max-w-[210px] animate-bounce-slow">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <MessageSquareCode className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Instant Report</h5>
                  <p className="text-[10px] text-slate-500">Feedback generated in 4.2s</p>
                </div>
              </div>

              {/* Floating technology indicators */}
              <div className="absolute -top-4 -right-4 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-lg hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                <BadgeAlert className="h-3.5 w-3.5 text-blue-600" />
                <span>Standard L4/L5 FAANG rubric</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
