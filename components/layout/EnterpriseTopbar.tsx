"use client";

import { useState } from "react";

export default function EnterpriseTopbar() {
  const [channel, setChannel] = useState<"chat" | "voice">("chat");
  const [mode, setMode] = useState<"executive" | "advanced">("executive");

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6">

      {/* Left Section */}
      <div className="flex items-center">

        {/* Organization Selector */}
        <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-gray-400">Org</span>
          <span className="text-sm font-semibold text-gray-800">Facttic Systems Inc.</span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-4" />

        {/* Channel Toggle */}
        <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setChannel("chat")}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out ${
              channel === "chat"
                ? "bg-white text-blue-600 shadow-md ring-2 ring-blue-500/40 scale-105"
                : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setChannel("voice")}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out ${
              channel === "voice"
                ? "bg-white text-blue-600 shadow-md ring-2 ring-blue-500/40 scale-105"
                : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
            }`}
          >
            Voice
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-4" />

        {/* Mode Toggle */}
        <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setMode("executive")}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out ${
              mode === "executive"
                ? "bg-white text-blue-600 shadow-md ring-2 ring-blue-500/40 scale-105"
                : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
            }`}
          >
            Executive
          </button>
          <button
            onClick={() => setMode("advanced")}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out ${
              mode === "advanced"
                ? "bg-white text-blue-600 shadow-md ring-2 ring-blue-500/40 scale-105"
                : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
            }`}
          >
            Advanced
          </button>
        </div>

      </div>

      {/* Right Section */}
      <div className="ml-auto flex items-center gap-4">

        {/* Governance Score Pill */}
        <div className="bg-blue-600 text-white rounded-lg px-6 py-3 shadow flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-white/70">Governance</span>
          <span className="text-2xl font-semibold leading-tight">84</span>
        </div>

        {/* Tamper Badge */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg px-4 py-2 text-xs font-medium">
          Tamper-Proof ✓
        </div>

      </div>

    </header>
  );
}
