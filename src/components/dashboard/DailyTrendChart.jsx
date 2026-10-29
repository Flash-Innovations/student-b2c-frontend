import React, { useState } from "react";

export function DailyTrendChart({
  days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  accuracy = [72, 78, 85, 82, 90, 88, 92],
  problems = [25, 30, 45, 35, 50, 40, 60]
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

  // Coordinate scales: Y-axis from 20 to 100
  const minY = 20;
  const maxY = 100;

  const getX = (index) => paddingLeft + (index / (days.length - 1)) * chartW;
  const getY = (val) => paddingTop + chartH - ((val - minY) / (maxY - minY)) * chartH;

  // Path generators
  const accuracyPoints = accuracy.map((val, i) => `${getX(i)},${getY(val)}`);
  const accuracyLine = `M ${accuracyPoints.join(" L ")}`;

  // Area under accuracy curve
  const accuracyArea = `M ${getX(0)},${paddingTop + chartH} L ${accuracyPoints.join(" L ")} L ${getX(days.length - 1)},${paddingTop + chartH} Z`;

  // Problems dashed line
  const problemsPoints = problems.map((val, i) => `${getX(i)},${getY(val)}`);
  const problemsLine = `M ${problemsPoints.join(" L ")}`;

  // Y-axis grid ticks
  const yTicks = [20, 40, 60, 80, 100];

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5D3BEE] inline-block shadow-xs"></span>
            Accuracy %
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#FFB020] inline-block"></span>
            Problems Solved
          </span>
        </div>
        {hoveredIdx !== null && (
          <span className="text-[11px] font-bold text-[#5D3BEE] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
            {days[hoveredIdx]}: {accuracy[hoveredIdx]}% Acc • {problems[hoveredIdx]} Solved
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
            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5D3BEE" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#5D3BEE" stopOpacity="0.0" />
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
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={tick === 20 ? "none" : "2 2"}
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
          <path d={accuracyArea} fill="url(#purpleGradient)" />

          {/* Accuracy Line */}
          <path
            d={accuracyLine}
            fill="none"
            stroke="#5D3BEE"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Problems Solved Line */}
          <path
            d={problemsLine}
            fill="none"
            stroke="#FFB020"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points & X-Axis Labels */}
          {days.map((day, i) => {
            const x = getX(i);
            const yAcc = getY(accuracy[i]);
            const yProb = getY(problems[i]);
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
                    stroke="#5D3BEE"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.4"
                  />
                )}

                {/* X Axis label */}
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight={isHovered ? "bold" : "normal"}
                  fill={isHovered ? "#5D3BEE" : "#64748B"}
                  fontFamily="Inter, sans-serif"
                >
                  {day}
                </text>

                {/* Accuracy Marker */}
                <circle
                  cx={x}
                  cy={yAcc}
                  r={isHovered ? 5.5 : 4}
                  fill="#5D3BEE"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* Problem Marker */}
                <circle
                  cx={x}
                  cy={yProb}
                  r={isHovered ? 4 : 3}
                  fill="#FFB020"
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
      </div>
    </div>
  );
}

export default DailyTrendChart;
