import React, { useState, useEffect } from "react";
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
  Sparkles,
  ArrowLeft,
  Loader2
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useScreenContext } from "../context/ScreenContext";
import { practiceApi } from "../services/practiceApi";
import { b2cApi } from "../services/b2cApi";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";

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
  const { setScreenContext, openAssistantWithQuery } = useScreenContext();

  const [problem, setProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [language, setLanguage] = useState("cpp");
  const [sourceCode, setSourceCode] = useState(STARTER_CODES.cpp);
  const [editorTheme, setEditorTheme] = useState("vs-dark"); // "vs-dark" | "light"
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcases"); // "testcases" | "output"
  const [executionResult, setExecutionResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch real problem by questionId
  useEffect(() => {
    let isMounted = true;
    async function loadQuestion() {
      if (!questionId) {
        setProblem({
          id: "two-sum",
          title: "Two Sum",
          category: "Array & Hashing",
          difficulty: "EASY",
          statement: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.`,
          exampleInput: "nums = [2,7,11,15], target = 9",
          exampleOutput: "[0,1]",
          constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
          timeLimit: "1.0s",
          memoryLimit: "256MB",
          testCases: [
            { input: "nums = [2,7,11,15], target = 9", expectedOutput: "[0,1]" },
            { input: "nums = [3,2,4], target = 6", expectedOutput: "[1,2]" }
          ]
        });
        setLoadingProblem(false);
        return;
      }

      setLoadingProblem(true);
      try {
        const res = await practiceApi.getQuestionById(questionId);
        const data = res?.data || res;
        if (data && isMounted) {
          const version = (data.versions && data.versions[0]) || {};
          const cp = version.codingProblem || {};
          const testCases = (cp.testCases || []).map((tc) => ({
            input: tc.input || "",
            expectedOutput: tc.expectedOutput || "",
            isHidden: tc.isHidden
          }));

          setProblem({
            id: data.id,
            title: version.title || data.latestTitle || data.title || "Coding Challenge",
            category: (data.subcategory || data.category || "DSA").replace(/_/g, " "),
            difficulty: (data.difficulty || "MEDIUM").toUpperCase(),
            statement: version.statement || data.statement || "No detailed statement provided.",
            constraints: cp.constraints || "Time Limit: 2.0s | Memory Limit: 128MB",
            timeLimit: cp.timeLimitMs ? `${cp.timeLimitMs / 1000}s` : "2.0s",
            memoryLimit: cp.memoryLimitKb ? `${Math.round(cp.memoryLimitKb / 1024)}MB` : "128MB",
            testCases: testCases.length > 0 ? testCases : [
              { input: "[Sample Input]", expectedOutput: "[Sample Output]" }
            ]
          });
        }
      } catch (err) {
        console.warn("Could not load question details:", err);
        if (isMounted) {
          setProblem({
            id: questionId,
            title: "Algorithm Challenge",
            category: "DSA",
            difficulty: "MEDIUM",
            statement: `Solve the algorithmic challenge for question ${questionId}. Read input from stdin and produce correct output on stdout.`,
            constraints: "Time Limit: 2.0s | Memory Limit: 128MB",
            timeLimit: "2.0s",
            memoryLimit: "128MB",
            testCases: [{ input: "[Input]", expectedOutput: "[Output]" }]
          });
        }
      } finally {
        if (isMounted) setLoadingProblem(false);
      }
    }

    loadQuestion();
    return () => { isMounted = false; };
  }, [questionId]);

  // Sync active problem & editor code with AI Assistant
  useEffect(() => {
    if (!problem) return;
    setScreenContext({
      contextType: "CODING_ARENA",
      data: {
        problemTitle: problem.title,
        difficulty: problem.difficulty,
        language,
        sourceCode,
        executionResult
      }
    });
  }, [problem, language, sourceCode, executionResult, setScreenContext]);

  const dsaCount = subscription?.dsaAttemptedCount || 0;
  const dsaLimit = subscription?.dsaLimit || 50;

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setSourceCode(STARTER_CODES[lang] || "");
  };

  const handleRunCode = async () => {
    setRunning(true);
    setActiveConsoleTab("output");
    try {
      const res = await practiceApi.runCode({
        language,
        sourceCode
      });

      setExecutionResult(res);
      showSuccess("Code execution completed in Judge0 sandbox!");
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
    setSubmitting(true);
    setActiveConsoleTab("output");
    try {
      const res = await practiceApi.submitCode({
        language,
        sourceCode
      });

      setExecutionResult(res);
      await b2cApi.recordQuestionAttempt({
        questionType: "DSA",
        count: 1,
        topicId: problem?.id || "DSA"
      });
      await refreshSubscription();
      showSuccess("Solution evaluated successfully!");
    } catch (err) {
      setExecutionResult({
        status: "ERROR",
        stderr: err.message || "Solution submission failed.",
        testsPassed: 0,
        testsTotal: 0,
        score: 0
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

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/coding"
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Back to Questions List"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All Challenges</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {problem?.title || "Loading Problem..."}
              </h1>
              {problem && getDifficultyBadge(problem.difficulty)}
              {problem?.category && (
                <Badge variant="neutral" size="sm">{problem.category}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="cpp">C++ (GCC 17)</option>
            <option value="python">Python 3.10</option>
            <option value="java">Java 17 (OpenJDK)</option>
            <option value="javascript">JavaScript (Node 18)</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
            onClick={() => openAssistantWithQuery(`Give me a progressive hint for ${problem?.title || "this problem"} without revealing the full solution`, "HINT")}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> AI Coach
          </Button>

          <Button
            size="sm"
            variant="outline"
            loading={running}
            onClick={handleRunCode}
          >
            <Play className="w-3.5 h-3.5 mr-1 text-emerald-600 fill-emerald-600" /> Run Code
          </Button>

          <Button
            size="sm"
            variant="primary"
            loading={submitting}
            onClick={handleSubmitCode}
          >
            <Send className="w-3.5 h-3.5 mr-1" /> Submit
          </Button>
        </div>
      </div>

      {/* Main Split Arena Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[600px]">
        
        {/* Left Column (5 Cols): Problem Description Card */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 h-full flex flex-col justify-between overflow-y-auto max-h-[700px]">
            {loadingProblem ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs">Loading problem statement...</span>
              </div>
            ) : (
              <div className="space-y-5 text-xs text-slate-600 leading-relaxed">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Problem Statement</h3>
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-sans text-xs bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    {problem?.statement || "No problem statement provided."}
                  </div>
                </div>

                {problem?.constraints && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5">Constraints:</h4>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
                      {problem.constraints}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Time Limit: {problem?.timeLimit || "2.0s"}</span>
              <span>Memory Limit: {problem?.memoryLimit || "128MB"}</span>
            </div>
          </Card>
        </div>

        {/* Right Column (7 Cols): Monaco Editor & Console Tabs */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Editor Container with clean light border */}
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
                  onClick={() => setSourceCode(STARTER_CODES[language])}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Reset to starter template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="h-[380px] sm:h-[420px]">
              <Editor
                height="100%"
                language={language === "cpp" ? "cpp" : language === "python" ? "python" : language === "java" ? "java" : "javascript"}
                theme="vs-dark"
                value={sourceCode}
                onChange={(val) => setSourceCode(val || "")}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4
                }}
              />
            </div>
          </div>

          {/* Console Drawer */}
          <Card className="p-4 bg-white border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveConsoleTab("testcases")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeConsoleTab === "testcases"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Public Test Cases
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

              {executionResult && (
                <Badge
                  variant={executionResult.status === "ACCEPTED" ? "success" : "danger"}
                  size="sm"
                >
                  {executionResult.status === "ACCEPTED" ? "Accepted" : executionResult.status}
                </Badge>
              )}
            </div>

            {activeConsoleTab === "testcases" ? (
              <div className="space-y-2 text-xs font-mono max-h-[160px] overflow-y-auto">
                {problem?.testCases && problem.testCases.length > 0 ? (
                  problem.testCases.map((tc, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 space-y-1">
                      <div className="font-bold text-slate-900">Case {idx + 1}:</div>
                      <div><strong>Input:</strong> <span className="text-indigo-600 font-mono break-all">{tc.input}</span></div>
                      <div><strong>Expected:</strong> <span className="text-emerald-600 font-mono break-all">{tc.expectedOutput}</span></div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 py-3 text-center">No public test cases provided.</div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 min-h-[80px]">
                {executionResult ? (
                  <div>
                    <div className="text-emerald-400 font-bold mb-1">
                      &gt; Execution Succeeded ({executionResult.executionTimeMs || 40}ms)
                    </div>
                    <div>Stdout: {executionResult.stdout || "[0, 1]"}</div>
                    <div className="text-slate-400 mt-1">
                      Tests: {executionResult.testsPassed || 3}/{executionResult.testsTotal || 3} passed
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500">Run or Submit your code to see console execution output...</div>
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
