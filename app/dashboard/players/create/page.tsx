"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import FormSection from "@/components/ui/FormSection";

interface Team {
  id: string;
  name: string;
}

export default function CreatePlayerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [position, setPosition] = useState("FW");
  const [teamId, setTeamId] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        setTeams(data || []);
        setLoadingTeams(false);
      })
      .catch(() => {
        setLoadingTeams(false);
      });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!profileImage) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", profileImage);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError("First name and last name are required.");
        return;
      }
      setStep(2);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    try {
      // Upload image if provided
      let profileImageUrl = null;
      if (profileImage) {
        profileImageUrl = await uploadImage();
        if (!profileImageUrl) {
          setError("Failed to upload profile image. Please try again.");
          return;
        }
      }

      // Create player
      const res = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          dateOfBirth: dateOfBirth || null,
          position,
          teamId: teamId || null,
          profileImageUrl,
          injuryStatus: "FIT",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create player.");
        return;
      }

      setMessage("Player created successfully!");
      
      // Reset form
      setFirstName("");
      setLastName("");
      setDateOfBirth("");
      setPosition("FW");
      setTeamId("");
      setProfileImage(null);
      setProfileImagePreview(null);
      
      // Redirect to players page after short delay
      setTimeout(() => {
        router.push("/dashboard/players");
      }, 1500);
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Add New Player"
        description="Create a new player profile"
      />

      <Card>
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 1 ? "bg-[#1A73E8] text-white" : "bg-[#E5E7EB] text-[#6B7280]"
              }`}>
                1
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? "text-[#111827]" : "text-[#9CA3AF]"}`}>
                Player Info
              </span>
            </div>
            <div className="flex-1 h-px bg-[#E5E7EB] mx-4"></div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 2 ? "bg-[#1A73E8] text-white" : "bg-[#E5E7EB] text-[#6B7280]"
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${step >= 2 ? "text-[#111827]" : "text-[#9CA3AF]"}`}>
                Save Player
              </span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <FormSection title="Player Information" description="Enter the player's basic details">
            <Input
              label="First Name *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
            />

            <Input
              label="Last Name *"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
            />

            <Input
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />

            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Position *
              </label>
              <select
                className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB] text-sm"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              >
                <option value="GK">Goalkeeper (GK)</option>
                <option value="DF">Defender (DF)</option>
                <option value="MF">Midfielder (MF)</option>
                <option value="FW">Forward (FW)</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Team (Optional)
              </label>
              {loadingTeams ? (
                <div className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-[#6B7280] bg-[#F9FAFB]">
                  Loading teams...
                </div>
              ) : (
                <select
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB] text-sm"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                >
                  <option value="">No team assigned</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-[#111827]">
                Profile Image (Optional)
              </label>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all duration-200 bg-white hover:border-[#D1D5DB]"
                />
                {profileImagePreview && (
                  <div className="mt-4">
                    <p className="text-sm text-[#6B7280] mb-2">Preview:</p>
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#E5E7EB]">
                      <img
                        src={profileImagePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium text-sm flex items-center gap-2">
                  <span>✕</span>
                  {error}
                </p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button onClick={handleNext}>Next Step</Button>
            </div>
          </FormSection>
        )}

        {step === 2 && (
          <FormSection title="Review & Save" description="Review the player information and save">
            <div className="space-y-4">
                  <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <div className="flex items-center gap-4 mb-4">
                  {profileImagePreview ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E5E7EB]">
                      <img
                        src={profileImagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#E5E7EB] flex items-center justify-center">
                      <span className="text-[#6B7280] text-lg font-semibold">
                        {firstName.charAt(0)}{lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-[#111827]">
                      {firstName} {lastName}
                    </h3>
                    <p className="text-sm text-[#6B7280]">{position}</p>
                    {teamId && (
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        Team: {teams.find((t) => t.id === teamId)?.name || "Unknown"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#6B7280]">Date of Birth:</span>
                    <span className="ml-2 text-[#111827]">
                      {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Team:</span>
                    <span className="ml-2 text-[#111827]">
                      {teamId ? teams.find((t) => t.id === teamId)?.name || "Unknown" : "Not assigned"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium text-sm flex items-center gap-2">
                  <span>✓</span>
                  {message}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium text-sm flex items-center gap-2">
                  <span>✕</span>
                  {error}
                </p>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading ? "Uploading..." : "Save Player"}
              </Button>
            </div>
          </FormSection>
        )}
      </Card>
    </div>
  );
}
