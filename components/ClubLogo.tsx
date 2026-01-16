"use client";

import { useState } from "react";

const CLUB_LOGO_PATH = "/club-logo.png.jpg";

interface ClubLogoProps {
  isCollapsed?: boolean;
}

export default function ClubLogo({ isCollapsed = false }: ClubLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(CLUB_LOGO_PATH);

  if (hasError) {
    return null;
  }

  return (
    <img
      src={imageSrc}
      alt="Club Logo"
      className={`bg-transparent ${isCollapsed ? "w-12 h-auto object-contain" : "w-24 h-auto object-contain"}`}
      style={{ maxHeight: isCollapsed ? '48px' : '96px', backgroundColor: 'transparent' }}
      onError={() => {
        console.error("Failed to load club logo from:", imageSrc);
        // Try alternative paths
        const alternatives = [
          "/club-logo.jpg",
          "/club-logo.png",
          "/logo.png",
          "/logo.jpg",
        ];
        
        if (imageSrc === CLUB_LOGO_PATH && alternatives.length > 0) {
          // Try first alternative
          setImageSrc(alternatives[0]);
        } else {
          setHasError(true);
        }
      }}
      onLoad={() => {
        console.log("Club logo loaded successfully from:", imageSrc);
      }}
    />
  );
}


