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
  Video,
  Volume2,
  Check,
  Award,
  ChevronRight,
  History,
  Terminal,
  Play,
  RotateCcw,
  CheckSquare,
  Cpu,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  interviewApi,
  codeApi,
  tokenStorage,
  InterviewSession,
  InterviewQuestion,
  ConversationTurn,
  BatchExecutionReport,
  TestCaseResult,
} from "@/lib/api";
import { MonacoCodeEditor } from "@/components/MonacoCodeEditor";

const LANGUAGE_STARTERS: Record<string, string> = {
  javascript: `/**
 * JavaScript Solution
 * @param {string} input
 * @return {void}
 */
function solve(input) {
  // Write your algorithm logic here
  console.log(input.trim());
}

// Test harness
solve("sample_input");
`,
  typescript: `/**
 * TypeScript Solution
 */
function solve(input: string): void {
  // Write your algorithm logic here
  console.log(input.trim());
}

solve("sample_input");
`,
  python: `import sys

def solve():
    # Write your solution logic here
    input_data = sys.stdin.read().strip()
    if input_data:
        print(input_data)
    else:
        print("Hello from Python")

if __name__ == "__main__":
    solve()
`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextLine()) {
            System.out.println(scanner.nextLine());
        } else {
            System.out.println("Java Solution Ready");
        }
    }
}
`,
  cpp: `#include <iostream>
#include <string>

using namespace std;

