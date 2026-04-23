"use client";

import * as React from "react";
import { ResponsiveContainer } from "recharts";

// ── ChartConfig ──────────────────────────────────────────────────────────────
export type ChartConfig = Record<
  string,
  { label: string; color?: string; icon?: React.ComponentType }
>;

// ── Context ──────────────────────────────────────────────────────────────────
const ChartContext = React.createContext<{ config: ChartConfig }>({ config: {} });

export function useChart() {
  return React.useContext(ChartContext);
}

// ── ChartContainer ───────────────────────────────────────────────────────────
type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
  children: React.ReactElement;
};

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, children, className, style, ...props }, ref) => {
    const cssVars = Object.fromEntries(
      Object.entries(config).map(([key, value]) => [
        `--color-${key}`,
        value.color ?? "currentColor",
      ])
    );

    const ctx = React.useMemo(() => ({ config }), [config]);

    return (
      <ChartContext.Provider value={ctx}>
        <div
          ref={ref}
          className={className}
          style={{ ...cssVars, ...style } as React.CSSProperties}
          {...props}
        >
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  }
);
ChartContainer.displayName = "ChartContainer";

// ── ChartTooltip ─────────────────────────────────────────────────────────────
export { Tooltip as ChartTooltip } from "recharts";

// ── ChartTooltipContent ──────────────────────────────────────────────────────
interface TooltipPayloadItem {
  dataKey?: string | number;
  color?: string;
  value?: number | string;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  indicator?: "dot" | "dashed" | "line";
  hideLabel?: boolean;
}

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ active, payload, label, indicator = "dot", hideLabel = false }, ref) => {
    const { config } = useChart();

    if (!active || !payload?.length) return null;

    return (
      <div
        ref={ref}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs"
      >
        {!hideLabel && label && (
          <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
        )}
        <div className="space-y-1">
          {payload.map((item, i) => {
            const key = String(item.dataKey ?? i);
            const cfg = config[key];
            const color = cfg?.color ?? item.color ?? "currentColor";

            return (
              <div key={key} className="flex items-center gap-2">
                {indicator === "dot" && (
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                )}
                {indicator === "dashed" && (
                  <span
                    className="inline-block w-3 h-0.5 shrink-0"
                    style={{ background: color }}
                  />
                )}
                <span className="text-gray-500">{cfg?.label ?? key}</span>
                <span className="ml-auto font-bold text-gray-800 tabular-nums pl-4">
                  {Number(item.value).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";
