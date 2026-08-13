# Implementation Plan: Admin Dashboard Overview & Visual Analytics

This document outlines the architecture, layout system, component structure, and verification checklists for building the primary **Dashboard Overview and Analytics** tab inside the `/admin` route of the STRIDE Physiotherapy clinic portal.

---

## 1. Goal & Objectives
The goal of this phase is to construct the visual front-end structure of the Admin Dashboard. It will feature premium metrics, interactive charts (using `recharts`), a daily schedule feed, and quick actions, styled to align with STRIDE's dark high-performance aesthetic.

We are implementing **structure, responsive layout, and interactive components first** using realistic local mock data. Full API integration with Supabase and Cal.com will be added in a subsequent phase.

---

## 2. Design System & Theming Specs

The dashboard will strictly use the established STRIDE design system tokens defined in [styles.css](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/styles.css):

| Token | CSS Variable / Value | Purpose |
|---|---|---|
| **Base Canvas** | `bg-black` / `#000000` | Dark background canvas for high contrast |
| **Card Fill** | `var(--ink)` / `#101113` | Deep dark grey for metrics and chart cards |
| **Borders** | `var(--hairline-dark)` / `#3a3632` | Subtle borders enclosing cards and visual regions |
| **Borders (Strong)** | `var(--hairline-dark-strong)` / `#6b6862` | Highlighted borders on hover/focus |
| **Primary Accent** | `var(--ember)` / `#FF5A36` | Trend lines, main indicators, primary actions |
| **Secondary Accent** | `var(--slate)` / `#7C8B87` | Clinical teal-slate for alternate data series, labels |
| **Neutral Text** | `var(--bone)` / `#F5F3EF` | Primary reading text |
| **Muted Text** | `var(--muted-on-dark)` / `#c9c6c0` | Metric subtitles, secondary labels, axes values |
| **Fonts** | display: `Big Shoulders Display`<br>body: `General Sans`<br>mono: `IBM Plex Mono` | Typography styles matching client-facing portal |

### Accessible Chart Color Palette (Recharts)
To ensure maximum readability, contrast, and style consistency, charts will use a curated palette:
1. **Ember Orange:** `#FF5A36` (Primary data focus / High growth)
2. **Clinical Slate:** `#7C8B87` (Secondary comparisons / Stabilized values)
3. **Muted Gold:** `#C1A27E` (Special service divisions / Warm accents)
4. **Bone Light:** `#D6D2C9` (Reference lines / Base comparative values)
5. **Charcoal Muted:** `#2A2A2C` (Background fills / Grid lines)

---

## 3. UI Layout & Grid System

The page layout in [AdminDashboard.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminDashboard.tsx) will be refactored into a mobile-friendly responsive grid:

```
+-----------------------------------------------------------------------+
|  Dashboard Title & Welcome Section                                    |
+-----------------------------------------------------------------------+
|  KPI STATS GRID:                                                      |
|  [ Total Bookings ]  [ Completed vs Cancel ]  [ Revenue & Projected ] |
+-----------------------------------------------------------------------+
|  ANALYTICS SECTION (2 Columns on Desktop, 1 on Mobile):                |
|  +---------------------------------+  +-------------------------------+
|  | Booking Growth (Area/Line)      |  | Treatment Donut Chart         |
|  +---------------------------------+  +-------------------------------+
|  | Peak Hours Heatmap / Bar Chart  |  | Today's Schedule Snapshot     |
|  +---------------------------------+  +-------------------------------+
+-----------------------------------------------------------------------+
```

