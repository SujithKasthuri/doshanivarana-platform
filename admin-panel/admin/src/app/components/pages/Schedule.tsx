import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, Search, Edit, Trash2, UserCircle } from "lucide-react";
import { Modal, Field, ModalFooter, inputCls, inputStyle, selectStyle } from "../Modal";
import { SlotsService } from "../../../services/firebase/slots";
import { TemplesService } from "../../../services/firebase/temples";
import { PoojasService } from "../../../services/firebase/poojas";
import { PriestsService } from "../../../services/firebase/priests";
import { LanguagesService } from "../../../services/firebase/languages";
import { Timestamp } from "firebase/firestore";
import { toDateObj } from "../../../services/firebase/core";

type SlotStatus = "Available" | "Full" | "Cancelled";

interface Slot {
  id: string;
  templeId: string;
  templeName: string;
  poojaId: string;
  poojaName: string;
  priestId: string;
  priestName: string;
  languageCode: string;
  startTime: Timestamp;
  endTime: Timestamp;
  capacity: number;
  bookedCount: number;
  status: SlotStatus;
}

const statusCfg: Record<SlotStatus, { bg: string; color: string }> = {
  Available: { bg: "#F0FDF4", color: "#16A34A" },
  Full: { bg: "#EFF6FF", color: "#2563EB" },
  Cancelled: { bg: "#FFF1F2", color: "#DC2626" },
};

