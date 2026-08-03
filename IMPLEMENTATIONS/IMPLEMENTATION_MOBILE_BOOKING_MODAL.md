# Implementation: Mobile Booking Modal & Accessibility Improvements

This document outlines the proposed changes to enhance the mobile user experience of the booking modal in the STRIDE Physiotherapy application. The goal is to resolve visual clutter, prevent browser-induced page zooming on input focus, and improve overall mobile accessibility without affecting the desktop view.

---

## 1. Identified Issues & Solutions

### A. Calendar Overlapping / Squishing on Mobile
* **Problem**: In the mobile view, the Calendar and "Available Times" sections get cluttered and overlapping (e.g., the last row of the calendar grid `30 31 1 2 3 4 5` renders over the "Available Times" title). 
* **Cause**: The container in Step 1 has a hardcoded `h-full` class. On mobile, where the intro panel and calendar panel are stacked vertically, the total height exceeds the viewport. The flex layout forces the panels and their children to shrink or overflow, squishing the Calendar component.
* **Solution**: 
  - Change `h-full` to `md:h-full` on the main Step 1 and Step 2 wrapper containers. On mobile, this lets the container take `h-auto` and grow to fit its children naturally.
  - The parent scroll container (`overflow-y-auto`) will handle scrolling properly.
  - Adjust panel paddings on mobile (e.g., from `p-8` to `px-5 py-6 md:p-8`) to prevent cramped layouts and allow more horizontal breathing room for calendar columns.

### B. Mobile Page Auto-Zooming on Focus
* **Problem**: Safari and Chrome on iOS automatically zoom in when form fields are focused, requiring the user to zoom back out to navigate or submit the form.
* **Cause**: Mobile browsers zoom in when an input, textarea, or select element has a font size less than `16px` (e.g., the current `text-sm` / `0.875rem` / `14px` styles).
* **Solution**:
  - Update input field CSS classes (`BOOKING_INPUT_CLASS` and `BOOKING_COMPOSITE_INPUT_CLASS`) to use `text-base md:text-sm` (16px on mobile, 14px on desktop).
  - Update `BOOKING_SELECT_CLASSNAMES` (`placeholder`, `singleValue`, `input`) to use `text-base md:text-sm`.
  - Update the phone input classes in `styles.css` using media queries to be `1rem` (16px) on mobile and `0.875rem` (14px) on screens larger than `768px`.

### C. Additional Accessibility & Mobile UX Enhancements
* **Tap Target Sizes**:
  - Update the time slot buttons class in Step 1 to have a larger tap area on mobile: `py-3 md:py-2` (making sure buttons are comfortable to touch and meet the WCAG minimum 44px recommended size).
* **Form Element Screen-Reader Association**:
  - Bind labels to inputs using a unique generated `id` and `htmlFor` dynamically for each custom booking field in `BookingModal.tsx`. Currently, the inputs and labels are not explicitly associated via `id`/`htmlFor` attributes, which makes it harder for screen-reader users to identify active fields.
* **Focus Indicators**:
  - Ensure clear focus outlines for keyboard/accessible navigation indicators on all interactive elements in the modal.

---

## 2. Proposed Code Changes

### [BookingModal.tsx](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/components/stride/BookingModal.tsx)
1. **Input Size Updates**:
   Update class definitions to ensure `16px` (`text-base`) font size on mobile:
   ```typescript
   const BOOKING_INPUT_CLASS =
     "w-full border border-[color:var(--hairline-dark-strong)] rounded-md px-4 py-2.5 outline-none focus:border-[color:var(--ember)] focus:ring-1 focus:ring-[color:var(--ember)] transition-all bg-[color:var(--bone)] text-base md:text-sm";

   const BOOKING_COMPOSITE_INPUT_CLASS =
     "w-full border border-[color:var(--hairline-dark-strong)] rounded-md px-4 py-2.5 outline-none focus-within:border-[color:var(--ember)] focus-within:ring-1 focus-within:ring-[color:var(--ember)] transition-all bg-[color:var(--bone)] text-base md:text-sm";
   ```
2. **React-Select Classes**:
   Update `BOOKING_SELECT_CLASSNAMES` to ensure mobile font size is `text-base`:
   ```typescript
   const BOOKING_SELECT_CLASSNAMES = {
     control: () => `${BOOKING_COMPOSITE_INPUT_CLASS} shadow-none min-h-[42px]`,
     valueContainer: () => "px-0 py-0 gap-1",
     placeholder: () => "text-[color:var(--muted-on-light)] text-base md:text-sm",
     singleValue: () => "text-[color:var(--text-on-light)] text-base md:text-sm",
     input: () => "text-[color:var(--text-on-light)] text-base md:text-sm m-0 p-0",
     // ...
   };
   ```
3. **Step Wrapper Heights & Mobile Paddings**:
   - For Step 1 (Calendar & Time):
     - Replace `flex flex-col md:flex-row h-full min-h-[500px]` with `flex flex-col md:flex-row md:h-full min-h-[500px]`.
     - Update Left Panel: `p-8 md:w-[320px] ...` to `p-5 md:p-8 md:w-[320px] ...`.
     - Update Right Panel: `p-8 flex-1 ...` to `px-5 py-6 md:p-8 flex-1 ...`.
   - For Step 2 (Your Details):
     - Replace `p-8 flex flex-col h-full text-left min-h-[500px] bg-white` with `px-5 py-6 md:p-8 flex flex-col md:h-full text-left min-h-[500px] bg-white`.
4. **Time Slot Tap Target Size**:
   - Replace `<button className={`py-2 text-sm ...`}` with `<button className={`py-3 md:py-2 text-sm ...`}`.
5. **Labels Dynamic Association**:
   - Add `id` to the `<input>`, `<textarea>`, `<PhoneInput>`, and `<Select>` components, and link them via `<label htmlFor={fieldId}>`.

### [styles.css](file:///d:/Applications/AntigravityFiles/STRIDE%20Physiotherapy/src/styles.css)
* Add media query to ensure the phone input uses 16px font size on mobile view while maintaining 14px on desktop:
  ```css
  .booking-phone-input .PhoneInputInput {
    font-size: 1rem; /* 16px on mobile */
    line-height: 1.5rem;
    color: var(--text-on-light);
  }
  @media (min-width: 768px) {
    .booking-phone-input .PhoneInputInput {
      font-size: 0.875rem; /* 14px on desktop */
      line-height: 1.25rem;
    }
  }
  ```

---

## 3. Verification & Testing Plan

### Manual Verification
1. **Layout & Clutter Test**:
   - Open the website on a mobile device or browser simulator set to mobile viewport.
   - Click "Book an assessment" to open the booking modal.
   - Verify that the calendar is fully visible and does not overlap with "Available times" or other elements.
   - Verify that vertical scrolling works smoothly within the modal body if content height exceeds the viewport.
2. **Page Zooming Test**:
   - Focus on the "Full Name", "Email Address", "Phone Number", and "Additional Notes" inputs on iOS Safari or Chrome.
   - Verify that the browser does not perform automatic page zooming.
3. **Desktop Regression Check**:
   - Open the booking modal on desktop.
   - Verify that the layout remains unchanged, font size remains `14px` (`text-sm`), and all elements render correctly as before.
