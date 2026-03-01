"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Alerts", href: "/dashboard/alerts" },
  { label: "Investigations", href: "/dashboard/investigations" },
  { label: "Advanced", href: "/dashboard/advanced" },
  { label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 font-bold">
        Facttic.AI
      </div>

      <nav className="flex-1 p-4 space-y-1 text-sm">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav block px-4 py-2.5 rounded-lg transition-all duration-150 ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-800 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
