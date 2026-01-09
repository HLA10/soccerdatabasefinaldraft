"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Image from "next/image";

export default function CreateTeamPage() {
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        setLogoUrl(data.url);
      }
    } catch (err) {
      setError("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Show local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Also upload to server
      handleLogoUpload(file);
    }
  };

  async function createTeam() {
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter a team name");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: name.trim(),
          logoUrl: logoUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create team");
        setLoading(false);
        return;
      }

      setMessage("Team created successfully!");
      setName("");
      setLogoFile(null);
      setLogoPreview(null);
      setLogoUrl(null);
      setLoading(false);
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Error:", error);
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      createTeam();
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-[#111827]">
          Create a Team
        </h1>
        <p className="text-sm text-[#6B7280]">Add a new team to your organization</p>
      </div>
      <Card className="max-w-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#111827]">Team Information</h2>
          <p className="text-sm text-[#6B7280] mt-1">Add a new team to your organization</p>
        </div>

      <Input
        label="Team Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="mt-4">
        <label className="block mb-2 text-sm font-medium text-[#111827]">
          Team Logo (Optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all bg-white hover:border-[#D1D5DB]"
        />
        {(logoPreview || logoUrl || uploadingLogo) && (
          <div className="mt-3 flex items-center gap-3">
            <div className="relative w-20 h-20 rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] flex items-center justify-center">
              {uploadingLogo ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#1A73E8] border-t-transparent"></div>
              ) : (logoUrl || logoPreview) ? (
                <Image
                  src={logoUrl || logoPreview || ""}
                  alt="Team logo preview"
                  fill
                  className="object-contain p-1"
                />
              ) : null}
            </div>
            {logoFile && (
              <div className="flex-1">
                <p className="text-sm text-[#111827] font-medium truncate">{logoFile.name}</p>
                <p className="text-xs text-[#6B7280]">
                  {uploadingLogo ? "Uploading..." : "Ready to upload"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Button onClick={createTeam} className="w-full mt-4" disabled={loading || uploadingLogo}>
        {loading ? "Creating..." : "Create Team"}
      </Button>

      {message && (
        <div className="mt-4 p-4 bg-[#ECFDF5] border border-[#10B981] rounded-lg">
          <p className="text-[#065F46] font-medium text-sm">
            {message}
          </p>
        </div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
          <p className="text-[#991B1B] font-medium text-sm">
            {error}
          </p>
        </div>
      )}
      </Card>
    </div>
  );
}

