"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  BookOpen,
  Code2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Printer,
  ChevronRight,
  Loader2,
  TrendingUp,
  Target,
  FileText,
  UserCheck,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  interviewApi,
  tokenStorage,
  InterviewSession,
  FeedbackData,
  PerAnswerFeedback,
} from "@/lib/api";

export default function InterviewFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [expandedTurns, setExpandedTurns] = useState<Record<number, boolean>>({ 0: true });

  const fetchFeedback = async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (!sessionId) return;

    try {
      setIsLoading(true);
      setErrorMessage("");
      const res = await interviewApi.getFeedback(sessionId);
      setSession(res.data.session);
      setFeedback(res.data.feedback);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load evaluation feedback.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [sessionId, router]);

  const handleReevaluate = async () => {
    if (!sessionId) return;
    try {
      setIsReevaluating(true);
      setErrorMessage("");
      const res = await interviewApi.evaluateSession(sessionId);
      setFeedback(res.data.feedback);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to re-evaluate interview session.");
    } finally {
      setIsReevaluating(false);
    }
  };

  const toggleTurnAccordion = (index: number) => {
    setExpandedTurns((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getReadinessBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case "strong hire":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: Sparkles,
          label: "Strong Hire",
        };
      case "hire":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          icon: CheckCircle2,
          label: "Hire",
        };
      case "leaning hire":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: TrendingUp,
          label: "Leaning Hire",
        };
      default:
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: Target,
          label: "Needs Preparation",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="relative flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Award className="h-8 w-8 text-blue-400 animate-pulse" />
          </div>
          <Loader2 className="h-20 w-20 text-blue-500/40 animate-spin absolute" />
        </div>
        <h2 className="text-lg font-bold">Synthesizing Evaluation Rubric...</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
          Gemini is analyzing your full conversational transcript, code elegance, and communication structure.
        </p>
      </div>
    );
  }

  if (errorMessage && !feedback) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold">Evaluation Incomplete</h2>
          <p className="text-xs text-slate-400">{errorMessage}</p>
          <div className="flex gap-2 justify-center pt-2">
            <Button
              onClick={fetchFeedback}
              className="bg-blue-600 hover:bg-blue-500 text-xs rounded-xl"
            >
              Retry
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="border-slate-800 text-xs rounded-xl">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const badge = getReadinessBadge(feedback?.readinessLevel || "Hire");
  const BadgeIcon = badge.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-5 w-px bg-slate-800" />
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-white flex items-center space-x-2">
                <span>Evaluation & Performance Report</span>
              </h1>
              <p className="text-xxs text-slate-400 truncate max-w-xs">
                {session?.roleTitle} • {session?.difficulty} • {session?.interviewType} Round
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="hidden sm:flex border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
              Save PDF
            </Button>

            <Button
              onClick={handleReevaluate}
              disabled={isReevaluating}
              variant="outline"
              size="sm"
              className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-blue-400 ${isReevaluating ? "animate-spin" : ""}`} />
              {isReevaluating ? "Re-evaluating..." : "Re-evaluate"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Report Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Hero Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overall Readiness Card */}
          <Card className="bg-slate-900/80 border-slate-800 shadow-xl overflow-hidden relative md:col-span-1">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="pb-2">
              <CardDescription className="text-xxs text-slate-400 uppercase tracking-wider font-semibold">
                Overall Candidate Rating
              </CardDescription>
              <div className="flex items-baseline space-x-2 pt-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                  {feedback?.overallScore || 0}
                </span>
                <span className="text-slate-500 text-lg font-bold">/ 100</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
              >
                <BadgeIcon className="h-3.5 w-3.5" />
                <span>{badge.label}</span>
              </div>
              <p className="text-xxs text-slate-400 leading-relaxed">
                Calculated across technical depth, problem-solving accuracy, and structured communication.
              </p>
            </CardContent>
          </Card>

          {/* Pillars: Technical & Communication Progress Bars */}
          <Card className="bg-slate-900/80 border-slate-800 shadow-xl md:col-span-2 flex flex-col justify-center">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-400" />
                <span>Core Evaluation Pillars</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Technical Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center">
                    Technical Accuracy & Engineering Depth
                  </span>
                  <span className="font-bold text-blue-400">{feedback?.technicalScore || 0}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
                    style={{ width: `${feedback?.technicalScore || 0}%` }}
                  />
                </div>
              </div>

              {/* Communication Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Communication & STAR Structure
                  </span>
                  <span className="font-bold text-indigo-400">{feedback?.communicationScore || 0}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${feedback?.communicationScore || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Executive Summary */}
        <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-white flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-blue-400" />
              <span>Interviewer Executive Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {feedback?.detailedFeedback}
            </p>
          </CardContent>
        </Card>

        {/* Strengths & Areas for Improvement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Key Strengths */}
          <Card className="bg-emerald-950/20 border-emerald-500/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Demonstrated Strengths</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(feedback?.strengths || []).map((s, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card className="bg-amber-950/20 border-amber-500/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Areas for Growth</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(feedback?.areasForImprovement || []).map((a, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                    <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {feedback?.recommendations && feedback.recommendations.length > 0 && (
          <Card className="bg-indigo-950/20 border-indigo-500/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-indigo-400 flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <span>Actionable Recommendations & Next Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {feedback.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start space-x-2"
                  >
                    <BookOpen className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Turn-by-Turn Q&A Performance Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <span>Turn-by-Turn Question Evaluation</span>
            </h2>
            <span className="text-xxs text-slate-500 font-mono">
              {feedback?.perAnswerFeedback?.length || 0} Questions Evaluated
            </span>
          </div>

          <div className="space-y-3">
            {(feedback?.perAnswerFeedback || []).map((turn, idx) => {
              const isExpanded = !!expandedTurns[idx];
              return (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
                >
                  {/* Turn Accordion Header */}
                  <button
                    type="button"
                    onClick={() => toggleTurnAccordion(idx)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                        Q{turn.questionOrder}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white line-clamp-1">
                          {turn.questionText}
                        </div>
                        <div className="text-xxs text-slate-400 mt-0.5">
                          Category: <span className="text-slate-300">{turn.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-blue-400">
                        {turn.score} / 100
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Turn Accordion Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs"
                      >
                        {/* Candidate Answer */}
                        <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                          <span className="text-xxs uppercase tracking-wider font-semibold text-slate-500">
                            Your Answer:
                          </span>
                          <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {turn.candidateAnswer}
                          </p>
                          {turn.codeSubmission && (
                            <pre className="mt-2 p-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-mono text-xxs overflow-x-auto">
                              {turn.codeSubmission}
                            </pre>
                          )}
                        </div>

                        {/* Interviewer Notes Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1">
                            <span className="text-xxs uppercase tracking-wider font-semibold text-emerald-400 flex items-center space-x-1">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              What Went Well:
                            </span>
                            <p className="text-slate-300">{turn.strengths}</p>
                          </div>

                          <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1">
                            <span className="text-xxs uppercase tracking-wider font-semibold text-amber-400 flex items-center space-x-1">
                              <Target className="h-3 w-3 mr-1" />
                              Missed Aspects & Gaps:
                            </span>
                            <p className="text-slate-300">{turn.missedPoints}</p>
                          </div>
                        </div>

                        {/* Ideal Key Points Snippet */}
                        {turn.idealAnswerSnippet && (
                          <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl space-y-1">
                            <span className="text-xxs uppercase tracking-wider font-semibold text-blue-400 flex items-center space-x-1">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Ideal Response Elements:
                            </span>
                            <p className="text-slate-300 italic">{turn.idealAnswerSnippet}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800 print:hidden">
          <Link href="/dashboard" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-slate-800 hover:bg-slate-800 text-slate-200 text-xs py-2.5 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>

          <Link href="/dashboard" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer">
              Start Another Mock Interview
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
