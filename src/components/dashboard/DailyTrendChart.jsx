import React, { useState } from "react";

export function DailyTrendChart({
  days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  accuracy = [0, 0, 0, 0, 0, 0, 0],
  problems = [0, 0, 0, 0, 0, 0, 0]
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // SVG dimensions
  const width = 500;
  const height = 160;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 26;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Coordinate scales: Y-axis from 0 to 100
  const minY = 0;
  const maxY = 100;

  const safeAccuracy = days.map((_, i) => Math.max(0, Math.min(100, accuracy[i] ?? 0)));
  const safeProblems = days.map((_, i) => Math.max(0, Math.min(100, problems[i] ?? 0)));

  const getX = (index) => paddingLeft + (days.length > 1 ? (index / (days.length - 1)) * chartW : chartW / 2);
  const getY = (val) => paddingTop + chartH - ((val - minY) / (maxY - minY)) * chartH;

  // Path generators
  const accuracyPoints = safeAccuracy.map((val, i) => `${getX(i)},${getY(val)}`);
  const accuracyLine = `M ${accuracyPoints.join(" L ")}`;

  // Area under accuracy curve
  const accuracyArea = `M ${getX(0)},${paddingTop + chartH} L ${accuracyPoints.join(" L ")} L ${getX(days.length - 1)},${paddingTop + chartH} Z`;

  // Problems dashed line
  const problemsPoints = safeProblems.map((val, i) => `${getX(i)},${getY(val)}`);
  const problemsLine = `M ${problemsPoints.join(" L ")}`;

  // Y-axis grid ticks
  const yTicks = [0, 25, 50, 75, 100];

  const hasActivity = safeProblems.some((p) => p > 0) || safeAccuracy.some((a) => a > 0);

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-xs" />
            Accuracy %
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-purple-600 inline-block" />
            Problems Solved
          </span>
        </div>
        {hoveredIdx !== null && (
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            {days[hoveredIdx]}: {safeAccuracy[hoveredIdx]}% Acc • {safeProblems[hoveredIdx]} Solved
          </span>
        )}
      </div>

      <div className="relative w-full h-40">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? "none" : "2 2"}
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94A3B8"
                  fontFamily="Inter, sans-serif"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Shaded Area */}
          <path d={accuracyArea} fill="url(#blueGradient)" />

          {/* Accuracy Line (Brand Blue) */}
          <path
            d={accuracyLine}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Problems Solved Line (Orchid) */}
          <path
            d={problemsLine}
            fill="none"
            stroke="#9333EA"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points & X-Axis Labels */}
          {days.map((day, i) => {
            const x = getX(i);
            const yAcc = getY(safeAccuracy[i]);
            const yProb = getY(safeProblems[i]);
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={day}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartH}
                    stroke="#2563EB"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.3"
                  />
                )}

                {/* X Axis label */}
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight={isHovered ? "bold" : "normal"}
                  fill={isHovered ? "#2563EB" : "#64748B"}
                  fontFamily="Inter, sans-serif"
                >
                  {day}
                </text>

                {/* Accuracy Marker */}
                <circle
                  cx={x}
                  cy={yAcc}
                  r={isHovered ? 4.5 : 3}
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* Problem Marker */}
                <circle
                  cx={x}
                  cy={yProb}
                  r={isHovered ? 4 : 2.5}
                  fill="#9333EA"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="transition-all duration-150"
                />

                {/* Transparent hover capture rect */}
                <rect
                  x={x - 18}
                  y={paddingTop}
                  width="36"
                  height={chartH}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>

        {/* Empty state notice if no activity */}
        {!hasActivity && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px] pointer-events-none">
            <span className="text-[11px] font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
              No sessions recorded this week. Solve problems to start your trend!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyTrendChart;
