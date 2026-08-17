# Implementation Plan: Admin Settings Panel

This document outlines the architecture, database schema, server actions, component structure, and verification checklists for building the **Admin Settings** tab inside the `/admin` route of the STRIDE Physiotherapy clinic portal.

---

## 1. Goal & Objectives

The goal is to implement the **Settings** tab in the Admin panel. This tab will serve as the configuration hub for clinic administrators to manage dashboard parameters, administrative user access, and security credentials.

The implementation will cover:
- Updating navigation and shell structures to activate "Settings" and streamline the sidebar.
- Creating a Supabase database schema to store application-wide settings dynamically.
- Implementing secure server functions using the Supabase Service Role Key for administrative user management (inviting and deleting admins, listing users).
- Building a premium settings interface matching STRIDE's dark high-performance aesthetic.
- Integrating database settings into the main dashboard page (replacing hardcoded revenue goals and session rates).

---

## 2. Design System & Theming Specs

The settings interface will strictly utilize the established STRIDE design system tokens defined in [styles.css](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/styles.css):

| Token | CSS Variable / Value | Purpose |
|---|---|---|
| **Base Canvas** | `bg-black` / `#000000` | Dark background canvas for high contrast |
| **Card Fill** | `var(--ink)` / `#101113` | Deep dark grey for settings panels and cards |
| **Borders** | `var(--hairline-dark)` / `#3a3632` | Subtle borders enclosing cards and visual regions |
| **Borders (Strong)** | `var(--hairline-dark-strong)` / `#6b6862` | Highlighted borders on hover/focus |
| **Primary Accent** | `var(--ember)` / `#FF5A36` | Buttons, focus indicators, primary actions |
| **Primary Hover** | `var(--ember-hover)` / `#e04f2f` | Hover state for primary buttons |
| **Secondary Accent**| `var(--slate-clinical)` / `#7C8B87`| Informational pills, secondary action borders |
| **Neutral Text** | `var(--bone)` / `#F5F3EF` | Primary reading text, headers |
| **Muted Text** | `var(--muted-on-dark)` / `#c9c6c0` | Subtitles, labels, helpers |
| **Fonts** | Display: `Big Shoulders Display`<br>Body: `General Sans`<br>Mono: `IBM Plex Mono` | Typography styles matching client-facing portal |

---

## 3. Sidebar Navigation & Layout Refactoring

We will clean up the navigation items in [AdminShell.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminShell.tsx) according to the user requirements:
1. **Rename Tab**: Change `"Settings & Audit Logs"` to `"Settings"`.
2. **Remove**: Delete `"Patient Records"` and `"Therapists & Schedule"` navigation buttons.
3. **Update Status**: Set `"Settings"` status to `"Active"` (remove `"Coming Soon"` badge).
4. **Services & Prices**: Keep `"Services & Pricing"` but rename it to `"Services & Prices"` and maintain its `"Coming Soon"` status (greyed out).

### Navigation Items Diff Specification

```diff
  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, status: "Active" },
    { name: "Bookings Management", icon: CalendarCheck, status: "Active" },
    { name: "Calendar", icon: Calendar, status: "Active" },
-   { name: "Patient Records", icon: Users, status: "Coming Soon" },
-   { name: "Therapists & Schedule", icon: UserCog, status: "Coming Soon" },
-   { name: "Services & Pricing", icon: Tag, status: "Coming Soon" },
-   { name: "Settings & Audit Logs", icon: Settings, status: "Coming Soon" },
+   { name: "Services & Prices", icon: Tag, status: "Coming Soon" },
+   { name: "Settings", icon: Settings, status: "Active" },
  ];
```

Inside the [AdminShell.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminShell.tsx) body, render `<SettingsTab />` on active tab match:

```tsx
{activeTab === "Dashboard" ? (
  children
) : activeTab === "Bookings Management" ? (
  <BookingsManagement />
) : activeTab === "Calendar" ? (
  <CalendarTab />
) : activeTab === "Settings" ? (
  <SettingsTab />
) : (
  // ... fallback Coming Soon block ...
)
```

---

## 4. Database Schema & API Actions

To make configuration values like the revenue goal and average session rate dynamic, we will create a settings table in Supabase.

### 4.1 SQL Migration (`supabase/migrations/xxxx_create_settings_table.sql`)

```sql
-- Create settings table
CREATE TABLE IF NOT EXISTS public.dashboard_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Allow authenticated admins to read settings"
  ON public.dashboard_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated admins to modify settings"
  ON public.dashboard_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert Default Configs
INSERT INTO public.dashboard_settings (key, value, description) VALUES
  ('revenue_goal', '10000', 'Monthly clinic revenue target in Euro'),
  ('average_session_rate', '60', 'Average cost per treatment session in Euro')
ON CONFLICT (key) DO NOTHING;
```

