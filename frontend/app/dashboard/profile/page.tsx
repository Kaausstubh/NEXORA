"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Save,
  Briefcase
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api, getUser } from "@/lib/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [currentRole, setCurrentRole] = useState("");
  const [experienceYears, setExperienceYears] = useState(3.0);
  const [location, setLocation] = useState("");
  const [salaryExpectation, setSalaryExpectation] = useState<number>(150000);
  const [employmentPreference, setEmploymentPreference] = useState("Remote");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
      setCurrentRole(data.current_role || "");
      setExperienceYears(data.experience_years || 0);
      setLocation(data.location || "");
      setSalaryExpectation(data.salary_expectation || 150000);
      setEmploymentPreference(data.employment_preference || "Remote");
      setBio(data.bio || "");
      setSkills(data.skills || []);
    } catch (err: any) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.skill_name.toLowerCase() === trimmed.toLowerCase())) return;
    setSkills([...skills, { skill_name: trimmed, proficiency: "Intermediate", category: "Technical" }]);
    setNewSkillInput("");
  };

  const handleRemoveSkill = (name: string) => {
    setSkills(skills.filter((s) => s.skill_name !== name));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        current_role: currentRole,
        experience_years: experienceYears,
        location: location,
        preferred_roles: profile?.preferred_roles || [currentRole],
        preferred_locations: profile?.preferred_locations || [location],
        salary_expectation: salaryExpectation,
        employment_preference: employmentPreference,
        bio: bio,
        skills: skills.map((s) => ({
          skill_name: s.skill_name,
          proficiency: s.proficiency || "Intermediate",
          category: s.category || "Technical",
        })),
      };

      const updated = await api.saveProfile(payload);
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white rounded-lg w-1/4" />
        <div className="h-96 bg-white rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-charcoal" />
            <h1 className="text-3xl font-heading font-black tracking-tight text-charcoal">
              Candidate Profile & Embedding
            </h1>
          </div>
          <p className="text-sm text-stone mt-1">
            Updating your profile triggers automatic re-calculation of your 384-dimensional vector embedding.
          </p>
        </div>

        <Button
          variant="accent"
          size="md"
          onClick={handleSave}
          isLoading={saving}
          className="shadow-sm"
        >
          <Save className="w-4 h-4 mr-1.5" />
          Save & Re-Index
        </Button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-[#EAF9D2] border border-[#C7F36B] text-xs font-semibold text-[#345312] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#345312]" />
          Candidate profile and pgvector dense embedding successfully updated!
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          {error}
        </div>
      )}

      {/* Main Edit Form */}
      <Card className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Current Job Title
            </label>
            <input
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Current Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Experience ({experienceYears} years)
            </label>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={experienceYears}
              onChange={(e) => setExperienceYears(parseFloat(e.target.value))}
              className="w-full accent-charcoal mt-2 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Workplace Setting
            </label>
            <select
              value={employmentPreference}
              onChange={(e) => setEmploymentPreference(e.target.value)}
              className="w-full px-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white"
            >
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
              <option value="Any">Any Setting</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Expected Base Salary (${salaryExpectation.toLocaleString()})
            </label>
            <input
              type="number"
              step="5000"
              value={salaryExpectation}
              onChange={(e) => setSalaryExpectation(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
            Executive Summary / Bio
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white"
          />
        </div>

        {/* Skills Management */}
        <div className="pt-4 border-t border-border space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal">
            Skills & Competencies ({skills.length})
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add skill (e.g. pgvector, PyTorch, Kubernetes)..."
              className="flex-1 px-4 py-2 bg-ivory rounded-lg border border-border text-sm text-charcoal"
            />
            <Button variant="secondary" size="sm" onClick={handleAddSkill}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {skills.map((s) => (
              <span
                key={s.skill_name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivory border border-border rounded-lg text-xs font-mono text-charcoal"
              >
                <span>{s.skill_name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(s.skill_name)}
                  className="text-stone hover:text-red-500 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
