"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, User, Phone as PhoneIcon, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";

const PERSONAS = [
  { id: "creator", name: "Creator", emoji: "👨🏻‍🦱", bg: "bg-red-500/20 border-red-500" },
  { id: "professional", name: "Professional", emoji: "👨🏽‍💼", bg: "bg-zinc-800/50 border-zinc-700" },
  { id: "artist", name: "Artist", emoji: "👩🏽‍🎨", bg: "bg-zinc-800/50 border-zinc-700" },
  { id: "explorer", name: "Explorer", emoji: "🧑🏻‍🚀", bg: "bg-zinc-800/50 border-zinc-700" },
  { id: "visionary", name: "Visionary", emoji: "👩🏻‍💼", bg: "bg-zinc-800/50 border-zinc-700" },
];

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { setUser } = useAppStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("creator");
  const [avatarMode, setAvatarMode] = useState<"avatar" | "photo">("avatar");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName) {
      setUser({
        name: fullName,
        email: email || "user@example.com",
        phone: phone || "+919876543210",
        avatarEmoji: PERSONAS.find(p => p.id === selectedPersona)?.emoji || "👨🏻‍🦱",
        avatarType: "avatar",
      });
    }
    onComplete();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-8 px-4 sm:px-6">
      {/* Header Branding */}
      <header className="w-full max-w-md flex flex-col items-center mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-600 flex items-center justify-center font-black text-xl text-white">
            O
          </div>
          <span className="text-3xl font-black tracking-tighter text-blue-500 italic">ORBIT</span>
        </div>
        <Badge variant="outline" className="px-4 py-1 border-cyan-900/50 bg-cyan-950/20 text-cyan-400 text-xs font-semibold rounded-full">
          Client Account
        </Badge>
      </header>

      {/* Hero Section */}
      <div className="text-center max-w-md mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-1">
          <span className="text-blue-400">Join the</span> <span className="text-white">Orbit</span>
        </h1>
        <p className="text-blue-200/60 text-xs sm:text-sm">Sign in or create your account to get started</p>
      </div>

      {/* Social Login Buttons */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3 mb-6">
        <Button
          onClick={() => onComplete()}
          className="w-full bg-white text-black hover:bg-zinc-200 py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </Button>

        <Button
          onClick={() => onComplete()}
          className="w-full bg-black border border-zinc-800 text-white hover:bg-zinc-900 py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M17.05 20.28c-.98.95-2.05 1.61-3.19 1.61-1.12 0-1.47-.68-2.74-.68-1.28 0-1.68.66-2.74.66-1.13 0-2.1-.73-3.14-1.74-2.14-2.05-2.58-5.91-1.14-8.09.72-1.09 1.84-1.77 3.06-1.77 1.15 0 1.94.71 2.8.71.84 0 1.54-.75 2.88-.75.98 0 1.92.48 2.58 1.14-2.31 1.25-1.93 4.54.42 5.51-.52 1.34-1.25 2.65-1.93 3.4zm-2.89-16.14c.54-.66.89-1.57.89-2.48 0-.13-.01-.26-.04-.39-.88.04-1.94.59-2.57 1.33-.52.6-.96 1.54-.96 2.44 0 .15.02.29.05.4.97.02 1.95-.57 2.63-1.3z"/>
          </svg>
          Apple
        </Button>
      </div>

      {/* Divider */}
      <div className="w-full max-w-md flex items-center gap-4 mb-6">
        <div className="h-px bg-zinc-800 flex-grow" />
        <span className="text-zinc-600 text-[10px] font-bold tracking-widest uppercase">Or Email</span>
        <div className="h-px bg-zinc-800 flex-grow" />
      </div>

      {/* Profile Selection Container */}
      <section className="w-full max-w-md bg-zinc-950/40 border border-zinc-900 rounded-3xl p-5 mb-6">
        <h2 className="text-center text-blue-100/50 text-[10px] font-bold tracking-widest uppercase mb-5">
          Choose Your Profile Picture
        </h2>

        <div className="flex flex-col items-center mb-6">
          <div className="w-28 h-28 rounded-full border-4 border-zinc-800 p-1 mb-4">
            <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-4xl shadow-inner">
              {PERSONAS.find(p => p.id === selectedPersona)?.emoji}
            </div>
          </div>

          <div className="flex items-center bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
            <button
              onClick={() => setAvatarMode("avatar")}
              className={`flex items-center gap-1.5 px-5 py-1 rounded-full text-xs font-semibold transition-all ${
                avatarMode === "avatar" ? "bg-zinc-700 text-white" : "text-zinc-500"
              }`}
            >
              <User className="w-3.5 h-3.5" /> Avatar
            </button>
            <button
              onClick={() => setAvatarMode("photo")}
              className={`flex items-center gap-1.5 px-5 py-1 rounded-full text-xs font-semibold transition-all ${
                avatarMode === "photo" ? "bg-zinc-700 text-white" : "text-zinc-500"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Photo
            </button>
          </div>
        </div>

        {/* Persona Selector Grid */}
        <div className="grid grid-cols-5 gap-2">
          {PERSONAS.map(p => {
            const isSelected = p.id === selectedPersona;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p.id)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-zinc-900 border-red-500/80 shadow-lg scale-105"
                    : "bg-zinc-950/20 border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl">
                  {p.emoji}
                </div>
                <span className={`text-[9px] font-bold ${isSelected ? "text-zinc-200" : "text-zinc-500"}`}>
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Form Fields Section */}
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-blue-200/60 uppercase">
              <User className="w-3 h-3" /> Full Name *
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              className="bg-[#111111] border-zinc-800 rounded-xl text-sm focus:border-cyan-400 text-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-blue-200/60 uppercase">
              <Mail className="w-3 h-3" /> Email Address *
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-[#111111] border-zinc-800 rounded-xl text-sm focus:border-cyan-400 text-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-blue-200/60 uppercase">
              <PhoneIcon className="w-3 h-3" /> Phone
            </label>
            <div className="flex items-center bg-[#111111] border border-zinc-800 rounded-xl px-3 py-2 gap-3">
              <span className="text-zinc-500 text-xs font-semibold border-r border-zinc-800 pr-3">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  if (e.target.value.length <= 10) setPhone(e.target.value);
                }}
                placeholder="10-digit mobile number"
                className="bg-transparent border-none outline-none text-sm text-white w-full"
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-600 px-1">
              <span>India mobile numbers only</span>
              <span>{phone.length}/10</span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-300 hover:border-zinc-700 py-6 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm"
        >
          <Mail className="w-4 h-4" />
          Continue to Verify Email
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-[10px] text-blue-200/40 text-center">You'll need to verify your email before continuing.</p>
      </form>
    </div>
  );
}
