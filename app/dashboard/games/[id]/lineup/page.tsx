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
  jerseyNumber?: number | null;
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

// Position coordinates for each formation (x, y as percentages 0-100)
// y: 0 = top (opponent goal), 100 = bottom (our goal)
// x: 0 = left, 50 = center, 100 = right
const POSITION_COORDINATES: Record<string, Record<string, { x: number; y: number }[]>> = {
  "ELEVEN_V_ELEVEN_4-3-3": {
    GK: [{ x: 50, y: 92 }],
    RB: [{ x: 80, y: 75 }],
    CB: [{ x: 40, y: 75 }, { x: 60, y: 75 }],
    LB: [{ x: 20, y: 75 }],
    CM: [{ x: 30, y: 50 }, { x: 50, y: 50 }, { x: 70, y: 50 }],
    RW: [{ x: 80, y: 25 }],
    ST: [{ x: 50, y: 20 }],
    LW: [{ x: 20, y: 25 }],
  },
  "ELEVEN_V_ELEVEN_4-4-2": {
    GK: [{ x: 50, y: 92 }],
    RB: [{ x: 80, y: 75 }],
    CB: [{ x: 40, y: 75 }, { x: 60, y: 75 }],
    LB: [{ x: 20, y: 75 }],
    RM: [{ x: 80, y: 50 }],
    CM: [{ x: 40, y: 50 }, { x: 60, y: 50 }],
    LM: [{ x: 20, y: 50 }],
    ST: [{ x: 35, y: 20 }, { x: 65, y: 20 }],
  },
  "ELEVEN_V_ELEVEN_3-5-2": {
    GK: [{ x: 50, y: 92 }],
    CB: [{ x: 30, y: 75 }, { x: 50, y: 75 }, { x: 70, y: 75 }],
    RWB: [{ x: 80, y: 50 }],
    CM: [{ x: 35, y: 50 }, { x: 50, y: 50 }, { x: 65, y: 50 }],
    LWB: [{ x: 20, y: 50 }],
    ST: [{ x: 35, y: 20 }, { x: 65, y: 20 }],
  },
  "NINE_V_NINE_3-3-2": {
    GK: [{ x: 50, y: 92 }],
    CB: [{ x: 30, y: 75 }, { x: 50, y: 75 }, { x: 70, y: 75 }],
    CM: [{ x: 30, y: 50 }, { x: 50, y: 50 }, { x: 70, y: 50 }],
    ST: [{ x: 35, y: 20 }, { x: 65, y: 20 }],
  },
  "SEVEN_V_SEVEN_2-3-1": {
    GK: [{ x: 50, y: 92 }],
    CB: [{ x: 40, y: 75 }, { x: 60, y: 75 }],
    CM: [{ x: 30, y: 50 }, { x: 50, y: 50 }, { x: 70, y: 50 }],
    ST: [{ x: 50, y: 20 }],
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
  
  // Get position coordinates for current formation
  const getPositionCoordinates = (positionCode: string, index: number): { x: number; y: number } | null => {
    if (!selectedFormation || !POSITION_COORDINATES[selectedFormation]) {
      return null;
    }
    const coords = POSITION_COORDINATES[selectedFormation][positionCode];
    if (!coords || coords.length === 0) return null;
    // For positions that appear multiple times (like CB, CM), use index to get the right coordinate
    return coords[Math.min(index, coords.length - 1)];
  };
  
  // Count how many times each position appears before the current one
  const getPositionIndex = (positionCode: string, currentIndex: number): number => {
    if (!formation) return 0;
    let count = 0;
    for (let i = 0; i < currentIndex; i++) {
      if (formation.positions[i] === positionCode) {
        count++;
      }
    }
    return count;
  };

  const handlePositionAssign = (positionCode: string, playerId: string) => {
    // Prevent unnecessary updates if the same player is already assigned to this position
    if (lineup[positionCode] === playerId) {
      return;
    }
    
    const newLineup = { ...lineup };
    // Remove player from any other position (only if assigning a new player)
    if (playerId) {
      Object.keys(newLineup).forEach((pos) => {
        if (newLineup[pos] === playerId && pos !== positionCode) {
          delete newLineup[pos];
        }
      });
      newLineup[positionCode] = playerId;
    } else {
      // If clearing the position, just remove it
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

  // Render soccer field with players
  const renderSoccerField = () => {
    if (!formation) return null;
    
    return (
      <div className="relative w-full bg-[#10B981] rounded-lg overflow-hidden" style={{ aspectRatio: '2 / 1' }}>
        {/* Field SVG */}
        <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Field background */}
          <rect x="0" y="0" width="200" height="100" fill="#10B981" />
          
          {/* Center line */}
          <line x1="0" y1="50" x2="200" y2="50" stroke="white" strokeWidth="1" />
          
          {/* Center circle */}
          <circle cx="100" cy="50" r="15" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="100" cy="50" r="1" fill="white" />
          
          {/* Left penalty area */}
          <rect x="0" y="25" width="20" height="50" fill="none" stroke="white" strokeWidth="1" />
          <rect x="0" y="40" width="6" height="20" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="15" cy="50" r="1" fill="white" />
          <path d="M 15 50 A 15 15 0 0 1 15 35" fill="none" stroke="white" strokeWidth="1" />
          
          {/* Right penalty area */}
          <rect x="180" y="25" width="20" height="50" fill="none" stroke="white" strokeWidth="1" />
          <rect x="194" y="40" width="6" height="20" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="185" cy="50" r="1" fill="white" />
          <path d="M 185 50 A 15 15 0 0 0 185 35" fill="none" stroke="white" strokeWidth="1" />
          
          {/* Corner arcs */}
          <path d="M 0 0 Q 5 0 5 5" fill="none" stroke="white" strokeWidth="1" />
          <path d="M 200 0 Q 195 0 195 5" fill="none" stroke="white" strokeWidth="1" />
          <path d="M 0 100 Q 5 100 5 95" fill="none" stroke="white" strokeWidth="1" />
          <path d="M 200 100 Q 195 100 195 95" fill="none" stroke="white" strokeWidth="1" />
        </svg>
        
        {/* Player circles positioned on field */}
        {formation.positions.map((position, index) => {
          const assignedPlayerId = lineup[position];
          const assignedPlayer = availablePlayers.find((p) => p.id === assignedPlayerId);
          const positionIndex = getPositionIndex(position, index);
          const coords = getPositionCoordinates(position, positionIndex);
          
          if (!coords) return null;
          
          // Convert percentage to pixel position (field is 200x100 in viewBox)
          const x = (coords.x / 100) * 200;
          const y = (coords.y / 100) * 100;
          
          return (
            <div
              key={`${position}-${index}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
              }}
            >
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold transition-all ${
                  assignedPlayer
                    ? "bg-[#1A73E8] border-white shadow-lg"
                    : "bg-[#6B7280] border-white border-dashed opacity-50"
                }`}
                title={assignedPlayer ? `${assignedPlayer.firstName} ${assignedPlayer.lastName}` : position}
              >
                {assignedPlayer ? (
                  assignedPlayer.jerseyNumber ? (
                    <span>{assignedPlayer.jerseyNumber}</span>
                  ) : (
                    <span className="text-[10px]">
                      {assignedPlayer.firstName.charAt(0)}{assignedPlayer.lastName.charAt(0)}
                    </span>
                  )
                ) : (
                  <span className="text-[8px] opacity-75">{position}</span>
                )}
              </div>
              {assignedPlayer && (
                <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[10px] font-medium text-white bg-black/50 px-1 rounded">
                    {assignedPlayer.firstName.charAt(0)}. {assignedPlayer.lastName}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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
            
            {/* Soccer Field Visualization */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-[#111827] mb-3">Formation View</h3>
              {renderSoccerField()}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
                <p className="text-[#991B1B] font-medium text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {formation.positions.map((position) => {
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
                    key={position}
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


