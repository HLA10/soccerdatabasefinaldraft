"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface Team {
  id: string;
  name: string;
}

export default function DashboardHeader() {
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
          <Link href="/dashboard/calendar?type=match">
            <Button variant="secondary" className="text-sm px-4 py-2">
              Create Game
            </Button>
          </Link>
          <Link href="/dashboard/calendar?open=true">
            <Button className="text-sm px-4 py-2">
              Create Event
            </Button>
          </Link>
          <div className="ml-2">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

