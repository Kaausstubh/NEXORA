"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  FileText,
  Plus,
  X,
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api, getUser, setUser } from "@/lib/api";

const SUGGESTED_SKILLS = [
  "Python", "FastAPI", "PostgreSQL", "Docker", "RAG", "LangChain",
  "LangGraph", "TypeScript", "React", "Next.js", "Kubernetes", "AWS",
  "Machine Learning", "Redis", "Kafka", "pgvector", "SQL", "Git"
];

const PREFERRED_ROLES_OPTIONS = [
  "AI Backend Engineer", "Python Developer", "Full Stack AI Engineer",
  "MLOps Engineer", "Machine Learning Engineer", "Senior Backend Engineer"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  // Step 1: Basic
  const [fullName, setFullName] = useState("");
  const [currentRole, setCurrentRole] = useState("Python Backend Engineer");
  const [experienceYears, setExperienceYears] = useState(3.0);
  const [location, setLocation] = useState("San Francisco, CA");

  // Step 2: Skills
  const [skills, setSkills] = useState<Array<{ skill_name: string; proficiency: string; category: string }>>([
    { skill_name: "Python", proficiency: "Expert", category: "Technical" },
    { skill_name: "FastAPI", proficiency: "Advanced", category: "Framework" },
    { skill_name: "PostgreSQL", proficiency: "Advanced", category: "Database" },
    { skill_name: "Docker", proficiency: "Intermediate", category: "DevOps" },
    { skill_name: "RAG", proficiency: "Advanced", category: "AI/ML" },
  ]);
  const [newSkillName, setNewSkillName] = useState("");

  // Step 3: Preferences
  const [preferredRoles, setPreferredRoles] = useState<string[]>(["AI Backend Engineer", "Python Developer"]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>(["Remote", "San Francisco, CA"]);
  const [newLocationInput, setNewLocationInput] = useState("");
  const [workplaceType, setWorkplaceType] = useState("Remote");
  const [salaryExpectation, setSalaryExpectation] = useState<number>(155000);
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [bio, setBio] = useState("Passionate engineer focused on high-throughput backend services and stateful AI agent architectures.");

  // Step 4: Resume
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeAnalyzing, setResumeAnalyzing] = useState(false);
  const [resumeAnalysisResult, setResumeAnalysisResult] = useState<any | null>(null);
  const [isDraggingResume, setIsDraggingResume] = useState(false);

  // Step 5: Profile Generation State
  const [embeddingCompleted, setEmbeddingCompleted] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user && user.name) {
      setFullName(user.name);
    }
  }, []);

  const addSkill = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.skill_name.toLowerCase() === trimmed.toLowerCase())) return;
    setSkills([...skills, { skill_name: trimmed, proficiency: "Intermediate", category: "Technical" }]);
    setNewSkillName("");
  };

  const removeSkill = (name: string) => {
    setSkills(skills.filter((s) => s.skill_name !== name));
  };

  const toggleRole = (role: string) => {
    if (preferredRoles.includes(role)) {
      setPreferredRoles(preferredRoles.filter((r) => r !== role));
    } else {
      setPreferredRoles([...preferredRoles, role]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
    setResumeAnalyzing(true);
    setError(null);

    try {
      const result = await api.uploadResume(file);
      setResumeAnalysisResult(result);

      // Auto-populate extracted skills if available
      if (result.skills_extracted && result.skills_extracted.length > 0) {
        const newExtracted = result.skills_extracted.map((s: string) => ({
          skill_name: s,
          proficiency: "Advanced",
          category: "Extracted",
        }));
        // Merge without duplicates
        const existingNames = new Set(skills.map((s) => s.skill_name.toLowerCase()));
        const uniqueToAdd = newExtracted.filter((s: any) => !existingNames.has(s.skill_name.toLowerCase()));
        setSkills((prev) => [...prev, ...uniqueToAdd]);
      }
      if (result.raw_analysis?.candidate_role) {
        setCurrentRole(result.raw_analysis.candidate_role);
      }
      if (result.raw_analysis?.estimated_years_experience) {
        setExperienceYears(result.raw_analysis.estimated_years_experience);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze resume document.");
    } finally {
      setResumeAnalyzing(false);
    }
  };

  const handleResumeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingResume) setIsDraggingResume(true);
  };

  const handleResumeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingResume(false);
  };

  const handleResumeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingResume(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileUpload({ target: { files: [droppedFile] } } as any);
    }
  };

  const finalizeProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        current_role: currentRole,
        experience_years: experienceYears,
        location: location,
        preferred_roles: preferredRoles,
        preferred_locations: preferredLocations,
        salary_expectation: salaryExpectation,
        employment_preference: workplaceType,
        bio: bio,
        skills: skills.map((s) => ({
          skill_name: s.skill_name,
          proficiency: s.proficiency,
          category: s.category,
        })),
      };

      const res = await api.saveProfile(payload);
      const user = getUser();
      if (user) {
        setUser({ ...user, has_profile: true });
      }
      setEmbeddingCompleted(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to finalize candidate profile.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col py-10 px-4 sm:px-6 lg:px-8 selection:bg-lime selection:text-charcoal">
      {/* Header */}
      <div className="max-w-3xl mx-auto w-full mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-charcoal flex items-center justify-center text-lime font-heading font-black text-lg">
            N
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg text-charcoal">NEXORA Setup</h1>
            <p className="text-xs text-stone">Candidate Intelligence Profile Builder</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-white border border-border rounded-md text-stone-dark">
          Step {currentStep} of 5
        </span>
      </div>

      {/* Progress Bar */}
      <div className="max-w-3xl mx-auto w-full mb-8">
        <div className="grid grid-cols-5 gap-2">
          {["Basic Info", "Skills", "Preferences", "Resume", "Vector Index"].map((stepTitle, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <div key={idx} className="flex flex-col gap-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-charcoal"
                      : isCurrent
                      ? "bg-lime border border-charcoal/20"
                      : "bg-[#E5E4DC]"
                  }`}
                />
                <span className={`text-[10px] font-medium hidden sm:inline ${
                  isCurrent ? "text-charcoal font-bold" : "text-stone"
                }`}>
                  {stepTitle}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-10 shadow-premium">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: BASIC INFORMATION */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <Badge variant="stone" size="sm">STEP 1: BACKGROUND</Badge>
                  <h2 className="text-2xl font-heading font-extrabold text-charcoal mt-1">
                    Tell us about your engineering profile
                  </h2>
                  <p className="text-sm text-stone mt-1">
                    This provides baseline context for our semantic matching algorithm.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full px-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Current Job Title
                    </label>
                    <input
                      type="text"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      placeholder="e.g. Python Backend Engineer"
                      className="w-full px-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                        Years of Experience ({experienceYears} yrs)
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
                        Current Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="San Francisco, CA or Remote"
                        className="w-full px-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Brief Professional Summary
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Summary of engineering focus, systems built, or career goals..."
                      className="w-full px-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SKILLS */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <Badge variant="stone" size="sm">STEP 2: COMPETENCIES</Badge>
                  <h2 className="text-2xl font-heading font-extrabold text-charcoal mt-1">
                    What skills define your stack?
                  </h2>
                  <p className="text-sm text-stone mt-1">
                    Add programming languages, frameworks, vector search tools, and cloud platforms.
                  </p>
                </div>

                {/* Add Custom Skill input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill(newSkillName);
                      }
                    }}
                    placeholder="Type a skill and press Enter (e.g. pgvector, PyTorch)"
                    className="flex-1 px-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white"
                  />
                  <Button variant="primary" size="md" onClick={() => addSkill(newSkillName)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Current Skills list */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal block mb-2">
                    Your Registered Skills ({skills.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span
                        key={s.skill_name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivory border border-border rounded-lg text-xs font-medium text-charcoal"
                      >
                        <span>{s.skill_name}</span>
                        <select
                          value={s.proficiency}
                          onChange={(e) => {
                            const newProf = e.target.value;
                            setSkills(skills.map((item) => item.skill_name === s.skill_name ? { ...item, proficiency: newProf } : item));
                          }}
                          className="bg-transparent text-[11px] text-stone font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeSkill(s.skill_name)}
                          className="text-stone hover:text-red-500 ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggested Skills */}
                <div className="pt-2 border-t border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone block mb-2">
                    Popular Suggestions (Click to add)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_SKILLS.map((item) => {
                      const isAdded = skills.some((s) => s.skill_name.toLowerCase() === item.toLowerCase());
                      return (
                        <button
                          key={item}
                          type="button"
                          disabled={isAdded}
                          onClick={() => addSkill(item)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                            isAdded
                              ? "bg-charcoal text-white border-charcoal opacity-40 cursor-default"
                              : "bg-white text-stone-dark border-border hover:border-charcoal hover:text-charcoal"
                          }`}
                        >
                          + {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CAREER PREFERENCES */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <Badge variant="stone" size="sm">STEP 3: TARGET CRITERIA</Badge>
                  <h2 className="text-2xl font-heading font-extrabold text-charcoal mt-1">
                    Your dream role parameters
                  </h2>
                  <p className="text-sm text-stone mt-1">
                    We use these for SQL filtering alongside dense vector retrieval.
                  </p>
                </div>

                {/* Desired Roles */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-2">
                    Desired Job Roles
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PREFERRED_ROLES_OPTIONS.map((role) => {
                      const isSelected = preferredRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(role)}
                          className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all ${
                            isSelected
                              ? "bg-[#F3FBDF] border-lime text-charcoal shadow-sm"
                              : "bg-ivory border-border text-stone-dark hover:border-charcoal"
                          }`}
                        >
                          <span>{role}</span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Workplace type & Salary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Workplace Setting
                    </label>
                    <select
                      value={workplaceType}
                      onChange={(e) => setWorkplaceType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white"
                    >
                      <option value="Remote">Remote Only</option>
                      <option value="Hybrid">Hybrid Acceptable</option>
                      <option value="On-site">On-site Preferred</option>
                      <option value="Any">Any Setting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Minimum Expected Salary (${salaryExpectation.toLocaleString()}/yr)
                    </label>
                    <input
                      type="range"
                      min="70000"
                      max="250000"
                      step="5000"
                      value={salaryExpectation}
                      onChange={(e) => setSalaryExpectation(parseInt(e.target.value))}
                      className="w-full accent-charcoal mt-2 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Preferred Locations */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                    Preferred Locations
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newLocationInput}
                      onChange={(e) => setNewLocationInput(e.target.value)}
                      placeholder="Add city or region (e.g. Remote, New York, NY)"
                      className="flex-1 px-4 py-2 bg-ivory rounded-lg border border-border text-charcoal text-sm"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (newLocationInput.trim() && !preferredLocations.includes(newLocationInput.trim())) {
                          setPreferredLocations([...preferredLocations, newLocationInput.trim()]);
                          setNewLocationInput("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {preferredLocations.map((loc) => (
                      <span key={loc} className="px-2.5 py-1 bg-ivory border border-border rounded-md text-xs text-charcoal flex items-center gap-1">
                        {loc}
                        <button
                          type="button"
                          onClick={() => setPreferredLocations(preferredLocations.filter((l) => l !== loc))}
                          className="text-stone hover:text-red-500 ml-1"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: RESUME UPLOAD */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <Badge variant="stone" size="sm">STEP 4: RESUME ANALYSIS</Badge>
                  <h2 className="text-2xl font-heading font-extrabold text-charcoal mt-1">
                    Upload your resume (Optional)
                  </h2>
                  <p className="text-sm text-stone mt-1">
                    Upload a resume in PDF, Word (.docx, .doc), or Text (.txt) format. NEXORA automatically extracts structural competencies and calculates your Resume Strength Score.
                  </p>
                </div>

                {/* File Dropzone with Drag and Drop */}
                <div
                  onDragOver={handleResumeDragOver}
                  onDragEnter={handleResumeDragOver}
                  onDragLeave={handleResumeDragLeave}
                  onDrop={handleResumeDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    isDraggingResume
                      ? "border-charcoal bg-[#F0F8E2] scale-[1.01] shadow-premium ring-4 ring-lime/40"
                      : "border-border hover:border-charcoal bg-ivory/50"
                  }`}
                >
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.docx,.doc,.txt,.text,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                      isDraggingResume
                        ? "bg-lime text-charcoal scale-110 shadow-md"
                        : "bg-white border border-border text-charcoal shadow-sm"
                    }`}>
                      <UploadCloud className={`w-7 h-7 ${isDraggingResume ? "animate-bounce text-charcoal" : "text-stone"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-charcoal">
                        {isDraggingResume
                          ? "Drop your resume file here to parse!"
                          : resumeFile
                          ? `Loaded: ${resumeFile.name}`
                          : "Click to select or drag & drop your resume file"}
                      </p>
                      <p className="text-xs text-stone mt-0.5">
                        PDF (.pdf), Word (.docx, .doc), or Text (.txt) up to 10MB
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                      <span className="px-3 py-1.5 rounded-md bg-white border border-border text-xs font-semibold text-charcoal shadow-subtle hover:bg-ivory transition-colors">
                        Browse File
                      </span>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setResumeAnalyzing(true);
                          setError(null);
                          try {
                            const res = await fetch("/sample_resume.pdf");
                            const blob = await res.blob();
                            const sampleFile = new File([blob], "alex_mercer_sample_resume.pdf", { type: "application/pdf" });
                            setResumeFile(sampleFile);
                            const result = await api.uploadResume(sampleFile);
                            setResumeAnalysisResult(result);
                            if (result.skills_extracted?.length) {
                              const newExtracted = result.skills_extracted.map((s: string) => ({
                                skill_name: s,
                                proficiency: "Advanced",
                                category: "Extracted",
                              }));
                              const existing = new Set(skills.map((s) => s.skill_name.toLowerCase()));
                              const unique = newExtracted.filter((s: any) => !existing.has(s.skill_name.toLowerCase()));
                              setSkills((prev) => [...prev, ...unique]);
                            }
                            if (result.raw_analysis?.candidate_role) setCurrentRole(result.raw_analysis.candidate_role);
                            if (result.raw_analysis?.estimated_years_experience) setExperienceYears(result.raw_analysis.estimated_years_experience);
                          } catch (err: any) {
                            setError(err.message || "Failed to load sample resume.");
                          } finally {
                            setResumeAnalyzing(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-md bg-[#F3FBDF] border border-lime text-xs font-semibold text-charcoal hover:bg-lime transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-lime-dark" />
                        Load Verified Sample Resume
                      </button>
                    </div>
                  </label>
                </div>

                {resumeAnalyzing && (
                  <div className="p-4 rounded-xl bg-ivory border border-border flex items-center gap-3">
                    <div className="animate-spin w-5 h-5 border-2 border-charcoal border-t-transparent rounded-full" />
                    <span className="text-xs font-medium text-stone">
                      Parsing document text, extracting competencies, and calculating Resume Strength Score...
                    </span>
                  </div>
                )}

                {resumeAnalysisResult && (
                  <div className="p-5 rounded-xl border border-lime bg-[#F8FDED] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <span className="font-heading font-bold text-sm text-charcoal">
                          Resume Successfully Analyzed
                        </span>
                      </div>
                      <Badge variant="lime">
                        Strength: {resumeAnalysisResult.strength_score}%
                      </Badge>
                    </div>
                    <p className="text-xs text-charcoal leading-relaxed">
                      {resumeAnalysisResult.experience_summary}
                    </p>
                    <div className="pt-2 border-t border-lime/30">
                      <span className="text-[11px] font-semibold text-stone uppercase block mb-1">
                        Detected Skills Added to Profile:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {resumeAnalysisResult.skills_extracted.slice(0, 10).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-white border border-border rounded text-[11px] font-mono text-charcoal">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 5: AI PROFILE GENERATION & EMBEDDING */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 text-center py-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-charcoal text-lime flex items-center justify-center mx-auto shadow-lime-glow">
                  <Cpu className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h2 className="text-3xl font-heading font-black text-charcoal">
                    Ready to Generate Vector Index
                  </h2>
                  <p className="text-sm text-stone leading-relaxed">
                    NEXORA will compile your profile, calculate a 384-dimensional dense semantic embedding, and store it in PostgreSQL pgvector.
                  </p>
                </div>

                {/* Profile Overview Card */}
                <div className="bg-ivory rounded-xl p-5 border border-border text-left max-w-md mx-auto space-y-2.5 text-xs text-stone">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="font-semibold text-charcoal">Current Role:</span>
                    <span>{currentRole} ({experienceYears} yrs)</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="font-semibold text-charcoal">Skills Registered:</span>
                    <span>{skills.length} competencies</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="font-semibold text-charcoal">Target Setting:</span>
                    <span>{workplaceType} • ${salaryExpectation.toLocaleString()}+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-charcoal">Vector Dimension:</span>
                    <span className="font-mono text-charcoal font-bold">384-D dense float</span>
                  </div>
                </div>

                {embeddingCompleted && (
                  <div className="p-4 rounded-xl bg-[#EAF9D2] border border-[#C7F36B] text-xs font-semibold text-[#345312] max-w-md mx-auto flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-[#345312]" />
                    Profile & Dense Embeddings Indexed! Navigating to Dashboard...
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
            {currentStep > 1 ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading || embeddingCompleted}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next Step
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="accent"
                size="lg"
                onClick={finalizeProfile}
                isLoading={loading}
                disabled={embeddingCompleted}
                className="shadow-premium"
              >
                Generate Vector Profile & Launch
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
