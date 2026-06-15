import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, Send } from "lucide-react";
import { QueriesService } from "../../../services/firebase/queries";
import { useAuth } from "../../../contexts/AuthContext";

const statusDot: Record<string, string> = {
  Open: "#3B82F6",
  "In Progress": "#C76A00",
  Escalated: "#EF4444",
  Resolved: "#22C55E",
};

export function QueriesPage() {
  const [queriesList, setQueriesList] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [reply, setReply] = useState("");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = QueriesService.subscribeToQueries((list) => {
      setQueriesList(list);
      if (list.length > 0 && !selected) {
        setSelected(list[0].id);
      }
    });
    return () => unsubscribe();
  }, [selected]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    const unsubscribe = QueriesService.subscribeToMessages(selected, setMessages);
    return () => unsubscribe();
  }, [selected]);

  const activeQuery = queriesList.find((q: any) => q.id === selected);
  const filtered = statusFilter === "All" ? queriesList : queriesList.filter((q: any) => q.status === statusFilter);

  function selectQuery(id: string) {
    setSelected(id);
    setMobilePanelOpen(true);
  }

  async function handleResolve() {
    if (!user || !activeQuery) return;
    try {
      await QueriesService.updateQueryStatus(activeQuery.id, "Resolved", user.uid);
    } catch (error: any) {
      alert("Error updating status: " + error.message);
    }
  }

  async function handleReply() {
    if (!reply.trim() || !user || !activeQuery) return;
    try {
      await QueriesService.addMessageToQuery(activeQuery.id, reply.trim(), user.uid);
      setReply("");
    } catch (error: any) {
      alert("Error adding message: " + error.message);
    }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 560 }}>
      {/* Minimal top bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0 gap-2">
        <div className="flex items-center gap-0.5 p-1 rounded-lg overflow-x-auto" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(199,106,0,0.12)" }}>
          {["All", "Open", "In Progress", "Escalated", "Resolved"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className="px-2.5 py-1.5 rounded-md text-xs transition-all whitespace-nowrap"
              style={{
                backgroundColor: statusFilter === f ? "#FAF6F2" : "transparent",
                color: statusFilter === f ? "#C76A00" : "#9CA3AF",
                fontWeight: statusFilter === f ? 600 : 400,
              }}>
              {f}
              {f !== "All" && (
                <span className="ml-1 text-xs" style={{ color: statusFilter === f ? "#C76A00" : "#D1D5DB" }}>
                  {queriesList.filter(q => q.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="text-xs flex-shrink-0" style={{ color: "#9CA3AF" }}>{filtered.length}</span>
      </div>

      {/* Split pane */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ height: "calc(100vh - 200px)", minHeight: 480 }}>

        {/* Left — compact list (hidden on mobile when thread is open) */}
        <div className={`${mobilePanelOpen ? "hidden" : "flex"} md:flex w-full md:w-72 flex-shrink-0 flex-col bg-white rounded-2xl border overflow-hidden`} style={{ borderColor: "rgba(199,106,0,0.1)" }}>
          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "rgba(199,106,0,0.06)" }}>
            {filtered.map(q => {
              const isActive = q.id === selected;
              return (
                <button key={q.id} onClick={() => selectQuery(q.id)}
                  className="w-full text-left px-4 py-3.5 transition-colors relative"
                  style={{ backgroundColor: isActive ? "#FFF8F0" : "transparent", minHeight: "44px" }}>
                  {isActive && (
                    <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r" style={{ backgroundColor: "#C76A00" }} />
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusDot[q.status] }} />
                    <span className="text-xs truncate flex-1" style={{ color: "#1F1F1F", fontWeight: isActive ? 600 : 500 }}>{q.devotee}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: "#C4C9D4" }}>{q.created || new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="pl-4 text-xs line-clamp-2" style={{ color: isActive ? "#374151" : "#9CA3AF", lineHeight: 1.5 }}>
                    {q.subject}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — thread (hidden on mobile when list is shown) */}
        <div className={`${mobilePanelOpen ? "flex" : "hidden"} md:flex flex-1 flex-col bg-white rounded-2xl border overflow-hidden min-w-0`} style={{ borderColor: "rgba(199,106,0,0.1)" }}>
          {/* Header */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(199,106,0,0.08)" }}>
            {/* Mobile back button */}
            <button
              onClick={() => setMobilePanelOpen(false)}
              className="md:hidden flex items-center gap-1 text-xs flex-shrink-0 py-1 pr-2"
              style={{ color: "#C76A00", fontWeight: 600 }}
            >
              <ArrowLeft size={13} /> Back
            </button>
            {activeQuery && (
              <>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusDot[activeQuery.status] }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm line-clamp-1" style={{ color: "#1F1F1F", fontWeight: 600 }}>{activeQuery.subject}</span>
                </div>
                <span className="text-xs flex-shrink-0 hidden sm:block" style={{ color: "#9CA3AF" }}>{activeQuery.category} · {activeQuery.assigned}</span>
                {activeQuery.status !== "Resolved" && (
                  <button 
                    onClick={handleResolve}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                    style={{ backgroundColor: "#F0FDF4", color: "#16A34A", fontWeight: 600, minHeight: "36px" }}
                  >
                    <CheckCircle size={11} /> Resolve
                  </button>
                )}
              </>
            )}
          </div>

          {/* Thread messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5">
            {messages.map((msg: any, i: number) => (
              <div key={msg.id || i} className={`flex gap-3 ${msg.isAdmin ? "flex-row-reverse" : ""}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: msg.isAdmin ? "#4A1259" : "#C76A00", fontSize: 9, fontWeight: 700 }}>
                  {msg.isAdmin ? "A" : activeQuery?.avatar || "U"}
                </div>
                <div className={`max-w-xs sm:max-w-xl flex flex-col ${msg.isAdmin ? "items-end" : "items-start"}`}>
                  <span className="text-xs mb-1" style={{ color: "#C4C9D4" }}>{msg.time}</span>
                  <div className="px-4 py-3 text-sm"
                    style={{
                      backgroundColor: msg.isAdmin ? "#F5F0FC" : "#FAF6F2",
                      color: "#374151",
                      lineHeight: 1.65,
                      borderRadius: msg.isAdmin ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply bar */}
          <div className="px-4 md:px-6 pb-4 md:pb-5 pt-3 border-t flex-shrink-0" style={{ borderColor: "rgba(199,106,0,0.08)" }}>
            <div className="flex items-end gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#FAF6F2", border: "1px solid rgba(199,106,0,0.15)" }}>
              <textarea
                rows={2}
                placeholder="Reply to this query…"
                value={reply}
                onChange={e => setReply(e.target.value)}
                className="flex-1 text-sm outline-none resize-none bg-transparent"
                style={{ color: "#1F1F1F" }}
              />
              <button
                onClick={handleReply}
                disabled={!reply.trim() || !activeQuery || activeQuery.status === "Resolved"}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
                style={{ backgroundColor: reply.trim() && activeQuery?.status !== "Resolved" ? "#C76A00" : "rgba(199,106,0,0.12)", color: reply.trim() && activeQuery?.status !== "Resolved" ? "#FFFFFF" : "#C76A00", fontWeight: 600, minHeight: "44px" }}
              >
                <Send size={11} /> Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
