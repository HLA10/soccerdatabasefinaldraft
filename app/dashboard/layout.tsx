"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import "../globals.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Navbar />
        <main className="pt-16 px-4 lg:px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
