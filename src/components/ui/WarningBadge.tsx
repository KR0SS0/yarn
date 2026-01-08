import React from "react";
import { ValidationType, VALIDATION_CONFIG } from "../../types";

interface BadgeProps {
  type: ValidationType;
  // Allow overriding size if the list needs to be smaller than the player
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ type, className = "" }) => {
  const style = VALIDATION_CONFIG[type];

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs border border-opacity-50 whitespace-nowrap font-medium ${style.bg} ${style.border} ${style.text} ${className}`}
    >
      {style.label}
    </span>
  );
};

export default Badge;
