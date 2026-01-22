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

interface Game {
  id: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  formationType: string;
  squad: Array<{
    player: Player;
    status: string;
  }>;
  formations?: Array<{
    id: string;
    formationName: string;
    formationType: string;
  }>;
  lineupPositions?: Array<{
    id: string;
    positionCode: string;
    playerId: string;
    player?: Player;
  }>;
}

const FORMATIONS: Record<string, { name: string; positions: string[] }> = {
  "ELEVEN_V_ELEVEN_4-3-3": {
    name: "4-3-3",
    positions: ["GK", "RB", "CB", "CB", "LB", "CM", "CM", "CM", "RW", "ST", "LW"],
  },
  "ELEVEN_V_ELEVEN_4-4-2": {
    name: "4-4-2",
    positions: ["GK", "RB", "CB", "CB", "LB", "RM", "CM", "CM", "LM", "ST", "ST"],
  },
  "ELEVEN_V_ELEVEN_3-5-2": {
    name: "3-5-2",
    positions: ["GK", "CB", "CB", "CB", "RWB", "CM", "CM", "CM", "LWB", "ST", "ST"],
  },
  "NINE_V_NINE_3-3-2": {
    name: "3-3-2",
    positions: ["GK", "CB", "CB", "CB", "CM", "CM", "CM", "ST", "ST"],
  },
  "SEVEN_V_SEVEN_2-3-1": {
    name: "2-3-1",
    positions: ["GK", "CB", "CB", "CM", "CM", "CM", "ST"],
  },
};

