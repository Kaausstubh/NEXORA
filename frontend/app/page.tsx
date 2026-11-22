"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Layers,
  Search,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Compass,
  FileText,
  Sliders,
  ChevronRight,
  Shield,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MatchRing } from "@/components/ui/MatchRing";

export default function LandingPage() {
  const [selectedDemoTab, setSelectedDemoTab] = useState<"match" | "search" | "gap">("match");

  return (
    <div className="min-h-screen bg-ivory text-charcoal flex flex-col selection:bg-lime selection:text-charcoal">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-ivory/80 backdrop-blur-md border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center text-lime font-heading font-black text-lg group-hover:scale-105 transition-transform">
                N
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xl tracking-tight text-charcoal">
                  NEXORA
                </span>
                <span className="text-[10px] tracking-wider uppercase text-stone font-semibold -mt-1">
                  Career Intelligence
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone">
            <a href="#how-it-works" className="hover:text-charcoal transition-colors">How It Works</a>
            <a href="#matching" className="hover:text-charcoal transition-colors">Semantic Matching</a>
            <a href="#features" className="hover:text-charcoal transition-colors">Features</a>
            <a href="#skill-gap" className="hover:text-charcoal transition-colors">Skill Diagnostics</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="accent" size="sm" className="group">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-border">
        {/* Subtle background aesthetic grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E7E6DF_1px,transparent_1px),linear-gradient(to_bottom,#E7E6DF_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-border shadow-subtle"
            >
              <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
              <span className="text-xs font-semibold tracking-wider uppercase text-stone-dark">
                YOUR NEXT OPPORTUNITY STARTS HERE
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight text-charcoal leading-[1.08]"
            >
              Your career deserves a <span className="underline decoration-lime decoration-4 underline-offset-4">smarter</span> algorithm.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-stone max-w-2xl mx-auto leading-relaxed"
            >
              Discover opportunities that actually match your skills, experience, and ambitions.
              Let AI do the searching while you focus on growing.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-2"
            >
              <Link href="/register">
                <Button variant="accent" size="lg" className="shadow-premium">
                  Find My Match
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Explore Platform
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Interactive Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-14 max-w-5xl mx-auto"
          >
            <div className="bg-charcoal text-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-charcoal-border relative overflow-hidden">
              {/* Subtle top lime glow line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-lime to-transparent opacity-80" />

              <div className="flex flex-wrap items-center justify-between pb-6 border-b border-charcoal-border gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-stone-light font-mono ml-2">
                    NEXORA Hybrid Semantic Engine • v1.0.0
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="lime" size="sm">
                    Live Vector Retrieval
                  </Badge>
                  <span className="text-xs text-stone font-mono">pgvector: cosine &lt;=&gt;</span>
                </div>
              </div>

              {/* Two Column Preview: Candidate Profile & Job Match */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
                {/* Candidate Card */}
                <div className="lg:col-span-5 bg-charcoal-surface rounded-xl p-5 border border-charcoal-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-lime font-mono font-semibold">
                        Candidate Vector Profile
                      </span>
                      <h4 className="text-lg font-heading font-bold text-white">Alex Mercer</h4>
                      <p className="text-xs text-stone-light">Python Backend Engineer • 3 Yrs Exp</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-charcoal-light flex items-center justify-center font-heading font-bold text-sm text-lime border border-lime/30">
                      AM
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-charcoal-border">
                    <span className="text-xs text-stone font-medium">Extracted & Embedded Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Python", "FastAPI", "PostgreSQL", "RAG", "pgvector", "Docker"].map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-charcoal text-xs text-stone-light font-mono border border-charcoal-border">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-stone space-y-1 pt-2">
                    <p><span className="text-stone-light">Target Roles:</span> AI Backend Engineer, Platform Engineer</p>
                    <p><span className="text-stone-light">Preference:</span> Remote / Hybrid</p>
                  </div>
                </div>

                {/* Match Evaluation Middle Indicator */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2 py-4">
                  <div className="p-3 rounded-full bg-charcoal-surface border border-lime/30 shadow-lime-glow">
                    <Zap className="w-6 h-6 text-lime animate-bounce" />
                  </div>
                  <span className="text-[11px] font-mono text-lime font-semibold uppercase tracking-wider">
                    Hybrid Score
                  </span>
                  <span className="text-2xl font-heading font-black text-lime">94.2%</span>
                </div>

                {/* Retrieved Job Card */}
                <div className="lg:col-span-5 bg-charcoal-surface rounded-xl p-5 border border-charcoal-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-lime font-mono font-semibold">
                        Verified Indian Opportunity
                      </span>
                      <h4 className="text-lg font-heading font-bold text-white">Full Stack Engineering Intern</h4>
                      <p className="text-xs text-stone-light">PhonePe • Pune (Baner IT Corridor), MH</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white px-2.5 py-1 bg-charcoal rounded-md border border-charcoal-border block">
                        ₹50,000–₹65,000/mo
                      </span>
                      <span className="text-[10px] text-lime font-mono">⭐ PPO Available</span>
                    </div>
                  </div>

                  {/* Grounded Explanation Box */}
                  <div className="bg-[#182312] border border-lime/30 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-lime font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Grounded Match Synthesis</span>
                    </div>
                    <p className="text-xs text-[#d2eac0] leading-relaxed">
                      &ldquo;Your hands-on proficiency with Python, FastAPI, and PostgreSQL aligns directly with PhonePe&rsquo;s core stack in Pune. Eligible for full-time PPO conversion at ₹20-24 LPA.&rdquo;
                    </p>
                  </div>

                  {/* Compatibility Mini Bars */}
                  <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono text-[10px]">
                    <div className="bg-charcoal p-1.5 rounded border border-charcoal-border">
                      <span className="text-stone">Semantic</span>
                      <p className="text-lime font-bold">96%</p>
                    </div>
                    <div className="bg-charcoal p-1.5 rounded border border-charcoal-border">
                      <span className="text-stone">Skills</span>
                      <p className="text-lime font-bold">92%</p>
                    </div>
                    <div className="bg-charcoal p-1.5 rounded border border-charcoal-border">
                      <span className="text-stone">Experience</span>
                      <p className="text-lime font-bold">100%</p>
                    </div>
                    <div className="bg-charcoal p-1.5 rounded border border-charcoal-border">
                      <span className="text-stone">Location</span>
                      <p className="text-lime font-bold">100%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How NEXORA Works Section */}
      <section id="how-it-works" className="py-24 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="stone" size="md">ARCHITECTURE OVERVIEW</Badge>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-charcoal">
              Engineered for genuine career precision.
            </h2>
            <p className="text-stone text-base">
              Traditional job portals use naive keyword matching that misses great candidates. NEXORA uses deep semantic embeddings, vector similarity, and multi-factor ranking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: FileText,
                title: "Resume & Skill Parsing",
                desc: "Upload a PDF or input skills. NEXORA extracts structured competencies, tenure, and achievements with high fidelity.",
              },
              {
                step: "02",
                icon: Cpu,
                title: "Dense Vector Embedding",
                desc: "Generates 384-dimensional dense vectors capturing domain meaning, semantic relationships, and technical context.",
              },
              {
                step: "03",
                icon: Layers,
                title: "pgvector Cosine Retrieval",
                desc: "Performs instant vector similarity search combined with hard SQL constraints for location, salary, and experience.",
              },
              {
                step: "04",
                icon: Brain,
                title: "LangGraph Career Guidance",
                desc: "Autonomous conversational agent reasons over verified database opportunities to provide diagnostic advice and compare roles.",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-ivory rounded-xl p-6 border border-border hover:border-charcoal transition-all relative group"
              >
                <span className="font-heading font-bold text-3xl text-stone/40 group-hover:text-charcoal transition-colors">
                  {card.step}
                </span>
                <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center my-4 text-charcoal group-hover:bg-charcoal group-hover:text-lime transition-all">
                  <card.icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-lg text-charcoal mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-stone leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Semantic Search vs Keyword Search Comparison */}
      <section id="matching" className="py-24 bg-ivory border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <Badge variant="lime" size="md">SEMANTIC SEARCH</Badge>
              <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-charcoal leading-tight">
                Beyond keywords: Finding true conceptual fit.
              </h2>
              <p className="text-stone leading-relaxed">
                If a candidate has experience in <strong>LangChain</strong>, <strong>pgvector</strong>, and <strong>embeddings</strong>, they are inherently qualified for an <strong>AI Systems Engineer</strong> role even if the posting says &ldquo;Retrieval-Augmented Generation&rdquo;.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  "Understands equivalent technologies (Postgres ↔ PostgreSQL, K8s ↔ Kubernetes)",
                  "Identifies domain adjacency across AI, Backend, and Platform stacks",
                  "Configurable hybrid weights: 60% Semantic, 25% Skills, 10% Experience, 5% Location",
                  "Grounded explanations highlighting both strengths and missing requirements",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <Link href="/register">
                  <Button variant="primary" size="md">
                    Experience Hybrid Matching
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-premium space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="font-heading font-bold text-charcoal text-lg">
                    Matching Model Comparison
                  </span>
                  <Badge variant="stone">Benchmark Preview</Badge>
                </div>

                <div className="space-y-4">
                  {/* Legacy Keyword Search */}
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-900 uppercase tracking-wider">
                        Legacy Keyword Matching
                      </span>
                      <span className="text-xs font-mono font-bold text-red-700">Score: 42% (Missed)</span>
                    </div>
                    <p className="text-xs text-red-800">
                      Query for &ldquo;AI Engineer&rdquo; failed because candidate resume phrased experience as &ldquo;LLM orchestration, vector search &amp; Python APIs&rdquo;. Exact keyword strings did not align.
                    </p>
                  </div>

                  {/* NEXORA Semantic Vector Search */}
                  <div className="p-4 rounded-xl border border-lime bg-[#F8FDED] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#345312] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-lime-dark" />
                        NEXORA Dense Vector Match
                      </span>
                      <span className="text-xs font-mono font-bold text-[#345312]">Score: 94.2% (High Affinity)</span>
                    </div>
                    <p className="text-xs text-[#2A4410]">
                      Dense embeddings projected profile concepts onto the AI Systems subspace. Semantic similarity retrieved the role, and hybrid ranking verified experience and remote preferences.
                    </p>
                  </div>
                </div>

                {/* Configurable Weight Sliders Visual */}
                <div className="pt-4 border-t border-border space-y-3">
                  <span className="text-xs font-semibold text-stone uppercase tracking-wider">
                    Formula Configuration
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-ivory rounded border border-border">
                      <span className="text-stone font-mono">Semantic</span>
                      <p className="font-heading font-bold text-charcoal">60%</p>
                    </div>
                    <div className="p-2 bg-ivory rounded border border-border">
                      <span className="text-stone font-mono">Skills</span>
                      <p className="font-heading font-bold text-charcoal">25%</p>
                    </div>
                    <div className="p-2 bg-ivory rounded border border-border">
                      <span className="text-stone font-mono">Experience</span>
                      <p className="font-heading font-bold text-charcoal">10%</p>
                    </div>
                    <div className="p-2 bg-ivory rounded border border-border">
                      <span className="text-stone font-mono">Location</span>
                      <p className="font-heading font-bold text-charcoal">5%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="py-20 bg-charcoal text-white border-b border-charcoal-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-heading font-black text-4xl sm:text-5xl text-lime">94.2%</p>
              <p className="text-xs uppercase tracking-wider text-stone-light mt-1">Average Match Accuracy</p>
            </div>
            <div>
              <p className="font-heading font-black text-4xl sm:text-5xl text-white">384</p>
              <p className="text-xs uppercase tracking-wider text-stone-light mt-1">Dense Vector Dimensions</p>
            </div>
            <div>
              <p className="font-heading font-black text-4xl sm:text-5xl text-burnt-orange">7</p>
              <p className="text-xs uppercase tracking-wider text-stone-light mt-1">Autonomous Agent Tools</p>
            </div>
            <div>
              <p className="font-heading font-black text-4xl sm:text-5xl text-white">3.2x</p>
              <p className="text-xs uppercase tracking-wider text-stone-light mt-1">Faster Candidate Placement</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 bg-white border-b border-border text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <Badge variant="lime" size="md">READY TO ELEVATE YOUR SEARCH?</Badge>
          <h2 className="text-4xl sm:text-5xl font-heading font-extrabold text-charcoal tracking-tight">
            Find Your Fit. Build Your Future.
          </h2>
          <p className="text-stone text-lg max-w-2xl mx-auto">
            Join candidates using NEXORA to unlock semantic job matching, analyze skill gaps, and strategize with our LangGraph career agent.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button variant="accent" size="lg" className="shadow-premium">
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ivory py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-stone">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-charcoal flex items-center justify-center text-lime font-heading font-bold text-sm">
              N
            </div>
            <div>
              <span className="font-heading font-bold text-charcoal text-base">NEXORA</span>
              <p className="text-xs text-stone">AI Career Intelligence Platform</p>
            </div>
          </div>

          <p className="text-xs text-stone">
            &copy; {new Date().getFullYear()} NEXORA. All rights reserved. &ldquo;Find Your Fit. Build Your Future.&rdquo;
          </p>

          <div className="flex gap-6 text-xs">
            <Link href="/login" className="hover:text-charcoal transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-charcoal transition-colors">Get Started</Link>
            <a href="#how-it-works" className="hover:text-charcoal transition-colors">Architecture</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
