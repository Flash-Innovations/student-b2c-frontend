import { practiceApi } from "./practiceApi";

export const STARTER_CODES = {
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

export function formatProblemData(data, fallbackId) {
  if (!data) return null;
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
  const resolvedVersionId =
    data.versionId ||
    data.questionVersionId ||
    data.latestVersionId ||
    data.activeVersionId ||
    version.id ||
    (data.versions && data.versions[0]?.id) ||
    (data.latestVersion && data.latestVersion.id) ||
    data.id ||
    fallbackId;

  return {
    id: data.id || fallbackId,
    versionId: resolvedVersionId,
    questionVersionId: resolvedVersionId,
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
}

const CATALOG_STORAGE_KEY = "flash_preload_coding_catalog";
const PROBLEM_STORAGE_PREFIX = "flash_preload_coding_problem_";

let inMemoryCatalogCache = null;
const inMemoryProblemCache = new Map();
const inFlightPrefetches = new Set();
let isPreloadingCatalog = false;

export const codingPreloadService = {
  /**
   * Synchronously retrieve preloaded coding catalog (0ms latency)
   */
  getCodingCatalog() {
    if (inMemoryCatalogCache && Array.isArray(inMemoryCatalogCache) && inMemoryCatalogCache.length > 0) {
      return inMemoryCatalogCache;
    }
    try {
      const raw = sessionStorage.getItem(CATALOG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryCatalogCache = parsed;
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  },

  /**
   * Preload entire coding question catalog upon student login or hub access
   */
  async preloadCodingCatalog({ force = false } = {}) {
    if (isPreloadingCatalog) {
      return inMemoryCatalogCache;
    }
    if (!force && inMemoryCatalogCache && inMemoryCatalogCache.length > 0) {
      return inMemoryCatalogCache;
    }

    isPreloadingCatalog = true;
    try {
      const res = await practiceApi.getQuestions({ type: "CODING", limit: 1000 });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.questions)
            ? res.questions
            : [];

      if (list.length > 0) {
        inMemoryCatalogCache = list;
        try {
          sessionStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(list));
        } catch (_) {}

        // Schedule warming top 5 problems in idle time
        this.preloadTopProblems(list.slice(0, 5));
      }
      return inMemoryCatalogCache;
    } catch (err) {
      console.warn("Could not preload coding catalog:", err);
      return inMemoryCatalogCache;
    } finally {
      isPreloadingCatalog = false;
    }
  },

  /**
   * Pre-warm top problems during idle time
   */
  preloadTopProblems(problems = []) {
    if (!Array.isArray(problems) || problems.length === 0) return;

    const runner = typeof window !== "undefined" && typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback
      : (cb) => setTimeout(cb, 150);

    runner(async () => {
      for (const q of problems.slice(0, 5)) {
        if (q && q.id && !this.getCachedProblem(q.id)) {
          await this.prefetchProblem(q.id);
          await new Promise((r) => setTimeout(r, 60));
        }
      }
    });
  },

  /**
   * Synchronously retrieve problem details by questionId (0ms latency)
   */
  getCachedProblem(questionId) {
    if (!questionId) return null;
    const strId = String(questionId);

    if (inMemoryProblemCache.has(strId)) {
      return inMemoryProblemCache.get(strId);
    }

    try {
      const raw = sessionStorage.getItem(`${PROBLEM_STORAGE_PREFIX}${strId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) {
          inMemoryProblemCache.set(strId, parsed);
          return parsed;
        }
      }
    } catch (_) {}

    return null;
  },

  /**
   * Save problem data into two-tier cache
   */
  cacheProblem(questionId, problemData) {
    if (!questionId || !problemData) return;
    const strId = String(questionId);

    inMemoryProblemCache.set(strId, problemData);
    try {
      sessionStorage.setItem(`${PROBLEM_STORAGE_PREFIX}${strId}`, JSON.stringify(problemData));
    } catch (_) {}
  },

  /**
   * Prefetch problem details on hover or background pre-warming
   */
  async prefetchProblem(questionId) {
    if (!questionId) return null;
    const strId = String(questionId);

    if (inMemoryProblemCache.has(strId)) {
      return inMemoryProblemCache.get(strId);
    }
    if (inFlightPrefetches.has(strId)) {
      return null;
    }

    inFlightPrefetches.add(strId);
    try {
      const res = await practiceApi.getQuestionById(strId);
      const data = res?.data || res;
      if (data) {
        const formatted = formatProblemData(data, strId);
        if (formatted) {
          this.cacheProblem(strId, formatted);
          return formatted;
        }
      }
    } catch (_) {
      // Background prefetch fails silently
    } finally {
      inFlightPrefetches.delete(strId);
    }
    return null;
  },

  /**
   * Purge cache upon logout
   */
  clearCache() {
    inMemoryCatalogCache = null;
    inMemoryProblemCache.clear();
    inFlightPrefetches.clear();
    try {
      sessionStorage.removeItem(CATALOG_STORAGE_KEY);
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(PROBLEM_STORAGE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (_) {}
  }
};

export default codingPreloadService;

