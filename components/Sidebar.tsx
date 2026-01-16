"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import ClubLogo from "./ClubLogo";

interface Team {
  id: string;
  name: string;
}

function NavSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800 rounded-md transition-colors"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <nav className="mt-1 space-y-1">{children}</nav>}
    </div>
  );
}

function NavLink({ href, children, pathname }: { href: string; children: React.ReactNode; pathname: string }) {
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        setTeams(data || []);
        if (data && data.length > 0 && !selectedTeamId) {
          setSelectedTeamId(data[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedTeamId]);

  if (!user) return null;

  const userRole = (user.publicMetadata?.role as string) || "SCOUT";

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen fixed left-0 top-0 overflow-y-auto z-40">
      <div className="p-4">
        {/* Logo */}
        <div className="mb-6 flex items-center space-x-2">
          <ClubLogo isCollapsed={false} />
          <span className="text-base font-bold text-white">Football CMS</span>
        </div>

        {/* Team Selection Dropdown */}
        <div className="mb-4">
          <button
            onClick={() => setTeamsOpen(!teamsOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800 rounded-md transition-colors"
          >
            <span>Teams</span>
            <svg
              className={`w-4 h-4 transition-transform ${teamsOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {teamsOpen && (
            <div className="mt-2">
              {loading ? (
                <div className="text-sm text-slate-400 px-3 py-2">Loading teams...</div>
              ) : teams.length > 0 ? (
                <select
                  value={selectedTeamId || ""}
                  onChange={(e) => {
                    setSelectedTeamId(e.target.value);
                    router.refresh();
                  }}
                  className="w-full px-3 py-2 rounded-md text-sm font-medium bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-slate-400 px-3 py-2">No teams available</div>
              )}
            </div>
          )}
        </div>

        {/* Main */}
        <NavSection title="Main" defaultOpen={true}>
          <NavLink href="/dashboard" pathname={pathname}>Dashboard</NavLink>
          <NavLink href="/dashboard/calendar" pathname={pathname}>Calendar</NavLink>
        </NavSection>

        {/* Team */}
        <NavSection title="Team" defaultOpen={true}>
          <NavLink href="/dashboard/players" pathname={pathname}>Players</NavLink>
          <NavLink href="/dashboard/matches" pathname={pathname}>Matches</NavLink>
          <NavLink href="/dashboard/training" pathname={pathname}>Training</NavLink>
        </NavSection>

        {/* Games */}
        <NavSection title="Games">
          <NavLink href="/dashboard/games/register" pathname={pathname}>Register Game</NavLink>
          <NavLink href="/dashboard/calendar?type=match" pathname={pathname}>Create Game</NavLink>
        </NavSection>

        {/* Training */}
        <NavSection title="Training">
          <NavLink href="/dashboard/calendar?open=true&type=training" pathname={pathname}>Create Training</NavLink>
        </NavSection>

        {/* Admin Section */}
        {(userRole === "ADMIN" || userRole === "COACH") && (
          <NavSection title="Admin">
            <NavLink href="/dashboard/invites" pathname={pathname}>Invites</NavLink>
            <NavLink href="/dashboard/admin" pathname={pathname}>Admin Panel</NavLink>
          </NavSection>
        )}
      </div>
    </aside>
  );
}
