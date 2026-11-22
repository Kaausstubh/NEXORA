"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Bookmark,
  CheckCircle2,
  Briefcase,
  ArrowRight,
  ChevronRight,
  Cpu,
  MapPin,
  Building2,
  ExternalLink,
  Sliders,
  DollarSign
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MatchRing } from "@/components/ui/MatchRing";
import { api, getUser } from "@/lib/api";
import { formatStipend } from "@/components/OpportunityCard";

export default function DashboardOverviewPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white rounded-lg w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-border" />
          ))}
        </div>
        <div className="h-72 bg-white rounded-xl border border-border" />
      </div>
    );
  }

  const profileCompletion = data?.profile_completion || 100;
  const totalMatching = data?.total_matching_jobs || 8;
  const avgMatch = data?.average_match_score || 88.4;
  const savedCount = data?.saved_opportunities_count || 0;
  const recommendedJobs = data?.top_recommended_jobs || [];
  const topCompanies = data?.top_matching_companies || [];
  const skillDemand = data?.skill_demand || [];
  const insights = data?.career_insights || [];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black tracking-tight text-charcoal">
            {getGreeting()}, {user?.name || "Candidate"}.
          </h1>
          <p className="text-sm text-stone mt-1">
            NEXORA semantic engine evaluated {totalMatching} live opportunities aligned with your vector profile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/matches">
            <Button variant="accent" size="sm" className="shadow-sm">
              <Sparkles className="w-4 h-4 mr-1.5" />
              View Smart Matches
            </Button>
          </Link>
          <Link href="/dashboard/agent">
            <Button variant="secondary" size="sm">
              AI Strategy Session
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="flex items-center justify-between p-5">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold tracking-wider text-stone">
              Profile Completeness
            </span>
            <p className="text-2xl font-heading font-black text-charcoal">
              {profileCompletion}%
            </p>
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Dense Vector Indexed
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-ivory border border-border flex items-center justify-center text-charcoal font-bold">
            <Cpu className="w-6 h-6 text-charcoal" />
          </div>
        </Card>

        {/* Metric 2 */}
        <Card className="flex items-center justify-between p-5">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold tracking-wider text-stone">
              Total Matching Jobs
            </span>
            <p className="text-2xl font-heading font-black text-charcoal">
              {totalMatching}
            </p>
            <span className="text-[11px] text-stone">
              Across active pgvector catalog
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-ivory border border-border flex items-center justify-center text-charcoal font-bold">
            <Briefcase className="w-6 h-6 text-charcoal" />
          </div>
        </Card>

        {/* Metric 3 */}
        <Card className="flex items-center justify-between p-5">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold tracking-wider text-stone">
              Average Match Score
            </span>
            <p className="text-2xl font-heading font-black text-lime-dark text-[#426c14]">
              {avgMatch}%
            </p>
            <span className="text-[11px] text-stone">
              60% semantic + 25% skills
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F3FBDF] border border-lime flex items-center justify-center text-charcoal font-bold">
            <TrendingUp className="w-6 h-6 text-[#426c14]" />
          </div>
        </Card>

        {/* Metric 4 */}
        <Card className="flex items-center justify-between p-5">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold tracking-wider text-stone">
              Saved Opportunities
            </span>
            <p className="text-2xl font-heading font-black text-charcoal">
              {savedCount}
            </p>
            <span className="text-[11px] text-stone">
              Bookmarked for application
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-ivory border border-border flex items-center justify-center text-charcoal font-bold">
            <Bookmark className="w-6 h-6 text-charcoal" />
          </div>
        </Card>
      </div>

      {/* Main Grid: Recommended Jobs & Skill Demand Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recommended Opportunities (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h2 className="font-heading font-bold text-lg text-charcoal">
                Top Recommended Opportunities
              </h2>
            </div>
            <Link href="/dashboard/matches" className="text-xs font-semibold text-stone hover:text-charcoal flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recommendedJobs.slice(0, 4).map((job: any) => (
              <div
                key={job.id}
                className="bg-white rounded-xl p-5 border border-border hover:border-charcoal transition-all shadow-subtle group space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-base text-charcoal group-hover:text-black">
                        {job.title}
                      </h3>
                      {job.verification_status === "Verified" && (
                        <span className="text-[10px] font-bold text-[#1B5E20] bg-[#E8F5E9] px-1.5 py-0.5 rounded">
                          🟢 Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone mt-0.5">
                      {job.company} • {job.locality ? `${job.locality}, ${job.city || ""}` : job.location} ({job.work_mode || job.workplace_type})
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-charcoal">
                      <span>💰 {formatStipend(job)}</span>
                      {job.ppo_availability && job.ppo_availability.includes("PPO") && (
                        <span className="text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          ⭐ {job.ppo_availability}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-heading font-black text-lg text-charcoal block">
                      {Math.round(job.match_score || 85)}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#426c14] tracking-wider">
                      {job.match_tier || "Match"}
                    </span>
                  </div>
                </div>

                {job.match_explanation && (
                  <div className="bg-ivory border border-border rounded-lg p-3 text-xs text-charcoal leading-relaxed">
                    <span className="font-semibold text-stone-dark block mb-0.5">Why this matches you:</span>
                    {job.match_explanation}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs">
                  <div className="flex flex-wrap gap-1">
                    {(job.required_skills || []).slice(0, 4).map((skill: string) => (
                      <span key={skill} className="px-2 py-0.5 bg-ivory text-stone-dark rounded text-[11px] font-mono border border-border">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <Link href={`/dashboard/jobs/${job.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs font-semibold">
                      Inspect Match <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Skill Demand Visualization & Matching Companies */}
        <div className="lg:col-span-5 space-y-6">
          {/* Skill Demand Chart */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="font-heading font-bold text-base text-charcoal">
                  Market Skill Demand
                </h3>
                <p className="text-xs text-stone">Frequency across AI & Backend catalog</p>
              </div>
              <Badge variant="lime" size="sm">Active Index</Badge>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillDemand} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="skill"
                    width={110}
                    tick={{ fontSize: 11, fill: "#85857D" }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#191A18", color: "#FFFFFF", borderRadius: 8, fontSize: 12, border: "none" }}
                    formatter={(val: any) => [`${val}% demand frequency`, "Market Affinity"]}
                  />
                  <Bar dataKey="demand" radius={[0, 4, 4, 0]}>
                    {skillDemand.map((entry: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={idx === 0 ? "#C7F36B" : idx === 1 ? "#A2D84C" : "#191A18"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top Matching Companies */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-heading font-bold text-base text-charcoal">
                Top Matching Employers
              </h3>
              <Badge variant="stone">High Affinity</Badge>
            </div>

            <div className="divide-y divide-border">
              {topCompanies.map((c: any) => (
                <div key={c.company} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-charcoal">{c.company}</h4>
                    <span className="text-[11px] text-stone">{c.tag} • {c.openings} open roles</span>
                  </div>
                  <Badge variant="lime">{c.match_rate} Match</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* AI Career Insights Row */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-700" />
          <h2 className="font-heading font-bold text-lg text-charcoal">
            Algorithmic Career Insights
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight: any, idx: number) => (
            <Card key={idx} className="space-y-2 border-l-4 border-l-lime">
              <div className="flex items-center justify-between">
                <Badge variant={idx === 0 ? "lime" : idx === 1 ? "orange" : "stone"} size="sm">
                  {insight.badge}
                </Badge>
              </div>
              <h4 className="font-heading font-bold text-sm text-charcoal">
                {insight.title}
              </h4>
              <p className="text-xs text-stone leading-relaxed">
                {insight.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
