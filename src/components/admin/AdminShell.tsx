import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Users,
  UserCog,
  Tag,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { adminLogout } from "@/lib/admin.server";
import { supabase } from "@/lib/supabase";
import { BookingsManagement } from "./BookingsManagement";
import { CalendarTab } from "./CalendarTab";
import { SettingsTab } from "./SettingsTab";

interface AdminShellProps {
  userEmail: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AdminShell({ userEmail, onLogout, children }: AdminShellProps) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await adminLogout();
      await supabase.auth.signOut();
      onLogout();
      navigate({ to: "/admin" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, status: "Active" },
    { name: "Bookings Management", icon: CalendarCheck, status: "Active" },
    { name: "Calendar", icon: Calendar, status: "Active" },
    { name: "Services & Prices", icon: Tag, status: "Coming Soon" },
    { name: "Settings", icon: Settings, status: "Active" },
  ];


  return (
    <div className="flex min-h-screen bg-black text-white" data-admin>
      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[color:var(--ink)] border-r border-[color:var(--hairline-dark)] transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-16"
        }`}
      >
        {/* Sidebar Header */}
        <div className={`flex h-16 items-center justify-between border-b border-[color:var(--hairline-dark)] ${isSidebarOpen ? "px-4" : "px-2"}`}>
          {isSidebarOpen ? (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl tracking-tight text-white">STRIDE</span>
              <span className="eyebrow text-[10px] text-[color:var(--muted-on-dark)] uppercase tracking-wider font-mono">
                Admin
              </span>
            </div>
          ) : (
            <span className="font-display text-[10px] tracking-tight text-white mx-auto uppercase">STRIDE</span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-[color:var(--muted-on-dark)] hover:text-white p-1 hover:bg-white/5"
            style={{ borderRadius: 3 }}
          >
            {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            const isComingSoon = item.status === "Coming Soon";

            return (
              <button
                key={item.name}
                onClick={() => {
                  if (!isComingSoon) {
                    setActiveTab(item.name);
                  }
                }}
                disabled={isComingSoon}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors relative group font-mono text-xs uppercase tracking-wider ${
                  isActive
                    ? "text-white bg-white/5 border-l-2 border-[color:var(--ember)]"
                    : isComingSoon
                    ? "text-[color:var(--muted-on-dark)]/40 cursor-not-allowed"
                    : "text-[color:var(--muted-on-dark)] hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                }`}
                style={{ borderRadius: "0 3px 3px 0" }}
                title={isComingSoon ? `${item.name} (Coming Soon)` : item.name}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[color:var(--ember)]" : ""}`} />
                {isSidebarOpen && (
                  <span className="truncate flex-1 text-left">{item.name}</span>
                )}
                {isSidebarOpen && isComingSoon && (
                  <span className="text-[8px] font-sans bg-white/5 border border-white/10 px-1 py-0.5 rounded text-[color:var(--muted-on-dark)] scale-90">
                    Soon
                  </span>
                )}

                {/* Tooltip for collapsed mode */}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 border border-[color:var(--hairline-dark)] text-white text-[10px] uppercase font-mono tracking-wider invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.name} {isComingSoon ? "(Coming Soon)" : ""}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[color:var(--hairline-dark)]">
          {isSidebarOpen ? (
            <div className="flex flex-col gap-2">
              <div className="px-3 py-1.5 bg-black/40 border border-[color:var(--hairline-dark)]" style={{ borderRadius: 3 }}>
                <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)] truncate" title={userEmail}>
                  {userEmail}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono uppercase text-[color:var(--ember)] hover:text-[color:var(--ember-hover)] hover:bg-[color:var(--ember)]/10 transition-colors border border-[color:var(--ember)]/20"
                style={{ borderRadius: 3 }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-[color:var(--ember)] hover:bg-[color:var(--ember)]/10"
              style={{ borderRadius: 3 }}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarOpen ? "pl-64" : "pl-16"
        }`}
      >
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between px-6 bg-[color:var(--ink)] border-b border-[color:var(--hairline-dark)] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-[color:var(--muted-on-dark)]">
              System
            </span>
            <span className="text-[color:var(--hairline-dark)]">/</span>
            <span className="font-mono text-xs uppercase tracking-wider text-white">
              {activeTab}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase">Connected</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 bg-black overflow-y-auto">
          {activeTab === "Dashboard" ? (
            children
          ) : activeTab === "Bookings Management" ? (
            <BookingsManagement />
          ) : activeTab === "Calendar" ? (
            <CalendarTab />
          ) : activeTab === "Settings" ? (
            <SettingsTab />
          ) : (
            <div className="p-8 text-center max-w-md mx-auto mt-20">
              <h2 className="text-xl font-display text-white mb-2">Coming Soon</h2>
              <p className="text-sm text-[color:var(--muted-on-dark)] leading-relaxed">
                The {activeTab} section is scheduled for development in a future milestone.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
