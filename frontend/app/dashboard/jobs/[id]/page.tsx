"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  ShieldCheck,
  GraduationCap,
  Award,
  Layers,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MatchRing } from "@/components/ui/MatchRing";
import { api } from "@/lib/api";
import { formatStipend, getTierBadge } from "@/components/OpportunityCard";
import { TrustBadge } from "@/components/TrustBadge";
import { SafeApplicationGatewayModal } from "@/components/SafeApplicationGatewayModal";
import { CompanySafetyDetailsModal } from "@/components/CompanySafetyDetailsModal";
import { ReportOpportunityModal } from "@/components/ReportOpportunityModal";
import { Lock, Flag, FileCheck2, PhoneCall, ShieldAlert, CheckCircle } from "lucide-react";

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<any | null>(null);
  const [match, setMatch] = useState<any | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGateway, setShowGateway] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
    }
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      const res = await api.getJob(jobId);
      setJob(res.job);
      setMatch(res.match);
      setIsSaved(!!res.job.is_saved);
    } catch (err) {
      console.error("Failed to load job details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!job) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      if (nextSaved) {
        await api.saveJob(job.id);
      } else {
        await api.unsaveJob(job.id);
      }
    } catch (err) {
      setIsSaved(!nextSaved);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-white rounded" />
        <div className="h-32 bg-white rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 h-96 bg-white rounded-2xl" />
          <div className="lg:col-span-4 h-96 bg-white rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="text-center py-16 space-y-4">
        <p className="text-stone">Opportunity not found or expired.</p>
        <Link href="/dashboard/discover">
          <Button variant="secondary" size="sm">
            Back to Discover
          </Button>
        </Link>
      </Card>
    );
  }

  const isVerified = (job.verification_status || "Verified") === "Verified";
  const stipendText = formatStipend(job);
  const workMode = job.work_mode || job.workplace_type || "Remote";
  const ppoAvail = job.ppo_availability || "No PPO Mentioned";
  const hasPpo = ppoAvail.includes("Available") || ppoAvail.includes("Conversion");

  const tier = match ? getTierBadge(match.final_score, match.tier) : null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to opportunities
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-charcoal">
                {job.title}
              </h1>

              <TrustBadge
                badge={job.trust_badge}
                riskScore={job.fraud_risk_score}
                riskLevel={job.fraud_risk_level}
                onClick={() => setShowSafetyModal(true)}
              />

              <button
                type="button"
                onClick={() => setShowSafetyModal(true)}
                className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                title="View verified MCA records, CIN, and authenticity audit"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>MCA Verified Details</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                title="Report fee demands or fraud indicators"
              >
                <Flag className="w-3.5 h-3.5 text-red-600" />
                <span>Report Fraud</span>
              </button>

              {job.is_expired && (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  Closed / Expired
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-stone pt-1">
              <span className="flex items-center gap-1.5 font-bold text-charcoal">
                <Building2 className="w-4 h-4 text-stone" /> {job.company}
              </span>

              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-stone" />
                {job.locality ? `${job.locality}, ${job.city || ""}` : job.location}
              </span>

              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-stone" /> {job.opportunity_type || job.employment_type}
                {job.experience_required > 0 ? ` • ${job.experience_required}y exp` : " • Open to Students / Freshers"}
              </span>

              {job.company_type && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-ivory border border-border text-charcoal">
                  {job.company_type}
                </span>
              )}
            </div>
          </div>

          {/* Save & Apply Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleToggleSave}
              className={`p-2.5 rounded-xl border transition-all ${
                isSaved
                  ? "bg-lime text-charcoal border-lime shadow-sm"
                  : "bg-ivory text-stone border-border hover:text-charcoal hover:border-charcoal"
              }`}
              title={isSaved ? "Saved" : "Save opportunity"}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>

            {job.is_application_blocked ? (
              <Button
                variant="danger"
                size="md"
                onClick={() => setShowGateway(true)}
                className="shadow-subtle font-bold flex items-center gap-2 cursor-pointer"
                title="Direct apply blocked due to scam alert"
              >
                <Lock className="w-4 h-4" />
                Application Blocked (Scam Alert)
              </Button>
            ) : job.application_url ? (
              <Button
                variant="accent"
                size="md"
                onClick={() => setShowGateway(true)}
                className="shadow-subtle font-bold flex items-center gap-2 cursor-pointer"
              >
                <span>Apply via Safe Gateway</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            ) : null}
          </div>
        </div>

        {/* Highlight Meta Bar: Stipend, Mode, Duration, PPO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
          <div className="bg-ivory p-3 rounded-xl border border-border">
            <span className="text-[10px] uppercase font-bold text-stone block">Monthly Stipend</span>
            <span className="text-sm font-black text-charcoal">{stipendText}</span>
            <span className="text-[10px] text-stone block">{job.stipend_type}</span>
          </div>

          <div className="bg-ivory p-3 rounded-xl border border-border">
            <span className="text-[10px] uppercase font-bold text-stone block">Work Mode</span>
            <span className="text-sm font-black text-charcoal">{workMode}</span>
            <span className="text-[10px] text-stone block truncate">{job.remote_details || "Work from India"}</span>
          </div>

          <div className="bg-ivory p-3 rounded-xl border border-border">
            <span className="text-[10px] uppercase font-bold text-stone block">Duration</span>
            <span className="text-sm font-black text-charcoal">{job.duration_months || 3} Months</span>
            <span className="text-[10px] text-stone block">Internship Period</span>
          </div>

          <div className={`p-3 rounded-xl border ${hasPpo ? "bg-amber-50/70 border-amber-200" : "bg-ivory border-border"}`}>
            <span className="text-[10px] uppercase font-bold text-stone block">Pre-Placement Offer (PPO)</span>
            <span className={`text-sm font-black ${hasPpo ? "text-amber-950" : "text-charcoal"}`}>
              {ppoAvail}
            </span>
            <span className="text-[10px] text-stone block truncate">{job.ppo_terms || "Subject to evaluation"}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Description & Right Match Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Description, PPO Details, Eligibility, Tasks (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="space-y-6">
            {/* Dedicated PPO Breakdown Section */}
            {hasPpo && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                  <Award className="w-4 h-4 text-amber-700" />
                  Pre-Placement Offer (PPO) Opportunity Details
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  <strong>Conversion Terms:</strong> {job.ppo_terms || "Opportunity to receive full-time placement upon meeting performance goals."}
                </p>
                {job.ppo_eligible_criteria && (
                  <p className="text-xs text-amber-900/90 leading-relaxed">
                    <strong>PPO Eligibility:</strong> {job.ppo_eligible_criteria}
                  </p>
                )}
              </div>
            )}

            <div>
              <h2 className="font-heading font-bold text-lg text-charcoal mb-2">
                About the Opportunity
              </h2>
              <p className="text-sm text-stone leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </div>

            {/* Eligibility Criteria */}
            {job.eligibility_criteria && job.eligibility_criteria.length > 0 && (
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-charcoal" />
                  <h3 className="font-heading font-bold text-base text-charcoal">
                    Eligibility & Academic Criteria
                  </h3>
                </div>
                <ul className="space-y-2">
                  {job.eligibility_criteria.map((crit: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-charcoal leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="pt-4 border-t border-border space-y-3">
                <h3 className="font-heading font-bold text-base text-charcoal">
                  Key Responsibilities
                </h3>
                <ul className="space-y-2">
                  {job.responsibilities.map((r: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-charcoal leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-charcoal mt-1.5 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Qualifications */}
            {job.qualifications && job.qualifications.length > 0 && (
              <div className="pt-4 border-t border-border space-y-3">
                <h3 className="font-heading font-bold text-base text-charcoal">
                  Qualifications & Background
                </h3>
                <ul className="space-y-2">
                  {job.qualifications.map((q: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-charcoal leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Technologies */}
            <div className="pt-4 border-t border-border space-y-4">
              <div>
                <h3 className="font-heading font-bold text-sm text-charcoal mb-2">
                  Required Skills & Technologies
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(job.required_skills || []).map((s: string) => (
                    <span key={s} className="px-2.5 py-1 bg-ivory border border-border rounded-md text-xs font-mono font-medium text-charcoal">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {job.preferred_skills && job.preferred_skills.length > 0 && (
                <div>
                  <h3 className="font-heading font-bold text-sm text-stone mb-2">
                    Preferred Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.preferred_skills.map((s: string) => (
                      <span key={s} className="px-2.5 py-1 bg-ivory border border-border rounded-md text-xs font-mono text-stone-dark">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Authenticity & Verification Audit */}
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone">
                <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
                Authenticity Verification Details
              </div>
              <p className="text-[11px] text-stone leading-relaxed">
                Ingested from <strong>{job.source_platform || "Official Employer Careers Portal"}</strong>.
                Direct application URL validated against verified employer domain registries.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: AI Match Intelligence Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-lime p-6 shadow-premium space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <h3 className="font-heading font-bold text-base text-charcoal">
                  AI Fit Analysis
                </h3>
              </div>
              {match && (
                <Badge variant={match.tier === "Excellent Match" ? "lime" : "stone"} size="sm">
                  {match.tier}
                </Badge>
              )}
            </div>

            {match ? (
              <div className="space-y-6">
                {/* Score Ring */}
                <div className="flex items-center justify-center py-2">
                  <MatchRing score={match.final_score} size={96} strokeWidth={8} />
                </div>

                {/* Score breakdown metrics (60% Semantic, 25% Skill, 10% Experience, 5% Location) */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-stone">Semantic (60%):</span>
                    <span className="font-bold text-charcoal">{match.breakdown.semantic_score}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-stone">Skill Overlap (25%):</span>
                    <span className="font-bold text-charcoal">{match.breakdown.skill_score}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-stone">Experience/Eligibility (10%):</span>
                    <span className="font-bold text-charcoal">{match.breakdown.experience_score}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone">Location & Mode (5%):</span>
                    <span className="font-bold text-charcoal">{match.breakdown.location_score}%</span>
                  </div>
                </div>

                {/* Why It Matches Grounded Explanation */}
                {match.explanation.why_match && (
                  <div className="space-y-1 pt-2 border-t border-border">
                    <span className="text-[11px] uppercase font-bold text-[#2E7D32] block">
                      Why This Matches:
                    </span>
                    <p className="text-xs text-charcoal leading-relaxed">
                      {match.explanation.why_match}
                    </p>
                  </div>
                )}

                {/* Matched skills chips */}
                {match.explanation.matched_skills && match.explanation.matched_skills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase font-bold text-stone block">
                      Matched Skills:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {match.explanation.matched_skills.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-[#EAF9D2] border border-[#C7F36B] text-[11px] font-mono text-[#345312]">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing skills chips */}
                {match.explanation.missing_skills && match.explanation.missing_skills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase font-bold text-stone block">
                      Missing Skills:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {match.explanation.missing_skills.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-[#FDF0E9] border border-[#E58B5A] text-[11px] font-mono text-[#8C3A11]">
                          ⚠️ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* How to improve match score */}
                {match.explanation.improvement_recommendation && (
                  <div className="p-3 bg-ivory border border-border rounded-xl space-y-1">
                    <span className="text-[11px] uppercase font-bold text-charcoal block">
                      💡 How to Improve Match:
                    </span>
                    <p className="text-xs text-stone leading-relaxed">
                      {match.explanation.improvement_recommendation}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-border flex flex-col gap-2">
                  <Link href={`/dashboard/skills?target=${encodeURIComponent(job.title)}`}>
                    <Button variant="secondary" size="sm" className="w-full text-xs font-semibold">
                      Analyze Skill Gap
                    </Button>
                  </Link>
                  <Link href="/dashboard/agent">
                    <Button variant="ghost" size="sm" className="w-full text-xs font-semibold">
                      Ask NEXORA AI Agent
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone leading-relaxed">
                Sign in and complete your profile to compute personalized multi-factor similarity metrics.
              </p>
            )}
          </div>

          {/* Employer Trust & Student Protection Card */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-heading font-bold text-sm text-charcoal">
                  Employer Trust & Safety
                </h3>
              </div>
              <TrustBadge badge={job.trust_badge} riskScore={job.fraud_risk_score} showRiskScore={false} size="sm" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-ivory border border-border space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-stone">Fraud Risk Assessment:</span>
                  <span className="font-bold text-charcoal font-mono">
                    {job.fraud_risk_score || 10}/100 ({job.fraud_risk_level || "Low Risk"})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone">Recruiter Authenticity:</span>
                  <span className="font-semibold text-emerald-700">
                    {job.recruiter_verification || "Verified Enterprise"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone">Zero-Fee Compliance:</span>
                  <span className={`font-semibold ${job.is_fee_required ? "text-red-700" : "text-emerald-700"}`}>
                    {job.is_fee_required ? "Violated (Fees Demanded)" : "100% Free Application"}
                  </span>
                </div>
              </div>

              {job.is_application_blocked && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-1">
                  <div className="flex items-center gap-1 font-bold text-red-700">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Application Blocked</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-800">
                    {job.block_reason || "Direct application locked due to fraud risk indicators."}
                  </p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-neutral-50 border border-border text-[11px] text-stone space-y-1">
                <div className="flex items-center gap-1 font-semibold text-charcoal">
                  <PhoneCall className="w-3 h-3 text-burnt-orange" />
                  <span>Cyber Crime Helpline 1930</span>
                </div>
                <p className="leading-relaxed">
                  Under Indian UGC and labour norms, employers cannot demand registration or training fees from students.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSafetyModal(true)}
                  className="w-full text-xs font-semibold text-charcoal border-border hover:bg-ivory"
                >
                  View Verified MCA Records
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReportModal(true)}
                  className="w-full text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Report Suspicious Listing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Fraud Modals */}
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
