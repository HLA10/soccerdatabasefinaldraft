"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface Match {
  id: string;
  date: string;
  opponent: string;
  opponentName?: string | null;
  opponentLogoUrl?: string | null;
  team: {
    id: string;
    name: string;
    logoUrl?: string | null;
    club?: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } | null;
  };
  homeTeam?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    club?: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } | null;
  } | null;
  awayTeam?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    club?: {
      id: string;
      name: string;
      logoUrl?: string | null;
    } | null;
  } | null;
  stats: any[];
}

interface TrainingSession {
  id: string;
  name: string;
  date: string;
  location?: string | null;
  team: {
    id: string;
    name: string;
  };
}

interface CalendarEvent {
  id: string;
  type: "game" | "training" | "appointment";
  date: string;
  title: string;
  link: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
}

interface Team {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  daysOfWeek: number[];
  playerIds: string[];
  parts: Array<{
    id: string;
    name: string;
    category: string;
    duration: number;
    notes?: string | null;
  }>;
}

interface SessionPart {
  name: string;
  category: string;
  duration: number;
  notes: string;
}

const CATEGORIES = [
  "WARM_UP",
  "TECHNICAL",
  "TACTICAL",
  "PHYSICAL",
  "COOL_DOWN",
  "GAME",
  "OTHER",
];

