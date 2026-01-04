import Card from "@/components/ui/Card";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function DashboardHome() {
  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Welcome to your Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Manage your teams, players, and matches all in one place
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/dashboard/teams">
          <Card hover className="h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                👥
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                View
              </span>
            </div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">Teams</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              View and manage all your teams, see player rosters and match history
            </p>
            <div className="text-blue-600 font-medium text-sm">Explore Teams →</div>
          </Card>
        </Link>

        <Link href="/dashboard/players">
          <Card hover className="h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl">
                ⚽
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                View
              </span>
            </div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">Players</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Browse all players, view their stats, positions, and team assignments
            </p>
            <div className="text-green-600 font-medium text-sm">Browse Players →</div>
          </Card>
        </Link>

        <Link href="/dashboard/calendar">
          <Card hover className="h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                📅
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                View
              </span>
            </div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">Calendar</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              See all upcoming and past matches organized by date with scores
            </p>
            <div className="text-purple-600 font-medium text-sm">View Calendar →</div>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard/create-team">
            <Button>➕ Create Team</Button>
          </Link>
          <Link href="/dashboard/players/create">
            <Button variant="secondary">👤 Add Player</Button>
          </Link>
          <Link href="/dashboard/matches/create">
            <Button variant="outline">🎯 Schedule Match</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
