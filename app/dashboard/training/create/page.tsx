"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";

interface Team {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  parts: Array<{
    id: string;
    name: string;
    category: string;
    duration: number;
    notes?: string | null;
  }>;
}

interface SessionPart {
  id?: string;
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

export default function CreateTrainingSessionPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [parts, setParts] = useState<SessionPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/teams").then((res) => res.json()),
      fetch("/api/training-templates").then((res) => res.json()),
    ])
      .then(([teamsData, templatesData]) => {
        setTeams(teamsData || []);
        setTemplates(templatesData || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setSessionName(template.name);
        setParts(
          template.parts.map((p) => ({
            name: p.name,
            category: p.category,
            duration: p.duration,
            notes: p.notes || "",
          }))
        );
      }
    } else {
      if (parts.length === 0) {
        setParts([{ name: "", category: "WARM_UP", duration: 10, notes: "" }]);
      }
    }
  }, [selectedTemplateId, templates]);

  const addPart = () => {
    setParts([
      ...parts,
      { name: "", category: "TECHNICAL", duration: 15, notes: "" },
    ]);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: string, value: any) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
  };

  const movePart = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === parts.length - 1)
    ) {
      return;
    }
    const newParts = [...parts];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newParts[index], newParts[targetIndex]] = [
      newParts[targetIndex],
      newParts[index],
    ];
    setParts(newParts);
  };

  const totalDuration = parts.reduce((sum, part) => sum + (part.duration || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!selectedTeamId || !sessionName || !date) {
      setError("Team, session name, and date are required");
      setLoading(false);
      return;
    }

    if (parts.length === 0 || parts.some((p) => !p.name || !p.duration)) {
      setError("Please add at least one part with name and duration");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/training-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: selectedTeamId,
          name: sessionName,
          date,
          time,
          location,
          templateId: selectedTemplateId || null,
          parts,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create session");
        setLoading(false);
        return;
      }

      setMessage("Training session created successfully!");
      setTimeout(() => {
        router.push(`/dashboard/training/${data.id}`);
      }, 1000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="max-w-[1400px]">
      <PageHeader
        title="Create Training Session"
        description="Schedule a new training session with optional template"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Session Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#111827] mb-1">
                  Session Details
                </h2>
                <p className="text-sm text-[#6B7280]">
                  Basic information about the training session
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Team *
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB]"
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
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB]"
                    required
                    placeholder="e.g., Passing & Possession"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#111827]">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#111827]">
                      Time
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB]"
                    placeholder="Training field or facility"
                  />
                </div>
              </div>
            </Card>

            {/* Session Parts */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-[#111827] mb-1">
                    Session Parts
                  </h2>
                  <p className="text-sm text-[#6B7280]">
                    {parts.length} part{parts.length !== 1 ? "s" : ""} • Total: {totalDuration} min
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addPart}
                >
                  Add Part
                </Button>
              </div>

              <div className="space-y-4">
                {parts.map((part, index) => (
                  <div
                    key={index}
                    className="p-4 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-sm font-medium text-[#111827]">
                        Part {index + 1}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => movePart(index, "up")}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-[#E5E7EB] disabled:opacity-50 disabled:cursor-not-allowed text-[#6B7280]"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => movePart(index, "down")}
                          disabled={index === parts.length - 1}
                          className="p-1 rounded hover:bg-[#E5E7EB] disabled:opacity-50 disabled:cursor-not-allowed text-[#6B7280]"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removePart(index)}
                          className="p-1 rounded hover:bg-[#FEE2E2] text-[#EF4444]"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="md:col-span-2">
                        <label className="block mb-2 text-xs font-medium text-[#111827]">
                          Part Name *
                        </label>
                        <input
                          type="text"
                          value={part.name}
                          onChange={(e) =>
                            updatePart(index, "name", e.target.value)
                          }
                          className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                          required
                          placeholder="e.g., Passing Drills"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-xs font-medium text-[#111827]">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-xs font-medium text-[#111827]">
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
                        <label className="block mb-2 text-xs font-medium text-[#111827]">
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

                {parts.length === 0 && (
                  <div className="text-center py-8 text-[#6B7280]">
                    <p className="text-sm">No parts added yet</p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addPart}
                      className="mt-4"
                    >
                      Add First Part
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Template Selection */}
          <div className="space-y-6">
            <Card>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#111827] mb-1">
                  Attach Template
                </h2>
                <p className="text-sm text-[#6B7280]">
                  Optional: Use a saved template
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      if (!e.target.value) {
                        setParts([
                          {
                            name: "",
                            category: "WARM_UP",
                            duration: 10,
                            notes: "",
                          },
                        ]);
                      }
                    }}
                    className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB]"
                  >
                    <option value="">No template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplate && (
                  <div className="p-4 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-[#111827] mb-1">
                        {selectedTemplate.name}
                      </h3>
                      <p className="text-xs text-[#6B7280]">
                        {selectedTemplate.parts.reduce(
                          (sum, p) => sum + p.duration,
                          0
                        )}{" "}
                        minutes total
                      </p>
                    </div>

                    <div className="space-y-2">
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

                    <p className="text-xs text-[#6B7280] mt-4">
                      Template parts loaded. You can edit them below.
                    </p>
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

        {/* Submit Button */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Session"}
          </Button>
        </div>
      </form>
    </div>
  );
}

