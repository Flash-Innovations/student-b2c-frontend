import React, { useMemo } from "react";
import { Copy, Check, AlertTriangle, ArrowRightLeft } from "lucide-react";

/**
 * OutputDiffViewer provides a visual character & line diff between
 * expected test case output and actual execution output.
 * Highlights exact character discrepancies and flags invisible whitespace mismatches.
 */
export function OutputDiffViewer({ expected = "", actual = "", passed = false }) {
  const [copiedExpected, setCopiedExpected] = React.useState(false);
  const [copiedActual, setCopiedActual] = React.useState(false);

  const expStr = String(expected ?? "");
  const actStr = String(actual ?? "");

  // Detect whitespace or newline differences
  const isWhitespaceOnlyDiff = useMemo(() => {
    if (passed || expStr === actStr) return false;
    return expStr.trim() === actStr.trim();
  }, [expStr, actStr, passed]);

  // Compute character-level diff tokens
  const { expectedTokens, actualTokens, firstDiffIndex } = useMemo(() => {
    if (passed || expStr === actStr) {
      return { expectedTokens: [], actualTokens: [], firstDiffIndex: -1 };
    }

    let diffIdx = -1;
    const maxLen = Math.max(expStr.length, actStr.length);
    for (let i = 0; i < maxLen; i++) {
      if (expStr[i] !== actStr[i]) {
        diffIdx = i;
        break;
      }
    }

    // Build diff segments
    const expChars = expStr.split("").map((ch, idx) => ({
      char: ch,
      isDiff: idx >= diffIdx && (actStr[idx] === undefined || ch !== actStr[idx])
    }));

    const actChars = actStr.split("").map((ch, idx) => ({
      char: ch,
      isDiff: idx >= diffIdx && (expStr[idx] === undefined || ch !== expStr[idx])
    }));

    return { expectedTokens: expChars, actualTokens: actChars, firstDiffIndex: diffIdx };
  }, [expStr, actStr, passed]);

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "expected") {
      setCopiedExpected(true);
      setTimeout(() => setCopiedExpected(false), 1500);
    } else {
      setCopiedActual(true);
      setTimeout(() => setCopiedActual(false), 1500);
    }
  };

  const renderVisualString = (tokens, isExpected) => {
    if (tokens.length === 0) {
      return <span className="italic text-slate-400 font-sans">(empty)</span>;
    }

    return tokens.map((token, idx) => {
      let displayChar = token.char;
      let isSpecial = false;

      if (token.char === " ") {
        displayChar = token.isDiff ? "·" : " ";
        isSpecial = token.isDiff;
      } else if (token.char === "\n") {
        displayChar = token.isDiff ? "↵\n" : "\n";
        isSpecial = token.isDiff;
      } else if (token.char === "\t") {
        displayChar = "→   ";
        isSpecial = true;
      }

      if (token.isDiff) {
        return (
          <span
            key={idx}
            className={`inline-block font-bold rounded px-0.5 ${
              isExpected
                ? "bg-emerald-200 text-emerald-950 underline decoration-emerald-500"
                : "bg-rose-200 text-rose-950 underline decoration-rose-500"
            } ${isSpecial ? "opacity-90 font-mono" : ""}`}
            title={`Char mismatch at position ${idx}: '${token.char === "\n" ? "\\n" : token.char}'`}
          >
            {displayChar}
          </span>
        );
      }

      return <span key={idx}>{displayChar}</span>;
    });
  };

  if (passed) {
    return (
      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex items-center justify-between text-slate-600">
          <span>Expected & Output:</span>
        </div>
        <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 whitespace-pre-wrap break-all">
          {actStr || "(empty)"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-1">
      {isWhitespaceOnlyDiff && (
        <div className="flex items-center gap-1.5 p-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 font-sans">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong>Whitespace difference detected:</strong> Output matches text but differs in trailing spaces or newlines.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
        {/* Expected Card */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 pb-1 mb-1 border-b border-emerald-100">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Expected Output
              </span>
              <button
                type="button"
                onClick={() => copyText(expStr, "expected")}
                className="text-emerald-700 hover:text-emerald-900 transition-colors p-0.5 rounded cursor-pointer"
                title="Copy expected output"
              >
                {copiedExpected ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="whitespace-pre-wrap break-all text-[11px] text-emerald-950 font-mono bg-white/70 p-2 rounded border border-emerald-100/80 min-h-[44px]">
              {renderVisualString(expectedTokens, true)}
            </div>
          </div>
          <div className="text-[10px] text-emerald-700/80 mt-1.5 pt-1 border-t border-emerald-100/60 font-sans flex items-center justify-between">
            <span>Length: {expStr.length} chars</span>
          </div>
        </div>

        {/* Actual Output Card */}
        <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-900 pb-1 mb-1 border-b border-rose-100">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Your Output
              </span>
              <button
                type="button"
                onClick={() => copyText(actStr, "actual")}
                className="text-rose-700 hover:text-rose-900 transition-colors p-0.5 rounded cursor-pointer"
                title="Copy actual output"
              >
                {copiedActual ? <Check className="w-3 h-3 text-rose-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="whitespace-pre-wrap break-all text-[11px] text-rose-950 font-mono bg-white/70 p-2 rounded border border-rose-100/80 min-h-[44px]">
              {renderVisualString(actualTokens, false)}
            </div>
          </div>
          <div className="text-[10px] text-rose-700/80 mt-1.5 pt-1 border-t border-rose-100/60 font-sans flex items-center justify-between">
            <span>Length: {actStr.length} chars</span>
            {firstDiffIndex >= 0 && (
              <span className="font-semibold text-rose-700">First diff at index {firstDiffIndex}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
