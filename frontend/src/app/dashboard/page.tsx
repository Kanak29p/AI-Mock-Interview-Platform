"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  LogOut,
  Plus,
  FileText,
  Upload,
  Calendar,
  Sparkles,
  Award,
  TrendingUp,
  BrainCircuit,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Layers,
  ChevronRight,
  Code2,
  Users,
  Cpu,
  Trash2,
  Loader2,
  FileUp,
  Search,
  RefreshCw,
  HelpCircle,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  authApi,
  interviewApi,
  resumeApi,
  tokenStorage,
  User,
  InterviewSession,
  Resume,
  InterviewQuestion,
  RetrievedChunk,
} from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();

  // Authentication & user state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Data states
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modals & UI states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"interviews" | "resumes">("interviews");

  // New Interview Form state
  const [roleTitle, setRoleTitle] = useState("Full Stack Engineer");
  const [difficulty, setDifficulty] = useState<"junior" | "intermediate" | "senior" | "lead">("intermediate");
  const [interviewType, setInterviewType] = useState<"technical" | "behavioral" | "coding">("technical");
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  // Resume upload in-modal state
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RAG Semantic Search modal state
  const [isRagModalOpen, setIsRagModalOpen] = useState(false);
  const [activeResumeForSearch, setActiveResumeForSearch] = useState<Resume | null>(null);
  const [ragQuery, setRagQuery] = useState("Distributed systems, caching, and database optimization");
  const [ragResults, setRagResults] = useState<RetrievedChunk[]>([]);
  const [isSearchingRag, setIsSearchingRag] = useState(false);
  const [ragSearchError, setRagSearchError] = useState("");

  // Questions Preview Modal state
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isRegeneratingQuestions, setIsRegeneratingQuestions] = useState(false);

  // 1. Authenticate user & load initial data
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const meRes = await authApi.getMe();
        setUser(meRes.data.user);
        setIsAuthLoading(false);
        loadDashboardData();
      } catch (err) {
        console.error("Auth validation failed", err);
        tokenStorage.clearAuth();
        router.push("/login");
      }
    };

    initAuth();
  }, [router]);

  const loadDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const [interviewsRes, resumesRes] = await Promise.all([
        interviewApi.getInterviews(),
        resumeApi.getResumes(),
      ]);
      setInterviews(interviewsRes.data.interviews);
      setResumes(resumesRes.data.resumes);
      if (resumesRes.data.resumes.length > 0 && !selectedResumeId) {
        setSelectedResumeId(resumesRes.data.resumes[0].id);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = () => {
    tokenStorage.clearAuth();
    router.push("/login");
  };

  // Handle new resume upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    setResumeUploadError("");

    try {
      const res = await resumeApi.uploadResume(file);
      setResumes((prev) => [res.data.resume, ...prev]);
      setSelectedResumeId(res.data.resume.id);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setResumeUploadError(err.message || "Failed to parse resume.");
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Handle delete resume
  const handleDeleteResume = async (id: string) => {
    try {
      await resumeApi.deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      if (selectedResumeId === id) {
        setSelectedResumeId(null);
      }
    } catch (err) {
      console.error("Failed to delete resume:", err);
    }
  };

  // Handle start new interview submission
  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!roleTitle.trim()) {
      setCreateError("Please specify a target role title.");
      return;
    }

    setIsCreatingSession(true);

    try {
      const res = await interviewApi.createInterview({
        roleTitle: roleTitle.trim(),
        difficulty,
        interviewType,
        resumeId: selectedResumeId || null,
      });

      setCreateSuccess(true);
      setInterviews((prev) => [res.data.interview, ...prev]);

      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateSuccess(false);
        setIsCreatingSession(false);
        router.push(`/interview/${res.data.interview.id}`);
      }, 800);
    } catch (err: any) {
      setCreateError(err.message || "Failed to schedule interview session.");
      setIsCreatingSession(false);
    }
  };

  // Handle View / Fetch Questions for a session
  const handleViewQuestions = async (session: InterviewSession) => {
    setActiveSession(session);
    setIsQuestionsModalOpen(true);
    setIsLoadingQuestions(true);

    try {
      const res = await interviewApi.getQuestions(session.id);
      setSessionQuestions(res.data.questions);
    } catch (err) {
      console.error("Failed to load session questions:", err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Handle Regenerate Questions using RAG
  const handleRegenerateQuestions = async () => {
    if (!activeSession) return;
    setIsRegeneratingQuestions(true);

    try {
      const res = await interviewApi.generateQuestions(activeSession.id);
      setSessionQuestions(res.data.questions);
    } catch (err) {
      console.error("Failed to regenerate questions:", err);
    } finally {
      setIsRegeneratingQuestions(false);
    }
  };

  // Handle RAG Semantic Search
  const handleOpenRagSearch = (resume: Resume) => {
    setActiveResumeForSearch(resume);
    setIsRagModalOpen(true);
    setRagResults([]);
    setRagSearchError("");
  };

  const handleExecuteRagSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResumeForSearch || !ragQuery.trim()) return;

    setIsSearchingRag(true);
    setRagSearchError("");

    try {
      const res = await resumeApi.searchResume(activeResumeForSearch.id, ragQuery.trim(), 3);
      setRagResults(res.data.matches);
    } catch (err: any) {
      setRagSearchError(err.message || "Semantic search failed.");
    } finally {
      setIsSearchingRag(false);
    }
  };

  // Calculate statistics
  const completedInterviews = interviews.filter((i) => i.status === "completed");
  const averageScore = completedInterviews.length
    ? Math.round(
        completedInterviews.reduce((acc, cur) => acc + (Number(cur.score) || 0), 0) /
          completedInterviews.length
      )
    : null;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
          <span className="text-lg font-medium text-slate-300">Loading your candidate workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">AI Mock Interview</span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Candidate Portal
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-300 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">{user?.fullName || "Candidate"}</span>
              <span className="text-slate-500 text-xs">({user?.email})</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/70"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span className="text-xs font-medium">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hidden persistent file input for resume uploads across tabs and modals */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={handleFileUpload}
        />
        {/* Welcome & Primary Actions Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/40 border border-slate-800/80 p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Interview Readiness • RAG Activated</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.fullName?.split(" ")[0] || "Candidate"}!
              </h1>
              <p className="text-sm text-slate-400 max-w-xl">
                Ready to practice? Upload your resume to extract engineering skills, index semantic vector embeddings in PostgreSQL (pgvector), and generate personalized interview questions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setActiveTab("resumes")}
                variant="outline"
                className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl shadow-sm cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2 text-blue-400" />
                Resumes ({resumes.length})
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-5 py-2.5 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start New Interview
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/40 border-slate-800/70 shadow-sm">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <BrainCircuit className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Total Sessions</p>
                <p className="text-xl font-bold text-white tracking-tight">{interviews.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/70 shadow-sm">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Avg. Score</p>
                <p className="text-xl font-bold text-white tracking-tight">
                  {averageScore ? `${averageScore}%` : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/70 shadow-sm">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Resumes Synced</p>
                <p className="text-xl font-bold text-white tracking-tight">{resumes.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/70 shadow-sm">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Active Track</p>
                <p className="text-sm font-bold text-white truncate max-w-[120px]">
                  {interviews[0]?.roleTitle || "Full Stack"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-800 space-x-6">
          <button
            onClick={() => setActiveTab("interviews")}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === "interviews" ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Past Interview Sessions
            {activeTab === "interviews" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("resumes")}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === "resumes" ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            My Resumes & Skill Tags ({resumes.length})
            {activeTab === "resumes" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Interviews List */}
        {activeTab === "interviews" && (
          <div>
            {isLoadingData ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-3" />
                <p>Loading your sessions...</p>
              </div>
            ) : interviews.length === 0 ? (
              /* Empty State */
              <Card className="bg-slate-900/30 border-slate-800/80 border-dashed p-10 text-center">
                <CardContent className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
                  <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <BrainCircuit className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">No interview sessions conducted yet</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      You haven't practiced any mock interviews so far. Start your first session to receive tailored questions and comprehensive AI evaluation!
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl mt-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Launch First Interview
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Populated Sessions Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interviews.map((session) => (
                  <Card
                    key={session.id}
                    className="bg-slate-900/50 border-slate-800 hover:border-slate-700/80 transition-all hover:shadow-lg hover:shadow-slate-950/50 group flex flex-col justify-between"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <span
                          className={`text-xxs font-semibold uppercase px-2 py-0.5 rounded-md border ${
                            session.interviewType === "technical"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : session.interviewType === "coding"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {session.interviewType}
                        </span>
                        <span
                          className={`text-xxs font-semibold px-2 py-0.5 rounded-full ${
                            session.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold text-white mt-2 group-hover:text-blue-400 transition-colors">
                        {session.roleTitle}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Layers className="h-3 w-3 text-slate-500" />
                        <span className="capitalize">{session.difficulty} Level</span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-1">
                      {session.resumeFileName && (
                        <div className="flex items-center text-xxs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          <FileText className="h-3.5 w-3.5 text-blue-400 mr-1.5 shrink-0" />
                          <span className="truncate">{session.resumeFileName} (RAG context)</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                        <div className="flex items-center space-x-1 text-slate-500 text-xxs">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                        </div>
                        {session.score !== undefined && session.score !== null ? (
                          <div className="flex items-center space-x-1 font-bold text-emerald-400">
                            <Award className="h-3.5 w-3.5" />
                            <span>{session.score}%</span>
                          </div>
                        ) : (
                          <span className="text-xxs text-slate-500">Scheduled</span>
                        )}
                      </div>

                      {session.status === "completed" ? (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs border-slate-800 hover:bg-slate-800 text-slate-300 font-medium rounded-xl cursor-pointer"
                            onClick={() => router.push(`/interview/${session.id}`)}
                          >
                            <History className="h-3.5 w-3.5 mr-1 text-slate-400" />
                            <span>Room</span>
                          </Button>
                          <Button
                            size="sm"
                            className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl cursor-pointer shadow-md shadow-emerald-600/20"
                            onClick={() => router.push(`/interview/${session.id}/feedback`)}
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            <span>Feedback</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs border-slate-800 hover:bg-slate-800 text-slate-300 font-medium rounded-xl cursor-pointer"
                            onClick={() => handleViewQuestions(session)}
                          >
                            <HelpCircle className="h-3.5 w-3.5 mr-1 text-blue-400" />
                            <span>Questions</span>
                          </Button>
                          <Button
                            size="sm"
                            className="w-full text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl cursor-pointer"
                            onClick={() => router.push(`/interview/${session.id}`)}
                          >
                            <span>Launch</span>
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Resumes List */}
        {activeTab === "resumes" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Attached Resumes & Vector Embeddings</h3>
                <p className="text-xs text-slate-400">
                  Resumes are chunked and stored as 768-dimension vectors in PostgreSQL (pgvector) for personalized semantic RAG retrieval.
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingResume}
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isUploadingResume ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Upload className="h-4 w-4 mr-1.5" />
                )}
                Upload Resume (PDF/TXT)
              </Button>
            </div>

            {resumeUploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                <span>{resumeUploadError}</span>
              </div>
            )}

            {resumes.length === 0 ? (
              <Card className="bg-slate-900/30 border-slate-800/80 border-dashed p-8 text-center">
                <CardContent className="space-y-3">
                  <FileUp className="h-8 w-8 mx-auto text-slate-500" />
                  <p className="text-sm font-semibold text-slate-300">No resumes uploaded yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Upload your resume to allow Gemini to tailor interview scenarios directly to your engineering experience.
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs mt-2"
                  >
                    Select File
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resumes.map((resume) => (
                  <Card key={resume.id} className="bg-slate-900/40 border-slate-800 flex flex-col justify-between">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-[250px]">
                            {resume.fileName}
                          </CardTitle>
                          <CardDescription className="text-xxs text-slate-500">
                            Added {new Date(resume.createdAt).toLocaleDateString()} • pgvector indexed
                          </CardDescription>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteResume(resume.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                        title="Delete resume"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <span className="text-xxs uppercase tracking-wider text-slate-500 font-semibold block mb-1.5">
                          Detected Skills ({resume.parsedSkills?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {resume.parsedSkills && resume.parsedSkills.length > 0 ? (
                            resume.parsedSkills.slice(0, 10).map((skill, idx) => (
                              <span
                                key={idx}
                                className="text-xxs font-medium bg-slate-800 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded-md"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-xxs text-slate-500 italic">No specific tech skills detected</span>
                          )}
                          {resume.parsedSkills && resume.parsedSkills.length > 10 && (
                            <span className="text-xxs text-slate-500">+{resume.parsedSkills.length - 10} more</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80">
                        <Button
                          onClick={() => handleOpenRagSearch(resume)}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs border-slate-800 hover:bg-slate-800 text-blue-400 hover:text-blue-300 rounded-xl"
                        >
                          <Search className="h-3.5 w-3.5 mr-1.5" />
                          Test Semantic Search (RAG)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL: "Start New Interview" Flow                               */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Configure Mock Interview</h2>
                    <p className="text-xs text-slate-400">Set your interview target and attach background context</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleStartInterview} className="p-6 space-y-6 overflow-y-auto flex-1">
                {createError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Step 1: Target Role */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-semibold text-slate-300">
                    1. Target Role Title
                  </Label>
                  <Input
                    id="role"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="bg-slate-950 border-slate-800 text-white rounded-xl focus:border-blue-500"
                    required
                  />
                  {/* Quick role suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "Full Stack Engineer",
                      "Frontend Developer",
                      "Backend Engineer",
                      "DevOps / SRE",
                      "System Architect",
                    ].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setRoleTitle(role)}
                        className={`text-xxs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          roleTitle === role
                            ? "bg-blue-600/20 border-blue-500 text-blue-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Difficulty Level */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-300">2. Seniority & Difficulty</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["junior", "intermediate", "senior", "lead"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-all cursor-pointer ${
                          difficulty === lvl
                            ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3: Interview Type Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-300">3. Interview Type</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Technical */}
                    <div
                      onClick={() => setInterviewType("technical")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        interviewType === "technical"
                          ? "bg-blue-500/10 border-blue-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Cpu className="h-5 w-5 mb-2 text-blue-400" />
                      <div>
                        <p className="text-xs font-bold text-white">Technical</p>
                        <p className="text-xxs text-slate-400 mt-0.5">Concepts & Architecture</p>
                      </div>
                    </div>

                    {/* Behavioral */}
                    <div
                      onClick={() => setInterviewType("behavioral")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        interviewType === "behavioral"
                          ? "bg-emerald-500/10 border-emerald-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Users className="h-5 w-5 mb-2 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-white">Behavioral</p>
                        <p className="text-xxs text-slate-400 mt-0.5">STAR method & fit</p>
                      </div>
                    </div>

                    {/* Coding */}
                    <div
                      onClick={() => setInterviewType("coding")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        interviewType === "coding"
                          ? "bg-purple-500/10 border-purple-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Code2 className="h-5 w-5 mb-2 text-purple-400" />
                      <div>
                        <p className="text-xs font-bold text-white">Coding</p>
                        <p className="text-xxs text-slate-400 mt-0.5">Algorithms & Judge0</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Resume Selection or Upload */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-slate-300">
                      4. Resume for RAG Context (Semantic Retrieval)
                    </Label>
                    <button
                      type="button"
                      disabled={isUploadingResume}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xxs text-blue-400 hover:underline flex items-center font-medium disabled:opacity-50 cursor-pointer"
                    >
                      {isUploadingResume ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Uploading & Indexing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3 mr-1" />
                          Upload New
                        </>
                      )}
                    </button>
                  </div>

                  {isUploadingResume && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center space-x-2 animate-pulse">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />
                      <span>Parsing resume, extracting technical skills, and indexing pgvector embeddings...</span>
                    </div>
                  )}

                  {resumeUploadError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                      <span>{resumeUploadError}</span>
                    </div>
                  )}

                  {resumes.length === 0 ? (
                    <div
                      onClick={() => !isUploadingResume && fileInputRef.current?.click()}
                      className={`border border-dashed border-slate-800 bg-slate-950 p-4 rounded-xl text-center ${
                        isUploadingResume ? "opacity-50 cursor-wait" : "cursor-pointer hover:border-slate-700"
                      }`}
                    >
                      <Upload className="h-5 w-5 mx-auto text-slate-500 mb-1" />
                      <p className="text-xs font-medium text-slate-300">
                        {isUploadingResume ? "Processing resume..." : "Click to upload your resume (PDF/TXT)"}
                      </p>
                      <p className="text-xxs text-slate-500 mt-0.5">Gemini will personalize questions based on your background</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {resumes.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => setSelectedResumeId(r.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                            selectedResumeId === r.id
                              ? "bg-blue-600/10 border-blue-500 text-white"
                              : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                            <span className="truncate font-medium">{r.fileName}</span>
                          </div>
                          {selectedResumeId === r.id && (
                            <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                          )}
                        </div>
                      ))}
                      <div
                        onClick={() => setSelectedResumeId(null)}
                        className={`p-2 rounded-xl border cursor-pointer text-center text-xxs transition-all ${
                          selectedResumeId === null
                            ? "bg-blue-600/10 border-blue-500 text-white font-semibold"
                            : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-300"
                        }`}
                      >
                        Continue without attaching a resume (standard questions)
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2 border-t border-slate-800 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="border-slate-800 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreatingSession}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-5 cursor-pointer"
                  >
                    {isCreatingSession ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Questions via RAG...
                      </>
                    ) : createSuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" />
                        Session Ready!
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate & Launch
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: Personalized Questions Preview                           */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isQuestionsModalOpen && activeSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xxs uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {activeSession.interviewType} Round
                    </span>
                    <span className="text-xxs text-slate-400">
                      {activeSession.difficulty} • {activeSession.roleTitle}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">Generated Interview Questions</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRegeneratingQuestions}
                    onClick={handleRegenerateQuestions}
                    className="border-slate-800 text-slate-300 hover:text-white text-xs"
                    title="Regenerate questions using RAG context"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRegeneratingQuestions ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                  <button
                    onClick={() => setIsQuestionsModalOpen(false)}
                    className="text-slate-400 hover:text-white p-1 rounded"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
                {isLoadingQuestions ? (
                  <div className="py-12 text-center text-slate-400">
                    <Loader2 className="h-7 w-7 animate-spin mx-auto text-blue-500 mb-2" />
                    <p className="text-sm">Fetching personalized questions from RAG pipeline...</p>
                  </div>
                ) : sessionQuestions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No questions generated yet for this session.
                  </div>
                ) : (
                  sessionQuestions.map((q) => (
                    <div
                      key={q.id || q.questionOrder}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xxs font-semibold">
                        <span className="text-blue-400">Question {q.questionOrder}</span>
                        <span className="text-slate-500">{q.category}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-200 leading-relaxed">
                        {q.questionText}
                      </p>
                      {q.expectedPoints && q.expectedPoints.length > 0 && (
                        <div className="pt-2 border-t border-slate-900 text-xxs text-slate-400">
                          <span className="font-semibold text-slate-500 block mb-1">Target Evaluation Points:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                            {q.expectedPoints.map((pt, idx) => (
                              <li key={idx}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {q.codeStarterSnippet && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xxs text-emerald-300 overflow-x-auto">
                          <pre>{q.codeStarterSnippet}</pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xxs text-slate-500">
                  Questions are generated via Gemini API conditioned on your resume via pgvector semantic search.
                </span>
                <Button
                  onClick={() => setIsQuestionsModalOpen(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs px-4"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: Test Semantic Search (RAG Visualizer)                     */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isRagModalOpen && activeResumeForSearch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div>
                  <div className="inline-flex items-center space-x-1.5 text-xxs font-semibold text-blue-400 uppercase tracking-wider">
                    <Search className="h-3 w-3" />
                    <span>pgvector Semantic Search</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    RAG Retrieval: {activeResumeForSearch.fileName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Query your resume chunks using cosine distance vector similarity (768-dim embeddings).
                  </p>
                </div>
                <button
                  onClick={() => setIsRagModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Form */}
              <form onSubmit={handleExecuteRagSearch} className="pt-4 flex gap-2">
                <Input
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  placeholder="Enter semantic topic (e.g. distributed systems, React performance, Redis)..."
                  className="bg-slate-950 border-slate-800 text-white rounded-xl text-xs flex-1"
                  required
                />
                <Button
                  type="submit"
                  disabled={isSearchingRag}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold px-4 cursor-pointer"
                >
                  {isSearchingRag ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search Vector DB"
                  )}
                </Button>
              </form>

              {ragSearchError && (
                <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                  {ragSearchError}
                </div>
              )}

              {/* Results Container */}
              <div className="overflow-y-auto flex-1 py-4 space-y-3 pr-1">
                {isSearchingRag ? (
                  <div className="py-12 text-center text-slate-400">
                    <Loader2 className="h-7 w-7 animate-spin mx-auto text-blue-500 mb-2" />
                    <p className="text-xs">Computing cosine similarity across resume chunks in PostgreSQL...</p>
                  </div>
                ) : ragResults.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 text-xs">
                    Enter a query above and click "Search Vector DB" to retrieve the most semantically relevant parts of your resume.
                  </div>
                ) : (
                  ragResults.map((match, idx) => (
                    <div
                      key={match.id || idx}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xxs">
                        <span className="font-semibold text-blue-400">
                          {match.sectionTitle || `Match #${idx + 1}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {(match.similarity * 100).toFixed(1)}% Cosine Similarity
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-mono bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                        {match.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL: Standalone Resume Manager                                */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isResumeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">Manage Resumes & Embeddings</h3>
                </div>
                <button
                  onClick={() => setIsResumeModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold py-2.5"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Resume (PDF or TXT)
                </Button>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {resumes.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold text-white truncate">{r.fileName}</p>
                        <p className="text-xxs text-slate-500">
                          {r.parsedSkills?.length || 0} skills detected • pgvector indexed
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteResume(r.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
