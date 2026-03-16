"use client";

import { useState, useEffect } from "react";

/**
 * Robust Avatar component with graceful error handling for broken images.
 * Falls back to initials if the image fails to load or is not provided.
 */
export default function Avatar({
  src,
  name = "User",
  className = "h-8 w-8",
  fallbackClassName = "bg-slate-200 text-slate-600",
  style = {},
}) {
  const [error, setError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setError(false);
  }, [src]);

  const initials = String(name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "U";

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setError(true)}
        className={`${className} object-cover`}
        style={style}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center font-black ${fallbackClassName}`}
      style={style}
    >
      <span className="leading-none">{initials}</span>
    </div>
  );
}