### Breakpoints & Layout Code
* **Wrapper Container:** `space-y-8 p-6 md:p-8`
* **KPI Grid:** `grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (adjusted from 4 items to 3 dense metrics for cleaner tracking).
* **Analytics Grid:** `grid gap-6 grid-cols-1 xl:grid-cols-3`
  - Chart cards will occupy spans optimized for their shape:
    - *Booking Growth:* `xl:col-span-2` (wide span)
    - *Treatment Distribution:* `xl:col-span-1` (square-ish span)
    - *Peak Hours:* `xl:col-span-2` (wide span)
    - *Schedule Snapshot:* `xl:col-span-1` (tall list span)

---

## 4. Detailed Component Specifications

### 4.1 KPI Stat Cards
Stat cards will present high-level clinics health indexes with clean, tabular numerical layouts.

1. **Total Bookings**
   - **Main Value:** Weekly count (e.g. `84 Bookings`)
   - **Subtext:** Monthly count (e.g. `342 total this month`)
   - **Growth Indicator:** Trend pill with icon showing percentage change vs. previous week (e.g. `+12.4% vs last week` in green, or negative trends in red).

2. **Completed Sessions vs. Cancellations/No-shows**
   - **Main Value:** Weekly Completion Rate (e.g. `94.2%`)
   - **Visual Element:** A multi-segmented horizontal bar showing relative proportions:
     - Completed (Green)
     - Cancelled (Amber)
     - No-show (Red)
   - **Legend/Subtext:** Count details (e.g. `112 Completed · 5 Cancelled · 2 No-shows`)

3. **Monthly Revenue & Projected Income**
   - **Main Value:** Month-to-date Revenue (e.g. `€9,240`)
   - **Visual Element:** Progress bar towards target goals (e.g., current revenue vs. €10,000 target).
   - **Projected Value:** Calculated potential based on remaining booked sessions (e.g. `Projected: €11,500`).

---

### 4.2 Visual Analytics (Recharts Components)

All charts will wrap Recharts components with responsive aspect ratios using `ChartContainer` from `@/components/ui/chart.tsx` to handle standard tooltips and legends.

#### 1. Booking Growth Chart (Area Chart)
* **Type:** Smooth area chart (`type="monotone"`) with gradient fill.
* **Component:** `AreaChart` with standard X-Axis (Days of week: `Mon`, `Tue`, `Wed`, etc.) and Y-Axis (Booking volume).
* **Gradient Styling:** Fills from `var(--ember)` with `opacity={0.3}` down to `opacity={0}`.
* **Stroke:** `var(--ember)` with `strokeWidth={2}`.
* **Tooltip:** Hover triggers a custom cursor and matches STRIDE styling (black fill, hairline border, monospaced fonts).

#### 2. Peak Hours (Bar Chart)
* **Type:** Stacked or styled vertical bar chart showing booking frequency across operating slots.
* **Component:** `BarChart` showing hours (`08:00`, `10:00`, `12:00`, `14:00`, `16:00`, `18:00`).
* **Bar Styling:** Vertical bars with rounded top corners (`radius={[4, 4, 0, 0]}`). Colors will dynamically vary (using `--slate` as a baseline, and `--ember` highlighted for peak intervals exceeding 70% threshold capacity).

#### 3. Treatment Distribution (Donut Chart)
* **Type:** Donut (pie chart with `innerRadius` and `outerRadius`).
* **Component:** `PieChart` with customized legends.
* **Segments:**
  - Initial Assessment (Ember - `#FF5A36`)
  - Sports Rehab (Slate - `#7C8B87`)
  - Manual Therapy (Muted Gold - `#C1A27E`)
  - Dry Needling / Clinical Tech (Muted Bone - `#D6D2C9`)
* **Interaction:** Hovering segments triggers a scale effect (`activeShape`) and displays details in the center of the donut (Total sessions & % share).

---

### 4.3 Today's Schedule Snapshot
A scrollable, live feed tracking the current day's bookings.

* **Component Container:** Set height (`h-[380px]`) with vertical scrolling enabled (`overflow-y-auto no-scrollbar`).
* **Item Layout:** Horizontal card matching the dark theme:
  - **Left Section:** Monospaced start-time (e.g., `09:30`) with a timeline indicator vertical line.
  - **Middle Section:** Patient name, therapist, and treatment summary.
  - **Right Section:** Immediate status badge.
* **Status Badges & Styling:**
  - `Confirmed`: Border & text in `--slate` (clinical, stable).
  - `In Progress`: Border & text in `--ember` (pulsing indicator, active session).
  - `Completed`: Green border and text.
  - `Cancelled / No-show`: Red border/text with line-through patient name.
