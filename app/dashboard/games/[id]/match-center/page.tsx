"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Image from "next/image";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  profileImageUrl?: string | null;
}

interface MatchEvent {
  id: string;
  minute: number;
  type: string;
  player: Player;
  relatedPlayer?: Player;
  team: { id: string; name: string };
}

interface Game {
  id: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  scoreHome: number;
  scoreAway: number;
  date: string;
  formationType: string;
  squad: Array<{
    player: Player;
    status: string;
  }>;
  events: MatchEvent[];
}

export default function MatchCenterPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [eventType, setEventType] = useState<string>("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [relatedPlayerId, setRelatedPlayerId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      loadGame();
    }
  }, [params.id]);

  const loadGame = async () => {
    try {
      const res = await fetch(`/api/games/${params.id}`);
      const data = await res.json();
      setGame(data);
      setSelectedTeamId(data.homeTeam?.id || "");
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const startingPlayers =
    game?.squad.filter((s) => s.status === "STARTING").map((s) => s.player) ||
    [];
  const benchPlayers =
    game?.squad.filter((s) => s.status === "BENCH").map((s) => s.player) || [];

  const allPlayers = [...startingPlayers, ...benchPlayers];

  const handleCreateEvent = async () => {
    if (!eventType || !selectedPlayerId || !selectedTeamId || currentMinute < 0) {
      setError("Please fill in all required fields");
      return;
    }

    if ((eventType === "SUB_ON" || eventType === "SUB_OFF") && !relatedPlayerId) {
      setError("Please select both players for substitution");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/games/${params.id}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          minute: currentMinute,
          type: eventType,
          playerId: selectedPlayerId,
          relatedPlayerId:
            eventType === "SUB_ON" || eventType === "SUB_OFF"
              ? relatedPlayerId
              : null,
          teamId: selectedTeamId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }

      // Reset form
      setEventType("");
      setSelectedPlayerId("");
      setRelatedPlayerId("");
      setError("");

      // Reload game data
      await loadGame();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getEventDescription = (event: MatchEvent) => {
    switch (event.type) {
      case "GOAL":
        return `${event.player.firstName} ${event.player.lastName} scores`;
      case "ASSIST":
        return `Assist by ${event.player.firstName} ${event.player.lastName}`;
      case "YELLOW_CARD":
        return `Yellow card: ${event.player.firstName} ${event.player.lastName}`;
      case "RED_CARD":
        return `Red card: ${event.player.firstName} ${event.player.lastName}`;
      case "SUB_ON":
        return `${event.player.firstName} ${event.player.lastName} replaces ${event.relatedPlayer?.firstName} ${event.relatedPlayer?.lastName}`;
      case "SUB_OFF":
        return `${event.player.firstName} ${event.player.lastName} replaced`;
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1600px]">
        <PageHeader title="Match Center" />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading match...</p>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-[1600px]">
        <PageHeader title="Match Center" />
        <Card className="text-center py-12">
          <p className="text-[#6B7280]">Game not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px]">
      <PageHeader title="Match Center" />

      {/* Scoreboard */}
      <Card className="mb-6">
        <div className="flex items-center justify-between p-6">
          <div className="flex-1 text-center">
            <p className="text-sm text-[#6B7280] mb-2">Home</p>
            <p className="text-xl font-semibold text-[#111827]">
              {game.homeTeam.name}
            </p>
          </div>
          <div className="px-8">
            <div className="text-4xl font-bold text-[#111827]">
              {game.scoreHome} - {game.scoreAway}
            </div>
          </div>
          <div className="flex-1 text-center">
            <p className="text-sm text-[#6B7280] mb-2">Away</p>
            <p className="text-xl font-semibold text-[#111827]">
              {game.awayTeam.name}
            </p>
          </div>
        </div>
        <div className="border-t border-[#E5E7EB] p-4">
          <div className="flex items-center justify-center gap-4">
            <label className="text-sm font-medium text-[#111827]">Minute:</label>
            <input
              type="number"
              value={currentMinute}
              onChange={(e) => setCurrentMinute(parseInt(e.target.value) || 0)}
              className="w-24 border border-[#E5E7EB] rounded-lg px-4 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
              min="0"
              max="120"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Squad List */}
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-2">
                Starting XI
              </h3>
            </div>
            <div className="space-y-2">
              {startingPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-white"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB]">
                    {player.profileImageUrl ? (
                      <Image
                        src={player.profileImageUrl}
                        alt={`${player.firstName} ${player.lastName}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#EBF4FF] flex items-center justify-center text-[#1A73E8] text-xs font-semibold">
                        {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-xs text-[#6B7280]">{player.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-2">Bench</h3>
            </div>
            <div className="space-y-2">
              {benchPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-white"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB]">
                    {player.profileImageUrl ? (
                      <Image
                        src={player.profileImageUrl}
                        alt={`${player.firstName} ${player.lastName}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#EBF4FF] flex items-center justify-center text-[#1A73E8] text-xs font-semibold">
                        {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-xs text-[#6B7280]">{player.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center: Event Controls */}
        <Card>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#111827] mb-2">
              Record Event
            </h3>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
              <p className="text-[#991B1B] font-medium text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-xs font-medium text-[#111827]">
                Event Type *
              </label>
              <select
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value);
                  setSelectedPlayerId("");
                  setRelatedPlayerId("");
                }}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
              >
                <option value="">Select event</option>
                <option value="GOAL">Goal</option>
                <option value="ASSIST">Assist</option>
                <option value="YELLOW_CARD">Yellow Card</option>
                <option value="RED_CARD">Red Card</option>
                <option value="SUB_ON">Substitution (On)</option>
                <option value="SUB_OFF">Substitution (Off)</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-xs font-medium text-[#111827]">
                Team *
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
              >
                <option value={game.homeTeam.id}>{game.homeTeam.name}</option>
                <option value={game.awayTeam.id}>{game.awayTeam.name}</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-xs font-medium text-[#111827]">
                Player *
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
              >
                <option value="">Select player</option>
                {allPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.firstName} {player.lastName}
                  </option>
                ))}
              </select>
            </div>

            {(eventType === "SUB_ON" || eventType === "SUB_OFF") && (
              <div>
                <label className="block mb-2 text-xs font-medium text-[#111827]">
                  {eventType === "SUB_ON" ? "Player Going Off" : "Player Coming On"} *
                </label>
                <select
                  value={relatedPlayerId}
                  onChange={(e) => setRelatedPlayerId(e.target.value)}
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                >
                  <option value="">Select player</option>
                  {allPlayers
                    .filter((p) => p.id !== selectedPlayerId)
                    .map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.firstName} {player.lastName}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <Button
              onClick={handleCreateEvent}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Saving..." : "Record Event"}
            </Button>
          </div>
        </Card>

        {/* Right: Event Log */}
        <Card>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#111827] mb-2">
              Match Events
            </h3>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {game.events.length === 0 ? (
              <p className="text-sm text-[#6B7280] text-center py-8">
                No events recorded yet
              </p>
            ) : (
              game.events.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border border-[#E5E7EB] bg-white"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-medium text-[#1A73E8]">
                      {event.minute}'
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        event.type === "GOAL"
                          ? "bg-[#ECFDF5] text-[#065F46]"
                          : event.type === "YELLOW_CARD"
                          ? "bg-[#FEF3C7] text-[#92400E]"
                          : event.type === "RED_CARD"
                          ? "bg-[#FEE2E2] text-[#991B1B]"
                          : "bg-[#F3F4F6] text-[#374151]"
                      }`}
                    >
                      {event.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-[#111827]">
                    {getEventDescription(event)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

