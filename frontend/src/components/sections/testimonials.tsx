"use client";

import { Star, Quote, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Testimonials() {
  const reviews = [
    {
      name: "Sarah Jenkins",
      role: "Software Engineer at Google",
      text: "The coding sandbox mock interview was incredibly realistic. The AI identified that I jumped straight into writing loops before explaining my space complexity. Fixed that habit and got the offer!",
      rating: 5,
      initials: "SJ",
      bgColor: "bg-blue-600",
      companyLogo: "Google",
    },
    {
      name: "Alex Rivera",
      role: "Senior Frontend Engineer at Stripe",
      text: "I was super anxious about the system design and behavioral sections. The resume customization feature asked me specific questions about my previous React scaling projects. Highly recommended.",
      rating: 5,
      initials: "AR",
      bgColor: "bg-indigo-600",
      companyLogo: "Stripe",
    },
    {
      name: "Maya Patel",
      role: "Backend Lead at Clerk",
      text: "Having a mock partner active 24/7 is a game changer. I practiced three full rounds at 11 PM the night before my final rounds. The AI feedback on speaking pace helped me stay calm and composed.",
      rating: 5,
      initials: "MP",
      bgColor: "bg-emerald-600",
      companyLogo: "Clerk",
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section className="py-24 bg-white relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-base font-semibold uppercase tracking-wider text-blue-600">
            Success Stories
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Trusted by engineers worldwide
          </p>
          <p className="mt-4 text-lg text-slate-600">
            See how candidates used our simulated interview rubrics to land engineering positions.
          </p>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {reviews.map((review) => (
            <motion.div
              key={review.name}
              variants={cardVariants}
              className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 card-glow"
            >
              <div>
                {/* Quote Icon Overlay */}
                <Quote className="absolute top-6 right-8 h-8 w-8 text-slate-100 -z-0" />
                
                {/* Rating stars */}
                <div className="flex gap-1 mb-6 relative z-10">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-sm leading-relaxed text-slate-600 relative z-10 mb-8 italic">
                  &quot;{review.text}&quot;
                </p>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100 mt-auto">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ${review.bgColor}`}>
                  {review.initials}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                    {review.name}
                    <ShieldCheck className="h-4 w-4 text-blue-600 fill-blue-50" />
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-500">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
