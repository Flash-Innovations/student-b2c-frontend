import React, { useState, useEffect, useMemo } from "react";
import { Building2 } from "lucide-react";

export function getInitials(name = "") {
  if (!name || typeof name !== "string") return "?";
  const cleaned = name.trim();
  if (!cleaned) return "?";
  
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return "?";
}

function getDeterministicBg(name = "") {
  const gradients = [
    "from-indigo-600 to-blue-600 text-white",
    "from-emerald-600 to-teal-600 text-white",
    "from-purple-600 to-pink-600 text-white",
    "from-amber-600 to-orange-600 text-white",
    "from-cyan-600 to-blue-600 text-white",
    "from-violet-600 to-purple-600 text-white",
    "from-rose-600 to-red-600 text-white"
  ];
  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % gradients.length;
  return gradients[idx];
}

const SIZE_CLASSES = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
  "2xl": "w-20 h-20 text-2xl"
};

const ROUNDED_CLASSES = {
  circle: "rounded-full",
  rounded: "rounded-xl",
  square: "rounded-lg"
};

export function Avatar({
  src = null,
  name = "",
  size = "md",
  variant = "circle",
  isCollege = false,
  className = "",
  alt = "",
  showBadge = false,
  badgeStatus = "online"
}) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const sizeClass = SIZE_CLASSES[size] || (typeof size === "string" ? size : "w-10 h-10 text-sm");
  const roundedClass = ROUNDED_CLASSES[variant] || "rounded-full";
  const initials = getInitials(name);
  const bgGradient = isCollege ? "from-slate-700 to-slate-900 text-amber-400" : getDeterministicBg(name);

  const hasValidImage = Boolean(src) && !imageError;

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 font-semibold select-none overflow-hidden ${sizeClass} ${roundedClass} ${className}`}
    >
      {hasValidImage ? (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover ${roundedClass}`}
          loading="lazy"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center bg-gradient-to-br shadow-inner ${bgGradient} ${roundedClass}`}
          title={name || (isCollege ? "College" : "User")}
        >
          {isCollege ? (
            <Building2 className="w-1/2 h-1/2 opacity-90" />
          ) : (
            <span className="tracking-wider uppercase font-bold leading-none">{initials}</span>
          )}
        </div>
      )}

      {showBadge && (
        <span
          className={`absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full ring-2 ring-white ${
            badgeStatus === "online" ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />
      )}
    </div>
  );
}

export default Avatar;
