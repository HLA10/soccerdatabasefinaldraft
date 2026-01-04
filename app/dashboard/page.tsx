import Card from "@/components/ui/Card";

export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h1>
      <p className="text-gray-600 mb-6">Choose an option from the sidebar to get started.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
        <Card className="hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-lg mb-2">Teams</h3>
          <p className="text-gray-600 text-sm">Create and manage teams</p>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-lg mb-2">Players</h3>
          <p className="text-gray-600 text-sm">Add and manage players</p>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-lg mb-2">Matches</h3>
          <p className="text-gray-600 text-sm">Create matches and track stats</p>
        </Card>
      </div>
    </div>
  );
}
