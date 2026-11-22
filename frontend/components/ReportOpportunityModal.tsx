"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Send,
  Loader2,
  CheckCircle2,
  X,
  Lock,
  IndianRupee,
  Link as LinkIcon,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

export interface ReportOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
}

const REPORT_CATEGORIES = [
  { id: "registration_fee_demand", label: "Registration / Interview Fee Demanded" },
  { id: "training_fee_scam", label: "Paid Training Program Disguised as Internship" },
  { id: "fake_recruiter", label: "Fake Recruiter / Public Free Email (@gmail/@yahoo)" },
  { id: "fake_company", label: "Fake Company / Non-existent Entity" },
  { id: "fake_ppo_promise", label: "Fraudulent PPO or Unrealistic Stipend Promise" },
  { id: "sensitive_info_demand", label: "Request for Sensitive Credentials (Bank OTP / Aadhaar)" },
  { id: "phishing_link", label: "Phishing / Suspicious External Application Link" },
  { id: "other_scam", label: "Other Fraud or Unethical Conduct" }
];

export function ReportOpportunityModal({
  isOpen,
  onClose,
  job,
}: ReportOpportunityModalProps) {
  const [category, setCategory] = useState(REPORT_CATEGORIES[0].label);
  const [amountDemanded, setAmountDemanded] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [recruiterContact, setRecruiterContact] = useState<string>("");
  const [evidenceUrls, setEvidenceUrls] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please describe the suspicious behavior or scam details.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const urls = evidenceUrls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const payload = {
      job_id: job?.id,
      company_name: job?.company || "Unknown Company",
      opportunity_title: job?.title,
      reported_category: category,
      amount_demanded: amountDemanded ? parseInt(amountDemanded, 10) : undefined,
      description: description.trim(),
      evidence_urls: urls,
      recruiter_contact: recruiterContact.trim() || undefined,
      anonymous: true,
    };

    try {
      await api.reportFraud(payload);
      setSubmitting(false);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Failed to submit fraud report:", err);
      setError(err.message || "Failed to submit fraud report. Please try again.");
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setError(null);
    setDescription("");
    setAmountDemanded("");
    setEvidenceUrls("");
    setRecruiterContact("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border bg-[#F7F6F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 text-red-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-charcoal">
                Report Suspicious Opportunity
              </h3>
              <p className="text-xs text-stone">
                Confidential candidate protection & scam investigation
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-stone hover:text-charcoal hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-lg text-charcoal">
                  Report Received Confidentially
                </h4>
                <p className="text-xs text-stone max-w-md mx-auto leading-relaxed">
                  Thank you for helping keep the student ecosystem safe. Our moderation team has placed this opportunity under investigation.
                </p>
              </div>
              <div className="p-3 bg-ivory rounded-xl border border-border text-[11px] text-stone max-w-sm mx-auto">
                <span className="font-semibold text-charcoal">Report Reference:</span> Recorded in fraud monitoring queue. Your identity will remain strictly protected.
              </div>
              <Button
                variant="primary"
                onClick={handleResetAndClose}
                className="bg-charcoal text-white hover:bg-black text-xs font-semibold"
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target info */}
              <div className="p-3 rounded-xl bg-ivory border border-border text-xs">
                <span className="text-stone">Reporting Listing: </span>
                <span className="font-bold text-charcoal">{job?.title}</span>
                <span className="text-stone"> at </span>
                <span className="font-semibold text-charcoal">{job?.company}</span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal block">
                  Scam / Fraud Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-lime"
                >
                  {REPORT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Demanded if any */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal block">
                  Amount Demanded (if applicable in ₹)
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 text-stone absolute left-3 top-2.5" />
                  <input
                    type="number"
                    placeholder="e.g. 1499, 5000"
                    value={amountDemanded}
                    onChange={(e) => setAmountDemanded(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-border bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-lime"
                  />
                </div>
              </div>

              {/* Recruiter contact */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal block">
                  Recruiter Contact Info (Phone, WhatsApp, or Email)
                </label>
                <input
                  type="text"
                  placeholder="e.g. hr_recruiter@gmail.com, +91 98765 43210"
                  value={recruiterContact}
                  onChange={(e) => setRecruiterContact(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-lime"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal block">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain what happened: did they demand money, offer a fake certificate, or use high-pressure tactics?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-lime resize-none"
                />
              </div>

              {/* Evidence URLs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal block">
                  Evidence URLs (Screenshots / Google Drive links, one per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="https://drive.google.com/file/...&#10;https://imgur.com/..."
                  value={evidenceUrls}
                  onChange={(e) => setEvidenceUrls(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-white text-charcoal font-mono focus:outline-none focus:ring-2 focus:ring-lime resize-none"
                />
              </div>

              {/* Confidentiality Guarantee */}
              <div className="p-3 rounded-xl bg-ivory border border-border text-stone flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-stone shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-charcoal">Strict Candidate Privacy:</span> Your report is strictly confidential. NEXORA will never disclose your name, email, or identity to the reported employer.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetAndClose}
                  className="text-xs font-semibold text-stone"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Report</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