const CATEGORY_LABELS: Record<string, string> = {
  WARM_UP: "Warm Up",
  TECHNICAL: "Technical",
  TACTICAL: "Tactical",
  PHYSICAL: "Physical",
  COOL_DOWN: "Cool Down",
  GAME: "Game",
  OTHER: "Other",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarPageContent() {
  const searchParams = useSearchParams();
  const [matches, setMatches] = useState<Match[]>([]);
  const [games, setGames] = useState<Match[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventType, setEventType] = useState<"match" | "training" | "appointment">("match");
  
  // Match form state
  const [eventForm, setEventForm] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
    opponent: "",
    teamId: "",
  });

  // Training form state
  const [teams, setTeams] = useState<Team[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [trainingForm, setTrainingForm] = useState({
    teamId: "",
    name: "",
    date: "",
    time: "",
    location: "",
    templateId: "",
    isRecurring: false,
    daysOfWeek: [] as number[],
    startDate: "",
    endDate: "",
    parts: [] as SessionPart[],
  });
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch matches (legacy)
    fetch("/api/matches")
      .then((res) => res.json())
      .then((data) => {
        setMatches(data || []);
      })
      .catch(() => {});

    // Fetch games
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        setGames(data || []);
      })
      .catch(() => {});

    // Fetch training sessions
    fetch("/api/training-sessions")
      .then((res) => res.json())
      .then((data) => {
        setTrainingSessions(data || []);
      })
      .catch(() => {});

    // Fetch teams and templates
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data || []))
      .catch(() => {});

    fetch("/api/training-templates")
      .then((res) => res.json())
      .then((data) => setTemplates(data || []))
      .catch(() => {});

    setLoading(false);
  }, []);

  // Check URL params to auto-open modal with event type
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "match" || type === "training" || type === "appointment") {
      setEventType(type);
      setShowEventModal(true);
      // Clear URL param by replacing state without the param
      if (window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("type");
        window.history.replaceState({}, "", url.toString());
      }
    } else if (searchParams.get("open") === "true") {
      setShowEventModal(true);
      // Clear URL param
      if (window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("open");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (trainingForm.templateId) {
      const template = templates.find((t) => t.id === trainingForm.templateId);
      if (template) {
        setTrainingForm((prev) => ({
          ...prev,
          name: template.name,
          daysOfWeek: template.daysOfWeek || [],
          parts: template.parts.map((p) => ({
            name: p.name,
            category: p.category,
            duration: p.duration,
            notes: p.notes || "",
          })),
        }));
      }
    }
  }, [trainingForm.templateId, templates]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split("T")[0];
    const eventsList: CalendarEvent[] = [];

    // Add games (green)
    games.forEach((game) => {
      if (game.date.startsWith(dateStr)) {
        const homeTeamName = game.homeTeam?.name || game.team?.name || "Home";
        const awayTeamName = game.awayTeam?.name || game.opponentName || game.opponent || "Away";
        const homeLogo = game.homeTeam?.club?.logoUrl || game.homeTeam?.logoUrl || game.team?.club?.logoUrl || game.team?.logoUrl || null;
        const awayLogo = game.awayTeam?.club?.logoUrl || game.awayTeam?.logoUrl || game.opponentLogoUrl || null;
        eventsList.push({
          id: game.id,
          type: "game",
          date: game.date,
          title: `${homeTeamName} vs ${awayTeamName}`,
          link: `/dashboard/games/${game.id}/squad`,
          homeLogo,
          awayLogo,
        });
      }
    });

    // Add training sessions (orange)
    trainingSessions.forEach((session) => {
      if (session.date.startsWith(dateStr)) {
        eventsList.push({
          id: session.id,
          type: "training",
          date: session.date,
          title: session.name,
          link: `/dashboard/training/${session.id}`,
        });
      }
    });

    // Add legacy matches as games (green)
    matches.forEach((match) => {
      if (match.date.startsWith(dateStr)) {
        const homeLogo = match.homeTeam?.club?.logoUrl || match.homeTeam?.logoUrl || match.team?.club?.logoUrl || match.team?.logoUrl || null;
        const awayLogo = match.awayTeam?.club?.logoUrl || match.awayTeam?.logoUrl || match.opponentLogoUrl || null;
        eventsList.push({
          id: match.id,
          type: "game",
          date: match.date,
          title: `${match.team.name} vs ${match.opponent}`,
          link: `/dashboard/games/${match.id}/squad`,
          homeLogo,
          awayLogo,
        });
      }
    });

    return eventsList;
  };

  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleTemplateUpload = async () => {
    if (!templateFile) {
      setError("Please select a file");
      return;
    }

    setUploadingTemplate(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", templateFile);
      formData.append("daysOfWeek", JSON.stringify(trainingForm.daysOfWeek));

      const res = await fetch("/api/training-templates/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload template");
      }

      // Add new template to list and select it
      setTemplates([...templates, data]);
      setTrainingForm((prev) => ({
        ...prev,
        templateId: data.id,
        name: data.name,
        parts: data.parts.map((p: any) => ({
          name: p.name,
          category: p.category,
          duration: p.duration,
          notes: p.notes || "",
        })),
      }));
      setTemplateFile(null);
      setMessage("Template uploaded successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to upload template");
    } finally {
      setUploadingTemplate(false);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setTrainingForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const addPart = () => {
    setTrainingForm((prev) => ({
      ...prev,
      parts: [
        ...prev.parts,
        { name: "", category: "TECHNICAL", duration: 15, notes: "" },
      ],
    }));
  };

  const removePart = (index: number) => {
    setTrainingForm((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }));
  };

  const updatePart = (index: number, field: string, value: any) => {
    setTrainingForm((prev) => {
      const newParts = [...prev.parts];
      newParts[index] = { ...newParts[index], [field]: value };
      return { ...prev, parts: newParts };
    });
  };

  const calculateSessionCount = () => {
    if (!trainingForm.isRecurring || !trainingForm.startDate) return 0;
    if (trainingForm.daysOfWeek.length === 0) return 0;

    const start = new Date(trainingForm.startDate);
    const end = trainingForm.endDate
      ? new Date(trainingForm.endDate)
      : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

    let count = 0;
    const current = new Date(start);
    while (current <= end && count < 500) {
      if (trainingForm.daysOfWeek.includes(current.getDay())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const resetTrainingForm = () => {
    setTrainingForm({
      teamId: "",
      name: "",
      date: "",
      time: "",
      location: "",
      templateId: "",
      isRecurring: false,
      daysOfWeek: [],
      startDate: "",
      endDate: "",
      parts: [{ name: "", category: "WARM_UP", duration: 10, notes: "" }],
    });
    setTemplateFile(null);
    setError("");
    setMessage("");
  };

  const handleCreateTraining = async (saveAndContinue: boolean) => {
    setError("");
    setMessage("");
    setSaving(true);

    if (!trainingForm.teamId || !trainingForm.name) {
      setError("Team and session name are required");
      setSaving(false);
      return;
    }

    if (trainingForm.parts.length === 0 || trainingForm.parts.some((p) => !p.name || !p.duration)) {
      setError("Please add at least one part with name and duration");
      setSaving(false);
      return;
    }

    if (trainingForm.isRecurring) {
      if (!trainingForm.startDate || trainingForm.daysOfWeek.length === 0) {
        setError("Start date and at least one day are required for recurring sessions");
        setSaving(false);
        return;
      }

      try {
        const res = await fetch("/api/training-sessions/recurring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: trainingForm.teamId,
            name: trainingForm.name,
            daysOfWeek: trainingForm.daysOfWeek,
            startDate: trainingForm.startDate,
            endDate: trainingForm.endDate || null,
            time: trainingForm.time || null,
            location: trainingForm.location || null,
            templateId: trainingForm.templateId || null,
            parts: trainingForm.parts,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create recurring sessions");
        }

        setMessage(`Successfully created ${data.count} training sessions!`);
        
        if (saveAndContinue) {
          resetTrainingForm();
        } else {
          setTimeout(() => {
            setShowEventModal(false);
            resetTrainingForm();
            // Refresh calendar
            window.location.reload();
          }, 1500);
        }
      } catch (err: any) {
        setError(err.message || "Failed to create sessions");
      } finally {
        setSaving(false);
      }
    } else {
      if (!trainingForm.date) {
        setError("Date is required");
        setSaving(false);
        return;
      }

      try {
        const res = await fetch("/api/training-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: trainingForm.teamId,
            name: trainingForm.name,
            date: trainingForm.date,
            time: trainingForm.time || null,
            location: trainingForm.location || null,
            templateId: trainingForm.templateId || null,
            parts: trainingForm.parts,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create training session");
        }

        setMessage("Training session created successfully!");
        
        if (saveAndContinue) {
          resetTrainingForm();
        } else {
          setTimeout(() => {
            setShowEventModal(false);
            resetTrainingForm();
            window.location.reload();
          }, 1500);
        }
      } catch (err: any) {
        setError(err.message || "Failed to create session");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCreateEvent = async () => {
    if (eventType === "training") {
      await handleCreateTraining(false);
      return;
    }

    const dateTime = eventForm.date && eventForm.time
      ? new Date(`${eventForm.date}T${eventForm.time}`).toISOString()
      : eventForm.date
      ? new Date(`${eventForm.date}T12:00:00`).toISOString()
      : null;

    if (!dateTime) {
      setError("Please select a date");
      return;
    }

    if (eventType === "match") {
      if (!eventForm.opponent || !eventForm.teamId) {
        setError("Please fill in opponent and team ID for matches");
        return;
      }

      try {
        const res = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: dateTime,
            opponent: eventForm.opponent,
            teamId: eventForm.teamId,
          }),
        });

        if (res.ok) {
          const newMatch = await res.json();
          setMatches([...matches, newMatch]);
          setShowEventModal(false);
          setEventForm({
            title: "",
            date: "",
            time: "",
            description: "",
            opponent: "",
            teamId: "",
          });
        } else {
          const error = await res.json();
          setError(error.error || "Failed to create match");
        }
      } catch (error) {
        setError("Error creating match");
      }
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1 text-[#111827]">Calendar</h1>
          <p className="text-sm text-[#6B7280]">View and manage events, matches, and training sessions</p>
        </div>
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading calendar...</p>
        </Card>
      </div>
    );
  }

  const selectedTemplate = templates.find((t) => t.id === trainingForm.templateId);
  const totalDuration = trainingForm.parts.reduce((sum, p) => sum + (p.duration || 0), 0);
  const sessionCount = calculateSessionCount();

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1 text-[#111827]">Calendar</h1>
          <p className="text-sm text-[#6B7280]">View and manage events, matches, and training sessions</p>
        </div>
        <Button onClick={() => setShowEventModal(true)}>Create Event</Button>
      </div>

      {/* Calendar Navigation */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="secondary" onClick={previousMonth}>
            Previous
          </Button>
          <h2 className="text-xl font-semibold text-[#111827]">
            {monthNames[month]} {year}
          </h2>
          <Button variant="secondary" onClick={nextMonth}>
            Next
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-[#6B7280] py-2">
              {day}
            </div>
          ))}

          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={date.getTime()}
                className={`aspect-square border rounded-lg p-2 ${
                  isToday ? "bg-[#EBF4FF] border-[#1A73E8]" : "border-[#E5E7EB]"
                } hover:border-[#1A73E8] transition-colors`}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? "text-[#1A73E8]" : "text-[#111827]"}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => {
                    const getEventColor = (type: string) => {
                      switch (type) {
                        case "game":
                          return "bg-[#10B981] text-white"; // Green
                        case "training":
                          return "bg-[#F97316] text-white"; // Orange
                        case "appointment":
                          return "bg-[#8B5CF6] text-white"; // Purple
                        default:
                          return "bg-[#1A73E8] text-white";
                      }
                    };

                    return (
                      <Link
                        key={event.id}
                        href={event.link}
                        className={`text-xs ${getEventColor(event.type)} px-1.5 py-0.5 rounded truncate block hover:opacity-90 transition-opacity flex items-center gap-1`}
                        title={event.title}
                      >
                        {event.type === "game" && event.awayLogo && (
                          <span className="w-3 h-3 flex-shrink-0 relative">
                            <Image
                              src={event.awayLogo}
                              alt=""
                              fill
                              className="object-contain rounded"
                            />
                          </span>
                        )}
                        <span className="truncate">{event.title}</span>
                      </Link>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-[#6B7280]">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upcoming Events List */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 text-[#111827]">Upcoming Events</h2>
        {(() => {
          // Combine all events
          const allEvents: CalendarEvent[] = [];
          
          games.forEach((game) => {
            const homeTeamName = game.homeTeam?.name || game.team?.name || "Home";
            const awayTeamName = game.awayTeam?.name || game.opponentName || game.opponent || "Away";
            const homeLogo = game.homeTeam?.club?.logoUrl || game.homeTeam?.logoUrl || game.team?.club?.logoUrl || game.team?.logoUrl || null;
            const awayLogo = game.awayTeam?.club?.logoUrl || game.awayTeam?.logoUrl || game.opponentLogoUrl || null;
            allEvents.push({
              id: game.id,
              type: "game",
              date: game.date,
              title: `${homeTeamName} vs ${awayTeamName}`,
              link: `/dashboard/games/${game.id}/squad`,
              homeLogo,
              awayLogo,
            });
          });

          trainingSessions.forEach((session) => {
            allEvents.push({
              id: session.id,
              type: "training",
              date: session.date,
              title: session.name,
              link: `/dashboard/training/${session.id}`,
            });
          });

          matches.forEach((match) => {
            const homeLogo = match.homeTeam?.club?.logoUrl || match.homeTeam?.logoUrl || match.team?.club?.logoUrl || match.team?.logoUrl || null;
            const awayLogo = match.awayTeam?.club?.logoUrl || match.awayTeam?.logoUrl || match.opponentLogoUrl || null;
            allEvents.push({
              id: match.id,
              type: "game",
              date: match.date,
              title: `${match.team.name} vs ${match.opponent}`,
              link: `/dashboard/games/${match.id}/squad`,
              homeLogo,
              awayLogo,
            });
          });

          const upcomingEvents = allEvents
            .filter((event) => new Date(event.date) >= new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 10);

          if (upcomingEvents.length === 0) {
            return <p className="text-[#6B7280] text-center py-8">No upcoming events</p>;
          }

          const getEventColor = (type: string) => {
            switch (type) {
              case "game":
                return "bg-[#10B981] text-white border-[#10B981]";
              case "training":
                return "bg-[#F97316] text-white border-[#F97316]";
              case "appointment":
                return "bg-[#8B5CF6] text-white border-[#8B5CF6]";
              default:
                return "bg-[#1A73E8] text-white border-[#1A73E8]";
            }
          };

          return (
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.date);
                return (
                  <Link
                    key={event.id}
                    href={event.link}
                    className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:border-[#1A73E8] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center">
                        <div className={`text-2xl font-bold ${event.type === "game" ? "text-[#10B981]" : event.type === "training" ? "text-[#F97316]" : "text-[#8B5CF6]"}`}>
                          {eventDate.getDate()}
                        </div>
                        <div className="text-xs text-[#6B7280]">
                          {eventDate.toLocaleDateString("en-US", { month: "short" })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {event.type === "game" && event.awayLogo && (
                          <div className="relative w-8 h-8 flex-shrink-0">
                            <Image
                              src={event.awayLogo}
                              alt=""
                              fill
                              className="object-contain rounded"
                            />
                          </div>
                        )}
                        <div className={`w-2 h-2 rounded-full ${event.type === "game" ? "bg-[#10B981]" : event.type === "training" ? "bg-[#F97316]" : "bg-[#8B5CF6]"}`}></div>
                        <div>
                          <p className="font-semibold text-[#111827]">
                            {event.title}
                          </p>
                          <p className="text-sm text-[#6B7280]">
                            {eventDate.toLocaleDateString("en-US", {
                              weekday: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventColor(event.type)}`}>
                      {event.type === "game" ? "Game" : event.type === "training" ? "Training" : "Event"}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })()}
      </Card>

      {/* Event Creation Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#111827]">Create Event</h2>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  resetTrainingForm();
                  setEventForm({
                    title: "",
                    date: "",
                    time: "",
                    description: "",
                    opponent: "",
                    teamId: "",
                  });
                }}
                className="text-[#6B7280] hover:text-[#111827] text-2xl"
              >
                ×
              </button>
            </div>

            {/* Event Type Selection */}
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Event Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["match", "training", "appointment"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setEventType(type);
                      if (type === "training") {
                        setTrainingForm((prev) => ({
                          ...prev,
                          parts: prev.parts.length === 0
                            ? [{ name: "", category: "WARM_UP", duration: 10, notes: "" }]
                            : prev.parts,
                        }));
                      }
                    }}
                    className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                      eventType === type
                        ? "bg-[#1A73E8] text-white"
                        : "bg-[#F9FAFB] text-[#111827] hover:bg-[#F3F4F6] border border-[#E5E7EB]"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
                <p className="text-[#991B1B] font-medium text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className="mb-4 p-4 bg-[#ECFDF5] border border-[#10B981] rounded-lg">
                <p className="text-[#065F46] font-medium text-sm">{message}</p>
              </div>
            )}

            {/* Match Form */}
            {eventType === "match" && (
              <>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Team
                  </label>
                  <select
                    value={eventForm.teamId}
                    onChange={(e) => setEventForm({ ...eventForm, teamId: e.target.value })}
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                  >
                    <option value="">Select team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Opponent
                  </label>
                  <input
                    type="text"
                    value={eventForm.opponent}
                    onChange={(e) => setEventForm({ ...eventForm, opponent: e.target.value })}
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    placeholder="Opponent team name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#111827]">
                      Date
                    </label>
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#111827]">
                      Time
                    </label>
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleCreateEvent} className="flex-1">
                    Create Match
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowEventModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}

            {/* Training Form */}
            {eventType === "training" && (
              <div className="space-y-6">
                {/* Session Details */}
                <div>
                  <h3 className="text-sm font-semibold text-[#111827] mb-4">Session Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-[#111827]">
                        Team *
                      </label>
                      <select
                        value={trainingForm.teamId}
                        onChange={(e) =>
                          setTrainingForm({ ...trainingForm, teamId: e.target.value })
                        }
                        className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                        required
                      >
                        <option value="">Select team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-[#111827]">
                        Session Name *
                      </label>
                      <input
                        type="text"
                        value={trainingForm.name}
                        onChange={(e) =>
                          setTrainingForm({ ...trainingForm, name: e.target.value })
                        }
                        className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                        placeholder="e.g., Passing & Possession"
                        required
                      />
                    </div>

                    {!trainingForm.isRecurring && (
                      <div>
                        <label className="block mb-2 text-sm font-medium text-[#111827]">
                          Date *
                        </label>
                        <input
                          type="date"
                          value={trainingForm.date}
                          onChange={(e) =>
                            setTrainingForm({ ...trainingForm, date: e.target.value })
                          }
                          className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                          required={!trainingForm.isRecurring}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-[#111827]">
                          Time
                        </label>
                        <input
                          type="time"
                          value={trainingForm.time}
                          onChange={(e) =>
                            setTrainingForm({ ...trainingForm, time: e.target.value })
                          }
                          className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-[#111827]">
                          Location
                        </label>
                        <input
                          type="text"
                          value={trainingForm.location}
                          onChange={(e) =>
                            setTrainingForm({ ...trainingForm, location: e.target.value })
                          }
                          className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                          placeholder="Training field"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recurring Options */}
                <div className="border-t border-[#E5E7EB] pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#111827] mb-1">
                        Make this recurring
                      </h3>
                      <p className="text-xs text-[#6B7280]">
                        Create sessions on specific days of the week
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setTrainingForm({
                          ...trainingForm,
                          isRecurring: !trainingForm.isRecurring,
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        trainingForm.isRecurring ? "bg-[#1A73E8]" : "bg-[#D1D5DB]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          trainingForm.isRecurring ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {trainingForm.isRecurring && (
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-[#111827]">
                          Days of Week *
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {DAY_NAMES.map((day, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => toggleDayOfWeek(index)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                trainingForm.daysOfWeek.includes(index)
                                  ? "bg-[#1A73E8] text-white"
                                  : "bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] hover:bg-[#F3F4F6]"
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-[#111827]">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={trainingForm.startDate}
                            onChange={(e) =>
                              setTrainingForm({
                                ...trainingForm,
                                startDate: e.target.value,
                              })
                            }
                            className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                            required={trainingForm.isRecurring}
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-[#111827]">
                            End Date (Optional)
                          </label>
                          <input
                            type="date"
                            value={trainingForm.endDate}
                            onChange={(e) =>
                              setTrainingForm({
                                ...trainingForm,
                                endDate: e.target.value,
                              })
                            }
                            className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                            min={trainingForm.startDate}
                          />
                        </div>
                      </div>

                      {sessionCount > 0 && (
                        <div className="p-3 bg-[#EBF4FF] border border-[#1A73E8] rounded-lg">
                          <p className="text-sm font-medium text-[#1A73E8]">
                            Will create {sessionCount} session{sessionCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Template Selection */}
                <div className="border-t border-[#E5E7EB] pt-6">
                  <h3 className="text-sm font-semibold text-[#111827] mb-4">Template</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-[#111827]">
                        Use Template
                      </label>
                      <select
                        value={trainingForm.templateId}
                        onChange={(e) => {
                          setTrainingForm({
                            ...trainingForm,
                            templateId: e.target.value,
                          });
                          setTemplateFile(null);
                        }}
                        className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                      >
                        <option value="">No template</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                        <option value="__upload__">Upload Template (PDF/CSV)</option>
                      </select>
                    </div>

                    {trainingForm.templateId === "__upload__" && (
                      <div className="p-4 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
                        <label className="block mb-2 text-sm font-medium text-[#111827]">
                          Upload Template File
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.csv"
                          onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                          className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                        />
                        {templateFile && (
                          <div className="mt-3 flex items-center gap-3">
                            <span className="text-sm text-[#6B7280]">
                              Selected: {templateFile.name}
                            </span>
                            <Button
                              type="button"
                              onClick={handleTemplateUpload}
                              disabled={uploadingTemplate}
                              className="text-sm"
                            >
                              {uploadingTemplate ? "Uploading..." : "Upload"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedTemplate && (
                      <div className="p-4 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-[#111827] mb-1">
                            {selectedTemplate.name}
                          </h4>
                          <p className="text-xs text-[#6B7280]">
                            {selectedTemplate.parts.reduce(
                              (sum, p) => sum + p.duration,
                              0
                            )}{" "}
                            minutes total • {selectedTemplate.parts.length} parts
                          </p>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedTemplate.parts.map((part, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-white rounded border border-[#E5E7EB]"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#111827] truncate">
                                  {part.name}
                                </p>
                                <p className="text-xs text-[#6B7280]">
                                  {CATEGORY_LABELS[part.category]} • {part.duration} min
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Parts */}
                <div className="border-t border-[#E5E7EB] pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#111827] mb-1">
                        Session Parts
                      </h3>
                      <p className="text-xs text-[#6B7280]">
                        {trainingForm.parts.length} part{trainingForm.parts.length !== 1 ? "s" : ""} • {totalDuration} min total
                      </p>
                    </div>
                    <Button type="button" variant="secondary" onClick={addPart} className="text-sm">
                      Add Part
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {trainingForm.parts.map((part, index) => (
                      <div
                        key={index}
                        className="p-4 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-[#111827]">
                            Part {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removePart(index)}
                            className="text-[#EF4444] hover:text-[#991B1B] text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div className="md:col-span-2">
                            <label className="block mb-1 text-xs font-medium text-[#111827]">
                              Part Name *
                            </label>
                            <input
                              type="text"
                              value={part.name}
                              onChange={(e) =>
                                updatePart(index, "name", e.target.value)
                              }
                              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                              placeholder="e.g., Passing Drills"
                              required
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium text-[#111827]">
                              Duration (min) *
                            </label>
                            <input
                              type="number"
                              value={part.duration}
                              onChange={(e) =>
                                updatePart(
                                  index,
                                  "duration",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                              min="1"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1 text-xs font-medium text-[#111827]">
                              Category
                            </label>
                            <select
                              value={part.category}
                              onChange={(e) =>
                                updatePart(index, "category", e.target.value)
                              }
                              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {CATEGORY_LABELS[cat]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium text-[#111827]">
                              Notes
                            </label>
                            <input
                              type="text"
                              value={part.notes}
                              onChange={(e) =>
                                updatePart(index, "notes", e.target.value)
                              }
                              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                              placeholder="Optional notes"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {trainingForm.parts.length === 0 && (
                      <div className="text-center py-8 text-[#6B7280]">
                        <p className="text-sm mb-3">No parts added yet</p>
                        <Button type="button" variant="secondary" onClick={addPart}>
                          Add First Part
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Actions */}
                <div className="flex gap-3 pt-6 border-t border-[#E5E7EB]">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowEventModal(false);
                      resetTrainingForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleCreateTraining(true)}
                    disabled={saving}
                    variant="secondary"
                    className="flex-1"
                  >
                    {saving ? "Saving..." : "Save and Create Another"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleCreateTraining(false)}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? "Saving..." : "Save and Exit"}
                  </Button>
                </div>
              </div>
            )}

            {/* Appointment Form */}
            {eventType === "appointment" && (
              <>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Title
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, title: e.target.value })
                    }
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    placeholder="Appointment title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#111827]">
                      Date
                    </label>
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, date: e.target.value })
                      }
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#111827]">
                      Time
                    </label>
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, time: e.target.value })
                      }
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, description: e.target.value })
                    }
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleCreateEvent} className="flex-1">
                    Create Appointment
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowEventModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1 text-[#111827]">Calendar</h1>
          <p className="text-sm text-[#6B7280]">View and manage events, matches, and training sessions</p>
        </div>
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1A73E8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-[#6B7280]">Loading calendar...</p>
        </Card>
      </div>
    }>
      <CalendarPageContent />
    </Suspense>
  );
}
