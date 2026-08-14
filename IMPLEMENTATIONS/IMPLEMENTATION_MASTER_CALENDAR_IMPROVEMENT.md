# Master Calendar Improvements

This plan targets three specific improvements to the **Calendar tab** in the admin dashboard (`CalendarTab.tsx` / `cal-api.ts`), covering integration correctness, Day view visual accuracy, and Month view label clarity.

---

## 1. Cal.com Integration Audit — Slot Times & Booking Duration

### Current Situation

The **`getMasterScheduleEvents`** server function currently returns **mock data only** (`getMockMasterEvents()`). It does **not** call the Cal.com v2 API to fetch real bookings. This means the calendar never shows real slots from Cal.com — it always renders the hardcoded fallback events defined inside `cal-api.ts`.

The mock events use **45-minute sessions** (e.g. `08:00–08:45`, `09:30–10:15`, `11:00–11:45`). This is incorrect for the actual event type slug `"1h"`, which is a **60-minute session with no buffer**. With a 60-minute duration and no buffer, all slots would fall on exact hours (e.g., `09:00`, `10:00`, `11:00`), never on the half-hour (`09:30`) or quarter-hour (`11:45`).

### Root Cause

- `getMasterScheduleEvents` has no logic to call `GET /v2/bookings` from Cal.com. It's entirely mocked.
- The mock data has durations of 45 minutes, not 60 minutes.
- The 30-minute and 45-minute start times visible in the mock (`09:30`, `11:45`) come from this mock data — **they are not a real Cal.com integration bug**.
- The user's real Cal.com account has event type `"1h"` (60 min, no buffer) — confirmed by `createCalBooking`, which uses `eventTypeSlug: "1h"`, and `getCalSlots`, which correctly fetches available slots from the real Cal.com API.

### Conclusion

> [!IMPORTANT]
> The "9:30 and 11:45 slots" the user is asking about come from the **mock data**, not from Cal.com. The real Cal.com integration for **fetching bookings** is **not yet implemented** in `getMasterScheduleEvents`. This is the primary thing to fix.

### Plan

#### [MODIFY] `cal-api.ts`

1. **Update `getMasterScheduleEvents`** to first call the real Cal.com v2 `GET /v2/bookings` endpoint (same pattern as `getCalBookingsList`) — filtered by a date range — to retrieve real bookings.
2. Map the raw Cal.com booking response to the `CalendarEvent` interface:
   - `id` ← `b.uid`
   - `title` ← derived from `b.eventType.title` or `b.title`
   - `start` / `end` ← `b.start` / `b.end`
   - `type` ← `"booking"`
   - `therapistId` / `therapistName` ← determined from the organiser host field in the response
   - `treatmentType` ← `b.eventType.title`
   - `patientName` ← `b.attendees[0].name`
   - `patientEmail` ← `b.attendees[0].email`
   - `patientPhone` ← `b.attendees[0].phoneNumber`
   - `status` ← derived via `normalizeBookingStatus()`
   - `notes` ← from `b.bookingFieldsResponses` (the "Reason-for-visit" field)
   - `syncSource` ← `"cal.com"`
3. **Gracefully fall back to `getMockMasterEvents()`** if the API key is absent or the request fails — exactly like `getCalBookingsList` does.
4. Fix the **mock data** to use 60-minute sessions (`08:00–09:00`, `10:00–11:00`, `14:00–15:00`) with only exact-hour start times, so that even the fallback is accurate.

> [!NOTE]
> Blocked/Google Calendar sync events will remain mocked for now since there is no Google Calendar integration yet.

---

## 2. Day View — Session Blocks Overlaying the Grid

### Current Situation

In the Day view, the grid lines are rendered as `<div>` elements with `border-t` inside the same `relative` container as the events. Events have `zIndex: 10` and grid lines have `zIndex: 0`. However, since the event buttons do not set `background-color` at full opacity (they use `bg-[color:var(--ember)]/10` — a **10% opacity background**), the grid lines visually show through the session block, creating a "cut" effect where the horizontal border-t line is visible inside the event card.

### Plan

#### [MODIFY] `CalendarTab.tsx` — Day View and Week View event buttons

1. Change the event background from transparent/low-opacity `bg-[color:var(--ember)]/10` to a **fully opaque solid background**. The design will use a rich dark amber panel — a deep dark color with an amber left-border accent stripe, similar to Google Calendar's dark mode pattern:
   - Background: `bg-[#1a0e04]` (near-black warm amber)
   - Left accent border: `border-l-2 border-[color:var(--ember)]`
   - Right/top/bottom borders: very subtle `border-[color:var(--ember)]/20`

2. The `getEventColorsClass` helper function will be updated to return the new class string for bookings.

#### Colour Strategy

| Element | Current | Proposed |
|---|---|---|
| Booking event background | `bg-[ember]/10` (transparent) | `bg-[#1a0e04]` (fully opaque) |
| Booking event border | `border-[ember]` (all sides) | `border-l-2 border-[ember]`, other sides `border-[ember]/20` |
| Booking event text | `text-white` | `text-white` (unchanged) |

> [!NOTE]
> Blocked slots (hatched pattern) use `backgroundImage` with a solid stripe pattern — they are already effectively opaque and do not need this fix. They will remain unchanged.

