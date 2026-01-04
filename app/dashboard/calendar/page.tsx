"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";

interface Match {
  id: string;
  date: string;
  opponent: string;
  team: {
    id: string;
    name: string;
  };
  stats: any[];
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: "match" | "training" | "appointment";
  description?: string;
  teamId?: string;
  opponent?: string;
}

export default function CalendarPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventType, setEventType] = useState<"match" | "training" | "appointment">("match");
  const [eventForm, setEventForm] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
    opponent: "",
    teamId: "",
  });

  useEffect(() => {
    fetch("/api/matches")
      .then((res) => res.json())
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get events for the current month
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return matches.filter((match) => match.date.startsWith(dateStr));
  };

  // Calendar grid
  const calendarDays: (Date | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleCreateEvent = async () => {
    const dateTime = eventForm.date && eventForm.time
      ? new Date(`${eventForm.date}T${eventForm.time}`).toISOString()
      : eventForm.date
      ? new Date(`${eventForm.date}T12:00:00`).toISOString()
      : null;

    if (!dateTime) {
      alert("Please select a date");
      return;
    }

    if (eventType === "match") {
      if (!eventForm.opponent || !eventForm.teamId) {
        alert("Please fill in opponent and team ID for matches");
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
          alert(error.error || "Failed to create match");
        }
      } catch (error) {
        alert("Error creating match");
      }
    } else {
      // For training/appointment, we could create a separate API endpoint
      // For now, just show a message
      alert(`${eventType} event creation coming soon!`);
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
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Match Calendar
          </h1>
          <p className="text-gray-600">View all matches organized by date</p>
        </div>
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Calendar
          </h1>
          <p className="text-gray-600">View and manage events, matches, and training sessions</p>
        </div>
        <Button onClick={() => setShowEventModal(true)}>➕ Create Event</Button>
      </div>

      {/* Calendar Navigation */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            ← Previous
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="text-center font-semibold text-gray-700 py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
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
                  isToday ? "bg-blue-50 border-blue-300" : "border-gray-200"
                } hover:border-blue-400 transition-colors`}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((match) => (
                    <div
                      key={match.id}
                      className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded truncate"
                      title={`vs ${match.opponent}`}
                    >
                      vs {match.opponent}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upcoming Events List */}
      <Card>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Upcoming Events</h2>
        {matches.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No upcoming events</p>
        ) : (
          <div className="space-y-3">
            {matches
              .filter((match) => new Date(match.date) >= new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 10)
              .map((match) => {
                const matchDate = new Date(match.date);
                const totalGoals = match.stats.reduce(
                  (sum: number, stat: any) => sum + (stat.goals || 0),
                  0
                );
                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {matchDate.getDate()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {matchDate.toLocaleDateString("en-US", { month: "short" })}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {match.team.name} vs {match.opponent}
                        </p>
                        <p className="text-sm text-gray-600">
                          {matchDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    {totalGoals > 0 && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{totalGoals}</p>
                        <p className="text-xs text-gray-500">goals</p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Event Creation Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Event</h2>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Event Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["match", "training", "appointment"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setEventType(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      eventType === type
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {eventType === "match" && (
              <>
                <Input
                  label="Team ID"
                  value={eventForm.teamId}
                  onChange={(e) => setEventForm({ ...eventForm, teamId: e.target.value })}
                  placeholder="Enter team ID"
                />
                <Input
                  label="Opponent"
                  value={eventForm.opponent}
                  onChange={(e) => setEventForm({ ...eventForm, opponent: e.target.value })}
                  placeholder="Opponent team name"
                />
              </>
            )}

            {(eventType === "training" || eventType === "appointment") && (
              <Input
                label="Title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder={`${eventType === "training" ? "Training" : "Appointment"} title`}
              />
            )}

            <Input
              label="Date"
              type="date"
              value={eventForm.date}
              onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
            />

            <Input
              label="Time"
              type="time"
              value={eventForm.time}
              onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
            />

            {(eventType === "training" || eventType === "appointment") && (
              <Input
                label="Description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Optional description"
              />
            )}

            <div className="flex gap-3 mt-6">
              <Button onClick={handleCreateEvent} className="flex-1">
                Create {eventType === "match" ? "Match" : eventType === "training" ? "Training" : "Appointment"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowEventModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
