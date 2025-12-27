"use client";

import { useState } from "react";

export default function CreatePlayerPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("FW");
  const [message, setMessage] = useState("");

  async function createPlayer() {
    const res = await fetch("/api/players", {
      method: "POST",
      body: JSON.stringify({ firstName, lastName, position }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error);
      return;
    }

    setMessage("Player created!");
  }

  return (
    <div>
      <h1>Create Player</h1>

      <input
        placeholder="First name"
        className="border p-2 block mb-2"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />

      <input
        placeholder="Last name"
        className="border p-2 block mb-2"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />

      <select
        className="border p-2 block mb-2"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
      >
        <option value="GK">Goalkeeper</option>
        <option value="DF">Defender</option>
        <option value="MF">Midfielder</option>
        <option value="FW">Forward</option>
      </select>

      <button
        onClick={createPlayer}
        className="p-2 bg-blue-500 text-white"
      >
        Create Player
      </button>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}

