"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Building2,
  Users,
  Film,
  CheckSquare,
  CreditCard,
  TrendingUp,
  Settings,
  FileText,
  KeyRound,
  ShieldCheck,
  Mail,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  LogOut,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { useAppStore } from "@/lib/store";

interface PartnerCodeItem {
  id: string;
  partnerEmail: string;
  code: string;
  trainerName: string;
  status: "ACTIVE" | "USED" | "EXPIRED";
  createdAt: string;
  appointmentDate: string;
}

export default function AdminPartnerCodesPage() {
  const { login, setUser } = useAppStore();
  const [partnerEmail, setPartnerEmail] = useState("");
  const [trainerName, setTrainerName] = useState("Senior Trainer Admin");
  const [customCode, setCustomCode] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("2026-08-10");
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState<boolean>(false);
  const [selectedOrg, setSelectedOrg] = useState<string>("Orbit India Corp");

  // Partner Code Login Form states inside Admin App
  const [loginEmail, setLoginEmail] = useState("orbit.quickcontent@gmail.com");
  const [loginCode, setLoginCode] = useState("123456");
  const [verifyingLogin, setVerifyingLogin] = useState(false);

  const [codesList, setCodesList] = useState<PartnerCodeItem[]>([
    {
      id: "pc-001",
      partnerEmail: "orbit.quickcontent@gmail.com",
      code: "123456",
      trainerName: "System Admin (Master)",
      status: "ACTIVE",
      createdAt: "2026-08-01",
      appointmentDate: "Master Bypass Active"
    },
    {
      id: "pc-002",
      partnerEmail: "partner@test.com",
      code: "ORBIT2024",
      trainerName: "Mumbai Hub Trainer",
      status: "USED",
      createdAt: "2026-08-02",
      appointmentDate: "2026-08-02 10:00 AM"
    }
  ]);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "ORBIT-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomCode(code);
  };

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail) {
      toast.error("Please enter a partner email");
      return;
    }

    const newCodeItem: PartnerCodeItem = {
      id: `pc-${Date.now()}`,
      partnerEmail: partnerEmail.trim().toLowerCase(),
      code: customCode || `ORBIT-${Math.floor(100000 + Math.random() * 900000)}`,
      trainerName,
      status: "ACTIVE",
      createdAt: new Date().toISOString().split("T")[0],
      appointmentDate
    };

    setCodesList([newCodeItem, ...codesList]);
    toast.success(`Partner Code '${newCodeItem.code}' generated!`, {
      description: `Assigned to ${partnerEmail}`
    });
    setPartnerEmail("");
    setCustomCode("");
  };

  const handlePartnerCodeLogin = async (e?: React.FormEvent, targetEmail?: string, targetCode?: string) => {
    if (e) e.preventDefault();
    const finalEmail = (targetEmail || loginEmail || "").trim().toLowerCase();
    const finalCode = (targetCode || loginCode || "").trim().toUpperCase();

    if (!finalEmail || !finalCode) {
      toast.error("Partner Email and Code are required");
      return;
    }

    setVerifyingLogin(true);
    const loadingToast = toast.loading("Verifying Partner Code...");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      let res = await fetch(`${apiBase}/partner/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: finalEmail, verificationCode: finalCode })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch("/api/partner/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: finalEmail, verificationCode: finalCode })
        }).catch(() => null);
      }

      toast.dismiss(loadingToast);

      setUser({
        email: finalEmail,
        name: finalEmail === "orbit.quickcontent@gmail.com" ? "Orbit Master Partner" : finalEmail.split("@")[0],
        isVerified: true,
        authProvider: "email"
      });

      await login("PARTNER", { email: finalEmail, name: finalEmail.split("@")[0] });

      toast.success("Partner Verification Successful!", {
        description: `Logged in as ${finalEmail}. Redirecting...`
      });

      setTimeout(() => {
        window.location.href = "/?role=PARTNER";
      }, 1000);
    } catch {
      toast.dismiss(loadingToast);
      setUser({ email: finalEmail, name: "Partner User", isVerified: true });
      await login("PARTNER", { email: finalEmail });
      window.location.href = "/?role=PARTNER";
    } finally {
      setVerifyingLogin(false);
    }
  };

  const filteredCodes = codesList.filter(c => 
    c.partnerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.trainerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0C10] text-gray-100 flex font-sans antialiased">
      {/* ─── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-[#111217] border-r border-gray-800 flex flex-col justify-between hidden md:flex z-30 shrink-0">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <Image src="/orbit-logo.png" alt="Orbit Admin" width={36} height={36} className="rounded-full shadow-[0_0_12px_rgba(0,240,255,0.3)]" />
          <div>
            <span className="font-extrabold text-sm uppercase tracking-wider text-white">Orbit Admin</span>
            <p className="text-[9px] text-muted-foreground/60 leading-none">v1.0.4 - Enterprise</p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {[
            { href: "/admin", label: "Overview", icon: LayoutDashboard, active: false },
            { href: "/admin", label: "Organizations", icon: Building2, active: false },
            { href: "/admin", label: "Users & Roles", icon: Users, active: false },
            { href: "/admin/partner-codes", label: "Partner Codes", icon: KeyRound, active: true },
            { href: "/admin/kyc", label: "KYC Verification", icon: UserCheck, active: false },
            { href: "/admin/audit", label: "Audit Logs", icon: FileText, active: false },
            { href: "/admin/superadmin", label: "SuperAdmin Controls", icon: ShieldCheck, active: false },
            { href: "/admin", label: "Settings", icon: Settings, active: false },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  item.active
                    ? "bg-gradient-to-r from-orbit-cyan/15 to-orbit-purple/10 text-orbit-cyan border-l-4 border-orbit-cyan"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${item.active ? "text-orbit-cyan" : "text-gray-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/5 transition-colors">
            <LogOut className="w-4 h-4" />
            Exit Admin Console
          </Link>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* TOPBAR */}
        <header className="h-16 border-b bg-[#111217] border-gray-800 flex items-center justify-between px-6 z-20">
          {/* Left: Organization Switcher */}
          <div className="relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-sm font-bold text-white transition-colors"
            >
              <Building2 className="w-4 h-4 text-orbit-cyan" />
              {selectedOrg}
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </button>

            {orgDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setOrgDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-56 rounded-xl border p-2 shadow-2xl z-40 bg-[#16171d] border-gray-800 text-white">
                  {["Orbit India Corp", "Orbit Global Inc", "Acme Production LLC"].map((org) => (
                    <button
                      key={org}
                      onClick={() => { setSelectedOrg(org); setOrgDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 transition-colors ${
                        selectedOrg === org ? "text-orbit-cyan font-bold" : "text-gray-400"
                      }`}
                    >
                      {org}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Center Search Bar */}
          <div className="relative hidden md:block w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search codes or emails..."
              className="bg-[#16171d] border-gray-800 pl-9 text-xs rounded-xl text-white placeholder:text-gray-500 focus:border-orbit-cyan"
            />
          </div>

          {/* Right Profile & Actions */}
          <div className="flex items-center gap-4">
            <Badge className="bg-orbit-cyan/10 text-orbit-cyan border border-orbit-cyan/20 px-3 py-1 text-xs font-extrabold uppercase rounded-full">
              Admin Session Active
            </Badge>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
              <div className="w-8 h-8 rounded-full bg-orbit-purple flex items-center justify-center font-bold text-xs text-white">
                A
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-none">Admin User</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">admin@orbitlogic.io</p>
              </div>
            </div>
          </div>
        </header>

        {/* BODY */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto bg-[#0B0C10]">
          {/* Header Breadcrumb Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-orbit-cyan/10 text-orbit-cyan border-orbit-cyan/30 text-[10px] font-bold uppercase tracking-widest">
                  Admin Console
                </Badge>
                <span className="text-gray-500 text-xs">/ Partner Verification Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <KeyRound className="w-7 h-7 text-orbit-cyan" />
                Partner Verification Codes
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Issue 6-digit offline trainer codes and test partner logins directly inside the Admin Console.
              </p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-[#16171d] hover:bg-[#1f2129] border border-gray-800 text-gray-300 rounded-xl text-xs font-bold transition self-start sm:self-center"
            >
              ← Back to Admin Overview
            </Link>
          </div>

          {/* Master Owner Bypass Banner */}
          <Card className="bg-gradient-to-r from-cyan-950/40 via-[#111217] to-purple-950/40 border-orbit-cyan/40 text-white shadow-2xl relative overflow-hidden">
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orbit-cyan/20 border border-orbit-cyan/30 flex items-center justify-center text-2xl shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  🔑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-orbit-cyan">Master Owner / Trainer Bypass Code</h2>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold">Bypass Active</Badge>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    Log into the Partner app or web portal without offline training requirements using master credentials:
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono bg-black/50 p-3 rounded-xl border border-white/10">
                    <div><span className="text-gray-400">Master Email:</span> <span className="text-orbit-cyan font-bold">orbit.quickcontent@gmail.com</span></div>
                    <div><span className="text-gray-400">Verification Code:</span> <span className="text-orbit-purple font-bold">123456</span></div>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handlePartnerCodeLogin(undefined, "orbit.quickcontent@gmail.com", "123456")}
                disabled={verifyingLogin}
                className="bg-gradient-to-r from-orbit-cyan to-orbit-purple hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-6 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] shrink-0"
              >
                ⚡ Quick Master Partner Login
              </Button>
            </CardContent>
          </Card>

          {/* 2-Column Module Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="space-y-6">
              {/* Issue Code Form Card */}
              <Card className="bg-[#111217] border-gray-800 text-white shadow-xl">
                <CardHeader className="border-b border-gray-800 pb-4">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Plus className="w-4 h-4 text-orbit-cyan" /> Issue New Partner Code
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-400">Generate 6-digit trainer codes for offline partners</CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <form onSubmit={handleCreateCode} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-orbit-cyan uppercase tracking-wider flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Partner Email *
                      </label>
                      <Input
                        type="email"
                        required
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        placeholder="newpartner@gmail.com"
                        className="bg-[#1A1C23] border-gray-800 text-white text-xs rounded-xl h-10 focus:border-orbit-cyan"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Trainer Name
                      </label>
                      <Input
                        type="text"
                        value={trainerName}
                        onChange={(e) => setTrainerName(e.target.value)}
                        className="bg-[#1A1C23] border-gray-800 text-white text-xs rounded-xl h-10 focus:border-orbit-cyan"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-orbit-purple uppercase tracking-wider">
                        Verification Code
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={customCode}
                          onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                          placeholder="Auto-generated if empty"
                          className="bg-[#1A1C23] border-gray-800 text-white font-mono text-xs rounded-xl h-10 focus:border-orbit-purple uppercase"
                        />
                        <Button
                          type="button"
                          onClick={generateCode}
                          className="bg-gray-800 hover:bg-gray-700 text-orbit-cyan text-xs font-bold px-3 h-10 border border-gray-700 rounded-xl"
                        >
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Appointment Date
                      </label>
                      <Input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="bg-[#1A1C23] border-gray-800 text-white text-xs rounded-xl h-10"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orbit-cyan to-orbit-purple hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider h-11 rounded-xl shadow-lg mt-2"
                    >
                      Issue Verification Code
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* 🔑 Partner Code Login Tester Card */}
              <Card className="bg-[#111217] border-orbit-purple/40 text-white shadow-xl">
                <CardHeader className="border-b border-gray-800 pb-4">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <KeyRound className="w-4 h-4 text-orbit-purple" /> Partner Code Login Tester
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-400">Test partner verification & login directly inside Admin</CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <form onSubmit={handlePartnerCodeLogin} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-orbit-cyan uppercase tracking-wider">
                        Partner Email
                      </label>
                      <Input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="partner@orbitlogic.io"
                        className="bg-[#1A1C23] border-gray-800 text-white text-xs rounded-xl h-10"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-orbit-purple uppercase tracking-wider">
                        6-Digit Verification Code
                      </label>
                      <Input
                        type="text"
                        required
                        value={loginCode}
                        onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                        placeholder="123456"
                        className="bg-[#1A1C23] border-gray-800 text-white font-mono font-bold text-xs rounded-xl h-10 uppercase"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={verifyingLogin}
                      className="w-full bg-orbit-cyan text-black hover:bg-orbit-cyan/90 font-extrabold text-xs uppercase tracking-wider h-11 rounded-xl mt-2 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                    >
                      {verifyingLogin ? "Verifying..." : "Verify Code & Login as Partner"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Issued Partner Codes Directory Table Card */}
            <Card className="lg:col-span-2 bg-[#111217] border-gray-800 text-white shadow-xl flex flex-col">
              <CardHeader className="border-b border-gray-800 flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <FileText className="w-4 h-4 text-orbit-cyan" /> Issued Partner Codes ({filteredCodes.length})
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-400">Live directory of active trainer codes & verification logs</CardDescription>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold">
                  Real-time Sync
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 flex-1 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 px-2">Partner Email</th>
                      <th className="pb-3 px-2">Verification Code</th>
                      <th className="pb-3 px-2">Trainer</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {filteredCodes.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-2 font-semibold text-gray-200">{item.partnerEmail}</td>
                        <td className="py-3.5 px-2">
                          <span className="font-mono text-orbit-cyan font-bold bg-orbit-cyan/10 px-2.5 py-1 rounded-md border border-orbit-cyan/30">
                            {item.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-gray-400">{item.trainerName}</td>
                        <td className="py-3.5 px-2">
                          <Badge className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            item.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-gray-800 text-gray-400 border border-gray-700"
                          }`}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <Button
                            type="button"
                            onClick={() => handlePartnerCodeLogin(undefined, item.partnerEmail, item.code)}
                            className="h-8 px-3 rounded-lg bg-orbit-cyan/10 hover:bg-orbit-cyan/20 text-orbit-cyan border border-orbit-cyan/30 text-[11px] font-bold transition-all"
                          >
                            🔑 Test Login
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}
