"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  Building,
  GraduationCap,
  Lock,
  Flag,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TrustBadge } from "@/components/TrustBadge";
import { SafeApplicationGatewayModal } from "@/components/SafeApplicationGatewayModal";
import { CompanySafetyDetailsModal } from "@/components/CompanySafetyDetailsModal";
import { ReportOpportunityModal } from "@/components/ReportOpportunityModal";

export interface OpportunityCardProps {
  job: any;
  isSaved?: boolean;
  onToggleSave?: (jobId: string) => void;
  showMatchExplanation?: boolean;
}

export function formatStipend(job: any): string {
  if (job.stipend_type === "Unpaid") return "Unpaid";
  if (
    job.stipend_type === "Not disclosed" ||
    (!job.stipend_amount_min && !job.stipend_amount_max && !job.salary_min)
  ) {
    return "Not disclosed";
  }

  const currency = (job.stipend_currency || "INR") === "INR" ? "₹" : "$";

  if (job.stipend_amount_min && job.stipend_amount_max) {
    if (job.stipend_amount_min === job.stipend_amount_max) {
      return `${currency}${job.stipend_amount_min.toLocaleString("en-IN")}/mo`;
    }
    return `${currency}${job.stipend_amount_min.toLocaleString("en-IN")}–${currency}${job.stipend_amount_max.toLocaleString("en-IN")}/mo`;
  }
  if (job.stipend_amount_min) {
    return `${currency}${job.stipend_amount_min.toLocaleString("en-IN")}+/mo`;
  }
  if (job.salary_min && job.salary_max) {
    return `${currency}${job.salary_min.toLocaleString("en-IN")} - ${currency}${job.salary_max.toLocaleString("en-IN")}/yr`;
  }
  return "Competitive";
}

export function getTierBadge(score: number, tierName?: string) {
  if (score >= 85 || tierName === "Excellent Match") {
    return {
      label: "Excellent Match",
      bg: "bg-[#F8FDED] text-[#2D5A12] border-lime/60",
      dot: "bg-[#558B2F]",
    };
  }
  if (score >= 70 || tierName === "Strong Match") {
    return {
      label: "Strong Match",
      bg: "bg-blue-50 text-blue-800 border-blue-200",
      dot: "bg-blue-600",
    };
  }
  if (score >= 50 || tierName === "Moderate Match") {
    return {
      label: "Moderate Match",
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
    };
  }
  return {
    label: "Low Match",
    bg: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
  };
}

