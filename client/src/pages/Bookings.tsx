import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { CDN } from "../../../shared/assets";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, Phone,
  Mail, CheckCircle, XCircle, RotateCcw, Trash2, LogOut, Filter,
  AlertCircle, CalendarDays, List,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode = "month" | "week" | "day";
type StatusFilter = "all" | "pending" | "confirmed" | "cancelled" | "completed";
type BookingFormState = { customerName: string; customerPhone: string; customerEmail: string; serviceType: string; preferredDate: string; preferredTime: string; duration: string; notes: string; };

interface Booking {
  id: number;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  duration: number | null;
  notes: string | null;
  status: string | null;
  createdAt: Date;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; border: string }> = {
  pending:   { label: "Pending",   dot: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-700 border-yellow-200",  border: "border-l-yellow-400" },
  confirmed: { label: "Confirmed", dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200",    border: "border-l-green-500" },
  cancelled: { label: "Cancelled", dot: "bg-red-400",    badge: "bg-red-50 text-red-600 border-red-200",          border: "border-l-red-400" },
  completed: { label: "Done",      dot: "bg-blue-400",   badge: "bg-blue-50 text-blue-700 border-blue-200",       border: "border-l-blue-400" },
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am–7pm

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Bookings() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showNewForm, setShowNewForm] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [newForm, setNewForm] = useState<BookingFormState>({
    customerName: "", customerPhone: "", customerEmail: "",
    serviceType: "", preferredDate: "", preferredTime: "", duration: "60", notes: "",
  });

  // ── Date range for current view ──────────────────────────────────────────────
  const { startDate, endDate } = useMemo(() => {
    if (viewMode === "month") {
      const s = startOfMonth(currentDate);
      const e = endOfMonth(currentDate);
      // Include prev/next month days shown in grid
      const gridStart = addDays(s, -s.getDay());
      const gridEnd = addDays(gridStart, 41);
      return { startDate: formatDate(gridStart), endDate: formatDate(gridEnd) };
    } else if (viewMode === "week") {
      const s = startOfWeek(currentDate);
      return { startDate: formatDate(s), endDate: formatDate(addDays(s, 6)) };
    } else {
      return { startDate: formatDate(currentDate), endDate: formatDate(currentDate) };
    }
  }, [viewMode, currentDate]);

  const { data: bookingData, refetch } = trpc.bookings.listByDateRange.useQuery(
    { startDate, endDate },
    { enabled: isAuthenticated }
  );

  const updateStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Booking updated"); setSelectedBooking(null); },
    onError: () => toast.error("Failed to update booking"),
  });

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowNewForm(false);
      setNewForm({ customerName: "", customerPhone: "", customerEmail: "", serviceType: "", preferredDate: "", preferredTime: "", duration: "60", notes: "" });
      toast.success("Booking created");
    },
    onError: () => toast.error("Failed to create booking"),
  });

  const reschedule = trpc.bookings.reschedule.useMutation({
    onSuccess: () => {
      refetch();
      setShowRescheduleForm(false);
      setSelectedBooking(null);
      toast.success("Booking rescheduled");
    },
    onError: () => toast.error("Failed to reschedule"),
  });

  const deleteBooking = trpc.bookings.delete.useMutation({
    onSuccess: () => { refetch(); setSelectedBooking(null); toast.success("Booking deleted"); },
    onError: () => toast.error("Failed to delete booking"),
  });

  // ── Booking lookup by date ───────────────────────────────────────────────────
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    (bookingData ?? []).forEach(b => {
      const d = b.preferredDate ? String(b.preferredDate) : null;
      if (!d) return;
      if (!map[d]) map[d] = [];
      map[d].push(b as Booking);
    });
    return map;
  }, [bookingData]);

  const filteredBookings = useMemo(() => {
    const all = bookingData ?? [];
    return statusFilter === "all" ? all : all.filter(b => b.status === statusFilter);
  }, [bookingData, statusFilter]);

  // ── Auth guards ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <img src={CDN.logoSymbol} alt="SoloEdge" className="w-12 h-12 object-contain animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center border border-gray-200 shadow-xl">
          <img src={CDN.logo} alt="SoloEdge" className="h-10 w-auto mx-auto mb-6" />
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-500 text-sm mb-6">Access your bookings calendar by signing in.</p>
          <a href={getLoginUrl()} className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-200">
            Sign In to Continue
          </a>
          <a href="/app" className="block mt-3 text-sm text-gray-400 hover:text-gray-600">← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  const navigate = (dir: -1 | 1) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === "month") d.setMonth(d.getMonth() + dir);
      else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
      else d.setDate(d.getDate() + dir);
      return d;
    });
  };

  const headerLabel = () => {
    if (viewMode === "month") return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (viewMode === "week") {
      const s = startOfWeek(currentDate);
      const e = addDays(s, 6);
      return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/app" className="flex items-center gap-1.5 text-gray-500 hover:text-blue-700 transition-colors text-sm font-medium flex-shrink-0">
            <ChevronLeft size={16} />
            Dashboard
          </a>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Calendar size={16} className="text-blue-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-900 truncate">Bookings & Calendar</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 border border-gray-200">
              <User size={11} className="text-gray-400" />
              <span className="text-xs text-gray-600 hidden sm:inline">{user?.name ?? "User"}</span>
            </div>
            <button onClick={() => logout()} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-5 flex flex-col gap-4">

        {/* ── Controls bar ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-gray-200 shadow-sm">
            {(["month", "week", "day"] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  viewMode === v ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {v === "month" ? <CalendarDays size={13} /> : v === "week" ? <Calendar size={13} /> : <List size={13} />}
                {v}
              </button>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
            <button onClick={() => navigate(-1)} className="p-0.5 rounded text-gray-400 hover:text-blue-700 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-900 min-w-[160px] text-center">{headerLabel()}</span>
            <button onClick={() => navigate(1)} className="p-0.5 rounded text-gray-400 hover:text-blue-700 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:text-blue-700 hover:border-blue-300 transition-all shadow-sm"
          >
            Today
          </button>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 ml-auto p-1 rounded-xl bg-white border border-gray-200 shadow-sm">
            {(["all", "pending", "confirmed", "cancelled", "completed"] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  statusFilter === s
                    ? s === "confirmed" ? "bg-green-600 text-white shadow-sm"
                    : s === "pending" ? "bg-yellow-500 text-white shadow-sm"
                    : s === "cancelled" ? "bg-red-500 text-white shadow-sm"
                    : s === "completed" ? "bg-blue-500 text-white shadow-sm"
                    : "bg-gray-700 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>

          {/* New booking */}
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-md shadow-blue-200 active:scale-95"
          >
            <Plus size={14} />
            New Booking
          </button>
        </div>

        {/* ── Calendar Views ─────────────────────────────────────────────────── */}
        {viewMode === "month" && (
          <MonthView
            currentDate={currentDate}
            bookingsByDate={bookingsByDate}
            statusFilter={statusFilter}
            onDayClick={d => { setSelectedDate(d); setViewMode("day"); setCurrentDate(new Date(d + "T00:00:00")); }}
            onBookingClick={setSelectedBooking}
          />
        )}

        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            bookingsByDate={bookingsByDate}
            statusFilter={statusFilter}
            onBookingClick={setSelectedBooking}
          />
        )}

        {viewMode === "day" && (
          <DayView
            currentDate={currentDate}
            bookings={filteredBookings as Booking[]}
            onBookingClick={setSelectedBooking}
          />
        )}

      </div>

      {/* ── New Booking Modal ──────────────────────────────────────────────────── */}
      {showNewForm && (
        <Modal title="New Booking" onClose={() => setShowNewForm(false)}>
          <NewBookingForm
            form={newForm}
            onChange={setNewForm}
            onSubmit={() => {
              if (!newForm.customerName || !newForm.serviceType) return;
              createBooking.mutate({
                customerName: newForm.customerName,
                customerPhone: newForm.customerPhone || undefined,
                customerEmail: newForm.customerEmail || undefined,
                serviceType: newForm.serviceType,
                preferredDate: newForm.preferredDate || undefined,
                preferredTime: newForm.preferredTime || undefined,
                duration: parseInt(newForm.duration) || 60,
                notes: newForm.notes || undefined,
              });
            }}
            isPending={createBooking.isPending}
            onCancel={() => setShowNewForm(false)}
          />
        </Modal>
      )}

      {/* ── Booking Detail Panel ──────────────────────────────────────────────── */}
      {selectedBooking && !showRescheduleForm && (
        <Modal title="Booking Details" onClose={() => setSelectedBooking(null)}>
          <BookingDetail
            booking={selectedBooking}
            onConfirm={() => updateStatus.mutate({ id: selectedBooking.id, status: "confirmed" })}
            onCancel={() => updateStatus.mutate({ id: selectedBooking.id, status: "cancelled" })}
            onComplete={() => updateStatus.mutate({ id: selectedBooking.id, status: "completed" })}
            onReschedule={() => { setRescheduleDate(selectedBooking.preferredDate ?? ""); setRescheduleTime(selectedBooking.preferredTime ?? ""); setShowRescheduleForm(true); }}
            onDelete={() => { if (confirm("Delete this booking?")) deleteBooking.mutate({ id: selectedBooking.id }); }}
            isPending={updateStatus.isPending || deleteBooking.isPending}
          />
        </Modal>
      )}

      {/* ── Reschedule Modal ──────────────────────────────────────────────────── */}
      {selectedBooking && showRescheduleForm && (
        <Modal title="Reschedule Booking" onClose={() => setShowRescheduleForm(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Rescheduling <strong>{selectedBooking.customerName}</strong> — {selectedBooking.serviceType}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">New Date *</label>
                <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">New Time</label>
                <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => reschedule.mutate({ id: selectedBooking.id, newDate: rescheduleDate, newTime: rescheduleTime || undefined })}
                disabled={!rescheduleDate || reschedule.isPending}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold transition-all shadow-md shadow-blue-200"
              >
                {reschedule.isPending ? "Rescheduling..." : "Confirm Reschedule"}
              </button>
              <button onClick={() => setShowRescheduleForm(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-sm hover:bg-gray-200 transition-all">
                Back
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Month View ─────────────────────────────────────────────────────────────────
function MonthView({ currentDate, bookingsByDate, statusFilter, onDayClick, onBookingClick }: {
  currentDate: Date;
  bookingsByDate: Record<string, Booking[]>;
  statusFilter: StatusFilter;
  onDayClick: (d: string) => void;
  onBookingClick: (b: Booking) => void;
}) {
  const today = formatDate(new Date());
  const monthStart = startOfMonth(currentDate);
  const gridStart = addDays(monthStart, -monthStart.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const currentMonth = currentDate.getMonth();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-50">
        {days.map(day => {
          const dateStr = formatDate(day);
          const isCurrentMonth = day.getMonth() === currentMonth;
          const isToday = dateStr === today;
          const dayBookings = (bookingsByDate[dateStr] ?? []).filter(b => statusFilter === "all" || b.status === statusFilter);

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`min-h-[90px] p-1.5 cursor-pointer transition-colors hover:bg-blue-50/50 ${!isCurrentMonth ? "bg-gray-50/50" : ""}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${
                isToday ? "bg-blue-600 text-white" : isCurrentMonth ? "text-gray-700" : "text-gray-300"
              }`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map(b => {
                  const sc = STATUS_CONFIG[b.status ?? "pending"];
                  return (
                    <div
                      key={b.id}
                      onClick={e => { e.stopPropagation(); onBookingClick(b); }}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium cursor-pointer hover:opacity-80 border-l-2 ${sc.border} bg-gray-50`}
                    >
                      {b.preferredTime ? formatTime(b.preferredTime) + " " : ""}{b.customerName ?? "Booking"}
                    </div>
                  );
                })}
                {dayBookings.length > 3 && (
                  <div className="text-[10px] text-blue-500 font-medium px-1">+{dayBookings.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week View ──────────────────────────────────────────────────────────────────
function WeekView({ currentDate, bookingsByDate, statusFilter, onBookingClick }: {
  currentDate: Date;
  bookingsByDate: Record<string, Booking[]>;
  statusFilter: StatusFilter;
  onBookingClick: (b: Booking) => void;
}) {
  const today = formatDate(new Date());
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b border-gray-100">
        <div className="py-3 text-center text-xs font-semibold text-gray-300 border-r border-gray-100">Time</div>
        {days.map(day => {
          const dateStr = formatDate(day);
          const isToday = dateStr === today;
          return (
            <div key={dateStr} className={`py-3 text-center border-r border-gray-100 last:border-r-0 ${isToday ? "bg-blue-50" : ""}`}>
              <div className="text-xs text-gray-400">{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
              <div className={`text-sm font-bold ${isToday ? "text-blue-600" : "text-gray-700"}`}>{day.getDate()}</div>
            </div>
          );
        })}
      </div>
      {/* Time slots */}
      <div className="overflow-auto max-h-[calc(100vh-280px)]">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-50 min-h-[56px]">
            <div className="px-2 py-1 text-[10px] text-gray-300 font-medium border-r border-gray-100 flex items-start pt-1.5">
              {hour % 12 || 12}{hour < 12 ? "am" : "pm"}
            </div>
            {days.map(day => {
              const dateStr = formatDate(day);
              const isToday = dateStr === today;
              const dayBookings = (bookingsByDate[dateStr] ?? [])
                .filter(b => {
                  if (statusFilter !== "all" && b.status !== statusFilter) return false;
                  if (!b.preferredTime) return false;
                  const bHour = parseInt(b.preferredTime.split(":")[0]);
                  return bHour === hour;
                });
              return (
                <div key={dateStr} className={`border-r border-gray-50 last:border-r-0 p-0.5 ${isToday ? "bg-blue-50/30" : ""}`}>
                  {dayBookings.map(b => {
                    const sc = STATUS_CONFIG[b.status ?? "pending"];
                    return (
                      <div
                        key={b.id}
                        onClick={() => onBookingClick(b)}
                        className={`text-[10px] px-1.5 py-1 rounded-lg mb-0.5 cursor-pointer hover:opacity-80 border-l-2 ${sc.border} bg-gray-50 shadow-sm`}
                      >
                        <div className="font-semibold truncate">{b.customerName ?? "Booking"}</div>
                        <div className="text-gray-400 truncate">{b.serviceType}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Day View ───────────────────────────────────────────────────────────────────
function DayView({ currentDate, bookings, onBookingClick }: {
  currentDate: Date;
  bookings: Booking[];
  onBookingClick: (b: Booking) => void;
}) {
  const dateStr = formatDate(currentDate);
  const dayBookings = bookings.filter(b => b.preferredDate && String(b.preferredDate) === dateStr);
  const unscheduled = dayBookings.filter(b => !b.preferredTime);
  const scheduled = dayBookings.filter(b => b.preferredTime).sort((a, b) => (a.preferredTime ?? "").localeCompare(b.preferredTime ?? ""));

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">Unscheduled ({unscheduled.length})</span>
          </div>
          <div className="space-y-2">
            {unscheduled.map(b => <BookingRow key={b.id} booking={b} onClick={() => onBookingClick(b)} />)}
          </div>
        </div>
      )}

      {/* Time-slot list */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Clock size={14} className="text-blue-500" />
          <span className="text-sm font-semibold text-gray-900">
            {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
          <span className="ml-auto text-xs text-gray-400">{scheduled.length} appointment{scheduled.length !== 1 ? "s" : ""}</span>
        </div>
        {scheduled.length === 0 && unscheduled.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-blue-400" />
            </div>
            <p className="text-gray-400 text-sm">No bookings for this day</p>
            <p className="text-gray-300 text-xs mt-1">Riley will populate this calendar automatically</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {HOURS.map(hour => {
              const hourBookings = scheduled.filter(b => parseInt((b.preferredTime ?? "00:00").split(":")[0]) === hour);
              if (hourBookings.length === 0) {
                return (
                  <div key={hour} className="flex items-center gap-4 px-4 py-2 min-h-[44px]">
                    <span className="text-xs text-gray-200 w-12 flex-shrink-0">{hour % 12 || 12}{hour < 12 ? "am" : "pm"}</span>
                    <div className="flex-1 border-t border-dashed border-gray-100" />
                  </div>
                );
              }
              return (
                <div key={hour} className="flex gap-4 px-4 py-2">
                  <span className="text-xs text-gray-400 font-medium w-12 flex-shrink-0 pt-2">{hour % 12 || 12}{hour < 12 ? "am" : "pm"}</span>
                  <div className="flex-1 space-y-2">
                    {hourBookings.map(b => <BookingRow key={b.id} booking={b} onClick={() => onBookingClick(b)} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Booking Row ────────────────────────────────────────────────────────────────
function BookingRow({ booking: b, onClick }: { booking: Booking; onClick: () => void }) {
  const sc = STATUS_CONFIG[b.status ?? "pending"];
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border border-l-4 ${sc.border} bg-white hover:bg-gray-50 cursor-pointer transition-all shadow-sm`}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 truncate">{b.customerName ?? "Unknown"}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${sc.badge}`}>{sc.label}</span>
        </div>
        <div className="flex flex-wrap gap-3 mt-0.5">
          {b.serviceType && <span className="text-xs text-gray-400">{b.serviceType}</span>}
          {b.preferredTime && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{formatTime(b.preferredTime)}</span>}
          {b.customerPhone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{b.customerPhone}</span>}
        </div>
      </div>
      <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
    </div>
  );
}

// ── Booking Detail ─────────────────────────────────────────────────────────────
function BookingDetail({ booking: b, onConfirm, onCancel, onComplete, onReschedule, onDelete, isPending }: {
  booking: Booking;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onReschedule: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const sc = STATUS_CONFIG[b.status ?? "pending"];
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <User size={18} className="text-blue-600" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">{b.customerName ?? "Unknown"}</div>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sc.badge}`}>{sc.label}</span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
        {b.serviceType && (
          <div className="flex items-center gap-2.5 text-sm">
            <Calendar size={14} className="text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 font-medium">{b.serviceType}</span>
          </div>
        )}
        {b.preferredDate && (
          <div className="flex items-center gap-2.5 text-sm">
            <CalendarDays size={14} className="text-gray-400 flex-shrink-0" />
            <span className="text-gray-700">{formatDisplayDate(String(b.preferredDate))}</span>
            {b.preferredTime && <span className="text-gray-500">at {formatTime(b.preferredTime)}</span>}
            {b.duration && <span className="text-gray-400">· {b.duration} min</span>}
          </div>
        )}
        {b.customerPhone && (
          <div className="flex items-center gap-2.5 text-sm">
            <Phone size={14} className="text-gray-400 flex-shrink-0" />
            <a href={`tel:${b.customerPhone}`} className="text-blue-600 hover:underline">{b.customerPhone}</a>
          </div>
        )}
        {b.customerEmail && (
          <div className="flex items-center gap-2.5 text-sm">
            <Mail size={14} className="text-gray-400 flex-shrink-0" />
            <a href={`mailto:${b.customerEmail}`} className="text-blue-600 hover:underline truncate">{b.customerEmail}</a>
          </div>
        )}
        {b.notes && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 italic">"{b.notes}"</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        {b.status === "pending" && (
          <button onClick={onConfirm} disabled={isPending} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold transition-all shadow-md shadow-green-200">
            <CheckCircle size={14} /> Confirm
          </button>
        )}
        {(b.status === "pending" || b.status === "confirmed") && (
          <button onClick={onCancel} disabled={isPending} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-600 border border-red-200 text-sm font-semibold transition-all">
            <XCircle size={14} /> Cancel
          </button>
        )}
        {b.status === "confirmed" && (
          <button onClick={onComplete} disabled={isPending} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-700 border border-blue-200 text-sm font-semibold transition-all">
            <CheckCircle size={14} /> Mark Done
          </button>
        )}
        <button onClick={onReschedule} disabled={isPending} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-amber-700 border border-amber-200 text-sm font-semibold transition-all">
          <RotateCcw size={14} /> Reschedule
        </button>
        <button onClick={onDelete} disabled={isPending} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 disabled:opacity-40 text-gray-500 border border-gray-200 text-sm font-medium transition-all col-span-2">
          <Trash2 size={14} /> Delete Booking
        </button>
      </div>
    </div>
  );
}

// ── New Booking Form ─────────────────────────────────────────────────────────────────────
function NewBookingForm({ form, onChange, onSubmit, isPending, onCancel }: {
  form: BookingFormState;
  onChange: (f: BookingFormState) => void;
  onSubmit: () => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const inputCls = "w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Customer Name *</label>
          <input placeholder="John Smith" value={form.customerName} onChange={e => onChange({ ...form, customerName: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Phone</label>
          <input placeholder="(555) 000-0000" value={form.customerPhone} onChange={e => onChange({ ...form, customerPhone: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Email</label>
          <input placeholder="john@example.com" value={form.customerEmail} onChange={e => onChange({ ...form, customerEmail: e.target.value })} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Service Type *</label>
          <input placeholder="e.g. Consultation, Massage, Inspection..." value={form.serviceType} onChange={e => onChange({ ...form, serviceType: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Date</label>
          <input type="date" value={form.preferredDate} onChange={e => onChange({ ...form, preferredDate: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Time</label>
          <input type="time" value={form.preferredTime} onChange={e => onChange({ ...form, preferredTime: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Duration (min)</label>
          <select value={form.duration} onChange={e => onChange({ ...form, duration: e.target.value })} className={inputCls}>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">2 hours</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Notes</label>
          <textarea placeholder="Any special requests or notes..." value={form.notes} onChange={e => onChange({ ...form, notes: e.target.value })} rows={2} className={inputCls + " resize-none"} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSubmit}
          disabled={!form.customerName || !form.serviceType || isPending}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold transition-all shadow-md shadow-blue-200"
        >
          {isPending ? "Saving..." : "Save Booking"}
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-sm hover:bg-gray-200 transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Modal wrapper ──────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <XCircle size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