* **Hover Interaction:** Subtle background glow, revealing quick actions: "Check-in" or "Modify".

---

## 5. Mock Data Structure (`src/lib/mockDashboardData.ts`)

To support modular and robust visual development, we will establish a dedicated mock database file containing:

```typescript
export interface BookingGrowthPoint {
  date: string;
  bookings: number;
  previousPeriodBookings: number;
}

export interface PeakHourPoint {
  hour: string;
  bookings: number;
  capacityPercent: number;
}

export interface TreatmentShare {
  name: string;
  value: number;
  color: string;
}

export interface SnapshotAppointment {
  id: string;
  time: string;
  patientName: string;
  therapist: string;
  service: string;
  status: "Confirmed" | "In Progress" | "Completed" | "Cancelled";
}

// Exported sets of data for rendering...
```

---

## 6. Implementation Checklist & Timeline

### Milestone 1: Setup Mock Data & Typings
- [ ] Create [mockDashboardData.ts](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/lib/mockDashboardData.ts) containing structure-ready JSON arrays representing 30 days of trends.
- [ ] Ensure types match Cal.com schema formats to minimize future code churn.

### Milestone 2: KPI & Grid Refactoring
- [ ] Clear temporary structures in [AdminDashboard.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminDashboard.tsx).
- [ ] Build the layout scaffolding (Responsive grids, columns, card components).
- [ ] Code the **Total Bookings Card** with percent indicators.
- [ ] Code the **Completion Rate Card** with segmented bar ratio graphic.
- [ ] Code the **Revenue / Projection Card** with targets progress indicator.

### Milestone 3: Recharts Visualizations
- [ ] Integrate **Booking Growth AreaChart**:
  - [ ] Add linear-gradient definition in SVG.
  - [ ] Format X-Axis for days, Y-Axis for counts.
  - [ ] Implement responsive tooltip overlay.
- [ ] Integrate **Peak Hours BarChart**:
  - [ ] Map hours 08:00 - 19:00.
  - [ ] Set custom bar color mapping for peak highlight logic.
- [ ] Integrate **Treatment Distribution PieChart**:
  - [ ] Build inner donut layout.
  - [ ] Add legend highlighting percentages.
  - [ ] Add central overlay information showing dominant treatments on hover.

### Milestone 4: Snapshot Feed & Interactions
- [ ] Build the **Today's Schedule Snapshot** feed.
- [ ] Style status tag styling (Confirmed, In Progress, Completed).
- [ ] Apply hover transition indicators and action buttons.
- [ ] Implement mobile-collapsed card layout details.

---

## 7. Verification & Testing Strategy

### Automated Checks
* **Types Check:** Run compiler validation:
  ```bash
  npm run build
  ```
  Ensure zero TypeScript errors in route parsing, chart component configuration, or mock interfaces.

### Manual Visual UI Audit
1. **Responsiveness Audit:**
   - Shrink screen to Mobile width (375px). Confirm stats wrap vertically, charts collapse gracefully (no horizontal scrolling overflows), and side navigation toggle handles correctly.
   - Test on Medium widths (768px - 1024px) for grid wrapping.
2. **Contrast & Theme Audit:**
   - Verify text elements against background panels satisfy Web Content Accessibility Guidelines (WCAG) contrast ratios.
   - Confirm chart grids utilize `var(--hairline-dark)` subtly and gridlines do not overwhelm the line/bar shapes.
3. **Interactive Actions:**
   - Hover over chart segments: Tooltips must follow the cursor and display accurate data values.
   - Hover over donut chart segments: Highlight segment transitions smoothly.

---

## 8. Cal.com API Integration & Bookings Management Tab

This section details the design, architecture, and integration of the live **Bookings Management** tab within the `/admin` workspace. It links directly to Cal.com API v2 to retrieve, search, schedule, and cancel appointments securely.

