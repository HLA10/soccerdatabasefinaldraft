"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function CreateSeedTeamsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function createSeedTeams() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/teams/seed", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create teams");
        setLoading(false);
        return;
      }

      setMessage(`Successfully processed ${data.teams.length} teams!`);
      setTimeout(() => {
        router.push("/dashboard/teams");
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Create Seed Teams
        </h1>
        <p className="text-gray-600">Create F2011-A, F2012-A, and F2013-A teams</p>
      </div>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Teams to Create:</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <span className="font-medium">F2011-A</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <span className="font-medium">F2012-A</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <span className="font-medium">F2013-A</span>
            </li>
          </ul>
        </div>

        <Button
          onClick={createSeedTeams}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Creating Teams..." : "Create All Teams"}
        </Button>

        {message && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium flex items-center gap-2">
              <span>✓</span>
              {message}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium flex items-center gap-2">
              <span>✕</span>
              {error}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

