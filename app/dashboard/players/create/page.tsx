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
    <Card className="max-w-lg">
      <h1 className="text-xl font-bold mb-4">Create Player</h1>

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

      <Button onClick={createPlayer}>Create Player</Button>

      {message && <p className="mt-4 text-green-600">{message}</p>}
    </Card>
  );
}

