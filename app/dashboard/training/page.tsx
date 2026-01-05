"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";

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
}

export default function TrainingPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/training-sessions")
      .then((res) => res.json())
      .then((data) => {
        setSessions(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

      {sessions.length === 0 ? (
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
        <div className="space-y-4">
          {sessions.map((session) => {
            const totalDuration = session.parts.reduce(
              (sum, p) => sum + p.duration,
              0
            );
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
                        <span>{totalDuration} min</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

