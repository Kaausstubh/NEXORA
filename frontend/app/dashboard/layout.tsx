"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Bot,
  FileText,
  BarChart2,
  Bookmark,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Zap,
  ShieldCheck
} from "lucide-react";
import { getUser, removeToken } from "@/lib/api";

const NAVIGATION = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Discover Jobs", href: "/dashboard/discover", icon: Compass },
  { name: "Trust & Safety", href: "/dashboard/admin/fraud", icon: ShieldCheck },
  { name: "Smart Matches", href: "/dashboard/matches", icon: Sparkles },
  { name: "AI Career Agent", href: "/dashboard/agent", icon: Bot },
  { name: "Resume Insights", href: "/dashboard/resume", icon: FileText },
  { name: "Skill Gap Analysis", href: "/dashboard/skills", icon: BarChart2 },
  { name: "Saved Jobs", href: "/dashboard/saved", icon: Bookmark },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUserState] = useState<any>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
    } else {
      setUserState(u);
    }
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "NX";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-charcoal text-white border-r border-charcoal-border transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Top Branding */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-charcoal-border">
            <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-charcoal-surface flex items-center justify-center text-lime font-heading font-black text-xl border border-lime/30 shrink-0">
                N
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-lg tracking-tight text-white">
                    NEXORA
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-stone-light -mt-0.5 font-mono">
                    Intelligence OS
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex w-7 h-7 rounded-lg bg-charcoal-surface text-stone-light hover:text-white items-center justify-center border border-charcoal-border hover:border-lime/40 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-stone-light hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            {NAVIGATION.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-lime text-charcoal font-semibold shadow-sm shadow-lime/20"
                      : "text-stone-light hover:bg-charcoal-surface hover:text-white"
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-charcoal" : "text-stone"}`} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Status */}
        <div className="p-3 border-t border-charcoal-border space-y-2">
          {!collapsed && (
            <div className="p-2.5 rounded-xl bg-charcoal-surface border border-charcoal-border flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime animate-pulse shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] uppercase font-mono font-bold text-lime">
                  pgvector Engine
                </span>
                <span className="text-[10px] text-stone truncate">
                  384-D Cosine Retrieval
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-2 rounded-xl bg-charcoal-surface border border-charcoal-border">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-charcoal-light flex items-center justify-center text-xs font-bold text-lime shrink-0 border border-lime/30">
                {getInitials(user?.name)}
              </div>
              {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-white truncate">
                    {user?.name || "Candidate"}
                  </span>
                  <span className="text-[10px] text-stone truncate">
                    {user?.email || "user@nexora.io"}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="text-stone hover:text-red-400 p-1.5 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-charcoal p-1 rounded-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ivory border border-border text-xs text-stone w-64">
              <Search className="w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search jobs, skills, roles..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push(`/dashboard/discover?query=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                  }
                }}
                className="bg-transparent focus:outline-none text-charcoal w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/agent">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-charcoal text-white hover:bg-charcoal-light text-xs font-medium transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-lime" />
                <span className="hidden sm:inline">Ask AI Agent</span>
              </button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
