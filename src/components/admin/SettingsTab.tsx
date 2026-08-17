import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getDashboardSettings,
  updateDashboardSettings,
  listAdminUsers,
  inviteAdminUser,
  deleteAdminUser,
} from "@/lib/admin.server";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Key,
  Mail,
  Users,
  Bell,
  CalendarClock,
  ShieldAlert,
  Euro,
  UserPlus
} from "lucide-react";

export function SettingsTab() {
  const [loading, setLoading] = useState(true);

  // Dashboard Settings State
  const [revenueGoal, setRevenueGoal] = useState("");
  const [sessionRate, setSessionRate] = useState("");
  const [isSavingDashboard, setIsSavingDashboard] = useState(false);
  const [dashboardMsg, setDashboardMsg] = useState({ type: "", text: "" });

  // Account Security State
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState({ type: "", text: "" });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  // Admin Users State
  const [admins, setAdmins] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState({ type: "", text: "" });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [settingsRes, usersRes, sessionRes] = await Promise.all([
        getDashboardSettings(),
        listAdminUsers(),
        supabase.auth.getUser()
      ]);

      if (settingsRes.settings) {
        setRevenueGoal(settingsRes.settings.revenue_goal || "10000");
        setSessionRate(settingsRes.settings.average_session_rate || "60");
      }
      if (usersRes.admins) {
        setAdmins(usersRes.admins);
      }
      if (sessionRes.data?.user) {
        setCurrentEmail(sessionRes.data.user.email || "");
        setNewEmail(sessionRes.data.user.email || "");
      }
    } catch (err) {
      console.error("Failed to fetch initial settings data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDashboard(true);
    setDashboardMsg({ type: "", text: "" });
    try {
      const res = await updateDashboardSettings({
        data: {
          revenue_goal: revenueGoal,
          average_session_rate: sessionRate,
        }
      });
      if (res.error) throw new Error(res.error);
      setDashboardMsg({ type: "success", text: "Dashboard settings updated successfully." });
      setTimeout(() => setDashboardMsg({ type: "", text: "" }), 3000);
    } catch (err: any) {
      setDashboardMsg({ type: "error", text: err.message || "Failed to update settings." });
    } finally {
      setIsSavingDashboard(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail === currentEmail) return;
    setIsSavingEmail(true);
    setEmailMsg({ type: "", text: "" });
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailMsg({ type: "success", text: "Verification links sent to both emails." });
    } catch (err: any) {
      setEmailMsg({ type: "error", text: err.message || "Failed to update email." });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "Password must be at least 8 characters long." });
      return;
    }
    setIsSavingPassword(true);
    setPasswordMsg({ type: "", text: "" });
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMsg({ type: "", text: "" }), 3000);
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteMsg({ type: "", text: "" });
    try {
      const res = await inviteAdminUser({ data: { email: inviteEmail } });
      if (res.error) throw new Error(res.error);
      setInviteMsg({ type: "success", text: "Invitation sent successfully." });
      setInviteEmail("");
      // Refresh user list
      const usersRes = await listAdminUsers();
      if (usersRes.admins) setAdmins(usersRes.admins);
      setTimeout(() => setInviteMsg({ type: "", text: "" }), 3000);
    } catch (err: any) {
      setInviteMsg({ type: "error", text: err.message || "Failed to invite user." });
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteAdminUser({ data: { userId: adminToDelete.id } });
      if (res.error) throw new Error(res.error);
      setAdmins(admins.filter(a => a.id !== adminToDelete.id));
      setDeleteModalOpen(false);
      setAdminToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete admin:", err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center text-[color:var(--muted-on-dark)] font-mono text-xs uppercase tracking-wider">
          <Loader2 className="h-8 w-8 mb-4 animate-spin text-[color:var(--ember)]" />
          Loading Settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-8 bg-black text-white relative">
      {/* Settings Title */}
      <div>
        <h1 className="text-3xl font-display tracking-tight text-white mb-2 uppercase">Configuration Hub</h1>
        <p className="text-xs text-[color:var(--muted-on-dark)] font-mono uppercase tracking-wider">
          Manage dashboard parameters, security credentials, and administrative access.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Section 1: Dashboard Analytics Configurations */}
        <Card className="bg-[color:var(--ink)] border-[color:var(--hairline-dark)] text-white" style={{ borderRadius: 4 }}>
          <CardHeader className="pb-4 border-b border-[color:var(--hairline-dark)]">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-[color:var(--ember)]" />
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-white">Dashboard Analytics</CardTitle>
            </div>
            <p className="text-[10px] text-[color:var(--muted-on-dark)] font-mono uppercase mt-1">Configure global revenue metrics</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveDashboard} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="revenueGoal" className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase">Revenue Target (€)</Label>
                <Input
                  id="revenueGoal"
                  type="number"
                  min="0"
                  value={revenueGoal}
                  onChange={(e) => setRevenueGoal(e.target.value)}
                  className="bg-black/40 border-[color:var(--hairline-dark)] font-mono focus-visible:ring-[color:var(--ember)]"
                  style={{ borderRadius: 3 }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionRate" className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase">Average Session Rate (€)</Label>
                <Input
                  id="sessionRate"
                  type="number"
                  min="0"
                  value={sessionRate}
                  onChange={(e) => setSessionRate(e.target.value)}
                  className="bg-black/40 border-[color:var(--hairline-dark)] font-mono focus-visible:ring-[color:var(--ember)]"
                  style={{ borderRadius: 3 }}
                />
              </div>
              
              {dashboardMsg.text && (
                <div className={`p-2 text-[10px] font-mono border ${dashboardMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`} style={{ borderRadius: 2 }}>
                  {dashboardMsg.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSavingDashboard}
                className="w-full bg-white/5 hover:bg-white/10 text-white border border-[color:var(--hairline-dark)] font-mono text-xs uppercase transition-colors"
                style={{ borderRadius: 3 }}
              >
                {isSavingDashboard ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                Save Dashboard Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Section 3: Admin Users */}
        <Card className="bg-[color:var(--ink)] border-[color:var(--hairline-dark)] text-white flex flex-col" style={{ borderRadius: 4 }}>
          <CardHeader className="pb-4 border-b border-[color:var(--hairline-dark)]">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[color:var(--slate-clinical)]" />
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-white">Administrative Access</CardTitle>
            </div>
            <p className="text-[10px] text-[color:var(--muted-on-dark)] font-mono uppercase mt-1">Manage portal administrators</p>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col gap-6">
            <div className="flex-1 overflow-y-auto max-h-[200px] pr-1 space-y-2 scrollbar-thin">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-3 bg-black/40 border border-[color:var(--hairline-dark)]" style={{ borderRadius: 3 }}>
                  <div className="truncate pr-4">
                    <p className="text-xs font-mono text-white truncate">{admin.email}</p>
                    <p className="text-[9px] font-mono text-[color:var(--muted-on-dark)] uppercase mt-0.5">
                      Added: {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => { setAdminToDelete(admin); setDeleteModalOpen(true); }}
                    disabled={admin.email === currentEmail}
                    className="p-2 text-[color:var(--muted-on-dark)] hover:text-[color:var(--ember)] hover:bg-[color:var(--ember)]/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[color:var(--muted-on-dark)]"
                    style={{ borderRadius: 2 }}
                    title={admin.email === currentEmail ? "Cannot delete yourself" : "Revoke access"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-[color:var(--hairline-dark)] pt-4">
              <form onSubmit={handleInviteAdmin} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="new.admin@stridephysio.ie"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-black/40 border-[color:var(--hairline-dark)] font-mono focus-visible:ring-[color:var(--ember)]"
                    style={{ borderRadius: 3 }}
                  />
                  <Button
                    type="submit"
                    disabled={isInviting}
                    className="bg-[color:var(--slate-clinical)] hover:bg-[color:var(--slate-clinical)]/80 text-white font-mono text-[10px] uppercase px-4"
                    style={{ borderRadius: 3 }}
                  >
                    {isInviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                {inviteMsg.text && (
                  <div className={`p-2 text-[10px] font-mono border ${inviteMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`} style={{ borderRadius: 2 }}>
                    {inviteMsg.text}
                  </div>
                )}
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Account Security */}
        <Card className="bg-[color:var(--ink)] border-[color:var(--hairline-dark)] text-white" style={{ borderRadius: 4 }}>
          <CardHeader className="pb-4 border-b border-[color:var(--hairline-dark)]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[color:var(--ember)]" />
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-white">My Account Security</CardTitle>
            </div>
            <p className="text-[10px] text-[color:var(--muted-on-dark)] font-mono uppercase mt-1">Update your personal credentials</p>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <form onSubmit={handleUpdateEmail} className="space-y-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1 bg-black/40 border-[color:var(--hairline-dark)] font-mono focus-visible:ring-[color:var(--ember)]"
                    style={{ borderRadius: 3 }}
                  />
                  <Button
                    type="submit"
                    disabled={isSavingEmail || newEmail === currentEmail}
                    className="bg-white/5 hover:bg-white/10 text-white border border-[color:var(--hairline-dark)] font-mono text-[10px] uppercase px-4"
                    style={{ borderRadius: 3 }}
                  >
                    {isSavingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                {emailMsg.text && (
                  <div className={`p-2 text-[10px] font-mono border ${emailMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`} style={{ borderRadius: 2 }}>
                    {emailMsg.text}
                  </div>
                )}
                <p className="text-[9px] text-[color:var(--muted-on-dark)] font-sans">Updating your email will send a verification link to both the old and new addresses.</p>
              </div>
            </form>

            <div className="border-t border-[color:var(--hairline-dark)]" />

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase">Change Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-black/40 border-[color:var(--hairline-dark)] font-mono focus-visible:ring-[color:var(--ember)] pr-10"
                    style={{ borderRadius: 3 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-on-dark)] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-black/40 border-[color:var(--hairline-dark)] font-mono focus-visible:ring-[color:var(--ember)]"
                  style={{ borderRadius: 3 }}
                />
              </div>
              {passwordMsg.text && (
                <div className={`p-2 text-[10px] font-mono border ${passwordMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`} style={{ borderRadius: 2 }}>
                  {passwordMsg.text}
                </div>
              )}
              <Button
                type="submit"
                disabled={isSavingPassword || !newPassword || !confirmPassword}
                className="w-full bg-[color:var(--ember)] hover:bg-[color:var(--ember-hover)] text-white font-mono text-[10px] uppercase transition-colors"
                style={{ borderRadius: 3 }}
              >
                {isSavingPassword ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Key className="mr-2 h-3.5 w-3.5" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Section 4: Configuration Suggestions */}
        <Card className="bg-[color:var(--ink)]/50 border-[color:var(--hairline-dark)] border-dashed text-white opacity-60" style={{ borderRadius: 4 }}>
          <CardHeader className="pb-4 border-b border-[color:var(--hairline-dark)]/50">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[color:var(--muted-on-dark)]" />
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-[color:var(--muted-on-dark)]">Advanced Features</CardTitle>
            </div>
            <p className="text-[10px] text-[color:var(--muted-on-dark)] font-mono uppercase mt-1">Suggested for future milestones</p>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="p-3 bg-black/40 border border-[color:var(--hairline-dark)] flex gap-3 items-center" style={{ borderRadius: 3 }}>
              <CalendarClock className="h-5 w-5 text-[color:var(--muted-on-dark)] shrink-0" />
              <div>
                <p className="text-xs font-semibold">Calendar Operating Hours</p>
                <p className="text-[10px] text-[color:var(--muted-on-dark)]">Configure custom start (08:00) and end (20:00) bounds for the master schedule.</p>
              </div>
            </div>
            <div className="p-3 bg-black/40 border border-[color:var(--hairline-dark)] flex gap-3 items-center" style={{ borderRadius: 3 }}>
              <Bell className="h-5 w-5 text-[color:var(--muted-on-dark)] shrink-0" />
              <div>
                <p className="text-xs font-semibold">Webhooks & Alerts</p>
                <p className="text-[10px] text-[color:var(--muted-on-dark)]">Connect Slack or Discord for real-time booking and cancellation digests.</p>
              </div>
            </div>
            <div className="p-3 bg-black/40 border border-[color:var(--hairline-dark)] flex gap-3 items-center" style={{ borderRadius: 3 }}>
              <ShieldAlert className="h-5 w-5 text-[color:var(--muted-on-dark)] shrink-0" />
              <div>
                <p className="text-xs font-semibold">Maintenance Mode</p>
                <p className="text-[10px] text-[color:var(--muted-on-dark)]">Temporarily disable public booking widget with a custom away message.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && adminToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[color:var(--ink)] border border-rose-500/30 p-6 max-w-sm w-full shadow-2xl" style={{ borderRadius: 4 }}>
            <h3 className="text-lg font-display uppercase tracking-wider text-rose-500 mb-2">Revoke Access</h3>
            <p className="text-xs text-[color:var(--muted-on-dark)] mb-6 leading-relaxed">
              Are you sure you want to revoke administrative access for <span className="text-white font-mono">{adminToDelete.email}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="text-[color:var(--muted-on-dark)] hover:text-white hover:bg-white/5 font-mono text-[10px] uppercase"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAdmin}
                disabled={isDeleting}
                className="bg-rose-500 hover:bg-rose-600 text-white font-mono text-[10px] uppercase px-6"
                style={{ borderRadius: 3 }}
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Revoke"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
