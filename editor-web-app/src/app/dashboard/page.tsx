"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function EditorDashboard() {
  const router = useRouter();
  const [name, setName] = useState("ORBIT Editor");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const token = localStorage.getItem("orbit_editor_token");
    const editorId = localStorage.getItem("orbit_editor_id");
    if (!token || !editorId) { router.push("/"); return; }
    const response = await fetch(`${API}/editor/bookings?editorId=${encodeURIComponent(editorId)}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load workspace");
    setBookings(data.bookings || []);
    setLoading(false);
  };

  useEffect(() => {
    setName(localStorage.getItem("orbit_editor_name") || "ORBIT Editor");
    load().catch(() => { setLoading(false); });
  }, []);

  const logout = () => {
    localStorage.removeItem("orbit_editor_token");
    localStorage.removeItem("orbit_editor_id");
    localStorage.removeItem("orbit_editor_name");
    router.push("/");
  };

  const active = bookings.filter((b) => b.status === "EDITING").length;
  const delivered = bookings.filter((b) => b.status === "DELIVERED").length;

  return (
    <main className="min-h-screen bg-[#05060A] text-white px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">ORBIT EDITOR</p><h1 className="mt-2 text-3xl font-black">{name}</h1><p className="mt-1 text-sm text-slate-400">Production workspace</p></div>
          <button onClick={logout} className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Log out</button>
        </header>
        <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
          {[['Active edits', active], ['Delivered', delivered], ['Total assigned', bookings.length]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}
        </section>
        <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Assigned projects</h2><button onClick={() => load()} className="rounded-xl bg-white/5 px-3 py-2 text-sm">Refresh</button></div>
          {loading ? <p className="text-slate-400">Loading workspace…</p> : bookings.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-slate-400">No assignments yet. ORBIT assigns the least-loaded editor automatically after footage sync.</div> : <div className="grid gap-4 md:grid-cols-2">{bookings.map((b) => <article key={b.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-slate-500">#{String(b.id).slice(0, 8)}</p><h3 className="mt-1 text-lg font-bold">{b.packageName || "ORBIT Reel"}</h3><p className="mt-1 text-sm text-slate-400">{b.client?.name || "Client"}</p></div><span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">{b.status}</span></div><p className="mt-4 text-sm text-slate-400">{b.location || "Location not supplied"}</p><button onClick={() => router.push(`/bookings/${b.id}`)} className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 py-2.5 font-bold text-black">Open project</button></article>)}</div>}
        </section>
      </div>
    </main>
  );
}
