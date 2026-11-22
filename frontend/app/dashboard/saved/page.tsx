"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OpportunityCard } from "@/components/OpportunityCard";
import { api } from "@/lib/api";

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    try {
      const res = await api.getSavedJobs();
      setJobs(res || []);
    } catch (err) {
      console.error("Failed to load saved jobs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId: string) => {
    try {
      await api.unsaveJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error("Failed to unsave job", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-charcoal" />
            <h1 className="text-3xl font-heading font-black tracking-tight text-charcoal">
              Saved Opportunities
            </h1>
          </div>
          <p className="text-sm text-stone mt-1">
            Track and manage verified internships and job opportunities bookmarked for application.
          </p>
        </div>
        <span className="text-xs font-mono font-semibold text-stone bg-white px-3 py-1.5 rounded-lg border border-border">
          {jobs.length} Opportunities Bookmarked
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="text-center py-16 space-y-4">
          <Bookmark className="w-12 h-12 text-stone/40 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-charcoal">
            No saved opportunities yet
          </h3>
          <p className="text-stone text-xs max-w-sm mx-auto">
            Browse active listings in Discover Jobs or Smart Matches and bookmark high-affinity roles.
          </p>
          <Link href="/dashboard/discover">
            <Button variant="secondary" size="sm">
              Explore Discover Jobs
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <OpportunityCard
              key={job.id}
              job={job}
              isSaved={true}
              onToggleSave={handleUnsave}
              showMatchExplanation={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
