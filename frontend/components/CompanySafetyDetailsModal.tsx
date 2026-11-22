"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  Globe,
  MapPin,
  Calendar,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  PhoneCall,
  Loader2,
  X,
  MailCheck,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TrustBadge, getTrustBadgeConfig } from "@/components/TrustBadge";
import { api } from "@/lib/api";

export interface CompanySafetyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
}

export function CompanySafetyDetailsModal({
  isOpen,
  onClose,
  companyName,
}: CompanySafetyDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && companyName) {
      setLoading(true);
      setError(null);
      api
        .getCompanyTrustDetails(companyName)
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load company trust details:", err);
          setError("Could not retrieve company verification details.");
          setLoading(false);
        });
    }
  }, [isOpen, companyName]);

  if (!isOpen) return null;

  const trustBadgeConfig = getTrustBadgeConfig(data?.trust_badge);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border bg-[#F7F6F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-charcoal text-white">
              <ShieldCheck className="w-5 h-5 text-lime" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-charcoal">
                Employer Authenticity Intelligence
              </h3>
              <p className="text-xs text-stone">
                Ministry of Corporate Affairs (MCA) records & trust verification
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
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone">
              <Loader2 className="w-8 h-8 animate-spin text-charcoal" />
              <p className="text-sm font-medium">Fetching MCA verification records for {companyName}...</p>
            </div>
          ) : (
            <>
              {/* Company Overview Header */}
              <div className="p-4 rounded-xl bg-ivory border border-border flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-heading font-bold text-lg text-charcoal">{data?.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone">
                    <span>{data?.business_structure}</span>
                    <span>•</span>
                    <span>Status: <span className="font-semibold text-emerald-700">{data?.mca_status}</span></span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <TrustBadge badge={data?.trust_badge} riskScore={data?.fraud_risk_score} showRiskScore={false} />
                  <div className="text-xs text-stone font-mono">
                    Trust Score: <span className="font-bold text-charcoal">{data?.trust_score}/100</span>
                  </div>
                </div>
              </div>

              {/* MCA Corporate Registration Records */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-charcoal">
                    <FileCheck2 className="w-4 h-4 text-emerald-700" />
                    <span>MCA & Statutory Registration</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {data?.verification_source}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* CIN */}
                  <div className="p-2.5 rounded-lg bg-white border border-border">
                    <span className="text-[10px] text-stone font-medium uppercase tracking-wider block">
                      Corporate Identification Number (CIN)
                    </span>
                    <span className="font-mono font-bold text-charcoal text-xs mt-0.5 block">
                      {data?.cin || "Not Applicable / Statutory Entity"}
                    </span>
                  </div>

                  {/* GSTIN */}
                  <div className="p-2.5 rounded-lg bg-white border border-border">
                    <span className="text-[10px] text-stone font-medium uppercase tracking-wider block">
                      GSTIN Registration
                    </span>
                    <span className="font-mono font-bold text-charcoal text-xs mt-0.5 block">
                      {data?.gstin || "Direct Portal Registration"}
                    </span>
                  </div>

                  {/* Incorporation Year */}
                  <div className="p-2.5 rounded-lg bg-white border border-border flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-stone" />
                    <div>
                      <span className="text-[10px] text-stone font-medium block">Incorporation Year</span>
                      <span className="font-semibold text-charcoal">{data?.incorporation_year || "Established Institution"}</span>
                    </div>
                  </div>

                  {/* Website & Domain */}
                  <div className="p-2.5 rounded-lg bg-white border border-border flex items-center gap-2">
                    <Globe className="w-4 h-4 text-stone" />
                    <div>
                      <span className="text-[10px] text-stone font-medium block">Enterprise Domain</span>
                      <span className="font-mono text-charcoal">{data?.domain || "Official Careers Channel"}</span>
                    </div>
                  </div>
                </div>

                {/* Registered Office */}
                {data?.registered_office && (
                  <div className="p-2.5 rounded-lg bg-white border border-border flex items-start gap-2 text-xs">
                    <MapPin className="w-4 h-4 text-stone shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-stone font-medium block">Registered Office (MCA Records)</span>
                      <span className="text-charcoal leading-relaxed">{data.registered_office}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Verified Trust Signals */}
              <div className="space-y-2">
                <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-stone">
                  Verified Authenticity Signals
                </h5>
                <div className="space-y-1.5">
                  {(data?.trust_factors || []).map((factor: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-2 text-xs text-emerald-900"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                  {(!data?.trust_factors || data.trust_factors.length === 0) && (
                    <p className="text-xs text-stone italic">No official trust signals established yet.</p>
                  )}
                </div>
              </div>

              {/* Active Risk Factors if any */}
              {data?.risk_factors && data.risk_factors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Cautionary Signals Detected</span>
                  </div>
                  <ul className="list-disc list-inside text-xs space-y-1 text-red-800">
                    {data.risk_factors.map((rf: string, idx: number) => (
                      <li key={idx}>{rf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* National Cyber Crime & Student Advisory */}
              <div className="p-3.5 rounded-xl bg-ivory border border-border text-stone space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal">
                  <PhoneCall className="w-3.5 h-3.5 text-burnt-orange" />
                  <span>National Cyber Crime & Student Safety Helpline</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Legitimate Indian employers never ask students for registration fees, interview slot fees, or security deposits. In case of fraudulent demands, report immediately via the National Helpline: <span className="font-bold text-charcoal font-mono">1930</span> or <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="underline text-blue-700">cybercrime.gov.in</a>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-[#F7F6F2] flex items-center justify-between">
          <span className="text-xs text-stone">
            NEXORA Student Safety Verification Framework
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold bg-charcoal text-white hover:bg-black"
          >
            Close Details
          </Button>
        </div>
      </div>
    </div>
  );
}
