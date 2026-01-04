"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function CreateTeamPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function createTeam() {
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter a team name");
      return;
    }

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create team");
        return;
      }

      setMessage("Team created successfully!");
      setName(""); // Clear the input
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Error:", error);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      createTeam();
    }
  };

  return (
    <Card className="max-w-lg">
      <h1 className="text-xl font-bold mb-4">Create a Team</h1>

      <Input
        label="Team Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <Button onClick={createTeam}>Create</Button>

      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </Card>
  );
}

