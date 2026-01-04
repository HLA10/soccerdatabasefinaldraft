"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface Invite {
  id: string;
  team: {
    name: string;
  };
  status: string;
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invites/list")
      .then((res) => res.json())
      .then((data) => {
        setInvites(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function acceptInvite(inviteId: string) {
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteId }),
      });

      if (res.ok) {
        setInvites(invites.filter((i) => i.id !== inviteId));
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Your Invites</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Your Invites</h1>
        <Card className="max-w-lg">
          <p className="text-gray-600">You have no pending invites.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Invites</h1>
      <div className="space-y-4">
        {invites.map((invite) => (
          <Card key={invite.id} className="max-w-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{invite.team.name}</p>
                <p className="text-gray-600">Status: {invite.status}</p>
              </div>
              {invite.status === "PENDING" && (
                <Button
                  variant="primary"
                  onClick={() => acceptInvite(invite.id)}
                >
                  Accept
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