---

### 4.2 Server Actions (`src/lib/admin.server.ts`)

We will add server functions for managing settings and admin users. For user management, we need privileged operations, so we will initialize a Supabase admin client that uses the `SUPABASE_SERVICE_ROLE_KEY` environment variable.

```typescript
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

// ── Settings Server Actions ──────────────────────────────────────────────────

export const getDashboardSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("dashboard_settings")
      .select("key, value, description");

    if (error) return { error: error.message };
    
    // Return key-value map
    const settingsMap = data.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return { settings: settingsMap };
  });

export const updateDashboardSettings = createServerFn({ method: "POST" })
  .validator((settings: Record<string, string>) => settings)
  .handler(async ({ data }) => {
    const promises = Object.entries(data).map(([key, value]) =>
      supabase
        .from("dashboard_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() })
    );

    const results = await Promise.all(promises);
    const firstError = results.find((r) => r.error);
    
    if (firstError) {
      return { error: firstError.error.message };
    }
    return { success: true };
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
```

---

## 5. UI Layout & Component Specifications

We will create a new component file: [SettingsTab.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/SettingsTab.tsx). It will feature a grid of configuration sections.

### 5.1 UI Layout Outline

The page will feature a structured layout utilizing grid columns:
```
+-------------------------------------------------------------+
| Settings Title & Configuration Hub                         |
+-------------------------------------------------------------+
| Two-column Grid (1 Column on Mobile, 2 on Desktop):         |
|                                                             |
| +-------------------------+     +-------------------------+ |
| | Section 1: Dashboard    |     | Section 3: Admin Users  | |
| | - Revenue Target (€)    |     | - List of Admin Emails  | |
| | - Avg Session Rate (€)  |     | - Invite new admin      | |
| | [Save Changes Button]   |     | - Revoke admin access   | |
| +-------------------------+     +-------------------------+ |
|                                                             |
| +-------------------------+     +-------------------------+ |
| | Section 2: My Account   |     | Section 4: Suggestions  | |
| | - Update Email          |     | - Calendar Working Hrs  | |
| | - Change Password       |     | - Notifications toggle  | |
| | [Update Credentials]    |     |   (Greyed-out cards)    | |
| +-------------------------+     +-------------------------+ |
+-------------------------------------------------------------+
```

### 5.2 Section Details & Technical Specifications

#### Section 1: Dashboard Analytics Configurations
- **Form Controls**:
  - `Revenue Goal`: Text input with monospaced currency symbol prefix (`€`).
  - `Average Session Rate`: Text input with monospaced currency symbol prefix (`€`).
- **Validation**: Requires numeric digits, no negative values.
- **Save Flow**: Displays loading spinner on the submit button. Calls `updateDashboardSettings` action. Shows success message using `sonner` toast notification.

#### Section 2: Account Security Credentials
- **Form Controls**:
  - `Update Email`: Input field displaying the logged-in email. On submit, invokes `supabase.auth.updateUser({ email })`. Shows helper text warning the admin that verification links are sent to both old and new email addresses.
  - `Change Password`: Inputs for `New Password` and `Confirm Password`. Password fields feature toggle visibility icons (`Eye` / `EyeOff`). On submit, validates length (min 8 chars) and matches, then invokes `supabase.auth.updateUser({ password })`.
- **Feedback**: Immediate success/error styling and toast messages.

#### Section 3: Administrators User Directory & Invite List
- **Table / List**:
  - Displays currently registered admin emails fetched via `listAdminUsers`.
  - Shows creation date and last sign-in timestamp (formatted in monospaced font).
  - Renders a delete icon (`Trash2` in `--ember` red on hover) for each row.
- **Delete Flow**: Clicking delete opens a confirmation modal ("Are you sure you want to revoke admin access for email@domain.com?"). On confirm, calls `deleteAdminUser` and triggers list reload.
- **Invite Form**:
  - Email input and "Invite Admin" button.
  - Submits to `inviteAdminUser` server function. Shows success toast indicating an invitation link has been emailed.

---

## 6. Suggestions for Additional Settings (Control Panel Expansion)

To make the Settings tab a comprehensive clinic control panel, we recommend adding the following settings configurations to the database and UI (greyed out or fully implemented):

### 6.1 Clinic Calendar Operation Configuration
- **Operating Hours Slots**:
  - Inputs for `Calendar Start Hour` (default `08:00`) and `Calendar End Hour` (default `20:00`).
  - Allows dynamic resizing of the time slots on [CalendarTab.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/CalendarTab.tsx).
