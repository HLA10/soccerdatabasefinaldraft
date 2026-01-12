"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import ClubLogo from "./ClubLogo";

// Club Logo Configuration
// Change this path to your club logo file
const CLUB_LOGO_PATH = "/club-logo.png.jpg"; // Place your logo in the public folder

interface Team {
  id: string;
  name: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        setTeams(data || []);
        if (data && data.length > 0 && !selectedTeamId) {
          setSelectedTeamId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path);
  };

  const NavItem = ({ href, label }: { href: string; label: string }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`
          relative flex items-center px-4 py-3 text-sm font-medium
          transition-all duration-200
          ${active 
            ? "text-white bg-white/10 font-semibold" 
            : "text-white/80 hover:bg-white/5 hover:text-white"
          }
          ${isCollapsed ? "justify-center px-3" : ""}
        `}
        title={isCollapsed ? label : undefined}
      >
        {active && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white rounded-r"></div>
        )}
        {!isCollapsed && <span>{label}</span>}
        {isCollapsed && (
          <span className="text-white/80 text-xs font-medium">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
      </Link>
    );
  };

  const SidebarSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
    if (isCollapsed) return <div className="space-y-0.5">{children}</div>;
    
    return (
      <div>
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            {title}
          </p>
        </div>
        <div className="space-y-1">{children}</div>
      </div>
    );
  };

  return (
    <div
      className={`
        bg-[#1A73E8] h-screen sticky top-0 flex flex-col
        transition-all duration-200
        ${isCollapsed ? "w-20" : "w-[260px]"}
      `}
    >
      {/* Header */}
      <div className={`px-4 py-6 border-b border-white/10 ${isCollapsed ? "px-3" : ""}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <ClubLogo isCollapsed={false} />
            <div>
              <h1 className="text-lg font-semibold text-white mb-0.5">Football CMS</h1>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <ClubLogo isCollapsed={true} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-8">
        <SidebarSection title="Teams">
          {teams.length > 0 && (
            <div className="space-y-1">
              {teams.map((team) => {
                const isTeamSelected = selectedTeamId === team.id;
                return (
                  <Link
                    key={team.id}
                    href={`/dashboard?team=${team.id}`}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`
                      relative flex items-center px-4 py-3 text-sm font-medium
                      transition-all duration-200
                      ${isTeamSelected 
                        ? "text-white bg-white/10 font-semibold" 
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    {isTeamSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white rounded-r"></div>
                    )}
                    <span>{team.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </SidebarSection>

        <SidebarSection title="Main">
          <NavItem href="/dashboard" label="Dashboard" />
          <NavItem href="/dashboard/calendar" label="Calendar" />
        </SidebarSection>

        <SidebarSection title="Team">
          <NavItem href="/dashboard/games/register" label="Register Game" />
          <NavItem href="/dashboard/calendar?type=match" label="Create Game" />
          <NavItem href="/dashboard/matches" label="Matches" />
          <NavItem href="/dashboard/training" label="Training" />
          <NavItem href="/dashboard/calendar?open=true&type=training" label="Create Training" />
        </SidebarSection>

        <SidebarSection title="Performance">
          <NavItem href="/dashboard/stats" label="Stats" />
          <NavItem href="/dashboard/analytics" label="Analytics" />
        </SidebarSection>

        <SidebarSection title="Admin">
          <NavItem href="/dashboard/invites" label="Invites" />
          <NavItem href="/dashboard/admin" label="Admin Panel" />
        </SidebarSection>

      </nav>

    </div>
  );
}
