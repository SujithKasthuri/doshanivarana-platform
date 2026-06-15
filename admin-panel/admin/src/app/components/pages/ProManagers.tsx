import { useState, useEffect } from "react";
import { Modal, Field, ModalFooter, inputCls, inputStyle } from "../Modal";
import { MapPin, Search, Plus, Edit, Eye, Star, Mail, Power, KeyRound } from "lucide-react";
import { FirebaseUsersService } from "../../../services/firebase/users";
import { TemplesService } from "../../../services/firebase/temples";
import { useAuth } from "../../../contexts/AuthContext";

const proColors = ["#C76A00", "#4A1259", "#D4A017", "#22C55E", "#6366F1", "#EF4444", "#2563EB", "#0891B2"];
const emptyForm = { name: "", email: "", phone: "", templeId: "", location: "", password: "", confirmPassword: "" };

export function PROManagersPage() {
  const [managers, setManagers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [successModal, setSuccessModal] = useState<any | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [temples, setTemples] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = FirebaseUsersService.subscribeToProUsers((users) => {
      // Map Firestore users to UI format
      const mapped = users.map((u, i) => ({
        ...u,
        id: u.uid,
        avatar: u.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "PR",
        temples: 1, // Currently linked to 1 templeId based on structure
        location: (u as any).location || "India", 
        phone: (u as any).phone || "N/A",
        revenue: "₹0",
        bookings: 0,
        rating: 5.0,
        status: u.isActive ? "Active" : "Inactive",
        since: "Just Now",
        color: proColors[i % proColors.length],
      }));
      setManagers(mapped);
    });
    
    const fetchTemples = async () => {
      try {
        const data = await TemplesService.getTemples();
        setTemples(data);
      } catch (e) {
        console.error("Failed to load temples", e);
      }
    };
    fetchTemples();

    return () => unsubscribe();
  }, []);

  const filtered = managers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const avgTemples = managers.length > 0
    ? (managers.reduce((s, m) => s + m.temples, 0) / managers.length).toFixed(1)
    : "0";

  async function handleAdd() {
    if (!form.name || !form.email || !form.templeId || !form.password || !form.confirmPassword) {
      alert("Please fill all required fields.");
      return;
    }
    
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    
    // Strict Temple Validation
    const templeObj = temples.find(t => t.id === form.templeId);
    if (!templeObj) {
      alert("Please select a valid Temple.");
      return;
    }

    setSaving(true);
    try {
      await FirebaseUsersService.createProUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        templeId: form.templeId,
        password: form.password
      }, user?.uid || "system");
      
      const templeObj = temples.find(t => t.id === form.templeId);
      setSuccessModal({
        name: form.name,
        email: form.email,
        templeName: templeObj ? templeObj.name : form.templeId
      });
      
      setAddOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(p: any) {
    setEditTarget(p);
    setForm({ name: p.name, location: p.location, email: p.email, phone: p.phone, templeId: p.templeId || "temple_001" });
  }

  async function handleEdit() {
    if (!editTarget || !form.name) return;
    setSaving(true);
    try {
      await FirebaseUsersService.updateProUser(editTarget.uid, {
        name: form.name,
        phone: form.phone,
        templeId: form.templeId
      }, user?.uid || "system");
      setEditTarget(null);
      setForm(emptyForm);
    } catch (err: any) {
      alert("Failed to update: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(m: any) {
    setActionLoading(m.uid);
    try {
      await FirebaseUsersService.toggleActiveStatus(m.uid, m.isActive);
    } catch (error: any) {
      alert("Failed to toggle status: " + error.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetPassword(m: any) {
    if (!window.confirm(`Send password reset email to ${m.email}?`)) return;
    setActionLoading(m.uid + "_reset");
    try {
      await FirebaseUsersService.triggerPasswordReset(m.email);
      alert(`Password reset email sent to ${m.email}`);
    } catch (error: any) {
      alert("Failed to send reset email: " + error.message);
    } finally {
      setActionLoading(null);
    }
  }

  function closeModal() {
    setAddOpen(false);
    setEditTarget(null);
    setForm(emptyForm);
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total PRO Managers", value: String(managers.length), color: "#C76A00", bg: "#FFF0E6" },
          { label: "Active", value: String(managers.filter(m => m.isActive).length), color: "#22C55E", bg: "#F0FDF4" },
          { label: "Avg Temples Managed", value: avgTemples, color: "#4A1259", bg: "#F3E8FF" },
          { label: "Avg Revenue", value: "₹0", color: "#D4A017", bg: "#FFFBEB" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
            <div className="text-xl" style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Add */}
      <div className="bg-white rounded-xl p-4 border flex items-center gap-3" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
          <input type="text" placeholder="Search PRO managers..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: "#FAF6F2", border: "1px solid rgba(199,106,0,0.15)", color: "#1F1F1F" }} />
        </div>
        <button onClick={() => { setForm(emptyForm); setAddOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: "#C76A00", color: "#FFFFFF", fontWeight: 600 }}>
          <Plus size={15} /> Add PRO Manager
        </button>
      </div>

      {/* Manager Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border hover:shadow-md transition-shadow overflow-hidden relative" style={{ borderColor: "rgba(199,106,0,0.1)", opacity: p.isActive ? 1 : 0.65 }}>
            <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${p.color}, ${p.color}66)` }} />
            <div className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: p.color, fontWeight: 700, fontSize: "16px" }}>{p.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm flex items-center gap-2" style={{ color: "#1F1F1F", fontWeight: 700 }}>
                    {p.name}
                    {!p.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">Deactivated</span>}
                  </div>
                  <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                    <Mail size={10} /> {p.email}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={11} fill="#D4A017" style={{ color: "#D4A017" }} />
                    <span className="text-xs" style={{ color: "#1F1F1F", fontWeight: 600 }}>{p.rating}</span>
                    <span className="text-xs ml-1" style={{ color: "#9CA3AF" }}>· Temple: {p.templeId}</span>
                  </div>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                 <button onClick={() => handleToggleStatus(p)} disabled={!!actionLoading} className="p-2 rounded-lg text-center flex items-center justify-center gap-2 border" style={{ backgroundColor: "#FAF6F2", borderColor: "rgba(199,106,0,0.1)", cursor: actionLoading ? 'wait' : 'pointer' }}>
                   <Power size={13} color={p.isActive ? '#EF4444' : '#22C55E'} />
                   <div className="text-xs font-semibold" style={{ color: "#4A1259" }}>{p.isActive ? "Deactivate" : "Activate"}</div>
                 </button>
                 <button onClick={() => handleResetPassword(p)} disabled={!!actionLoading} className="p-2 rounded-lg text-center flex items-center justify-center gap-2 border" style={{ backgroundColor: "#FAF6F2", borderColor: "rgba(199,106,0,0.1)", cursor: actionLoading ? 'wait' : 'pointer' }}>
                   <KeyRound size={13} color='#0891B2' />
                   <div className="text-xs font-semibold" style={{ color: "#0891B2" }}>Reset Password</div>
                 </button>
              </div>

              <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "rgba(199,106,0,0.08)" }}>
                <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs" style={{ backgroundColor: "#FFF0E6", color: "#C76A00", fontWeight: 600 }}><Eye size={11} /> View</button>
                <button onClick={() => openEdit(p)} className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: "#F3EDE8", color: "#6B7280", fontWeight: 600 }}><Edit size={11} /> Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={closeModal} title="Add PRO Manager">
        <div className="px-6 py-5 space-y-4">
          <Field label="Full Name">
            <input className={inputCls} style={inputStyle} placeholder="e.g. Ravi Shankar K." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Email Address (Login ID)">
            <input className={inputCls} style={inputStyle} type="email" placeholder="email@doshanivarana.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} style={inputStyle} placeholder="+91 98XXX XXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </Field>
          <Field label="Temple Assignment">
            <select className={inputCls} style={inputStyle} value={form.templeId} onChange={e => setForm(f => ({ ...f, templeId: e.target.value }))}>
              <option value="" disabled>Select a Temple</option>
              {temples.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Password">
            <input className={inputCls} style={inputStyle} type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </Field>
          <Field label="Confirm Password">
            <input className={inputCls} style={inputStyle} type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
          </Field>
        </div>
        <ModalFooter onClose={closeModal} onSubmit={handleAdd} submitLabel="Create Manager" saving={saving} />
      </Modal>

      {/* Success Modal */}
      <Modal open={!!successModal} onClose={() => setSuccessModal(null)} title="PRO Manager Created Successfully">
        <div className="px-6 py-5 space-y-4">
          <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200">
            <p className="font-semibold mb-2 text-sm">PRO Manager Details:</p>
            <ul className="text-sm space-y-1">
              <li><strong>Name:</strong> {successModal?.name}</li>
              <li><strong>Email:</strong> {successModal?.email}</li>
              <li><strong>Temple:</strong> {successModal?.templeName}</li>
            </ul>
          </div>
          <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="font-semibold text-blue-900 mb-1">Account Ready</p>
            <p>The PRO Manager can immediately log in to the PRO Dashboard using the provided email and password.</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: "rgba(199,106,0,0.1)", backgroundColor: "#FAF6F2" }}>
          <button onClick={() => setSuccessModal(null)} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">
            Done
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={closeModal} title={editTarget ? `Edit — ${editTarget.name}` : "Edit PRO Manager"}>
        <div className="px-6 py-5 space-y-4">
          <Field label="Full Name">
            <input className={inputCls} style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Email (Read Only)">
            <input className={inputCls} style={inputStyle} type="email" disabled value={form.email} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </Field>
          <Field label="Assigned Temple">
            <select className={inputCls} style={inputStyle} value={form.templeId} onChange={e => setForm(f => ({ ...f, templeId: e.target.value }))}>
              <option value="" disabled>Select a Temple</option>
              {temples.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <ModalFooter onClose={closeModal} onSubmit={handleEdit} submitLabel="Save Changes" saving={saving} />
      </Modal>
    </div>
  );
}
