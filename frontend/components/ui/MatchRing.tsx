import React from "react";

interface MatchRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const MatchRing: React.FC<MatchRingProps> = ({
  score,
  size = 64,
  strokeWidth = 5,
  showLabel = true,
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  // Color logic
  let strokeColor = "#C7F36B"; // Lime for >= 80%
  let badgeBg = "bg-[#F3FBDF]";
  let textColor = "text-charcoal";

  if (clampedScore < 70) {
    strokeColor = "#E58B5A"; // Burnt orange for lower match
    badgeBg = "bg-[#FDF0E9]";
  } else if (clampedScore < 85) {
    strokeColor = "#7DB637";
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EAE8DF"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress bar */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-heading font-bold text-sm tracking-tight text-charcoal">
            {Math.round(clampedScore)}%
          </span>
          <span className="text-[9px] uppercase tracking-wider text-stone font-semibold">
            Match
          </span>
        </div>
      )}
    </div>
  );
};
