import { useEffect, useRef, useState } from "react";
import { useBooking } from "./booking-context";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay } from "date-fns";
import { getCalSlots, createCalBooking, getCalEventDetails } from "@/lib/cal-api";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Select from 'react-select';

const BOOKING_INPUT_CLASS =
  "w-full border border-[color:var(--hairline-dark-strong)] rounded-md px-4 py-2.5 outline-none focus:border-[color:var(--ember)] focus:ring-1 focus:ring-[color:var(--ember)] transition-all bg-[color:var(--bone)] text-base md:text-sm";

const BOOKING_COMPOSITE_INPUT_CLASS =
  "w-full border border-[color:var(--hairline-dark-strong)] rounded-md px-4 py-2.5 outline-none focus-within:border-[color:var(--ember)] focus-within:ring-1 focus-within:ring-[color:var(--ember)] transition-all bg-[color:var(--bone)] text-base md:text-sm";

const BOOKING_SELECT_CLASSNAMES = {
  control: () => `${BOOKING_COMPOSITE_INPUT_CLASS} shadow-none min-h-[42px]`,
  valueContainer: () => "px-0 py-0 gap-1",
  placeholder: () => "text-[color:var(--muted-on-light)] text-base md:text-sm",
  singleValue: () => "text-[color:var(--text-on-light)] text-base md:text-sm",
  input: () => "text-[color:var(--text-on-light)] text-base md:text-sm m-0 p-0",
  multiValue: () => "bg-[color:var(--hairline-light)] rounded text-base md:text-sm",
  multiValueLabel: () => "text-[color:var(--text-on-light)] text-base md:text-sm px-1",
  multiValueRemove: () => "text-[color:var(--muted-on-light)] hover:text-[color:var(--ink)] hover:bg-transparent rounded",
  menu: () => "bg-[color:var(--bone)] border border-[color:var(--hairline-dark-strong)] rounded-md shadow-lg mt-1 overflow-hidden",
  menuList: () => "py-1",
  option: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) =>
    [
      "px-3 py-2.5 text-base md:text-sm cursor-pointer",
      isSelected ? "bg-[color:var(--ember)] text-[color:var(--ember-foreground)]" : "",
      isFocused && !isSelected ? "bg-[color:var(--hairline-light)] text-[color:var(--text-on-light)]" : "",
      !isFocused && !isSelected ? "text-[color:var(--text-on-light)]" : "",
    ].join(" "),
  indicatorSeparator: () => "hidden",
  dropdownIndicator: () => "text-[color:var(--muted-on-light)] p-2",
  clearIndicator: () => "text-[color:var(--muted-on-light)] p-2 hover:text-[color:var(--ink)]",
};

const BOOKING_SELECT_STYLES = {
  control: (base: any, state: any) => ({
    ...base,
    border: state.isFocused ? "1px solid var(--ember)" : "1px solid var(--hairline-dark-strong)",
    boxShadow: state.isFocused ? "0 0 0 1px var(--ember)" : "none",
    backgroundColor: "var(--bone)",
    minHeight: "42px",
    borderRadius: "0.375rem",
    "&:hover": {
      borderColor: state.isFocused ? "var(--ember)" : "var(--hairline-dark-strong)",
    }
  }),
  menu: (base: any) => ({ ...base, zIndex: 100 }),
  menuPortal: (base: any) => ({ ...base, zIndex: 100 }),
};

