"use client";

import { useEffect, useState } from "react";

interface TokenBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  delay?: number;
}

export function TokenBar({
  label,
  value,
  max,
  color,
  delay = 0,
}: TokenBarProps) {
  const [width, setWidth] = useState(0);
  const pct = Math.min(100, (value / max) * 100);

  useEffect(() => {
    const t = setTimeout(() => {
      setWidth(pct);
    }, 80 + delay);

    return () => {
      clearTimeout(t);
    };
  }, [pct, delay]);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5">
        <div
          className={`
            h-full rounded-full
            ${color}
          `}
          style={{
            width: `${width}%`,
            transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
    </div>
  );
}