### 8.1 Technical Architecture
To prevent exposing the `CAL_COM_API_KEY` on the client side, all requests will pass through secure `createServerFn` actions located in `src/lib/cal-api.ts`.

```
[ Client UI /admin ]
        │
        ▼ (TanStack Start RPC call)
[ Server-Side Function (createServerFn) ]
        │
        ▼ (Authorization: Bearer + cal-api-version)
[ Cal.com API v2 Endpoints ]
```

### 8.2 Proposed API Endpoint Mappings (`src/lib/cal-api.ts`)

1. **List Bookings (`getCalBookingsList`)**:
   - **Method:** `GET`
   - **Cal.com API:** `GET /v2/bookings`
   - **Inputs:** `status` (upcoming, past, cancelled), `cursor` (pagination token), `search` (filter by patient name/email).
   - **Output:** Unified array of bookings matching the filter parameters.

2. **Cancel Booking (`cancelCalBooking`)**:
   - **Method:** `POST`
   - **Cal.com API:** `POST /v2/bookings/{bookingUid}/cancel`
   - **Inputs:** `bookingUid` (string), `cancellationReason` (string, optional).
   - **Output:** Success status confirming cancellation.

3. **Reschedule Booking (`rescheduleCalBooking`)**:
   - **Method:** `POST`
   - **Cal.com API:** `POST /v2/bookings/{bookingUid}/reschedule`
   - **Inputs:** `bookingUid` (string), `start` (ISO-8601 string), `reschedulingReason` (string, optional).
   - **Output:** The modified booking details.

4. **Create Manual Booking (`createManualCalBooking`)**:
   - **Method:** `POST`
   - **Cal.com API:** `POST /v2/bookings`
   - **Inputs:** `start` time, attendee details (`name`, `email`, `phoneNumber`), service type (`eventTypeSlug`), and custom question responses.
   - **Output:** The created booking confirmation payload.

---

### 8.3 Frontend UI Component & Table Specs

We will create a new view: [BookingsManagement.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/BookingsManagement.tsx) rendered conditionally in the `AdminShell` when the **Bookings Management** navigation tab is selected.

#### 1. Filter Bar & Controls
* **Search Field:** Text input matching standard STRIDE inputs. Real-time client-side search by name/email.
* **Status Tabs:** Quick filter buttons: `Upcoming`, `Past`, `Canceled`.
* **Therapist & Service Filters:** Select dropdowns matching STRIDE dark styling.

#### 2. Interactive Data Table
* **Table Headers:** `Date & Time`, `Patient Details`, `Service Type`, `Therapist`, `Status`, `Actions`.
* **Patient Column:** Renders name, email, phone number, and a badge linking to the *Intake Form Notes* overlay.
* **Responsive Layout:** On mobile, rows will transition into individual cards with vertical action stacks.

#### 3. Modals & Actions UI
* **Cancel Modal:** Asks for confirmation and features a text area for `Cancellation Reason`. Shows a loading spinner on submitting, closes on success, and fires a `sonner` success/error toast.
* **Reschedule Dialog:** Displays a calendar picker (using standard `react-day-picker` styling) and list of active available times (using `getCalSlots` client wrapper). On confirm, triggers rescheduling.
* **Manual Booking Form:** Full modal overlay containing standard intake fields. Saves directly to Cal.com under the selected Event Type.

---

### 8.4 Integration Checklist

#### Phase 1: API Actions Layer
- [ ] Create secure server functions in `src/lib/cal-api.ts`:
  - [ ] `getCalBookingsList` action.
  - [ ] `cancelCalBooking` action.
  - [ ] `rescheduleCalBooking` action.
  - [ ] `createManualCalBooking` action.
- [ ] Add error parsing middleware to decode Cal.com validation payload issues and present user-friendly alerts.

#### Phase 2: Route & Layout Preparation
- [ ] Update [AdminShell.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminShell.tsx):
  - [ ] Remove `"Coming Soon"` status from the "Bookings Management" menu item.
  - [ ] Wire up tab navigation state machine to switch content panel.
  - [ ] Render `<BookingsManagement />` on tab active.

