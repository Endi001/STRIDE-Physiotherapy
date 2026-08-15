import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Search,
  Mail,
  Phone,
  Clock,
  Trash2,
  Plus,
  X,
  CalendarCheck,
  AlertTriangle,
  ChevronDown,
  CheckSquare,
} from "lucide-react";
import {
  getCalBookingsList,
  cancelCalBooking,
  rescheduleCalBooking,
  getCalSlots,
  createCalBooking,
  CalBooking,
} from "@/lib/cal-api";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

// Real Cal.com booking form options for "Initial Assessment — Stride Physiotherapy"
const REASON_FOR_VISIT_OPTIONS = [
  "Back pain",
  "Neck pain",
  "Joint pain",
  "Muscle pain",
  "Post-operative rehabilitation",
  "Injury recovery",
  "Mobility problems",
  "Chronic pain",
  "Sports injuries",
];

const ISSUE_DURATION_OPTIONS = [
  "<1 week",
  "1–4 weeks",
  "1–6 months",
  "6+ months",
];

const SEEN_PHYSIO_OPTIONS = ["Yes", "No"];

// The only real public event type on this Cal.com account
const EVENT_TYPE_ID = 6323130; // "Initial Assessment — Stride Physiotherapy" (slug: 1h)

export function BookingsManagement() {
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<CalBooking | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellingInProgress, setCancellingInProgress] = useState(false);

  // Reschedule Modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<CalBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<{ time: string }[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reschedulingInProgress, setReschedulingInProgress] = useState(false);

  // Manual Booking Form (matches real Cal.com intake form)
  const [manualBookingOpen, setManualBookingOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualReasonForVisit, setManualReasonForVisit] = useState<string[]>([]);
  const [manualIssueDuration, setManualIssueDuration] = useState("");
  const [manualSeenPhysio, setManualSeenPhysio] = useState("");
  const [manualInsuranceMethod, setManualInsuranceMethod] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualSlots, setManualSlots] = useState<{ time: string }[]>([]);
  const [selectedManualSlot, setSelectedManualSlot] = useState<string | null>(null);
  const [loadingManualSlots, setLoadingManualSlots] = useState(false);
  const [manualBookingInProgress, setManualBookingInProgress] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  // Fetch bookings from Cal.com
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getCalBookingsList({
        data: {
          status: statusFilter === "all" ? undefined : statusFilter,
          search: searchTerm || undefined,
        },
      });
      setBookings(data);
    } catch (error) {
      console.error("Fetch bookings failed:", error);
      toast.error("Failed to load bookings from Cal.com");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, searchTerm]);

  // Load slots for rescheduling when date is picked
  useEffect(() => {
    if (!rescheduleDate || !selectedBookingForReschedule) return;

    // Validate date format (YYYY-MM-DD) and check year is reasonable (>= 2000)
    const match = rescheduleDate.match(/^(\d{4})-\d{2}-\d{2}$/);
    if (!match || parseInt(match[1], 10) < 2000) return;

    const loadRescheduleSlots = async () => {
      setLoadingSlots(true);
      try {
        const startOfDay = `${rescheduleDate}T00:00:00Z`;
        const endOfDay = `${rescheduleDate}T23:59:59Z`;

        const slots = await getCalSlots({
          data: {
            start: startOfDay,
            end: endOfDay,
            eventTypeId: EVENT_TYPE_ID,
          },
        });
        setRescheduleSlots(slots);
      } catch (error) {
        console.error("Load slots failed:", error);
        toast.error("Failed to fetch open slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    loadRescheduleSlots();
  }, [rescheduleDate, selectedBookingForReschedule]);

  // Load slots for manual booking when date is picked
  useEffect(() => {
    if (!manualDate) return;

    // Validate date format (YYYY-MM-DD) and check year is reasonable (>= 2000)
    const match = manualDate.match(/^(\d{4})-\d{2}-\d{2}$/);
    if (!match || parseInt(match[1], 10) < 2000) return;

    const loadManualSlots = async () => {
      setLoadingManualSlots(true);
      try {
        const startOfDay = `${manualDate}T00:00:00Z`;
        const endOfDay = `${manualDate}T23:59:59Z`;

        const slots = await getCalSlots({
          data: {
            start: startOfDay,
            end: endOfDay,
            eventTypeId: EVENT_TYPE_ID,
          },
        });
        setManualSlots(slots);
      } catch (error) {
        console.error("Load manual slots failed:", error);
        toast.error("Failed to fetch available slots");
      } finally {
        setLoadingManualSlots(false);
      }
    };

    loadManualSlots();
  }, [manualDate]);

  // Action handlers
  const handleCancelBooking = async () => {
    if (!selectedBookingForCancel) return;
    setCancellingInProgress(true);
    try {
      const res = await cancelCalBooking({
        data: {
          bookingUid: selectedBookingForCancel.uid,
          cancellationReason: cancellationReason || undefined,
        },
      });
      if (res.success) {
        toast.success("Booking cancelled successfully!");
        setCancelModalOpen(false);
        setCancellationReason("");
        fetchBookings();
      } else {
        toast.error("Failed to cancel booking");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setCancellingInProgress(false);
    }
  };

  const handleRescheduleBooking = async () => {
    if (!selectedBookingForReschedule || !selectedRescheduleSlot) {
      toast.error("Please pick a slot");
      return;
    }
    setReschedulingInProgress(true);
    try {
      const res = await rescheduleCalBooking({
        data: {
          bookingUid: selectedBookingForReschedule.uid,
          start: selectedRescheduleSlot,
        },
      });
      if (res.success) {
        toast.success("Booking rescheduled successfully!");
        setRescheduleModalOpen(false);
        setSelectedRescheduleSlot(null);
        setRescheduleDate("");
        fetchBookings();
      } else {
        toast.error("Failed to reschedule booking");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setReschedulingInProgress(false);
    }
  };

  const resetManualForm = () => {
    setManualName("");
    setManualEmail("");
    setManualPhone("");
    setManualReasonForVisit([]);
    setManualIssueDuration("");
    setManualSeenPhysio("");
    setManualInsuranceMethod("");
    setManualDate("");
    setManualSlots([]);
    setSelectedManualSlot(null);
  };

  const handleCloseManualBooking = () => {
    const isDirty = manualName || manualEmail || manualPhone || manualReasonForVisit.length > 0 || manualIssueDuration || manualSeenPhysio || manualInsuranceMethod || manualDate || selectedManualSlot;
    if (isDirty) {
      setShowAbandonConfirm(true);
    } else {
      setManualBookingOpen(false);
      resetManualForm();
    }
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualName || !manualEmail || !manualPhone) {
      toast.error("Please fill in name, email and phone number");
      return;
    }
    if (manualReasonForVisit.length === 0) {
      toast.error("Please select at least one reason for visit");
      return;
    }
    if (!manualIssueDuration) {
      toast.error("Please select how long the issue has been present");
      return;
    }
    if (!manualSeenPhysio) {
      toast.error("Please indicate if the patient has seen a physiotherapist before");
      return;
    }
    if (!manualInsuranceMethod) {
      toast.error("Please enter the insurance/payment method");
      return;
    }
    if (!selectedManualSlot) {
      toast.error("Please select an appointment time slot");
      return;
    }

    setManualBookingInProgress(true);
    try {
      await createCalBooking({
        data: {
          start: selectedManualSlot,
          name: manualName,
          email: manualEmail,
          phoneNumber: manualPhone,
          responses: {
            "Reason-for-visit": manualReasonForVisit,
            "How-long-have-you-had-this-issue": manualIssueDuration,
            "Have-you-seen-a-physiotherapist-for-this-before": manualSeenPhysio,
            "Insurance-payment-method": manualInsuranceMethod,
          },
        },
      });
      toast.success("Manual booking scheduled successfully!");
      setManualBookingOpen(false);
      resetManualForm();
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || "Failed to create manual booking");
    } finally {
      setManualBookingInProgress(false);
    }
  };

  const toggleReasonForVisit = (reason: string) => {
    setManualReasonForVisit((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  // Derive real display status from start time (Cal.com returns 'accepted' for all non-cancelled, even past)
  const getDisplayStatus = (booking: CalBooking): "upcoming" | "past" | "cancelled" => {
    if (booking.status === "cancelled" || booking.status === "rejected") return "cancelled";
    const start = new Date(booking.startTime);
    if (!isNaN(start.getTime()) && start < new Date()) return "past";
    return "upcoming";
  };

  const getStatusBadge = (booking: CalBooking) => {
    const displayStatus = getDisplayStatus(booking);
    switch (displayStatus) {
      case "upcoming":
        return (
          <span className="inline-flex items-center border border-[color:var(--slate-clinical)]/30 text-[color:var(--slate-clinical)] bg-[color:var(--slate-clinical)]/5 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider">
            Upcoming
          </span>
        );
      case "past":
        return (
          <span className="inline-flex items-center border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center border border-rose-500/20 text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider">
            Cancelled
          </span>
        );
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IE", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Client-side filter by Reason for Visit (from bookingFieldsResponses)
  const filteredBookings = bookings.filter((b) => {
    if (reasonFilter === "all") return true;
    const reasons: string[] = b.responses?.["Reason-for-visit"] || [];
    return reasons.includes(reasonFilter);
  });

  return (
    <div className="space-y-6 p-6 md:p-8 bg-black text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display tracking-tight text-white uppercase mb-1">
            Bookings Management
          </h1>
          <p className="text-xs text-[color:var(--muted-on-dark)] font-mono uppercase tracking-wider">
            Real-time Cal.com scheduler engine synchronisation
          </p>
        </div>
        <button
          onClick={() => setManualBookingOpen(true)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-[color:var(--ember)] hover:bg-[color:var(--ember)]/90 text-[color:var(--ember-foreground)] font-mono text-xs uppercase tracking-wider transition-colors"
          style={{ borderRadius: 3 }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Phone Booking
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-4 flex flex-col gap-4"
        style={{ borderRadius: 4 }}
      >
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[color:var(--muted-on-dark)]" />
            <input
              type="text"
              placeholder="Search by patient name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono py-2.5 pl-9 pr-4 transition-colors uppercase outline-none"
              style={{ borderRadius: 3 }}
            />
          </div>

          {/* Status Tabs */}
          <div
            className="flex bg-black/40 border border-[color:var(--hairline-dark)] p-0.5"
            style={{ borderRadius: 3 }}
          >
            {["upcoming", "past", "cancelled", "all"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  statusFilter === status
                    ? "bg-[color:var(--ember)] text-[color:var(--ember-foreground)] font-semibold"
                    : "text-[color:var(--muted-on-dark)] hover:text-white"
                }`}
                style={{ borderRadius: 2 }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Reason for Visit Filter — actual Cal.com intake field */}
        <div className="flex flex-wrap items-center gap-4 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
              Reason for Visit:
            </span>
            <div className="relative">
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="bg-black/50 border border-[color:var(--hairline-dark)] text-white text-[10px] font-mono px-2 py-1 pr-6 uppercase outline-none focus:border-[color:var(--ember)] appearance-none cursor-pointer"
                style={{ borderRadius: 2 }}
              >
                <option value="all">All Reasons</option>
                {REASON_FOR_VISIT_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1.5 h-3 w-3 text-[color:var(--muted-on-dark)] pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("upcoming");
              setReasonFilter("all");
            }}
            className="ml-auto text-[9px] font-mono uppercase text-[color:var(--muted-on-dark)] hover:text-[color:var(--ember)] transition-colors underline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div
        className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] overflow-hidden"
        style={{ borderRadius: 4 }}
      >
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="flex flex-col sm:flex-row gap-4 p-4 border border-[color:var(--hairline-dark)] animate-pulse bg-black/10"
                style={{ borderRadius: 3 }}
              >
                <div className="h-6 w-32 bg-white/5 rounded" />
                <div className="h-6 w-48 bg-white/5 rounded flex-1" />
                <div className="h-6 w-24 bg-white/5 rounded" />
                <div className="h-6 w-16 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <CalendarCheck className="h-8 w-8 mx-auto text-[color:var(--muted-on-dark)] opacity-40 mb-2" />
            <h3 className="font-display text-white text-lg uppercase">No bookings found</h3>
            <p className="text-xs text-[color:var(--muted-on-dark)] max-w-xs mx-auto">
              Try adjusting your search query, status categories, or filtering parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="border-b border-[color:var(--hairline-dark)] bg-black/25">
                  <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-[color:var(--muted-on-dark)]">
                    Date &amp; Time
                  </th>
                  <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-[color:var(--muted-on-dark)]">
                    Patient Details
                  </th>
                  <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-[color:var(--muted-on-dark)]">
                    Intake Summary
                  </th>
                  <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-[color:var(--muted-on-dark)]">
                    Status
                  </th>
                  <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-[color:var(--muted-on-dark)] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.map((booking) => {
                  const patient = booking.attendees[0] || {
                    name: "Unknown Client",
                    email: "",
                    phoneNumber: "",
                  };
                  const displayStatus = getDisplayStatus(booking);
                  const isCancelled = displayStatus === "cancelled";
                  const isPast = displayStatus === "past";
                  const reasons: string[] = booking.responses?.["Reason-for-visit"] || [];
                  const issueDuration = booking.responses?.["How-long-have-you-had-this-issue"];
                  const seenPhysio = booking.responses?.["Have-you-seen-a-physiotherapist-for-this-before"];
                  const insuranceMethod = booking.responses?.["Insurance-payment-method"];

                  return (
                    <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 align-top">
                        <p className="text-xs font-mono text-white font-semibold">
                          {formatDateTime(booking.startTime)}
                        </p>
                        <p className="text-[9px] font-mono text-[color:var(--muted-on-dark)] mt-0.5 uppercase">
                          Initial Assessment · 60 min
                        </p>
                      </td>
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-white">{patient.name}</p>
                          <div className="flex flex-col gap-0.5 text-[10px] font-mono text-[color:var(--muted-on-dark)] lowercase">
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3" /> {patient.email}
                            </span>
                            {patient.phoneNumber && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3" /> {patient.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top max-w-[260px]">
                        <div className="space-y-1.5">
                          {reasons.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {reasons.map((r) => (
                                <span
                                  key={r}
                                  className="inline-block border border-[color:var(--ember)]/20 text-[color:var(--ember)]/80 bg-[color:var(--ember)]/5 px-1.5 py-0.5 font-mono text-[8px] uppercase"
                                  style={{ borderRadius: 2 }}
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          )}
                          {issueDuration && (
                            <p className="text-[9px] font-mono text-[color:var(--muted-on-dark)]">
                              <span className="text-white/60">Duration:</span> {issueDuration}
                            </p>
                          )}
                          {seenPhysio && (
                            <p className="text-[9px] font-mono text-[color:var(--muted-on-dark)]">
                              <span className="text-white/60">Seen physio before:</span> {seenPhysio}
                            </p>
                          )}
                          {insuranceMethod && (
                            <p className="text-[9px] font-mono text-[color:var(--muted-on-dark)]">
                              <span className="text-white/60">Payment:</span> {insuranceMethod}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        {getStatusBadge(booking)}
                        {booking.cancellationReason && (
                          <p
                            className="text-[9px] font-mono text-rose-400/80 mt-1 max-w-[200px] truncate"
                            title={booking.cancellationReason}
                          >
                            Reason: {booking.cancellationReason}
                          </p>
                        )}
                      </td>
                      <td className="p-4 align-top text-right">
                        {!isCancelled && !isPast && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedBookingForReschedule(booking);
                                setRescheduleModalOpen(true);
                              }}
                              className="px-2.5 py-1 border border-white/10 hover:border-[color:var(--ember)] text-[9px] font-mono uppercase text-[color:var(--muted-on-dark)] hover:text-white bg-black/25 transition-colors"
                              style={{ borderRadius: 2 }}
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBookingForCancel(booking);
                                setCancelModalOpen(true);
                              }}
                              className="p-1 border border-rose-950/40 text-rose-500 hover:text-rose-400 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 transition-colors"
                              style={{ borderRadius: 2 }}
                              title="Cancel appointment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredBookings.map((booking) => {
                const patient = booking.attendees[0] || {
                  name: "Unknown Client",
                  email: "",
                  phoneNumber: "",
                };
                const displayStatus = getDisplayStatus(booking);
                const isCancelled = displayStatus === "cancelled";
                const isPast = displayStatus === "past";
                const reasons: string[] = booking.responses?.["Reason-for-visit"] || [];
                const issueDuration = booking.responses?.["How-long-have-you-had-this-issue"];
                const insuranceMethod = booking.responses?.["Insurance-payment-method"];

                return (
                  <div key={booking.id} className="p-4 space-y-3 bg-black/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-mono text-white font-semibold">
                          {formatDateTime(booking.startTime)}
                        </p>
                        <span className="text-[9px] font-mono text-[color:var(--muted-on-dark)] uppercase">
                          Initial Assessment · 60 min
                        </span>
                      </div>
                      {getStatusBadge(booking)}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white">{patient.name}</p>
                      <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)]">
                        {patient.email}
                      </p>
                      {patient.phoneNumber && (
                        <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)]">
                          {patient.phoneNumber}
                        </p>
                      )}
                    </div>

                    {(reasons.length > 0 || issueDuration || insuranceMethod) && (
                      <div
                        className="p-2 bg-black/30 border border-[color:var(--hairline-dark)] space-y-1.5"
                        style={{ borderRadius: 2 }}
                      >
                        {reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {reasons.map((r) => (
                              <span
                                key={r}
                                className="inline-block border border-[color:var(--ember)]/20 text-[color:var(--ember)]/80 bg-[color:var(--ember)]/5 px-1.5 py-0.5 font-mono text-[8px] uppercase"
                                style={{ borderRadius: 2 }}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                        {issueDuration && (
                          <p className="text-[9px] font-mono text-[color:var(--muted-on-dark)]">
                            Duration: {issueDuration}
                          </p>
                        )}
                        {insuranceMethod && (
                          <p className="text-[9px] font-mono text-[color:var(--muted-on-dark)]">
                            Payment: {insuranceMethod}
                          </p>
                        )}
                      </div>
                    )}

                    {booking.cancellationReason && (
                      <p className="text-[9px] font-mono text-rose-400/80">
                        Reason: {booking.cancellationReason}
                      </p>
                    )}

                    {!isCancelled && !isPast && (
                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => {
                            setSelectedBookingForReschedule(booking);
                            setRescheduleModalOpen(true);
                          }}
                          className="flex-1 py-1.5 border border-white/10 hover:border-[color:var(--ember)] text-[10px] font-mono uppercase text-center text-white"
                          style={{ borderRadius: 2 }}
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBookingForCancel(booking);
                            setCancelModalOpen(true);
                          }}
                          className="px-3 border border-rose-950/40 text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center justify-center"
                          style={{ borderRadius: 2 }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Cancel Booking */}
      {cancelModalOpen && selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] max-w-md w-full p-6 space-y-4"
            style={{ borderRadius: 4 }}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-lg font-display uppercase tracking-tight text-white">
                  Cancel Appointment
                </h3>
              </div>
              <button
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancellationReason("");
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[color:var(--muted-on-dark)] leading-relaxed font-mono">
              Are you sure you want to cancel the appointment for{" "}
              <strong className="text-white">
                {(selectedBookingForCancel.attendees[0] || {}).name}
              </strong>{" "}
              on{" "}
              <strong className="text-white">
                {formatDateTime(selectedBookingForCancel.startTime)}
              </strong>
              ? This will permanently cancel the slot on Cal.com.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                Cancellation Reason (Optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="E.g., Requested by patient, double booked..."
                rows={3}
                className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none resize-none uppercase"
                style={{ borderRadius: 3 }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancellationReason("");
                }}
                className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs font-mono uppercase text-[color:var(--muted-on-dark)] hover:text-white"
                style={{ borderRadius: 3 }}
              >
                Go Back
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancellingInProgress}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs uppercase font-semibold disabled:opacity-50"
                style={{ borderRadius: 3 }}
              >
                {cancellingInProgress ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Reschedule Booking */}
      {rescheduleModalOpen && selectedBookingForReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] max-w-lg w-full p-6 space-y-4"
            style={{ borderRadius: 4 }}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-[color:var(--ember)]">
                <CalendarCheck className="h-5 w-5" />
                <h3 className="text-lg font-display uppercase tracking-tight text-white">
                  Reschedule Booking
                </h3>
              </div>
              <button
                onClick={() => {
                  setRescheduleModalOpen(false);
                  setRescheduleDate("");
                  setRescheduleSlots([]);
                  setSelectedRescheduleSlot(null);
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-[color:var(--muted-on-dark)] font-mono space-y-1">
              <p>
                Patient:{" "}
                <strong className="text-white">
                  {(selectedBookingForReschedule.attendees[0] || {}).name}
                </strong>
              </p>
              <p>
                Current:{" "}
                <strong className="text-white">
                  {formatDateTime(selectedBookingForReschedule.startTime)}
                </strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                Select New Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none transition-colors text-left"
                    style={{ borderRadius: 3 }}
                  >
                    <span>
                      {rescheduleDate
                        ? format(
                            (() => {
                              const [y, m, d] = rescheduleDate.split("-").map(Number);
                              return new Date(y, m - 1, d);
                            })(),
                            "PPP"
                          )
                        : "SELECT NEW DATE"}
                    </span>
                    <CalendarIcon className="h-4 w-4 text-[color:var(--muted-on-dark)]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-[#101113] border-[#3a3632] text-white [--color-popover:#101113] [--color-popover-foreground:#F5F3EF] [--color-border:#3a3632] [--color-accent:#FF5A36] [--color-accent-foreground:#4A1B0C] [--color-primary:#FF5A36] [--color-primary-foreground:#4A1B0C]"
                  align="start"
                >
                  <CalendarComponent
                    mode="single"
                    selected={
                      rescheduleDate
                        ? (() => {
                            const [y, m, d] = rescheduleDate.split("-").map(Number);
                            return new Date(y, m - 1, d);
                          })()
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const day = String(date.getDate()).padStart(2, "0");
                        setRescheduleDate(`${year}-${month}-${day}`);
                      } else {
                        setRescheduleDate("");
                      }
                      setSelectedRescheduleSlot(null);
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    className="bg-[#101113] text-white border-[#3a3632]"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {rescheduleDate && (
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider block">
                  Available Times
                </label>
                {loadingSlots ? (
                  <div className="h-20 flex items-center justify-center text-xs font-mono text-[color:var(--muted-on-dark)] animate-pulse">
                    Scanning available slots...
                  </div>
                ) : rescheduleSlots.length === 0 ? (
                  <p className="text-xs font-mono text-rose-400 p-3 border border-rose-950/20 bg-rose-950/5 text-center">
                    No openings found for this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                    {rescheduleSlots.map((slot) => {
                      const timeStr = new Date(slot.time).toLocaleTimeString("en-IE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const isSelected = selectedRescheduleSlot === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setSelectedRescheduleSlot(slot.time)}
                          className={`p-2 font-mono text-[10px] text-center border transition-colors ${
                            isSelected
                              ? "bg-[color:var(--ember)] border-[color:var(--ember)] text-[color:var(--ember-foreground)] font-bold"
                              : "border-[color:var(--hairline-dark)] hover:border-white text-white bg-black/25"
                          }`}
                          style={{ borderRadius: 2 }}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
              <button
                onClick={() => {
                  setRescheduleModalOpen(false);
                  setRescheduleDate("");
                  setRescheduleSlots([]);
                  setSelectedRescheduleSlot(null);
                }}
                className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs font-mono uppercase text-[color:var(--muted-on-dark)]"
                style={{ borderRadius: 3 }}
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleBooking}
                disabled={reschedulingInProgress || !selectedRescheduleSlot}
                className="px-4 py-2 bg-[color:var(--ember)] hover:bg-[color:var(--ember)]/90 text-[color:var(--ember-foreground)] font-mono text-xs uppercase font-semibold disabled:opacity-50"
                style={{ borderRadius: 3 }}
              >
                {reschedulingInProgress ? "Rescheduling..." : "Save Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Manual / Phone Booking Form — matches real Cal.com intake form */}
      {manualBookingOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseManualBooking();
            }
          }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
        >
          <div
            className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] max-w-xl w-full p-6 space-y-5 my-8"
            style={{ borderRadius: 4 }}
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-[color:var(--ember)]">
                <Plus className="h-5 w-5" />
                <div>
                  <h3 className="text-lg font-display uppercase tracking-tight text-white">
                    Manual / Phone Booking
                  </h3>
                  <p className="text-[9px] font-mono text-[color:var(--muted-on-dark)] uppercase tracking-wider mt-0.5">
                    Initial Assessment — Stride Physiotherapy
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseManualBooking}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-5">
              {/* Section: Patient Details */}
              <div>
                <p className="text-[9px] font-mono uppercase text-[color:var(--ember)] tracking-widest mb-3 border-b border-[color:var(--ember)]/10 pb-1.5">
                  Patient Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Emma Byrne"
                      className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none transition-colors"
                      style={{ borderRadius: 3 }}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="emma.byrne@gmail.com"
                      className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none transition-colors"
                      style={{ borderRadius: 3 }}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="+353871234567"
                      className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none transition-colors"
                      style={{ borderRadius: 3 }}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Intake Questions */}
              <div>
                <p className="text-[9px] font-mono uppercase text-[color:var(--ember)] tracking-widest mb-3 border-b border-[color:var(--ember)]/10 pb-1.5">
                  Intake Questions
                </p>
                <div className="space-y-4">
                  {/* Reason for Visit — multiselect checkboxes */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                      Reason for Visit *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {REASON_FOR_VISIT_OPTIONS.map((reason) => {
                        const isChecked = manualReasonForVisit.includes(reason);
                        return (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => toggleReasonForVisit(reason)}
                            className={`flex items-center gap-1.5 px-2 py-1.5 border text-left text-[9px] font-mono uppercase transition-colors ${
                              isChecked
                                ? "border-[color:var(--ember)] text-[color:var(--ember)] bg-[color:var(--ember)]/10"
                                : "border-[color:var(--hairline-dark)] text-[color:var(--muted-on-dark)] hover:border-white/30 hover:text-white"
                            }`}
                            style={{ borderRadius: 2 }}
                          >
                            <CheckSquare
                              className={`h-3 w-3 flex-shrink-0 ${isChecked ? "text-[color:var(--ember)]" : "opacity-30"}`}
                            />
                            {reason}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* How long have you had this issue */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                      How long have you had this issue? *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ISSUE_DURATION_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setManualIssueDuration(opt)}
                          className={`px-3 py-1.5 border text-[10px] font-mono uppercase transition-colors ${
                            manualIssueDuration === opt
                              ? "border-[color:var(--ember)] text-[color:var(--ember)] bg-[color:var(--ember)]/10"
                              : "border-[color:var(--hairline-dark)] text-[color:var(--muted-on-dark)] hover:border-white/30 hover:text-white"
                          }`}
                          style={{ borderRadius: 2 }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seen physiotherapist before */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                      Have you seen a physiotherapist for this before? *
                    </label>
                    <div className="flex gap-2">
                      {SEEN_PHYSIO_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setManualSeenPhysio(opt)}
                          className={`flex-1 py-1.5 border text-[10px] font-mono uppercase transition-colors ${
                            manualSeenPhysio === opt
                              ? "border-[color:var(--ember)] text-[color:var(--ember)] bg-[color:var(--ember)]/10"
                              : "border-[color:var(--hairline-dark)] text-[color:var(--muted-on-dark)] hover:border-white/30 hover:text-white"
                          }`}
                          style={{ borderRadius: 2 }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Insurance / Payment method */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                      Insurance / Payment Method *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualInsuranceMethod}
                      onChange={(e) => setManualInsuranceMethod(e.target.value)}
                      placeholder='e.g., "Private pay", "VHI", "Laya Healthcare"...'
                      className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none transition-colors"
                      style={{ borderRadius: 3 }}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Date & Time */}
              <div>
                <p className="text-[9px] font-mono uppercase text-[color:var(--ember)] tracking-widest mb-3 border-b border-[color:var(--ember)]/10 pb-1.5">
                  Appointment Slot
                </p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                      Appointment Date *
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none transition-colors text-left"
                          style={{ borderRadius: 3 }}
                        >
                          <span>
                            {manualDate
                              ? format(
                                  (() => {
                                    const [y, m, d] = manualDate.split("-").map(Number);
                                    return new Date(y, m - 1, d);
                                  })(),
                                  "PPP"
                                )
                              : "SELECT APPOINTMENT DATE"}
                          </span>
                          <CalendarIcon className="h-4 w-4 text-[color:var(--muted-on-dark)]" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-[#101113] border-[#3a3632] text-white [--color-popover:#101113] [--color-popover-foreground:#F5F3EF] [--color-border:#3a3632] [--color-accent:#FF5A36] [--color-accent-foreground:#4A1B0C] [--color-primary:#FF5A36] [--color-primary-foreground:#4A1B0C]"
                        align="start"
                      >
                        <CalendarComponent
                          mode="single"
                          selected={
                            manualDate
                              ? (() => {
                                  const [y, m, d] = manualDate.split("-").map(Number);
                                  return new Date(y, m - 1, d);
                                })()
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, "0");
                              const day = String(date.getDate()).padStart(2, "0");
                              setManualDate(`${year}-${month}-${day}`);
                            } else {
                              setManualDate("");
                            }
                            setSelectedManualSlot(null);
                            setManualSlots([]);
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          className="bg-[#101113] text-white border-[#3a3632]"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {manualDate && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider block">
                        Choose Time Slot *
                      </label>
                      {loadingManualSlots ? (
                        <div className="h-16 flex items-center justify-center text-xs font-mono text-[color:var(--muted-on-dark)] animate-pulse">
                          Scanning available slots...
                        </div>
                      ) : manualSlots.length === 0 ? (
                        <p className="text-xs font-mono text-rose-400 p-2.5 border border-rose-950/20 bg-rose-950/5 text-center">
                          No available slots found for this date.
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                          {manualSlots.map((slot) => {
                            const timeStr = new Date(slot.time).toLocaleTimeString("en-IE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            const isSelected = selectedManualSlot === slot.time;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                onClick={() => setSelectedManualSlot(slot.time)}
                                className={`p-2 font-mono text-[10px] text-center border transition-colors ${
                                  isSelected
                                    ? "bg-[color:var(--ember)] border-[color:var(--ember)] text-[color:var(--ember-foreground)] font-bold"
                                    : "border-[color:var(--hairline-dark)] hover:border-white text-white bg-black/25"
                                }`}
                                style={{ borderRadius: 2 }}
                              >
                                {timeStr}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Footer */}
              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleCloseManualBooking}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs font-mono uppercase text-[color:var(--muted-on-dark)]"
                  style={{ borderRadius: 3 }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={manualBookingInProgress || !selectedManualSlot}
                  className="px-4 py-2 bg-[color:var(--ember)] hover:bg-[color:var(--ember)]/90 text-[color:var(--ember-foreground)] font-mono text-xs uppercase font-semibold disabled:opacity-50 transition-colors"
                  style={{ borderRadius: 3 }}
                >
                  {manualBookingInProgress ? "Scheduling..." : "Schedule Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAbandonConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] max-w-sm w-full p-6 space-y-4 shadow-2xl" style={{ borderRadius: 4 }}>
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h4 className="text-sm font-display uppercase tracking-tight text-white">Abandon Booking?</h4>
            </div>
            <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase tracking-wider leading-relaxed">
              Are you sure you want to leave this form? Any unsaved details will be lost.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowAbandonConfirm(false)}
                className="px-3.5 py-2 border border-white/10 hover:border-white/20 text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)]"
                style={{ borderRadius: 3 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAbandonConfirm(false);
                  setManualBookingOpen(false);
                  resetManualForm();
                }}
                className="px-3.5 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 text-[10px] font-mono uppercase"
                style={{ borderRadius: 3 }}
              >
                Abandon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