export function OpportunityCard({
  job,
  isSaved = false,
  onToggleSave,
  showMatchExplanation = true,
}: OpportunityCardProps) {
  const [showGateway, setShowGateway] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const score = Math.round(job.match_score || 80);
  const tier = getTierBadge(score, job.match_tier);
  const stipendText = formatStipend(job);

  const isVerified = (job.verification_status || "Verified") === "Verified";
  const isExpired = !!job.is_expired;

  // Deadline formatting
  let deadlineText = "Open application";
  if (job.application_deadline) {
    const d = new Date(job.application_deadline);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0 || isExpired) {
      deadlineText = "Expired / Closed";
    } else {
      deadlineText = `${diffDays} days left`;
    }
  }

  // Work Mode icon & label
  const workMode = (job.work_mode || job.workplace_type || "Remote");
  const modeIcon = workMode.toLowerCase().includes("remote")
    ? "🏠"
    : workMode.toLowerCase().includes("hybrid")
    ? "🔄"
    : "🏢";

  // PPO Label styling
  const ppoAvail = job.ppo_availability || "No PPO Mentioned";
  const hasPpo = ppoAvail.includes("Available") || ppoAvail.includes("Conversion");
  const isPotentialPpo = ppoAvail.includes("Potential");

  return (
    <div className="bg-white rounded-2xl border border-border p-5 hover:border-charcoal hover:shadow-premium transition-all flex flex-col justify-between group space-y-4">
      {/* Top Header: Company Info, Badges, Save Button */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Logo placeholder or monogram */}
            <div className="w-10 h-10 rounded-xl bg-ivory border border-border flex items-center justify-center font-heading font-black text-charcoal text-sm flex-shrink-0">
              {job.company ? job.company.charAt(0) : "N"}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-charcoal">
                  {job.company}
                </span>

                <TrustBadge
                  badge={job.trust_badge}
                  riskScore={job.fraud_risk_score}
                  riskLevel={job.fraud_risk_level}
                  size="sm"
                  onClick={() => setShowSafetyModal(true)}
                />

                <button
                  type="button"
                  onClick={() => setShowSafetyModal(true)}
                  className="text-[10px] text-stone hover:text-charcoal hover:underline flex items-center gap-0.5 ml-0.5"
                  title="View MCA registration, CIN, GSTIN, and authenticity audit"
                >
                  <Info className="w-3 h-3 text-stone" />
                  <span>Verify</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="text-[10px] text-stone hover:text-red-600 flex items-center gap-0.5 ml-1"
                  title="Report suspicious listing or fee demands"
                >
                  <Flag className="w-3 h-3 text-stone hover:text-red-600" />
                  <span>Report</span>
                </button>

                {isExpired && (
                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                    Closed
                  </span>
                )}
              </div>

              <h3 className="font-heading font-bold text-base text-charcoal group-hover:text-black line-clamp-1">
                {job.title}
              </h3>
            </div>
          </div>

          {onToggleSave && (
            <button
              onClick={() => onToggleSave(job.id)}
              className={`p-2 rounded-lg border transition-all ${
                isSaved
                  ? "bg-lime text-charcoal border-lime shadow-sm"
                  : "bg-ivory text-stone border-border hover:text-charcoal hover:border-charcoal"
              }`}
              title={isSaved ? "Saved" : "Save opportunity"}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Location & Work Mode Row */}
        <div className="flex items-center gap-3 text-xs text-stone mt-3 flex-wrap">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-stone/80" />
            <span className="font-medium text-charcoal/90">
              {job.locality ? `${job.locality}, ${job.city || ""}` : job.location}
            </span>
            {job.distance_km !== undefined && job.distance_km !== null && (
              <span className="text-[10px] text-stone bg-ivory border border-border px-1.5 py-0.2 rounded font-mono">
                {job.distance_km === 0 ? "Remote / Local" : `~${job.distance_km} km`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-stone">
            <span>{modeIcon}</span>
            <span>{workMode}</span>
          </div>

          {job.company_type && (
            <div className="flex items-center gap-1 text-[11px] text-stone">
              <Building className="w-3 h-3" />
              <span>{job.company_type}</span>
            </div>
          )}
        </div>

        {/* Key Compensation & PPO Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {/* Stipend */}
          <span className="px-2.5 py-1 rounded-md bg-ivory border border-border text-xs font-bold text-charcoal flex items-center gap-1">
            <span className="text-stone font-normal text-[10px]">Stipend:</span>
            {stipendText}
          </span>

          {/* Duration */}
          {job.duration_months && (
            <span className="px-2 py-1 rounded-md bg-ivory border border-border text-[11px] font-medium text-charcoal flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone" />
              {job.duration_months} mo
            </span>
          )}

          {/* PPO Status Pill */}
          {hasPpo ? (
            <span
              className="px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-900 flex items-center gap-1"
              title={job.ppo_terms || "Pre-Placement Offer on milestone review"}
            >
              ⭐ {ppoAvail}
            </span>
          ) : isPotentialPpo ? (
            <span className="px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-800">
              ⭐ Potential PPO
            </span>
          ) : null}

          {/* Source Platform */}
          {job.source_platform && (
            <span className="px-2 py-1 rounded-md bg-neutral-50 border border-border text-[10px] font-mono text-stone">
              {job.source_platform}
            </span>
          )}
        </div>

        {/* PPO Terms Note if available */}
        {job.ppo_terms && (
          <div className="mt-2 text-[11px] text-amber-900/90 bg-amber-50/60 border border-amber-200/50 rounded-lg p-2 leading-relaxed">
            <span className="font-semibold">PPO Details:</span> {job.ppo_terms}
          </div>
        )}

        {/* AI Match Explanation Box */}
        {showMatchExplanation && (
          <div className={`mt-3 p-3 rounded-xl border ${tier.bg} space-y-1`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${tier.dot}`} />
                <Sparkles className="w-3.5 h-3.5" />
                {tier.label}
              </span>
              <span className="font-mono text-sm">{score}%</span>
            </div>
            <p className="text-[11px] leading-relaxed line-clamp-2 opacity-95">
              {job.match_explanation ||
                "High technical compatibility identified for candidate profile."}
            </p>
          </div>
        )}

        {/* Technical Skills Pills */}
        <div className="flex flex-wrap gap-1 mt-3">
          {(job.required_skills || []).slice(0, 4).map((s: string) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded bg-ivory border border-border text-[11px] font-mono text-stone-dark"
            >
              {s}
            </span>
          ))}
          {(job.required_skills || []).length > 4 && (
            <span className="px-1.5 py-0.5 text-[10px] text-stone">
              +{(job.required_skills || []).length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Deadline, View Details, Apply Now */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
        <span className="text-[11px] text-stone font-medium flex items-center gap-1">
          <Clock className="w-3 h-3 text-stone/70" />
          {deadlineText}
        </span>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/jobs/${job.id}`}>
            <Button variant="ghost" size="sm" className="text-xs font-semibold">
              View Details
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </Link>

          {job.is_application_blocked ? (
            <button
              type="button"
              onClick={() => setShowGateway(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-semibold shadow-subtle transition-all cursor-pointer"
              title="Application Blocked: Demands candidate fees or high scam risk"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Blocked (Scam Alert)</span>
            </button>
          ) : job.application_url ? (
            <button
              type="button"
              onClick={() => setShowGateway(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-charcoal text-white hover:bg-black text-xs font-semibold transition-all shadow-subtle hover:scale-[1.02] cursor-pointer"
            >
              <span>Apply Now</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Safety & Fraud Protection Modals */}
      <SafeApplicationGatewayModal
        isOpen={showGateway}
        onClose={() => setShowGateway(false)}
        job={job}
        onOpenReport={() => setShowReportModal(true)}
      />

      <CompanySafetyDetailsModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        companyName={job.company}
      />

      <ReportOpportunityModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        job={job}
      />
    </div>
  );
}
