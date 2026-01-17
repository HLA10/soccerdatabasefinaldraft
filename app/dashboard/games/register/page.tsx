"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";

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
  opponentAgeGroup: string;
  matchType: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  venueName: string;
  matchFormat: string;
  isHomeMatch: boolean;
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
  const [activeTab, setActiveTab] = useState<"info" | "invitation">("info");
  const [activityType, setActivityType] = useState<"training" | "meeting" | "other" | "match">("match");

  const [form, setForm] = useState<GameForm>({
    homeTeamId: "",
    opponentTeamId: "",
    opponentName: "",
    opponentAgeGroup: "",
    matchType: "FRIENDLY",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    venueName: "",
    matchFormat: "ELEVEN_V_ELEVEN",
    isHomeMatch: true,
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
      if (data.url) {
        setCreateClubForm((prev) => ({ ...prev, logoUrl: data.url }));
      }
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

      if (createClubForm.teamName) {
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

  const handleSubmit = async (saveAndInvite: boolean = false) => {
    setError("");
    setMessage("");
    setLoading(true);

    if (!form.homeTeamId || !form.opponentName || !form.date) {
      setError("Home team, opponent, and date are required");
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
          homeTeamId: form.isHomeMatch ? form.homeTeamId : (form.opponentTeamId || form.homeTeamId),
          awayTeamId: form.isHomeMatch ? (form.opponentTeamId || form.homeTeamId) : form.homeTeamId,
          date: form.date,
          time: form.startTime ? `${form.startTime}:00` : null,
          venue: form.location || null,
          venueName: form.venueName || null,
          formationType: form.matchFormat,
          matchType: form.matchType,
          opponentName: form.opponentName || null,
          opponentAgeGroup: form.opponentAgeGroup || null,
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

  const updateForm = (field: keyof GameForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const homeTeamLogo = homeTeam?.logoUrl || homeTeam?.club?.logoUrl || null;
  const opponentLogo = selectedOpponent?.logoUrl || selectedOpponent?.club?.logoUrl || null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#E5E7EB] z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/dashboard/games" className="text-[#111827] hover:text-[#1A73E8] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-[#111827]">Register Game</h1>
          <div className="w-6"></div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E7EB] px-4">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "info"
                ? "text-[#111827]"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            Activity Info
            {activeTab === "info" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A73E8]"></div>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invitation")}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "invitation"
                ? "text-[#111827]"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            Invitation
            {activeTab === "invitation" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A73E8]"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {activeTab === "info" && (
          <>
            {/* Activity Type Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(["training", "meeting", "other", "match"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityType(type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activityType === type
                      ? "bg-[#1A73E8] text-white"
                      : "bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]"
                  }`}
                >
                  <span className="capitalize">
                    {type === "training" ? "Training" : type === "meeting" ? "Meeting" : type === "other" ? "Other" : "Match"}
                  </span>
                  {activityType === type && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {activityType === type && type === "match" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Match Type Selector */}
            {activityType === "match" && (
              <div className="flex bg-[#F9FAFB] rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => updateForm("isHomeMatch", true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all ${
                    form.isHomeMatch
                      ? "bg-[#1A73E8] text-white"
                      : "text-[#111827] hover:bg-white"
                  }`}
                >
                  <span>Home Match</span>
                  {form.isHomeMatch && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => updateForm("isHomeMatch", false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all ${
                    !form.isHomeMatch
                      ? "bg-[#1A73E8] text-white"
                      : "text-[#111827] hover:bg-white"
                  }`}
                >
                  <span>Away Match</span>
                  {!form.isHomeMatch && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Activity Info Section */}
            <div>
              <h2 className="text-base font-semibold text-[#111827] mb-4">Activity Info</h2>

              {/* Info Box */}
              <div className="mb-6 p-4 bg-[#EBF4FF] rounded-lg border border-[#1A73E8]/20">
                <p className="text-sm text-[#111827]">
                  Want to import a series? Log in to sportadmin.se and go to Matches.
                </p>
              </div>

              {/* My Team */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-[#111827]">My Team</label>
                <div className="relative w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-[#111827] flex-1">
                    {homeTeam?.name || "Select team"}
                  </span>
                  {homeTeamLogo && (
                    <div className="relative w-8 h-8 flex-shrink-0 ml-3">
                      <Image
                        src={homeTeamLogo}
                        alt={homeTeam?.name || "Team logo"}
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Opponent */}
              <div className="mb-4 relative" ref={searchRef}>
                <label className="block mb-2 text-sm font-medium text-[#111827]">Opponent</label>
                <div className="relative w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-center justify-between">
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
                    placeholder="Search opponent..."
                    className="flex-1 text-sm text-[#111827] bg-transparent border-none outline-none placeholder-[#9CA3AF]"
                  />
                  {opponentLogo && (
                    <div className="relative w-8 h-8 flex-shrink-0 ml-3">
                      <Image
                        src={opponentLogo}
                        alt={selectedOpponent?.name || "Opponent logo"}
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                  )}
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

              {/* Age Group */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-[#111827]">Age Group</label>
                <input
                  type="text"
                  value={form.opponentAgeGroup}
                  onChange={(e) => updateForm("opponentAgeGroup", e.target.value)}
                  placeholder="e.g., U10, U15 (optional)"
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
                />
              </div>

              {/* Location */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-[#111827]">Location</label>
                <div className="relative w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-center justify-between">
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => updateForm("location", e.target.value)}
                    placeholder="Enter location..."
                    className="flex-1 text-sm text-[#111827] bg-transparent border-none outline-none placeholder-[#9CA3AF]"
                  />
                  <svg className="w-5 h-5 text-[#6B7280] flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Display Name */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-[#111827]">Display Name</label>
                <input
                  type="text"
                  value={form.venueName}
                  onChange={(e) => updateForm("venueName", e.target.value)}
                  placeholder="Enter display name..."
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
                />
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-[#111827]">Date</label>
                <div className="relative w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-center justify-between">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateForm("date", e.target.value)}
                    className="flex-1 text-sm text-[#111827] bg-transparent border-none outline-none"
                  />
                  <svg className="w-5 h-5 text-[#6B7280] flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Start and End Time */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">Start</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => updateForm("startTime", e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">End</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => updateForm("endTime", e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "invitation" && (
          <div className="py-8 text-center">
            <p className="text-sm text-[#6B7280]">Invitation feature coming soon</p>
          </div>
        )}

        {/* Error and Success Messages */}
        {error && (
          <div className="p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
            <p className="text-[#991B1B] font-medium text-sm">{error}</p>
          </div>
        )}

        {message && (
          <div className="p-4 bg-[#ECFDF5] border border-[#10B981] rounded-lg">
            <p className="text-[#065F46] font-medium text-sm">{message}</p>
          </div>
        )}

        {/* Action Buttons */}
        {activeTab === "info" && (
          <div className="space-y-3 pb-6">
            <Button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="w-full bg-[#1A73E8] text-white hover:bg-[#1557B0]"
            >
              Save & Invite
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="w-full bg-[#10B981] text-white hover:bg-[#059669]"
            >
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Create Club Modal */}
      {showCreateClub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
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
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCreateClubForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                      handleLogoUpload(file);
                    }
                  }}
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
                {(createClubForm.logoUrl || uploadingLogo) && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative w-20 h-20 rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] flex items-center justify-center">
                      {uploadingLogo ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#1A73E8] border-t-transparent"></div>
                      ) : createClubForm.logoUrl ? (
                        <Image
                          src={createClubForm.logoUrl}
                          alt="Club logo preview"
                          fill
                          className="object-contain p-1"
                        />
                      ) : null}
                    </div>
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
          </div>
        </div>
      )}
    </div>
  );
}