int main() {
    string line;
    if (getline(cin, line)) {
        cout << line << "\\n";
    } else {
        cout << "C++ Solution Ready\\n";
    }
    return 0;
}
`,
  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    if scanner.Scan() {
        fmt.Println(scanner.Text())
    } else {
        fmt.Println("Go Solution Ready")
    }
}
`,
};

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

  // Code Execution states (Judge0 / Sandbox)
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [executionReport, setExecutionReport] = useState<BatchExecutionReport | null>(null);
  const [customStdin, setCustomStdin] = useState("");
  const [activeTestTab, setActiveTestTab] = useState<"cases" | "custom" | "output">("cases");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

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
        if (startRes.data.session.interviewType === "coding") {
          setActiveInputTab("code");
        }

        if (startRes.data.currentQuestion?.codeStarterSnippet) {
          setCodeSubmission(startRes.data.currentQuestion.codeStarterSnippet);
        } else if (startRes.data.session.interviewType === "coding") {
          setCodeSubmission(LANGUAGE_STARTERS.javascript);
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
    if (textareaRef.current && activeInputTab === "text") {
      textareaRef.current.focus();
    }
  }, [currentQuestion, activeInputTab]);

  // Language switch handler
  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    // If current code is empty or matches starter snippet of previous language, switch starter
    if (!codeSubmission.trim() || Object.values(LANGUAGE_STARTERS).includes(codeSubmission.trim())) {
      setCodeSubmission(LANGUAGE_STARTERS[newLang] || "");
    }
  };

  const handleResetStarter = () => {
    if (currentQuestion?.codeStarterSnippet && selectedLanguage === "javascript") {
      setCodeSubmission(currentQuestion.codeStarterSnippet);
    } else {
      setCodeSubmission(LANGUAGE_STARTERS[selectedLanguage] || "");
    }
  };

  // Run code against test cases with Judge0 / Sandbox
  const handleRunCode = async () => {
    if (!codeSubmission.trim()) {
      setErrorMessage("Please enter your solution code before running.");
      return;
    }

    setIsRunningCode(true);
    setErrorMessage("");

    try {
      const qCases = currentQuestion?.testCases || [];
      const testCasesToRun = qCases.length > 0 ? qCases : undefined;

      const res = await codeApi.runCode({
        sourceCode: codeSubmission,
        language: selectedLanguage,
        stdin: customStdin,
        testCases: testCasesToRun,
      });

      setExecutionReport(res.data);
      if (qCases.length > 0) {
        setActiveTestTab("cases");
      } else {
        setActiveTestTab("output");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to execute code via Judge0 API / Sandbox.");
    } finally {
      setIsRunningCode(false);
    }
  };

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
      // Build execution summary string if tests were run
      const execSummary = executionReport
        ? `Execution: ${executionReport.passedTests}/${executionReport.totalTests} passed (${executionReport.executionMode}). Output: ${executionReport.results[0]?.actualOutput || ""}`
        : undefined;

      const res = await interviewApi.submitResponse(sessionId, {
        questionId: currentQuestion.id,
        userResponseText: userResponseText.trim(),
        codeSubmission: codeSubmission.trim() || undefined,
        codeLanguage: selectedLanguage,
        executionOutput: execSummary,
      });

      // Update turn history with the answered turn
      setTurns((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          questionOrder: currentQuestion.questionOrder,
          questionText: currentQuestion.questionText,
          expectedPoints: currentQuestion.expectedPoints,
          category: currentQuestion.category,
          difficulty: currentQuestion.difficulty,
          codeStarterSnippet: currentQuestion.codeStarterSnippet,
          testCases: currentQuestion.testCases,
          responseId: res.data.responseId,
          userResponseText: userResponseText.trim(),
          codeSubmission: codeSubmission.trim() || undefined,
          codeLanguage: selectedLanguage,
          executionOutput: execSummary,
          answeredAt: new Date().toISOString(),
        },
      ]);

      // Feedback snippet from interviewer
      if (res.data.interviewerFeedbackSnippet) {
        setFeedbackSnippet(res.data.interviewerFeedbackSnippet);
      }

      // Check if session reached the end
      if (res.data.isCompleted || !res.data.nextQuestion) {
        setIsCompleted(true);
        await interviewApi.completeSession(sessionId);
      } else {
        // Transition to next dynamic turn
        setCurrentQuestion(res.data.nextQuestion);
        setQuestionOrder(res.data.nextQuestion.questionOrder);
        setUserResponseText("");
        setExecutionReport(null);

        // Prepopulate starter code for next turn if available
        if (res.data.nextQuestion.codeStarterSnippet) {
          setCodeSubmission(res.data.nextQuestion.codeStarterSnippet);
        } else if (session?.interviewType === "coding") {
          setCodeSubmission(LANGUAGE_STARTERS[selectedLanguage] || "");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit answer and advance interview.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // TTS Voice Hook Simulation
  const handleReadQuestionAloud = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    if (isAudioSpeaking) {
      window.speechSynthesis.cancel();
      setIsAudioSpeaking(false);
      return;
    }

    if (!currentQuestion?.questionText) return;

    const utterance = new SpeechSynthesisUtterance(currentQuestion.questionText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsAudioSpeaking(false);
    utterance.onerror = () => setIsAudioSpeaking(false);

    setIsAudioSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Mic STT Placeholder toggle
  const handleToggleMic = () => {
    setIsMicEnabled(!isMicEnabled);
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="relative flex items-center justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center animate-pulse">
            <Bot className="h-8 w-8 text-blue-400" />
          </div>
          <Loader2 className="h-20 w-20 text-blue-500/40 animate-spin absolute" />
        </div>
        <h2 className="text-lg font-bold">Entering Mock Interview Chamber...</h2>
        <p className="text-xs text-slate-500 mt-1">Configuring AI agent, pgvector RAG context, and Judge0 sandbox</p>
      </div>
    );
  }

  // Interview Completed Celebration Screen
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="mx-auto h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Award className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Interview Complete!</h1>
            <p className="text-sm text-slate-400">
              Outstanding work. You completed all {turns.length} conversational turns for the{" "}
              <span className="text-blue-400 font-semibold">{session?.roleTitle}</span> mock interview.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Interview Round:</span>
              <span className="font-semibold text-slate-200 capitalize">{session?.interviewType} Round</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Difficulty:</span>
              <span className="font-semibold text-slate-200 capitalize">{session?.difficulty}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Turns Completed:</span>
              <span className="font-semibold text-emerald-400">{turns.length} / {maxQuestions}</span>
            </div>
            {session?.resumeFileName && (
              <div className="flex justify-between text-slate-400">
                <span>Resume Grounding:</span>
                <span className="font-semibold text-blue-300 truncate max-w-[200px]">
                  {session.resumeFileName}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={() => setIsHistoryDrawerOpen(true)}
              variant="outline"
              className="flex-1 border-slate-800 hover:bg-slate-800 text-slate-200 text-xs py-2.5 rounded-xl cursor-pointer"
            >
              <History className="h-4 w-4 mr-2 text-blue-400" />
              Review Transcript
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer">
                Return to Dashboard
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const questionTestCases = currentQuestion?.testCases || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
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
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-bold text-white flex items-center space-x-2">
                  <span>Interview Room</span>
                  <span className="text-xxs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    LIVE
                  </span>
                </h1>
                <p className="text-xxs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                  {session?.roleTitle} • {session?.difficulty}
                </p>
              </div>
            </div>
          </div>

          {/* Turn Progress & History Drawer Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
              <span className="text-blue-400 font-bold">Turn {questionOrder}</span>
              <span className="text-slate-600">/</span>
              <span>{maxQuestions}</span>
            </div>

            <Button
              onClick={() => setIsHistoryDrawerOpen(true)}
              variant="outline"
              size="sm"
              className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
            >
              <History className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
              Transcript ({turns.length})
            </Button>
          </div>
        </div>
      </header>

      {/* Main Interview Chamber */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col space-y-6">
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

            {/* Test cases summary pill if coding question */}
            {questionTestCases.length > 0 && (
              <div className="flex items-center space-x-2 text-xxs text-slate-400 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl w-fit">
                <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
                <span>{questionTestCases.length} Test Cases Provided • Judge0 Sandbox Verification Enabled</span>
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
                Text Explanation
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
                <span>Monaco Code Editor</span>
              </button>
            </div>

            {/* Placeholder Indicator for Audio & Video STT/TTS */}
            <div className="flex items-center space-x-2 text-xxs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
              <button
                type="button"
                onClick={handleToggleMic}
                className="hover:text-blue-400 flex items-center space-x-1 cursor-pointer"
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
                  className="w-full flex-1 min-h-[220px] p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm leading-relaxed resize-y font-sans"
                />
                <div className="flex justify-between items-center text-xxs text-slate-500 mt-1 px-1">
                  <span>{userResponseText.split(/\s+/).filter(Boolean).length} words</span>
                  <span>{userResponseText.length} characters</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex-1 flex flex-col">
                {/* Monaco Controls Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-mono text-xxs flex items-center">
                      <Terminal className="h-3.5 w-3.5 mr-1 text-blue-400" />
                      Language:
                    </span>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
                    >
                      <option value="javascript">JavaScript (Node.js)</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python 3</option>
                      <option value="java">Java (OpenJDK)</option>
                      <option value="cpp">C++ (GCC)</option>
                      <option value="go">Go</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleResetStarter}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1 text-xxs"
                      title="Reset code to starter template"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Run Code Button */}
                  <Button
                    type="button"
                    onClick={handleRunCode}
                    disabled={isRunningCode || isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-md shadow-emerald-600/20 cursor-pointer h-8"
                  >
                    {isRunningCode ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Running Judge0...
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                        Run Code
                      </>
                    )}
                  </Button>
                </div>

                {/* Monaco Editor Component */}
                <MonacoCodeEditor
                  value={codeSubmission}
                  onChange={(val) => setCodeSubmission(val || "")}
                  language={selectedLanguage}
                  height="340px"
                />

                {/* Test Cases / Judge0 Results Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setActiveTestTab("cases")}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          activeTestTab === "cases"
                            ? "bg-slate-800 text-white font-semibold"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Test Cases ({questionTestCases.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTestTab("custom")}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          activeTestTab === "custom"
                            ? "bg-slate-800 text-white font-semibold"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Custom Stdin
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTestTab("output")}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          activeTestTab === "output"
                            ? "bg-slate-800 text-white font-semibold"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Execution Output
                      </button>
                    </div>

                    {/* Overall Score / Pass Rate Badge */}
                    {executionReport && (
                      <div className="flex items-center space-x-2 text-xxs">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                            executionReport.allPassed
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {executionReport.allPassed ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          <span>
                            {executionReport.passedTests} / {executionReport.totalTests} Passed
                          </span>
                        </span>
                        <span className="text-slate-500 font-mono text-xxs">
                          [{executionReport.executionMode}]
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tab 1: Test Cases List */}
                  {activeTestTab === "cases" && (
                    <div className="space-y-3">
                      {questionTestCases.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">
                          No predefined test cases for this question. Switch to Custom Stdin to provide your own input!
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {/* Case Selectors */}
                          <div className="flex items-center space-x-2">
                            {questionTestCases.map((_, idx) => {
                              const testRes = executionReport?.results[idx];
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedCaseIdx(idx)}
                                  className={`text-xxs px-2.5 py-1 rounded-md font-mono flex items-center space-x-1.5 transition-colors cursor-pointer ${
                                    selectedCaseIdx === idx
                                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                                  }`}
                                >
                                  <span>Case {idx + 1}</span>
                                  {testRes && (
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        testRes.passed ? "bg-emerald-400" : "bg-rose-400"
                                      }`}
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Selected Case Details */}
                          {questionTestCases[selectedCaseIdx] && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                                <div className="text-xxs uppercase tracking-wider text-slate-500 mb-1 font-sans">
                                  Input:
                                </div>
                                <pre className="text-slate-300 whitespace-pre-wrap">
                                  {questionTestCases[selectedCaseIdx].input || "[Empty]"}
                                </pre>
                              </div>

                              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                                <div className="text-xxs uppercase tracking-wider text-slate-500 mb-1 font-sans">
                                  Expected Output:
                                </div>
                                <pre className="text-emerald-400 whitespace-pre-wrap">
                                  {questionTestCases[selectedCaseIdx].expectedOutput || "[Any]"}
                                </pre>
                              </div>
                            </div>
                          )}

                          {/* Execution Result for Selected Case */}
                          {executionReport?.results[selectedCaseIdx] && (
                            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 font-mono text-xs space-y-1.5">
                              <div className="flex justify-between items-center text-xxs font-sans">
                                <span className="font-semibold text-slate-400">Actual Output:</span>
                                <div className="flex items-center space-x-2">
                                  {executionReport.results[selectedCaseIdx].time && (
                                    <span className="text-slate-500">
                                      Time: {executionReport.results[selectedCaseIdx].time}
                                    </span>
                                  )}
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-xxs font-bold ${
                                      executionReport.results[selectedCaseIdx].passed
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : "bg-rose-500/20 text-rose-300"
                                    }`}
                                  >
                                    {executionReport.results[selectedCaseIdx].status}
                                  </span>
                                </div>
                              </div>
                              <pre className="text-slate-200 whitespace-pre-wrap bg-slate-900 p-2 rounded-lg border border-slate-800">
                                {executionReport.results[selectedCaseIdx].actualOutput || "[No stdout produced]"}
                              </pre>
                              {executionReport.results[selectedCaseIdx].error && (
                                <div className="text-rose-400 text-xxs pt-1">
                                  Error: {executionReport.results[selectedCaseIdx].error}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Custom Stdin */}
                  {activeTestTab === "custom" && (
                    <div className="space-y-2">
                      <div className="text-xxs text-slate-400">
                        Input passed to standard input (stdin) during execution:
                      </div>
                      <textarea
                        value={customStdin}
                        onChange={(e) => setCustomStdin(e.target.value)}
                        placeholder="Type custom test input here..."
                        rows={3}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* Tab 3: Console Output */}
                  {activeTestTab === "output" && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs">
                      <div className="text-xxs uppercase tracking-wider text-slate-500 mb-1 font-sans">
                        Standard Output & Diagnostics:
                      </div>
                      {executionReport ? (
                        <pre className="text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {executionReport.results
                            .map(
                              (r) =>
                                `[Case ${r.testIndex}] ${r.status} (${r.time || "0.0s"}):\n${
                                  r.actualOutput || "[Empty]"
                                }${r.error ? `\nError: ${r.error}` : ""}`
                            )
                            .join("\n\n")}
                        </pre>
                      ) : (
                        <p className="text-slate-500 text-xs italic">
                          Click "Run Code" to compile and execute your solution via Judge0 / Sandbox.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xxs text-slate-500">
                Turn {questionOrder} of {maxQuestions} • Next question dynamically generated by Gemini
              </span>

              <Button
                type="submit"
                disabled={isSubmitting || isRunningCode}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-6 py-2.5 shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Interviewer is evaluating solution...
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
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
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
                          <pre className="font-mono text-xxs text-emerald-400 mt-1 overflow-x-auto p-2 bg-slate-950 rounded">
                            {turn.codeSubmission}
                          </pre>
                        )}
                        {turn.executionOutput && (
                          <div className="mt-1 text-xxs font-mono text-blue-300">
                            {turn.executionOutput}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <Button
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs cursor-pointer"
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