export function BookingModal() {
  const { open, closeModal } = useBooking();
  const [step, setStep] = useState(1);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Event Details State
  const [eventDetails, setEventDetails] = useState<{
    id: number;
    title: string;
    description: string;
    length: number;
    location: string;
    bookingFields?: any[];
  } | null>(null);

  // Booking State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ time: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedDate(new Date());
      setSelectedTime(null);
      setFormResponses({});
      setError(null);
      return;
    }

    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Intercept wheel/touch events so Lenis doesn't scroll the page behind the modal
    const overlay = dialogRef.current?.closest('[data-booking-overlay]') as HTMLElement | null;
    const stopWheel = (e: WheelEvent) => e.stopPropagation();
    const stopTouch = (e: TouchEvent) => e.stopPropagation();
    overlay?.addEventListener('wheel', stopWheel, { passive: false });
    overlay?.addEventListener('touchmove', stopTouch, { passive: false });

    // Fetch Event Details
    if (!eventDetails) {
      getCalEventDetails({ data: { eventTypeSlug: "1h" } })
        .then((res) => setEventDetails(res))
        .catch(console.error);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab") {
        const f = dialogRef.current?.querySelectorAll<HTMLElement>(
          "a,button,input,textarea,select,[tabindex]:not([tabindex='-1'])"
        );
        if (!f || f.length === 0) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      overlay?.removeEventListener('wheel', stopWheel);
      overlay?.removeEventListener('touchmove', stopTouch);
      prev?.focus?.();
    };
  }, [open, closeModal, eventDetails]);

  useEffect(() => {
    if (step === 1 && selectedDate && eventDetails) {
      setLoadingSlots(true);
      setError(null);
      
      const start = startOfDay(selectedDate).toISOString();
      const end = endOfDay(selectedDate).toISOString();

      getCalSlots({ data: { start, end, eventTypeId: eventDetails.id } })
        .then((res) => {
          const sorted = (res || []).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
          setSlots(sorted);
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to load available times.");
        })
        .finally(() => {
          setLoadingSlots(false);
        });
    }
  }, [step, selectedDate, eventDetails]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) return;

    setBookingLoading(true);
    setError(null);

    // Map the standard fields
    const name = formResponses["name"] || "";
    const email = formResponses["email"] || "";
    const phoneNumber = formResponses["attendeePhoneNumber"] || "";
    const notes = formResponses["notes"] || formResponses["rescheduleReason"] || "";

    // Pluck standard fields out, leaving only the custom responses
    const customResponses = { ...formResponses };
    delete customResponses["name"];
    delete customResponses["email"];
    delete customResponses["attendeePhoneNumber"];
    delete customResponses["notes"];

    // Validate custom dynamic fields (react-select doesn't have native HTML5 validation blocking)
    if (eventDetails?.bookingFields) {
      for (const field of eventDetails.bookingFields) {
        if (field.hidden || field.type === "radioInput" || field.type === "unknown") continue;
        
        const fieldName = field.slug || "";
        const isStandard = ["name", "email", "attendeePhoneNumber", "notes"].includes(fieldName);
        
        if (!isStandard && field.required !== false) {
          const val = formResponses[fieldName];
          if (field.type === "multiselect") {
            if (!val || val.length === 0) {
              setError(`Please select an option for: ${field.label || fieldName}`);
              setBookingLoading(false);
              return;
            }
          } else if (field.type === "boolean" || field.type === "checkbox") {
            if (!val) {
              setError(`Please check the box for: ${field.label || fieldName}`);
              setBookingLoading(false);
              return;
            }
          } else {
            if (!val || val.toString().trim() === "") {
              setError(`Please fill out: ${field.label || fieldName}`);
              setBookingLoading(false);
              return;
            }
          }
        }
      }
    }

    try {
      await createCalBooking({
        data: {
          start: selectedTime,
          name,
          email,
          phoneNumber,
          notes,
          responses: customResponses,
        },
      });
      setStep(3); // Go to confirmation page
    } catch (err) {
      console.error(err);
      setError("Failed to create booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div
      data-booking-overlay
      aria-hidden={!open}
      className={[
        "fixed inset-x-0 top-0 h-[100dvh] z-[60] transition-opacity",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      style={{ transitionDuration: "220ms", transitionTimingFunction: "var(--ease-strike)" }}
    >
      <button
        aria-label="Close booking dialog"
        onClick={closeModal}
        className="absolute inset-0 bg-[color:var(--ink)]/70 backdrop-blur-sm transition-opacity duration-300"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className={[
          "absolute bg-[color:var(--bone)] text-[color:var(--text-on-light)]",
          "left-0 right-0 bottom-0 top-16 md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2",
          "w-full md:max-h-[85vh]",
          step === 1 ? "md:w-[840px]" : "md:w-[480px]",
          "flex flex-col shadow-2xl transition-all duration-300",
        ].join(" ")}
        style={{
          borderRadius: 8,
          scale: open ? undefined : "0.98",
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--hairline-light)] shrink-0">
          <div>
            <div className="eyebrow text-[color:var(--muted-on-light)] text-xs uppercase tracking-wider font-semibold">Book</div>
            <div className="font-display text-xl leading-none mt-1">An assessment</div>
          </div>
          <button
            ref={closeRef}
            onClick={closeModal}
            aria-label="Close"
            className="text-[color:var(--muted-on-light)] hover:text-[color:var(--ink)] transition-colors p-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto overflow-x-hidden bg-[color:var(--bone)] overscroll-contain">
          {step === 1 && (
            <div className="flex flex-col md:flex-row md:h-full min-h-[500px]">
              {/* Left Panel: Intro */}
              <div className="p-5 md:p-8 md:w-[320px] border-b md:border-b-0 md:border-r border-[color:var(--hairline-light)] bg-white/50 shrink-0">
                {eventDetails ? (
                  <>
                    <h3 className="font-display text-2xl mb-4">{eventDetails.title}</h3>
                    <div 
                      className="text-[color:var(--muted-on-light)] mb-8 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: eventDetails.description }}
                    />
                    
                    <div className="flex flex-col gap-3 text-sm">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-[color:var(--muted-on-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{eventDetails.length} mins</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-[color:var(--muted-on-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{eventDetails.location}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-[color:var(--hairline-light)] rounded w-3/4"></div>
                    <div className="h-4 bg-[color:var(--hairline-light)] rounded w-full"></div>
                    <div className="h-4 bg-[color:var(--hairline-light)] rounded w-full"></div>
                    <div className="h-4 bg-[color:var(--hairline-light)] rounded w-5/6"></div>
                  </div>
                )}
              </div>

              {/* Right Panel: Calendar & Time */}
              <div className="px-5 py-6 md:p-8 flex-1 flex flex-col items-center">
                <h3 className="font-display text-xl mb-6 w-full text-left">Select a Date & Time</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  disabled={(date) => date < startOfDay(new Date())}
                  className="w-full mb-20 md:mb-8 rounded-md max-w-[90%] mx-auto [--cell-size:2rem]"
                  classNames={{
                    root: "w-full",
                  }}
                />

                <div className="w-full mb-8 max-w-[90%] mx-auto">
                  <div className="font-medium mb-4 text-sm text-[color:var(--muted-on-light)] uppercase tracking-wider">
                    Available times for {selectedDate ? format(selectedDate, "MMM d, yyyy") : ""}
                  </div>
                  {loadingSlots ? (
                    <div className="text-[color:var(--muted-on-light)] text-sm animate-pulse">Checking availability...</div>
                  ) : slots.length === 0 ? (
                    <div className="text-[color:var(--muted-on-light)] text-sm italic">No slots available on this date.</div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {slots.map((slot, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-3 md:py-2 text-sm font-medium border rounded-md transition-all ${
                            selectedTime === slot.time
                              ? "bg-[color:var(--ember)] text-[color:var(--ember-foreground)] border-[color:var(--ember)] ring-2 ring-[color:var(--ember)] ring-offset-1"
                              : "border-[color:var(--hairline-light)] bg-white hover:border-[color:var(--ink)]"
                          }`}
                        >
                          {format(new Date(slot.time), "HH:mm")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
        <div className="text-red-500 mb-4 text-sm bg-red-50 p-3 rounded flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setStep(1)} className="ml-2 text-sm underline">Retry</button>
        </div>
      )}

                <div className="mt-auto w-full pt-4 border-t border-[color:var(--hairline-light)]">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedTime}
                    className="bg-[color:var(--ember)] px-6 py-3 text-[color:var(--ember-foreground)] font-medium cursor-pointer w-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="px-5 py-6 md:p-8 flex flex-col md:h-full text-left min-h-[500px] bg-white">
              <h3 className="font-display text-2xl mb-2">Your Details</h3>
              <div className="text-[color:var(--muted-on-light)] mb-8 pb-6 border-b border-[color:var(--hairline-light)] text-sm">
                You selected <span className="font-medium text-[color:var(--ink)]">{selectedTime && format(new Date(selectedTime), "EEEE, MMMM d, yyyy 'at' HH:mm")}</span>
              </div>

              <form onSubmit={handleConfirmBooking} className="flex flex-col gap-5 flex-1 overflow-visible">
                {eventDetails?.bookingFields && eventDetails.bookingFields.length > 0 ? (
                  eventDetails.bookingFields.map((field, i) => {
                    const fieldName = field.slug || `field_${i}`;
                    const isRequired = field.required !== false && field.hidden !== true;
                    
                    if (field.hidden || field.slug === "location" || field.type === "radioInput") return null;

                    const fieldId = `booking-field-${fieldName}-${i}`;

                    let displayLabel = field.label || "";
                    if (!displayLabel) {
                      if (fieldName === "name") displayLabel = "Full Name";
                      else if (fieldName === "email") displayLabel = "Email Address";
                      else if (fieldName === "attendeePhoneNumber") displayLabel = "Phone Number";
                      else displayLabel = fieldName;
                    }

                    let defaultPlaceholder = "";
                    if (field.type === "select" || field.type === "multiselect" || field.type === "radio") {
                      defaultPlaceholder = "Select...";
                    } else if (fieldName === "name") {
                      defaultPlaceholder = "John Doe";
                    } else if (fieldName === "email") {
                      defaultPlaceholder = "john.doe@example.com";
                    } else if (fieldName === "notes" || field.type === "textarea") {
                      defaultPlaceholder = "Please share anything that will help prepare for our meeting.";
                    }

                    const resolvedPlaceholder = field.placeholder || defaultPlaceholder;

                    return (
                      <div key={`${fieldName}-${i}`}>
                        <label htmlFor={fieldId} className="block text-sm font-semibold mb-1.5 text-[color:var(--ink)]">
                          {displayLabel} {isRequired && "*"}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea
                            id={fieldId}
                            required={isRequired}
                            placeholder={resolvedPlaceholder}
                            value={formResponses[fieldName] || ""}
                            onChange={(e) => setFormResponses((prev) => ({ ...prev, [fieldName]: e.target.value }))}
                            rows={4}
                            className={BOOKING_INPUT_CLASS + " resize-none"}
                          />
                        ) : field.type === "boolean" || field.type === "checkbox" ? (
                          <div className="flex items-center gap-3 mt-2">
                            <input
                              id={fieldId}
                              type="checkbox"
                              required={isRequired}
                              checked={!!formResponses[fieldName]}
                              onChange={(e) => setFormResponses((prev) => ({ ...prev, [fieldName]: e.target.checked }))}
                              className="w-5 h-5 accent-[color:var(--ember)]"
                            />
                            <span className="text-sm">{displayLabel}</span>
                          </div>
                        ) : field.type === "select" || field.type === "multiselect" || field.type === "radio" ? (
                          <Select
                            id={fieldId}
                            inputId={`${fieldId}-select`}
                            isMulti={field.type === "multiselect"}
                            placeholder={resolvedPlaceholder}
                            options={field.options?.map((opt: any) => ({
                              value: typeof opt === 'object' ? opt.value || opt.label : opt,
                              label: typeof opt === 'object' ? opt.label || opt.value : opt,
                            }))}
                            value={
                              field.options
                                ? field.options
                                    .map((opt: any) => ({
                                      value: typeof opt === 'object' ? opt.value || opt.label : opt,
                                      label: typeof opt === 'object' ? opt.label || opt.value : opt,
                                    }))
                                    .filter((o: any) => 
                                      field.type === "multiselect" 
                                        ? (formResponses[fieldName] || []).includes(o.value)
                                        : formResponses[fieldName] === o.value
                                    )
                                : null
                            }
                            onChange={(selected: any) => {
                              if (field.type === "multiselect") {
                                setFormResponses((prev) => ({ ...prev, [fieldName]: selected ? selected.map((s: any) => s.value) : [] }));
                              } else {
                                setFormResponses((prev) => ({ ...prev, [fieldName]: selected ? selected.value : "" }));
                              }
                            }}
                            classNames={BOOKING_SELECT_CLASSNAMES}
                            styles={BOOKING_SELECT_STYLES}
                          />
                        ) : field.type === "phone" ? (
                          <PhoneInput
                            id={fieldId}
                            numberInputProps={{ id: `${fieldId}-phone` }}
                            international
                            defaultCountry="NL"
                            countryCallingCodeEditable={false}
                            required={isRequired}
                            placeholder={resolvedPlaceholder}
                            value={formResponses[fieldName]}
                            onChange={(value) => setFormResponses((prev) => ({ ...prev, [fieldName]: value }))}
                            className={`booking-phone-input ${BOOKING_COMPOSITE_INPUT_CLASS} [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:min-h-[26px]`}
                          />
                        ) : (
                          <input
                            id={fieldId}
                            required={isRequired}
                            placeholder={resolvedPlaceholder}
                            type={field.type === "email" ? "email" : "text"}
                            value={formResponses[fieldName] || ""}
                            onChange={(e) => setFormResponses((prev) => ({ ...prev, [fieldName]: e.target.value }))}
                            className={BOOKING_INPUT_CLASS}
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div>
                      <label htmlFor="booking-field-name-fallback" className="block text-sm font-semibold mb-1.5 text-[color:var(--ink)]">Full Name *</label>
                      <input
                        id="booking-field-name-fallback"
                        required
                        type="text"
                        value={formResponses["name"] || ""}
                        onChange={(e) => setFormResponses((prev) => ({ ...prev, name: e.target.value }))}
                        className={BOOKING_INPUT_CLASS}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="booking-field-email-fallback" className="block text-sm font-semibold mb-1.5 text-[color:var(--ink)]">Email Address *</label>
                      <input
                        id="booking-field-email-fallback"
                        required
                        type="email"
                        value={formResponses["email"] || ""}
                        onChange={(e) => setFormResponses((prev) => ({ ...prev, email: e.target.value }))}
                        className={BOOKING_INPUT_CLASS}
                        placeholder="jane@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="booking-field-notes-fallback" className="block text-sm font-semibold mb-1.5 text-[color:var(--ink)]">Additional Notes</label>
                      <textarea
                        id="booking-field-notes-fallback"
                        value={formResponses["notes"] || ""}
                        onChange={(e) => setFormResponses((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={4}
                        className={`${BOOKING_INPUT_CLASS} resize-none`}
                        placeholder="Please share anything that will help prepare for our meeting."
                      />
                    </div>
                  </>
                )}

                {error && <div className="text-red-500 text-sm mt-2 bg-red-50 p-3 rounded">{error}</div>}

                <div className="mt-auto flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-[color:var(--hairline-dark-strong)] rounded-md font-medium hover:bg-[color:var(--bone)] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="flex-1 bg-[color:var(--ember)] px-6 py-3 text-[color:var(--ember-foreground)] font-medium cursor-pointer rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                  >
                    {bookingLoading ? "Confirming..." : "Confirm Booking"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="px-5 py-8 md:p-10 flex flex-col md:h-full items-center justify-center text-center min-h-[500px] bg-white">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-display text-3xl mb-4 text-[color:var(--ink)]">Booking Confirmed!</h3>
              <p className="text-[color:var(--muted-on-light)] mb-2 text-lg">
                Your assessment has been scheduled.
              </p>
              <div className="bg-[color:var(--bone)] px-6 py-4 rounded-md mb-10 w-full max-w-sm border border-[color:var(--hairline-light)]">
                <p className="font-semibold text-[color:var(--ink)] text-lg">
                  {selectedTime && format(new Date(selectedTime), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-[color:var(--muted-on-light)] mt-1">
                  {selectedTime && format(new Date(selectedTime), "HH:mm")}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="bg-[color:var(--ember)] px-8 py-3 text-[color:var(--ember-foreground)] font-medium cursor-pointer w-full hover:opacity-90 transition-opacity rounded-md shadow-sm"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
