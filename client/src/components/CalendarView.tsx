import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Calendar, Clock, User, CheckCircle, XCircle, Phone } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-600/20 border-yellow-500/30 text-yellow-400",
  confirmed: "bg-green-600/20 border-green-500/30 text-green-400",
  cancelled: "bg-red-600/20 border-red-500/30 text-red-400",
  completed: "bg-blue-600/20 border-blue-500/30 text-blue-400",
};

export default function CalendarView() {
  const { t } = useLang();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", serviceType: "", preferredDate: "", preferredTime: "", notes: "" });

  const { data: bookingList, refetch } = trpc.bookings.list.useQuery();
  const updateStatus = trpc.bookings.updateStatus.useMutation({ onSuccess: () => refetch() });
  const createBooking = trpc.bookings.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); setForm({ customerName: "", customerPhone: "", serviceType: "", preferredDate: "", preferredTime: "", notes: "" }); } });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-white">{t.dashboard.viewCalendar}</h2>
          <p className="text-sm text-white/45 mt-0.5">Upcoming appointments and booking requests</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-900/30"
        >
          + New Booking
        </button>
      </div>

      {/* New booking form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Booking Request</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Customer Name *"
              value={form.customerName}
              onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/40"
            />
            <input
              placeholder="Phone"
              value={form.customerPhone}
              onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/40"
            />
            <input
              placeholder="Service Type"
              value={form.serviceType}
              onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/40"
            />
            <input
              type="date"
              value={form.preferredDate}
              onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/40"
            />
            <input
              type="time"
              value={form.preferredTime}
              onChange={e => setForm(f => ({ ...f, preferredTime: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/40"
            />
            <input
              placeholder="Notes"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/40"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createBooking.mutate(form)}
              disabled={!form.customerName || createBooking.isPending}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold transition-all"
            >
              {createBooking.isPending ? "Saving..." : "Save Booking"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:text-white transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Booking list */}
      {!bookingList || bookingList.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-blue-400" />
          </div>
          <p className="text-white/45 text-sm">No bookings yet. Riley will populate this calendar automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookingList.map(booking => (
            <div key={booking.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <User size={13} className="text-blue-400" />
                    </div>
                    <span className="font-semibold text-white text-sm">{booking.customerName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[booking.status ?? "pending"]}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-white/45">
                    {booking.serviceType && (
                      <span className="flex items-center gap-1"><Calendar size={11} /> {booking.serviceType}</span>
                    )}
                    {booking.preferredDate && (
                      <span className="flex items-center gap-1"><Clock size={11} /> {String(booking.preferredDate)}</span>
                    )}
                    {booking.customerPhone && (
                      <span className="flex items-center gap-1"><Phone size={11} /> {booking.customerPhone}</span>
                    )}
                  </div>
                  {booking.notes && <p className="text-xs text-white/35 mt-1.5 italic">"{booking.notes}"</p>}
                </div>

                {booking.status === "pending" && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => updateStatus.mutate({ id: booking.id, status: "confirmed" })}
                      className="p-1.5 rounded-lg bg-green-600/15 border border-green-500/20 text-green-400 hover:bg-green-600/25 transition-all"
                      title="Confirm"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: booking.id, status: "cancelled" })}
                      className="p-1.5 rounded-lg bg-red-600/15 border border-red-500/20 text-red-400 hover:bg-red-600/25 transition-all"
                      title="Cancel"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
