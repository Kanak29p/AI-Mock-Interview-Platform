"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  Layers,
  Code2,
  FileText,
  AlertCircle,
  HelpCircle,
  Clock,
  Mic,
  MicOff,
  Video,
  Volume2,
  Check,
  Award,
  ChevronRight,
  History,
  Terminal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  interviewApi,
  tokenStorage,
  InterviewSession,
  InterviewQuestion,
  ConversationTurn,
} from "@/lib/api";

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  // Session & Question states
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [questionOrder, setQuestionOrder] = useState(1);
  const maxQuestions = 5;

  // Candidate Response Input states
  const [userResponseText, setUserResponseText] = useState("");
  const [codeSubmission, setCodeSubmission] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [activeInputTab, setActiveInputTab] = useState<"text" | "code">("text");

  // Interaction & Loading states
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSnippet, setFeedbackSnippet] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Future Audio / Video STT & TTS plug-in state indicators
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isAudioSpeaking, setIsAudioSpeaking] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Authenticate and start or load interview session
  useEffect(() => {
    const initSession = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      if (!sessionId) return;

      try {
        setIsLoadingSession(true);
        // Start session (marks in_progress and retrieves current active question)
        const startRes = await interviewApi.startSession(sessionId);
        setSession(startRes.data.session);
        setCurrentQuestion(startRes.data.currentQuestion);
        setQuestionOrder(startRes.data.currentQuestion?.questionOrder || 1);

        if (startRes.data.session.status === "completed") {
          setIsCompleted(true);
        }

        // Load turns history
        const turnsRes = await interviewApi.getSessionTurns(sessionId);
        setTurns(turnsRes.data.turns);

        // Prepopulate starter code snippet if coding round
        if (startRes.data.currentQuestion?.codeStarterSnippet) {
          setCodeSubmission(startRes.data.currentQuestion.codeStarterSnippet);
          if (startRes.data.session.interviewType === "coding") {
            setActiveInputTab("code");
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to initialize interview room.");
      } finally {
        setIsLoadingSession(false);
      }
    };

    initSession();
  }, [sessionId, router]);

  // Focus textarea when question changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentQuestion]);

  // 2. Submit candidate answer & dynamically generate next question
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion) return;

    if (!userResponseText.trim() && !codeSubmission.trim()) {
      setErrorMessage("Please type your response or code solution before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await interviewApi.submitResponse(sessionId, {
        questionId: currentQuestion.id,
        userResponseText: userResponseText.trim(),
        codeSubmission: codeSubmission.trim() || undefined,
        codeLanguage: selectedLanguage,
      });

      // Update turn history with the answered turn
      setTurns((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          questionOrder: currentQuestion.questionOrder,
          questionText: currentQuestion.questionText,
          category: currentQuestion.category,
          userResponseText: userResponseText.trim(),
          codeSubmission: codeSubmission.trim() || undefined,
          codeLanguage: selectedLanguage,
          answeredAt: new Date().toISOString(),
        },
      ]);

      if (res.data.isCompleted || !res.data.nextQuestion) {
        setIsCompleted(true);
        setFeedbackSnippet(res.data.interviewerFeedbackSnippet || "Interview completed!");
      } else {
        // Transition to next dynamic question generated by Gemini
        setFeedbackSnippet(res.data.interviewerFeedbackSnippet || null);
        setCurrentQuestion(res.data.nextQuestion);
        setQuestionOrder(res.data.nextQuestion.questionOrder);
        setUserResponseText("");

        if (res.data.nextQuestion.codeStarterSnippet) {
          setCodeSubmission(res.data.nextQuestion.codeStarterSnippet);
        } else {
          setCodeSubmission("");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit answer and advance interview.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Early complete session
  const handleEndInterviewEarly = async () => {
    if (window.confirm("Are you sure you want to conclude this interview session early?")) {
      try {
        await interviewApi.completeSession(sessionId);
        setIsCompleted(true);
      } catch (err) {
        console.error("Failed to complete session:", err);
      }
    }
  };

  /**
   * AUDIO/SPEECH INTEGRATION PLUG-IN HOOK (Web Speech API / Whisper STT)
   * Future Phase: When microphone is toggled, capture audio stream and inject transcript into userResponseText
   */
  const handleToggleMic = () => {
    setIsMicEnabled(!isMicEnabled);
    if (!isMicEnabled) {
      alert("🎙️ Audio STT Hook: Text-based mode is active. Browser Speech-to-Text / Whisper plugs in here in Phase 5!");
    }
  };

  /**
   * AUDIO/VOICE READOUT PLUG-IN HOOK (Web Speech TTS / ElevenLabs)
   * Future Phase: Read aloud current question
   */
  const handleReadQuestionAloud = () => {
    if (!currentQuestion) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQuestion.questionText);
      utterance.rate = 1.0;
      utterance.onstart = () => setIsAudioSpeaking(true);
      utterance.onend = () => setIsAudioSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
        <p className="text-base font-medium text-slate-300">Entering AI Mock Interview Room...</p>
        <p className="text-xs text-slate-500 mt-1">Retrieving resume context and initializing interviewer persona</p>
      </div>
    );
  }

  // Completed State View
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl"
        >
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Mock Interview Completed!
            </h1>
            <p className="text-sm text-slate-400">
              You've answered all questions for the <span className="text-white font-semibold">{session?.roleTitle}</span> round.
            </p>
          </div>

          {feedbackSnippet && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 italic text-left">
              <span className="font-semibold text-blue-400 not-italic block mb-1">Interviewer Closing Note:</span>
              "{feedbackSnippet}"
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-left">
            <div>
              <span className="text-slate-500 block">Total Turns Answered</span>
              <span className="text-base font-bold text-white">{turns.length} Questions</span>
            </div>
            <div>
              <span className="text-slate-500 block">Round Type</span>
              <span className="text-base font-bold text-blue-400 capitalize">{session?.interviewType}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setIsHistoryDrawerOpen(true)}
              variant="outline"
              className="flex-1 border-slate-800 hover:bg-slate-800 text-slate-300"
            >
              <History className="h-4 w-4 mr-2" />
              Review Transcript
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Back to Dashboard
              <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-900 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                Live AI Interview Room
              </span>
            </div>
          </div>

          {/* Session Progress & Controls */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">Turn {questionOrder}</span>
              <span className="text-slate-500">of {maxQuestions}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)}
              className="border-slate-800 text-slate-300 hover:text-white text-xs"
            >
              <History className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Transcript</span> ({turns.length})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleEndInterviewEarly}
              className="border-rose-900/60 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs"
            >
              End Session
            </Button>
          </div>
        </div>
      </header>

      {/* Main Interview Chamber */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col space-y-6">
        {/* Session Meta Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-sm">{session?.roleTitle}</span>
            <span className="text-slate-500">•</span>
            <span className="capitalize text-slate-400">{session?.difficulty} Level</span>
            <span className="text-slate-500">•</span>
            <span className="capitalize text-blue-400 font-semibold">{session?.interviewType} Round</span>
          </div>

          {session?.resumeFileName && (
            <div className="flex items-center space-x-1.5 text-xxs text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              <span>Resume RAG: {session.resumeFileName}</span>
            </div>
          )}
        </div>

        {/* Interviewer Previous Turn Feedback Snippet (if available) */}
        {feedbackSnippet && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-300 flex items-start space-x-2.5"
          >
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-200">Interviewer Reaction:</span>{" "}
              {feedbackSnippet}
            </div>
          </motion.div>
        )}

        {/* Current Question Display Card */}
        <Card className="bg-slate-900/80 border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-800/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-white">Lead Technical Interviewer</CardTitle>
                  <CardDescription className="text-xxs text-slate-400">
                    Category: {currentQuestion?.category || "Core Engineering"}
                  </CardDescription>
                </div>
              </div>

              {/* TTS Audio Hook */}
              <button
                type="button"
                onClick={handleReadQuestionAloud}
                className={`p-2 rounded-xl border border-slate-800 transition-colors ${
                  isAudioSpeaking
                    ? "bg-blue-600/20 text-blue-400 border-blue-500/50"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Read question aloud (Text-to-Speech)"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
              {currentQuestion?.questionText}
            </p>

            {/* Code Starter Snippet if provided */}
            {currentQuestion?.codeStarterSnippet && (
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto">
                <div className="text-xxs uppercase tracking-wider text-slate-500 font-sans mb-1 font-semibold">
                  Starter Template:
                </div>
                <pre>{currentQuestion.codeStarterSnippet}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidate Response Workspace */}
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Header Bar with Mode Toggles & Audio/Video Placeholders */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveInputTab("text")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeInputTab === "text"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Text Response
              </button>

              <button
                type="button"
                onClick={() => setActiveInputTab("code")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeInputTab === "code"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Code Solution</span>
              </button>
            </div>

            {/* Placeholder Indicator for Audio & Video STT/TTS */}
            <div className="flex items-center space-x-2 text-xxs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
              <button
                type="button"
                onClick={handleToggleMic}
                className="hover:text-blue-400 flex items-center space-x-1"
                title="Microphone (STT plug-in hook in Phase 5)"
              >
                <Mic className={`h-3.5 w-3.5 ${isMicEnabled ? "text-emerald-400" : "text-slate-500"}`} />
                <span>Mic (Voice STT)</span>
              </button>
              <span className="text-slate-700">|</span>
              <span className="flex items-center space-x-1 text-slate-500" title="Webcam (Video capture hook in Phase 5)">
                <Video className="h-3.5 w-3.5" />
                <span>Video Feed</span>
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmitAnswer} className="space-y-4 flex-1 flex flex-col">
            {activeInputTab === "text" ? (
              <div className="relative flex-1 flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={userResponseText}
                  onChange={(e) => setUserResponseText(e.target.value)}
                  placeholder="Type your structured answer here. State your approach, mention trade-offs, explain edge cases, and draw on your experience..."
                  rows={8}
                  disabled={isSubmitting}
                  className="w-full flex-1 min-h-[200px] p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm leading-relaxed resize-y font-sans"
                />
                <div className="flex justify-between items-center text-xxs text-slate-500 mt-1 px-1">
                  <span>{userResponseText.split(/\s+/).filter(Boolean).length} words</span>
                  <span>{userResponseText.length} characters</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-xxs flex items-center">
                    <Terminal className="h-3.5 w-3.5 mr-1 text-blue-400" />
                    Editor Sandbox
                  </span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xxs rounded-lg px-2 py-1"
                  >
                    <option value="javascript">JavaScript / TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="go">Go</option>
                  </select>
                </div>
                <textarea
                  value={codeSubmission}
                  onChange={(e) => setCodeSubmission(e.target.value)}
                  placeholder="// Write your algorithm or code snippet here..."
                  rows={10}
                  disabled={isSubmitting}
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs font-mono leading-relaxed resize-y"
                />
              </div>
            )}

            {/* Submit Action */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xxs text-slate-500">
                Turn {questionOrder} of {maxQuestions} • Next question dynamically generated by Gemini
              </span>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-6 py-2.5 shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Interviewer is evaluating & thinking...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Answer
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Transcript History Drawer / Sidebar */}
      <AnimatePresence>
        {isHistoryDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col p-6 shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <History className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-base text-white">Interview Transcript</h3>
                </div>
                <button
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {turns.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No answered turns yet. Submit an answer to see your transcript history here!
                  </div>
                ) : (
                  turns.map((turn, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-xxs font-semibold">
                        <span className="text-blue-400">Q{turn.questionOrder}: {turn.category}</span>
                        <span className="text-slate-500">
                          {turn.answeredAt ? new Date(turn.answeredAt).toLocaleTimeString() : ""}
                        </span>
                      </div>
                      <p className="font-medium text-slate-200">{turn.questionText}</p>
                      <div className="pt-2 border-t border-slate-900 text-slate-400 bg-slate-900/40 p-2 rounded">
                        <span className="text-xxs font-semibold text-slate-500 block mb-0.5">Your Response:</span>
                        {turn.userResponseText && <p className="whitespace-pre-line">{turn.userResponseText}</p>}
                        {turn.codeSubmission && (
                          <pre className="font-mono text-xxs text-emerald-400 mt-1 overflow-x-auto">
                            {turn.codeSubmission}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <Button
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs"
                >
                  Close Transcript
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
