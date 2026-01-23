"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Image from "next/image";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  jerseyNumber?: number | null;
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

interface LineupPosition {
  id: string;
  positionCode: string;
  player: Player;
}

interface Formation {
  id: string;
  formationName: string;
  formationType: string;
}

interface Game {
  id: string;
  homeTeam: { 
    id: string; 
    name: string;
    logoUrl?: string | null;
    club?: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } | null;
  };
  awayTeam: { 
    id: string; 
    name: string;
    logoUrl?: string | null;
    club?: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } | null;
  };
  opponentLogoUrl?: string | null;
  opponentAgeGroup?: string | null;
  scoreHome: number;
  scoreAway: number;
  date: string;
  time?: string | null;
  formationType: string;
  squad: Array<{
    player: Player;
    status: string;
  }>;
  events: MatchEvent[];
  formations: Formation[];
  lineupPositions: LineupPosition[];
  playerMinutes: Array<{
    id: string;
    playerId: string;
    player: Player;
    minuteOn: number;
    minuteOff?: number | null;
  }>;
}

const POSITION_ORDER: Record<string, number> = {
  GK: 0,
  CB: 1,
  LB: 2,
  RB: 3,
  LWB: 4,
  RWB: 5,
  CDM: 6,
  CM: 7,
  CAM: 8,
  LM: 9,
  RM: 10,
  LW: 11,
  RW: 12,
  ST: 13,
  FW: 14,
};

const COMMON_FORMATIONS = [
  { name: "4-4-2", value: "4-4-2" },
  { name: "4-3-3", value: "4-3-3" },
  { name: "4-2-3-1", value: "4-2-3-1" },
  { name: "3-5-2", value: "3-5-2" },
  { name: "4-5-1", value: "4-5-1" },
  { name: "3-4-3", value: "3-4-3" },
  { name: "5-3-2", value: "5-3-2" },
];

