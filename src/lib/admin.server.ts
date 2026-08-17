import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Privileged Supabase client initializer for Auth admin operations
function getSupabaseAdminClient() {
  const url = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase credentials or service role key in environment.");
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const getAdminSession = createServerFn({ method: "GET" })
  .validator((token?: string) => token)
  .handler(async ({ data: token }) => {
    if (!token) {
      return { user: null, authorized: false };
    }
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { user: null, authorized: false };
    }
    // Any user registered in Supabase is an admin in this context,
    // as admin accounts are provisioned via the Supabase dashboard.
    return { user, authorized: true };
  });

export const adminLogin = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      return { error: error.message };
    }
    return { data: authData };
  });

export const adminLogout = createServerFn({ method: "POST" })
  .handler(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { success: true };
  });

// ── Settings Server Actions ──────────────────────────────────────────────────

export const getDashboardSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const adminClient = getSupabaseAdminClient();
      const { data, error } = await adminClient
        .from("dashboard_settings")
        .select("key, value, description");

      if (error) throw error;
      
      // Return key-value map
      const settingsMap = data.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      return { settings: settingsMap };
    } catch (err: any) {
      return { error: err.message };
    }
  });

export const updateDashboardSettings = createServerFn({ method: "POST" })
  .validator((settings: Record<string, string>) => settings)
  .handler(async ({ data }) => {
    try {
      const adminClient = getSupabaseAdminClient();
      const promises = Object.entries(data).map(([key, value]) =>
        adminClient
          .from("dashboard_settings")
          .upsert({ key, value, updated_at: new Date().toISOString() })
      );

      const results = await Promise.all(promises);
      const firstError = results.find((r) => r.error);
      
      if (firstError) throw firstError.error;
      
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  });

// ── Admin User Management Server Actions ─────────────────────────────────────

export const listAdminUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const adminClient = getSupabaseAdminClient();
      const { data: { users }, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;
      
      // Filter out essential fields for safety
      const admins = users.map((u) => ({
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
      }));
      return { success: true, admins };
    } catch (err: any) {
      return { error: err.message };
    }
  });

export const inviteAdminUser = createServerFn({ method: "POST" })
  .validator((d: { email: string }) => d)
  .handler(async ({ data: { email } }) => {
    try {
      const adminClient = getSupabaseAdminClient();
      const origin = process.env.APP_URL || "http://localhost:3000";
      
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${new URL(origin).origin}/admin`,
      });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (err: any) {
      return { error: err.message };
    }
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .validator((d: { userId: string }) => d)
  .handler(async ({ data: { userId } }) => {
    try {
      const adminClient = getSupabaseAdminClient();
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  });