export default function LineupPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<string>("");
  const [lineup, setLineup] = useState<Record<string, string>>({});
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

    fetch(`/api/games/${gameId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Game not found");
          }
          throw new Error(`Failed to load game: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!data) {
          throw new Error("No game data received");
        }
        setGame(data);
        if (data.formations && data.formations.length > 0) {
          const formation = data.formations[0];
          setSelectedFormation(
            `${data.formationType}_${formation.formationName.replace("-", "-")}`
          );
        } else {
          // Set default formation based on match type
          const defaultFormation =
            data.formationType === "NINE_V_NINE"
              ? "NINE_V_NINE_3-3-2"
              : data.formationType === "SEVEN_V_SEVEN"
              ? "SEVEN_V_SEVEN_2-3-1"
              : "ELEVEN_V_ELEVEN_4-3-3";
          setSelectedFormation(defaultFormation);
        }
        if (data.lineupPositions && Array.isArray(data.lineupPositions)) {
          const positions: Record<string, string> = {};
          data.lineupPositions.forEach((lp: any) => {
            if (lp.positionCode && lp.playerId) {
              positions[lp.positionCode] = lp.playerId;
            }
          });
          setLineup(positions);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading game:", err);
        setError(err.message || "Failed to load game");
        setLoading(false);
      });
  }, [params.id]);

  const availablePlayers = (game?.squad || [])
    .filter((s) => s.status === "CALLED" || s.status === "BENCH" || s.status === "STARTING")
    .map((s) => s.player)
    .filter((p): p is Player => p !== undefined) || [];

  const formation = selectedFormation ? FORMATIONS[selectedFormation] : null;
  const availableFormations = Object.keys(FORMATIONS).filter((key) =>
    key.startsWith(game?.formationType || "ELEVEN_V_ELEVEN")
  );

  const handlePositionAssign = (positionCode: string, playerId: string) => {
    const newLineup = { ...lineup };
    // Remove player from any other position
    Object.keys(newLineup).forEach((pos) => {
      if (newLineup[pos] === playerId) {
        delete newLineup[pos];
      }
    });
    if (playerId) {
      newLineup[positionCode] = playerId;
    } else {
      delete newLineup[positionCode];
    }
    setLineup(newLineup);
  };

  const handleSave = async () => {
    if (!formation) return;

    const gameId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
    if (!gameId) {
      setError("Invalid game ID");
      return;
    }

    setSaving(true);
    setError("");

    const positions = formation.positions.map((pos, index) => ({
      positionCode: pos,
      playerId: lineup[pos] || "",
    }));

    if (positions.some((p) => !p.playerId)) {
      setError("Please assign all starting positions");
      setSaving(false);
      return;
    }

    // Check for duplicate player assignments
    const playerIds = positions.map((p) => p.playerId).filter((id) => id);
    const uniquePlayerIds = new Set(playerIds);
    if (playerIds.length !== uniquePlayerIds.size) {
      setError("Each player can only be assigned to one position");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/games/${gameId}/lineup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formationName: formation.name,
          formationType: game?.formationType || "ELEVEN_V_ELEVEN",
          positions: positions.map((p) => ({
            playerId: p.playerId,
            positionCode: p.positionCode,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save lineup");
      }

      router.push(`/dashboard/games/${gameId}/match-center`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl">
        <PageHeader title="Select Lineup" />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading...</p>
        </Card>
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="max-w-7xl">
        <PageHeader title="Select Lineup" />
        <Card className="text-center py-12">
          <p className="text-[#991B1B] mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-7xl">
        <PageHeader title="Select Lineup" />
        <Card className="text-center py-12">
          <p className="text-[#6B7280] mb-4">Game not found</p>
          {error && <p className="text-sm text-[#991B1B] mb-4">{error}</p>}
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="max-w-7xl">
        <PageHeader title="Select Lineup" />
        <Card className="text-center py-12">
          <p className="text-[#6B7280] mb-4">Invalid formation selected</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  if (!game.squad || game.squad.length === 0) {
    return (
      <div className="max-w-7xl">
        <PageHeader title="Select Lineup" />
        <Card className="text-center py-12">
          <p className="text-[#6B7280] mb-4">No players in squad. Please add players to the squad first.</p>
          <Button onClick={() => {
            const gameId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
            if (gameId) {
              router.push(`/dashboard/games/${gameId}/squad`);
            }
          }}>
            Go to Squad Selection
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Select Starting Lineup"
        description={`${game.homeTeam.name} vs ${game.awayTeam.name}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Formation
              </label>
              <select
                value={selectedFormation}
                onChange={(e) => {
                  setSelectedFormation(e.target.value);
                  setLineup({});
                }}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
              >
                {availableFormations.map((key) => (
                  <option key={key} value={key}>
                    {FORMATIONS[key].name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
                <p className="text-[#991B1B] font-medium text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {formation.positions.map((position, index) => {
                const assignedPlayerId = lineup[position];
                const assignedPlayer = availablePlayers.find(
                  (p) => p.id === assignedPlayerId
                );
                
                // Filter out players already assigned to other positions
                const availableForThisPosition = availablePlayers.filter(
                  (player) => {
                    // Include the currently assigned player for this position
                    if (player.id === assignedPlayerId) return true;
                    // Exclude players assigned to other positions
                    return !Object.values(lineup).includes(player.id);
                  }
                );

                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border border-[#E5E7EB] rounded-lg"
                  >
                    <div className="w-24">
                      <span className="text-sm font-medium text-[#111827]">
                        {position}
                      </span>
                    </div>
                    <div className="flex-1">
                      <select
                        value={assignedPlayerId || ""}
                        onChange={(e) =>
                          handlePositionAssign(position, e.target.value)
                        }
                        className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                      >
                        <option value="">Select player</option>
                        {availableForThisPosition.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.firstName} {player.lastName} ({player.position})
                          </option>
                        ))}
                      </select>
                    </div>
                    {assignedPlayer && (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB]">
                        {assignedPlayer.profileImageUrl ? (
                          <Image
                            src={assignedPlayer.profileImageUrl}
                            alt={`${assignedPlayer.firstName} ${assignedPlayer.lastName}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#EBF4FF] flex items-center justify-center text-[#1A73E8] text-xs font-semibold">
                            {assignedPlayer.firstName.charAt(0)}
                            {assignedPlayer.lastName.charAt(0)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
              <Button variant="secondary" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Continue to Match Center"}
              </Button>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-2">
                Bench Players
              </h3>
              <p className="text-xs text-[#6B7280]">
                Players not in starting lineup
              </p>
            </div>
            <div className="space-y-2">
              {availablePlayers
                .filter(
                  (p) => !Object.values(lineup).includes(p.id)
                )
                .map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#F9FAFB]"
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#E5E7EB]">
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
                      <p className="text-xs font-medium text-[#111827] truncate">
                        {player.firstName} {player.lastName}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


