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
    <Card className="max-w-lg">
      <h1 className="text-xl font-bold mb-4">Create Match</h1>

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

      <Button onClick={createMatch}>Create Match</Button>

      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </Card>
  );
}