- **Default Treatment Length**:
  - Dropdown selecting appointment slot granularity (e.g. `30 mins`, `45 mins`, `60 mins`).

### 6.2 Communication & Notification Hub
- **Admin Alerts Integration**:
  - Form field to insert a `Slack` or `Discord` Webhook URL.
  - Toggle switches to control booking alert triggers: `On New Booking`, `On Cancellation`, `Daily Digest`.
- **System Notification Email**:
  - Recipient email address to receive copy notifications of clinic intakes.

### 6.3 Public Site Maintenance Settings
- **Public Booking Toggle**:
  - A Boolean switch (`booking_active`).
  - When disabled, replaces the public site booking modal with a custom "Online scheduling is temporarily offline. Please contact the clinic directly." banner.
- **Clinic Holiday Announcement Banner**:
  - Text area to type custom clinic announcements (e.g., "Closed for bank holiday on Monday 24th"). Displays a banner at the top of the client booking interface.

---

## 7. Integration with AdminDashboard

To reflect setting changes immediately on the main dashboard tab, we will refactor [AdminDashboard.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminDashboard.tsx):

1. **Fetch Configs**: Use `getDashboardSettings` action during dashboard load.
2. **State Fallbacks**: Use database settings, falling back to default hardcoded constants if missing:
   - `revenueGoal` = `parseInt(settings.revenue_goal || '10000')`
   - `AVG_SESSION_RATE` = `parseInt(settings.average_session_rate || '60')`

---

## 8. Implementation Checklist & Timeline

### Milestone 1: Database Setup
- [x] Create migration SQL file `supabase/migrations/xxxx_create_settings_table.sql`.
- [x] Execute SQL migration script via Supabase console or migration CLI tool.
- [x] Validate RLS security rules by testing access with unauthenticated vs authenticated clients.

### Milestone 2: Server API Actions
- [x] Code settings fetching (`getDashboardSettings`) and updating (`updateDashboardSettings`) actions in `src/lib/admin.server.ts`.
- [x] Configure `getSupabaseAdminClient` initializer inside server actions using Service Role Key.
- [x] Code user listing (`listAdminUsers`), invitation (`inviteAdminUser`), and deletion (`deleteAdminUser`) actions in `src/lib/admin.server.ts`.

### Milestone 3: Navigation Cleanup
- [x] Modify `navItems` array in [AdminShell.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminShell.tsx) to match user requests (delete records/schedules, rename settings, update pricing label).
- [x] Add the conditional check rendering `<SettingsTab />` when `activeTab === "Settings"`.

### Milestone 4: Build SettingsTab Component
- [x] Create layout scaffolding in [SettingsTab.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/SettingsTab.tsx) with dark panels and responsive columns.
- [x] Build **Dashboard Analytics Settings form** (revenue, session rate) with live state validation and update triggers.
- [x] Build **Account Security section** with secure input masks, password checks, and authentication update triggers.
- [x] Build **Admin User Directory list** with invite inputs, delete modals, and dynamic user list refresh.
- [x] Render greyed-out **Configuration Suggestions** (Calendar limits, alerts, holiday modes) with helpful tooltip guides.

### Milestone 5: Dashboard Overview Integration
- [x] Refactor [AdminDashboard.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminDashboard.tsx) to fetch settings during runtime.
- [x] Wire revenue calculations and goals progress bar to use database-driven numbers.

---

## 9. Verification & Testing Strategy

### Automated Verification
- Verify TypeScript types build correctly:
  ```bash
  npm run build
  ```
  Ensure all client actions and database interfaces have no compiler errors.

### Manual Verification Checklist
1. **Navigation Audit**:
   - Ensure the sidebar navigation is clean, only contains "Dashboard", "Bookings Management", "Calendar", "Services & Prices" (greyed out) and "Settings".
   - Confirm clicking "Settings" renders the panel.
2. **Dashboard Settings Verification**:
   - Change "Revenue Target" from €10,000 to €15,000 and "Average Session Rate" from €60 to €75 in settings. Click Save.
   - Go back to Dashboard. Verify the progress calculations and projected incomes have recalculated using the new €75 rate and €15,000 target goal.
3. **Security credentials**:
   - Test changing the password of the active admin. Confirm matching password validations work, and new password logs in successfully on the next sign-in.
4. **Admin User Directory Operations**:
   - Invite a test email address. Verify invitation triggers a success toast.
   - Revoke/Delete a test admin. Verify the confirmation modal renders and deleting successfully removes the user from the list.
5. **Mobile Viewport responsiveness**:
   - Resize settings tab down to 375px. Verify forms stack vertically, table layout overflows gracefully or transforms to stacked cards, and inputs remain easy to tap.
