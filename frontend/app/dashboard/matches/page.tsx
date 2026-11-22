"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Bookmark,
  ExternalLink,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  Award
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MatchRing } from "@/components/ui/MatchRing";
import { api } from "@/lib/api";
import { formatStipend, getTierBadge } from "@/components/OpportunityCard";

export default function SmartMatchesPage() {
  const [activeTier, setActiveTier] = useState<"all" | "excellent" | "strong" | "moderate" | "low">("all");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const res = await api.getSmartMatches();
      setData(res);
    } catch (err) {
      console.error("Failed to load smart matches", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white rounded-lg w-1/4" />
        <div className="h-12 bg-white rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white rounded-xl border border-border" />
          ))}
        </div>
      </div>
    );
  }

  const excellentMatches = data?.excellent_matches || data?.best_matches || [];
  const strongMatches = data?.strong_matches || [];
  const moderateMatches = data?.moderate_matches || data?.potential_matches || [];
  const lowMatches = data?.low_matches || [];

  let displayedMatches: any[] = [];
  if (activeTier === "all") {
    displayedMatches = [...excellentMatches, ...strongMatches, ...moderateMatches, ...lowMatches];
  } else if (activeTier === "excellent") {
    displayedMatches = excellentMatches;
  } else if (activeTier === "strong") {
    displayedMatches = strongMatches;
  } else if (activeTier === "moderate") {
    displayedMatches = moderateMatches;
  } else {
    displayedMatches = lowMatches;
  }

  const totalMatchesCount =
    excellentMatches.length + strongMatches.length + moderateMatches.length + lowMatches.length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime animate-pulse" />
            <h1 className="text-3xl font-heading font-black tracking-tight text-charcoal">
              AI Smart Matches
            </h1>
          </div>
          <p className="text-sm text-stone mt-1">
            Grounded 4-tier ranking: 60% dense vector similarity, 25% technical skills, 10% eligibility/experience, 5% location proximity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="lime" size="md">
            Formula: 60 / 25 / 10 / 5 Weighting
          </Badge>
        </div>
      </div>

      {/* 4 Tier Selector Pills */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-border rounded-xl shadow-subtle flex-wrap w-fit">
        <button
          onClick={() => setActiveTier("all")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTier === "all"
              ? "bg-charcoal text-white shadow-sm"
              : "text-stone hover:text-charcoal"
          }`}
        >
          All Opportunities ({totalMatchesCount})
        </button>

        <button
          onClick={() => setActiveTier("excellent")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTier === "excellent"
              ? "bg-[#F8FDED] text-[#2D5A12] border border-lime shadow-sm"
              : "text-stone hover:text-charcoal"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#558B2F]" />
          🟢 Excellent ({excellentMatches.length})
        </button>

        <button
          onClick={() => setActiveTier("strong")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTier === "strong"
              ? "bg-blue-50 text-blue-900 border border-blue-200 shadow-sm"
              : "text-stone hover:text-charcoal"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          🔵 Strong ({strongMatches.length})
        </button>

        <button
          onClick={() => setActiveTier("moderate")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTier === "moderate"
              ? "bg-amber-50 text-amber-900 border border-amber-200 shadow-sm"
              : "text-stone hover:text-charcoal"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          🟡 Moderate ({moderateMatches.length})
        </button>

        {lowMatches.length > 0 && (
          <button
            onClick={() => setActiveTier("low")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTier === "low"
                ? "bg-rose-50 text-rose-900 border border-rose-200 shadow-sm"
                : "text-stone hover:text-charcoal"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            🔴 Low ({lowMatches.length})
          </button>
        )}
      </div>

      {/* Matches List */}
      <div className="space-y-6">
        {displayedMatches.length === 0 ? (
          <Card className="text-center py-16 text-stone text-sm">
            No opportunities currently classified in the {activeTier} tier.
          </Card>
        ) : (
          displayedMatches.map((item, idx) => {
            const job = item.job;
            const b = item.breakdown;
            const exp = item.explanation;
            const tierStyle = getTierBadge(b.final_score, item.tier);
            const stipendText = formatStipend(job);
            const isVerified = (job.verification_status || "Verified") === "Verified";
            const ppoAvail = job.ppo_availability || "No PPO Mentioned";
            const hasPpo = ppoAvail.includes("Available") || ppoAvail.includes("Conversion");

            return (
              <div
                key={job.id || idx}
                className={`bg-white rounded-2xl border p-6 sm:p-8 transition-all space-y-6 shadow-subtle ${
                  b.final_score >= 85
                    ? "border-lime hover:border-charcoal hover:shadow-premium"
                    : "border-border hover:border-charcoal"
                }`}
              >
                {/* Header Line */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-charcoal">
                        {job.title}
                      </h2>

                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${tierStyle.bg}`}>
                        {item.tier}
                      </span>

                      {isVerified && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone font-medium pt-1">
                      <span className="flex items-center gap-1 text-charcoal font-bold">
                        <Building2 className="w-3.5 h-3.5 text-stone" />
                        {job.company}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone" />
                        {job.locality ? `${job.locality}, ${job.city || ""}` : job.location}
                      </span>

                      <span>•</span>

                      <span className="font-bold text-charcoal">
                        Stipend: {stipendText}
                      </span>

                      {job.duration_months && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone" />
                          {job.duration_months} mo
                        </span>
                      )}

                      {hasPpo && (
                        <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⭐ {ppoAvail}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match Score Indicator */}
                  <div className="flex items-center gap-3 shrink-0">
                    <MatchRing score={b.final_score} size={72} strokeWidth={6} />
                  </div>
                </div>

                {/* 4 Factor Breakdown Bars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-ivory border border-border">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone font-mono">Semantic Sim (60%)</span>
                      <span className="font-bold text-charcoal">{b.semantic_score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E5E4DC] rounded-full overflow-hidden">
                      <div className="h-full bg-charcoal rounded-full" style={{ width: `${b.semantic_score}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone font-mono">Skill Match (25%)</span>
                      <span className="font-bold text-charcoal">{b.skill_score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E5E4DC] rounded-full overflow-hidden">
                      <div className="h-full bg-[#7DB637] rounded-full" style={{ width: `${b.skill_score}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone font-mono">Experience/Batch (10%)</span>
                      <span className="font-bold text-charcoal">{b.experience_score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E5E4DC] rounded-full overflow-hidden">
                      <div className="h-full bg-charcoal rounded-full" style={{ width: `${b.experience_score}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone font-mono">Location Proximity (5%)</span>
                      <span className="font-bold text-charcoal">{b.location_score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E5E4DC] rounded-full overflow-hidden">
                      <div className="h-full bg-charcoal rounded-full" style={{ width: `${b.location_score}%` }} />
                    </div>
                  </div>
                </div>

                {/* Grounded Match Explanations: Two Column Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Why this opportunity matches */}
                  <div className="p-4 rounded-xl bg-[#F8FDED] border border-lime/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#345312] uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Why this opportunity matches</span>
                    </div>
                    <p className="text-xs text-[#2A4410] leading-relaxed">
                      {exp.why_match}
                    </p>
                    {exp.matched_skills && exp.matched_skills.length > 0 && (
                      <div className="pt-2 border-t border-lime/30 flex flex-wrap gap-1">
                        <span className="text-[10px] text-stone font-semibold uppercase block w-full mb-0.5">
                          Matched Technical Skills:
                        </span>
                        {exp.matched_skills.map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-white border border-lime/40 rounded text-[11px] font-mono text-[#2A4410]">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Areas for Growth / Missing Requirements */}
                  <div className="p-4 rounded-xl bg-[#FDF8F5] border border-burnt-orange/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C3A11] uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-burnt-orange" />
                      <span>Identified Growth Areas</span>
                    </div>
                    <p className="text-xs text-[#6B2C0B] leading-relaxed">
                      {exp.why_not_perfect}
                    </p>
                    {exp.missing_skills && exp.missing_skills.length > 0 && (
                      <div className="pt-2 border-t border-burnt-orange/20 flex flex-wrap gap-1">
                        <span className="text-[10px] text-stone font-semibold uppercase block w-full mb-0.5">
                          Missing or Target Skills:
                        </span>
                        {exp.missing_skills.map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-white border border-burnt-orange/30 rounded text-[11px] font-mono text-[#8C3A11]">
                            ⚠️ {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border">
                  <div className="text-xs text-stone font-medium">
                    {exp.improvement_recommendation || exp.career_advantage || "Verified authentic listing."}
                  </div>

                  <div className="flex items-center gap-3">
                    <Link href={`/dashboard/skills?target=${encodeURIComponent(job.title)}`}>
                      <Button variant="secondary" size="sm" className="text-xs font-semibold">
                        View Skill Gap
                      </Button>
                    </Link>

                    <Link href={`/dashboard/jobs/${job.id}`}>
                      <Button variant="primary" size="sm" className="text-xs font-bold">
                        Inspect Opportunity
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>

                    {job.application_url && (
                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-charcoal text-white hover:bg-black text-xs font-bold transition-all shadow-subtle"
                      >
                        Apply Directly
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
