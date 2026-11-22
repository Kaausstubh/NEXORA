"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Lock,
  Building2,
  FileCheck2,
  PhoneCall,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Trash2,
  Globe,
  Ban,
  Award
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TrustBadge } from "@/components/TrustBadge";
import { api } from "@/lib/api";
import { SafeApplicationGatewayModal } from "@/components/SafeApplicationGatewayModal";
import { CompanySafetyDetailsModal } from "@/components/CompanySafetyDetailsModal";

export default function AdminFraudDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminFraudDashboard();
      setData(res);
    } catch (err) {
      console.error("Failed to load fraud dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (
    targetType: "job" | "company" | "report",
    targetId: string,
    action: "verify" | "block" | "blacklist" | "restore" | "dismiss_report",
    reason: string
  ) => {
    try {
      await api.adminReviewTarget({
        target_type: targetType,
        target_id: targetId,
        action,
        decision_reason: reason,
      });
      setActionSuccess(`Successfully executed '${action}' on ${targetType}.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadDashboard();
    } catch (err: any) {
      console.error("Action error:", err);
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-charcoal text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-premium">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal-surface border border-lime/40 text-xs font-mono text-lime">
            <ShieldCheck className="w-4 h-4 text-lime" />
            <span>AI TRUST, FRAUD DETECTION & SAFETY ENGINE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white">
            Company Verification & Fraud Intelligence
          </h1>

          <p className="text-sm text-neutral-300 leading-relaxed">
            Multi-signal Ministry of Corporate Affairs (MCA) validation, zero-tolerance scam blocking,
            and National Cyber Crime Helpline (1930) coordination to protect Indian students from fake offers and registration fees.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="accent"
              size="sm"
              onClick={loadDashboard}
              className="font-bold flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Intelligence
            </Button>

            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-surface border border-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-burnt-orange" />
              <span>Helpline 1930 (Cyber Crime)</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-lime/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone">Verified Entities</span>
          <div className="text-2xl font-heading font-black text-emerald-700">
            {data?.total_verified_companies ?? "—"}
          </div>
          <span className="text-[11px] text-stone">MCA CIN active</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone">Blocked Scams</span>
          <div className="text-2xl font-heading font-black text-red-600">
            {data?.blocked_scams_count ?? "—"}
          </div>
          <span className="text-[11px] text-stone">Zero-fee rule applied</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone">High-Risk Listings</span>
          <div className="text-2xl font-heading font-black text-orange-600">
            {data?.high_risk_opportunities ?? "—"}
          </div>
          <span className="text-[11px] text-stone">Risk score &gt; 60/100</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone">Suspicious Domains</span>
          <div className="text-2xl font-heading font-black text-charcoal">
            {data?.suspicious_domains_count ?? "—"}
          </div>
          <span className="text-[11px] text-stone">TLD blacklist active</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone">Pending Reports</span>
          <div className="text-2xl font-heading font-black text-amber-700">
            {data?.pending_fraud_reports_count ?? "—"}
          </div>
          <span className="text-[11px] text-stone">Student submissions</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-subtle space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone">Awaiting Audit</span>
          <div className="text-2xl font-heading font-black text-stone">
            {data?.pending_verifications ?? 0}
          </div>
          <span className="text-[11px] text-stone">New employer queue</span>
        </div>
      </div>

      {/* Section 1: Flagged Opportunities & Blocked Scams Queue */}
      <div className="bg-white rounded-3xl border border-border p-6 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h3 className="font-heading font-bold text-lg text-charcoal flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              <span>Zero-Tolerance Scam Enforcement & Blocked Listings</span>
            </h3>
            <p className="text-xs text-stone">
              Opportunities automatically locked due to candidate fee demands, suspicious domains, or unverified recruiters
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full self-start">
            {data?.flagged_jobs?.length || 0} listings blocked
          </span>
        </div>

        <div className="space-y-3">
          {(data?.flagged_jobs || []).map((job: any) => (
            <div
              key={job.id}
              className="p-4 rounded-2xl border border-red-200 bg-red-50/40 hover:bg-red-50/70 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-charcoal">{job.title}</h4>
                  <TrustBadge
                    badge={job.trust_badge}
                    riskScore={job.fraud_risk_score}
                    riskLevel={job.fraud_risk_level}
                    size="sm"
                  />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-300">
                    APPLICATION BLOCKED
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone">
                  <span className="font-semibold text-charcoal">{job.company}</span>
                  <span>•</span>
                  <span>{job.location}</span>
                  <span>•</span>
                  <span className="font-mono text-red-700">
                    Stipend: ₹{job.stipend_amount_min?.toLocaleString("en-IN") || "N/A"}
                  </span>
                  {job.recruiter_email && (
                    <>
                      <span>•</span>
                      <span className="text-[11px] font-mono text-amber-800">
                        Email: {job.recruiter_email}
                      </span>
                    </>
                  )}
                </div>

                {job.block_reason && (
                  <div className="p-2.5 rounded-xl bg-white border border-red-200 text-xs text-red-800 leading-relaxed font-medium">
                    {job.block_reason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedJob(job)}
                  className="text-xs font-semibold text-charcoal border-border hover:bg-white"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Inspect Gateway
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCompany(job.company)}
                  className="text-xs font-semibold text-stone border-border hover:text-charcoal"
                >
                  MCA Intel
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleAdminAction(
                      "company",
                      job.company,
                      "blacklist",
                      "Confirmed fee scam and candidate fraud"
                    )
                  }
                  className="text-xs font-bold bg-neutral-900 text-white hover:bg-black"
                >
                  <Ban className="w-3.5 h-3.5 mr-1 text-red-400" />
                  Blacklist
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleAdminAction(
                      "job",
                      job.id,
                      "restore",
                      "Admin verified genuine after manual review"
                    )
                  }
                  className="text-xs text-emerald-800 hover:bg-emerald-50"
                >
                  Restore
                </Button>
              </div>
            </div>
          ))}

          {(!data?.flagged_jobs || data.flagged_jobs.length === 0) && (
            <div className="py-8 text-center text-xs text-stone">
              No blocked or suspicious listings found. All active opportunities pass automated zero-fee compliance.
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Student Scam Reports Moderation */}
      <div className="bg-white rounded-3xl border border-border p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="font-heading font-bold text-lg text-charcoal flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-burnt-orange" />
              <span>Confidential Student Fraud Reports</span>
            </h3>
            <p className="text-xs text-stone">
              Direct reports submitted by candidates regarding fee demands, suspicious WhatsApp contacts, or fake offers
            </p>
          </div>
          <span className="text-xs text-stone font-mono">
            {data?.recent_fraud_reports?.length || 0} reports recorded
          </span>
        </div>

        <div className="space-y-3">
          {(data?.recent_fraud_reports || []).map((report: any) => (
            <div
              key={report.id}
              className="p-4 rounded-2xl bg-ivory border border-border space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-charcoal">
                    {report.company_name}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                    {report.reported_category}
                  </span>
                  <span className="text-[11px] text-stone">
                    Status: <span className="font-semibold text-charcoal">{report.status}</span>
                  </span>
                </div>
                <span className="text-[10px] text-stone font-mono">
                  {new Date(report.created_at).toLocaleDateString("en-IN")}
                </span>
              </div>

              <p className="text-xs text-charcoal leading-relaxed bg-white p-3 rounded-xl border border-border">
                {report.description}
              </p>

              {report.evidence_urls && report.evidence_urls.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone">Evidence links:</span>
                  {report.evidence_urls.map((url: string, idx: number) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline text-xs font-mono"
                    >
                      Evidence #{idx + 1}
                    </a>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleAdminAction(
                      "report",
                      report.id,
                      "dismiss_report",
                      "Report dismissed by administrator"
                    )
                  }
                  className="text-xs text-stone"
                >
                  Dismiss Report
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    handleAdminAction(
                      "report",
                      report.id,
                      "verify",
                      "Confirmed violation based on evidence"
                    )
                  }
                  className="text-xs font-bold"
                >
                  Verify Scam &amp; Block
                </Button>
              </div>
            </div>
          ))}

          {(!data?.recent_fraud_reports || data.recent_fraud_reports.length === 0) && (
            <div className="py-8 text-center text-xs text-stone">
              No pending candidate fraud reports. Platform reports queue is clear.
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Suspicious TLD & Phishing Domain Blacklist */}
      <div className="bg-white rounded-3xl border border-border p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-stone" />
            <div>
              <h3 className="font-heading font-bold text-sm text-charcoal">
                Active Phishing & Disposable Domain Watchlist
              </h3>
              <p className="text-xs text-stone">
                Domains blocked from direct link redirection in the pre-application gateway
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-stone">
            {data?.suspicious_domains_count || 4} domains monitored
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-ivory border border-border space-y-1">
            <span className="font-mono font-bold text-red-700 block">apex-career-solutions.xyz</span>
            <span className="text-[11px] text-stone">Fee Scam / Phishing TLD</span>
          </div>
          <div className="p-3 rounded-xl bg-ivory border border-border space-y-1">
            <span className="font-mono font-bold text-red-700 block">skyline-cloud-labs.click</span>
            <span className="text-[11px] text-stone">Paid Training Disguised as Internship</span>
          </div>
          <div className="p-3 rounded-xl bg-ivory border border-border space-y-1">
            <span className="font-mono font-bold text-red-700 block">tcs-nqt-registration-fees.buzz</span>
            <span className="text-[11px] text-stone">Corporate Impersonation Phishing</span>
          </div>
          <div className="p-3 rounded-xl bg-ivory border border-border space-y-1">
            <span className="font-mono font-bold text-red-700 block">infosys-direct-hiring.online</span>
            <span className="text-[11px] text-stone">Phishing Application Channel</span>
          </div>
        </div>
      </div>

      {/* Modals for Inspection */}
      {selectedJob && (
        <SafeApplicationGatewayModal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          job={selectedJob}
        />
      )}

      {selectedCompany && (
        <CompanySafetyDetailsModal
          isOpen={!!selectedCompany}
          onClose={() => setSelectedCompany(null)}
          companyName={selectedCompany}
        />
      )}
    </div>
  );
}
