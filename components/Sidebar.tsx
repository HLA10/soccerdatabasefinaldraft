"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface Team {
  id: string;
  name: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamsSubmenu, setShowTeamsSubmenu] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);

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
  }, [isTeamPage, isTeamsListPage]);

  const linkClass = (path: string) =>
    pathname.startsWith(path)
      ? "flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md"
      : "flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-all duration-200 hover:text-blue-600";

  const iconClass = (path: string) =>
    pathname.startsWith(path) ? "text-white" : "text-gray-400";

  return (
    <div className="w-72 bg-white border-r border-gray-200 p-6 h-screen sticky top-0 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          ⚽ Soccer DB
        </h1>
        <p className="text-xs text-gray-500 mt-1">Management Platform</p>
      </div>

      <nav className="space-y-1">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          <span className={iconClass("/dashboard")}>🏠</span>
          Home
        </Link>

        <div className="pt-6 pb-2">
          <p className="text-xs font-bold text-gray-400 uppercase px-4 mb-3 tracking-wider">
            View & Browse
          </p>
          <div className="space-y-1">
            {/* Teams with submenu */}
            <div>
              <button
                onClick={() => setShowTeamsSubmenu(!showTeamsSubmenu)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isTeamsListPage || isTeamPage
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isTeamsListPage || isTeamPage ? "text-white" : "text-gray-400"}>
                    👥
                  </span>
                  <span>Teams</span>
                </div>
                <span className={`transition-transform duration-200 ${showTeamsSubmenu ? "rotate-90" : ""}`}>
                  ▶
                </span>
              </button>
              
              {/* Teams submenu */}
              {showTeamsSubmenu && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                  <Link
                    href="/dashboard/teams"
                    className={`block px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isTeamsListPage
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                    }`}
                  >
                    All Teams
                  </Link>
                  {teams.length > 0 && (
                    <>
                      <div className="h-px bg-gray-200 my-1"></div>
                      {teams.map((team) => {
                        const isActive = pathname === `/dashboard/teams/${team.id}`;
                        return (
                          <Link
                            key={team.id}
                            href={`/dashboard/teams/${team.id}`}
                            className={`block px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                              isActive
                                ? "bg-blue-100 text-blue-700 font-semibold"
                                : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                            }`}
                          >
                            {team.name}
                          </Link>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
              
              {showTeamsSubmenu && !loadingTeams && teams.length === 0 && (
                <div className="ml-4 mt-1 pl-4 text-xs text-gray-500">
                  No teams yet
                </div>
              )}
              
              {showTeamsSubmenu && loadingTeams && (
                <div className="ml-4 mt-1 pl-4 text-xs text-gray-500">
                  Loading...
                </div>
              )}
            </div>

            <Link href="/dashboard/players" className={linkClass("/dashboard/players")}>
              <span className={iconClass("/dashboard/players")}>⚽</span>
              Players
            </Link>
            <Link href="/dashboard/calendar" className={linkClass("/dashboard/calendar")}>
              <span className={iconClass("/dashboard/calendar")}>📅</span>
              Calendar
            </Link>
          </div>
        </div>

        <div className="pt-4 pb-2">
          <p className="text-xs font-bold text-gray-400 uppercase px-4 mb-3 tracking-wider">
            Create & Add
          </p>
          <div className="space-y-1">
            <Link href="/dashboard/create-team" className={linkClass("/dashboard/create-team")}>
              <span className={iconClass("/dashboard/create-team")}>➕</span>
              Create Team
            </Link>
            <Link href="/dashboard/teams/create-seed" className={linkClass("/dashboard/teams/create-seed")}>
              <span className={iconClass("/dashboard/teams/create-seed")}>🌱</span>
              Seed Teams
            </Link>
            <Link href="/dashboard/players/create" className={linkClass("/dashboard/players/create")}>
              <span className={iconClass("/dashboard/players/create")}>👤</span>
              Add Player
            </Link>
            <Link href="/dashboard/matches/create" className={linkClass("/dashboard/matches/create")}>
              <span className={iconClass("/dashboard/matches/create")}>🎯</span>
              Create Match
            </Link>
            <Link href="/dashboard/matches/stats" className={linkClass("/dashboard/matches/stats")}>
              <span className={iconClass("/dashboard/matches/stats")}>📊</span>
              Add Stats
            </Link>
          </div>
        </div>

        <div className="pt-4 pb-2">
          <p className="text-xs font-bold text-gray-400 uppercase px-4 mb-3 tracking-wider">
            Management
          </p>
          <div className="space-y-1">
            <Link href="/dashboard/invites/send" className={linkClass("/dashboard/invites/send")}>
              <span className={iconClass("/dashboard/invites/send")}>📨</span>
              Send Invite
            </Link>
            <Link href="/dashboard/invites" className={linkClass("/dashboard/invites")}>
              <span className={iconClass("/dashboard/invites")}>📬</span>
              My Invites
            </Link>
            <Link href="/dashboard/admin" className={linkClass("/dashboard/admin")}>
              <span className={iconClass("/dashboard/admin")}>⚙️</span>
              Admin Panel
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}

