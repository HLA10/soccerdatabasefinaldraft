"use client";

import { useState } from "react";

export default function CreateTeamPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  async function createTeam() {
    const res = await fetch("/api/teams", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error);
      return;
    }

    setMessage("Team created successfully!");
  }

  return (
    <div>
      <h1>Create a Team</h1>
      <input
        placeholder="Team name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2"
      />
      <button onClick={createTeam} className="ml-2 p-2 bg-blue-500 text-white">
        Create
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}

