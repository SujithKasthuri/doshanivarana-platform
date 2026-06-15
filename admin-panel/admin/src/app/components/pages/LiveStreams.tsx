import { useState, useEffect } from "react";
import { Radio, Eye, Users, Clock, Plus, Edit, Settings } from "lucide-react";
import { LiveStreamsService, StreamStatus } from "../../../services/firebase/liveStreams";
import { TemplesService } from "../../../services/firebase/temples";
import { PoojasService } from "../../../services/firebase/poojas";
import { PriestsService } from "../../../services/firebase/priests";
import { SlotsService } from "../../../services/firebase/slots";
import { Modal, Field, ModalFooter, inputCls, inputStyle, selectStyle } from "../Modal";
import { formatTimestamp } from "../../../services/firebase/core";

const streamStatusCfg: Record<string, { bg: string; color: string; dot: string }> = {
  Live: { bg: "#FFF1F2", color: "#DC2626", dot: "#EF4444" },
  Ended: { bg: "#FFFBEB", color: "#D97706", dot: "#F59E0B" },
  Scheduled: { bg: "#EFF6FF", color: "#2563EB", dot: "#3B82F6" },
  Archived: { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" },
};

export function LiveStreamsPage() {
  const [filter, setFilter] = useState("All");
  const [streams, setStreams] = useState<any[]>([]);
  const [temples, setTemples] = useState<any[]>([]);
  const [poojas, setPoojas] = useState<any[]>([]);
  const [priests, setPriests] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editStream, setEditStream] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const emptyForm = { title: "", description: "", templeId: "", poojaId: "", priestId: "", slotId: "", youtubeVideoId: "", youtubeLiveUrl: "", thumbnailUrl: "" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const unsub = LiveStreamsService.subscribeToStreams(setStreams);
    TemplesService.getTemples().then(setTemples);
    PoojasService.subscribeToPoojas(setPoojas);
    PriestsService.subscribeToPriests(setPriests);
    SlotsService.subscribeToSlots(setSlots);
    return () => unsub();
  }, []);

  const live = streams.filter(s => s.streamStatus === "Live").length;
  const filtered = filter === "All" ? streams : streams.filter(s => s.streamStatus === filter);

  async function handleCreate() {
    if (!form.templeId || !form.poojaId || !form.priestId || !form.slotId) {
      setErrorMsg("Temple, Pooja, Priest, and Slot are required.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const newId = `LS_${Date.now()}`;
      await LiveStreamsService.createStream(newId, form);
      setCreateOpen(false);
      setForm(emptyForm);
    } catch(e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editStream) return;
    setSaving(true);
    try {
      await LiveStreamsService.updateStream(editStream.id, {
        youtubeVideoId: editStream.youtubeVideoId,
        youtubeLiveUrl: editStream.youtubeLiveUrl,
        thumbnailUrl: editStream.thumbnailUrl,
      });
      setEditStream(null);
    } catch(e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate(id: string, newStatus: StreamStatus, templeId: string) {
    try {
      if (newStatus === "Live") {
        await LiveStreamsService.goLive(id, templeId);
      } else {
        await LiveStreamsService.updateStreamStatus(id, newStatus);
      }
    } catch(e: any) {
      alert("Error: " + e.message);
    }
  }

  const validPoojas = poojas.filter(p => p.templeId === form.templeId);
  const validPriests = priests.filter(p => p.templeId === form.templeId);
  const validSlots = slots.filter(s => s.templeId === form.templeId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: "#1F1F1F" }}>Live Streams</h2>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
          style={{ backgroundColor: "#C76A00", color: "#FFFFFF", fontWeight: 600 }}>
          <Plus size={15} />
          Schedule Stream
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Live Now", value: String(live), color: "#EF4444", bg: "#FFF1F2" },
          { label: "Total Views", value: "—", color: "#C76A00", bg: "#FFF0E6" },
          { label: "Avg Quality", value: "HD 1080p", color: "#22C55E", bg: "#F0FDF4" },
          { label: "Total Streams", value: String(streams.length), color: "#4A1259", bg: "#F3E8FF" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
            <div className="text-xl" style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 border flex flex-wrap items-center gap-3" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
        <div className="flex items-center gap-1.5">
          {["All", "Scheduled", "Live", "Ended", "Archived"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ backgroundColor: filter === f ? "#C76A00" : "#FAF6F2", color: filter === f ? "#FFFFFF" : "#6B7280", fontWeight: filter === f ? 600 : 400, border: "1px solid", borderColor: filter === f ? "#C76A00" : "rgba(199,106,0,0.15)" }}>
              {f === "All" ? "All Streams" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(s => {
          const sc = streamStatusCfg[s.streamStatus] || streamStatusCfg.Scheduled;
          return (
            <div key={s.id} className="bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow flex flex-col" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
              <div className="h-36 relative flex items-center justify-center bg-gray-900 bg-cover bg-center" style={{ backgroundImage: s.thumbnailUrl ? `url(${s.thumbnailUrl})` : "none", backgroundBlendMode: s.thumbnailUrl ? 'overlay' : 'normal', backgroundColor: s.thumbnailUrl ? 'rgba(0,0,0,0.4)' : '#1E0A3C' }}>
                {s.streamStatus === "Live" ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Radio size={48} className="text-white opacity-20" />
                    </div>
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: "#EF4444" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-white text-xs" style={{ fontWeight: 700 }}>LIVE</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Clock size={28} className="text-white/30 mx-auto mb-2" />
                    <div className="text-white/50 text-xs font-bold">
                      {s.streamStatus}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-sm" style={{ color: "#1F1F1F", fontWeight: 600 }}>{s.title}</div>
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 600 }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
                    {s.streamStatus}
                  </span>
                </div>
                <div className="text-xs mb-1" style={{ color: "#C76A00", fontWeight: 500 }}>{s.templeName}</div>
                <div className="text-xs mb-3" style={{ color: "#9CA3AF" }}>{s.poojaName} | {s.priestName}</div>
                
                <div className="mt-auto space-y-1 text-[10px] text-gray-400 font-mono">
                  {s.actualStartTime && <div>Start: {formatTimestamp(s.actualStartTime)}</div>}
                  {s.actualEndTime && <div>End: {formatTimestamp(s.actualEndTime)}</div>}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(199,106,0,0.08)" }}>
                  {s.streamStatus === "Scheduled" && (
                     <button onClick={() => handleStatusUpdate(s.id, "Live", s.templeId)} className="flex-1 py-1.5 rounded-lg text-xs bg-red-100 text-red-700 font-bold hover:bg-red-200">Go Live</button>
                  )}
                  {s.streamStatus === "Live" && (
                     <button onClick={() => handleStatusUpdate(s.id, "Ended", s.templeId)} className="flex-1 py-1.5 rounded-lg text-xs bg-orange-100 text-orange-700 font-bold hover:bg-orange-200">End Stream</button>
                  )}
                  {s.streamStatus === "Ended" && (
                     <button onClick={() => handleStatusUpdate(s.id, "Archived", s.templeId)} className="flex-1 py-1.5 rounded-lg text-xs bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">Archive</button>
                  )}
                  <button onClick={() => setEditStream(s)} className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-200" title="Edit Stream Integration"><Settings size={14}/></button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500">No streams found.</div>
        )}
      </div>

      {/* Schedule Stream Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setForm(emptyForm); setErrorMsg(""); }} title="Schedule Live Stream" width="500px">
        <div className="px-6 py-5 space-y-4">
          {errorMsg && <div className="text-red-500 text-xs">{errorMsg}</div>}
          <Field label="Title">
            <input className={inputCls} style={inputStyle} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
          </Field>
          <Field label="Temple">
            <select className={inputCls} style={selectStyle} value={form.templeId} onChange={e => setForm(f => ({...f, templeId: e.target.value, poojaId: "", priestId: "", slotId: ""}))}>
              <option value="">Select Temple...</option>
              {temples.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          {form.templeId && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Pooja">
                  <select className={inputCls} style={selectStyle} value={form.poojaId} onChange={e => setForm(f => ({...f, poojaId: e.target.value}))}>
                    <option value="">Select Pooja...</option>
                    {validPoojas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
                <Field label="Priest">
                  <select className={inputCls} style={selectStyle} value={form.priestId} onChange={e => setForm(f => ({...f, priestId: e.target.value}))}>
                    <option value="">Select Priest...</option>
                    {validPriests.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Slot">
                <select className={inputCls} style={selectStyle} value={form.slotId} onChange={e => setForm(f => ({...f, slotId: e.target.value}))}>
                  <option value="">Select Slot...</option>
                  {validSlots.map(s => <option key={s.id} value={s.id}>{formatTimestamp(s.startTime)} - {formatTimestamp(s.endTime)}</option>)}
                </select>
              </Field>
            </>
          )}
          <div className="mt-4 p-4 bg-gray-50 border rounded-lg space-y-3">
             <div className="text-xs font-bold text-gray-500">TODO: Future YouTube Live API Integration</div>
             <Field label="YouTube Video ID (Placeholder)">
               <input className={inputCls} style={inputStyle} value={form.youtubeVideoId} onChange={e => setForm(f => ({...f, youtubeVideoId: e.target.value}))} />
             </Field>
          </div>
        </div>
        <ModalFooter onClose={() => { setCreateOpen(false); setForm(emptyForm); }} onSubmit={handleCreate} submitLabel="Schedule" saving={saving} />
      </Modal>

      {/* Edit Stream Modal */}
      <Modal open={!!editStream} onClose={() => setEditStream(null)} title="Update Stream Information" width="400px">
        {editStream && (
          <div className="px-6 py-5 space-y-4">
            <div className="text-xs font-bold text-gray-500 mb-2">TODO: Future YouTube Live API Integration</div>
            <Field label="YouTube Video ID">
              <input className={inputCls} style={inputStyle} value={editStream.youtubeVideoId || ""} onChange={e => setEditStream({...editStream, youtubeVideoId: e.target.value})} />
            </Field>
            <Field label="YouTube Live URL">
              <input className={inputCls} style={inputStyle} value={editStream.youtubeLiveUrl || ""} onChange={e => setEditStream({...editStream, youtubeLiveUrl: e.target.value})} />
            </Field>
            <Field label="Thumbnail URL">
              <input className={inputCls} style={inputStyle} value={editStream.thumbnailUrl || ""} onChange={e => setEditStream({...editStream, thumbnailUrl: e.target.value})} />
            </Field>
          </div>
        )}
        <ModalFooter onClose={() => setEditStream(null)} onSubmit={handleUpdate} submitLabel="Save" saving={saving} />
      </Modal>
    </div>
  );
}
