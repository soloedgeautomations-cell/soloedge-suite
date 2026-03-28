import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Calendar, Clock, User, CheckCircle, XCircle, Phone } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
  confirmed: "bg-green-50 border-green-200 text-green-700",
  cancelled: "bg-red-50 border-red-200 text-red-600",
  completed: "bg-blue-50 border-blue-200 text-blue-700",
};

export default function CalendarView() {
  const { t } = useLang();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", serviceType: "", preferredDate: "", preferredTime: "", notes: "" });

  const { data: bookingList, refetch } = trpc.bookings.list.useQuery();
  const updateStatus = trpc.bookings.updateStatus.useMutation({ onSuccess: () => refetch() });
  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowForm(false);
      setForm({ customerName: "", customerPhone: "", serviceType: "", preferredDate: "", preferredTime: "", notes: "" });
    }
  });

  const inputCls = "px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">{t.dashboard.viewCalendar}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Upcoming appointments and booking requests</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md shadow-blue-200"
        >
          + New Booking
        </button>
      </div>

      {/* New booking form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">New Booking Request</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Customer Name *" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className={inputCls} />
            <input placeholder="Phone" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} className={inputCls} />
            <input placeholder="Service Type" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} className={inputCls} />
            <input type="date" value={form.preferredDate} onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))} className={inputCls} />
            <input type="time" value={form.preferredTime} onChange={e => setForm(f => ({ ...f, preferredTime: e.target.value }))} className={inputCls} />
            <input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createBooking.mutate(form)}
              disabled={!form.customerName || createBooking.isPending}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold transition-all shadow-md shadow-blue-200"
            >
              {createBooking.isPending ? "Saving..." : "Save Booking"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-sm hover:text-gray-900 hover:bg-gray-200 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Booking list */}
      {!bookingList || bookingList.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-blue-600" />
          </div>
          <p className="text-gray-400 text-sm">No bookings yet. Riley will populate this calendar automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookingList.map(booking => (
            <div key={booking.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <User size={13} className="text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{booking.customerName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[booking.status ?? "pending"]}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
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
                  {booking.notes && <p className="text-xs text-gray-400 mt-1.5 italic">"{booking.notes}"</p>}
                </div>

                {booking.status === "pending" && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => updateStatus.mutate({ id: booking.id, status: "confirmed" })}
                      className="p-1.5 rounded-lg bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-all"
                      title="Confirm"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: booking.id, status: "cancelled" })}
                      className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-all"
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
