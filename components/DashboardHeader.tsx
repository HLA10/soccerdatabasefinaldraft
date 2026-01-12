"use client";

import { useEffect, useState } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface Team {
  id: string;
  name: string;
}

export default function DashboardHeader() {
  const { user } = useUser();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setTeams(data);
          setSelectedTeam(data[0]); // Default to first team
        }
      })
      .catch(() => {});
  }, []);

  const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "admin@example.com";

  return (
    <div className="bg-white border-b border-[#E5E7EB] px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Team Name */}
        <div className="flex items-center gap-4">
          {selectedTeam ? (
            <div>
              <h1 className="text-xl font-semibold text-[#111827]">{selectedTeam.name}</h1>
              <p className="text-xs text-[#6B7280] mt-0.5">Team Dashboard</p>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-semibold text-[#111827]">Dashboard</h1>
              <p className="text-xs text-[#6B7280] mt-0.5">Soccer Management</p>
            </div>
          )}
        </div>

        {/* Right: Quick Actions & User Profile */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/calendar?open=true">
            <Button variant="secondary" className="text-sm px-4 py-2 bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F9FAFB]">
              Create Event
            </Button>
          </Link>
          <Link href="/dashboard/calendar?type=match">
            <Button className="text-sm px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white">
              Create Game
            </Button>
          </Link>
          <div className="flex items-center gap-3 ml-2 pl-3 border-l border-[#E5E7EB]">
            <span className="text-sm text-[#6B7280]">{userEmail}</span>
            <SignOutButton>
              <button className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  );
}

