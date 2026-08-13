import React, { useEffect } from "react";
import { X, Calendar, Clock, User, Mail, Phone, FileText, RefreshCw, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { CalendarEvent } from "@/lib/cal-api";
import { format } from "date-fns";

interface CalendarSlideOverProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (event: CalendarEvent) => void;
  onCancel: (event: CalendarEvent) => void;
}

export function CalendarSlideOver({ event, isOpen, onClose, onReschedule, onCancel }: CalendarSlideOverProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !event) return null;

  const isBooking = event.type === "booking";
  const startDateTime = new Date(event.start);
  const endDateTime = new Date(event.end);

  // Status styling helper
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Completed":
        return "border-green-500 text-green-400 bg-green-500/10";
      case "In Progress":
        return "border-[color:var(--ember)] text-[color:var(--ember)] bg-[color:var(--ember)]/10 animate-pulse";
      case "cancelled":
      case "Cancelled":
        return "border-red-500 text-red-400 bg-red-500/10 line-through";
      default:
        return "border-[color:var(--slate)] text-[color:var(--slate)] bg-[color:var(--slate)]/10";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
        onClick={onClose}
      />

      {/* Drawer Panel Container */}
      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div
          className="w-screen max-w-md md:max-w-lg bg-[color:var(--ink)] border-l border-[color:var(--hairline-dark)] text-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-in-out translate-x-0"
          style={{
            boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[color:var(--hairline-dark)] flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <span className="eyebrow text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase tracking-wider">
                {isBooking ? "Appointment Details" : "Calendar Conflict Block"}
              </span>
              <h2 className="text-xl font-display tracking-tight text-white mt-1 truncate">
                {event.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[color:var(--muted-on-dark)] hover:text-white p-1 hover:bg-white/5 border border-transparent hover:border-[color:var(--hairline-dark)] transition-all"
              style={{ borderRadius: 3 }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status & Sync banner */}
            <div className="flex flex-wrap items-center gap-3 bg-black/40 border border-[color:var(--hairline-dark)] p-4 rounded" style={{ borderRadius: 3 }}>
              {isBooking ? (
                <>
                  <span className={`px-2 py-0.5 text-[10px] font-mono uppercase border ${getStatusBadge(event.status)}`} style={{ borderRadius: 2 }}>
                    {event.status || "upcoming"}
                  </span>
                  <span className="text-[10px] font-mono text-[color:var(--muted-on-dark)] flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    Source: {event.syncSource || "cal.com"}
                  </span>
                </>
              ) : (
                <>
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase border border-amber-500/40 text-amber-400 bg-amber-500/5 flex items-center gap-1" style={{ borderRadius: 2 }}>
                    <AlertTriangle className="h-3 w-3" /> Blocked Time
                  </span>
                  <span className="text-[10px] font-mono text-[color:var(--muted-on-dark)] flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    Sync: {event.syncSource || "google"}
                  </span>
                </>
              )}
            </div>

            {/* Time & Therapist */}
            <div className="space-y-4">
              <h3 className="font-mono text-[10px] uppercase text-[color:var(--muted-on-dark)] tracking-wider border-b border-[color:var(--hairline-dark)] pb-1">
                Schedule Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[color:var(--ember)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-mono text-[color:var(--muted-on-dark)] uppercase">Date</p>
                    <p className="text-sm font-medium mt-0.5">{format(startDateTime, "EEEE, d MMMM yyyy")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[color:var(--ember)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-mono text-[color:var(--muted-on-dark)] uppercase">Time Range</p>
                    <p className="text-sm font-medium mt-0.5">
                      {format(startDateTime, "HH:mm")} - {format(endDateTime, "HH:mm")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:col-span-2">
                  <User className="h-5 w-5 text-[color:var(--slate)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-mono text-[color:var(--muted-on-dark)] uppercase">Assigned Physiotherapist</p>
                    <p className="text-sm font-medium mt-0.5">{event.therapistName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Details (bookings only) */}
            {isBooking && (
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] uppercase text-[color:var(--muted-on-dark)] tracking-wider border-b border-[color:var(--hairline-dark)] pb-1">
                  Patient Contact Info
                </h3>

                <div className="space-y-3">
                  {event.patientName && (
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-[color:var(--muted-on-dark)] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-mono text-[color:var(--muted-on-dark)] uppercase">Full Name</p>
                        <p className="text-sm font-medium">{event.patientName}</p>
                      </div>
                    </div>
                  )}

                  {event.patientEmail && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-[color:var(--muted-on-dark)] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-mono text-[color:var(--muted-on-dark)] uppercase">Email Address</p>
                        <a href={`mailto:${event.patientEmail}`} className="text-sm text-[color:var(--ember)] hover:underline">
                          {event.patientEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {event.patientPhone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-[color:var(--muted-on-dark)] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-mono text-[color:var(--muted-on-dark)] uppercase">Phone Number</p>
                        <a href={`tel:${event.patientPhone}`} className="text-sm text-[color:var(--slate)] hover:underline font-mono">
                          {event.patientPhone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Clinical Notes (bookings only) */}
            {isBooking && event.notes && (
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] uppercase text-[color:var(--muted-on-dark)] tracking-wider border-b border-[color:var(--hairline-dark)] pb-1">
                  Intake Notes / Reason
                </h3>
                <div className="flex items-start gap-3 bg-black/20 border border-[color:var(--hairline-dark)] p-4 rounded" style={{ borderRadius: 3 }}>
                  <FileText className="h-4 w-4 text-[color:var(--muted-on-dark)] shrink-0 mt-0.5" />
                  <p className="text-sm text-[color:var(--muted-on-dark)] leading-relaxed italic">
                    "{event.notes}"
                  </p>
                </div>
              </div>
            )}

            {/* Blocked Slot Info */}
            {!isBooking && (
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] uppercase text-[color:var(--muted-on-dark)] tracking-wider border-b border-[color:var(--hairline-dark)] pb-1">
                  Sync & Availability Conflict Details
                </h3>
                <p className="text-sm text-[color:var(--muted-on-dark)] leading-relaxed">
                  This block is imported from the therapist's external Google Calendar account. The clinic calendar automatically marks this block as unavailable for client self-scheduling.
                </p>
              </div>
            )}
          </div>

          {/* Footer Operations */}
          {isBooking && event.status !== "cancelled" && event.status !== "Cancelled" && (
            <div className="p-6 border-t border-[color:var(--hairline-dark)] bg-black/40 grid grid-cols-2 gap-4">
              <button
                onClick={() => onReschedule(event)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-[color:var(--hairline-dark)] hover:border-white/20 text-white font-mono text-xs uppercase transition-colors"
                style={{ borderRadius: 3 }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reschedule
              </button>
              <button
                onClick={() => onCancel(event)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 font-mono text-xs uppercase transition-colors"
                style={{ borderRadius: 3 }}
              >
                <X className="h-3.5 w-3.5" />
                Cancel Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
