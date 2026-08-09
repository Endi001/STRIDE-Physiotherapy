export interface BookingGrowthPoint {
  date: string;
  bookings: number;
  previousPeriodBookings: number;
}

export interface PeakHourPoint {
  hour: string;
  bookings: number;
  capacityPercent: number;
}

export interface TreatmentShare {
  name: string;
  value: number;
  color: string;
}

export interface SnapshotAppointment {
  id: string;
  time: string;
  patientName: string;
  therapist: string;
  service: string;
  status: "Confirmed" | "In Progress" | "Completed" | "Cancelled";
}

// 7-day booking growth data (current week vs previous week)
export const bookingGrowthData: BookingGrowthPoint[] = [
  { date: "Mon", bookings: 12, previousPeriodBookings: 10 },
  { date: "Tue", bookings: 19, previousPeriodBookings: 15 },
  { date: "Wed", bookings: 15, previousPeriodBookings: 18 },
  { date: "Thu", bookings: 22, previousPeriodBookings: 14 },
  { date: "Fri", bookings: 25, previousPeriodBookings: 20 },
  { date: "Sat", bookings: 14, previousPeriodBookings: 12 },
  { date: "Sun", bookings: 0, previousPeriodBookings: 0 },
];

// Peak operating hours for appointments (08:00 - 19:00)
export const peakHoursData: PeakHourPoint[] = [
  { hour: "08:00", bookings: 4, capacityPercent: 40 },
  { hour: "09:00", bookings: 8, capacityPercent: 80 },
  { hour: "10:00", bookings: 9, capacityPercent: 90 },
  { hour: "11:00", bookings: 5, capacityPercent: 50 },
  { hour: "12:00", bookings: 3, capacityPercent: 30 },
  { hour: "13:00", bookings: 2, capacityPercent: 20 }, // Lunch hour dip
  { hour: "14:00", bookings: 6, capacityPercent: 60 },
  { hour: "15:00", bookings: 7, capacityPercent: 70 },
  { hour: "16:00", bookings: 9, capacityPercent: 90 }, // Evening peak
  { hour: "17:00", bookings: 10, capacityPercent: 100 }, // Evening peak
  { hour: "18:00", bookings: 8, capacityPercent: 80 },
  { hour: "19:00", bookings: 3, capacityPercent: 30 },
];

// Share of bookings by treatment/service type
export const treatmentShareData: TreatmentShare[] = [
  { name: "Initial Assessment", value: 35, color: "#FF5A36" }, // Ember
  { name: "Sports Rehab", value: 30, color: "#7C8B87" },        // Slate Clinical
  { name: "Manual Therapy", value: 20, color: "#C1A27E" },      // Muted Gold
  { name: "Dry Needling", value: 15, color: "#D6D2C9" },        // Muted Bone
];

// Daily schedule snapshot appointments for today
export const snapshotAppointments: SnapshotAppointment[] = [
  {
    id: "apt-1",
    time: "08:00 - 08:45",
    patientName: "Sarah Jenkins",
    therapist: "Conor M.",
    service: "Initial Assessment",
    status: "Completed",
  },
  {
    id: "apt-2",
    time: "09:30 - 10:15",
    patientName: "David O'Connor",
    therapist: "Maeve O'B.",
    service: "Sports Rehab",
    status: "Completed",
  },
  {
    id: "apt-3",
    time: "11:00 - 11:45",
    patientName: "Emma Byrne",
    therapist: "Conor M.",
    service: "Manual Therapy",
    status: "In Progress",
  },
  {
    id: "apt-4",
    time: "14:00 - 14:45",
    patientName: "James Murphy",
    therapist: "Maeve O'B.",
    service: "Initial Assessment",
    status: "Confirmed",
  },
  {
    id: "apt-5",
    time: "15:30 - 16:15",
    patientName: "Richard Kelly",
    therapist: "Conor M.",
    service: "Dry Needling",
    status: "Confirmed",
  },
  {
    id: "apt-6",
    time: "17:00 - 17:45",
    patientName: "Clara Higgins",
    therapist: "Maeve O'B.",
    service: "Sports Rehab",
    status: "Cancelled",
  },
];