---

## 3. Month View — Session Block Labels (No Therapist Names)

### Current Situation

In the month view, session blocks display `evt.patientName || evt.title` (line ~609). The title typically contains the therapist name (e.g., `"Manual Therapy - Emma Byrne"`). Neither the title nor the patient name is the most useful label in a compact month cell — the user wants either the **reason for booking** (`treatmentType`) or the **time**, or both.

### Plan

#### [MODIFY] `CalendarTab.tsx` — Month view session block label

Replace the current label logic:
```tsx
{isBlocked ? "Blocked" : evt.patientName || evt.title}
```

With a new helper that renders **time + treatment type**:
1. `HH:mm · <treatmentType>` — if `treatmentType` is set (e.g., `"09:00 · Initial Assessment"`)
2. `HH:mm · <type from title>` — strip the patient name suffix from the title using `split(" - ")[0]`
3. `HH:mm` alone — as a final fallback

```tsx
const time = format(new Date(evt.start), "HH:mm");
const typeLabel = evt.treatmentType || evt.title?.split(" - ")[0]?.trim();
const label = typeLabel ? `${time} · ${typeLabel}` : time;
// Render: {isBlocked ? "Blocked" : label}
```

> [!TIP]
> This provides maximum information density for the monthly grid: at a glance, you see when a session is and what kind it is — without cluttering the cell with physiotherapist names that are less relevant at the month level.

---

---

## 4. Master Calendar — Reschedule Date Picker Calendar View

### Current Situation

In the Master Calendar reschedule modal (`CalendarTab.tsx`), the admin is prompted to pick a new date using a standard HTML `<input type="date" />`. This is inconsistent with other parts of the admin dashboard, such as the Bookings Management rescheduling or Manual Booking features, which render a premium calendar picker (`Popover` + `CalendarComponent`). 

### Plan

#### [MODIFY] `CalendarTab.tsx` — Reschedule date input

1. **Import UI components**:
   - `Popover`, `PopoverTrigger`, `PopoverContent` from `@/components/ui/popover`
   - `Calendar` as `CalendarComponent` from `@/components/ui/calendar`
2. **Replace Date Input**:
   - Swap the native `<input type="date" />` with a `Popover` containing a `CalendarComponent` styled to match the page theme.
   - Map the selected date in `CalendarComponent` using the format `yyyy-MM-dd` and set the state `rescheduleDate` accordingly.
   - Ensure the past dates are disabled, matching the min date constraint (`disabled={(date) => date < startOfToday()}`).

---

## Proposed Changes Summary

### `src/lib/cal-api.ts`
- **[MODIFY]** `getMasterScheduleEvents`: Wire to real Cal.com `GET /v2/bookings` API with date-range params, map response to `CalendarEvent[]`, fall back to mock on error.
- **[MODIFY]** `getMockMasterEvents`: Fix mock booking durations to 60 minutes and fix start times to exact hours only.

### `src/components/admin/CalendarTab.tsx`
- **[MODIFY]** **Imports**: Add `Popover`, `PopoverTrigger`, `PopoverContent` from `@/components/ui/popover` and `Calendar` as `CalendarComponent` from `@/components/ui/calendar`.
- **[MODIFY]** `getEventColorsClass`: Update booking class to use solid opaque background.
- **[MODIFY]** Day view event buttons: Apply updated class + explicit solid background.
- **[MODIFY]** Week view event buttons: Apply same solid background fix.
- **[MODIFY]** Month view session block label: Replace patient name / raw title with `time · treatmentType` format.
- **[MODIFY]** Reschedule Modal: Replace native `<input type="date" />` with a `Popover` calendar picker.

---

## Open Questions

> [!IMPORTANT]
> **Q1 — Therapist attribution in real Cal.com bookings?**
> The real Cal.com account has one organiser (`endi-b3omc8`). Should all fetched bookings be attributed to a single therapist name (e.g., "Clinic"), or left blank? If multiple therapists use separate Cal.com accounts in the future, the mapping strategy will need to change.

> [!IMPORTANT]
> **Q2 — Date range for real booking fetch?**
> Currently `getMasterScheduleEvents` is called with the start/end of the visible month. Should we also fetch `upcoming` and `past` bookings in a wider window, or strictly honor the date range passed by the calendar?

> [!NOTE]
> **Q3 — Month view: use `treatmentType` or `notes` (reason for visit)?**
> The plan uses `treatmentType` (e.g., "Initial Assessment") as the month-view label, which is concise. The `notes` field contains the patient's free-text intake answer and may be too long. Confirm `treatmentType` is the right choice, or if you prefer showing the free-text reason instead.

---

## Verification Plan

### Manual QA
1. **Cal.com integration**: Navigate to the Calendar tab with today's date. Real bookings from Cal.com should appear. All start times should be on exact hours (no `:30` or `:45`).
2. **Day view**: Select a day with at least one booking. No horizontal grid line should be visible cutting through a session block.
3. **Month view**: Each session chip should show `HH:mm · Treatment Type` — no physiotherapist name visible.
4. **Reschedule Calendar Picker**: Click a booking in the Day/Week/Month view, click "Reschedule", and verify that the date input is replaced by a calendar popover. Ensure picking a date correctly scans and updates the available slots.

