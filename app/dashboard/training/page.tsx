"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { TrashIcon } from "@heroicons/react/24/outline";

interface TrainingSession {
  id: string;
  name: string;
  date: string;
  location?: string | null;
  team: {
    id: string;
    name: string;
  };
  parts: Array<{
    duration: number;
  }>;
  recurringScheduleId?: string | null;
  recurringSchedule?: {
    id: string;
    name: string;
  } | null;
}

interface GroupedSessions {
  [key: string]: {
    schedule: TrainingSession["recurringSchedule"];
    sessions: TrainingSession[];
  };
}

export default function TrainingPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"all" | "groups">("all");
  const itemsPerPage = 5;

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/training-sessions");
      const data = await res.json();
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this training session? This action cannot be undone.")) {
      return;
    }

    setDeleting((prev) => new Set(prev).add(sessionId));
    try {
      const res = await fetch(`/api/training-sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete training session");
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error: any) {
      alert(error.message || "Failed to delete training session");
    } finally {
      setDeleting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  };

  const handleDeleteGroup = async (recurringScheduleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const group = groupedSessions[recurringScheduleId];
    const count = group.sessions.length;

    if (!confirm(`Are you sure you want to delete this training group (${count} sessions)? This action cannot be undone.`)) {
      return;
    }

    setDeleting((prev) => new Set(prev).add(recurringScheduleId));
    try {
      const res = await fetch("/api/training-sessions/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurringScheduleId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete training group");
      }

      setSessions((prev) => prev.filter((s) => s.recurringScheduleId !== recurringScheduleId));
    } catch (error: any) {
      alert(error.message || "Failed to delete training group");
    } finally {
      setDeleting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recurringScheduleId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Group sessions by recurring schedule
  const groupedSessions: GroupedSessions = {};
  sessions.forEach((session) => {
    if (session.recurringScheduleId && session.recurringSchedule) {
      const key = session.recurringScheduleId;
      if (!groupedSessions[key]) {
        groupedSessions[key] = {
          schedule: session.recurringSchedule,
          sessions: [],
        };
      }
      groupedSessions[key].sessions.push(session);
    }
  });

  // Prepare data for display
  const displayItems = viewMode === "groups" 
    ? Object.entries(groupedSessions).map(([id, group]) => ({
        type: "group" as const,
        id,
        name: group.schedule?.name || "Recurring Training",
        sessions: group.sessions,
        firstDate: group.sessions[0]?.date || "",
        count: group.sessions.length,
      }))
    : sessions.map((s) => ({
        type: "session" as const,
        id: s.id,
        name: s.name,
        date: s.date,
        team: s.team,
        location: s.location,
        duration: s.parts.reduce((sum, p) => sum + p.duration, 0),
      }));

  // Pagination calculations
  const totalPages = Math.ceil(displayItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = displayItems.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="max-w-7xl">
        <PageHeader
          title="Training Sessions"
          description="Manage training sessions and schedules"
        />
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Training Sessions"
        description="Manage training sessions and schedules"
        action={
          <Link href="/dashboard/training/create">
            <Button>Create Session</Button>
          </Link>
        }
      />

      {/* View Mode Toggle */}
      {sessions.length > 0 && (
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#F9FAFB] p-1 rounded-lg border border-[#E5E7EB]">
            <button
              onClick={() => {
                setViewMode("all");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === "all"
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => {
                setViewMode("groups");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === "groups"
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Groups ({Object.keys(groupedSessions).length})
            </button>
          </div>
        </div>
      )}

      {displayItems.length === 0 ? (
        <Card className="text-center py-12 px-6">
          <h3 className="text-lg font-semibold mb-2 text-[#111827]">
            No training sessions yet
          </h3>
          <p className="text-sm text-[#6B7280] mb-6">
            Create your first training session to get started
          </p>
          <Link href="/dashboard/training/create">
            <Button>Create Training Session</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {currentItems.map((item) => {
              if (item.type === "group") {
                return (
                  <Card key={item.id} hover className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-[#111827]">
                            {item.name}
                          </h3>
                          <span className="px-2 py-1 bg-[#EBF4FF] text-[#1A73E8] text-xs font-medium rounded">
                            {item.count} sessions
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                          <span>Starts: {formatDate(item.firstDate)}</span>
                          <span>•</span>
                          <span>Recurring schedule</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteGroup(item.id, e)}
                        disabled={deleting.has(item.id)}
                        className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors disabled:opacity-50"
                        title="Delete group"
                      >
                        {deleting.has(item.id) ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#EF4444] border-t-transparent"></div>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </Card>
                );
              }

              const session = item as Extract<typeof item, { type: "session" }>;
              return (
                <Link key={session.id} href={`/dashboard/training/${session.id}`}>
                  <Card hover className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-[#111827] mb-1">
                          {session.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                          <span>{session.team.name}</span>
                          <span>•</span>
                          <span>{formatDate(session.date)}</span>
                          {session.location && (
                            <>
                              <span>•</span>
                              <span>{session.location}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{session.duration} min</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        disabled={deleting.has(session.id)}
                        className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors disabled:opacity-50"
                        title="Delete session"
                      >
                        {deleting.has(session.id) ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#EF4444] border-t-transparent"></div>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#E5E7EB]">
              <p className="text-sm text-[#6B7280]">
                Showing {startIndex + 1}-{Math.min(endIndex, displayItems.length)} of {displayItems.length} {viewMode === "groups" ? "groups" : "sessions"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="text-sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-[#111827] font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
