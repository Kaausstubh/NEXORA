"use client";

import React from "react";
import { ShieldCheck, Building2, AlertTriangle, AlertOctagon, Skull, Clock, ShieldAlert } from "lucide-react";

export interface TrustBadgeProps {
  badge?: string;
  riskScore?: number;
  riskLevel?: string;
  showRiskScore?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function getTrustBadgeConfig(badgeName?: string) {
  const norm = (badgeName || "Verified Employer").trim().toLowerCase();

  if (norm.includes("verified employer") || norm === "verified") {
    return {
      label: "Verified Employer",
      icon: ShieldCheck,
      bgColor: "bg-emerald-50 hover:bg-emerald-100/80",
      textColor: "text-emerald-800",
      borderColor: "border-emerald-300",
      dotColor: "bg-emerald-500",
      description: "Company identity & incorporation independently verified via MCA records."
    };
  }

  if (norm.includes("official source")) {
    return {
      label: "Official Source",
      icon: Building2,
      bgColor: "bg-sky-50 hover:bg-sky-100/80",
      textColor: "text-sky-800",
      borderColor: "border-sky-300",
      dotColor: "bg-sky-500",
      description: "Opportunity sourced directly from official careers portal or government body."
    };
  }

  if (norm.includes("pending")) {
    return {
      label: "Verification Pending",
      icon: Clock,
      bgColor: "bg-amber-50 hover:bg-amber-100/80",
      textColor: "text-amber-800",
      borderColor: "border-amber-300",
      dotColor: "bg-amber-500",
      description: "Documentation is under review. Standard candidate precautions advised."
    };
  }

  if (norm.includes("suspicious")) {
    return {
      label: "Suspicious Activity",
      icon: AlertTriangle,
      bgColor: "bg-orange-50 hover:bg-orange-100/80",
      textColor: "text-orange-900",
      borderColor: "border-orange-400",
      dotColor: "bg-orange-600",
      description: "Potential fraud indicators flagged (e.g., fee requests or suspicious domain)."
    };
  }

  if (norm.includes("high risk")) {
    return {
      label: "High Risk",
      icon: AlertOctagon,
      bgColor: "bg-red-50 hover:bg-red-100/80",
      textColor: "text-red-900",
      borderColor: "border-red-400",
      dotColor: "bg-red-600",
      description: "Multiple serious fraud indicators detected. Direct application discouraged."
    };
  }

  if (norm.includes("blacklisted")) {
    return {
      label: "Blacklisted",
      icon: Skull,
      bgColor: "bg-neutral-900 text-white",
      textColor: "text-neutral-100",
      borderColor: "border-neutral-900",
      dotColor: "bg-rose-500",
      description: "Confirmed scam entity. All direct applications permanently blocked."
    };
  }

  return {
    label: badgeName || "Verified Employer",
    icon: ShieldCheck,
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-800",
    borderColor: "border-emerald-300",
    dotColor: "bg-emerald-500",
    description: "Verified opportunity."
  };
}

export function getRiskScoreConfig(score: number = 10) {
  if (score <= 20) {
    return {
      level: "Low Risk",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500"
    };
  }
  if (score <= 40) {
    return {
      level: "Moderate Risk",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500"
    };
  }
  if (score <= 60) {
    return {
      level: "Elevated Risk",
      badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
      dot: "bg-orange-500"
    };
  }
  if (score <= 80) {
    return {
      level: "High Risk",
      badgeClass: "bg-rose-50 text-rose-800 border-rose-300",
      dot: "bg-rose-600"
    };
  }
  return {
    level: "Critical Risk",
    badgeClass: "bg-red-100 text-red-900 border-red-400 font-bold",
    dot: "bg-red-600 animate-pulse"
  };
}

export function TrustBadge({
  badge = "Verified Employer",
  riskScore,
  riskLevel,
  showRiskScore = true,
  size = "md",
  onClick,
}: TrustBadgeProps) {
  const config = getTrustBadgeConfig(badge);
  const Icon = config.icon;
  const scoreConfig = riskScore !== undefined ? getRiskScoreConfig(riskScore) : null;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3.5 py-1.5 gap-2",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={onClick}
        title={config.description}
        className={`inline-flex items-center font-medium rounded-md border transition-all ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses} ${
          onClick ? "cursor-pointer hover:shadow-sm active:scale-95" : "cursor-default"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
        <Icon className={iconSizes} />
        <span>{config.label}</span>
      </button>

      {showRiskScore && scoreConfig && (
        <span
          className={`inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded border ${scoreConfig.badgeClass} gap-1`}
          title={`Fraud Risk Assessment: ${riskScore}/100 (${riskLevel || scoreConfig.level})`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${scoreConfig.dot}`} />
          <span>Risk: {riskScore}/100</span>
        </span>
      )}
    </div>
  );
}
