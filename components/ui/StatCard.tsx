import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
      <span className="text-sm text-slate-500">{title}</span>
      <span className="text-4xl font-bold text-slate-900 mt-2">{value}</span>
      {subtitle && (
        <span className="text-xs text-slate-400 mt-1">{subtitle}</span>
      )}
    </div>
  );
}
