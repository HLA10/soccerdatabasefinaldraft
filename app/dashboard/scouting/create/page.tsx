"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";

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

interface ScoutingForm {
  playerName: string;
  clubId: string;
  teamId: string;
  ageGroup: string;
  notes: string;
  dateObserved: string;
}

export default function CreateScoutingReportPage() {
  const router = useRouter();
  const [form, setForm] = useState<ScoutingForm>({
    playerName: "",
    clubId: "",
    teamId: "",
    ageGroup: "",
    notes: "",
    dateObserved: new Date().toISOString().split("T")[0],
  });
  const [selectedClubOrTeam, setSelectedClubOrTeam] = useState<SearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (result: SearchResult) => {
    setSelectedClubOrTeam(result);
    if (result.type === "club") {
      setForm((prev) => ({ ...prev, clubId: result.id, teamId: "" }));
    } else {
      setForm((prev) => ({ ...prev, teamId: result.id, clubId: result.club?.id || "" }));
    }
    setSearchQuery(result.name);
    setShowSearchResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!form.playerName || !form.notes || !form.dateObserved) {
      setError("Player name, notes, and date observed are required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/scouting-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName: form.playerName,
          clubId: form.clubId || null,
          teamId: form.teamId || null,
          ageGroup: form.ageGroup || null,
          notes: form.notes,
          dateObserved: form.dateObserved,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create scouting report");
      }

      setMessage("Scouting report created successfully!");
      setTimeout(() => {
        router.push(`/dashboard/scouting/${data.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = selectedClubOrTeam?.logoUrl || selectedClubOrTeam?.club?.logoUrl || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Scouting Report"
        description="Record observations about a player"
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-5">
            {/* Player Name */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Player Name *
              </label>
              <input
                type="text"
                value={form.playerName}
                onChange={(e) => setForm((prev) => ({ ...prev, playerName: e.target.value }))}
                placeholder="Enter player name"
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
                required
              />
            </div>

            {/* Club/Team Selection */}
            <div className="relative" ref={searchRef}>
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Club/Team
              </label>
              <div className="relative w-full bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-center justify-between">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) {
                      setSelectedClubOrTeam(null);
                      setForm((prev) => ({ ...prev, clubId: "", teamId: "" }));
                    }
                  }}
                  placeholder="Search for club or team..."
                  className="flex-1 text-sm text-[#111827] bg-transparent border-none outline-none placeholder-[#9CA3AF]"
                />
                {logoUrl && (
                  <div className="relative w-8 h-8 flex-shrink-0 ml-3">
                    <Image
                      src={logoUrl}
                      alt={selectedClubOrTeam?.name || "Logo"}
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
                      onClick={() => handleSelect(result)}
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

              {/* Selected Club/Team Display */}
              {selectedClubOrTeam && (
                <div className="mt-2 flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-lg border border-[#1A73E8]">
                  {logoUrl ? (
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <Image
                        src={logoUrl}
                        alt={selectedClubOrTeam.name}
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#EBF4FF] flex items-center justify-center text-[#1A73E8] font-semibold text-sm flex-shrink-0">
                      {selectedClubOrTeam.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[#111827]">{selectedClubOrTeam.name}</p>
                    <p className="text-sm text-[#6B7280]">
                      {selectedClubOrTeam.type === "club" ? "Club" : "Team"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Age Group */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Age Group
              </label>
              <input
                type="text"
                value={form.ageGroup}
                onChange={(e) => setForm((prev) => ({ ...prev, ageGroup: e.target.value }))}
                placeholder="e.g., U10, U15 (optional)"
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
              />
            </div>

            {/* Date Observed */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Date Observed *
              </label>
              <input
                type="date"
                value={form.dateObserved}
                onChange={(e) => setForm((prev) => ({ ...prev, dateObserved: e.target.value }))}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Notes *
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter your observations about the player..."
                rows={6}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent resize-none"
                required
              />
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
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Report"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
