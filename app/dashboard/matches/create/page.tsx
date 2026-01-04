"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function CreateMatchPage() {
  const [date, setDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [teamId, setTeamId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function createMatch() {
    setError("");
    setMessage("");

    if (!date || !opponent || !teamId) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date, opponent, teamId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create match");
        return;
      }

      setMessage("Match created successfully!");
      setDate("");
      setOpponent("");
      setTeamId("");
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Error:", error);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Schedule Match
        </h1>
        <p className="text-gray-600">Create a new match for your team</p>
      </div>
      <Card className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl">
            🎯
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Match Details</h2>
        </div>

      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <Input
        label="Opponent"
        placeholder="Opponent team name"
        value={opponent}
        onChange={(e) => setOpponent(e.target.value)}
      />

      <Input
        label="Team ID"
        placeholder="Enter team ID"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
      />

      <Button onClick={createMatch} className="w-full mt-2">Schedule Match</Button>

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

