import { useState, useEffect } from "react";
import { Modal, Field, ModalFooter, inputCls, inputStyle, selectStyle } from "../Modal";
import {
  Radio, Eye, Users, Clock, Wifi, WifiOff, Video, Play, Download,
  Package, MapPin, CheckCircle, AlertCircle, Truck, MessageCircle,
  Flag, Star, ChevronDown, Search, Plus, Edit, XCircle, Filter,
  Briefcase, Building2, UserCircle, TrendingUp, IndianRupee,
  Flame, Tag, Globe, RefreshCcw, BarChart2, ArrowUpRight,
  ClipboardList, PowerOff, Send, CheckCircle2, HardDrive, LayoutGrid,
  List, Calendar, ChevronRight, Reply, MoreVertical, Phone, Mail,
  TriangleAlert, Inbox, Timer, ArrowLeft
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

import { TempleRequestsService } from "../../../services/firebase/templeRequests";
import { useAuth } from "../../../contexts/AuthContext";

const trStatusCfg: Record<string, { bg: string; color: string }> = {
  "Pending Review": { bg: "#FFFBEB", color: "#D97706" },
  "Under Verification": { bg: "#EFF6FF", color: "#2563EB" },
  Approved: { bg: "#F0FDF4", color: "#16A34A" },
  Rejected: { bg: "#FFF1F2", color: "#DC2626" },
};

export function TempleRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = TempleRequestsService.subscribeToRequests(setRequests);
    return () => unsubscribe();
  }, []);

  async function updateStatus(id: string, status: string) {
    if (!user) return;
    setLoadingAction(id);
    try {
      await TempleRequestsService.updateRequestStatus(id, status, user.uid);
    } catch (error: any) {
      alert("Error updating status: " + error.message);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleApproveAndCreate(id: string) {
    if (!user) return;
    if (!confirm("Approve this request and automatically create a new Temple?")) return;
    setLoadingAction(id);
    try {
      const newTempleId = await TempleRequestsService.createTempleFromRequest(id, user.uid);
      alert(`Temple created successfully with ID: ${newTempleId}`);
    } catch (error: any) {
      alert("Error creating temple: " + error.message);
    } finally {
      setLoadingAction(null);
    }
  }

  const pending = requests.filter(r => r.status === "Pending Review").length;
  const verifying = requests.filter(r => r.status === "Under Verification").length;
  const approved = requests.filter(r => r.status === "Approved").length;
  const rejected = requests.filter(r => r.status === "Rejected").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending Review", value: String(pending), color: "#D97706", bg: "#FFFBEB" },
          { label: "Under Verification", value: String(verifying), color: "#2563EB", bg: "#EFF6FF" },
          { label: "Approved", value: String(approved), color: "#22C55E", bg: "#F0FDF4" },
          { label: "Rejected", value: String(rejected), color: "#EF4444", bg: "#FFF1F2" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
            <div className="text-xl" style={{ color: s.color, fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "rgba(199,106,0,0.1)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(199,106,0,0.08)" }}>
          <h3 style={{ color: "#1F1F1F", fontWeight: 600 }}>Temple Onboarding Requests</h3>
          <p style={{ color: "#9CA3AF", fontSize: "12px" }}>Review, verify and approve temple onboarding submissions</p>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderColor: "rgba(199,106,0,0.06)" }}>
          {requests.map(r => {
            const sc = trStatusCfg[r.status] || trStatusCfg["Pending Review"];
            return (
              <div key={r.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FFF0E6" }}>
                      <Building2 size={16} style={{ color: "#C76A00" }} />
                    </div>
                    <div>
                      <div className="text-sm" style={{ color: "#1F1F1F", fontWeight: 600 }}>{r.name}</div>
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>{r.location}</div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 600 }}>{r.status}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>{r.type}</span>
                  <span className="text-xs" style={{ color: "#6B7280" }}>{r.deity}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: r.docs === "Complete" ? "#F0FDF4" : "#FFF1F2", color: r.docs === "Complete" ? "#16A34A" : "#DC2626", fontWeight: 600 }}>{r.docs} Docs</span>
                </div>
                <div className="text-xs" style={{ color: "#6B7280" }}>{r.contact} · {r.submitted}</div>
                {(r.status === "Pending Review" || r.status === "Under Verification") && (
                  <div className="flex flex-col gap-2 pt-1">
                    <button disabled={loadingAction === r.id} onClick={() => handleApproveAndCreate(r.id)} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs" style={{ backgroundColor: "#F0FDF4", color: "#16A34A", fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Approve & Create Temple
                    </button>
                    <div className="flex gap-2">
                      <button disabled={loadingAction === r.id} onClick={() => updateStatus(r.id, "Under Verification")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs" style={{ backgroundColor: "#EFF6FF", color: "#2563EB", fontWeight: 600 }}>
                        <Clock size={14} /> Verify
                      </button>
                      <button disabled={loadingAction === r.id} onClick={() => updateStatus(r.id, "Rejected")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs" style={{ backgroundColor: "#FFF1F2", color: "#DC2626", fontWeight: 600 }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                )}
                {r.status === "Approved" && <div className="text-xs py-2 text-center rounded-xl" style={{ backgroundColor: "#F0FDF4", color: "#16A34A", fontWeight: 600 }}>✓ Approved</div>}
                {r.status === "Rejected" && <div className="text-xs py-2 text-center rounded-xl" style={{ backgroundColor: "#FFF1F2", color: "#DC2626", fontWeight: 600 }}>✗ Rejected</div>}
              </div>
            );
          })}
        </div>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#FAF6F2" }}>
                {["ID", "Temple Name", "Location", "Deity", "Type", "Contact", "Submitted", "Docs", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9CA3AF", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map(r => {
                const sc = trStatusCfg[r.status] || trStatusCfg["Pending Review"];
                return (
                  <tr key={r.id} className="border-t hover:bg-orange-50 transition-colors" style={{ borderColor: "rgba(199,106,0,0.06)" }}>
                    <td className="px-4 py-3.5 text-xs font-mono" style={{ color: "#C76A00", fontWeight: 600 }}>{r.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FFF0E6" }}>
                          <Building2 size={14} style={{ color: "#C76A00" }} />
                        </div>
                        <div className="text-xs" style={{ color: "#1F1F1F", fontWeight: 600 }}>{r.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: "#6B7280" }}>{r.location}</td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: "#6B7280" }}>{r.deity}</td>
                    <td className="px-4 py-3.5"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>{r.type}</span></td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs" style={{ color: "#1F1F1F" }}>{r.contact}</div>
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>{r.phone}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: "#9CA3AF" }}>{r.submitted}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: r.docs === "Complete" ? "#F0FDF4" : "#FFF1F2", color: r.docs === "Complete" ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                        {r.docs}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 600 }}>{r.status}</span></td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <button className="p-1.5 rounded-lg hover:bg-orange-50" title="View"><Eye size={13} style={{ color: "#C76A00" }} /></button>
                        {(r.status === "Pending Review" || r.status === "Under Verification") && (
                          <>
                            <button disabled={loadingAction === r.id} onClick={() => handleApproveAndCreate(r.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-green-50 transition-colors" style={{ color: "#16A34A", fontWeight: 600 }}>
                              <CheckCircle2 size={12} /> Approve & Create
                            </button>
                            <button disabled={loadingAction === r.id} onClick={() => updateStatus(r.id, "Under Verification")} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-blue-50 transition-colors" style={{ color: "#2563EB", fontWeight: 600 }}>
                              <Clock size={12} /> Verify
                            </button>
                            <button disabled={loadingAction === r.id} onClick={() => updateStatus(r.id, "Rejected")} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors" style={{ color: "#DC2626", fontWeight: 600 }}>
                              <XCircle size={12} /> Reject
                            </button>
                          </>
                        )}
                        {r.status === "Approved" && <span className="text-xs px-2 py-1 rounded-lg" style={{ color: "#16A34A", backgroundColor: "#F0FDF4", fontWeight: 600 }}>✓ Approved</span>}
                        {r.status === "Rejected" && <span className="text-xs px-2 py-1 rounded-lg" style={{ color: "#DC2626", backgroundColor: "#FFF1F2", fontWeight: 600 }}>✗ Rejected</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

