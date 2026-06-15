import { useState, useEffect } from "react";
import { Modal, Field, ModalFooter, inputCls, inputStyle, selectStyle } from "../Modal";
import { Flame, Search, Plus, Edit, Eye, Star, CheckCircle, XCircle } from "lucide-react";

import { PoojasService } from "../../../services/firebase/poojas";
import { TemplesService } from "../../../services/firebase/temples";
import { CategoriesService } from "../../../services/firebase/categories";

const emptyPoojaForm = { name: "", categoryId: "", duration: "", price: "", liveStream: true, prasad: true, templeId: "" };

function genId() { return "pj" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export function PoojasPage() {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [poojasState, setPoojasState] = useState<any[]>([]);
  const [form, setForm] = useState(emptyPoojaForm);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(emptyPoojaForm);
  const [temples, setTemples] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = PoojasService.subscribeToPoojas(setPoojasState);
    TemplesService.getTemples().then(setTemples).catch(console.error);
    CategoriesService.getCategories().then(setCategories).catch(console.error);
    return () => unsubscribe();
  }, []);

  const filtered = poojasState.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.categoryName || "").toLowerCase().includes(search.toLowerCase()));

  async function handleAdd() {
    if (!form.name || !form.duration || !form.price || !form.templeId) {
      alert("Please fill all required fields (including Temple ID).");
      return;
    }
    const numericPrice = parseInt(form.price.replace(/[^0-9]/g, ''), 10) || 0;
    
    try {
      const selectedCategory = categories.find(c => c.id === form.categoryId);
      const selectedTemple = temples.find(t => t.id === form.templeId);

      const newId = genId();
      await PoojasService.createPooja(newId, {
        name: form.name,
        categoryId: form.categoryId,
        categoryName: selectedCategory ? selectedCategory.name : "",
        duration: form.duration,
        price: numericPrice,
        priceDisplay: form.price.startsWith("₹") ? form.price : `₹${form.price}`,
        templesCount: 0,
        bookings: 0,
        rating: 5.0,
        liveStream: form.liveStream,
        prasad: form.prasad,
        templeId: form.templeId,
        templeName: selectedTemple ? selectedTemple.name : "",
        status: "Active",
        isActive: true
      });
      setForm(emptyPoojaForm);
      setAddOpen(false);
    } catch (error: any) {
      alert("Error adding pooja: " + error.message);
    }
  }

  function openEdit(p: any) {
    setEditTarget(p);
    setEditForm({
      name: p.name,
      categoryId: p.categoryId || "",
      duration: p.duration,
      price: p.priceDisplay ? p.priceDisplay.replace("₹", "") : p.price,
      liveStream: p.liveStream,
      prasad: p.prasad,
      templeId: p.templeId || ""
    });
  }

  function closeEditModal() {
    setEditTarget(null);
    setEditForm(emptyPoojaForm);
  }

  async function handleEdit() {
    if (!editTarget) return;
    const numericPrice = parseInt(editForm.price.replace(/[^0-9]/g, ''), 10) || 0;
    
    try {
      const selectedCategory = categories.find(c => c.id === editForm.categoryId);
      const selectedTemple = temples.find(t => t.id === editForm.templeId);

      await PoojasService.updatePooja(editTarget.id, {
        name: editForm.name,
        categoryId: editForm.categoryId,
        categoryName: selectedCategory ? selectedCategory.name : "",
        duration: editForm.duration,
        price: numericPrice,
        priceDisplay: editForm.price.startsWith("₹") ? editForm.price : `₹${editForm.price}`,
        liveStream: editForm.liveStream,
        prasad: editForm.prasad,
        templeId: editForm.templeId,
        templeName: selectedTemple ? selectedTemple.name : "",
      });
      closeEditModal();
    } catch (error: any) {
      alert("Error updating pooja: " + error.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Poojas", value: poojasState.length, color: "#C76A00", bg: "#FFF0E6" },
          { label: "Active Services", value: poojasState.filter((p: any) => p.isActive).length, color: "#22C55E", bg: "#F0FDF4" },
          { label: "With Live Stream", value: poojasState.filter((p: any) => p.liveStream).length, color: "#EF4444", bg: "#FFF1F2" },
          { label: "With Prasad", value: poojasState.filter((p: any) => p.prasad).length, color: "#4A1259", bg: "#F3E8FF" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
            <div className="text-xl" style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 border flex items-center gap-3" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
          <input type="text" placeholder="Search poojas by name or category..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: "#FAF6F2", border: "1px solid rgba(199,106,0,0.15)", color: "#1F1F1F" }} />
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: "#C76A00", color: "#FFFFFF", fontWeight: 600 }}>
          <Plus size={15} /> Add Pooja
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderColor: "rgba(199,106,0,0.06)" }}>
          {filtered.map((p: any) => (
            <div key={p.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FFF0E6" }}>
                    <Flame size={14} style={{ color: "#C76A00" }} />
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: "#1F1F1F", fontWeight: 600 }}>{p.name}</div>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#F3E8FF", color: "#4A1259" }}>{p.categoryName || "Uncategorized"}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.status === "Active" ? "#F0FDF4" : "#FFFBEB", color: p.status === "Active" ? "#16A34A" : "#D97706", fontWeight: 600 }}>{p.status}</span>
              </div>
              <div className="flex items-center gap-4 text-xs flex-wrap">
                <span style={{ color: "#6B7280" }}>{p.duration}</span>
                <span style={{ color: "#1F1F1F", fontWeight: 700 }}>{p.priceDisplay}</span>
                <span className="flex items-center gap-1">
                  <Star size={11} fill="#D4A017" style={{ color: "#D4A017" }} />
                  <span style={{ fontWeight: 600 }}>{p.rating}</span>
                </span>
                <span style={{ color: "#6B7280" }}>{(p.bookings || 0).toLocaleString()} bookings</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {p.liveStream && <span className="flex items-center gap-1" style={{ color: "#22C55E" }}><CheckCircle size={11} /> Live</span>}
                {p.prasad && <span className="flex items-center gap-1" style={{ color: "#C76A00" }}><CheckCircle size={11} /> Prasad</span>}
                <div className="ml-auto flex gap-2">
                  <button className="p-2 rounded-lg" style={{ minHeight: "44px", minWidth: "44px" }}><Eye size={14} style={{ color: "#C76A00" }} /></button>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg" style={{ minHeight: "44px", minWidth: "44px" }}><Edit size={14} style={{ color: "#6B7280" }} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#FAF6F2" }}>
                {["Pooja Name", "Category", "Duration", "Price", "Temples", "Bookings", "Rating", "Live Stream", "Prasad", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9CA3AF", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-orange-50 transition-colors" style={{ borderColor: "rgba(199,106,0,0.06)" }}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FFF0E6" }}>
                        <Flame size={14} style={{ color: "#C76A00" }} />
                      </div>
                      <span className="text-xs" style={{ color: "#1F1F1F", fontWeight: 600 }}>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3E8FF", color: "#4A1259" }}>{p.categoryName || "Uncategorized"}</span></td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: "#6B7280" }}>{p.duration}</td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: "#1F1F1F", fontWeight: 600 }}>{p.priceDisplay}</td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: "#1F1F1F" }}>{p.templesCount}</td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: "#1F1F1F", fontWeight: 600 }}>{(p.bookings || 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Star size={11} fill="#D4A017" style={{ color: "#D4A017" }} />
                      <span className="text-xs" style={{ fontWeight: 600 }}>{p.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{p.liveStream ? <CheckCircle size={14} style={{ color: "#22C55E" }} /> : <XCircle size={14} style={{ color: "#D1D5DB" }} />}</td>
                  <td className="px-4 py-3.5">{p.prasad ? <CheckCircle size={14} style={{ color: "#22C55E" }} /> : <XCircle size={14} style={{ color: "#D1D5DB" }} />}</td>
                  <td className="px-4 py-3.5"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: p.status === "Active" ? "#F0FDF4" : "#FFFBEB", color: p.status === "Active" ? "#16A34A" : "#D97706", fontWeight: 600 }}>{p.status}</span></td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      <button className="p-1.5 rounded-lg hover:bg-orange-50"><Eye size={13} style={{ color: "#C76A00" }} /></button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-50"><Edit size={13} style={{ color: "#6B7280" }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Pooja Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setForm(emptyPoojaForm); }} title="Add New Pooja">
        <div className="px-6 py-5 space-y-4">
          <Field label="Pooja Name">
            <input className={inputCls} style={inputStyle} placeholder="e.g. Rudrabhishek" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Category">
            <select className={inputCls} style={selectStyle} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration">
              <input className={inputCls} style={inputStyle} placeholder="e.g. 1h 30m" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
            </Field>
            <Field label="Price (₹)">
              <input className={inputCls} style={inputStyle} placeholder="e.g. 2,400" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </Field>
          </div>
          <Field label="Temple">
            <select className={inputCls} style={selectStyle} value={form.templeId} onChange={e => setForm(f => ({ ...f, templeId: e.target.value }))}>
              <option value="">Select Temple</option>
              {temples.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.liveStream} onChange={e => setForm(f => ({ ...f, liveStream: e.target.checked }))} />
              <span className="text-sm" style={{ color: "#374151" }}>Live Stream</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.prasad} onChange={e => setForm(f => ({ ...f, prasad: e.target.checked }))} />
              <span className="text-sm" style={{ color: "#374151" }}>Prasad Delivery</span>
            </label>
          </div>
        </div>
        <ModalFooter onClose={() => { setAddOpen(false); setForm(emptyPoojaForm); }} onSubmit={handleAdd} submitLabel="Add Pooja" saving={false} />
      </Modal>

      {/* Edit Pooja Modal */}
      <Modal open={!!editTarget} onClose={closeEditModal} title={`Edit Pooja — ${editTarget?.name ?? ""}`}>
        <div className="px-6 py-5 space-y-4">
          <Field label="Pooja Name">
            <input className={inputCls} style={inputStyle} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Category">
            <select className={inputCls} style={selectStyle} value={editForm.categoryId} onChange={e => setEditForm(f => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration">
              <input className={inputCls} style={inputStyle} value={editForm.duration} onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))} />
            </Field>
            <Field label="Price (₹)">
              <input className={inputCls} style={inputStyle} value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
            </Field>
          </div>
          <Field label="Temple">
            <select className={inputCls} style={selectStyle} value={editForm.templeId} onChange={e => setEditForm(f => ({ ...f, templeId: e.target.value }))}>
              <option value="">Select Temple</option>
              {temples.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editForm.liveStream} onChange={e => setEditForm(f => ({ ...f, liveStream: e.target.checked }))} />
              <span className="text-sm" style={{ color: "#374151" }}>Live Stream</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editForm.prasad} onChange={e => setEditForm(f => ({ ...f, prasad: e.target.checked }))} />
              <span className="text-sm" style={{ color: "#374151" }}>Prasad Delivery</span>
            </label>
          </div>
        </div>
        <ModalFooter onClose={closeEditModal} onSubmit={handleEdit} submitLabel="Save Changes" saving={false} />
      </Modal>
    </div>
  );
}
