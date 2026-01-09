"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Image from "next/image";

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

interface TrainingForm {
  teamId: string;
  name: string;
  date: string;
  time: string;
  location: string;
  templateId: string;
  isRecurring: boolean;
  daysOfWeek: number[];
  startDate: string;
  endDate: string;
  parts: SessionPart[];
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

interface TrainingSessionFormProps {
  onSave: (formData: TrainingForm, saveAndContinue: boolean) => Promise<void>;
  onCancel: () => void;
  initialValues?: Partial<TrainingForm>;
  saving?: boolean;
  error?: string;
  message?: string;
}

export default function TrainingSessionForm({
  onSave,
  onCancel,
  initialValues,
  saving = false,
  error: externalError,
  message: externalMessage,
}: TrainingSessionFormProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState<TrainingForm>({
    teamId: initialValues?.teamId || "",
    name: initialValues?.name || "",
    date: initialValues?.date || "",
    time: initialValues?.time || "",
    location: initialValues?.location || "",
    templateId: initialValues?.templateId || "",
    isRecurring: initialValues?.isRecurring || false,
    daysOfWeek: initialValues?.daysOfWeek || [],
    startDate: initialValues?.startDate || "",
    endDate: initialValues?.endDate || "",
    parts: initialValues?.parts || [{ name: "", category: "WARM_UP", duration: 10, notes: "" }],
  });
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data || []))
      .catch(() => {});

    fetch("/api/training-templates")
      .then((res) => res.json())
      .then((data) => setTemplates(data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (form.templateId) {
      const template = templates.find((t) => t.id === form.templateId);
      if (template) {
        setForm((prev) => ({
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
  }, [form.templateId, templates]);

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
      formData.append("daysOfWeek", JSON.stringify(form.daysOfWeek));

      const res = await fetch("/api/training-templates/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload template");
      }

      setTemplates([...templates, data]);
      setForm((prev) => ({
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
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const addPart = () => {
    setForm((prev) => ({
      ...prev,
      parts: [
        ...prev.parts,
        { name: "", category: "TECHNICAL", duration: 15, notes: "" },
      ],
    }));
  };

  const removePart = (index: number) => {
    setForm((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }));
  };

  const updatePart = (index: number, field: string, value: any) => {
    setForm((prev) => {
      const newParts = [...prev.parts];
      newParts[index] = { ...newParts[index], [field]: value };
      return { ...prev, parts: newParts };
    });
  };

  const calculateSessionCount = () => {
    if (!form.isRecurring || !form.startDate) return 0;
    if (form.daysOfWeek.length === 0) return 0;

    const start = new Date(form.startDate);
    const end = form.endDate
      ? new Date(form.endDate)
      : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());

    let count = 0;
    const current = new Date(start);
    while (current <= end && count < 500) {
      if (form.daysOfWeek.includes(current.getDay())) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const resetForm = () => {
    setForm({
      teamId: initialValues?.teamId || "",
      name: initialValues?.name || "",
      date: initialValues?.date || "",
      time: initialValues?.time || "",
      location: initialValues?.location || "",
      templateId: initialValues?.templateId || "",
      isRecurring: initialValues?.isRecurring || false,
      daysOfWeek: initialValues?.daysOfWeek || [],
      startDate: initialValues?.startDate || "",
      endDate: initialValues?.endDate || "",
      parts: [{ name: "", category: "WARM_UP", duration: 10, notes: "" }],
    });
    setTemplateFile(null);
    setError("");
    setMessage("");
  };

  const handleSave = async (saveAndContinue: boolean) => {
    setError("");
    setMessage("");

    if (!form.teamId || !form.name) {
      setError("Team and session name are required");
      return;
    }

    if (form.parts.length === 0 || form.parts.some((p) => !p.name || !p.duration)) {
      setError("Please add at least one part with name and duration");
      return;
    }

    if (form.isRecurring) {
      if (!form.startDate || form.daysOfWeek.length === 0) {
        setError("Start date and at least one day are required for recurring sessions");
        return;
      }
    } else {
      if (!form.date) {
        setError("Date is required");
        return;
      }
    }

    await onSave(form, saveAndContinue);
    if (saveAndContinue) {
      resetForm();
    }
  };

  const selectedTemplate = templates.find((t) => t.id === form.templateId);
  const totalDuration = form.parts.reduce((sum, p) => sum + (p.duration || 0), 0);
  const sessionCount = calculateSessionCount();
  const displayError = externalError || error;
  const displayMessage = externalMessage || message;

  return (
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
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
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
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
              placeholder="e.g., Passing & Possession"
              required
            />
          </div>

          {!form.isRecurring && (
            <div>
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Date *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                required={!form.isRecurring}
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
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
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
              setForm({
                ...form,
                isRecurring: !form.isRecurring,
              })
            }
            className={`relative w-12 h-6 rounded-full transition-colors ${
              form.isRecurring ? "bg-[#1A73E8]" : "bg-[#D1D5DB]"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                form.isRecurring ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {form.isRecurring && (
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
                      form.daysOfWeek.includes(index)
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
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                  required={form.isRecurring}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[#111827]">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                  min={form.startDate}
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
              value={form.templateId}
              onChange={(e) => {
                setForm({
                  ...form,
                  templateId: e.target.value,
                });
                setTemplateFile(null);
              }}
              className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
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

          {form.templateId === "__upload__" && (
            <div className="p-4 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Upload Template File
              </label>
              <input
                type="file"
                accept=".pdf,.csv"
                onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
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
                  {selectedTemplate.parts.reduce((sum, p) => sum + p.duration, 0)}{" "}
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
              {form.parts.length} part{form.parts.length !== 1 ? "s" : ""} • {totalDuration} min total
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={addPart} className="text-sm">
            Add Part
          </Button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {form.parts.map((part, index) => (
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
                    onChange={(e) => updatePart(index, "name", e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
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
                      updatePart(index, "duration", parseInt(e.target.value) || 0)
                    }
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
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
                    onChange={(e) => updatePart(index, "category", e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
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
                    onChange={(e) => updatePart(index, "notes", e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
            </div>
          ))}

          {form.parts.length === 0 && (
            <div className="text-center py-8 text-[#6B7280]">
              <p className="text-sm mb-3">No parts added yet</p>
              <Button type="button" variant="secondary" onClick={addPart}>
                Add First Part
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error and Success Messages */}
      {displayError && (
        <div className="p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
          <p className="text-[#991B1B] font-medium text-sm">{displayError}</p>
        </div>
      )}

      {displayMessage && (
        <div className="p-4 bg-[#ECFDF5] border border-[#10B981] rounded-lg">
          <p className="text-[#065F46] font-medium text-sm">{displayMessage}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t border-[#E5E7EB]">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => handleSave(true)}
          disabled={saving}
          variant="secondary"
          className="flex-1"
        >
          {saving ? "Saving..." : "Save and Create Another"}
        </Button>
        <Button
          type="button"
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex-1"
        >
          {saving ? "Saving..." : "Save and Exit"}
        </Button>
      </div>
    </div>
  );
}

