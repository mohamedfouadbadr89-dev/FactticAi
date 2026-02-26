export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">
        <div className="text-lg font-semibold mb-8">
          Facttic
        </div>

        <nav className="space-y-4 text-sm">
          <a href="/dashboard/executive" className="block opacity-70 hover:opacity-100">
            Executive
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  )
}