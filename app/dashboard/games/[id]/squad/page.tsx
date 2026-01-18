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
  team?: {
    id: string;
    name: string;
  } | null;
}

interface Game {
  id: string;
  homeTeam?: { id: string; name: string } | null;
  awayTeam?: { id: string; name: string } | null;
  team?: { id: string; name: string } | null;
  opponent?: string;
  opponentName?: string | null;
  date: string;
  formationType?: string | null;
  squad?: Array<{
    player: Player;
    status: string;
  }>;
}

export default function SquadSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const gameId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
    
    if (!gameId) {
      setError("Invalid game ID");
      setLoading(false);
      return;
    }

    const fetchGameAndPlayers = async () => {
      try {
        // Fetch game data
        const gameRes = await fetch(`/api/games/${gameId}`);
        if (!gameRes.ok) {
          if (gameRes.status === 404) {
            throw new Error("Game not found");
          }
          throw new Error("Failed to fetch game");
        }

        const gameData = await gameRes.json();
        setGame(gameData);

        // Load existing squad selections
        if (gameData.squad && Array.isArray(gameData.squad)) {
          const squadPlayerIds = gameData.squad
            .map((s: any) => {
              // Handle both nested player object and direct playerId
              return s?.player?.id || s?.playerId;
            })
            .filter((id: any): id is string => Boolean(id));
          setSelectedPlayers(new Set(squadPlayerIds));
        }

        // Load all players - show players from the home team AND players without a team assigned
        const teamId = gameData.homeTeam?.id || gameData.team?.id;
        try {
          const playersRes = await fetch("/api/players");
          if (!playersRes.ok) {
            throw new Error("Failed to fetch players");
          }
          const playersData = await playersRes.json();
          
          // Show players from the team OR players without a team assigned
          const availablePlayers = (playersData || []).filter(
            (p: Player) => !p.team || p.team.id === teamId
          );
          
          setPlayers(availablePlayers);
          
          if (availablePlayers.length === 0) {
            setError("No players available. Please add players to your team first.");
          }
        } catch (playersErr: any) {
          console.error("Error loading players:", playersErr);
          setPlayers([]);
          setError(playersErr.message || "Failed to load players");
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error loading game:", err);
        setError(err.message || "Failed to load game. Please try again.");
        setLoading(false);
        setGame(null);
      }
    };

    fetchGameAndPlayers();
  }, [params.id]);

  const togglePlayer = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSave = async () => {
    const gameId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
    
    if (!gameId) {
      setError("Invalid game ID");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/games/${gameId}/squad`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerIds: Array.from(selectedPlayers),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save squad");
      }

      router.push(`/dashboard/games/${gameId}/lineup`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl">
        <PageHeader title="Squad Selection" />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading...</p>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-7xl">
        <PageHeader title="Squad Selection" />
        <Card className="text-center py-12">
          <p className="text-[#6B7280]">Game not found</p>
        </Card>
      </div>
    );
  }

  const homeTeamName = game.homeTeam?.name || game.team?.name || "Home Team";
  const awayTeamName = game.awayTeam?.name || game.opponentName || game.opponent || "Away Team";

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Call Players to Game"
        description={`${homeTeamName} vs ${awayTeamName}`}
      />

      <Card>
        <div className="mb-6">
          <p className="text-sm text-[#6B7280] mb-4">
            Select players to call up for this game. Selected players will be available for lineup selection.
          </p>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#111827]">
              {selectedPlayers.size} player{selectedPlayers.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setSelectedPlayers(new Set(players.map((p) => p.id)))}
              >
                Select All
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedPlayers(new Set())}
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
            <p className="text-[#991B1B] font-medium text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {players.map((player) => {
            const isSelected = selectedPlayers.has(player.id);
            const positionColors: Record<string, { bg: string; text: string }> = {
              GK: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
              DF: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]" },
              MF: { bg: "bg-[#D1FAE5]", text: "text-[#065F46]" },
              FW: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]" },
            };
            const colors = positionColors[player.position] || {
              bg: "bg-[#F3F4F6]",
              text: "text-[#374151]",
            };

            return (
              <button
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? "border-[#1A73E8] bg-[#EBF4FF]"
                    : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                    {player.profileImageUrl ? (
                      <Image
                        src={player.profileImageUrl}
                        alt={`${player.firstName} ${player.lastName}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#EBF4FF] flex items-center justify-center text-[#1A73E8] text-sm font-semibold">
                        {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {player.firstName} {player.lastName}
                    </p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${colors.bg} ${colors.text}`}>
                      {player.position}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-[#1A73E8] bg-[#1A73E8]"
                        : "border-[#D1D5DB] bg-white"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {players.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-[#6B7280] mb-4">
              No players available. Players need to be assigned to your team or have no team assignment.
            </p>
            <Button
              variant="secondary"
              onClick={() => router.push("/dashboard/players/create")}
            >
              Add Player
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-[#E5E7EB]">
          <Button variant="secondary" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={handleSave} disabled={saving || selectedPlayers.size === 0}>
            {saving ? "Saving..." : "Continue to Lineup"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

