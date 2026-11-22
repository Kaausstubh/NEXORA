"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, User, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, setToken, setUser } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.register({ name, email, password });
      setToken(res.access_token);
      setUser({ id: res.user_id, name: res.name, email: res.email, has_profile: false });
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Failed to register. Please verify your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-lime selection:text-charcoal">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-charcoal flex items-center justify-center text-lime font-heading font-black text-xl group-hover:scale-105 transition-transform">
            N
          </div>
          <span className="font-heading font-bold text-2xl tracking-tight text-charcoal">
            NEXORA
          </span>
        </Link>
        <h2 className="text-3xl font-heading font-extrabold text-charcoal">
          Create your account
        </h2>
        <p className="text-sm text-stone">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-charcoal hover:underline">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-border shadow-premium">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.mercer@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory rounded-lg border border-border text-charcoal text-sm focus:outline-none focus:border-charcoal focus:bg-white transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full mt-2 shadow-sm hover:shadow-lime-glow"
              isLoading={loading}
            >
              Continue to Onboarding
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="mt-6 text-xs text-center text-stone leading-relaxed">
            By creating an account, you agree to NEXORA&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
