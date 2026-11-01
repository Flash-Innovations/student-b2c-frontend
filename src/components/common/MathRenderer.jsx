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

  // 5b. Pie Chart Visualizer (Auto-detects bulleted sector degrees or percentages)
  const pieLineRegex = /^[*-]\s*([^:\n\r]+?)\s*:\s*(\d+(?:\.\d+)?)\s*(degrees?|deg|%|percent)/gim;
  const pieMatches = [];
  let pMatch;
  while ((pMatch = pieLineRegex.exec(text)) !== null) {
    const label = pMatch[1].trim();
    const val = parseFloat(pMatch[2]);
    const unit = pMatch[3].toLowerCase();
    const degrees = unit.startsWith("deg") ? val : (val / 100) * 360;
    pieMatches.push({ label, degrees, rawVal: pMatch[2] + (unit.startsWith("%") ? "%" : "°") });
  }

  if (pieMatches.length >= 3 && /pie\s*(chart|graph|distribution|allocation)/i.test(rawText)) {
    const totalDeg = pieMatches.reduce((s, it) => s + it.degrees, 0) || 360;
    const colors = ["#2563EB", "#0F172A", "#64748B", "#38BDF8", "#F59E0B", "#10B981", "#8B5CF6"];
    const cx = 90, cy = 90, r = 75, innerR = 30;
    let currentAngle = -90;

    const paths = pieMatches.map((it, idx) => {
      const sliceAngle = (it.degrees / totalDeg) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const rad = Math.PI / 180;
      const x1 = cx + r * Math.cos(startAngle * rad);
      const y1 = cy + r * Math.sin(startAngle * rad);
      const x2 = cx + r * Math.cos(endAngle * rad);
      const y2 = cy + r * Math.sin(endAngle * rad);

      const xi1 = cx + innerR * Math.cos(startAngle * rad);
      const yi1 = cy + innerR * Math.sin(startAngle * rad);
      const xi2 = cx + innerR * Math.cos(endAngle * rad);
      const yi2 = cy + innerR * Math.sin(endAngle * rad);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const pathData = `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1} Z`;
      const color = colors[idx % colors.length];

      return `<path d="${pathData}" fill="${color}" stroke="#ffffff" stroke-width="2" />`;
    }).join("");

    const legend = pieMatches.map((it, idx) => {
      const color = colors[idx % colors.length];
      const pct = Math.round((it.degrees / totalDeg) * 100);
      return `
        <div class="flex items-center justify-between gap-3 text-xs py-1 border-b border-slate-100 last:border-0">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${color}"></span>
            <span class="font-medium text-slate-700 truncate">${it.label}</span>
          </div>
          <div class="font-mono text-slate-900 shrink-0 font-bold">${it.rawVal} <span class="text-slate-400 font-normal text-[10px]">(${pct}%)</span></div>
        </div>
      `;
    }).join("");

    const pieHtml = `
      <div class="my-4 p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
        <div class="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-blue-600"></span> Visual Pie Chart Distribution
        </div>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
          <svg width="180" height="180" viewBox="0 0 180 180" class="shrink-0 drop-shadow-xs">
            ${paths}
          </svg>
          <div class="w-full sm:max-w-xs space-y-0.5">
            ${legend}
          </div>
        </div>
      </div>
    `;
    text = addToken(pieHtml) + "\n" + text;
  }

  // 5c. Markdown Tables & Visual Graphs (Bar Graphs, Line Graphs, Data Tables)
  const tableRegex = /((?:\|[^\n\r]+\|(?:\r?\n|$))+)/g;
  text = text.replace(tableRegex, (match) => {
    const lines = match.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return match;
    const sepLine = lines[1];
    if (!sepLine.includes("---")) return match;

    const parseRow = (line) => line.split("|").slice(1, -1).map(c => c.trim());
    const headers = parseRow(lines[0]);
    const alignRules = parseRow(sepLine).map(c => {
      if (c.startsWith(":") && c.endsWith(":")) return "text-center";
      if (c.endsWith(":")) return "text-right";
      return "text-left";
    });

    const rows = lines.slice(2).map(parseRow);

    let graphVisualHtml = "";
    const isBarGraph = /bar\s*(graph|chart)/i.test(rawText);
    const isLineGraph = /line\s*(graph|chart)/i.test(rawText);

    if (isBarGraph && headers.length >= 2 && rows.length >= 2) {
      let numColIdx = -1;
      for (let c = 1; c < headers.length; c++) {
        const val = parseFloat(rows[0][c]?.replace(/[^0-9.-]/g, ""));
        if (!isNaN(val)) { numColIdx = c; break; }
      }

      if (numColIdx !== -1) {
        const barData = rows.map(r => {
          const raw = r[numColIdx] || "";
          const num = parseFloat(raw.replace(/[^0-9.-]/g, "")) || 0;
          return { label: r[0], value: num, raw };
        });

        const maxVal = Math.max(...barData.map(b => b.value)) || 1;

        const barsHtml = barData.map((b) => {
          const widthPct = Math.min(100, Math.round((b.value / maxVal) * 100));
          return `
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-700 truncate">${b.label}</span>
                <span class="font-mono font-bold text-slate-900">${b.raw}</span>
              </div>
              <div class="h-3.5 bg-slate-100 rounded-md overflow-hidden flex">
                <div class="h-full bg-blue-600 rounded-md transition-all duration-500" style="width: ${widthPct}%"></div>
              </div>
            </div>
          `;
        }).join("");

        graphVisualHtml = `
          <div class="my-4 p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
            <div class="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-3 flex items-center justify-between">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-600"></span> Visual Bar Graph (${headers[numColIdx]})</span>
              <span class="text-[10px] text-slate-400">Scale: 0 – ${maxVal.toLocaleString()}</span>
            </div>
            <div class="space-y-2.5">
              ${barsHtml}
            </div>
          </div>
        `;
      }
    } else if (isLineGraph && headers.length >= 2 && rows.length >= 2) {
      let numColIdx = 1;
      const pts = rows.map((r, i) => {
        const raw = r[numColIdx] || "";
        const num = parseFloat(raw.replace(/[^0-9.-]/g, "")) || 0;
        return { label: r[0], value: num, raw, idx: i };
      });
      const maxVal = Math.max(...pts.map(p => p.value)) || 1;
      const minVal = Math.min(...pts.map(p => p.value)) || 0;
      const range = maxVal - minVal || 1;

      const svgW = 360, svgH = 130, padX = 40, padY = 22;
      const stepX = (svgW - padX * 2) / (pts.length - 1 || 1);

      const pointsCoords = pts.map((p, i) => {
        const x = padX + i * stepX;
        const y = svgH - padY - ((p.value - minVal) / range) * (svgH - padY * 2);
        return { ...p, x, y };
      });

      const polyline = pointsCoords.map(p => `${p.x},${p.y}`).join(" ");
      const dots = pointsCoords.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#2563EB" stroke="#ffffff" stroke-width="2" />
        <text x="${p.x}" y="${p.y - 7}" text-anchor="middle" font-size="9" fill="#0F172A" font-weight="bold">${p.raw}</text>
        <text x="${p.x}" y="${svgH - 4}" text-anchor="middle" font-size="8" fill="#64748B">${p.label.substring(0, 3)}</text>
      `).join("");

      graphVisualHtml = `
        <div class="my-4 p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
          <div class="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center justify-between">
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-600"></span> Visual Line Graph Trend (${headers[numColIdx]})</span>
          </div>
          <svg width="100%" height="130" viewBox="0 0 ${svgW} ${svgH}" class="overflow-visible">
            <line x1="${padX}" y1="${padY}" x2="${padX}" y2="${svgH - padY}" stroke="#E2E8F0" stroke-width="1" />
            <line x1="${padX}" y1="${svgH - padY}" x2="${svgW - padX / 2}" y2="${svgH - padY}" stroke="#E2E8F0" stroke-width="1" />
            <polyline fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${polyline}" />
            ${dots}
          </svg>
        </div>
      `;
    }

    const thead = '<thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200"><tr>' +
      headers.map((h, i) => `<th class="px-4 py-2.5 ${alignRules[i] || 'text-left'}">${h}</th>`).join("") +
      '</tr></thead>';

    const tbody = '<tbody class="divide-y divide-slate-100 text-slate-800">' +
      rows.map(row => '<tr class="hover:bg-slate-50/50">' + row.map((c, i) => `<td class="px-4 py-2.5 ${alignRules[i] || 'text-left'}">${c}</td>`).join("") + '</tr>').join("") +
      '</tbody>';

    const tableHtml = `<div class="my-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs"><table class="w-full text-left text-xs border-collapse">${thead}${tbody}</table></div>`;

    return addToken(graphVisualHtml + tableHtml);
  });

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
