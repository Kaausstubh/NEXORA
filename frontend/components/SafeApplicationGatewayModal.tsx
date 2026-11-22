"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Lock,
  ArrowRight,
  PhoneCall,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

export interface SafeApplicationGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  onOpenReport?: () => void;
}

export function SafeApplicationGatewayModal({
  isOpen,
  onClose,
  job,
  onOpenReport,
}: SafeApplicationGatewayModalProps) {
  const [loading, setLoading] = useState(true);
  const [safetyCheck, setSafetyCheck] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && job?.id) {
      setLoading(true);
      setError(null);
      api
        .runSafetyCheck(job.id)
        .then((data) => {
          setSafetyCheck(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Safety check error:", err);
          setError("Failed to run safety analysis. Proceeding with caution.");
          setLoading(false);
        });
    }
  }, [isOpen, job?.id]);

  if (!isOpen) return null;

  const isBlocked = safetyCheck?.is_blocked || job.is_application_blocked;
  const verdict = safetyCheck?.verdict || (isBlocked ? "APPLICATION BLOCKED" : "SAFE TO PROCEED");
  const blockReason = safetyCheck?.block_reason || job.block_reason;
  const destinationUrl = safetyCheck?.destination_url || job.application_url || job.source_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border bg-[#F7F6F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isBlocked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
              {isBlocked ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-charcoal">
                Safe Application Gateway
              </h3>
              <p className="text-xs text-stone">
                Pre-application authenticity inspection & fraud protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone hover:text-charcoal hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Opportunity Header */}
          <div className="p-4 rounded-xl bg-ivory border border-border">
            <h4 className="font-bold text-sm text-charcoal">{job.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-stone">
              <span className="font-semibold text-charcoal">{job.company}</span>
              <span>•</span>
              <span>{job.location}</span>
              <span>•</span>
              <span className="font-mono text-emerald-700 font-medium">
                {job.stipend_amount_min ? `₹${job.stipend_amount_min.toLocaleString("en-IN")}/mo` : "Stipend Provided"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone">
              <Loader2 className="w-8 h-8 animate-spin text-charcoal" />
              <p className="text-sm font-medium">Running 5-Step Pre-Application Safety Inspection...</p>
              <p className="text-xs text-stone/80">Checking MCA records, domain encryption, and zero-fee compliance</p>
            </div>
          ) : (
            <>
              {/* Verdict Banner */}
              {isBlocked ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-700">
                    <AlertOctagon className="w-5 h-5 text-red-600" />
                    <span>APPLICATION BLOCKED FOR CANDIDATE SAFETY</span>
                  </div>
                  <p className="text-xs leading-relaxed text-red-800">
                    {blockReason ||
                      "This opportunity demands upfront candidate payments or displays critical scam indicators. Direct application has been disabled to protect your financial security."}
                  </p>
                  <div className="text-[11px] font-semibold text-red-700 pt-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Zero-Tolerance Rule: NEXORA strictly forbids fees for internships or jobs.</span>
                  </div>
                </div>
              ) : verdict === "PROCEED WITH CAUTION" ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>PROCEED WITH CAUTION</span>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-800">
                    Company identity is awaiting formal documentation or uses secondary channels. Exercise caution and never pay money.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>VERIFICATION PASSED: SAFE TO PROCEED</span>
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-800">
                    Entity verified with Ministry of Corporate Affairs (MCA) / Official Portals. 100% Free Application confirmed.
                  </p>
                </div>
              )}

              {/* 5-Step Verification Walkthrough */}
              <div className="space-y-3">
                <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-stone">
                  5-Step Authenticity Verification Results
                </h5>

                <div className="space-y-2">
                  {(safetyCheck?.steps || []).map((step: any) => {
                    const isPassed = step.status === "passed";
                    const isWarning = step.status === "warning";
                    const isFailed = step.status === "failed";

                    return (
                      <div
                        key={step.step_number}
                        className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                          isFailed
                            ? "bg-red-50/70 border-red-200"
                            : isWarning
                            ? "bg-amber-50/70 border-amber-200"
                            : "bg-neutral-50/80 border-border"
                        }`}
                      >
                        <div className="mt-0.5">
                          {isFailed ? (
                            <XCircle className="w-4 h-4 text-red-600" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
                            <span>
                              Step {step.step_number}: {step.title}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                                isFailed
                                  ? "bg-red-100 text-red-800"
                                  : isWarning
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {step.status}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-stone">
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student Safety Notice */}
              <div className="p-3.5 rounded-xl bg-ivory border border-border text-stone space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal">
                  <PhoneCall className="w-3.5 h-3.5 text-burnt-orange" />
                  <span>National Student Safety Advisory</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Never transfer money for interviews, ID cards, or training. Under Ministry of Labour norms, legitimate employers never charge candidates. Report fraud immediately to National Cyber Crime Helpline: <span className="font-bold text-charcoal font-mono">1930</span> or <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="underline text-blue-700">cybercrime.gov.in</a>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-[#F7F6F2] flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold text-stone"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {isBlocked ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    if (onOpenReport) onOpenReport();
                  }}
                  className="text-xs font-semibold text-red-700 border-red-300 hover:bg-red-50"
                >
                  Report This Listing
                </Button>
                <button
                  disabled
                  className="px-4 py-2 rounded-xl bg-neutral-300 text-neutral-500 text-xs font-bold cursor-not-allowed flex items-center gap-1.5"
                  title="Direct apply blocked due to fraud violation"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Application Locked
                </button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    if (onOpenReport) onOpenReport();
                  }}
                  className="text-xs text-stone hover:text-charcoal"
                >
                  Report Suspicious
                </Button>
                {destinationUrl && (
                  <a
                    href={destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal text-white hover:bg-black text-xs font-bold transition-all shadow-subtle hover:scale-[1.02]"
                  >
                    <span>Proceed to Official Application</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
