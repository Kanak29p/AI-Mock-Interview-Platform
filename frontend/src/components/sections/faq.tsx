"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FAQ() {
  const faqsList = [
    {
      question: "How does AI personalize interviews?",
      answer: "When you upload your resume, our platform extracts details about your past projects, technical stack, and roles. The AI interviewer then tailors its questions, scenarios, and difficulty level specifically to match the profile you're applying for, ensuring you practice only what matters.",
    },
    {
      question: "Can I practice coding interviews?",
      answer: "Yes, absolutely! We feature a fully integrated browser-based IDE supporting JavaScript, TypeScript, Python, Java, C++, and Go. The AI reviews your syntax, compiles your code against unit tests, analyzes your code structure, and provides suggestions on how to improve runtime and memory complexity.",
    },
    {
      question: "Is my resume secure?",
      answer: "Security is our highest priority. All uploaded resumes are encrypted, processed in sandbox environments, and never shared with third parties or used to train public LLM models. You can delete your resume and profile data at any time with a single click.",
    },
    {
      question: "Which roles are supported?",
      answer: "We support a wide range of engineering and tech roles, including Frontend, Backend, Fullstack, Mobile (iOS/Android), DevOps/SRE, Data Engineering, Machine Learning, and Technical Product Management. You can select your seniority level (L3 to L6+) for each session.",
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleFAQ = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 bg-slate-50/50 border-y border-slate-100">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-base font-semibold uppercase tracking-wider text-blue-600">
            Support
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Frequently Asked Questions
          </p>
          <p className="mt-4 text-lg text-slate-600">
            Have questions about how our platform handles evaluations? We have answers.
          </p>
        </div>

        {/* FAQs Accordion Container */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {faqsList.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:border-slate-300"
              >
                {/* Accordion Trigger Header */}
                <button
                  type="button"
                  onClick={() => toggleFAQ(idx)}
                  className="flex w-full items-center justify-between p-6 text-left font-bold text-slate-900 hover:text-blue-600 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                  aria-controls={`faq-content-${idx}`}
                  id={`faq-trigger-${idx}`}
                >
                  <div className="flex items-center gap-3 pr-4">
                    <HelpCircle className="h-5 w-5 text-blue-600 shrink-0" />
                    <span className="text-base font-semibold leading-relaxed">{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>

                {/* Accordion Content Panel */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-content-${idx}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-0 border-t border-slate-50 mt-1">
                        <p className="text-sm leading-relaxed text-slate-500 font-medium pl-8">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
