import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarCheck,
  Users,
  Euro,
  Clock,
  ArrowUpRight,
  Plus,
  Settings,
} from "lucide-react";

interface AdminDashboardProps {
  userEmail: string;
}

export function AdminDashboard({ userEmail }: AdminDashboardProps) {
  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-display tracking-tight text-white mb-2">
          Dashboard
        </h1>
        <p className="text-sm text-[color:var(--muted-on-dark)] font-mono">
          Welcome back, {userEmail}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[color:var(--ink)] border-[color:var(--hairline-dark)] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-[color:var(--muted-on-dark)]">
              Today's Appointments
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-[color:var(--ember)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">12</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +25% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--ink)] border-[color:var(--hairline-dark)] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-[color:var(--muted-on-dark)]">
              Active Patients
            </CardTitle>
            <Users className="h-4 w-4 text-[color:var(--ember)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">184</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8 new this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--ink)] border-[color:var(--hairline-dark)] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-[color:var(--muted-on-dark)]">
              This Month's Revenue
            </CardTitle>
            <Euro className="h-4 w-4 text-[color:var(--ember)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">€8,450</div>
            <p className="text-xs text-[color:var(--muted-on-dark)] mt-1">
              Target: €10,000 (84%)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--ink)] border-[color:var(--hairline-dark)] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-[color:var(--muted-on-dark)]">
              Pending Bookings
            </CardTitle>
            <Clock className="h-4 w-4 text-[color:var(--ember)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">3</div>
            <p className="text-xs text-[color:var(--ember)] mt-1">
              Requires confirmation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity Placeholder */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-6" style={{ borderRadius: 4 }}>
          <h2 className="text-lg font-display tracking-tight text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-4 bg-black/30 hover:bg-black/50 border border-[color:var(--hairline-dark)] text-white hover:border-[color:var(--ember)] transition-all gap-2" style={{ borderRadius: 3 }}>
              <Plus className="h-5 w-5 text-[color:var(--ember)]" />
              <span className="text-xs font-mono uppercase tracking-wider">New Booking</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-black/30 hover:bg-black/50 border border-[color:var(--hairline-dark)] text-white hover:border-[color:var(--ember)] transition-all gap-2" style={{ borderRadius: 3 }}>
              <Users className="h-5 w-5 text-[color:var(--ember)]" />
              <span className="text-xs font-mono uppercase tracking-wider">Add Patient</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-black/30 hover:bg-black/50 border border-[color:var(--hairline-dark)] text-white hover:border-[color:var(--ember)] transition-all gap-2" style={{ borderRadius: 3 }}>
              <CalendarCheck className="h-5 w-5 text-[color:var(--ember)]" />
              <span className="text-xs font-mono uppercase tracking-wider">View Schedule</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-black/30 hover:bg-black/50 border border-[color:var(--hairline-dark)] text-white hover:border-[color:var(--ember)] transition-all gap-2" style={{ borderRadius: 3 }}>
              <Settings className="h-5 w-5 text-[color:var(--ember)]" />
              <span className="text-xs font-mono uppercase tracking-wider">Settings</span>
            </button>
          </div>
        </div>

        <div className="bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-6 flex flex-col justify-between" style={{ borderRadius: 4 }}>
          <div>
            <h2 className="text-lg font-display tracking-tight text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-white/5 pb-3">
                <div>
                  <p className="text-xs font-mono text-white">Booking Confirmed</p>
                  <p className="text-xs text-[color:var(--muted-on-dark)] mt-0.5">John Doe · Physiotherapy Session</p>
                </div>
                <span className="text-[10px] font-mono text-[color:var(--muted-on-dark)]">10m ago</span>
              </div>
              <div className="flex justify-between items-start border-b border-white/5 pb-3">
                <div>
                  <p className="text-xs font-mono text-white">New Patient Registered</p>
                  <p className="text-xs text-[color:var(--muted-on-dark)] mt-0.5">Jane Smith · Dublin</p>
                </div>
                <span className="text-[10px] font-mono text-[color:var(--muted-on-dark)]">1h ago</span>
              </div>
              <div className="flex justify-between items-start pb-1">
                <div>
                  <p className="text-xs font-mono text-white">Payment Received</p>
                  <p className="text-xs text-[color:var(--muted-on-dark)] mt-0.5">Invoice #1092 · €65.00</p>
                </div>
                <span className="text-[10px] font-mono text-[color:var(--muted-on-dark)]">3h ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
