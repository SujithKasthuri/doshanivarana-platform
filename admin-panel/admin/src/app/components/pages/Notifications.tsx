import { useState, useEffect } from "react";
import { Bell, Smartphone, Mail, MessageSquare, Radio, Package, PartyPopper, Plus, Send, Eye, Trash2, CheckCircle, Clock } from "lucide-react";
import { Modal, Field, ModalFooter, inputCls, inputStyle, selectStyle } from "../Modal";
import { NotificationsService, TargetAudience } from "../../../services/firebase/notifications";
import { TemplesService } from "../../../services/firebase/temples";
import { formatTimestamp } from "../../../services/firebase/core";
import { Timestamp } from "firebase/firestore";

const notifTypes = [
  { id: "push", label: "Push Notifications", icon: Bell, count: 284, color: "#C76A00", bg: "#FFF0E6" },
  { id: "sms", label: "SMS Alerts", icon: Smartphone, count: 142, color: "#4A1259", bg: "#F3E8FF" },
  { id: "email", label: "Email Campaigns", icon: Mail, count: 68, color: "#D4A017", bg: "#FFFBEB" },
  { id: "live", label: "Live Stream Alerts", icon: Radio, count: 18, color: "#EF4444", bg: "#FFF1F2" },
];

const statusConfig: Record<string, { bg: string; color: string; icon: typeof CheckCircle }> = {
  Sent: { bg: "#F0FDF4", color: "#16A34A", icon: CheckCircle },
  Scheduled: { bg: "#EFF6FF", color: "#2563EB", icon: Clock },
  Draft: { bg: "#F3F4F6", color: "#9CA3AF", icon: Bell },
};

const AUDIENCES: TargetAudience[] = ["All Users", "All PRO Managers", "Temple Specific", "Recent Devotees", "Custom"];

