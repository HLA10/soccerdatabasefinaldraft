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
        <h1 className="text-2xl font-semibold mb-1 text-[#111827]">
          Schedule Match
        </h1>
        <p className="text-sm text-[#6B7280]">Create a new match for your team</p>
      </div>
      <Card className="max-w-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#111827]">Match Details</h2>
          <p className="text-sm text-[#6B7280] mt-1">Schedule a new match</p>
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
        <div className="mt-4 p-4 bg-[#ECFDF5] border border-[#10B981] rounded-lg">
          <p className="text-[#065F46] font-medium text-sm">
            {message}
          </p>
        </div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
          <p className="text-[#991B1B] font-medium text-sm">
            {error}
          </p>
        </div>
      )}
      </Card>
    </div>
  );
}

