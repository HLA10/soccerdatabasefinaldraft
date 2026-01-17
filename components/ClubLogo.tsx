"use client";

import { useState } from "react";

const CLUB_LOGO_PATH = "/dif-logo.png.png";

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
      className={`bg-transparent ${isCollapsed ? "w-10 h-10 object-contain" : "w-14 h-14 object-contain"}`}
      style={{ maxHeight: isCollapsed ? '40px' : '56px', backgroundColor: 'transparent' }}
      onError={() => {
        console.error("Failed to load club logo from:", imageSrc);
        // Try alternative paths
        const alternatives = [
          "/dif-logo.jpg",
          "/club-logo.png",
          "/club-logo.jpg",
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


