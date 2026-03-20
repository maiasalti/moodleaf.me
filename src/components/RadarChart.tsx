"use client";

import { SliderValues, TraitKey } from "@/lib/types";
import { SLIDER_DIMENSIONS } from "@/lib/constants";

interface RadarChartProps {
  values: SliderValues;
  compareValues?: SliderValues;
}

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 110;
const AXES = SLIDER_DIMENSIONS.length; // 8

function polarToXY(angle: number, radius: number): [number, number] {
  const rad = (angle - 90) * (Math.PI / 180);
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

function getPoints(values: SliderValues): string {
  return SLIDER_DIMENSIONS.map((dim, i) => {
    const angle = (360 / AXES) * i;
    const value = values[dim.key as TraitKey];
    const r = (value / 10) * RADIUS;
    const [x, y] = polarToXY(angle, r);
    return `${x},${y}`;
  }).join(" ");
}

export default function RadarChart({ values, compareValues }: RadarChartProps) {
  const gridLevels = [2, 4, 6, 8, 10];

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[280px]">
      {/* Grid circles */}
      {gridLevels.map((level) => {
        const r = (level / 10) * RADIUS;
        const pts = Array.from({ length: AXES }, (_, i) => {
          const angle = (360 / AXES) * i;
          const [x, y] = polarToXY(angle, r);
          return `${x},${y}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="var(--color-stone-200)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Axis lines */}
      {SLIDER_DIMENSIONS.map((dim, i) => {
        const angle = (360 / AXES) * i;
        const [x, y] = polarToXY(angle, RADIUS);
        return (
          <line
            key={dim.key}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="var(--color-stone-200)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Compare shape (if provided) */}
      {compareValues && (
        <polygon
          points={getPoints(compareValues)}
          fill="var(--color-terracotta)"
          fillOpacity={0.15}
          stroke="var(--color-terracotta)"
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
      )}

      {/* Main data shape */}
      <polygon
        points={getPoints(values)}
        fill="var(--color-green-700)"
        fillOpacity={0.2}
        stroke="var(--color-green-800)"
        strokeWidth={2}
      />

      {/* Data points */}
      {SLIDER_DIMENSIONS.map((dim, i) => {
        const angle = (360 / AXES) * i;
        const value = values[dim.key as TraitKey];
        const r = (value / 10) * RADIUS;
        const [x, y] = polarToXY(angle, r);
        return (
          <circle
            key={dim.key}
            cx={x}
            cy={y}
            r={3}
            fill="var(--color-green-800)"
          />
        );
      })}

      {/* Labels */}
      {SLIDER_DIMENSIONS.map((dim, i) => {
        const angle = (360 / AXES) * i;
        const [x, y] = polarToXY(angle, RADIUS + 20);
        return (
          <text
            key={dim.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-stone-500 text-[9px]"
          >
            {dim.label}
          </text>
        );
      })}
    </svg>
  );
}
