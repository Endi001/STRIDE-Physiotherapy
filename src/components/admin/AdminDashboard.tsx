import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarCheck,
  Users,
  Euro,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getCalBookingsList, CalBooking } from "@/lib/cal-api";

// ── Colour palette for treatment donut ──────────────────────────────────────
const TREATMENT_COLORS = [
  "#e8622a", // ember – Initial Assessment
  "#4a7c9e", // slate-clinical – Physio / Sports Rehab
  "#6b8e6b", // sage – Manual Therapy
  "#9b7cb6", // lavender – Dry Needling
  "#c4a052", // gold – Hydrotherapy / Other
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildBookingGrowthData(bookings: CalBooking[]) {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const prevWeekStart = new Date(thisWeekStart);
  prevWeekStart.setDate(thisWeekStart.getDate() - 7);
  const thisWeek = Array(7).fill(0);
  const prevWeek = Array(7).fill(0);
  const msDay = 86_400_000;
  bookings.forEach((b) => {
    const d = new Date(b.startTime);
    const diffThis = d.getTime() - thisWeekStart.getTime();
    const diffPrev = d.getTime() - prevWeekStart.getTime();
    if (diffThis >= 0 && diffThis < 7 * msDay) thisWeek[d.getDay()]++;
    else if (diffPrev >= 0 && diffPrev < 7 * msDay) prevWeek[d.getDay()]++;
  });
  return DAY_LABELS.map((date, i) => ({ date, bookings: thisWeek[i], previousPeriodBookings: prevWeek[i] }));
}

function buildPeakHoursData(bookings: CalBooking[]) {
  const slots: Record<string, number> = {};
  for (let h = 8; h <= 18; h++) slots[`${h.toString().padStart(2, "0")}:00`] = 0;
  bookings.forEach((b) => {
    const h = new Date(b.startTime).getHours();
    const key = `${h.toString().padStart(2, "0")}:00`;
    if (key in slots) slots[key]++;
  });
  const values = Object.values(slots);
  const max = Math.max(...values, 1);
  return Object.entries(slots).map(([hour, count]) => ({ hour, bookings: count, capacityPercent: Math.round((count / max) * 100) }));
}

function getReasonsForVisit(b: CalBooking): string[] {
  const reasonsRaw = b.responses?.["Reason-for-visit"];
  if (reasonsRaw) {
    if (Array.isArray(reasonsRaw)) return reasonsRaw;
    if (typeof reasonsRaw === "string" && reasonsRaw) return [reasonsRaw];
  }
  
  // Try to infer from notes/title
  const textToScan = `${b.title} ${b.description || ""} ${b.responses?.notes || ""}`.toLowerCase();
  const inferred: string[] = [];
  
  if (textToScan.includes("back") || textToScan.includes("lumbar") || textToScan.includes("sciatica") || textToScan.includes("spine")) {
    inferred.push("Back pain");
  }
  if (textToScan.includes("neck") || textToScan.includes("cervical") || textToScan.includes("whiplash")) {
    inferred.push("Neck pain");
  }
  if (textToScan.includes("joint") || textToScan.includes("shoulder") || textToScan.includes("knee") || textToScan.includes("elbow") || textToScan.includes("ankle") || textToScan.includes("hip") || textToScan.includes("wrist")) {
    inferred.push("Joint pain");
  }
  if (textToScan.includes("muscle") || textToScan.includes("strain") || textToScan.includes("spasm") || textToScan.includes("quad") || textToScan.includes("hamstring") || textToScan.includes("calf")) {
    inferred.push("Muscle pain");
  }
  if (textToScan.includes("post-op") || textToScan.includes("surgery") || textToScan.includes("rehab") || textToScan.includes("rehabilitation") || textToScan.includes("post-operative")) {
    inferred.push("Post-operative rehabilitation");
  }
  if (textToScan.includes("injury") || textToScan.includes("sprain") || textToScan.includes("tear") || textToScan.includes("fracture") || textToScan.includes("accident")) {
    inferred.push("Injury recovery");
  }
  if (textToScan.includes("mobility") || textToScan.includes("stiff") || textToScan.includes("range of motion") || textToScan.includes("gait") || textToScan.includes("flexibility")) {
    inferred.push("Mobility problems");
  }
  if (textToScan.includes("chronic") || textToScan.includes("persistent") || textToScan.includes("long-term")) {
    inferred.push("Chronic pain");
  }
  if (textToScan.includes("sports") || textToScan.includes("running") || textToScan.includes("athletic") || textToScan.includes("football") || textToScan.includes("soccer") || textToScan.includes("tennis")) {
    inferred.push("Sports injuries");
  }
  
  if (inferred.length > 0) return inferred;
  return ["Unspecified"];
}

function buildTreatmentData(bookings: CalBooking[]) {
  const counts: Record<string, number> = {};
  bookings.forEach((b) => {
    const reasons = getReasonsForVisit(b);
    reasons.forEach((r) => {
      counts[r] = (counts[r] || 0) + 1;
    });
  });
  const total = Object.values(counts).reduce((a, c) => a + c, 0) || 1;
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count], i) => ({
      name,
      value: Math.round((count / total) * 100),
      color: TREATMENT_COLORS[i % TREATMENT_COLORS.length]
    }));
}

