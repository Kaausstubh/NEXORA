"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Compass,
  SlidersHorizontal,
  X,
  Briefcase,
  ShieldCheck,
  Building2,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { OpportunityCard } from "@/components/OpportunityCard";
import { api } from "@/lib/api";

// Sub-localities mapping for Indian tech hubs
const LOCALITIES_MAP: Record<string, string[]> = {
  Pune: [
    "Hinjewadi",
    "Baner",
    "Wakad",
    "Kharadi",
    "Magarpatta",
    "Pimpri-Chinchwad",
    "Senapati Bapat Road",
    "Viman Nagar",
    "Kothrud"
  ],
  Bengaluru: [
    "Whitefield",
    "Koramangala",
    "Electronic City",
    "HSR Layout",
    "Indiranagar",
    "Bellandur",
    "Manyata"
  ],
  Hyderabad: [
    "HITEC City",
    "Gachibowli",
    "Madhapur",
    "Kondapur",
    "Jubilee Hills"
  ],
  "Delhi-NCR": [
    "Gurugram Cyber City",
    "Noida Sector 62",
    "Connaught Place",
    "Okhla"
  ],
  Mumbai: [
    "BKC",
    "Powai",
    "Andheri East",
    "Navi Mumbai"
  ],
  Chennai: [
    "OMR",
    "Tidel Park",
    "Guindy"
  ],
  Ahmedabad: [
    "GIFT City",
    "SG Highway"
  ],
  Kolkata: [
    "Salt Lake Sector V",
    "New Town"
  ]
};

