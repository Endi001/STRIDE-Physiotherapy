# Implementation Plan - Admin & Booking Improvements

This implementation plan outlines the fixes and enhancements for the STRIDE Physiotherapy booking system, admin calendar, manual booking form, and shell layout.

---

## Technical Explanations

### 1. Reasons for Visit Distribution Chart
* **What does the TOTAL mean?**
  In the distribution chart, `TOTAL` represents the **sum of all occurrences of all reasons selected** across all bookings, rather than the total count of bookings.
* **How are multiple selections handled?**
  When a user selects two reasons for visit:
  1. Both selected reasons are aggregated individually. The counts of both reason categories are incremented by `1`.
  2. The total reasons count (used as the denominator for percentage calculation) increases by `2`.
  3. In the chart, both reasons will be displayed under their respective categories, with their percentages showing their share relative to the total number of reasons logged across the system.

---

## Proposed Changes

### 1. Typescript Error Fixes

#### [MODIFY] [BookingsManagement.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/BookingsManagement.tsx)
* Update manual booking creation handler to nest custom questions under the `responses` object matching the expected schema by `createCalBooking`.

#### [MODIFY] [CalendarSlideOver.tsx](file:///d:/Applications/Admin/CalendarSlideOver.tsx)
* Remove the type-narrowing comparison with `"Cancelled"` since `event.status` type only defines `"cancelled"` in lowercase. Once checked against `"cancelled"`, the type narrows, making the `"Cancelled"` comparison redundant and a TS error.

### 2. Client-Side Booking Modal Date Selection Fix

#### [MODIFY] [BookingModal.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/stride/BookingModal.tsx)
* Modify the Calendar `onSelect` callback to only set the selected date if the returned date is defined. This prevents double-clicking the selected date from clearing state and causing the header text to disappear.

### 3. Calendar View Details & Session Block Cleanup

#### [MODIFY] [CalendarSlideOver.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/CalendarSlideOver.tsx)
* Remove the `Assigned Physiotherapist` layout group from the slide-over component.

#### [MODIFY] [CalendarTab.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/CalendarTab.tsx)
* Wrap the therapist name `span` badge rendering in both daily and weekly views with a truthy check for `evt.therapistName`. This prevents rendering small empty styled blocks when the therapist name is blank.

### 4. Manual Booking Close Operations

#### [MODIFY] [BookingsManagement.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/BookingsManagement.tsx)
* Implement a click-out handler on the backdrop overlay of the Manual Booking modal.
* Implement a dirty check handler `handleCloseManualBooking`. If any input has been typed in the manual booking form, prompt the user with a confirmation dialog: *"Are you sure you want to abandon this booking? Any unsaved details will be lost."* before closing.
* Update both the close icon button (`X`) and the backdrop click-out to use this handler.

### 5. Sidebar Logo Layout

#### [MODIFY] [AdminShell.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/admin/AdminShell.tsx)
* Change the collapsed sidebar logo text from orange `"S"` to `"STRIDE"` using a smaller, compact text size (`text-xs` or `text-[10px]`) and adjusted letter tracking to fit neatly within the narrow sidebar.

---

## Verification Plan

### Automated Verification
* Run the typescript build or compile verification:
  `npm run build` or `npx tsc --noEmit`

### Manual Verification
* **Booking Modal (Client-side)**: Select a date, click it again, verify the selected date label persists.
* **Manual Booking Form**: Type some details, click outside the form or click `X`. Verify the browser asks to confirm abandonment. Verify clicking backdrop when empty closes without warning.
* **Calendar details**: Open appointment details inside Calendar tab. Verify "Assigned Physiotherapist" is gone.
* **Calendar sessions**: Verify calendar blocks have no empty styling nodes.
* **Sidebar logo**: Collapse left side sections tab, verify "STRIDE" is shown instead of orange "S".