function buildTodaySnapshot(bookings: CalBooking[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return bookings
    .filter((b) => { const d = new Date(b.startTime); return d >= today && d < tomorrow; })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 8)
    .map((b) => {
      const start = new Date(b.startTime);
      const hh = start.getHours().toString().padStart(2, "0");
      const mm = start.getMinutes().toString().padStart(2, "0");
      const patientName = b.attendees[0]?.name || "Unknown Patient";
      const service = b.eventType?.title || b.title || "Session";
      let status: "Confirmed" | "In Progress" | "Completed" | "Cancelled" = "Confirmed";
      if (b.status === "cancelled") status = "Cancelled";
      else if (b.status === "past") status = "Completed";
      else if (start <= new Date() && new Date() < new Date(b.endTime)) status = "In Progress";
      return { id: b.uid, time: `${hh}:${mm}`, patientName, service, status };
    });
}

interface AdminDashboardProps {
  userEmail: string;
}

export function AdminDashboard({ userEmail }: AdminDashboardProps) {
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const [upcoming, past, cancelled] = await Promise.all([
        getCalBookingsList({ data: { status: "upcoming" } }),
        getCalBookingsList({ data: { status: "past" } }),
        getCalBookingsList({ data: { status: "cancelled" } }),
      ]);
      setBookings([...upcoming, ...past, ...cancelled]);
      setLastFetched(new Date());
    } catch (err) {
      console.error("[AdminDashboard] Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const { kpi, growthData, peakHours, treatmentData, todaySnapshot } = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const thisWeekBookings = bookings.filter(b => new Date(b.startTime) >= startOfWeek && new Date(b.startTime) <= now);
    const thisMonthBookings = bookings.filter(b => new Date(b.startTime) >= startOfMonth);
    const lastMonthBookings = bookings.filter(b => new Date(b.startTime) >= startOfLastMonth && new Date(b.startTime) <= endOfLastMonth);

    const completedCount = bookings.filter(b => b.status === "past").length;
    const cancelledCount = bookings.filter(b => b.status === "cancelled").length;
    const upcomingCount = bookings.filter(b => b.status === "upcoming").length;
    const totalBooked = completedCount + cancelledCount + upcomingCount || 1;
    const completionRate = Math.round((completedCount / totalBooked) * 100 * 10) / 10;
    const momGrowth = lastMonthBookings.length > 0
      ? (((thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100).toFixed(1)
      : null;
    const AVG_SESSION_RATE = 60;
    const monthRevenue = completedCount * AVG_SESSION_RATE;
    const projectedIncome = Math.round((completedCount + upcomingCount) * AVG_SESSION_RATE);
    const revenueGoal = 10_000;
    const revenueProgress = Math.min(100, Math.round((monthRevenue / revenueGoal) * 100));

    return {
      kpi: { thisWeekCount: thisWeekBookings.length, thisMonthCount: thisMonthBookings.length, momGrowth, completedCount, cancelledCount, upcomingCount, completionRate, monthRevenue, projectedIncome, revenueGoal, revenueProgress },
      growthData: buildBookingGrowthData(bookings),
      peakHours: buildPeakHoursData(bookings),
      treatmentData: buildTreatmentData(bookings),
      todaySnapshot: buildTodaySnapshot(bookings),
    };
  }, [bookings]);

  const activePieLabel = hoveredPieIndex !== null ? treatmentData[hoveredPieIndex]?.name : "Total";
  const activePieVal = hoveredPieIndex !== null ? `${treatmentData[hoveredPieIndex]?.value}%` : `${treatmentData.reduce((a, d) => a + d.value, 0)}%`;

  type SnapStatus = "Confirmed" | "In Progress" | "Completed" | "Cancelled";
  const getStatusStyle = (status: SnapStatus) => {
    switch (status) {
      case "Completed": return "border-emerald-500/20 text-emerald-400 bg-emerald-500/5";
      case "In Progress": return "border-[color:var(--ember)]/20 text-[color:var(--ember)] bg-[color:var(--ember)]/5 animate-pulse";
      case "Confirmed": return "border-[color:var(--slate-clinical)]/30 text-[color:var(--slate-clinical)] bg-[color:var(--slate-clinical)]/5";
      case "Cancelled": return "border-rose-500/20 text-rose-400 bg-rose-500/5 line-through";
      default: return "border-neutral-500/20 text-neutral-400 bg-neutral-500/5";
    }
  };
  const getStatusIcon = (status: SnapStatus) => {
    switch (status) {
      case "Completed": return <CheckCircle2 className="h-3 w-3 mr-1 shrink-0" />;
      case "In Progress": return <Play className="h-3 w-3 mr-1 shrink-0" />;
      case "Confirmed": return <Clock className="h-3 w-3 mr-1 shrink-0" />;
      case "Cancelled": return <XCircle className="h-3 w-3 mr-1 shrink-0" />;
    }
  };

  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-3 shadow-xl font-mono text-[11px] text-white">
          <p className="border-b border-white/10 pb-1 mb-1.5 font-bold uppercase tracking-wider text-[color:var(--muted-on-dark)]">{label}</p>
          <p className="flex justify-between items-center gap-6"><span>This Week:</span><span className="text-[color:var(--ember)] font-bold">{payload[0].value}</span></p>
          {payload[1] && <p className="flex justify-between items-center gap-6 mt-0.5 text-neutral-400"><span>Prev Week:</span><span className="font-bold">{payload[1].value}</span></p>}
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-3 shadow-xl font-mono text-[11px] text-white">
          <p className="border-b border-white/10 pb-1 mb-1.5 font-bold tracking-wider text-[color:var(--muted-on-dark)]">Slot: {label}</p>
          <p className="flex justify-between items-center gap-6"><span>Bookings:</span><span className="text-white font-bold">{data.bookings}</span></p>
          <p className="flex justify-between items-center gap-6 mt-0.5"><span>Capacity:</span><span className={data.capacityPercent >= 80 ? "text-[color:var(--ember)] font-bold" : "text-[color:var(--slate-clinical)] font-bold"}>{data.capacityPercent}%</span></p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6 md:p-8 bg-black text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display tracking-tight text-white mb-2 uppercase">Overview &amp; Analytics</h1>
            <p className="text-xs text-[color:var(--muted-on-dark)] font-mono uppercase tracking-wider">Welcome back, {userEmail} · Loading live data…</p>
          </div>
          <RefreshCw className="h-5 w-5 text-[color:var(--ember)] animate-spin" />
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] animate-pulse" style={{ borderRadius: 4 }} />)}
        </div>
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          {[1,2,3,4].map(i => (
            <div key={i} className={`h-80 bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] animate-pulse ${i <= 2 ? "xl:col-span-2" : "xl:col-span-1"}`} style={{ borderRadius: 4 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-8 bg-black text-white">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display tracking-tight text-white mb-2 uppercase">Overview &amp; Analytics</h1>
          <p className="text-xs text-[color:var(--muted-on-dark)] font-mono uppercase tracking-wider">
            Welcome back, {userEmail} · {bookings.length} bookings loaded
            {lastFetched && <span className="ml-2 text-emerald-500/70">· Updated {lastFetched.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-white/20 bg-black/20 hover:bg-black/40 text-[10px] font-mono uppercase tracking-wider text-[color:var(--muted-on-dark)] hover:text-white transition-colors"
          style={{ borderRadius: 3 }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* KPI 1: Total Bookings */}
        <Card className="bg-[color:var(--ink)] border-[color:var(--hairline-dark)] text-white" style={{ borderRadius: 4 }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-[color:var(--muted-on-dark)]">Total Bookings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-[color:var(--ember)]" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-3xl font-display font-bold">{kpi.thisWeekCount}</div>
              <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase tracking-wider mt-0.5">This Week</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <span className="text-lg font-display font-semibold">{kpi.thisMonthCount}</span>
                <span className="text-[9px] font-mono text-[color:var(--muted-on-dark)] uppercase ml-1">This Month</span>
              </div>
              {kpi.momGrowth !== null ? (
                <div className={`flex items-center border px-2 py-0.5 text-[10px] font-mono ${parseFloat(kpi.momGrowth) >= 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`} style={{ borderRadius: 2 }}>
                  {parseFloat(kpi.momGrowth) >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {kpi.momGrowth}%
                </div>
              ) : (
                <div className="flex items-center bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 px-2 py-0.5 text-[10px] font-mono" style={{ borderRadius: 2 }}>
                  <TrendingUp className="h-3 w-3 mr-0.5" />New
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Session Completion Rate */}
        <Card className="bg-[color:var(--ink)] border-[color:var(--hairline-dark)] text-white" style={{ borderRadius: 4 }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-[color:var(--muted-on-dark)]">Session Completion Rate</CardTitle>
            <Users className="h-4 w-4 text-[color:var(--slate-clinical)]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-display font-bold">{kpi.completionRate}%</div>
              <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase tracking-wider mt-0.5">{kpi.completedCount + kpi.cancelledCount + kpi.upcomingCount} Total Slots Booked</p>
            </div>
            <div className="h-2 w-full flex bg-neutral-800 overflow-hidden" style={{ borderRadius: 2 }}>
              <div className="h-full bg-emerald-500" style={{ width: `${kpi.completionRate}%` }} />
              <div className="h-full bg-amber-500" style={{ width: `${Math.round((kpi.cancelledCount / (kpi.completedCount + kpi.cancelledCount + kpi.upcomingCount || 1)) * 100)}%` }} />
              <div className="h-full bg-[color:var(--slate-clinical)]" style={{ width: `${Math.round((kpi.upcomingCount / (kpi.completedCount + kpi.cancelledCount + kpi.upcomingCount || 1)) * 100)}%` }} />
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono uppercase text-[color:var(--muted-on-dark)] tracking-wider">
              <span className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 mr-1 rounded-full" />{kpi.completedCount} Done</span>
              <span className="flex items-center"><span className="w-1.5 h-1.5 bg-amber-500 mr-1 rounded-full" />{kpi.cancelledCount} Cancel</span>
              <span className="flex items-center"><span className="w-1.5 h-1.5 bg-[color:var(--slate-clinical)] mr-1 rounded-full" />{kpi.upcomingCount} Upcoming</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Revenue */}
        <Card className="bg-[color:var(--ink)] border-[color:var(--hairline-dark)] text-white" style={{ borderRadius: 4 }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-[color:var(--muted-on-dark)]">Revenue &amp; Targets</CardTitle>
            <Euro className="h-4 w-4 text-[color:var(--ember)]" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-3xl font-display font-bold">€{kpi.monthRevenue.toLocaleString()}</div>
              <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase tracking-wider mt-0.5">Current Month Revenue (est.)</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-mono text-[color:var(--muted-on-dark)]">
                <span>Goal: €{kpi.revenueGoal.toLocaleString()}</span>
                <span>{kpi.revenueProgress}%</span>
              </div>
              <div className="h-1 w-full bg-neutral-800 overflow-hidden" style={{ borderRadius: 1 }}>
                <div className="h-full bg-[color:var(--ember)]" style={{ width: `${kpi.revenueProgress}%` }} />
              </div>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-white/5 text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase">
              <span>Projected Income</span>
              <span className="text-white font-bold">€{kpi.projectedIncome.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        {/* Booking Growth Area Chart */}
        <div className="xl:col-span-2 bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-6 flex flex-col justify-between" style={{ borderRadius: 4 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-display tracking-tight text-white uppercase">Booking Volume Trends</h2>
              <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase tracking-wider mt-0.5">Daily volume comparing current vs. previous week</p>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-[color:var(--ember)] inline-block" /><span className="text-white">Current Week</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-neutral-500 inline-block" /><span className="text-[color:var(--muted-on-dark)]">Prev Week</span></div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--ember)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--ember)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#3a3632" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#6f6d67" fontSize={10} fontFamily="IBM Plex Mono" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#6f6d67" fontSize={10} fontFamily="IBM Plex Mono" tickLine={false} axisLine={false} dx={-5} allowDecimals={false} />
                <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: "#3a3632", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="bookings" stroke="var(--ember)" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
                <Area type="monotone" dataKey="previousPeriodBookings" stroke="#6f6d67" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Treatment Distribution Donut */}
        <div className="xl:col-span-1 bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-6 flex flex-col justify-between" style={{ borderRadius: 4 }}>
          <div>
            <h2 className="text-lg font-display tracking-tight text-white uppercase mb-1">Reasons for Visit</h2>
            <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase tracking-wider mb-6">Distribution of client symptoms & reasons for booking</p>
          </div>
          {treatmentData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-[color:var(--muted-on-dark)] font-mono text-[10px] uppercase tracking-wider">
              <AlertCircle className="h-8 w-8 mb-2 opacity-30" />No symptoms data yet
            </div>
          ) : (
            <div className="relative flex justify-center items-center h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={treatmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={76} paddingAngle={3} dataKey="value" onMouseEnter={(_, index) => setHoveredPieIndex(index)} onMouseLeave={() => setHoveredPieIndex(null)}>
                    {treatmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: "none", cursor: "pointer", filter: hoveredPieIndex === index ? "brightness(1.1)" : "none", transition: "all 0.2s ease-in-out" }} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[color:var(--muted-on-dark)] max-w-[110px] text-center truncate">{activePieLabel}</span>
                <span className="text-3xl font-display font-bold mt-1 text-white">{activePieVal}</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
            {treatmentData.map((item, index) => (
              <div key={item.name} className={`flex items-center gap-2 p-1.5 transition-colors ${hoveredPieIndex === index ? "bg-white/5" : ""}`} style={{ borderRadius: 2 }} onMouseEnter={() => setHoveredPieIndex(index)} onMouseLeave={() => setHoveredPieIndex(null)}>
                <span className="w-2 h-2 shrink-0" style={{ backgroundColor: item.color, borderRadius: 1 }} />
                <div className="truncate">
                  <p className="text-[10px] font-mono uppercase text-white truncate">{item.name}</p>
                  <p className="text-[9px] font-mono text-[color:var(--muted-on-dark)]">{item.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours Bar Chart */}
        <div className="xl:col-span-2 bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-6 flex flex-col justify-between" style={{ borderRadius: 4 }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg font-display tracking-tight text-white uppercase">Peak Booking Intervals</h2>
              <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase tracking-wider mt-0.5">Hourly activity rate with heat threshold mapping</p>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-wider">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[color:var(--ember)] rounded-full" /><span>Peak (≥80%)</span></span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[color:var(--slate-clinical)] rounded-full" /><span>Standard</span></span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#3a3632" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke="#6f6d67" fontSize={10} fontFamily="IBM Plex Mono" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#6f6d67" fontSize={10} fontFamily="IBM Plex Mono" tickLine={false} axisLine={false} dx={-5} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="bookings" radius={[2, 2, 0, 0]}>
                  {peakHours.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.capacityPercent >= 80 ? "var(--ember)" : "var(--slate-clinical)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Schedule Snapshot */}
        <div className="xl:col-span-1 bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-6 flex flex-col" style={{ borderRadius: 4 }}>
          <div className="mb-4">
            <h2 className="text-lg font-display tracking-tight text-white uppercase mb-1">Today's Schedule</h2>
            <p className="text-[10px] font-mono text-[color:var(--muted-on-dark)] uppercase tracking-wider">
              {todaySnapshot.length > 0 ? `${todaySnapshot.length} session${todaySnapshot.length !== 1 ? "s" : ""} today` : "No sessions booked for today"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin min-h-0 max-h-72">
            {todaySnapshot.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-[color:var(--muted-on-dark)] font-mono text-[10px] uppercase tracking-wider">
                <CalendarCheck className="h-8 w-8 mb-2 opacity-30" />No sessions today
              </div>
            ) : (
              todaySnapshot.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-black/35 border border-[color:var(--hairline-dark)] hover:border-[color:var(--hairline-dark-strong)] transition-colors gap-3" style={{ borderRadius: 3 }}>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white font-semibold">{apt.time}</span>
                      <span className={`flex items-center border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${getStatusStyle(apt.status)}`} style={{ borderRadius: 2 }}>
                        {getStatusIcon(apt.status)}{apt.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white truncate">{apt.patientName}</h4>
                      <p className="text-[9px] font-mono text-[color:var(--muted-on-dark)] truncate">{apt.service}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