#### Phase 3: Bookings Management Component
- [ ] Build [BookingsManagement.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/BookingsManagement.tsx) skeleton structure.
- [ ] Implement layout filter header elements (Search, Tabs, Dropdowns).
- [ ] Add tabular list visualization with responsive styling mappings.
- [ ] Set up loading state skeleton rows (`<Skeleton className="..." />`).

#### Phase 4: Operations Integration
- [ ] Integrate **Cancel Booking** modal overlay flow:
  - [ ] Request confirmation before taking high-impact action.
  - [ ] Collect optional reason input.
  - [ ] Call `cancelCalBooking` and fire success/error `sonner` toasts.
- [ ] Integrate **Reschedule Booking** picker popup:
  - [ ] Fetch dynamic availability slots for the selected therapist.
  - [ ] Pick date and time, call `rescheduleCalBooking` API, and refresh table state.
- [ ] Integrate **Manual Booking Form**:
  - [ ] Form interface mapping name, email, phone, notes, and slot selector.
  - [ ] Submit payload to `createManualCalBooking` API.

---

## 9. Calendar Sync & Master Schedule Tab

This section details the plan for building the **Calendar Sync & Master Schedule** tab within the `/admin` workspace. It provides the front-end layout, API mappings, design specifications, and interactivity guidelines for the calendar view and Google Calendar/Cal.com sync.

### 9.1 Technical Architecture & API Actions
To support individual therapist availability, booked slots, and Google Calendar sync statuses, we will extend `src/lib/cal-api.ts` with Server Functions to fetch sync connections and therapist schedules.

1. **Fetch Therapist Calendar Connections (`getTherapistSyncStatuses`)**:
   - **Method:** `GET`
   - **Return Value:** An array of sync states for each therapist, showing active feeds (Google Calendar, Cal.com, Outlook), connection status (Connected, Sync Error, Authenticating), and last sync time.
   - **Mock Fallback Data:** Local array matching the active therapists at STRIDE.

2. **Fetch Therapist Schedules and Bookings (`getMasterScheduleEvents`)**:
   - **Method:** `GET`
   - **Inputs:** `startDate` (ISO-8601), `endDate` (ISO-8601), optional filters for `therapistId` and `serviceType`.
   - **Return Value:** A list of calendar events containing both **booked appointments** (with client details) and **unavailable/blocked time slots** synced from external Google Calendar feeds (e.g., personal appointments, clinic holidays).

3. **Force Refresh Calendar Sync (`triggerManualCalendarSync`)**:
   - **Method:** `POST`
   - **Inputs:** `therapistId` (string).
   - **Return Value:** Success status, timestamp of completion.

---

### 9.2 Frontend UI Component & Calendar Views
We will create a new view: [CalendarTab.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/CalendarTab.tsx) rendered conditionally in the `AdminShell` when the **Calendar** navigation tab is selected.

#### 1. Filter & Connection Status Header
* **View Selector:** Grouped buttons for `Day`, `Week`, and `Month` views.
* **Therapist Filter Selector:** Multiselect dropdown to view specific therapist schedules side-by-side or layered.
* **Sync Feed Pills:** A horizontal strip displaying the connection status of active calendar integrations (e.g., `Emma B. (Google) Connected` with a green status indicator, `John D. Sync Alert` with a pulsing orange warning).

#### 2. Interactive Day, Week, and Month Views
* **Day View:** 
  - Hourly rows (08:00 to 20:00).
  - Multi-column layout if multiple therapists are selected, showing their schedules side-by-side.
  - Hover states showing a preview tooltip with patient name and treatment.
* **Week View:**
  - Standard 7-day grid display (columns).
  - Time increments matching Day view.
  - Appointments positioned absolutely based on start/end times.
* **Month View:**
  - 35 or 42 grid cells.
  - Days containing events display small indicators/pills with start times and color-coded tags.
  - "More (+3)" button for days with overflowing schedules.

