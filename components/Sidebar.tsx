"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    pathname.startsWith(path)
      ? "block p-3 bg-blue-600 text-white rounded"
      : "block p-3 hover:bg-gray-200 rounded";

  return (
    <div className="w-64 bg-white border-r p-4">
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>

      <nav className="space-y-2">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Home
        </Link>

        <div className="pt-2 border-t">
          <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">View</p>
          <Link href="/dashboard/teams" className={linkClass("/dashboard/teams")}>
            Teams
          </Link>
          <Link href="/dashboard/players" className={linkClass("/dashboard/players")}>
            Players
          </Link>
          <Link href="/dashboard/calendar" className={linkClass("/dashboard/calendar")}>
            Calendar
          </Link>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">Create</p>
          <Link href="/dashboard/create-team" className={linkClass("/dashboard/create-team")}>
            Create Team
          </Link>
          <Link href="/dashboard/players/create" className={linkClass("/dashboard/players/create")}>
            Add Player
          </Link>
          <Link href="/dashboard/matches/create" className={linkClass("/dashboard/matches/create")}>
            Create Match
          </Link>
          <Link href="/dashboard/matches/stats" className={linkClass("/dashboard/matches/stats")}>
            Add Stats
          </Link>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">Manage</p>
          <Link href="/dashboard/invites/send" className={linkClass("/dashboard/invites/send")}>
            Send Invite
          </Link>
          <Link href="/dashboard/invites" className={linkClass("/dashboard/invites")}>
            My Invites
          </Link>
          <Link href="/dashboard/admin" className={linkClass("/dashboard/admin")}>
            Admin Panel
          </Link>
        </div>
      </nav>
    </div>
  );
}

