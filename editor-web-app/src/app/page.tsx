"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || "/api";
      const response = await fetch(`${api}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed");
      const user = data.user || {};
      if (user.role !== "EDITOR" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") throw new Error("This account is not authorized for the Editor Studio");
      const token = data.accessToken || data.token;
      if (!token) throw new Error("Access token missing");
      localStorage.setItem("orbit_editor_token", token);
      localStorage.setItem("orbit_editor_id", user.id || "");
      localStorage.setItem("orbit_editor_name", user.name || user.displayName || "ORBIT Editor");
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05060A] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">ORBIT</p>
          <h1 className="mt-2 text-3xl font-black">Editor Studio</h1>
          <p className="mt-2 text-sm text-slate-400">Edit, review and deliver the next reel.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="editor@orbit.com" required className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-400" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-400" />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 py-3 font-bold text-black disabled:opacity-50">{loading ? "Signing in…" : "Enter Editor Studio"}</button>
        </form>
      </div>
    </main>
  );
}
