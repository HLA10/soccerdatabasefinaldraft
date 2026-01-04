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
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-[#111827]">
          Create a Team
        </h1>
        <p className="text-sm text-[#6B7280]">Add a new team to your organization</p>
      </div>
      <Card className="max-w-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#111827]">Team Information</h2>
          <p className="text-sm text-[#6B7280] mt-1">Add a new team to your organization</p>
        </div>

      <Input
        label="Team Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <Button onClick={createTeam} className="w-full mt-2">Create Team</Button>

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

