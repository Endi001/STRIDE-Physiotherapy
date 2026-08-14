# Dashboard Overview — Reason for Visit Distribution

This plan outlines the changes to display the distribution of **Reasons for Visit** (e.g. Back Pain, Neck Pain, etc.) rather than event types (Initial Assessment, Sports Rehab, etc.) in the dashboard overview donut chart.

---

## 1. Extracting Reasons for Visit from Cal.com Bookings

### Current Situation

The "Treatment Distribution" chart inside `AdminDashboard.tsx` groups bookings by their event type title (`b.eventType?.title` or `b.title` or `"Other"`). This displays categories such as "Initial Assessment" or "Sports Rehab".

### Proposed Changes

The client intake form on Cal.com includes a multi-select field named **"Reason-for-visit"**. This field is stored in Cal.com booking objects and mapped in our codebase as:
`b.responses?.["Reason-for-visit"]` (an array of strings or single string)

We will modify the chart aggregation logic to parse this field. If multiple reasons are selected for a single session (e.g. `["Back pain", "Muscle pain"]`), we will count each reason individually to build a true representation of patient issues.

### Smart keyword-based inference fallback

To ensure that mock bookings, older bookings, or manually imported phone bookings (which might not have this field) display correctly:
1. We will check the `responses?.["Reason-for-visit"]` key first.
2. If it is empty/absent, we will check the booking's `notes` or `title` against a keyword dictionary to infer the likely category (e.g., if notes mention "lumbar" or "back", we count it as "Back pain").
3. If no keywords match, it falls back to `"Unspecified"`.

---

## Proposed Changes Summary

### `src/lib/cal-api.ts`
- **[MODIFY]** `fallbackBookings`: Update the mock bookings to include explicit `"Reason-for-visit"` arrays in their `responses` object so that offline/offline testing modes show realistic reason data (e.g., `"Reason-for-visit": ["Back pain", "Sports injuries"]`).

### `src/components/admin/AdminDashboard.tsx`
- **[MODIFY]** `buildTreatmentData`: Rewrite this helper to extract the reasons for visit (direct response or inferred via keyword match from notes/title/description), aggregate the counts per reason, and return them formatted for the Recharts pie/donut chart.
- **[MODIFY]** UI Text Labels: Update the card header and description text from:
  - "Treatment Distribution" / "Bookings breakdown by therapy category"
  - **to**: "Reasons for Visit" / "Distribution of client symptoms & reasons for booking".

---

## Inferred Reason Mapping Logic

If explicit `"Reason-for-visit"` response data is missing, we scan the combined text of the title, description, and intake notes using the following keyword mappings:

| Target Category | Keywords searched (case-insensitive) |
|---|---|
| **Back pain** | `back`, `lumbar`, `spine`, `sciatica` |
| **Neck pain** | `neck`, `cervical`, `whiplash` |
| **Joint pain** | `joint`, `shoulder`, `knee`, `elbow`, `ankle`, `hip`, `wrist` |
| **Muscle pain** | `muscle`, `strain`, `spasm`, `quad`, `hamstring`, `calf` |
| **Post-operative rehabilitation** | `post-op`, `surgery`, `rehab`, `rehabilitation`, `post-operative` |
| **Injury recovery** | `injury`, `sprain`, `tear`, `fracture`, `accident` |
| **Mobility problems** | `mobility`, `stiff`, `range of motion`, `gait`, `flexibility` |
| **Chronic pain** | `chronic`, `persistent`, `long-term` |
| **Sports injuries** | `sports`, `running`, `athletic`, `football`, `soccer`, `tennis` |

---

## Verification Plan

### Manual QA
1. **Mock Data Check (Offline)**: If `CAL_COM_API_KEY` is not present, load the dashboard. The donut chart should render slices for "Back pain", "Neck pain", "Post-operative rehabilitation", etc. derived from the updated mock data and keyword mapping.
2. **Interactive Tooltip**: Hover over the chart slices and verify the text shows the correct symptom names and percentages (e.g., "Back pain: 35%").
3. **Responsive Legend**: Verify the colored legend labels show the symptoms instead of event types.
