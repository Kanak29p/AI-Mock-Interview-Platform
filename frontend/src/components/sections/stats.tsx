"use client";

import { useEffect, useState, useRef } from "react";
import { useInView, motion } from "framer-motion";

function Counter({ value, suffix = "", duration = 1800 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    const startTime = performance.now();
    let animationFrameId: number;

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      setCount(Math.floor(easeProgress * value));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function Stats() {
  const statsList = [
    {
      value: 10000,
      suffix: "+",
      label: "Interview Questions",
      subtext: "Across frontend, backend, infra & PM",
    },
    {
      value: 95,
      suffix: "%",
      label: "User Satisfaction",
      subtext: "Based on exit surveys of 2,000+ users",
    },
    {
      value: 50,
      suffix: "+",
      label: "Supported Technologies",
      subtext: "From React & Python to Docker & AWS",
    },
    {
      value: 24,
      suffix: "/7",
      label: "Practice Availability",
      subtext: "Unlimited mock sessions on-demand",
    },
  ];

  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-0 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold uppercase tracking-wider text-blue-400">
              Proven Metrics
            </h2>
            <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Empowering candidates globally
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {statsList.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
                className="flex flex-col gap-2 border-l border-slate-800 pl-6 lg:pl-8 text-left"
              >
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
                  {stat.value === 24 ? (
                    <span>24/7</span>
                  ) : (
                    <Counter value={stat.value} suffix={stat.suffix} />
                  )}
                </div>
                <div className="text-sm font-bold text-slate-200 mt-1">{stat.label}</div>
                <div className="text-xs text-slate-400 font-medium leading-relaxed">{stat.subtext}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