export function Schedule() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [temples, setTemples] = useState<any[]>([]);
  const [poojas, setPoojas] = useState<any[]>([]);
  const [priests, setPriests] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);

  // Simple day selection (0 = Today, 1 = Tomorrow, etc.)
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Slot | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    templeId: "",
    poojaId: "",
    priestId: "",
    startDateTime: "",
    durationMinutes: "60",
    capacity: "10",
    languageCode: "Sanskrit",
    status: "Available" as SlotStatus,
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const unsubSlots = SlotsService.subscribeToSlots(setSlots);
    const unsubPoojas = PoojasService.subscribeToPoojas(setPoojas);
    const unsubPriests = PriestsService.subscribeToPriests(setPriests);
    
    TemplesService.getTemples().then(setTemples).catch(console.error);
    LanguagesService.getLanguages().then(setLanguages).catch(console.error);

    return () => {
      unsubSlots();
      unsubPoojas();
      unsubPriests();
    };
  }, []);

  // Compute displayed week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(today);
  selectedDate.setDate(today.getDate() + selectedDayOffset);

  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const filtered = slots.filter(s => {
    const slotDate = toDateObj(s.startTime);
    if (!slotDate) return false;
    
    const matchDay = 
      slotDate.getFullYear() === selectedDate.getFullYear() &&
      slotDate.getMonth() === selectedDate.getMonth() &&
      slotDate.getDate() === selectedDate.getDate();

    const matchSearch = !search ||
      s.poojaName.toLowerCase().includes(search.toLowerCase()) ||
      s.templeName.toLowerCase().includes(search.toLowerCase()) ||
      s.priestName.toLowerCase().includes(search.toLowerCase());
      
    return matchDay && matchSearch;
  });

  async function handleSave() {
    if (!form.templeId || !form.poojaId || !form.priestId || !form.startDateTime) {
      alert("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      const selectedTemple = temples.find(t => t.id === form.templeId);
      const selectedPooja = poojas.find(p => p.id === form.poojaId);
      const selectedPriest = priests.find(p => p.id === form.priestId);

      const start = new Date(form.startDateTime);
      const end = new Date(start.getTime() + parseInt(form.durationMinutes) * 60000);

      const slotData: any = {
        templeId: form.templeId,
        templeName: selectedTemple ? selectedTemple.name : "Unknown Temple",
        poojaId: form.poojaId,
        poojaName: selectedPooja ? selectedPooja.name : "Unknown Pooja",
        priestId: form.priestId,
        priestName: selectedPriest ? selectedPriest.name : "Unknown Priest",
        languageCode: form.languageCode,
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        capacity: parseInt(form.capacity) || 10,
        status: form.status,
      };

      if (editTarget) {
        await SlotsService.updateSlot(editTarget.id, slotData, editTarget);
      } else {
        const newId = `SL${String(Date.now()).slice(-6)}`;
        await SlotsService.createSlot(newId, slotData);
      }
      setAddOpen(false);
      setEditTarget(null);
      setForm(emptyForm);
    } catch (err: any) {
      alert("Error saving slot: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(slot: Slot) {
    setEditTarget(slot);
    const start = toDateObj(slot.startTime);
    const end = toDateObj(slot.endTime);
    if (!start || !end) return;
    const duration = Math.round((end.getTime() - start.getTime()) / 60000);

    const startLocal = new Date(start.getTime() - start.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);

    setForm({
      templeId: slot.templeId,
      poojaId: slot.poojaId,
      priestId: slot.priestId,
      startDateTime: startLocal,
      durationMinutes: String(duration),
      capacity: String(slot.capacity),
      languageCode: slot.languageCode || "Sanskrit",
      status: slot.status,
    });
    setAddOpen(true);
  }

  async function deleteSlot(id: string) {
    if (confirm("Are you sure you want to delete this slot?")) {
      try {
        await SlotsService.softDeleteSlot(id);
      } catch (err: any) {
        alert("Error deleting slot: " + err.message);
      }
    }
  }

  const totalSlots = slots.length;
  const available = slots.filter(s => s.status === "Available").length;
  const booked = slots.filter(s => s.status === "Full").length;
  const cancelled = slots.filter(s => s.status === "Cancelled").length;

  const slotForm = (
    <div className="px-6 py-5 space-y-4">
      <Field label="Temple">
        <select className={inputCls} style={selectStyle} value={form.templeId} onChange={e => setForm(f => ({ ...f, templeId: e.target.value }))}>
          <option value="">Select Temple...</option>
          {temples.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Pooja / Service">
        <select className={inputCls} style={selectStyle} value={form.poojaId} onChange={e => setForm(f => ({ ...f, poojaId: e.target.value }))}>
          <option value="">Select Pooja...</option>
          {poojas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Priest">
        <select className={inputCls} style={selectStyle} value={form.priestId} onChange={e => setForm(f => ({ ...f, priestId: e.target.value }))}>
          <option value="">Select Priest...</option>
          {priests.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Date & Time">
          <input type="datetime-local" className={inputCls} style={inputStyle} value={form.startDateTime} onChange={e => setForm(f => ({ ...f, startDateTime: e.target.value }))} />
        </Field>
        <Field label="Duration (minutes)">
          <input type="number" min="15" step="15" className={inputCls} style={inputStyle} value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Capacity">
          <input className={inputCls} style={inputStyle} type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
        </Field>
        <Field label="Language">
          <select className={inputCls} style={selectStyle} value={form.languageCode} onChange={e => setForm(f => ({ ...f, languageCode: e.target.value }))}>
            <option value="Sanskrit">Sanskrit</option>
            {languages.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <Field label="Status Override">
          <select className={inputCls} style={selectStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SlotStatus }))}>
            <option value="Available">Available</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Full">Full</option>
          </select>
        </Field>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Slots", value: totalSlots, color: "#C76A00", bg: "#FFF0E6" },
          { label: "Available", value: available, color: "#16A34A", bg: "#F0FDF4" },
          { label: "Full", value: booked, color: "#2563EB", bg: "#EFF6FF" },
          { label: "Cancelled", value: cancelled, color: "#DC2626", bg: "#FFF1F2" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
            <div className="text-xl" style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Week Selector */}
      <div className="bg-white rounded-xl p-4 border" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm" style={{ color: "#1F1F1F", fontWeight: 600 }}>Week of {today.toLocaleDateString()}</span>
          <button
            onClick={() => { setForm(emptyForm); setAddOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: "#C76A00", color: "#FFFFFF", fontWeight: 600 }}
          >
            <Plus size={15} /> Add Slot
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {weekDates.map((d, i) => {
            const dayStr = d.toLocaleDateString("en-US", { weekday: 'short' });
            const dateStr = d.getDate();
            const daySlots = slots.filter(s => {
               const sd = toDateObj(s.startTime);
               return sd && sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
            });
            const isSelected = selectedDayOffset === i;
            return (
              <button
                key={i}
                onClick={() => setSelectedDayOffset(i)}
                className="flex flex-col items-center py-2.5 px-1 rounded-xl transition-all"
                style={{
                  backgroundColor: isSelected ? "#C76A00" : "#FAF6F2",
                  border: `1px solid ${isSelected ? "#C76A00" : "rgba(199,106,0,0.15)"}`,
                }}
              >
                <span className="text-xs mb-1" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "#9CA3AF", fontWeight: 500 }}>{dayStr}</span>
                <span className="text-sm" style={{ color: isSelected ? "#FFFFFF" : "#1F1F1F", fontWeight: 700 }}>{dateStr}</span>
                {daySlots.length > 0 && (
                  <span className="mt-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : "rgba(199,106,0,0.12)", color: isSelected ? "#FFFFFF" : "#C76A00", fontWeight: 700 }}>
                    {daySlots.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot List */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
        <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: "rgba(199,106,0,0.08)" }}>
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
            <input
              type="text"
              placeholder="Search slots by temple, pooja, or priest..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: "#FAF6F2", border: "1px solid rgba(199,106,0,0.15)", color: "#1F1F1F" }}
            />
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: "#9CA3AF" }}>{selectedDate.toLocaleDateString()} · {filtered.length} slot{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar size={28} className="mx-auto mb-2" style={{ color: "#E5D5C5" }} />
            <p className="text-sm" style={{ color: "#9CA3AF" }}>No slots scheduled for this day</p>
            <button onClick={() => { setForm(emptyForm); setAddOpen(true); }} className="mt-3 text-xs" style={{ color: "#C76A00", fontWeight: 600 }}>+ Add a slot</button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "rgba(199,106,0,0.06)" }}>
              {filtered.map(s => {
                const sc = statusCfg[s.status] || statusCfg.Available;
                const fillPct = Math.round((s.bookedCount / s.capacity) * 100) || 0;
                
                const sObj = toDateObj(s.startTime);
                const eObj = toDateObj(s.endTime);
                const startStr = sObj ? sObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const endStr = eObj ? eObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const durationMinutes = (eObj && sObj) ? Math.round((eObj.getTime() - sObj.getTime()) / 60000) : 0;

                return (
                  <div key={s.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm" style={{ color: "#1F1F1F", fontWeight: 600 }}>{s.poojaName}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#C76A00", fontWeight: 500 }}>{s.templeName}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 600 }}>{s.status}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: "#6B7280" }}>
                      <span className="flex items-center gap-1"><Clock size={10} /> {startStr} - {endStr}</span>
                      <span>{durationMinutes}m</span>
                      <span className="flex items-center gap-1"><UserCircle size={10} /> {s.priestName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "#F3EDE8" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(fillPct, 100)}%`, backgroundColor: fillPct >= 90 ? "#EF4444" : "#22C55E" }} />
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: "#6B7280" }}>{s.bookedCount}/{s.capacity}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs"
                        style={{ backgroundColor: "#FAF6F2", color: "#6B7280", minHeight: "44px" }}>
                        <Edit size={12} /> Edit
                      </button>
                      <button onClick={() => deleteSlot(s.id)} className="flex items-center justify-center py-2 px-4 rounded-lg text-xs"
                        style={{ backgroundColor: "#FFF1F2", color: "#EF4444", minHeight: "44px", minWidth: "44px" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#FAF6F2" }}>
                    {["Time", "Temple", "Pooja / Service", "Priest", "Duration", "Language", "Capacity", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9CA3AF", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const sc = statusCfg[s.status] || statusCfg.Available;
                    const fillPct = Math.round((s.bookedCount / s.capacity) * 100) || 0;
                    
                    const sObj = toDateObj(s.startTime);
                    const eObj = toDateObj(s.endTime);
                    const startStr = sObj ? sObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    const endStr = eObj ? eObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    const durationMinutes = (eObj && sObj) ? Math.round((eObj.getTime() - sObj.getTime()) / 60000) : 0;

                    return (
                      <tr key={s.id} className="border-t hover:bg-orange-50 transition-colors" style={{ borderColor: "rgba(199,106,0,0.06)" }}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#1F1F1F", fontWeight: 600 }}>
                            <Clock size={12} style={{ color: "#C76A00" }} /> {startStr} - {endStr}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: "#C76A00", fontWeight: 500 }}>{s.templeName}</td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: "#1F1F1F", fontWeight: 600 }}>{s.poojaName}</td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: "#6B7280" }}>{s.priestName}</td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: "#6B7280" }}>{durationMinutes}m</td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3E8FF", color: "#4A1259" }}>{s.languageCode}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: "#F3EDE8" }}>
                              <div className="h-1.5 rounded-full" style={{ width: `${Math.min(fillPct, 100)}%`, backgroundColor: fillPct >= 90 ? "#EF4444" : "#22C55E" }} />
                            </div>
                            <span className="text-xs" style={{ color: "#6B7280" }}>{s.bookedCount}/{s.capacity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 600 }}>{s.status}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"><Edit size={13} style={{ color: "#6B7280" }} /></button>
                            <button onClick={() => deleteSlot(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={13} style={{ color: "#EF4444" }} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal open={addOpen || !!editTarget} onClose={() => { setAddOpen(false); setEditTarget(null); setForm(emptyForm); }} title={editTarget ? "Edit Service Slot" : "Add Service Slot"}>
        {slotForm}
        <ModalFooter onClose={() => { setAddOpen(false); setEditTarget(null); setForm(emptyForm); }} onSubmit={handleSave} submitLabel={editTarget ? "Save Changes" : "Add Slot"} saving={saving} />
      </Modal>
    </div>
  );
}
