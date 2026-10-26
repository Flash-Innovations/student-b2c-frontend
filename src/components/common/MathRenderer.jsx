import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Parses and renders mixed Markdown and KaTeX math text.
 * Supports:
 * - Block math: $$ ... $$ and \[ ... \]
 * - Inline math: $ ... $ and \( ... \)
 * - Fenced code blocks: ```lang ... ```
 * - Inline code: ` ... `
 * - Basic markdown formatting: bold, italic, section dividers
 */
export function renderMathAndMarkdown(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  const tokens = [];
  const addToken = (html) => {
    tokens.push(html);
    return `___MATH_TOKEN_${tokens.length - 1}___`;
  };

  // 1. Preserve fenced code blocks
  let text = rawText.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return addToken(
      `<pre class="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs overflow-x-auto my-2.5 border border-slate-800 shadow-inner"><code>${escaped}</code></pre>`
    );
  });

  // 2. Preserve inline code
  text = text.replace(/`([^`\n\r]+)`/g, (match, code) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return addToken(
      `<code class="bg-slate-200/80 text-slate-800 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-300/60 font-semibold">${escaped}</code>`
    );
  });

  // 3. Block math: $$ ... $$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false
      });
      return addToken(
        `<div class="my-3 overflow-x-auto text-center py-1 bg-slate-50/60 rounded-lg">${rendered}</div>`
      );
    } catch (e) {
      return match;
    }
  });

  // Block math: \[ ... \]
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false
      });
      return addToken(
        `<div class="my-3 overflow-x-auto text-center py-1 bg-slate-50/60 rounded-lg">${rendered}</div>`
      );
    } catch (e) {
      return match;
    }
  });

  // 4. Inline math: $ ... $ (ignoring escaped \$)
  text = text.replace(/\\\$|(\$([^\$\n\r]+?)\$)/g, (match, fullGroup, formula) => {
    if (match === "\\$") return "\\$";
    if (!formula) return match;
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false
      });
      return addToken(rendered);
    } catch (e) {
      return match;
    }
  });

  // Inline math: \( ... \)
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false
      });
      return addToken(rendered);
    } catch (e) {
      return match;
    }
  });

  // 5. Competitive programming section dividers (e.g. -----Input-----, -----Output-----, -----Example-----)
  text = text.replace(
    /-----+(Input|Output|Example|Examples|Note|Notes|Constraints|Specification)-----+(\n|$)/gi,
    (match, title) => {
      return addToken(
        `<div class="font-bold text-xs uppercase tracking-wider text-indigo-700 bg-indigo-50/90 px-2.5 py-1 rounded-md border border-indigo-200/70 my-3.5 inline-flex items-center gap-1.5 shadow-2xs">${title}</div>`
      );
    }
  );

  // 6. Markdown Bold & Italic
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong class=\"font-bold text-slate-900\">$1</strong>");
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em class=\"italic\">$1</em>");

  // 7. Clean up escaped dollar signs
  text = text.replace(/\\(\$)/g, "$1");

  // 8. Restore all saved tokens (Math & Code)
  text = text.replace(/___MATH_TOKEN_(\d+)___/g, (_, idx) => {
    return tokens[parseInt(idx, 10)] || "";
  });

  return text;
}

/**
 * React Component for rendering text with KaTeX formulas and Markdown.
 */
export function MathRenderer({ content, className = "", inline = false }) {
  const html = useMemo(() => {
    return renderMathAndMarkdown(content);
  }, [content]);

  if (!content) return null;

  if (inline) {
    return (
      <span
        className={`math-rendered-inline inline align-baseline ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      className={`math-rendered-block whitespace-pre-wrap leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default MathRenderer;
