import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Code2,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,

  ArrowLeft,
  Loader2,
  Cpu,
  Layers
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { practiceApi } from "../services/practiceApi";
import { b2cApi } from "../services/b2cApi";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { MathRenderer } from "../components/common/MathRenderer";
import { OutputDiffViewer } from "../components/common/OutputDiffViewer";

const STARTER_CODES = {
  cpp: `// C++ (GCC) Solution
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Read input from stdin and write output to stdout
    
    return 0;
}`,
  python: `# Python 3 Solution
import sys

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # Write solution logic here

if __name__ == '__main__':
    main()
`,
  java: `// Java (OpenJDK) Solution
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write solution logic here
    }
}`,
  javascript: `// JavaScript (Node.js) Solution
const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8');
    // Write solution logic here
}

main();
`
};

export function CodingArenaPage() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { user, subscription, planTier, isPaid, refreshSubscription } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [problem, setProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [language, setLanguage] = useState("cpp");
  const [sourceCode, setSourceCode] = useState(STARTER_CODES.cpp);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcases"); // "testcases" | "custominput" | "output"
  const [customInputText, setCustomInputText] = useState("");
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Drafts keyed by language, preserved per question
  const storageKey = `flash_arena_drafts_${questionId || "default"}`;
  const [drafts, setDrafts] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return { ...STARTER_CODES };
  });

  const solvedQuestionIds = useMemo(() => {
    return new Set(user?.solvedQuestions || []);
  }, [user]);

  const isCurrentProblemSolved = useMemo(() => {
    if (!problem?.id) return false;
    return solvedQuestionIds.has(problem.id) || solvedQuestionIds.has(questionId);
  }, [problem, questionId, solvedQuestionIds]);

  // Load real problem by questionId from PostgreSQL Question Bank
  useEffect(() => {
    let isMounted = true;
    async function loadQuestion() {
      if (!questionId) {
        setLoadingProblem(true);
        try {
          // If no questionId in URL, fetch first available coding question from backend
          const res = await practiceApi.getQuestions({ type: "CODING", limit: 1 });
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          if (list.length > 0 && isMounted) {
            navigate(`/coding/${list[0].id}`, { replace: true });
            return;
          }
        } catch (_) {}

        if (isMounted) {
          setProblem({
            id: "two-sum",
            versionId: null,
            questionVersionId: null,
            title: "Two Sum",
            category: "Array & Hashing",
            difficulty: "EASY",
            statement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
            constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
            timeLimit: "1.0s",
            memoryLimit: "256MB",
            testCases: [
              { input: "4\n2 7 11 15\n9", expectedOutput: "0 1" }
            ],
            starterCodes: STARTER_CODES
          });
          setLoadingProblem(false);
        }
        return;
      }

      setLoadingProblem(true);
      try {
        const res = await practiceApi.getQuestionById(questionId);
        const data = res?.data || res;
        if (data && isMounted) {
          const version = (data.versions && data.versions[0]) || {};
          const cp = version.codingProblem || data.codingProblem || {};
          const rawTestCases = cp.testCases || data.sampleTestCases || data.testCases || [];
          const testCases = rawTestCases.map((tc) => ({
            id: tc.id,
            input: tc.input || "",
            expectedOutput: tc.expectedOutput || "",
            isHidden: Boolean(tc.isHidden)
          }));

          const resolvedStarterCodes = data.starterCodes || STARTER_CODES;
          const targetProblem = {
            id: data.id,
            versionId: data.versionId || data.questionVersionId || version.id,
            questionVersionId: data.versionId || data.questionVersionId || version.id,
            title: version.title || data.latestTitle || data.title || "Coding Challenge",
            category: (data.subcategory || data.category || "DSA").replace(/_/g, " "),
            difficulty: (data.difficulty || "MEDIUM").toUpperCase(),
            statement: version.statement || data.statement || "No detailed statement provided.",
            constraints: cp.constraints || data.constraints || "Time Limit: 2.0s | Memory Limit: 128MB",
            timeLimit: cp.timeLimitMs ? `${cp.timeLimitMs / 1000}s` : (data.timeLimit || "2.0s"),
            memoryLimit: cp.memoryLimitKb ? `${Math.round(cp.memoryLimitKb / 1024)}MB` : (data.memoryLimit || "128MB"),
            inputFormat: cp.inputFormat || "Standard input via stdin",
            outputFormat: cp.outputFormat || "Standard output via stdout",
            testCases: testCases.length > 0 ? testCases : [
              { input: "[Sample Input]", expectedOutput: "[Sample Output]" }
            ],
            starterCodes: resolvedStarterCodes
          };

          setProblem(targetProblem);

          // Restore draft or starter code
          let savedDrafts = null;
          try {
            const rawSaved = localStorage.getItem(`flash_arena_drafts_${data.id}`);
            if (rawSaved) savedDrafts = JSON.parse(rawSaved);
          } catch (_) {}

          const currentDrafts = savedDrafts || resolvedStarterCodes;
          setDrafts(currentDrafts);
          setSourceCode(currentDrafts[language] || resolvedStarterCodes[language] || STARTER_CODES[language]);
        }
      } catch (err) {
        console.warn("Could not load question details from API:", err);
        if (isMounted) {
          showError("Could not load question details from database.");
        }
      } finally {
        if (isMounted) setLoadingProblem(false);
      }
    }

    loadQuestion();
    return () => { isMounted = false; };
  }, [questionId]);

  
  // Save drafts when code changes
  const handleCodeChange = (newCode) => {
    const val = newCode || "";
    setSourceCode(val);
    setDrafts((prev) => {
      const updated = { ...prev, [language]: val };
      try {
        localStorage.setItem(`flash_arena_drafts_${problem?.id || questionId || "default"}`, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  // Switch language without destroying user's existing work
  const handleLanguageChange = (e) => {
    const nextLang = e.target.value;
    // Save current language draft first
    const updatedDrafts = { ...drafts, [language]: sourceCode };
    setDrafts(updatedDrafts);
    try {
      localStorage.setItem(`flash_arena_drafts_${problem?.id || questionId || "default"}`, JSON.stringify(updatedDrafts));
    } catch (_) {}

    setLanguage(nextLang);
    const restoredCode = updatedDrafts[nextLang] || problem?.starterCodes?.[nextLang] || STARTER_CODES[nextLang] || "";
    setSourceCode(restoredCode);
  };

  const resetToStarter = () => {
    const starter = problem?.starterCodes?.[language] || STARTER_CODES[language] || "";
    setSourceCode(starter);
    setDrafts((prev) => {
      const updated = { ...prev, [language]: starter };
      try {
        localStorage.setItem(`flash_arena_drafts_${problem?.id || questionId || "default"}`, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    showSuccess(`Reset to default ${language.toUpperCase()} template.`);
  };

  const handleRunCode = async () => {
    if (!sourceCode.trim()) {
      showWarning("Please write some code before executing.");
      return;
    }

    setRunning(true);
    setActiveConsoleTab("output");
    try {
      const payload = {
        language,
        sourceCode,
        questionId: problem?.id,
        questionVersionId: problem?.questionVersionId || problem?.versionId
      };

      if (useCustomInput && customInputText.trim()) {
        payload.customInput = customInputText;
      }

      const res = await practiceApi.runCode(payload);
      setExecutionResult(res);

      if (res.status === "ACCEPTED") {
        showSuccess(`Execution Succeeded! (${res.testsPassed || 0}/${res.testsTotal || 0} sample tests passed)`);
      } else if (res.status === "COMPILATION_ERROR") {
        showError("Compilation Error: Check console output.");
      } else if (res.status === "RUNTIME_ERROR") {
        showError("Runtime Error: Check console output.");
      } else if (res.status === "WRONG_ANSWER") {
        showWarning(`Sample tests failed (${res.testsPassed || 0}/${res.testsTotal || 0} passed).`);
      } else {
        showWarning(`Execution result: ${res.status}`);
      }
    } catch (err) {
      setExecutionResult({
        status: "ERROR",
        stderr: err.message || "Sandbox execution failed.",
        testsPassed: 0,
        testsTotal: 0
      });
      showError(err.message || "Code execution failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!sourceCode.trim()) {
      showWarning("Please write some code before submitting.");
      return;
    }

    setSubmitting(true);
    setActiveConsoleTab("output");
    try {
      const res = await practiceApi.submitCode({
        language,
        sourceCode,
        questionId: problem?.id,
        questionVersionId: problem?.questionVersionId || problem?.versionId
      });

      setExecutionResult(res);

      if (res.status === "ACCEPTED") {
        try {
          await b2cApi.recordQuestionAttempt({
            questionType: "DSA",
            type: "DSA",
            passed: true,
            questionId: problem?.id,
            topicId: problem?.id
          });
          if (typeof refreshSubscription === "function") {
            await refreshSubscription();
          }
        } catch (telemetryErr) {
          console.warn("Could not update telemetry/subscription:", telemetryErr);
        }
        showSuccess("Solution Accepted! All test cases passed successfully.");
      } else {
        showWarning(`Evaluation: ${res.status} (${res.testsPassed || 0}/${res.testsTotal || 0} test cases passed).`);
      }
    } catch (err) {
      setExecutionResult({
        status: "ERROR",
        stderr: err.message || "Solution submission failed.",
        testsPassed: 0,
        testsTotal: 0
      });
      showError(err.message || "Solution submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(sourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDifficultyBadge = (difficulty) => {
    switch ((difficulty || "").toUpperCase()) {
      case "EASY":
        return <Badge variant="success" size="sm">Easy</Badge>;
      case "MEDIUM":
        return <Badge variant="warning" size="sm">Medium</Badge>;
      case "HARD":
        return <Badge variant="danger" size="sm">Hard</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{difficulty || "Medium"}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACCEPTED":
        return <Badge variant="success" size="sm">Accepted</Badge>;
      case "WRONG_ANSWER":
        return <Badge variant="warning" size="sm">Wrong Answer</Badge>;
      case "COMPILATION_ERROR":
        return <Badge variant="danger" size="sm">Compilation Error</Badge>;
      case "RUNTIME_ERROR":
        return <Badge variant="danger" size="sm">Runtime Error</Badge>;
      case "TIME_LIMIT_EXCEEDED":
        return <Badge variant="danger" size="sm">Time Limit Exceeded</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status || "Executed"}</Badge>;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-12">
      
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/coding"
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Back to All Questions"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All Challenges</span>
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                <MathRenderer content={problem?.title || "Loading Problem..."} inline />
              </h1>
              {problem && getDifficultyBadge(problem.difficulty)}
              {problem?.category && (
                <Badge variant="neutral" size="sm">{problem.category}</Badge>
              )}
              {isCurrentProblemSolved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Solved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
          >
            <option value="cpp">C++ (GCC 9.2)</option>
            <option value="python">Python 3.8</option>
            <option value="java">Java 13 (OpenJDK)</option>
            <option value="javascript">JavaScript (Node 12)</option>
          </select>

          
          <Button
            size="sm"
            variant="outline"
            loading={running}
            onClick={handleRunCode}
            className="cursor-pointer font-semibold"
          >
            <Play className="w-3.5 h-3.5 mr-1 text-emerald-600 fill-emerald-600" /> Run Code
          </Button>

          <Button
            size="sm"
            variant="primary"
            loading={submitting}
            onClick={handleSubmitCode}
            className="cursor-pointer font-semibold bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="w-3.5 h-3.5 mr-1" /> Submit
          </Button>
        </div>
      </div>

      {/* Main Split Arena Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
        
        {/* Left Column (5 Cols): Problem Description Card */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <Card className="p-5 h-full flex flex-col justify-between overflow-y-auto max-h-[720px] border-slate-200/90 shadow-xs">
            {loadingProblem ? (
              <div className="flex flex-col items-center justify-center py-28 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs font-medium">Loading problem statement from question bank...</span>
              </div>
            ) : (
              <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900">Problem Statement</h3>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                      title="Reload Question"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-slate-800 leading-relaxed font-sans text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <MathRenderer content={problem?.statement || "No problem statement provided."} />
                  </div>
                </div>

                {problem?.inputFormat && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Input Format:</h4>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 font-sans text-[11px] leading-relaxed">
                      <MathRenderer content={problem.inputFormat} />
                    </div>
                  </div>
                )}

                {problem?.outputFormat && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Output Format:</h4>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 font-sans text-[11px] leading-relaxed">
                      <MathRenderer content={problem.outputFormat} />
                    </div>
                  </div>
                )}

                {problem?.constraints && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5">Constraints:</h4>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 font-sans text-[11px] text-slate-700 leading-relaxed">
                      <MathRenderer content={problem.constraints} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Time Limit: {problem?.timeLimit || "2.0s"}</span>
              <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> Memory Limit: {problem?.memoryLimit || "128MB"}</span>
            </div>
          </Card>
        </div>

        {/* Right Column (7 Cols): Monaco Editor & Console Tabs */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Editor Container with clean dark border */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm flex flex-col flex-1">
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-400" /> solution.{language === "python" ? "py" : language === "cpp" ? "cpp" : language === "java" ? "java" : "js"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyCode}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={resetToStarter}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Reset to starter template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="h-[390px] sm:h-[430px]">
              <Editor
                height="100%"
                language={language === "cpp" ? "cpp" : language === "python" ? "python" : language === "java" ? "java" : "javascript"}
                theme="vs-dark"
                value={sourceCode}
                onChange={handleCodeChange}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  lineNumbers: "on",
                  wordWrap: "on"
                }}
              />
            </div>
          </div>

          {/* Console Drawer */}
          <Card className="p-4 bg-white border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveConsoleTab("testcases")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeConsoleTab === "testcases"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sample Cases
                </button>
                <button
                  onClick={() => setActiveConsoleTab("custominput")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeConsoleTab === "custominput"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Custom Input
                </button>
                <button
                  onClick={() => setActiveConsoleTab("output")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeConsoleTab === "output"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Execution Output
                </button>
              </div>

              {executionResult && getStatusBadge(executionResult.status)}
            </div>

            {activeConsoleTab === "testcases" && (
              <div className="space-y-2.5 text-xs font-mono max-h-[180px] overflow-y-auto">
                {problem?.testCases && problem.testCases.length > 0 ? (
                  problem.testCases.map((tc, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 space-y-1">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>Case {idx + 1}:</span>
                      </div>
                      <div><strong>Input:</strong> <span className="text-indigo-600 font-mono break-all whitespace-pre-wrap">{tc.input || "(empty input)"}</span></div>
                      <div><strong>Expected:</strong> <span className="text-emerald-600 font-mono break-all whitespace-pre-wrap">{tc.expectedOutput || "(empty)"}</span></div>
                      {tc.explanation && (
                        <div className="pt-1 text-slate-600 font-sans">
                          <strong>Explanation:</strong> <MathRenderer content={tc.explanation} inline />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 py-4 text-center">No public test cases provided.</div>
                )}
              </div>
            )}

            {activeConsoleTab === "custominput" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={useCustomInput}
                      onChange={(e) => setUseCustomInput(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    Use Custom Stdin Input for Run Code
                  </label>
                  {useCustomInput && (
                    <span className="text-[11px] text-indigo-600 font-medium">Custom input active</span>
                  )}
                </div>
                <textarea
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  placeholder="Enter custom input (passed to stdin)..."
                  className="w-full h-24 p-2.5 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>
            )}

            {activeConsoleTab === "output" && (
              <div className="space-y-3">
                {executionResult ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          Tests Passed: {executionResult.testsPassed || 0} / {executionResult.testsTotal || 0}
                        </span>
                        {executionResult.earnedMarks !== undefined && (
                          <span className="text-slate-500">
                            (Score: {executionResult.earnedMarks}/{executionResult.maxMarks || 100})
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {executionResult.executionTimeMs || 0}ms | {Math.round((executionResult.memoryUsedKb || 0) / 1024)}MB
                      </div>
                    </div>

                    {/* Compilation Error or Stderr Alert */}
                    {(executionResult.compileOutput || executionResult.stderr) && (
                      <div className="p-3 rounded-lg bg-rose-950/90 border border-rose-800 text-rose-200 font-mono text-xs whitespace-pre-wrap max-h-36 overflow-y-auto">
                        <div className="font-bold text-rose-300 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Compiler / Runtime Output:
                        </div>
                        {executionResult.compileOutput || executionResult.stderr}
                      </div>
                    )}

                    {/* Test Case Execution Breakdown */}
                    {executionResult.testResults && executionResult.testResults.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {executionResult.testResults.map((tr, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border text-xs font-mono ${
                              tr.passed
                                ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                                : "bg-rose-50/50 border-rose-200 text-rose-900"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span className="flex items-center gap-1.5">
                                {tr.passed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                )}
                                Test Case {tr.index || idx + 1} {tr.isHidden ? "(Hidden)" : ""}
                              </span>
                              <span className="text-[11px] font-semibold">
                                {tr.status} ({tr.executionTimeMs || 0}ms)
                              </span>
                            </div>

                            {!tr.isHidden && (
                              <div className="space-y-1.5 text-[11px] text-slate-700">
                                <div><strong>Input:</strong> <span className="font-mono text-indigo-700 bg-white/60 px-1 py-0.5 rounded break-all whitespace-pre-wrap">{tr.input || "(empty)"}</span></div>
                                <OutputDiffViewer
                                  expected={tr.expected}
                                  actual={tr.actual}
                                  passed={tr.passed}
                                />
                              </div>
                            )}

                            {tr.isHidden && (
                              <div className="text-[11px] text-slate-500 italic">
                                Hidden test case input and output are preserved securely on the server.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Stdout Output (if no test cases or general output) */}
                    {executionResult.stdout && (!executionResult.testResults || executionResult.testResults.length <= 1) && (
                      <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-200">
                        <div className="text-slate-400 font-bold mb-1">&gt; Standard Output:</div>
                        <div className="whitespace-pre-wrap">{executionResult.stdout}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 py-6 text-center text-xs">
                    Click <strong>Run Code</strong> or <strong>Submit</strong> to evaluate your solution against the test suite.
                  </div>
                )}
              </div>
            )}
          </Card>

        </div>

      </div>

    </div>
  );
}

export default CodingArenaPage;
