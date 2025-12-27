"use client";

import { useState } from "react";

export default function SendInvitePage() {
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState("");
  const [message, setMessage] = useState("");

  async function sendInvite() {
    const res = await fetch("/api/invites", {
      method: "POST",
      body: JSON.stringify({ email, teamId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error);
      return;
    }

    setMessage("Invite sent!");
  }

  return (
    <div>
      <h1>Send Invite</h1>

      <input
        placeholder="User email"
        className="border p-2 block mb-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Team ID"
        className="border p-2 block mb-2"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
      />

      <button
        onClick={sendInvite}
        className="p-2 bg-blue-500 text-white"
      >
        Send Invite
      </button>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}