export function Notifications() {
  const [activeTab, setActiveTab] = useState("all");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [temples, setTemples] = useState<any[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const emptyCampaignForm = {
    title: "",
    body: "",
    targetAudience: "All Users" as TargetAudience,
    targetTempleId: "",
    scheduledAt: "", // datetime-local format
  };
  const [form, setForm] = useState(emptyCampaignForm);

  useEffect(() => {
    const unsub = NotificationsService.subscribeToCampaigns(setCampaigns);
    TemplesService.getTemples().then(setTemples).catch(console.error);
    return () => unsub();
  }, []);

  async function handleCreateCampaign() {
    if (!form.title || !form.body) {
      setErrorMsg("Title and Message are required.");
      return;
    }
    if (form.targetAudience === "Temple Specific" && !form.targetTempleId) {
      setErrorMsg("Please select a temple.");
      return;
    }

    let scheduledAtTimestamp: Timestamp | null = null;
    if (form.scheduledAt) {
      const d = new Date(form.scheduledAt);
      if (d.getTime() <= Date.now()) {
        setErrorMsg("Scheduled time must be in the future.");
        return;
      }
      scheduledAtTimestamp = Timestamp.fromDate(d);
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const newId = `NC${Date.now()}`;
      await NotificationsService.createCampaign(newId, {
        title: form.title,
        body: form.body,
        targetAudience: form.targetAudience,
        targetTempleId: form.targetAudience === "Temple Specific" ? form.targetTempleId : null,
        scheduledAt: scheduledAtTimestamp,
        status: "Draft",
      });
      setCreateOpen(false);
      setForm(emptyCampaignForm);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendOrSchedule(campaign: any) {
    try {
      if (campaign.scheduledAt) {
        await NotificationsService.updateCampaign(campaign.id, { status: "Scheduled" });
      } else {
        await NotificationsService.updateCampaign(campaign.id, { status: "Sent" });
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this campaign?")) {
      await NotificationsService.softDeleteCampaign(id);
    }
  }

  const filtered = campaigns.filter(c => {
    // Tab filter can be added here if needed, for now all
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {notifTypes.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.id} className="bg-white rounded-xl p-4 border" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bg }}>
                  <Icon size={18} style={{ color: t.color }} />
                </div>
                <div className="text-xl" style={{ color: "#1F1F1F", fontWeight: 700 }}>{t.count}</div>
              </div>
              <div className="text-xs" style={{ color: "#6B7280" }}>{t.label}</div>
            </div>
          );
        })}
      </div>

      {/* Compose button + filters */}
      <div className="bg-white rounded-xl p-4 border flex items-center gap-3 flex-wrap" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
        <div className="flex items-center gap-1.5">
          {["all", "push", "sms", "email", "live"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded-lg text-xs capitalize transition-all"
              style={{ backgroundColor: activeTab === tab ? "#C76A00" : "#FAF6F2", color: activeTab === tab ? "#FFFFFF" : "#6B7280", fontWeight: activeTab === tab ? 600 : 400, border: "1px solid", borderColor: activeTab === tab ? "#C76A00" : "rgba(199,106,0,0.15)" }}>
              {tab === "all" ? "All Campaigns" : tab.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm ml-auto"
          style={{ backgroundColor: "#C76A00", color: "#FFFFFF", fontWeight: 600 }}>
          <Plus size={15} />
          Create Campaign
        </button>
      </div>

      {/* Campaigns table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderColor: "rgba(199,106,0,0.06)" }}>
          {filtered.map((c) => {
            const sc = statusConfig[c.status] || statusConfig.Draft;
            const StatusIcon = sc.icon;
            const openRate = c.deliveryCount > 0 ? Math.round((c.readCount / c.deliveryCount) * 100) : 0;
            return (
              <div key={c.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ color: "#1F1F1F", fontWeight: 600 }}>{c.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{c.targetAudience}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 600 }}>
                    <StatusIcon size={10} />{c.status}
                  </span>
                  {c.deliveryCount > 0 && <span style={{ color: "#6B7280" }}>{c.deliveryCount.toLocaleString()} sent · {openRate}% open rate</span>}
                  <span style={{ color: "#9CA3AF" }}>{c.scheduledAt ? formatTimestamp(c.scheduledAt) : "—"}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  {c.status === "Draft" && <button onClick={() => handleSendOrSchedule(c)} className="p-2 rounded-lg bg-green-50 text-green-500 flex items-center gap-1"><Send size={14}/> Send/Schedule</button>}
                  <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg bg-red-50 text-red-500"><Trash2 size={14} /></button>
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
                {["Campaign", "Target Audience", "Sent", "Opened / Read", "Open Rate", "Scheduled/Sent Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs whitespace-nowrap" style={{ color: "#9CA3AF", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const sc = statusConfig[c.status] || statusConfig.Draft;
                const StatusIcon = sc.icon;
                const openRate = c.deliveryCount > 0 ? Math.round((c.readCount / c.deliveryCount) * 100) : 0;
                return (
                  <tr key={c.id} className="border-t hover:bg-orange-50 transition-colors" style={{ borderColor: "rgba(199,106,0,0.06)" }}>
                    <td className="px-5 py-3.5">
                      <div className="text-xs" style={{ color: "#1F1F1F", fontWeight: 600 }}>{c.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#9CA3AF", fontFamily: "monospace" }}>{c.id}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#6B7280" }}>
                      {c.targetAudience}
                      {c.targetAudience === "Temple Specific" && <span className="block text-[10px]">{temples.find(t=>t.id===c.targetTempleId)?.name || c.targetTempleId}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#1F1F1F", fontWeight: 600 }}>{c.deliveryCount > 0 ? c.deliveryCount.toLocaleString() : "—"}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#1F1F1F" }}>{c.readCount > 0 ? c.readCount.toLocaleString() : "—"}</td>
                    <td className="px-5 py-3.5">
                      {c.deliveryCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: "#F3EDE8" }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${openRate}%`, backgroundColor: "#22C55E" }} />
                          </div>
                          <span className="text-xs" style={{ color: "#1F1F1F", fontWeight: 600 }}>{openRate}%</span>
                        </div>
                      ) : <span className="text-xs" style={{ color: "#9CA3AF" }}>—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#9CA3AF" }}>
                      {c.status === "Sent" ? formatTimestamp(c.sentAt) : (c.scheduledAt ? formatTimestamp(c.scheduledAt) : "—")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon size={11} style={{ color: sc.color }} />
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 600 }}>
                          {c.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button className="p-1.5 rounded-lg hover:bg-orange-50 transition-colors"><Eye size={13} style={{ color: "#C76A00" }} /></button>
                        {c.status === "Draft" && <button onClick={() => handleSendOrSchedule(c)} className="p-1.5 rounded-lg hover:bg-green-50 transition-colors" title="Send or Schedule"><Send size={13} style={{ color: "#22C55E" }} /></button>}
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={13} style={{ color: "#EF4444" }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick notification categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Festival Announcements", icon: PartyPopper, desc: "Notify all users about upcoming festivals, special events, and seasonal offerings.", count: 6, color: "#D4A017", bg: "#FFFBEB" },
          { label: "Live Stream Alerts", icon: Radio, desc: "Auto-send alerts to subscribers when a live stream starts at their followed temples.", count: 18, color: "#EF4444", bg: "#FFF1F2" },
          { label: "Delivery Notifications", icon: Package, desc: "Automated prasad delivery tracking notifications sent at each delivery milestone.", count: 312, color: "#4A1259", bg: "#F3E8FF" },
        ].map((c) => {
          const CIcon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl p-5 border" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.bg }}>
                  <CIcon size={20} style={{ color: c.color }} />
                </div>
                <div>
                  <div className="text-sm" style={{ color: "#1F1F1F", fontWeight: 600 }}>{c.label}</div>
                  <div className="text-xs" style={{ color: "#9CA3AF" }}>{c.count} active</div>
                </div>
              </div>
              <p className="text-xs mb-3" style={{ color: "#6B7280", lineHeight: 1.6 }}>{c.desc}</p>
              <button className="text-xs" style={{ color: c.color, fontWeight: 600 }}>Manage →</button>
            </div>
          );
        })}
      </div>

      {/* Create Campaign Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setForm(emptyCampaignForm); }} title="Create Notification Campaign" width="520px">
        <div className="px-6 py-5 space-y-4">
          {errorMsg && <div className="text-red-500 text-xs">{errorMsg}</div>}
          <Field label="Campaign Title">
            <input className={inputCls} style={inputStyle} placeholder="e.g. Navratri Special Packages — Book Now!" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </Field>
          
          <div className="grid grid-cols-2 gap-4">
            <Field label="Target Audience">
              <select className={inputCls} style={selectStyle} value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value as TargetAudience }))}>
                {AUDIENCES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            {form.targetAudience === "Temple Specific" && (
              <Field label="Select Temple">
                <select className={inputCls} style={selectStyle} value={form.targetTempleId} onChange={e => setForm(f => ({ ...f, targetTempleId: e.target.value }))}>
                  <option value="">Select temple...</option>
                  {temples.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
            )}
          </div>
          <Field label="Message / Body">
            <textarea className={inputCls} style={{ ...inputStyle, resize: "none" }} rows={3} placeholder="Write your notification message..." value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          </Field>
          <div className="rounded-xl p-4" style={{ backgroundColor: "#FAF6F2", border: "1px solid rgba(199,106,0,0.12)" }}>
            <div className="text-xs mb-3" style={{ color: "#9CA3AF", fontWeight: 600 }}>SCHEDULE (optional — leave blank to save as Draft)</div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Send Date & Time">
                <input type="datetime-local" className={inputCls} style={inputStyle} value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </Field>
            </div>
          </div>
        </div>
        <ModalFooter onClose={() => { setCreateOpen(false); setForm(emptyCampaignForm); }} onSubmit={handleCreateCampaign} submitLabel="Save Draft" saving={saving} />
      </Modal>
    </div>
  );
}
