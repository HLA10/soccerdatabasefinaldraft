"use client";

import { useEffect, useState } from "react";

export default function InvitesPage() {
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    fetch("/api/invites/list")
      .then((res) => res.json())
      .then((data) => setInvites(data));
  }, []);

  async function acceptInvite(inviteId: string) {
    await fetch("/api/invites/accept", {
      method: "POST",
      body: JSON.stringify({ inviteId }),
    });

    setInvites(invites.filter((i: any) => i.id !== inviteId));
  }

  return (
    <div>
      <h1>Your Invites</h1>

      {invites.map((invite: any) => (
        <div key={invite.id} className="border p-2 mb-2">
          <p>Team: {invite.team.name}</p>
          <p>Status: {invite.status}</p>
          <button
            onClick={() => acceptInvite(invite.id)}
            className="p-2 bg-green-500 text-white"
          >
            Accept
          </button>
        </div>
      ))}
    </div>
  );
}

