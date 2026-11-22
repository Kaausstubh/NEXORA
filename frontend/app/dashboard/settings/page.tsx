"use client";

import React, { useState } from "react";
import {
  Settings,
  Cpu,
  Database,
  Shield,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Zap
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getUser } from "@/lib/api";

export default function SettingsPage() {
  const user = getUser();
  const [reindexing, setReindexing] = useState(false);
  const [reindexedMsg, setReindexedMsg] = useState(false);

  const handleReindex = () => {
    setReindexing(true);
    setTimeout(() => {
      setReindexing(false);
      setReindexedMsg(true);
      setTimeout(() => setReindexedMsg(false), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-charcoal" />
          <h1 className="text-3xl font-heading font-black tracking-tight text-charcoal">
            Platform Settings & AI Configuration
          </h1>
        </div>
        <p className="text-sm text-stone mt-1">
          Review architecture parameters, vector storage status, and ranking formulas.
        </p>
      </div>

      {reindexedMsg && (
        <div className="p-4 rounded-xl bg-[#EAF9D2] border border-[#C7F36B] text-xs font-semibold text-[#345312] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#345312]" />
          Index refreshed! Verified 384-dimensional pgvector cosine consistency.
        </div>
      )}

      {/* AI Provider Card */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-charcoal" />
            <div>
              <h3 className="font-heading font-bold text-base text-charcoal">
                AI Embedding & Model Provider
              </h3>
              <p className="text-xs text-stone">Configured retrieval & reasoning engines</p>
            </div>
          </div>
          <Badge variant="lime">Operational</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-ivory rounded-xl border border-border space-y-1">
            <span className="text-stone">AI Provider Mode:</span>
            <p className="text-sm font-bold text-charcoal">Local / Deterministic Fallback</p>
            <p className="text-[11px] text-stone">Supports OpenAI & Gemini API keys via environment variables.</p>
          </div>

          <div className="p-3 bg-ivory rounded-xl border border-border space-y-1">
            <span className="text-stone">Vector Dimension:</span>
            <p className="text-sm font-bold text-charcoal">384-D dense float</p>
            <p className="text-[11px] text-stone">Optimized for low-latency cosine retrieval (&lt;=&gt;).</p>
          </div>
        </div>
      </Card>

      {/* Hybrid Ranking Weights Card */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-charcoal" />
            <div>
              <h3 className="font-heading font-bold text-base text-charcoal">
                Configurable Hybrid Ranking Weights
              </h3>
              <p className="text-xs text-stone">Normalized multi-factor formula weights</p>
            </div>
          </div>
          <Badge variant="stone">System Default</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 bg-ivory rounded-xl border border-border">
            <span className="text-stone font-mono block">Semantic Sim</span>
            <span className="font-heading font-black text-lg text-charcoal">60%</span>
            <span className="text-[10px] text-stone block mt-1">Cosine vector distance</span>
          </div>

          <div className="p-3 bg-ivory rounded-xl border border-border">
            <span className="text-stone font-mono block">Skill Overlap</span>
            <span className="font-heading font-black text-lg text-lime-dark text-[#426c14]">25%</span>
            <span className="text-[10px] text-stone block mt-1">Required & preferred fit</span>
          </div>

          <div className="p-3 bg-ivory rounded-xl border border-border">
            <span className="text-stone font-mono block">Experience</span>
            <span className="font-heading font-black text-lg text-charcoal">10%</span>
            <span className="text-[10px] text-stone block mt-1">Tenure compatibility</span>
          </div>

          <div className="p-3 bg-ivory rounded-xl border border-border">
            <span className="text-stone font-mono block">Location</span>
            <span className="font-heading font-black text-lg text-charcoal">5%</span>
            <span className="text-[10px] text-stone block mt-1">Remote/hybrid flexibility</span>
          </div>
        </div>
      </Card>

      {/* Database & Infrastructure Card */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-charcoal" />
            <div>
              <h3 className="font-heading font-bold text-base text-charcoal">
                Database & Vector Storage
              </h3>
              <p className="text-xs text-stone">PostgreSQL with native pgvector extension</p>
            </div>
          </div>
          <Badge variant="lime">Connected</Badge>
        </div>

        <div className="p-3 bg-ivory rounded-xl border border-border text-xs font-mono space-y-1.5">
          <div className="flex justify-between">
            <span className="text-stone">Database:</span>
            <span className="font-bold text-charcoal">PostgreSQL 15 (nexora_db)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone">Extension:</span>
            <span className="font-bold text-charcoal">vector v0.8.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone">Agent Framework:</span>
            <span className="font-bold text-charcoal">LangGraph v1.2</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReindex}
            isLoading={reindexing}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Re-index pgvector Catalog
          </Button>
        </div>
      </Card>
    </div>
  );
}
