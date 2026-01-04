"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";

interface Team {
  id: string;
  name: string;
}

// Club Logo Configuration
// Change this path to your club logo file
const CLUB_LOGO_PATH = "/club-logo.png.jpg"; // Place your logo in the public folder

export default function Sidebar() {
  const pathname = usePathname();
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamsSubmenu, setShowTeamsSubmenu] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isTeamPage = pathname.startsWith("/dashboard/teams/") && pathname !== "/dashboard/teams/create-seed";
  const isTeamsListPage = pathname === "/dashboard/teams";

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        setTeams(data || []);
        setLoadingTeams(false);
      })
      .catch(() => {
        setLoadingTeams(false);
      });
  }, []);

  // Auto-expand submenu when on team pages
  useEffect(() => {
    if (isTeamPage || isTeamsListPage) {
      setShowTeamsSubmenu(true);
    }
  }, [pathname]);

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
            ? "text-[#111827] font-semibold" 
            : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
          }
          ${isCollapsed ? "justify-center px-3" : ""}
        `}
        title={isCollapsed ? label : undefined}
      >
        {active && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1A73E8] rounded-r"></div>
        )}
        {!isCollapsed && <span>{label}</span>}
        {isCollapsed && (
          <span className="text-[#6B7280] text-xs font-medium">
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
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
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
        bg-white border-r border-[#E5E7EB] h-screen sticky top-0 flex flex-col
        transition-all duration-200
        ${isCollapsed ? "w-20" : "w-[260px]"}
      `}
    >
      {/* Header */}
      <div className={`px-4 py-6 border-b border-[#E5E7EB] ${isCollapsed ? "px-3" : ""}`}>
        {!isCollapsed ? (
          <div>
            <h1 className="text-lg font-semibold text-[#111827] mb-0.5">Soccer Hub</h1>
            <p className="text-xs text-[#6B7280]">Management Platform</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-lg bg-[#1A73E8] flex items-center justify-center">
              <span className="text-white text-xs font-semibold">SH</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-8">
        <div>
          <NavItem href="/dashboard" label="Home" />
        </div>

        <SidebarSection title="Club">
          <div>
            {!isCollapsed ? (
              <div>
                <button
                  onClick={() => setShowTeamsSubmenu(!showTeamsSubmenu)}
                  className={`
                    relative w-full flex items-center justify-between px-4 py-3 text-sm font-medium
                    transition-all duration-200
                    ${isTeamsListPage || isTeamPage
                      ? "text-[#111827] font-semibold"
                      : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
                    }
                  `}
                >
                  {(isTeamsListPage || isTeamPage) && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1A73E8] rounded-r"></div>
                  )}
                  <span>Teams</span>
                  <span className={`text-[#9CA3AF] text-xs transition-transform duration-200 ${showTeamsSubmenu ? "rotate-90" : ""}`}>
                    ›
                  </span>
                </button>
                
                {showTeamsSubmenu && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-[#E5E7EB] pl-4">
                    <Link
                      href="/dashboard/teams"
                      className={`
                        block px-3 py-2 text-sm transition-all duration-200
                        ${isTeamsListPage
                          ? "text-[#1A73E8] font-medium"
                          : "text-[#6B7280] hover:text-[#111827]"
                        }
                      `}
                    >
                      All Teams
                    </Link>
                    {teams.length > 0 && (
                      <>
                        <div className="h-px bg-[#E5E7EB] my-1"></div>
                        {teams.map((team) => {
                          const isActive = pathname === `/dashboard/teams/${team.id}`;
                          return (
                            <Link
                              key={team.id}
                              href={`/dashboard/teams/${team.id}`}
                              className={`
                                block px-3 py-2 text-sm transition-all duration-200
                                ${isActive
                                  ? "text-[#1A73E8] font-medium"
                                  : "text-[#6B7280] hover:text-[#111827]"
                                }
                              `}
                            >
                              {team.name}
                            </Link>
                          );
                        })}
                      </>
                    )}
                    {!loadingTeams && teams.length === 0 && (
                      <div className="px-3 py-2 text-xs text-[#9CA3AF]">
                        No teams
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center">
                <span className="text-[#6B7280] text-xs font-medium">T</span>
              </div>
            )}
            <NavItem href="/dashboard/players" label="Players" />
            <NavItem href="/dashboard/calendar" label="Calendar" />
          </div>
        </SidebarSection>

        <SidebarSection title="Create">
          <div>
            <NavItem href="/dashboard/create-team" label="Create Team" />
            <NavItem href="/dashboard/players/create" label="Add Player" />
            <NavItem href="/dashboard/matches/create" label="Schedule Match" />
          </div>
        </SidebarSection>

        <SidebarSection title="Admin">
          <div>
            <NavItem href="/dashboard/invites" label="Invites" />
            <NavItem href="/dashboard/admin" label="Admin Panel" />
          </div>
        </SidebarSection>

        {/* Club Logo Section */}
        <div className={`px-4 pt-6 ${isCollapsed ? "px-3" : ""}`}>
          <div className={`border-t border-[#E5E7EB] pt-6 ${isCollapsed ? "flex justify-center" : ""}`}>
            {isCollapsed ? (
              <img
                src={CLUB_LOGO_PATH}
                alt="Club Logo"
                className="w-12 h-auto object-contain"
                onError={(e) => {
                  // Fallback if logo doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
                  Club
                </p>
                <img
                  src={CLUB_LOGO_PATH}
                  alt="Club Logo"
                  className="w-24 h-auto object-contain"
                  onError={(e) => {
                    // Fallback if logo doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Footer with User Profile */}
      <div className={`px-4 py-4 border-t border-[#E5E7EB] ${isCollapsed ? "px-3" : ""}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              }
            }}
          />
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"
              aria-label="Collapse sidebar"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Collapse button when collapsed */}
      {isCollapsed && (
        <div className="px-3 py-2 border-t border-[#E5E7EB]">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full p-2 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors flex justify-center"
            aria-label="Expand sidebar"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
