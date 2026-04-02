"use client";

import { PTOEntry, PTO_ANNUAL_LIMIT, totalPTOUsed, ptoRemaining } from "@/types/pto";

interface PTOCounterProps {
  entries: PTOEntry[];
}

export function PTOCounter({ entries }: PTOCounterProps) {
  const used = totalPTOUsed(entries);
  const remaining = ptoRemaining(entries);
  const pct = Math.min((used / PTO_ANNUAL_LIMIT) * 100, 100);

  return (
    <div className="pto-counter card">
      <h2 className="counter-title">PTO Balance</h2>

      <div className="counter-stats">
        <Stat label="Used" value={formatDays(used)} highlight />
        <Stat label="Remaining" value={formatDays(remaining)} />
        <Stat label="Annual Limit" value={`${PTO_ANNUAL_LIMIT} days`} />
      </div>

      <div className="progress-bar-track" aria-label={`${pct.toFixed(1)}% of PTO used`}>
        <div
          className="progress-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="progress-label">
        {pct.toFixed(1)}% used
      </p>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`counter-stat ${highlight ? "counter-stat--highlight" : ""}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function formatDays(days: number): string {
  // Show as integer if whole number, otherwise one decimal place
  return days % 1 === 0 ? `${days} days` : `${days.toFixed(1)} days`;
}
