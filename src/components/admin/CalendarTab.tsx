import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  AlertTriangle,
  Clock,
  User
} from "lucide-react";
import { 
  getMasterScheduleEvents, 
  getTherapistSyncStatuses, 
  CalendarEvent, 
  TherapistSyncStatus,
  cancelCalBooking,
  rescheduleCalBooking,
  getCalSlots
} from "@/lib/cal-api";
import { CalendarSlideOver } from "./CalendarSlideOver";
import { 
  format, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth
} from "date-fns";

interface PositionedEvent {
  event: CalendarEvent;
  style: React.CSSProperties;
}

export function CalendarTab() {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Slide-over state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<CalendarEvent | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingInProgress, setCancellingInProgress] = useState(false);

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<CalendarEvent | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<{ time: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reschedulingInProgress, setReschedulingInProgress] = useState(false);

  // Fetch all calendar data
  const fetchData = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();
      
      const fetchedEvents = await getMasterScheduleEvents({
        data: {
          startDate: start,
          endDate: end,
        }
      });

      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
      toast.error("Error updating calendar events from server feeds");
    } finally {
      setLoading(false);
    }
  };

  // Only show real Cal.com bookings — filter out Google Sync blocked slots
  const calBookings = events.filter(e => e.type === "booking" || e.syncSource === "cal.com");

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  // Navigations
  const handlePrev = () => {
    if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Reschedule slots fetcher
  useEffect(() => {
    if (rescheduleDate && bookingToReschedule) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        setSelectedSlot(null);
        try {
          const startDate = new Date(rescheduleDate);
          startDate.setHours(8, 0, 0, 0);
          const endDate = new Date(rescheduleDate);
          endDate.setHours(20, 0, 0, 0);
          
          const slots = await getCalSlots({
            data: {
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              eventTypeId: 6323130
            }
          });
          setRescheduleSlots(slots);
        } catch (e) {
          toast.error("Failed to query availability slots.");
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [rescheduleDate, bookingToReschedule]);

  // Execute cancellation
  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    setCancellingInProgress(true);
    try {
      const result = await cancelCalBooking({
        data: {
          bookingUid: bookingToCancel.id,
          cancellationReason: cancelReason || "Cancelled by administrator"
        }
      });
      if (result.success) {
        toast.success("Appointment successfully cancelled.");
        setCancelModalOpen(false);
        setIsSlideOverOpen(false);
        fetchData();
      } else {
        toast.error("Failed to cancel booking.");
      }
    } catch (e) {
      toast.error("Error cancelling session.");
    } finally {
      setCancellingInProgress(false);
    }
  };

  // Execute rescheduling
  const handleRescheduleBooking = async () => {
    if (!bookingToReschedule || !selectedSlot) return;
    setReschedulingInProgress(true);
    try {
      const result = await rescheduleCalBooking({
        data: {
          bookingUid: bookingToReschedule.id,
          start: selectedSlot,
          reschedulingReason: "Rescheduled by clinic administrator"
        }
      });
      if (result.success) {
        toast.success("Appointment successfully rescheduled.");
        setRescheduleModalOpen(false);
        setIsSlideOverOpen(false);
        fetchData();
      } else {
        toast.error("Failed to reschedule booking.");
      }
    } catch (e) {
      toast.error("Error rescheduling session.");
    } finally {
      setReschedulingInProgress(false);
    }
  };

  // Inline CSS gradient for blocked sync slots, Ember/Orange border/bg for actual bookings
  const getEventStyleOverrides = (evt: CalendarEvent): React.CSSProperties => {
    if (evt.type === "blocked") {
      return {
        backgroundImage: "linear-gradient(45deg, #111 25%, #222 25%, #222 50%, #111 50%, #111 75%, #222 75%, #222 100%)",
        backgroundSize: "20px 20px"
      };
    }
    return {};
  };

  const getEventColorsClass = (evt: CalendarEvent) => {
    if (evt.type === "blocked") {
      return "border-neutral-700 text-neutral-400";
    }
    return "border-[color:var(--ember)] bg-[color:var(--ember)]/10 text-white hover:bg-[color:var(--ember)]/20";
  };

  // Overlap calculation logic for Day/Week absolute columns positioning
  const positionEvents = (dayEvents: CalendarEvent[]): PositionedEvent[] => {
    const sorted = [...dayEvents].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const groups: CalendarEvent[][] = [];
    
    for (const evt of sorted) {
      let placed = false;
      for (const group of groups) {
        const overlaps = group.some(ge => {
          const aStart = new Date(ge.start).getTime();
          const aEnd = new Date(ge.end).getTime();
          const bStart = new Date(evt.start).getTime();
          const bEnd = new Date(evt.end).getTime();
          return bStart < aEnd && aStart < bEnd;
        });
        if (overlaps) {
          group.push(evt);
          placed = true;
          break;
        }
      }
      if (!placed) {
        groups.push([evt]);
      }
    }

    const positioned: PositionedEvent[] = [];
    const hourHeight = 80; // Height of an hour cell in px

    for (const group of groups) {
      const groupCount = group.length;
      group.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      
      group.forEach((evt, index) => {
        const start = new Date(evt.start);
        const end = new Date(evt.end);
        const startHours = start.getHours() + start.getMinutes() / 60;
        const endHours = end.getHours() + end.getMinutes() / 60;
        
        const clampedStart = Math.max(8, Math.min(20, startHours));
        const clampedEnd = Math.max(8, Math.min(20, endHours));
        
        const top = (clampedStart - 8) * hourHeight;
        const height = Math.max(32, (clampedEnd - clampedStart) * hourHeight - 2);
        
        const width = 100 / groupCount;
        const left = index * width;

        positioned.push({
          event: evt,
          style: {
            position: "absolute",
            top: `${top}px`,
            height: `${height}px`,
            left: `${left}%`,
            width: `${width - 1}%`,
          }
        });
      });
    }

    return positioned;
  };

  // 12 working hours (08:00 to 20:00)
  const hoursRange = Array.from({ length: 12 }, (_, i) => i + 8);

  const daysOfWeek = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  return (
    <div className="space-y-6 p-6 md:p-8 font-sans max-w-7xl mx-auto">
      {/* Calendar Header */}
      <div className="border-b border-[color:var(--hairline-dark)] pb-6">
        <span className="eyebrow text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase tracking-wider">
          Clinic Schedules
        </span>
        <h1 className="text-3xl font-display uppercase tracking-tight text-white mt-1">
          Master Calendar
        </h1>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-4 rounded animate-fade-in" style={{ borderRadius: 3 }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-[color:var(--hairline-dark)] bg-black" style={{ borderRadius: 3 }}>
            <button onClick={handlePrev} className="p-2.5 text-[color:var(--muted-on-dark)] hover:text-white border-r border-[color:var(--hairline-dark)] hover:bg-white/5 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={handleToday} className="px-4 py-2 text-xs font-mono uppercase text-white hover:bg-white/5 border-r border-[color:var(--hairline-dark)] transition-colors">
              Today
            </button>
            <button onClick={handleNext} className="p-2.5 text-[color:var(--muted-on-dark)] hover:text-white hover:bg-white/5 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="text-sm font-mono text-white font-medium pl-1 tracking-tight">
            {viewMode === "day" && format(currentDate, "EEEE, MMMM d, yyyy")}
            {viewMode === "week" && (
              <>
                Week of {format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMMM d, yyyy")}
              </>
            )}
            {viewMode === "month" && format(currentDate, "MMMM yyyy")}
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex border border-[color:var(--hairline-dark)] bg-black" style={{ borderRadius: 3 }}>
          {(["day", "week", "month"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-xs font-mono uppercase transition-all ${
                viewMode === mode 
                  ? "bg-[color:var(--ember)] text-white" 
                  : "text-[color:var(--muted-on-dark)] hover:text-white hover:bg-white/5"
              } ${mode !== "month" ? "border-r border-[color:var(--hairline-dark)]" : ""}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calendar View Area */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] rounded animate-pulse" style={{ borderRadius: 3 }}>
          <RefreshCw className="h-8 w-8 animate-spin text-[color:var(--ember)] mb-3" />
          <span className="font-mono text-xs uppercase text-[color:var(--muted-on-dark)] tracking-wider">
            Syncing calendar feeds...
          </span>
        </div>
      ) : (
        <div className="bg-black border border-[color:var(--hairline-dark)] overflow-hidden shadow-xl" style={{ borderRadius: 3 }}>
          
          {/* 1. DAY VIEW - Google Calendar Style */}
          {viewMode === "day" && (
            <div className="flex flex-col">
              {/* Day Header */}
              <div className="flex border-b border-[color:var(--hairline-dark)] bg-[color:var(--ink)]">
                <div className="w-16 shrink-0 border-r border-[color:var(--hairline-dark)]" />
                <div className="flex-1 p-4 pl-6">
                  <span className="font-mono text-[10px] uppercase text-[color:var(--muted-on-dark)] block">Selected Day</span>
                  <h2 className="text-xl font-display text-white mt-1 font-semibold uppercase tracking-tight">
                    {format(currentDate, "EEEE, MMMM d, yyyy")}
                  </h2>
                </div>
              </div>

              {/* Day Body */}
              <div className="flex relative">
                {/* Hours Y-Axis (aligned vertically with absolute top) */}
                {/* Hour 8 is NOT translated (it sits at top:0), later hours are centered on their grid line */}
                <div className="w-16 shrink-0 relative select-none border-r border-[color:var(--hairline-dark)] h-[960px] bg-black">
                  {hoursRange.map((hour) => {
                    const topPosition = (hour - 8) * 80;
                    const isFirst = hour === 8;
                    return (
                      <div 
                        key={hour} 
                        className={`absolute w-full pr-3 text-right font-mono text-[10px] text-[color:var(--muted-on-dark)] ${isFirst ? "" : "-translate-y-1/2"}`}
                        style={{ top: `${topPosition + (isFirst ? 4 : 0)}px` }}
                      >
                        {`${hour.toString().padStart(2, "0")}:00`}
                      </div>
                    );
                  })}
                </div>

                {/* Day Column Events Container */}
                <div className="flex-1 relative h-[960px]">
                  {/* Grid lines rendered as individually positioned elements at z-0 */}
                  {hoursRange.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-[color:var(--hairline-dark)] pointer-events-none"
                      style={{ top: `${(hour - 8) * 80}px`, zIndex: 0 }}
                    />
                  ))}

                  {/* Absolute Positioned Events - z-10 always above grid lines */}
                  {(() => {
                    const dayEvents = calBookings.filter(e => isSameDay(new Date(e.start), currentDate));
                    const positioned = positionEvents(dayEvents);

                    return positioned.map(({ event: evt, style }) => (
                      <button
                        key={evt.id}
                        onClick={() => {
                          setSelectedEvent(evt);
                          setIsSlideOverOpen(true);
                        }}
                        style={{
                          ...style,
                          ...getEventStyleOverrides(evt),
                          left: `calc(${style.left} + 6px)`,
                          width: `calc(${style.width} - 12px)`,
                          borderRadius: 4,
                          zIndex: 10
                        }}
                        className={`absolute p-3 border text-left flex flex-col justify-between overflow-hidden transition-all hover:brightness-110 active:scale-[0.98] ${getEventColorsClass(evt)}`}
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-semibold tracking-tight block leading-tight truncate">{evt.title}</span>
                          <span className="text-[10px] font-mono text-white/70 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(evt.start), "HH:mm")} - {format(new Date(evt.end), "HH:mm")}
                          </span>
                        </div>
                        {evt.type !== "blocked" && (
                          <span className="text-[9px] font-mono uppercase bg-black/25 px-2 py-0.5 rounded text-white/95 self-start">
                            {evt.therapistName}
                          </span>
                        )}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* 2. WEEK VIEW - Google Calendar Grid UI Style */}
          {viewMode === "week" && (
            <div className="flex flex-col overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Week Header Row */}
                <div className="flex border-b border-[color:var(--hairline-dark)] bg-[color:var(--ink)]">
                  <div className="w-16 shrink-0 border-r border-[color:var(--hairline-dark)]" />
                  <div className="flex-1 grid grid-cols-7 divide-x divide-[color:var(--hairline-dark)]">
                    {daysOfWeek.map((day, idx) => {
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div key={idx} className={`p-3 text-center ${isToday ? "bg-[color:var(--ember)]/5" : ""}`}>
                          <p className="font-mono text-[10px] uppercase text-[color:var(--muted-on-dark)]">
                            {format(day, "eee")}
                          </p>
                          <p className={`text-base font-display mt-0.5 ${isToday ? "text-[color:var(--ember)] font-semibold" : "text-white"}`}>
                            {format(day, "d")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Week Grid Body */}
                <div className="flex relative">
                  {/* Hours Y-Axis */}
                  <div className="w-16 shrink-0 relative select-none border-r border-[color:var(--hairline-dark)] h-[960px] bg-black">
                    {hoursRange.map((hour) => {
                      const topPosition = (hour - 8) * 80;
                      const isFirst = hour === 8;
                      return (
                        <div 
                          key={hour} 
                          className={`absolute w-full pr-3 text-right font-mono text-[10px] text-[color:var(--muted-on-dark)] ${isFirst ? "" : "-translate-y-1/2"}`}
                          style={{ top: `${topPosition + (isFirst ? 4 : 0)}px` }}
                        >
                          {`${hour.toString().padStart(2, "0")}:00`}
                        </div>
                      );
                    })}
                  </div>

                  {/* Day Columns */}
                  <div className="flex-1 grid grid-cols-7 divide-x divide-[color:var(--hairline-dark)] relative">
                    {/* Grid lines rendered as individually positioned elements at z-0, always below events */}
                    {hoursRange.map((hour) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-[color:var(--hairline-dark)] pointer-events-none"
                        style={{ top: `${(hour - 8) * 80}px`, zIndex: 0 }}
                      />
                    ))}

                    {/* Columns mapping absolute positioned events */}
                    {daysOfWeek.map((day, dIdx) => {
                      const dayEvents = calBookings.filter(e => isSameDay(new Date(e.start), day));
                      const positioned = positionEvents(dayEvents);
                      const isToday = isSameDay(day, new Date());

                      return (
                        <div 
                          key={dIdx} 
                          className={`relative h-[960px] hover:bg-white/[0.005] transition-colors ${isToday ? "bg-white/[0.01]" : ""}`}
                        >
                          {positioned.map(({ event: evt, style }) => (
                            <button
                              key={evt.id}
                              onClick={() => {
                                setSelectedEvent(evt);
                                setIsSlideOverOpen(true);
                              }}
                              style={{
                                ...style,
                                ...getEventStyleOverrides(evt),
                                left: `calc(${style.left} + 4px)`,
                                width: `calc(${style.width} - 8px)`,
                                borderRadius: 4,
                                zIndex: 10
                              }}
                              className={`absolute p-2 border text-left flex flex-col justify-between overflow-hidden transition-all hover:brightness-110 active:scale-[0.98] ${getEventColorsClass(evt)}`}
                            >
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-semibold leading-tight block truncate">
                                  {evt.title}
                                </span>
                                <span className="text-[8px] font-mono text-white/70 block">
                                  {format(new Date(evt.start), "HH:mm")}
                                </span>
                              </div>
                              {evt.type !== "blocked" && (
                                <span className="text-[8px] font-mono uppercase bg-black/20 px-1 py-0.5 rounded text-white/80 self-start truncate max-w-full">
                                  {evt.therapistName}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. MONTH VIEW - Full Width Grid Calendar displaying inline bookings */}
          {viewMode === "month" && (
            <div className="flex flex-col w-full bg-black">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-[color:var(--hairline-dark)] bg-[color:var(--ink)]">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
                  <div key={idx} className="p-3 text-center border-r border-[color:var(--hairline-dark)] last:border-r-0 font-mono text-[10px] uppercase text-[color:var(--muted-on-dark)]">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar cell mapping — wrap in border-t border-l so every cell just adds border-r border-b for a perfect full grid */}
              <div className="grid grid-cols-7 bg-black border-t border-l border-[color:var(--hairline-dark)]">
                {(() => {
                  const monthStart = startOfMonth(currentDate);
                  const monthEnd = endOfMonth(monthStart);
                  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                  const days = eachDayOfInterval({ start: startDate, end: endDate });

                  return days.map((day, dayIdx) => {
                    const dayEvents = calBookings.filter(e => isSameDay(new Date(e.start), day));
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());
                    const overflowCount = dayEvents.length - 3;

                    return (
                      <div
                        key={dayIdx}
                        onClick={() => setCurrentDate(day)}
                        className={`min-h-[120px] p-2 border-r border-b border-[color:var(--hairline-dark)] flex flex-col gap-1 transition-all text-left cursor-pointer ${
                          isCurrentMonth ? "bg-black" : "bg-[#0a0a0a]"
                        } ${isSameDay(day, currentDate) ? "ring-1 ring-inset ring-[color:var(--ember)]" : "hover:bg-white/[0.015]"}`}
                      >
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium self-start ${
                          isToday ? "bg-[color:var(--ember)] text-white font-bold" : isCurrentMonth ? "text-[color:var(--muted-on-dark)]" : "text-[color:var(--muted-on-dark)]/30"
                        }`}>
                          {format(day, "d")}
                        </span>

                        {/* Inline Booking Items */}
                        <div className="flex-1 space-y-1 mt-1 overflow-hidden">
                          {dayEvents.slice(0, 3).map((evt) => {
                            const isBlocked = evt.type === "blocked";
                            return (
                              <button
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(evt);
                                  setIsSlideOverOpen(true);
                                }}
                                style={{
                                  ...getEventStyleOverrides(evt),
                                  borderRadius: 2
                                }}
                                className={`w-full p-1 border text-left text-[9px] font-mono leading-tight truncate cursor-pointer transition-all ${getEventColorsClass(evt)}`}
                                title={evt.title}
                              >
                                {isBlocked ? "Blocked" : evt.patientName || evt.title}
                              </button>
                            );
                          })}
                          {/* Clicking "+N more" switches to day view to see all sessions */}
                          {overflowCount > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentDate(day);
                                setViewMode("day");
                              }}
                              className="text-[8px] text-[color:var(--ember)] font-mono hover:underline text-left w-full pl-1"
                            >
                              +{overflowCount} more session{overflowCount > 1 ? "s" : ""}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Slide-over Patient Drawer */}
      <CalendarSlideOver
        event={selectedEvent}
        isOpen={isSlideOverOpen}
        onClose={() => {
          setIsSlideOverOpen(false);
          setSelectedEvent(null);
        }}
        onCancel={(evt) => {
          setBookingToCancel(evt);
          setCancelReason("");
          setCancelModalOpen(true);
        }}
        onReschedule={(evt) => {
          setBookingToReschedule(evt);
          setRescheduleDate("");
          setRescheduleSlots([]);
          setSelectedSlot(null);
          setRescheduleModalOpen(true);
        }}
      />

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCancelModalOpen(false)} />
          
          <div className="relative bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] max-w-md w-full p-6 text-white shadow-2xl animate-scale-in" style={{ borderRadius: 3 }}>
            <h3 className="text-lg font-display uppercase tracking-tight text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Booking Session
            </h3>
            
            <p className="text-xs text-[color:var(--muted-on-dark)] mt-2 leading-relaxed">
              Are you sure you want to cancel the appointment for <strong className="text-white">{bookingToCancel?.patientName}</strong>? This action will sync back to Cal.com and notify the client.
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)]">Cancellation Reason</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Client requested cancellation..."
                className="w-full bg-black border border-[color:var(--hairline-dark)] text-white text-xs p-3 focus:outline-none focus:border-[color:var(--hairline-dark-strong)] min-h-[80px]"
                style={{ borderRadius: 3 }}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 border border-[color:var(--hairline-dark)] text-white hover:bg-white/5 uppercase transition-colors"
                style={{ borderRadius: 3 }}
              >
                No, Keep
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancellingInProgress}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white uppercase flex items-center gap-2 transition-colors"
                style={{ borderRadius: 3 }}
              >
                {cancellingInProgress && <RefreshCw className="h-3 w-3 animate-spin" />}
                Yes, Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setRescheduleModalOpen(false)} />
          
          <div className="relative bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] max-w-md w-full p-6 text-white shadow-2xl animate-scale-in" style={{ borderRadius: 3 }}>
            <h3 className="text-lg font-display uppercase tracking-tight text-white flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-[color:var(--ember)]" />
              Reschedule Session
            </h3>

            <p className="text-xs text-[color:var(--muted-on-dark)] mt-2 leading-relaxed">
              Select a new date and available slot to reschedule the appointment for <strong className="text-white">{bookingToReschedule?.patientName}</strong>.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] block mb-1.5">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-black border border-[color:var(--hairline-dark)] text-white text-xs p-2.5 focus:outline-none focus:border-[color:var(--hairline-dark-strong)] font-mono"
                  style={{ borderRadius: 3 }}
                />
              </div>

              {rescheduleDate && (
                <div>
                  <label className="text-[10px] font-mono uppercase text-[color:var(--muted-on-dark)] block mb-1.5">
                    Available Slots
                  </label>
                  
                  {loadingSlots ? (
                    <div className="flex items-center gap-2 py-4 justify-center text-xs font-mono text-[color:var(--muted-on-dark)]">
                      <RefreshCw className="h-4 w-4 animate-spin text-[color:var(--ember)]" /> Querying slots...
                    </div>
                  ) : rescheduleSlots.length === 0 ? (
                    <div className="text-center py-4 text-xs font-mono text-red-400 bg-red-950/20 border border-red-950/40 rounded p-2">
                      No availability slots found for this date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                      {rescheduleSlots.map((slot) => {
                        const parsed = new Date(slot.time);
                        const isSelected = selectedSlot === slot.time;
                        return (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedSlot(slot.time)}
                            className={`p-2 border font-mono text-[10px] text-center transition-colors ${
                              isSelected 
                                ? "bg-[color:var(--ember)] border-[color:var(--ember)] text-white" 
                                : "bg-black border-[color:var(--hairline-dark)] hover:border-white/20 text-white"
                            }`}
                            style={{ borderRadius: 2 }}
                          >
                            {format(parsed, "HH:mm")}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 border border-[color:var(--hairline-dark)] text-white hover:bg-white/5 uppercase transition-colors"
                style={{ borderRadius: 3 }}
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleBooking}
                disabled={reschedulingInProgress || !selectedSlot}
                className="px-4 py-2 bg-[color:var(--ember)] hover:bg-[color:var(--ember-hover)] text-white uppercase flex items-center gap-2 disabled:opacity-40 transition-colors"
                style={{ borderRadius: 3 }}
              >
                {reschedulingInProgress && <RefreshCw className="h-3 w-3 animate-spin" />}
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
