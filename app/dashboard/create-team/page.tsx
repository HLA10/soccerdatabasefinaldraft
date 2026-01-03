"use client";

import { useState } from "react";

export default function CreateTeamPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  async function createTeam() {
    if (!name.trim()) {
      setMessage("Please enter a team name");
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
        setMessage(data.error || "Failed to create team");
        return;
      }

      setMessage("Team created successfully!");
      setName(""); // Clear the input
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      console.error("Error:", error);
    }
  }

  return (
    <div>
      <h1>Create a Team</h1>
      <input
        placeholder="Team name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            createTeam();
          }
        }}
        className="border p-2"
      />
      <button onClick={createTeam} className="ml-2 p-2 bg-blue-500 text-white">
        Create
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}

