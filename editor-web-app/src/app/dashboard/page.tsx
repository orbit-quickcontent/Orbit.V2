"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, CheckCircle, Clock, LogOut, Video, Plus, Sparkles, Briefcase } from "lucide-react";

export default function EditorDashboard() {
  const router = useRouter();
  const [editorName, setEditorName] = useState("");
  const [editorId, setEditorId] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [available, setAvailable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  const fetchBookings = (eid: string) => {
    setIsLoading(true);
    fetch(`http://localhost:5000/api/editor/bookings?editorId=${eid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.bookings) {
          // Sort: active assignments first, then newest bookingDate at top
          const statusOrder: Record<string, number> = {
            READY_TO_EDIT: 0,
            EDITING: 1,
            DELIVERED: 2,
          };
          const sorted = [...data.bookings].sort((a: any, b: any) => {
            const sDiff =
              (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
            if (sDiff !== 0) return sDiff;
            // Within same status group — newest booking date first
            return (
              new Date(b.bookingDate).getTime() -
              new Date(a.bookingDate).getTime()
            );
          });
          setBookings(sorted);
        }
        if (data.available) {
          setAvailable(data.available);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    const savedId = localStorage.getItem("orbit_editor_id");
    const savedName = localStorage.getItem("orbit_editor_name");
    
    if (!savedId) {
      router.push("/");
      return;
    }
    setEditorId(savedId);
    setEditorName(savedName || "Alex Mercer");

    fetchBookings(savedId);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("orbit_editor_id");
    localStorage.removeItem("orbit_editor_name");
    router.push("/");
  };

  const handleAcceptProject = async (bookingId: string) => {
    if (!editorId) return;
    setIsAccepting(bookingId);
    try {
      const res = await fetch(`http://localhost:5000/api/editor/bookings/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editorId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBookings(editorId);
      } else {
        alert("Failed to accept project: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error accepting project.");
    } finally {
      setIsAccepting(null);
    }
  };

  const activeAssignments = bookings.filter((b) => b.status === "EDITING" || b.status === "READY_TO_EDIT").length;
  const completedAssignments = bookings.filter((b) => b.status === "DELIVERED").length;

  return (
    <div className="min-h-screen bg-black text-white px-4 md:px-8 py-6">
      {/* Navbar */}
      <nav className="flex justify-between items-center max-w-7xl mx-auto mb-10 pb-6 border-b border-orbit-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orbit-cyan to-orbit-purple flex items-center justify-center font-black text-black">
            O
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ORBIT EDITOR</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Studio Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold">{editorName}</p>
            <p className="text-xs text-orbit-cyan font-bold uppercase">Active Editor</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-gray-900 border border-orbit-border hover:bg-gray-800 rounded-xl transition-colors text-red-400 flex items-center space-x-2"
          >
            <LogOut size={16} />
            <span className="hidden md:inline text-xs font-semibold">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Status Metrics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="orbit-card p-6 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-orbit-cyan/10 rounded-xl text-orbit-cyan">
              <Play size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Assignments</p>
              <h3 className="text-2xl font-bold">{activeAssignments}</h3>
            </div>
          </div>

          <div className="orbit-card p-6 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed Edits</p>
              <h3 className="text-2xl font-bold">{completedAssignments}</h3>
            </div>
          </div>

          <div className="orbit-card p-6 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-orbit-purple/10 rounded-xl text-orbit-purple">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Pool</p>
              <h3 className="text-2xl font-bold">{available.length} projects</h3>
            </div>
          </div>
        </div>

        {/* Available Pool section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <Sparkles className="text-orbit-purple animate-pulse" />
            <span>Available Projects (Pool)</span>
          </h2>

          {available.length === 0 ? (
            <div className="orbit-card p-8 text-center rounded-2xl border border-dashed border-orbit-border/60">
              <p className="text-muted-foreground text-sm">No new projects in the available pool right now.</p>
              <p className="text-[11px] text-gray-600 mt-1">
                When videographers sync and upload raw footage, projects will appear here for editors to accept.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {available.map((booking) => (
                <motion.div
                  key={booking.id}
                  whileHover={{ y: -3 }}
                  className="orbit-card p-5 rounded-2xl border border-orbit-purple/30 bg-gradient-to-br from-black via-black to-orbit-purple/5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs px-2.5 py-1 bg-gray-900 border border-orbit-border text-gray-400 rounded-full font-medium">
                        ID: #{booking.id.substring(0, 8)}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-orbit-purple/20 text-orbit-purple border border-orbit-purple/30">
                        Awaiting Editor
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1.5">
                      {booking.packageName || "Professional UGC"}
                    </h3>

                    <p className="text-xs text-gray-400 mb-3">
                      Scheduled: {new Date(booking.bookingDate).toLocaleDateString()} at {booking.timeSlot}
                    </p>

                    {booking.client?.editorRequirements && (
                      <div className="bg-[#050505] border border-orbit-border/50 p-2.5 rounded-xl mb-3">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                          Brief:
                        </p>
                        <p className="text-xs text-gray-300 line-clamp-2">
                          {booking.client.editorRequirements}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-orbit-border/50">
                    <div className="text-xs text-gray-500">
                      Client: <span className="text-white font-medium">{booking.client?.name || "N/A"}</span>
                    </div>
                    <button
                      onClick={() => handleAcceptProject(booking.id)}
                      disabled={isAccepting === booking.id}
                      className="px-3 py-1.5 bg-gradient-to-r from-orbit-cyan to-orbit-purple text-black font-bold rounded-lg text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center space-x-1"
                    >
                      {isAccepting === booking.id ? (
                        <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus size={12} />
                      )}
                      <span>Accept Project</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned bookings section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <Video className="text-orbit-cyan" />
            <span>Assigned Projects</span>
          </h2>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-orbit-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading workspace files...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="orbit-card p-12 text-center rounded-2xl border border-dashed border-orbit-border">
              <p className="text-muted-foreground text-lg mb-2">No active assignments</p>
              <p className="text-sm text-gray-500">
                Accept projects from the available pool above to begin editing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  whileHover={{ y: -4 }}
                  className={`orbit-card p-6 rounded-2xl border ${
                    booking.status === "EDITING"
                      ? "border-orbit-cyan/30 bg-gradient-to-br from-black via-black to-orbit-cyan/5"
                      : "border-orbit-border"
                  } flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs px-2.5 py-1 bg-gray-900 border border-orbit-border text-gray-400 rounded-full font-medium">
                          ID: #{booking.id.substring(0, 8)}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                          booking.status === "READY_TO_EDIT"
                            ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                            : booking.status === "EDITING"
                            ? "bg-orbit-cyan/15 text-orbit-cyan border border-orbit-cyan/30"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {booking.status === "READY_TO_EDIT" ? "Ready to Edit" : booking.status === "EDITING" ? "Editing" : "Delivered"}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                      {booking.packageName || "Professional UGC"}
                    </h3>

                    <p className="text-sm text-gray-400 mb-4">
                      Scheduled: {new Date(booking.bookingDate).toLocaleDateString()} at{" "}
                      {booking.timeSlot}
                    </p>

                    {booking.client?.editorRequirements && (
                      <div className="bg-[#0A0A0A] border border-orbit-border/50 p-3 rounded-xl mb-4">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                          Briefing & Requirements:
                        </p>
                        <p className="text-xs text-gray-300 line-clamp-2">
                          {booking.client.editorRequirements}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-orbit-border/50">
                    <div className="text-xs text-gray-500">
                      Client: <span className="text-white font-medium">{booking.client?.name || "N/A"}</span>
                    </div>
                    <button
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                      className="px-4 py-2 bg-gradient-to-r from-orbit-cyan to-orbit-purple text-black font-semibold rounded-lg text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      {booking.status === "READY_TO_EDIT" ? "Accept & Edit" : booking.status === "EDITING" ? "Open Studio" : "View Delivery"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
