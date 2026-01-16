"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface Team {
  id: string;
  name: string;
}

export default function Navbar() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setSelectedTeam(data[0]);
        }
      })
      .catch(() => {});
  }, []);

  if (!user) return null;

  const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "";

  return (
    <nav className="border-b bg-white h-16 fixed top-0 left-0 lg:left-64 right-0 z-10">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center ml-12 lg:ml-0">
          <h1 className="text-lg font-semibold text-[#111827] truncate max-w-[200px] lg:max-w-none">
            {selectedTeam?.name || "Football CMS"}
          </h1>
        </div>
        <div className="flex items-center space-x-2 lg:space-x-4">
          <span className="text-xs text-[#111827] bg-transparent hidden sm:block">{userEmail}</span>
          <SignOutButton>
            <Button variant="outline" className="text-sm px-3 py-1.5">
              Sign Out
            </Button>
          </SignOutButton>
        </div>
      </div>
    </nav>
  );
}
