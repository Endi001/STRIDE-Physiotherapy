# Implementation: Admin Portal — Route Architecture, Access Control & Dashboard Shell

This document outlines the architecture and current implementation of the `/admin` route for the STRIDE Physiotherapy clinic portal. It covers access control via Supabase Auth, the login screen, and the persistent sidebar-based dashboard shell.

---

## 1. Access Control Architecture

### Authentication Flow

```
Visitor → /admin → Checks Supabase session
                      ├── NOT authenticated → Renders AdminLogin inline (at `/admin`)
                      │                         └── On cancel → Redirects to `/`
                      └── Authenticated → Renders AdminShell + AdminDashboard
```

### Key Principles
- **Single slug `/admin`:** Everything happens inline on `/admin`.
- **Public-facing login:** Unauthenticated visitors are presented with the login form by default.
- **Supabase Auth:** Handles credential storage, session tokens, and session persistence client-side.
- **Root Isolation:** The public site layout (SiteNav, Footer, BookingModal, and Lenis scroll) is automatically hidden when navigating to `/admin` to provide a clean dashboard viewport.
- **SEO Exclusion:** The route includes `noindex, nofollow` meta tags to prevent indexing by search engines.

---

## 2. Technology Stack

| Concern | Solution |
|---------|----------|
| Auth provider | Supabase Auth (email + password) |
| Session management | Supabase client-side session (persisted in localStorage / Cookies) |
| Route guarding | Client-side reactive check on `supabase.auth` session state |
| Server functions | TanStack Start `createServerFn` |
| CSRF Protection | TanStack Start `createCsrfMiddleware` (configured in `src/start.ts`) |
| Admin UI shell | Collapsible custom sidebar themed with STRIDE dark palette |
| Icons | Lucide React |

---

## 3. File Structure

```
src/
├── lib/
│   ├── supabase.ts              # Supabase client singleton
│   └── admin.server.ts          # Server functions for authentication
├── routes/
│   ├── __root.tsx               # Root route layout isolation logic
│   └── admin.tsx                # Single /admin route (renders Login or Dashboard)
├── components/
│   └── admin/
│       ├── AdminLogin.tsx        # Login form component (rendered inline on /admin)
│       ├── AdminShell.tsx        # Sidebar + header layout wrapper
│       └── AdminDashboard.tsx    # Dashboard main metrics layout placeholder
├── start.ts                      # CSRF middleware configuration
└── styles.css                    # Admin-specific styling and keyframes
```

---

## 4. Current Implementation Details

### [supabase.ts](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/lib/supabase.ts)
- Initializes `@supabase/supabase-js` client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### [admin.server.ts](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/lib/admin.server.ts)
- `getAdminSession` — server action checking authorization.
- `adminLogin` — wrapper for client credential auth validation.
- `adminLogout` — clean session teardown.

### [__root.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/routes/__root.tsx)
- Detects `/admin` pathname using `useRouterState` to render only the core layout context (bypassing SiteNav, Footer, BookingModal, and Lenis scroll).

### [use-lenis.ts](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/hooks/use-lenis.ts)
- Returns early to prevent initializing smooth scrolling when pathname starts with `/admin`.

### [admin.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/routes/admin.tsx)
- Listens to active Supabase session dynamically on layout load.
- Renders `AdminShell` and `AdminDashboard` for authenticated users.
- Renders `AdminLogin` for unauthenticated visitors.

### [AdminLogin.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminLogin.tsx)
- Admin sign-in interface matching STRIDE style rules.
- Features standard email/password validation, shake error animation feedback, and loading states.
- Canceling login redirects the user back to the homepage `/`.

### [AdminShell.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminShell.tsx)
- Sidebar framework featuring quick links to bookings, calendars, and configurations.
- Custom collapsibility state toggles.
- Logs out sessions cleanly via `adminLogout()`.

### [AdminDashboard.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminDashboard.tsx)
- Displays current metrics (stat cards: Today's Appointments, Active Patients, Month's Revenue, and Pending Bookings).
- Contains Quick Actions and Recent Activity logs placeholder structure.

### [start.ts](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/start.ts)
- Configured CSRF filter middleware for server functions.

---

## 5. Verification & Testing

### Verification Commands
```bash
npm run build
```
Build executes successfully without any type errors or compilation faults.

### Testing Checklist
1. **Unauthenticated access:** Navigating to `/admin` shows the login card directly.
2. **Cancellation:** Clicking "Cancel" from `/admin` correctly navigates back to `/`.
3. **Invalid credentials:** Submitting incorrect passwords triggers a shake visual animation and displays the error message.
4. **Valid credentials:** Logging in loads the dashboard view and sidebar instantly.
5. **Session persistence:** Page refresh while logged in maintains active dashboard shell correctly.
6. **Sign Out:** Clicking sign out destroys the session client-side and re-renders the login screen.
