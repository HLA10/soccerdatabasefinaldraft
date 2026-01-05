"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Image from "next/image";

interface Team {
  id: string;
  name: string;
  logoUrl?: string | null;
  club?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
}

interface SearchResult {
  id: string;
  name: string;
  type: "club" | "team";
  logoUrl?: string | null;
  club?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
}

interface GameForm {
  homeTeamId: string;
  opponentTeamId: string;
  opponentName: string;
  matchType: string;
  date: string;
  time: string;
  location: string;
  venueName: string;
  matchFormat: string;
}

export default function RegisterGamePage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<SearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [createClubForm, setCreateClubForm] = useState({
    clubName: "",
    teamName: "",
    logoUrl: "",
    logoFile: null as File | null,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<GameForm>({
    homeTeamId: "",
    opponentTeamId: "",
    opponentName: "",
    matchType: "FRIENDLY",
    date: "",
    time: "",
    location: "",
    venueName: "",
    matchFormat: "ELEVEN_V_ELEVEN",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        setTeams(data || []);
        if (data && data.length > 0) {
          setHomeTeam(data[0]);
          setForm((prev) => ({ ...prev, homeTeamId: data[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for clubs/teams
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetch(`/api/clubs/search?q=${encodeURIComponent(searchQuery)}`)
          .then((res) => res.json())
          .then((data) => {
            setSearchResults(data || []);
            setShowSearchResults(true);
          })
          .catch(() => {
            setSearchResults([]);
          });
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const handleOpponentSelect = (result: SearchResult) => {
    setSelectedOpponent(result);
    setForm((prev) => ({
      ...prev,
      opponentTeamId: result.type === "team" ? result.id : "",
      opponentName: result.name,
    }));
    setSearchQuery(result.name);
    setShowSearchResults(false);
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload logo");
      }

      const data = await res.json();
      setCreateClubForm((prev) => ({ ...prev, logoUrl: data.url }));
    } catch (err) {
      setError("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreateClub = async () => {
    if (!createClubForm.clubName) {
      setError("Club name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: createClubForm.clubName,
          logoUrl: createClubForm.logoUrl || null,
          teamName: createClubForm.teamName || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create club");
      }

      // If team was created, select it
      if (createClubForm.teamName) {
        // Refresh teams list
        const teamsRes = await fetch("/api/teams");
        const teamsData = await teamsRes.json();
        setTeams(teamsData || []);

        const newTeam = teamsData.find((t: Team) => t.name === createClubForm.teamName);
        if (newTeam) {
          handleOpponentSelect({
            id: newTeam.id,
            name: newTeam.name,
            type: "team",
            logoUrl: newTeam.logoUrl || newTeam.club?.logoUrl || null,
            club: newTeam.club || null,
          });
        }
      } else {
        // Just select the club
        handleOpponentSelect({
          id: data.id,
          name: data.name,
          type: "club",
          logoUrl: data.logoUrl || null,
        });
      }

      setShowCreateClub(false);
      setCreateClubForm({ clubName: "", teamName: "", logoUrl: "", logoFile: null });
      setMessage("Club created successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to create club");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!form.homeTeamId || !form.opponentTeamId || !form.date) {
      setError("Home team, opponent, and date are required");
      setLoading(false);
      return;
    }

    if (form.homeTeamId === form.opponentTeamId) {
      setError("Home team and opponent must be different");
      setLoading(false);
      return;
    }

    try {
      const opponentLogoUrl = selectedOpponent?.logoUrl || selectedOpponent?.club?.logoUrl || null;

      const res = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          homeTeamId: form.homeTeamId,
          awayTeamId: form.opponentTeamId,
          date: form.date,
          time: form.time || null,
          venue: form.location || null,
          venueName: form.venueName || null,
          formationType: form.matchFormat,
          matchType: form.matchType,
          opponentName: form.opponentName || null,
          opponentLogoUrl: opponentLogoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create game");
      }

      setMessage("Game registered successfully!");
      setTimeout(() => {
        router.push(`/dashboard/games/${data.id}/squad`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof GameForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const matchTypeOptions = [
    { value: "FRIENDLY", label: "Friendly" },
    { value: "LEAGUE", label: "League" },
    { value: "CUP", label: "Cup" },
    { value: "TOURNAMENT", label: "Tournament" },
  ];

  const matchFormatOptions = [
    { value: "ELEVEN_V_ELEVEN", label: "11v11" },
    { value: "NINE_V_NINE", label: "9v9" },
    { value: "SEVEN_V_SEVEN", label: "7v7" },
  ];

  const opponentLogoUrl = selectedOpponent?.logoUrl || selectedOpponent?.club?.logoUrl || null;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Register Game"
        description="Register a new game with opponent details and match information"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Game Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#111827] mb-1">Game Details</h2>
                <p className="text-sm text-[#6B7280]">Enter the essential match information</p>
              </div>

              <div className="space-y-5">
                {/* Home Team */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Home Team *
                  </label>
                  <select
                    value={form.homeTeamId}
                    onChange={(e) => {
                      updateForm("homeTeamId", e.target.value);
                      const team = teams.find((t) => t.id === e.target.value);
                      setHomeTeam(team || null);
                    }}
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                    required
                  >
                    <option value="">Select home team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Match Type */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Match Type *
                  </label>
                  <select
                    value={form.matchType}
                    onChange={(e) => updateForm("matchType", e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                    required
                  >
                    {matchTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#111827]">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => updateForm("date", e.target.value)}
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#111827]">
                      Time
                    </label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => updateForm("time", e.target.value)}
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => updateForm("location", e.target.value)}
                    placeholder="e.g., Main Field, Training Ground"
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                    required
                  />
                </div>

                {/* Venue Name */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Venue Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.venueName}
                    onChange={(e) => updateForm("venueName", e.target.value)}
                    placeholder="e.g., Community Sports Center"
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                  />
                </div>

                {/* Match Format */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Match Format *
                  </label>
                  <select
                    value={form.matchFormat}
                    onChange={(e) => updateForm("matchFormat", e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                    required
                  >
                    {matchFormatOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Opponent Selection */}
          <div className="lg:col-span-1">
            <Card>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#111827] mb-1">Opponent</h2>
                <p className="text-sm text-[#6B7280]">Search and select the opposing team</p>
              </div>

              <div className="space-y-5">
                {/* Opponent Search */}
                <div className="relative" ref={searchRef}>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Opponent Team *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!e.target.value) {
                          setSelectedOpponent(null);
                          setForm((prev) => ({ ...prev, opponentTeamId: "", opponentName: "" }));
                        }
                      }}
                      placeholder="Search by team or club name..."
                      className="w-full border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Search Results */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => handleOpponentSelect(result)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F9FAFB] transition-colors text-left border-b border-[#E5E7EB] last:border-b-0"
                        >
                          {result.logoUrl || result.club?.logoUrl ? (
                            <div className="relative w-8 h-8 flex-shrink-0">
                              <Image
                                src={result.logoUrl || result.club?.logoUrl || ""}
                                alt={result.name}
                                fill
                                className="object-contain rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-[#E5E7EB] rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-[#6B7280]">
                                {result.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#111827] truncate">
                              {result.name}
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              {result.type === "club" ? "Club" : "Team"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No Results + Create Option */}
                  {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4">
                      <p className="text-sm text-[#6B7280] mb-3">No teams or clubs found</p>
                      <Button
                        type="button"
                        onClick={() => {
                          setShowCreateClub(true);
                          setCreateClubForm((prev) => ({ ...prev, clubName: searchQuery }));
                        }}
                        className="w-full"
                      >
                        + Create Club & Team
                      </Button>
                    </div>
                  )}
                </div>

                {/* Opponent Logo Preview */}
                {selectedOpponent && (
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <div className="flex flex-col items-center justify-center p-6 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                      {opponentLogoUrl ? (
                        <div className="relative w-24 h-24 mb-4">
                          <Image
                            src={opponentLogoUrl}
                            alt={selectedOpponent.name}
                            fill
                            className="object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 mb-4 bg-gradient-to-br from-[#E5E7EB] to-[#D1D5DB] rounded-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-[#6B7280]">
                            {selectedOpponent.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <p className="text-sm font-semibold text-[#111827] text-center">
                        {selectedOpponent.name}
                      </p>
                      {!opponentLogoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateClub(true);
                            setCreateClubForm((prev) => ({ ...prev, clubName: selectedOpponent.name }));
                          }}
                          className="mt-3 text-xs text-[#1A73E8] hover:text-[#1557B0] font-medium"
                        >
                          + Add Logo
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Home Team Info */}
                {homeTeam && (
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <p className="text-xs font-medium text-[#6B7280] mb-2">Home Team</p>
                    <div className="flex items-center gap-3 p-3 bg-[#EBF4FF] rounded-lg border border-[#1A73E8]/20">
                      {homeTeam.logoUrl || homeTeam.club?.logoUrl ? (
                        <div className="relative w-10 h-10">
                          <Image
                            src={homeTeam.logoUrl || homeTeam.club?.logoUrl || ""}
                            alt={homeTeam.name}
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-[#1A73E8] rounded flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {homeTeam.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-[#111827]">
                        {homeTeam.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mt-6 p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
            <p className="text-[#991B1B] font-medium text-sm">{error}</p>
          </div>
        )}

        {message && (
          <div className="mt-6 p-4 bg-[#ECFDF5] border border-[#10B981] rounded-lg">
            <p className="text-[#065F46] font-medium text-sm">{message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !form.opponentTeamId}>
            {loading ? "Creating..." : "Create Game"}
          </Button>
        </div>
      </form>

      {/* Create Club Modal */}
      {showCreateClub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[#111827]">Create Club</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateClub(false);
                  setCreateClubForm({ clubName: "", teamName: "", logoUrl: "", logoFile: null });
                }}
                className="text-[#6B7280] hover:text-[#111827] text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-[#111827]">
                  Club Name *
                </label>
                <input
                  type="text"
                  value={createClubForm.clubName}
                  onChange={(e) =>
                    setCreateClubForm((prev) => ({ ...prev, clubName: e.target.value }))
                  }
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                  placeholder="Enter club name"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-[#111827]">
                  Team Name (Optional)
                </label>
                <input
                  type="text"
                  value={createClubForm.teamName}
                  onChange={(e) =>
                    setCreateClubForm((prev) => ({ ...prev, teamName: e.target.value }))
                  }
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                  placeholder="Create a team for this club"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-[#111827]">
                  Club Logo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCreateClubForm((prev) => ({ ...prev, logoFile: file }));
                      handleLogoUpload(file);
                    }
                  }}
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
                {createClubForm.logoUrl && (
                  <div className="mt-3 relative w-20 h-20">
                    <Image
                      src={createClubForm.logoUrl}
                      alt="Club logo"
                      fill
                      className="object-contain rounded-lg border border-[#E5E7EB]"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateClub(false);
                    setCreateClubForm({ clubName: "", teamName: "", logoUrl: "", logoFile: null });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateClub}
                  disabled={loading || uploadingLogo}
                  className="flex-1"
                >
                  {loading || uploadingLogo ? "Creating..." : "Create Club"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