export default function ScoreboardPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFormation, setSelectedFormation] = useState<string>("");
  const [matchDuration, setMatchDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Event creation state
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventType, setEventType] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [relatedPlayerId, setRelatedPlayerId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [eventMinute, setEventMinute] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const gameId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
    if (gameId) {
      loadGame();
    }
  }, [params.id]);
  
  // Update event minute when match duration changes
  useEffect(() => {
    if (!showEventForm) {
      setEventMinute(matchDuration);
    }
  }, [matchDuration, showEventForm]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60);
        setMatchDuration(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const loadGame = async () => {
    try {
      const gameId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
      if (!gameId) return;
      
      const res = await fetch(`/api/games/${gameId}`);
      const data = await res.json();
      setGame(data);
      if (data.formations && data.formations.length > 0) {
        setSelectedFormation(data.formations[0].formationName);
      }
      if (data.homeTeam?.id) {
        setSelectedTeamId(data.homeTeam.id);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleFormationChange = async (formationName: string) => {
    setSelectedFormation(formationName);
    try {
      const gameId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
      if (!gameId) return;
      
      await fetch(`/api/games/${gameId}/formation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formationName,
          formationType: game?.formationType || "ELEVEN_V_ELEVEN",
        }),
      });
      await loadGame();
    } catch (err) {
      console.error("Failed to update formation:", err);
    }
  };
  
  const handleCreateEvent = async () => {
    const gameId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
    if (!gameId) {
      setError("Invalid game ID");
      return;
    }
    
    if (!eventType || !selectedPlayerId || !selectedTeamId) {
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
      const res = await fetch(`/api/games/${gameId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          minute: eventMinute,
          type: eventType,
          playerId: selectedPlayerId,
          relatedPlayerId:
            eventType === "SUB_ON" || eventType === "SUB_OFF"
              ? relatedPlayerId
              : eventType === "ASSIST"
              ? relatedPlayerId || null
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
      setEventMinute(matchDuration);
      setShowEventForm(false);
      setError("");

      // Reload game data
      await loadGame();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Get available players for event creation
  const startingPlayers = game?.squad
    .filter((s) => s.status === "STARTING")
    .map((s) => s.player) || [];
  const benchPlayers = game?.squad
    .filter((s) => s.status === "BENCH" || s.status === "CALLED")
    .map((s) => s.player) || [];
  const allPlayers = [...startingPlayers, ...benchPlayers];
  
  // Filter players by selected team
  const teamPlayers = allPlayers.filter((player) => {
    if (!game) return false;
    if (selectedTeamId === game.homeTeam?.id) {
      return player.team?.id === game.homeTeam?.id || !player.team;
    } else if (selectedTeamId === game.awayTeam?.id) {
      return player.team?.id === game.awayTeam?.id || !player.team;
    }
    return true;
  });
  
  // Auto-detect team when player is selected
  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayerId(playerId);
    const player = allPlayers.find((p) => p.id === playerId);
    if (player && game) {
      // Try to determine team from player's team or default to home team
      if (player.team?.id === game.homeTeam?.id) {
        setSelectedTeamId(game.homeTeam.id);
      } else if (player.team?.id === game.awayTeam?.id) {
        setSelectedTeamId(game.awayTeam.id);
      } else if (!selectedTeamId && game.homeTeam?.id) {
        setSelectedTeamId(game.homeTeam.id);
      }
    }
  };

  const startMatch = () => {
    setStartTime(new Date());
    setIsRunning(true);
    // PlayerMinutes will be created automatically by the API when the first event is recorded at minute 0
  };

  const stopMatch = () => {
    setIsRunning(false);
  };

  const resetMatch = () => {
    setIsRunning(false);
    setMatchDuration(0);
    setStartTime(null);
  };

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="max-w-[1600px]">
        <PageHeader title="Scoreboard" />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading scoreboard...</p>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-[1600px]">
        <PageHeader title="Scoreboard" />
        <Card className="text-center py-12">
          <p className="text-[#6B7280]">Game not found</p>
        </Card>
      </div>
    );
  }

  // Group players by position
  const playersByPosition = startingPlayers.reduce((acc, player) => {
    const pos = player.position || "Unknown";
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(player);
    return acc;
  }, {} as Record<string, Player[]>);

  // Sort positions
  const sortedPositions = Object.keys(playersByPosition).sort(
    (a, b) => (POSITION_ORDER[a] || 99) - (POSITION_ORDER[b] || 99)
  );

  // Get events by type
  const goals = game.events.filter((e) => e.type === "GOAL");
  const assists = game.events.filter((e) => e.type === "ASSIST");
  const yellowCards = game.events.filter((e) => e.type === "YELLOW_CARD");
  const redCards = game.events.filter((e) => e.type === "RED_CARD");
  const substitutions = game.events.filter(
    (e) => e.type === "SUB_ON" || e.type === "SUB_OFF"
  );

  // Match goals with assists
  const goalsWithAssists = goals.map((goal) => {
    const assist = assists.find(
      (a) => 
        a.minute === goal.minute && 
        a.team.id === goal.team.id &&
        (a.relatedPlayer?.id === goal.player.id || a.relatedPlayerId === goal.playerId)
    );
    return { goal, assist };
  });

  // Get substitutions grouped
  const substitutionsGrouped = substitutions.reduce((acc, event) => {
    if (event.type === "SUB_ON" && event.relatedPlayer) {
      acc.push({
        id: event.id,
        minute: event.minute,
        playerOn: event.player,
        playerOff: event.relatedPlayer,
        team: event.team,
      });
    }
    return acc;
  }, [] as Array<{ id: string; minute: number; playerOn: Player; playerOff: Player; team: { id: string; name: string } }>);

  const homeTeamLogo = game.homeTeam.logoUrl || game.homeTeam.club?.logoUrl || null;
  const awayTeamLogo = game.awayTeam.logoUrl || game.awayTeam.club?.logoUrl || game.opponentLogoUrl || null;

  return (
    <div className="max-w-[1600px]">
      <PageHeader 
        title="Scoreboard"
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const gameId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
                if (gameId) router.push(`/dashboard/games/${gameId}/match-center`);
              }}
            >
              Match Center
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const gameId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null;
                if (gameId) router.push(`/dashboard/games/${gameId}/lineup`);
              }}
            >
              Lineup
            </Button>
          </div>
        }
      />

      {/* Main Scoreboard Header */}
      <Card className="mb-6">
        <div className="flex items-center justify-between p-6">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center">
            {homeTeamLogo && (
              <div className="relative w-20 h-20 mb-3">
                <Image
                  src={homeTeamLogo}
                  alt={game.homeTeam.name}
                  fill
                  className="object-contain rounded"
                />
              </div>
            )}
            <p className="text-2xl font-bold text-[#111827] mb-1">
              {game.homeTeam.name}
            </p>
            <p className="text-5xl font-bold text-[#1A73E8]">{game.scoreHome}</p>
          </div>

          {/* Center: Score & Timer */}
          <div className="px-8 flex flex-col items-center">
            <div className="text-4xl font-bold text-[#111827] mb-4">
              {game.scoreHome} - {game.scoreAway}
            </div>
            
            {/* Match Timer */}
            <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
              <div className="text-center mb-2">
                <div className="text-3xl font-bold text-[#111827] font-mono">
                  {formatTime(matchDuration)}
                </div>
                <p className="text-xs text-[#6B7280] mt-1">Match Duration</p>
              </div>
              <div className="flex gap-2 flex-col">
                <div className="flex gap-2">
                  {!isRunning ? (
                    <Button onClick={startMatch} className="text-xs px-3 py-1">
                      Start
                    </Button>
                  ) : (
                    <Button onClick={stopMatch} variant="secondary" className="text-xs px-3 py-1">
                      Stop
                    </Button>
                  )}
                  <Button onClick={resetMatch} variant="secondary" className="text-xs px-3 py-1">
                    Reset
                  </Button>
                </div>
                <Button 
                  onClick={() => {
                    setShowEventForm(!showEventForm);
                    setEventMinute(matchDuration);
                  }}
                  className="text-xs px-3 py-1 mt-2"
                >
                  {showEventForm ? "Cancel" : "Add Event"}
                </Button>
              </div>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center">
            {awayTeamLogo && (
              <div className="relative w-20 h-20 mb-3">
                <Image
                  src={awayTeamLogo}
                  alt={game.awayTeam.name}
                  fill
                  className="object-contain rounded"
                />
              </div>
            )}
            <p className="text-2xl font-bold text-[#111827] mb-1">
              {game.awayTeam.name}{game.opponentAgeGroup ? ` ${game.opponentAgeGroup}` : ''}
            </p>
            <p className="text-5xl font-bold text-[#1A73E8]">{game.scoreAway}</p>
          </div>
        </div>
      </Card>

      {/* Event Creation Form */}
      {showEventForm && game && (
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Add Match Event</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
                <p className="text-[#991B1B] text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Event Type *
                </label>
                <select
                  value={eventType}
                  onChange={(e) => {
                    setEventType(e.target.value);
                    setRelatedPlayerId(""); // Reset related player when event type changes
                  }}
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                >
                  <option value="">Select event type</option>
                  <option value="GOAL">Goal</option>
                  <option value="ASSIST">Assist</option>
                  <option value="YELLOW_CARD">Yellow Card</option>
                  <option value="RED_CARD">Red Card</option>
                  <option value="SUB_ON">Substitution (Player On)</option>
                  <option value="SUB_OFF">Substitution (Player Off)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Minute *
                </label>
                <input
                  type="number"
                  value={eventMinute}
                  onChange={(e) => setEventMinute(parseInt(e.target.value) || 0)}
                  min="0"
                  max="120"
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Team *
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                >
                  <option value="">Select team</option>
                  {game.homeTeam && (
                    <option value={game.homeTeam.id}>{game.homeTeam.name}</option>
                  )}
                  {game.awayTeam && (
                    <option value={game.awayTeam.id}>
                      {game.awayTeam.name}{game.opponentAgeGroup ? ` ${game.opponentAgeGroup}` : ''}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Player *
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => handlePlayerSelect(e.target.value)}
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                >
                  <option value="">Select player</option>
                  {teamPlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.firstName} {player.lastName} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {(eventType === "SUB_ON" || eventType === "SUB_OFF" || eventType === "ASSIST") && (
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    {eventType === "ASSIST" ? "Goal Scorer" : "Related Player"} *
                  </label>
                  <select
                    value={relatedPlayerId}
                    onChange={(e) => setRelatedPlayerId(e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                  >
                    <option value="">Select player</option>
                    {teamPlayers
                      .filter((p) => p.id !== selectedPlayerId)
                      .map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.firstName} {player.lastName} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEventForm(false);
                  setEventType("");
                  setSelectedPlayerId("");
                  setRelatedPlayerId("");
                  setError("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateEvent} disabled={saving}>
                {saving ? "Saving..." : "Add Event"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Starting Lineup */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#111827]">Starting Lineup</h3>
              
              {/* Formation Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#6B7280]">Formation:</label>
                <select
                  value={selectedFormation}
                  onChange={(e) => handleFormationChange(e.target.value)}
                  className="text-xs border border-[#E5E7EB] rounded px-2 py-1 text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                >
                  <option value="">Select Formation</option>
                  {COMMON_FORMATIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {sortedPositions.map((position) => (
                <div key={position}>
                  <h4 className="text-xs font-semibold text-[#6B7280] uppercase mb-2">
                    {position}
                  </h4>
                  <div className="space-y-2">
                    {playersByPosition[position].map((player) => {
                      const minutes = game.playerMinutes.find(
                        (pm) => pm.playerId === player.id
                      );
                      const isSubbedOff = minutes?.minuteOff !== null && minutes?.minuteOff !== undefined;
                      
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            isSubbedOff
                              ? "bg-[#F9FAFB] border-[#E5E7EB] opacity-60"
                              : "bg-white border-[#E5E7EB]"
                          }`}
                        >
                          {player.jerseyNumber && (
                            <div className="w-8 h-8 bg-[#1A73E8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {player.jerseyNumber}
                            </div>
                          )}
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB] flex-shrink-0">
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
                            {minutes && (
                              <p className="text-xs text-[#6B7280]">
                                {minutes.minuteOn}' - {minutes.minuteOff ? `${minutes.minuteOff}'` : 'Playing'}
                              </p>
                            )}
                          </div>
                          {isSubbedOff && (
                            <span className="text-xs text-[#6B7280]">OFF</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center Column: Goals & Assists */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Goals</h3>
            <div className="space-y-3">
              {goalsWithAssists.length === 0 ? (
                <p className="text-sm text-[#6B7280] text-center py-8">No goals yet</p>
              ) : (
                goalsWithAssists.map(({ goal, assist }, index) => {
                  const isHomeTeam = goal.team.id === game.homeTeam.id;
                  return (
                    <div
                      key={goal.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-white"
                    >
                      <div className={`w-1 h-12 rounded ${isHomeTeam ? 'bg-[#1A73E8]' : 'bg-[#10B981]'}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[#1A73E8]">
                            {goal.minute}'
                          </span>
                          <span className="text-sm font-semibold text-[#111827]">
                            {goal.player.firstName} {goal.player.lastName}
                          </span>
                          <span className="text-xs text-[#6B7280]">
                            ({goal.team.name})
                          </span>
                        </div>
                        {assist && (
                          <p className="text-xs text-[#6B7280] ml-6">
                            Assist: {assist.player.firstName} {assist.player.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Yellow Cards</h3>
            <div className="space-y-2">
              {yellowCards.length === 0 ? (
                <p className="text-sm text-[#6B7280] text-center py-8">No yellow cards</p>
              ) : (
                yellowCards.map((card) => {
                  const isHomeTeam = card.team.id === game.homeTeam.id;
                  return (
                    <div
                      key={card.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[#FEF3C7] bg-[#FFFBEB]"
                    >
                      <div className="w-8 h-8 bg-[#FCD34D] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#92400E]">YC</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#111827]">
                          {card.player.firstName} {card.player.lastName}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {card.minute}' - {card.team.name}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {redCards.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Red Cards</h3>
              <div className="space-y-2">
                {redCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[#FEE2E2] bg-[#FEF2F2]"
                  >
                    <div className="w-8 h-8 bg-[#EF4444] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">RC</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111827]">
                        {card.player.firstName} {card.player.lastName}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {card.minute}' - {card.team.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Substitutions */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Substitutions</h3>
            <div className="space-y-3">
              {substitutionsGrouped.length === 0 ? (
                <p className="text-sm text-[#6B7280] text-center py-8">No substitutions</p>
              ) : (
                substitutionsGrouped.map((sub) => {
                  const isHomeTeam = sub.team.id === game.homeTeam.id;
                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-lg border border-[#E5E7EB] bg-white"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#1A73E8]">
                          {sub.minute}'
                        </span>
                        <span className="text-xs text-[#6B7280]">{sub.team.name}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-[#111827]">
                              {sub.playerOn.firstName} {sub.playerOn.lastName}
                            </p>
                            <p className="text-xs text-[#6B7280]">ON</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#EF4444]"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#111827] line-through">
                              {sub.playerOff.firstName} {sub.playerOff.lastName}
                            </p>
                            <p className="text-xs text-[#6B7280]">OFF</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Match Stats Summary */}
          <Card>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Match Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F9FAFB]">
                <span className="text-sm text-[#6B7280]">Goals</span>
                <div className="flex gap-4">
                  <span className="text-sm font-semibold text-[#111827]">
                    {game.scoreHome} - {game.scoreAway}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F9FAFB]">
                <span className="text-sm text-[#6B7280]">Yellow Cards</span>
                <span className="text-sm font-semibold text-[#111827]">
                  {yellowCards.length}
                </span>
              </div>
              {redCards.length > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-[#F9FAFB]">
                  <span className="text-sm text-[#6B7280]">Red Cards</span>
                  <span className="text-sm font-semibold text-[#111827]">
                    {redCards.length}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#F9FAFB]">
                <span className="text-sm text-[#6B7280]">Substitutions</span>
                <span className="text-sm font-semibold text-[#111827]">
                  {substitutionsGrouped.length}
                </span>
              </div>
              {selectedFormation && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-[#F9FAFB]">
                  <span className="text-sm text-[#6B7280]">Formation</span>
                  <span className="text-sm font-semibold text-[#111827]">
                    {selectedFormation}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
