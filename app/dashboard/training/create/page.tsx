"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import TrainingSessionForm from "@/components/TrainingSessionForm";

export default function CreateTrainingSessionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSave = async (formData: any, saveAndContinue: boolean) => {
    setError("");
    setMessage("");
    setSaving(true);

    try {
      if (formData.isRecurring) {
        const res = await fetch("/api/training-sessions/recurring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: formData.teamId,
            name: formData.name,
            daysOfWeek: formData.daysOfWeek,
            startDate: formData.startDate,
            endDate: formData.endDate || null,
            time: formData.time || null,
            location: formData.location || null,
            templateId: formData.templateId || null,
            parts: formData.parts,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create recurring sessions");
        }

        setMessage(`Successfully created ${data.count} training sessions!`);
        
        if (!saveAndContinue) {
          setTimeout(() => {
            router.push("/dashboard/training");
          }, 1500);
        }
      } else {
        const res = await fetch("/api/training-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: formData.teamId,
            name: formData.name,
            date: formData.date,
            time: formData.time || null,
            location: formData.location || null,
            templateId: formData.templateId || null,
            parts: formData.parts,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create training session");
        }

        setMessage("Training session created successfully!");
        
        if (!saveAndContinue) {
          setTimeout(() => {
            router.push(`/dashboard/training/${data.id}`);
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1400px]">
      <PageHeader
        title="Create Training Session"
        description="Schedule a new training session with optional template"
      />

      <div className="mt-6">
        <TrainingSessionForm
          onSave={handleSave}
          onCancel={() => router.back()}
          saving={saving}
          error={error}
          message={message}
        />
      </div>
    </div>
  );
}
