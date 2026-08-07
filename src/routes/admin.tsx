import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — STRIDE Physiotherapy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="stride-section-dark min-h-screen flex items-center justify-center">
        <div className="font-mono text-xs uppercase text-[color:var(--muted-on-dark)] tracking-wider">
          Initializing secure session...
        </div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <AdminShell
        userEmail={session?.user?.email || "admin@stridephysio.ie"}
        onLogout={() => {
          setSession(null);
        }}
      >
        <AdminDashboard userEmail={session?.user?.email || "admin@stridephysio.ie"} />
      </AdminShell>
    );
  }

  return (
    <AdminLogin
      onSuccess={() => {
        // Auth state listener will handle session setting
      }}
      onCancel={() => {
        window.location.href = "/";
      }}
    />
  );
}
