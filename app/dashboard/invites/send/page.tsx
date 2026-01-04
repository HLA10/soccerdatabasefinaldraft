"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function SendInvitePage() {
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendInvite() {
    setError("");
    setMessage("");

    if (!email || !teamId) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, teamId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send invite");
        return;
      }

      setMessage("Invite sent successfully!");
      setEmail("");
      setTeamId("");
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Error:", error);
    }
  }

  return (
    <Card className="max-w-lg">
      <h1 className="text-xl font-bold mb-4">Send Invite</h1>

      <Input
        label="User Email"
        type="email"
        placeholder="user@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        label="Team ID"
        placeholder="Enter team ID"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
      />

      <Button onClick={sendInvite}>Send Invite</Button>

      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </Card>
  );
}

