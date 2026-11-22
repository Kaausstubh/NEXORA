"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Award,
  ArrowRight,
  Layers,
  FileCheck,
  FileCode,
  FileType,
  Mail,
  Phone,
  Globe,
  Link2,
  Check,
  X
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MatchRing } from "@/components/ui/MatchRing";
import { api } from "@/lib/api";

export default function ResumeInsightsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [applying, setApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const records = await api.getResumeHistory();
      setHistory(records);
      if (records.length > 0 && !analysis) {
        setAnalysis(records[0]);
      }
    } catch (err) {
      console.error("Failed to load resume history", err);
    }
  };

  const processFile = async (selected: File) => {
    const validExtensions = [".pdf", ".docx", ".doc", ".txt", ".text", ".md"];
    const ext = "." + (selected.name.split(".").pop() || "").toLowerCase();

    if (!validExtensions.includes(ext)) {
      setError(`Unsupported file format (${ext}). Supported formats: PDF (.pdf), Word (.docx, .doc), and Text (.txt).`);
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("File size exceeds maximum 10MB limit.");
      return;
    }

    setFile(selected);
    setAnalyzing(true);
    setError(null);
    setAppliedSuccess(false);

    try {
      const res = await api.uploadResume(selected);
      setAnalysis(res);
      loadHistory();
    } catch (err: any) {
      setError(err.message || "Failed to analyze resume document.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the container itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleApplyToProfile = async () => {
    if (!analysis?.id) return;
    setApplying(true);
    try {
      await api.applyResumeToProfile(analysis.id);
      setAppliedSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to synchronize profile.");
    } finally {
      setApplying(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const raw = analysis?.raw_analysis;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime animate-pulse" />
            <h1 className="text-3xl font-heading font-black tracking-tight text-charcoal">
              Resume Intelligence & Diagnostics
            </h1>
          </div>
          <p className="text-sm text-stone mt-1">
            Universal resume parser supporting PDF, DOCX, DOC, and TXT. Extracts competencies, verifies structural completeness, and synchronizes your vector embedding.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700 animate-shake">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Resume Parse Error</span>
            <span className="text-xs text-red-800">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-10 text-center transition-all cursor-pointer shadow-subtle ${
          isDragging
            ? "border-charcoal bg-[#F0F8E2] scale-[1.01] shadow-premium ring-4 ring-lime/50"
            : "border-border bg-white hover:border-charcoal/70 hover:bg-neutral-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="resume-file-upload"
          accept=".pdf,.docx,.doc,.txt,.text,.md"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          {/* Animated Icon Container */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              isDragging
                ? "bg-lime text-charcoal scale-110 shadow-lg"
                : "bg-ivory border border-border text-charcoal shadow-sm"
            }`}
          >
            <UploadCloud className={`w-8 h-8 ${isDragging ? "text-charcoal animate-bounce" : "text-stone"}`} />
          </div>

          {/* Main Titles */}
          <div className="space-y-1.5 max-w-md mx-auto">
            <p className="font-heading font-black text-lg text-charcoal">
              {isDragging
                ? "Drop your resume file here to parse instantly!"
                : file
                ? `Loaded: ${file.name}`
                : "Drag & drop your resume here, or click to browse"}
            </p>
            <p className="text-xs text-stone leading-relaxed">
              Supports <span className="font-semibold text-charcoal">PDF (.pdf)</span>,{" "}
              <span className="font-semibold text-charcoal">Word (.docx, .doc)</span>, and{" "}
              <span className="font-semibold text-charcoal">Plain Text (.txt)</span> up to 10MB
            </p>
          </div>

          {/* Format Badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-[11px] font-mono font-bold text-rose-800 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> PDF
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-mono font-bold text-blue-800 flex items-center gap-1">
              <FileType className="w-3.5 h-3.5" /> DOCX / DOC
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-mono font-bold text-amber-800 flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5" /> TXT
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold shadow-subtle"
            >
              {analyzing ? "Extracting & Analyzing..." : "Browse Local Files"}
            </Button>

            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setAnalyzing(true);
                setError(null);
                setAppliedSuccess(false);
                try {
                  const res = await fetch("/sample_resume.pdf");
                  const blob = await res.blob();
                  const sampleFile = new File([blob], "alex_mercer_sample_resume.pdf", { type: "application/pdf" });
                  setFile(sampleFile);
                  const result = await api.uploadResume(sampleFile);
                  setAnalysis(result);
                  loadHistory();
                } catch (err: any) {
                  setError(err.message || "Failed to load sample resume.");
                } finally {
                  setAnalyzing(false);
                }
              }}
              className="px-4 py-2 rounded-lg bg-[#F3FBDF] border border-lime text-charcoal text-xs font-semibold hover:bg-lime transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-lime-dark" />
              Try With Sample AI Resume
            </button>
          </div>
        </div>
      </div>

      {analyzing && (
        <div className="p-5 rounded-2xl bg-white border border-border flex items-center gap-3 shadow-subtle animate-pulse">
          <div className="animate-spin w-5 h-5 border-2 border-charcoal border-t-transparent rounded-full" />
          <span className="text-xs font-medium text-stone">
            Deep-parsing structural elements, technical terminology, and scoring quantifiable metrics...
          </span>
        </div>
      )}

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-6">
          {/* Top Score & Summary Banner */}
          <div className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <MatchRing score={analysis.strength_score || 85} size={88} strokeWidth={8} />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone font-mono">
                    Resume Strength Score
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Diagnostic Complete
                  </span>
                </div>
                <h3 className="font-heading font-black text-2xl text-charcoal">
                  {analysis.original_filename || file?.name || "Current Resume"}
                </h3>
                <p className="text-xs text-stone max-w-xl leading-relaxed">
                  {analysis.experience_summary}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              <Button
                variant="accent"
                size="md"
                onClick={handleApplyToProfile}
                isLoading={applying}
                disabled={appliedSuccess}
                className="shadow-sm font-bold"
              >
                {appliedSuccess ? "Profile Synchronized ✓" : "Sync With Vector Profile"}
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
              {appliedSuccess && (
                <span className="text-[11px] text-emerald-700 font-semibold text-center">
                  pgvector embedding re-indexed!
                </span>
              )}
            </div>
          </div>

          {/* Contact & Structural Diagnostics Strip */}
          {raw?.contact_extracted && (
            <div className="bg-white rounded-2xl border border-border p-4 shadow-subtle grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-ivory border border-border">
                <Mail className="w-4 h-4 text-stone shrink-0" />
                <span className="truncate text-charcoal font-medium font-mono">
                  {raw.contact_extracted.email || "Email detected"}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-ivory border border-border">
                <Phone className="w-4 h-4 text-stone shrink-0" />
                <span className="truncate text-charcoal font-medium font-mono">
                  {raw.contact_extracted.phone || "Phone detected"}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-ivory border border-border">
                <Globe className="w-4 h-4 text-stone shrink-0" />
                <span className="text-charcoal font-medium">
                  {raw.contact_extracted.has_github ? "GitHub Present ✓" : "GitHub Missing"}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-ivory border border-border">
                <Link2 className="w-4 h-4 text-stone shrink-0" />
                <span className="text-charcoal font-medium">
                  {raw.contact_extracted.has_linkedin ? "LinkedIn Present ✓" : "LinkedIn Missing"}
                </span>
              </div>
            </div>
          )}

          {/* 3 Detail Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Extracted Skills Block */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-stone" />
                  <h4 className="font-heading font-bold text-sm text-charcoal">
                    Identified Skills ({analysis.skills_extracted?.length || 0})
                  </h4>
                </div>
                <Badge variant="lime" size="sm">High Coverage</Badge>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto pr-1">
                {(analysis.skills_extracted || []).map((s: string) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-md bg-ivory border border-border text-xs font-mono text-charcoal"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Card>

            {/* Recommended Improvements Block */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-stone" />
                  <h4 className="font-heading font-bold text-sm text-charcoal">
                    Recommended Improvements
                  </h4>
                </div>
                <Badge variant="orange" size="sm">Actionable</Badge>
              </div>

              <div className="space-y-3">
                {(analysis.recommended_improvements || []).map((imp: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-charcoal leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-ivory border border-border flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Suitable Job Categories */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-stone" />
                  <h4 className="font-heading font-bold text-sm text-charcoal">
                    Target Job Categories
                  </h4>
                </div>
                <Badge variant="stone" size="sm">Optimal Fit</Badge>
              </div>

              <div className="space-y-2">
                {(analysis.suitable_job_categories || []).map((cat: string) => (
                  <div
                    key={cat}
                    className="p-3 rounded-lg bg-ivory border border-border flex items-center justify-between text-xs font-semibold text-charcoal"
                  >
                    <span>{cat}</span>
                    <Badge variant="lime" size="sm">High Match</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Analysis History List */}
          {history.length > 1 && (
            <div className="bg-white rounded-3xl border border-border p-6 shadow-subtle space-y-3">
              <h4 className="font-heading font-bold text-sm text-charcoal">
                Previous Resume Uploads ({history.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAnalysis(item);
                      setAppliedSuccess(false);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                      analysis?.id === item.id
                        ? "border-charcoal bg-ivory shadow-sm"
                        : "border-border bg-white hover:border-charcoal/50"
                    }`}
                  >
                    <div className="truncate space-y-0.5">
                      <span className="font-bold text-xs text-charcoal truncate block">
                        {item.original_filename || "Resume"}
                      </span>
                      <span className="text-[10px] text-stone">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {Math.round(item.strength_score)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