const STIPEND_QUICK_PILLS = [
  { label: "All", value: null },
  { label: "₹5,000+", value: 5000 },
  { label: "₹10,000+", value: 10000 },
  { label: "₹15,000+", value: 15000 },
  { label: "₹20,000+", value: 20000 },
  { label: "₹30,000+", value: 30000 },
  { label: "₹50,000+", value: 50000 },
  { label: "Unpaid", value: 0 }
];

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";

  // Core Filters
  const [country, setCountry] = useState<"India" | "International">("India");
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState("All");
  const [locality, setLocality] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string>("");

  // Work Mode (Multi-Select)
  const [selectedModes, setSelectedModes] = useState<string[]>([]);

  // Stipend Filter
  const [minStipend, setMinStipend] = useState<number | null>(null);
  const [maxStipend, setMaxStipend] = useState<number | null>(null);
  const [stipendType, setStipendType] = useState<string>("All");

  // PPO & Company Type
  const [ppoFilter, setPpoFilter] = useState<string>("all");
  const [companyType, setCompanyType] = useState<string>("All");
  const [verificationStatus, setVerificationStatus] = useState<string>("All");

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState("relevance");
  const [page, setPage] = useState(1);

  // Results State
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  // Trigger search on change
  useEffect(() => {
    fetchJobs();
  }, [
    country,
    query,
    city,
    locality,
    stateFilter,
    radiusKm,
    userCoords,
    selectedModes,
    minStipend,
    maxStipend,
    stipendType,
    ppoFilter,
    companyType,
    verificationStatus,
    sortBy,
    page
  ]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getJobs({
        country: country === "India" ? "India" : "International",
        query: query || undefined,
        city: city !== "All" ? city : undefined,
        locality: locality !== "All" ? locality : undefined,
        state: stateFilter !== "All" ? stateFilter : undefined,
        user_lat: userCoords?.lat,
        user_lng: userCoords?.lng,
        radius_km: radiusKm || undefined,
        work_modes: selectedModes.length > 0 ? selectedModes : undefined,
        min_stipend: minStipend !== null ? minStipend : undefined,
        max_stipend: maxStipend !== null ? maxStipend : undefined,
        stipend_type: stipendType !== "All" ? stipendType : undefined,
        ppo_filter: ppoFilter !== "all" ? ppoFilter : undefined,
        company_type: companyType !== "All" ? companyType : undefined,
        verification_status: verificationStatus !== "All" ? verificationStatus : undefined,
        sort_by: sortBy,
        page,
        page_size: 12
      });

      setJobs(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);

      const map: Record<string, boolean> = {};
      (res.items || []).forEach((j: any) => {
        map[j.id] = !!j.is_saved;
      });
      setSavedMap(map);
    } catch (err) {
      console.error("Failed to load opportunities", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setLocationLabel("Current Device GPS");
        setRadiusKm(25); // default to 25 km around user
        setIsLocating(false);
        setPage(1);
      },
      (err) => {
        console.warn("Location access denied or unavailable", err);
        setIsLocating(false);
        alert("Location permission denied. You can select your city manually from the dropdown.");
      },
      { timeout: 10000 }
    );
  };

  const toggleWorkMode = (mode: string) => {
    if (selectedModes.includes(mode)) {
      setSelectedModes(selectedModes.filter((m) => m !== mode));
    } else {
      setSelectedModes([...selectedModes, mode]);
    }
    setPage(1);
  };

  const toggleSave = async (jobId: string) => {
    const isCurrentlySaved = !!savedMap[jobId];
    setSavedMap({ ...savedMap, [jobId]: !isCurrentlySaved });

    try {
      if (isCurrentlySaved) {
        await api.unsaveJob(jobId);
      } else {
        await api.saveJob(jobId);
      }
    } catch {
      setSavedMap({ ...savedMap, [jobId]: isCurrentlySaved });
    }
  };

  const clearFilters = () => {
    setQuery("");
    setCity("All");
    setLocality("All");
    setStateFilter("All");
    setRadiusKm(null);
    setUserCoords(null);
    setLocationLabel("");
    setSelectedModes([]);
    setMinStipend(null);
    setMaxStipend(null);
    setStipendType("All");
    setPpoFilter("all");
    setCompanyType("All");
    setVerificationStatus("All");
    setSortBy("relevance");
    setPage(1);
  };

  const activeFiltersCount = [
    city !== "All",
    locality !== "All",
    stateFilter !== "All",
    radiusKm !== null,
    userCoords !== null,
    selectedModes.length > 0,
    minStipend !== null,
    maxStipend !== null,
    stipendType !== "All",
    ppoFilter !== "all",
    companyType !== "All",
    verificationStatus !== "All"
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Country Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime animate-pulse" />
            <h1 className="text-3xl font-heading font-black tracking-tight text-charcoal">
              India Opportunity Discovery
            </h1>
          </div>
          <p className="text-sm text-stone mt-1">
            Real-time verified internships, apprenticeships, and entry engineering opportunities across Indian tech hubs.
          </p>
        </div>

        {/* 1. Country Selection Switcher (India default vs International) */}
        <div className="flex items-center p-1.5 bg-white border border-border rounded-xl shadow-subtle w-fit">
          <button
            onClick={() => {
              setCountry("India");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              country === "India"
                ? "bg-charcoal text-white shadow-sm"
                : "text-stone hover:text-charcoal"
            }`}
          >
            <span>🇮🇳</span>
            <span>India (Primary)</span>
          </button>

          <button
            onClick={() => {
              setCountry("International");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              country === "International"
                ? "bg-charcoal text-white shadow-sm"
                : "text-stone hover:text-charcoal"
            }`}
          >
            <span>🌐</span>
            <span>International</span>
          </button>
        </div>
      </div>

      {/* Main Filter & Control Panel */}
      <div className="bg-white rounded-2xl p-5 border border-border shadow-subtle space-y-4">
        {/* Row 1: Search Bar & Primary Sort */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-stone absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by role, stack (Python, RAG, React), or verified employer (Google, PhonePe, AICTE)..."
              className="w-full pl-10 pr-4 py-2.5 bg-ivory rounded-xl border border-border text-sm text-charcoal focus:outline-none focus:border-charcoal focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-border text-sm text-charcoal focus:outline-none focus:border-charcoal focus:bg-white font-semibold"
            >
              <option value="relevance">🎯 Sort: AI Match Score</option>
              <option value="nearest">📍 Sort: Nearest First (Radius)</option>
              <option value="stipend_high">💰 Sort: Highest Stipend</option>
              <option value="ppo_first">⭐ Sort: PPO Opportunities First</option>
              <option value="deadline">📅 Sort: Application Deadline</option>
              <option value="newest">🕒 Sort: Recently Posted</option>
            </select>
          </div>
        </div>

        {/* Row 2: Location, City, Sub-locality, Radius, and Current Location */}
        <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* City Selector */}
          <div>
            <label className="block font-semibold text-stone uppercase text-[10px] mb-1">
              City / Tech Hub
            </label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setLocality("All");
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-ivory rounded-lg border border-border text-xs text-charcoal focus:outline-none font-medium"
            >
              <option value="All">All Cities in India</option>
              <option value="Pune">Pune, MH</option>
              <option value="Bengaluru">Bengaluru, KA</option>
              <option value="Hyderabad">Hyderabad, TS</option>
              <option value="Delhi-NCR">Delhi-NCR (Gurugram/Noida)</option>
              <option value="Mumbai">Mumbai, MH</option>
              <option value="Chennai">Chennai, TN</option>
              <option value="Ahmedabad">Ahmedabad, GJ</option>
              <option value="Kolkata">Kolkata, WB</option>
            </select>
          </div>

          {/* Sub-locality (conditional on city) */}
          <div>
            <label className="block font-semibold text-stone uppercase text-[10px] mb-1">
              Sub-Locality / IT Zone
            </label>
            <select
              value={locality}
              onChange={(e) => {
                setLocality(e.target.value);
                setPage(1);
              }}
              disabled={city === "All" || !LOCALITIES_MAP[city]}
              className="w-full px-3 py-2 bg-ivory rounded-lg border border-border text-xs text-charcoal focus:outline-none font-medium disabled:opacity-50"
            >
              <option value="All">All Localities</option>
              {city !== "All" && LOCALITIES_MAP[city]?.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Radius Filter */}
          <div>
            <label className="block font-semibold text-stone uppercase text-[10px] mb-1">
              Radius (Distance)
            </label>
            <select
              value={radiusKm === null ? "" : String(radiusKm)}
              onChange={(e) => {
                setRadiusKm(e.target.value ? parseInt(e.target.value) : null);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-ivory rounded-lg border border-border text-xs text-charcoal focus:outline-none font-medium"
            >
              <option value="">Anywhere in India</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>
          </div>

          {/* State Filter */}
          <div>
            <label className="block font-semibold text-stone uppercase text-[10px] mb-1">
              State
            </label>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-ivory rounded-lg border border-border text-xs text-charcoal focus:outline-none font-medium"
            >
              <option value="All">All States</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Telangana">Telangana</option>
              <option value="Delhi">Delhi</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Gujarat">Gujarat</option>
              <option value="West Bengal">West Bengal</option>
            </select>
          </div>

          {/* Use Current GPS Location Button */}
          <div className="flex items-end">
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className={`w-full py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                userCoords
                  ? "bg-lime text-charcoal border-lime shadow-subtle"
                  : "bg-ivory text-stone border-border hover:text-charcoal hover:border-charcoal"
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-current" />
              <span>{isLocating ? "Locating..." : userCoords ? "GPS Active (25km)" : "Use My Location"}</span>
            </button>
          </div>
        </div>

        {/* Row 3: Work Mode Multi-Select, PPO Filter, and Stipend Quick Pills */}
        <div className="pt-3 border-t border-border grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Work Mode Multi-Select Buttons */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block font-semibold text-stone uppercase text-[10px]">
              Work Mode (Multi-Select)
            </label>
            <div className="flex items-center gap-2">
              {[
                { label: "Remote", icon: "🏠" },
                { label: "Hybrid", icon: "🔄" },
                { label: "On-site", icon: "🏢" }
              ].map((mode) => {
                const isSelected = selectedModes.includes(mode.label);
                return (
                  <button
                    key={mode.label}
                    onClick={() => toggleWorkMode(mode.label)}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? "bg-charcoal text-white border-charcoal shadow-sm"
                        : "bg-ivory text-stone border-border hover:text-charcoal"
                    }`}
                  >
                    <span>{mode.icon}</span>
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated PPO Filter */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block font-semibold text-stone uppercase text-[10px]">
              ⭐ PPO / Pre-Placement Offer Filter
            </label>
            <select
              value={ppoFilter}
              onChange={(e) => {
                setPpoFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-ivory rounded-lg border border-border text-xs text-charcoal focus:outline-none font-bold"
            >
              <option value="all">⭐ All Opportunities (PPO & Standard)</option>
              <option value="ppo_only">⭐ Only Internships with PPO</option>
              <option value="potential_ppo">⭐ Potential PPO / Full-time Conversion</option>
            </select>
          </div>

          {/* Company Type & Verification */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block font-semibold text-stone uppercase text-[10px]">
              Company Category & Verification
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={companyType}
                onChange={(e) => {
                  setCompanyType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2 py-1.5 bg-ivory rounded-lg border border-border text-[11px] text-charcoal focus:outline-none font-medium"
              >
                <option value="All">All Types</option>
                <option value="Product-based">Product Startups</option>
                <option value="MNC">Global MNCs</option>
                <option value="Government organization">Govt / AICTE / PM</option>
                <option value="Fintech">Fintech</option>
                <option value="AI/ML startup">AI/ML Startups</option>
                <option value="Service-based">IT & Services</option>
              </select>

              <select
                value={verificationStatus}
                onChange={(e) => {
                  setVerificationStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2 py-1.5 bg-ivory rounded-lg border border-border text-[11px] text-charcoal focus:outline-none font-bold text-[#1B5E20]"
              >
                <option value="All">All Statuses</option>
                <option value="Verified">🟢 Verified Only</option>
                <option value="Verification Pending">🟡 Review Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 4: Monthly Stipend Quick Filter Pills */}
        <div className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-stone mr-1">
              Monthly Stipend (₹ INR):
            </span>
            {STIPEND_QUICK_PILLS.map((pill) => {
              const isSelected = minStipend === pill.value;
              return (
                <button
                  key={pill.label}
                  onClick={() => {
                    setMinStipend(pill.value);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border ${
                    isSelected
                      ? "bg-lime text-charcoal border-lime-dark/40 shadow-sm"
                      : "bg-ivory text-stone border-border hover:text-charcoal hover:border-charcoal"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-stone hover:text-charcoal text-xs font-semibold flex items-center gap-1 py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Badges Bar */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-stone font-medium text-[11px]">Active Filters:</span>
          {city !== "All" && (
            <span className="inline-flex items-center gap-1 bg-white border border-border px-2.5 py-1 rounded-md font-medium text-charcoal">
              City: {city}
              <X className="w-3 h-3 cursor-pointer text-stone hover:text-charcoal" onClick={() => setCity("All")} />
            </span>
          )}
          {locality !== "All" && (
            <span className="inline-flex items-center gap-1 bg-white border border-border px-2.5 py-1 rounded-md font-medium text-charcoal">
              Locality: {locality}
              <X className="w-3 h-3 cursor-pointer text-stone hover:text-charcoal" onClick={() => setLocality("All")} />
            </span>
          )}
          {radiusKm !== null && (
            <span className="inline-flex items-center gap-1 bg-white border border-border px-2.5 py-1 rounded-md font-medium text-charcoal">
              Radius: {radiusKm} km
              <X className="w-3 h-3 cursor-pointer text-stone hover:text-charcoal" onClick={() => setRadiusKm(null)} />
            </span>
          )}
          {userCoords && (
            <span className="inline-flex items-center gap-1 bg-lime/20 border border-lime/60 px-2.5 py-1 rounded-md font-bold text-charcoal">
              📍 GPS Location Active
              <X className="w-3 h-3 cursor-pointer text-stone hover:text-charcoal" onClick={() => setUserCoords(null)} />
            </span>
          )}
          {selectedModes.map((m) => (
            <span key={m} className="inline-flex items-center gap-1 bg-white border border-border px-2.5 py-1 rounded-md font-medium text-charcoal">
              Mode: {m}
              <X className="w-3 h-3 cursor-pointer text-stone hover:text-charcoal" onClick={() => toggleWorkMode(m)} />
            </span>
          ))}
          {minStipend !== null && (
            <span className="inline-flex items-center gap-1 bg-white border border-border px-2.5 py-1 rounded-md font-medium text-charcoal">
              Min Stipend: ₹{minStipend.toLocaleString("en-IN")}+
              <X className="w-3 h-3 cursor-pointer text-stone hover:text-charcoal" onClick={() => setMinStipend(null)} />
            </span>
          )}
          {ppoFilter !== "all" && (
            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-bold text-amber-900">
              ⭐ PPO Filter Active
              <X className="w-3 h-3 cursor-pointer text-stone hover:text-charcoal" onClick={() => setPpoFilter("all")} />
            </span>
          )}
          {companyType !== "All" && (
            <span className="inline-flex items-center gap-1 bg-white border border-border px-2.5 py-1 rounded-md font-medium text-charcoal">
              Type: {companyType}
              <X className="w-3 h-3 cursor-pointer text-stone hover:text-charcoal" onClick={() => setCompanyType("All")} />
            </span>
          )}
        </div>
      )}

      {/* Results Count & Status Bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-stone px-1">
        <span>
          Showing {jobs.length} of {total} verified opportunities
        </span>
        <span className="flex items-center gap-1 text-[#1B5E20]">
          <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
          Verified authentic employer listings
        </span>
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-white rounded-2xl border border-border animate-pulse p-6" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="text-center py-20 space-y-4">
          <Briefcase className="w-12 h-12 text-stone/40 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-charcoal">
            No opportunities match your filter combination
          </h3>
          <p className="text-stone text-xs max-w-sm mx-auto">
            Try expanding your search radius, selecting "All Cities", or loosening the stipend and PPO filters.
          </p>
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <OpportunityCard
              key={job.id}
              job={job}
              isSaved={!!savedMap[job.id]}
              onToggleSave={toggleSave}
              showMatchExplanation={true}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-xs font-mono font-medium text-stone px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function DiscoverJobsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-stone text-sm animate-pulse">Loading India-first discovery engine...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
