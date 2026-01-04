import Sidebar from "@/components/Sidebar";
import "../globals.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 animate-fadeIn">
        {children}
      </main>
    </div>
  );
}

