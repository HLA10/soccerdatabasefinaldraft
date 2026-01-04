"use client";

import { useState, useEffect, useRef } from "react";
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

// Image Editor Preview Component
function ImageEditorPreview({ 
  src, 
  position, 
  scale, 
  isDragging 
}: { 
  src: string; 
  position: { x: number; y: number }; 
  scale: number; 
  isDragging: boolean;
}) {
  const [imgDimensions, setImgDimensions] = useState({ width: 400, height: 400 });
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const aspect = img.width / img.height;
      if (aspect >= 1) {
        // Landscape or square
        setImgDimensions({ width: 400 * aspect, height: 400 });
      } else {
        // Portrait
        setImgDimensions({ width: 400, height: 400 / aspect });
      }
    };
    img.src = src;
  }, [src]);

  return (
    <div
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
        transformOrigin: 'center center',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt="Profile preview"
        className="select-none pointer-events-none"
        draggable={false}
        style={{ 
          display: 'block',
          width: `${imgDimensions.width}px`,
          height: `${imgDimensions.height}px`,
          objectFit: 'contain',
        }}
      />
    </div>
  );
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
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
        setShowImageEditor(true);
        // Reset position and scale
        setImageScale(1);
        setImagePosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!showImageEditor) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !showImageEditor) return;
    e.preventDefault();
    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!showImageEditor) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setImageScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const applyImageEdit = async () => {
    if (!profileImagePreview) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise<void>((resolve) => {
      img.onload = () => {
        const outputSize = 400; // Output size in pixels
        const editorSize = 400; // Editor container size
        canvas.width = outputSize;
        canvas.height = outputSize;
        
        if (ctx) {
          // Calculate aspect ratio of the original image
          const imgAspect = img.width / img.height;
          
          // Calculate how big the image appears in the editor (maintaining aspect ratio)
          let displayWidth, displayHeight;
          if (imgAspect >= 1) {
            // Landscape or square: fit to width
            displayWidth = editorSize * imageScale;
            displayHeight = displayWidth / imgAspect;
          } else {
            // Portrait: fit to height
            displayHeight = editorSize * imageScale;
            displayWidth = displayHeight * imgAspect;
          }
          
          // The editor center
          const editorCenter = editorSize / 2;
          
          // Calculate where the image center is in editor coordinates after user positioning
          const imageCenterX = editorCenter + imagePosition.x;
          const imageCenterY = editorCenter + imagePosition.y;
          
          // Map editor coordinates to source image coordinates
          // The ratio between editor size and displayed image size
          const scaleRatio = img.width / displayWidth;
          
          // Calculate the center point in source image coordinates
          const sourceCenterX = (imageCenterX - editorCenter) * scaleRatio + img.width / 2;
          const sourceCenterY = (imageCenterY - editorCenter) * scaleRatio + img.height / 2;
          
          // For square crop, we need to determine crop size
          // Use the smaller dimension to ensure we get a square
          const cropSize = Math.min(img.width, img.height, displayWidth * scaleRatio, displayHeight * scaleRatio);
          
          // Calculate source crop coordinates (center-based)
          let sourceX = sourceCenterX - cropSize / 2;
          let sourceY = sourceCenterY - cropSize / 2;
          
          // Clamp to image bounds
          sourceX = Math.max(0, Math.min(img.width - cropSize, sourceX));
          sourceY = Math.max(0, Math.min(img.height - cropSize, sourceY));
          
          // Final crop size (may be smaller if clamped)
          const finalCropSize = Math.min(cropSize, img.width - sourceX, img.height - sourceY);
          
          // Draw the cropped image to canvas
          ctx.drawImage(
            img,
            sourceX, sourceY, finalCropSize, finalCropSize,
            0, 0, outputSize, outputSize
          );
          
          // Convert to blob and update state
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], profileImage?.name || 'profile.jpg', { type: 'image/jpeg' });
              const newPreviewUrl = canvas.toDataURL('image/jpeg', 0.95);
              
              // Update state
              setProfileImage(file);
              setProfileImagePreview(newPreviewUrl);
              setShowImageEditor(false);
              
              // Reset editor state
              setImageScale(1);
              setImagePosition({ x: 0, y: 0 });
              
              resolve();
            }
          }, 'image/jpeg', 0.95);
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load image for editing');
        resolve();
      };
      
      img.src = profileImagePreview;
    });
  };

  const resetImageEdit = () => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
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
                
                {showImageEditor && profileImagePreview && (
                  <Card className="p-4 bg-[#F9FAFB]">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-[#111827] mb-3">Adjust Image Position & Size</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[#6B7280] mb-2">
                            Zoom: {Math.round(imageScale * 100)}%
                          </label>
                          <input
                            type="range"
                            min="50"
                            max="300"
                            value={imageScale * 100}
                            onChange={(e) => setImageScale(parseInt(e.target.value) / 100)}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-[#9CA3AF] mt-1">
                            <span>50%</span>
                            <span>300%</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              resetImageEdit();
                            }}
                            className="text-xs py-1.5"
                          >
                            Reset
                          </Button>
                          <Button
                            onClick={() => {
                              applyImageEdit();
                            }}
                            className="text-xs py-1.5"
                          >
                            Apply & Save
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setShowImageEditor(false);
                            }}
                            className="text-xs py-1.5"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="relative rounded-full overflow-hidden border-4 border-[#E5E7EB] bg-[#F3F4F6]" style={{ width: '400px', height: '400px' }}>
                        <div
                          className="relative w-full h-full cursor-move"
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          onWheel={handleWheel}
                          style={{ touchAction: 'none' }}
                        >
                          {profileImagePreview && (
                            <ImageEditorPreview
                              src={profileImagePreview}
                              position={imagePosition}
                              scale={imageScale}
                              isDragging={isDragging}
                            />
                          )}
                          <div className="absolute inset-0 border-2 border-dashed border-[#1A73E8] pointer-events-none rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[#6B7280] text-center mt-3">
                      Click and drag to reposition • Use scroll wheel or slider to zoom
                    </p>
                  </Card>
                )}

                {!showImageEditor && profileImagePreview && (
                  <div className="mt-4">
                    <p className="text-sm text-[#6B7280] mb-2">Preview:</p>
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#E5E7EB]">
                      <img
                        src={profileImagePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setShowImageEditor(true)}
                      className="mt-2 text-xs"
                    >
                      Edit Image
                    </Button>
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
