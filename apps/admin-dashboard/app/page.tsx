'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function HomePage() {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const token = window.localStorage.getItem('orbit_admin_token') || '';
    fetch(`${API}/admin/metrics`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Unable to load metrics');
        setMetrics(data);
      })
      .catch((e) => setError(e.message));
  }, []);

  const cards = [
    ['Total Revenue', `₹${Number(metrics.totalRevenue || 0).toLocaleString('en-IN')}`],
    ['Platform Fee', `₹${Number(metrics.platformFee || 0).toLocaleString('en-IN')}`],
    ['Bookings', metrics.totalBookings ?? '—'],
    ['Active Bookings', metrics.activeBookings ?? '—'],
    ['Online Partners', metrics.onlinePartners ?? '—'],
    ['Active Editors', metrics.activeEditors ?? '—'],
    ['Avg Delivery', metrics.averageDeliveryMinutes ? `${Math.round(metrics.averageDeliveryMinutes)} min` : '—'],
    ['Satisfaction', metrics.clientSatisfaction ? `${metrics.clientSatisfaction}%` : '—'],
  ];

  return (
    <main className="min-h-screen bg-[#05060A] text-white px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">ORBIT CONTROL</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Live Fleet & Revenue Center</h1>
            <p className="mt-2 text-slate-400">Bookings, dispatch, partner utilization, editor throughput and customer delivery in one place.</p>
          </div>
          <Link href="/live-map" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold shadow-lg shadow-indigo-900/30 hover:bg-indigo-500">Open Live Fleet Map</Link>
        </header>

        {error && <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error} — configure an Admin access token in localStorage as <code>orbit_admin_token</code>.</div>}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <Link href="/live-map" className="rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 to-transparent p-6 hover:border-indigo-400/40">
            <p className="text-sm font-semibold text-indigo-200">Dispatch</p>
            <h2 className="mt-2 text-xl font-bold">Monitor nearby Partners</h2>
            <p className="mt-2 text-sm text-slate-400">Watch live presence, assignments and movement across the fleet.</p>
          </Link>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold text-slate-300">Operations</p>
            <h2 className="mt-2 text-xl font-bold">Partner acceptance is mandatory</h2>
            <p className="mt-2 text-sm text-slate-400">Payment confirmation dispatches the job; only the winning Partner moves it to EN_ROUTE.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold text-slate-300">Delivery</p>
            <h2 className="mt-2 text-xl font-bold">Editor pipeline</h2>
            <p className="mt-2 text-sm text-slate-400">Sync completion assigns the least-loaded editor and final delivery closes the client loop.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
