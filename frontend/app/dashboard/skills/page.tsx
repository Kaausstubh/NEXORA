"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Cpu,
  Target
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MatchRing } from "@/components/ui/MatchRing";
import { api } from "@/lib/api";

const TARGET_ROLE_PRESETS = [
  "AI Backend Engineer",
  "Senior AI Systems Engineer",
  "Lead Python Developer",
  "MLOps & Platform Engineer",
  "Full Stack AI Engineer"
];

function SkillGapContent() {
  const searchParams = useSearchParams();
  const initialTarget = searchParams.get("target") || "AI Backend Engineer";

  const [selectedTarget, setSelectedTarget] = useState(initialTarget);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGapData(selectedTarget);
  }, [selectedTarget]);

  const loadGapData = async (targetRole: string) => {
    setLoading(true);
    try {
      const res = await api.getSkillGap(targetRole);
      setData(res);
    } catch (err) {
      console.error("Failed to load skill gap data", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime animate-pulse" />
            <h1 className="text-3xl font-heading font-black tracking-tight text-charcoal">
              Skill Gap Diagnostics
            </h1>
          </div>
          <p className="text-sm text-stone mt-1">
            Evaluate your competencies against specific market requirements and receive actionable learning priorities.
          </p>
        </div>
      </div>

      {/* Target Role Selector Pills */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-subtle flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-stone uppercase tracking-wider mr-2">
          Target Role:
        </span>
        {TARGET_ROLE_PRESETS.map((role) => {
          const isSelected = selectedTarget === role;
          return (
            <button
              key={role}
              onClick={() => setSelectedTarget(role)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-charcoal text-lime shadow-sm"
                  : "bg-ivory border border-border text-stone-dark hover:text-charcoal hover:border-charcoal"
              }`}
            >
              {role}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-44 bg-white rounded-2xl border border-border" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-white rounded-2xl border border-border" />
            <div className="h-64 bg-white rounded-2xl border border-border" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Overview Hero Card */}
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <MatchRing score={data.overall_compatibility} size={84} strokeWidth={8} />
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone">
                  Role Compatibility Score
                </span>
                <h3 className="font-heading font-extrabold text-2xl text-charcoal">
                  {data.target_role_or_job}
                </h3>
                <p className="text-xs text-stone max-w-xl leading-relaxed">
                  {data.ai_guidance}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 text-center font-mono">
              <div className="p-3 bg-ivory rounded-xl border border-border">
                <span className="text-xs text-stone block">Matched</span>
                <span className="font-bold text-lg text-emerald-700">{data.matched_count}</span>
              </div>
              <div className="p-3 bg-ivory rounded-xl border border-border">
                <span className="text-xs text-stone block">Gaps Identified</span>
                <span className="font-bold text-lg text-burnt-orange">{data.missing_count}</span>
              </div>
            </div>
          </div>

          {/* Two Columns: Matched vs Missing Required / Preferred Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-heading font-bold text-base text-charcoal">
                    Skills Already Matched ({data.matched_count})
                  </h4>
                </div>
                <Badge variant="lime" size="sm">Verified</Badge>
              </div>

              <div className="space-y-2.5">
                {(data.skills || [])
                  .filter((s: any) => s.status === "matched")
                  .map((item: any) => (
                    <div
                      key={item.skill_name}
                      className="p-3 rounded-xl bg-ivory border border-border flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-charcoal block">
                          {item.skill_name}
                        </span>
                        <span className="text-[11px] text-stone">
                          {item.learning_resource_hint}
                        </span>
                      </div>
                      <Badge variant="stone" size="sm">{item.importance}</Badge>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Missing Required & Preferred Skills */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-burnt-orange" />
                  <h4 className="font-heading font-bold text-base text-charcoal">
                    Identified Missing Requirements ({data.missing_count})
                  </h4>
                </div>
                <Badge variant="orange" size="sm">Action Required</Badge>
              </div>

              <div className="space-y-2.5">
                {(data.skills || [])
                  .filter((s: any) => s.status !== "matched")
                  .map((item: any) => (
                    <div
                      key={item.skill_name}
                      className="p-3 rounded-xl bg-[#FDF8F5] border border-burnt-orange/30 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-charcoal block">
                          {item.skill_name}
                        </span>
                        <span className="text-[11px] text-stone">
                          {item.learning_resource_hint}
                        </span>
                      </div>
                      <Badge variant={item.importance === "Critical" ? "orange" : "stone"} size="sm">
                        {item.importance}
                      </Badge>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* LLM Learning Roadmap & Priorities */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <h4 className="font-heading font-bold text-base text-charcoal">
                  Algorithmic Learning Priorities
                </h4>
              </div>
              <Badge variant="lime">High ROI</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(data.learning_priorities || []).map((p: string, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-ivory border border-border space-y-2 hover:border-charcoal transition-all"
                >
                  <span className="w-6 h-6 rounded-md bg-charcoal text-lime flex items-center justify-center font-mono font-bold text-xs">
                    0{idx + 1}
                  </span>
                  <p className="text-xs text-charcoal font-medium leading-relaxed">
                    {p}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default function SkillGapPage() {
  return (
    <Suspense fallback={<div className="p-8 text-stone text-sm animate-pulse">Loading skill gap diagnostics...</div>}>
      <SkillGapContent />
    </Suspense>
  );
}
