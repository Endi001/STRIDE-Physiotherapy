import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Search,
  User,
  Mail,
  Phone,
  FileText,
  Clock,
  Trash2,
  RefreshCw,
  Plus,
  X,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";
import {
  getCalBookingsList,
  cancelCalBooking,
  rescheduleCalBooking,
  getCalSlots,
  createCalBooking,
  CalBooking,
  CalAttendee,
} from "@/lib/cal-api";

export function BookingsManagement() {
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [therapistFilter, setTherapistFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  // Mutation Modals States
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<CalBooking | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellingInProgress, setCancellingInProgress] = useState(false);

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<CalBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<{ time: string }[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reschedulingInProgress, setReschedulingInProgress] = useState(false);

  const [manualBookingOpen, setManualBookingOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualService, setManualService] = useState("initial-assessment"); // slug
  const [manualSlots, setManualSlots] = useState<{ time: string }[]>([]);
  const [selectedManualSlot, setSelectedManualSlot] = useState<string | null>(null);
  const [loadingManualSlots, setLoadingManualSlots] = useState(false);
  const [manualBookingInProgress, setManualBookingInProgress] = useState(false);

  // Hardcoded therapists mapping for demonstration
  const therapists = ["Conor M.", "Maeve O'B."];

  // Fetch Bookings list
  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Cal.com status filters: upcoming, past, cancelled
      const data = await getCalBookingsList({ 
        data: {
          status: statusFilter === "all" ? undefined : statusFilter,
          search: searchTerm || undefined,
        }
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
    
    const loadRescheduleSlots = async () => {
      setLoadingSlots(true);
      try {
        const startOfDay = `${rescheduleDate}T00:00:00Z`;
        const endOfDay = `${rescheduleDate}T23:59:59Z`;
        const eventTypeId = selectedBookingForReschedule.eventType?.id || 1;
        
        const slots = await getCalSlots({
          data: {
            start: startOfDay,
            end: endOfDay,
            eventTypeId,
          }
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

  // Load slots for manual booking when date/service is picked
  useEffect(() => {
    if (!manualDate || !manualService) return;
    
    const loadManualSlots = async () => {
      setLoadingManualSlots(true);
      try {
        const startOfDay = `${manualDate}T00:00:00Z`;
        const endOfDay = `${manualDate}T23:59:59Z`;
        // Mapping slug to a mock event ID for slot querying
        const eventTypeId = manualService === "initial-assessment" ? 1 : manualService === "sports-rehab" ? 2 : 3;
        
        const slots = await getCalSlots({
          data: {
            start: startOfDay,
            end: endOfDay,
            eventTypeId,
          }
        });
        setManualSlots(slots);
      } catch (error) {
        console.error("Load manual slots failed:", error);
        toast.error("Failed to fetch slots");
      } finally {
        setLoadingManualSlots(false);
      }
    };

    loadManualSlots();
  }, [manualDate, manualService]);

  // Action Handlers
  const handleCancelBooking = async () => {
    if (!selectedBookingForCancel) return;
    setCancellingInProgress(true);
    try {
      const res = await cancelCalBooking({
        data: {
          bookingUid: selectedBookingForCancel.uid,
          cancellationReason: cancellationReason || undefined,
        }
      });
      if (res.success) {
        toast.success("Booking cancelled successfully!");
        setCancelModalOpen(false);
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
        }
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

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManualSlot || !manualName || !manualEmail || !manualPhone) {
      toast.error("Please fill in all required fields and pick a slot");
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
          notes: manualNotes || undefined,
          eventTypeSlug: manualService,
        }
      });
      toast.success("Manual booking scheduled successfully!");
      setManualBookingOpen(false);
      // Reset form
      setManualName("");
      setManualEmail("");
      setManualPhone("");
      setManualNotes("");
      setManualDate("");
      setSelectedManualSlot(null);
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || "Failed to create manual booking");
    } finally {
      setManualBookingInProgress(false);
    }
  };

  // Status badges helper
  const getStatusBadge = (status: CalBooking["status"]) => {
    const normStatus = status.toLowerCase();
    switch (normStatus) {
      case "upcoming":
      case "accepted":
        return <span className="inline-flex items-center border border-[color:var(--slate-clinical)]/30 text-[color:var(--slate-clinical)] bg-[color:var(--slate-clinical)]/5 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider">Upcoming</span>;
      case "past":
        return <span className="inline-flex items-center border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider">Completed</span>;
      case "cancelled":
      case "rejected":
        return <span className="inline-flex items-center border border-rose-500/20 text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider">Cancelled</span>;
      default:
        return <span className="inline-flex items-center border border-neutral-500/20 text-neutral-400 bg-neutral-500/5 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider">{status}</span>;
    }
  };

  // Helper to format date-time values cleanly
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IE", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoString;
    }
  };

  // Client-side filtering logic
  const filteredBookings = bookings.filter(b => {
    // Filter by therapist (demonstration mapping)
    if (therapistFilter !== "all") {
      const isConor = b.id.charCodeAt(0) % 2 === 0; // Simulated attribution
      const assigned = isConor ? "Conor M." : "Maeve O'B.";
      if (assigned !== therapistFilter) return false;
    }

    // Filter by service slug
    if (serviceFilter !== "all" && b.eventType?.slug !== serviceFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 p-6 md:p-8 bg-black text-white">
      {/* Tab Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display tracking-tight text-white uppercase mb-1">
            Bookings Management
          </h1>
          <p className="text-xs text-[color:var(--muted-on-dark)] font-mono uppercase tracking-wider">
            Real-time Cal.com scheduler engine synchronization
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
      <div className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-4 flex flex-col gap-4" style={{ borderRadius: 4 }}>
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
          <div className="flex bg-black/40 border border-[color:var(--hairline-dark)] p-0.5" style={{ borderRadius: 3 }}>
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

        {/* Dropdowns filters */}
        <div className="flex flex-wrap gap-4 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
              Therapist:
            </span>
            <select
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
              className="bg-black/50 border border-[color:var(--hairline-dark)] text-white text-[10px] font-mono px-2 py-1 uppercase outline-none focus:border-[color:var(--ember)]"
              style={{ borderRadius: 2 }}
            >
              <option value="all">All Staff</option>
              {therapists.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
              Treatment:
            </span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-black/50 border border-[color:var(--hairline-dark)] text-white text-[10px] font-mono px-2 py-1 uppercase outline-none focus:border-[color:var(--ember)]"
              style={{ borderRadius: 2 }}
            >
              <option value="all">All Services</option>
              <option value="initial-assessment">Initial Assessment</option>
              <option value="sports-rehab">Sports Rehab</option>
              <option value="manual-therapy">Manual Therapy</option>
              <option value="dry-needling">Dry Needling</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("upcoming");
              setTherapistFilter("all");
              setServiceFilter("all");
            }}
            className="ml-auto text-[9px] font-mono uppercase text-[color:var(--muted-on-dark)] hover:text-[color:var(--ember)] transition-colors underline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Bookings Table / List */}
      <div className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] overflow-hidden" style={{ borderRadius: 4 }}>
        {loading ? (
          /* Loading skeletons */
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="flex flex-col sm:flex-row gap-4 p-4 border border-[color:var(--hairline-dark)] animate-pulse bg-black/10" style={{ borderRadius: 3 }}>
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
          /* Responsive Table content */
          <div className="overflow-x-auto">
            {/* Desktop View Table */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="border-b border-[color:var(--hairline-dark)] bg-black/25">
                  <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-[color:var(--muted-on-dark)]">Date & Time</th>
                  <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-[color:var(--muted-on-dark)]">Patient Details</th>
                  <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-[color:var(--muted-on-dark)]">Service Type</th>
                  <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-[color:var(--muted-on-dark)]">Therapist</th>
                  <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-[color:var(--muted-on-dark)]">Status</th>
                  <th className="p-4 font-mono text-[9px] uppercase tracking-wider text-[color:var(--muted-on-dark)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.map((booking) => {
                  const patient = booking.attendees[0] || { name: "Unknown Client", email: "", phoneNumber: "" };
                  const isEven = booking.id.charCodeAt(0) % 2 === 0;
                  const assignedTherapist = isEven ? "Conor M." : "Maeve O'B.";
                  const isCancelled = booking.status.toLowerCase() === "cancelled";

                  return (
                    <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 align-top">
                        <p className="text-xs font-mono text-white font-semibold">
                          {formatDateTime(booking.startTime)}
                        </p>
                      </td>
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-white">{patient.name}</p>
                          <div className="flex flex-col gap-0.5 text-[10px] font-mono text-[color:var(--muted-on-dark)] lowercase">
                            <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {patient.email}</span>
                            {patient.phoneNumber && (
                              <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {patient.phoneNumber}</span>
                            )}
                          </div>
                          {booking.responses?.notes && (
                            <div className="mt-2 p-2 bg-black/30 border border-[color:var(--hairline-dark)]" style={{ borderRadius: 2 }}>
                              <p className="text-[9px] font-mono text-neutral-400 capitalize-first leading-relaxed">
                                <span className="text-[color:var(--slate-clinical)] font-bold">Notes: </span>
                                {booking.responses.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span className="text-xs font-mono uppercase text-white">
                          {booking.eventType?.title || "Physio Session"}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        <span className="text-xs font-mono uppercase text-[color:var(--muted-on-dark)]">
                          {assignedTherapist}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        {getStatusBadge(booking.status)}
                        {booking.cancellationReason && (
                          <p className="text-[9px] font-mono text-rose-400/80 mt-1 max-w-[200px] truncate" title={booking.cancellationReason}>
                            Reason: {booking.cancellationReason}
                          </p>
                        )}
                      </td>
                      <td className="p-4 align-top text-right">
                        {!isCancelled && (
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

            {/* Mobile View List */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredBookings.map((booking) => {
                const patient = booking.attendees[0] || { name: "Unknown Client", email: "", phoneNumber: "" };
                const isEven = booking.id.charCodeAt(0) % 2 === 0;
                const assignedTherapist = isEven ? "Conor M." : "Maeve O'B.";
                const isCancelled = booking.status.toLowerCase() === "cancelled";

                return (
                  <div key={booking.id} className="p-4 space-y-3 bg-black/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-mono text-white font-semibold">
                          {formatDateTime(booking.startTime)}
                        </p>
                        <span className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase">
                          {booking.eventType?.title || "Physio Session"}
                        </span>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white">{patient.name}</p>
                      <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)]">{patient.email}</p>
                      {patient.phoneNumber && (
                        <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)]">{patient.phoneNumber}</p>
                      )}
                      <p className="text-[9px] font-mono text-[color:var(--muted-on-dark)] uppercase mt-1">
                        Therapist: {assignedTherapist}
                      </p>
                    </div>

                    {booking.responses?.notes && (
                      <div className="p-2 bg-black/35 border border-[color:var(--hairline-dark)]" style={{ borderRadius: 2 }}>
                        <p className="text-[9px] font-mono text-neutral-400">
                          {booking.responses.notes}
                        </p>
                      </div>
                    )}

                    {!isCancelled && (
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
          <div className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] max-w-md w-full p-6 space-y-4" style={{ borderRadius: 4 }}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-lg font-display uppercase tracking-tight text-white">Cancel Appointment</h3>
              </div>
              <button onClick={() => setCancelModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-[color:var(--muted-on-dark)] leading-relaxed font-mono">
              Are you sure you want to cancel the appointment for <strong className="text-white">{(selectedBookingForCancel.attendees[0] || {}).name}</strong> on{" "}
              <strong className="text-white">{formatDateTime(selectedBookingForCancel.startTime)}</strong>? This will permanently cancel the slot on Cal.com.
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
                onClick={() => setCancelModalOpen(false)}
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
          <div className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] max-w-lg w-full p-6 space-y-4" style={{ borderRadius: 4 }}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-[color:var(--ember)]">
                <CalendarCheck className="h-5 w-5" />
                <h3 className="text-lg font-display uppercase tracking-tight text-white">Reschedule Booking</h3>
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
              <p>Patient: <strong className="text-white">{(selectedBookingForReschedule.attendees[0] || {}).name}</strong></p>
              <p>Current: <strong className="text-white">{formatDateTime(selectedBookingForReschedule.startTime)}</strong></p>
            </div>

            {/* Pick Reschedule Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                Select New Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none"
                style={{ borderRadius: 3 }}
              />
            </div>

            {/* Time slot lists */}
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

      {/* MODAL 3: Manual Booking Creation Form */}
      {manualBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] max-w-lg w-full p-6 space-y-4 my-8" style={{ borderRadius: 4 }}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-[color:var(--ember)]">
                <Plus className="h-5 w-5" />
                <h3 className="text-lg font-display uppercase tracking-tight text-white">Manual / Phone Booking</h3>
              </div>
              <button
                onClick={() => {
                  setManualBookingOpen(false);
                  setManualDate("");
                  setSelectedManualSlot(null);
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-4">
              {/* Patient Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Emma Byrne"
                    className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none"
                    style={{ borderRadius: 3 }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                    Patient Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="emma.byrne@gmail.com"
                    className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none"
                    style={{ borderRadius: 3 }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="+353871234567"
                    className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none"
                    style={{ borderRadius: 3 }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                    Treatment Type *
                  </label>
                  <select
                    value={manualService}
                    onChange={(e) => {
                      setManualService(e.target.value);
                      setSelectedManualSlot(null);
                    }}
                    className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none uppercase"
                    style={{ borderRadius: 3 }}
                  >
                    <option value="initial-assessment">Initial Assessment (1h)</option>
                    <option value="sports-rehab">Sports Rehab (45m)</option>
                    <option value="manual-therapy">Manual Therapy (45m)</option>
                    <option value="dry-needling">Dry Needling (45m)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                  Intake Notes
                </label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="E.g., patient complains of lower back stiffness..."
                  rows={2}
                  className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none resize-none uppercase"
                  style={{ borderRadius: 3 }}
                />
              </div>

              {/* Date & Time Picker */}
              <div className="space-y-3 border-t border-white/5 pt-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={manualDate}
                    onChange={(e) => {
                      setManualDate(e.target.value);
                      setSelectedManualSlot(null);
                    }}
                    className="w-full bg-black/45 border border-[color:var(--hairline-dark)] focus:border-[color:var(--ember)] text-white text-xs font-mono p-2.5 outline-none"
                    style={{ borderRadius: 3 }}
                  />
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
                        No standard slots open for this date.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1">
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

              {/* Form Footer Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setManualBookingOpen(false);
                    setManualDate("");
                    setSelectedManualSlot(null);
                  }}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs font-mono uppercase text-[color:var(--muted-on-dark)]"
                  style={{ borderRadius: 3 }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={manualBookingInProgress || !selectedManualSlot}
                  className="px-4 py-2 bg-[color:var(--ember)] hover:bg-[color:var(--ember)]/90 text-[color:var(--ember-foreground)] font-mono text-xs uppercase font-semibold disabled:opacity-50"
                  style={{ borderRadius: 3 }}
                >
                  {manualBookingInProgress ? "Scheduling..." : "Schedule Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
