"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Add Player
        </h1>
        <p className="text-gray-600">Add a new player to your organization</p>
      </div>
      <Card className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-xl">
            ⚽
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Player Information</h2>
        </div>

      <Input
        label="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />

      <Input
        label="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />

      <div className="mb-4">
        <label className="block mb-1 font-medium">Position</label>
        <select
          className="w-full border rounded p-2"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        >
          <option value="GK">Goalkeeper</option>
          <option value="DF">Defender</option>
          <option value="MF">Midfielder</option>
          <option value="FW">Forward</option>
        </select>
      </div>

      <Button onClick={createPlayer} className="w-full mt-2">Create Player</Button>

      {message && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium flex items-center gap-2">
            <span>✓</span>
            {message}
          </p>
        </div>
      )}
    </Card>
  );
}

