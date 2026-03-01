import DashboardSidebar from "@/components/layout/DashboardSidebar";
import EnterpriseTopbar from "@/components/layout/EnterpriseTopbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Persistent Sidebar */}
      <DashboardSidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col">
        {/* Persistent Topbar */}
        <EnterpriseTopbar />

        {/* Dynamic Content with fade transition */}
        <main className="flex-1 animate-[fadeIn_.15s_ease-in-out]">
          {children}
        </main>
      </div>
    </div>
  );
}
