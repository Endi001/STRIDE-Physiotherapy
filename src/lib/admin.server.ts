import { createServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";

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
