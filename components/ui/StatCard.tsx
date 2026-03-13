import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="card p-6 flex flex-col justify-center">
      <span className="text-sm font-semibold text-[var(--text-secondary)]">{title}</span>
      <span className="text-4xl font-bold text-[var(--text-primary)] mt-2">{value}</span>
      {subtitle && (
        <span className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</span>
      )}
    </div>
  );
}