#### 3. Visual Color Coding & Availability Tokens
To differentiate physiotherapists or treatment categories, schedule events will be color-coded using the STRIDE design palette:
* **Initial Assessments:** `--ember` background (`rgba(255, 90, 54, 0.15)`) with an `--ember` solid left border and neutral text.
* **Sports Rehab:** `--slate` background (`rgba(124, 139, 135, 0.15)`) with a `--slate` solid left border.
* **Manual Therapy:** Muted Gold background (`rgba(193, 162, 126, 0.15)`) with a gold left border.
* **Blocked Slots / External Google Calendar Sync Blocks:** Dark charcoal background (`var(--ink)`) with diagonal stripe pattern (created with a CSS `linear-gradient` pattern) and a subtle muted border to distinguish unavailability from clinic bookings.

---

### 9.3 Slide-Over Drawer (Patient Detail & Quick Actions)
When an appointment block is clicked, a slide-over drawer will emerge from the right edge of the screen.

* **UI Specifications:**
  - **Wrapper:** Fixed panel covering the full height of the viewport, with a width of `w-full max-w-md md:max-w-lg` and custom glassmorphism styling matching the theme.
  - **Backdrop Blur:** A semi-transparent overlay (`bg-black/60 backdrop-blur-sm`) covering the rest of the screen.
  - **Animation:** CSS transition sliding from `translate-x-full` to `translate-x-0` using Framer Motion or Tailwind transitions.
  - **Header:** Patient name, selected treatment type, dynamic status badge, and close button (`X`).
  - **Content Sections:**
    - *Appointment Details:* Date, Time range, Assigned Therapist, Clinic Room.
    - *Patient Contact:* Email, Phone (with quick copy button).
    - *Intake Responses:* Selected reason for visit, issue duration, and intake notes.
    - *Sync Information:* Cal.com link, external Google Calendar event ID reference.
  - **Footer Actions:**
    - "Reschedule Appointment": Opens the rescheduling selector.
    - "Cancel Appointment": Opens the cancellation reason modal.
    - "Edit Details": Quick links to update phone or note responses.

---

### 9.4 Implementation Checklist & Timeline

#### Phase 1: Route Setup & Sidebar Activation
- [ ] Update [AdminShell.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminShell.tsx):
  - [ ] Set "Calendar" menu item status to `"Active"` (remove `"Coming Soon"` badge).
  - [ ] Configure `activeTab === "Calendar"` handler to import and mount `<CalendarTab />`.

#### Phase 2: Mock & API Integrations
- [ ] Extend [cal-api.ts](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/lib/cal-api.ts):
  - [ ] Implement `getTherapistSyncStatuses` server function returning mock connection details.
  - [ ] Implement `getMasterScheduleEvents` mapping database/Cal.com slots and Google Calendar unavailability blocks.
  - [ ] Export type definitions for `CalendarEvent` and `TherapistSyncStatus`.

#### Phase 3: Build Calendar Views Layout
- [ ] Create component file [CalendarTab.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/CalendarTab.tsx).
- [ ] Build layout wrapper containing connection status pills, views switcher, and therapist filter selectors.
- [ ] Code the **Month View** layout (interactive grid, date calculation, event indicators).
- [ ] Code the **Week View** layout (hourly columns, event position calculations).
- [ ] Code the **Day View** layout (side-by-side therapist timeline columns).

#### Phase 4: Slide-over Drawer & Interactivity
- [ ] Implement Slide-over Drawer panel with backdrop blur and smooth sliding animation.
- [ ] Wire calendar event click triggers to open drawer and set current appointment state.
- [ ] Integrate quick action bindings in drawer (Cancel/Reschedule buttons triggering existing actions in `BookingsManagement` or `cal-api`).
- [ ] Implement color coding and diagonal stripe backgrounds for therapist availability blocks and blocked slots.

#### Phase 5: Verification & Quality Assurance
- [ ] Run typescript checker `npm run build` to verify typings.
- [ ] Verify responsive behavior of Month, Week, and Day views on mobile viewports (collapsing navigation, grid scrolling).
- [ ] Check accessibility ratios of color-coded items against dark background.

