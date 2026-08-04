"use client";

/**
 * 🔵 CLIENT FRONTEND | BrandDNASection
 * 
 * Brand DNA upload and editor chat for Professional tier bookings.
 * Includes logo upload, font selector, color picker, and real-time
 * editor requirements chat box.
 * 
 * Used by: booking-flow.tsx
 * Category: Client UI
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Sparkles, ImageIcon, X, Send, MessageSquare, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

export function BrandDNASection() {
  const { user, setUser } = useAppStore();
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "system"; time: string }[]>([
    { text: "Welcome! Describe your editing requirements here. Tell us about the style, mood, transitions, music preference, or any specific look you want for your reel.", sender: "system", time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg = {
      text: chatInput.trim(),
      sender: "user" as const,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setUser({ editorRequirements: user.editorRequirements ? `${user.editorRequirements}
${chatInput.trim()}` : chatInput.trim() });
    setChatInput("");
    toast.success("Requirement sent to editor!");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
      <Separator className="bg-orbit-border" />
      <div className="flex items-center gap-2 text-orbit-cyan">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-bold">Brand DNA</span>
        <Badge variant="outline" className="text-[10px] border-orbit-purple/30 text-orbit-purple">PRO</Badge>
      </div>
      <p className="text-xs text-muted-foreground">Upload your brand assets and tell our editors exactly what you need.</p>

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Brand Logo</label>
        <div className="orbit-card rounded-xl p-4 border border-dashed border-orbit-border hover:border-orbit-cyan/30 transition-colors">
          {user.brandLogo ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orbit-cyan/10 to-orbit-purple/10 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-orbit-cyan" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{user.brandLogo}</div>
                <div className="text-xs text-muted-foreground">Logo uploaded</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setUser({ brandLogo: null })} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Click to upload logo (PNG, SVG)</span>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setUser({ brandLogo: file.name }); toast.success("Logo uploaded", { description: file.name }); }
              }} />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Brand Font</label>
        <Select value={user.brandFont || ""} onValueChange={(value) => setUser({ brandFont: value })}>
          <SelectTrigger className="bg-white/5 border-orbit-border"><SelectValue placeholder="Select a font" /></SelectTrigger>
          <SelectContent>
            {["Inter", "Playfair Display", "Montserrat", "Roboto", "Aventa"].map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          Brand Color
        </label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="color"
              value={user.brandColor || "#00BFFF"}
              onChange={(e) => setUser({ brandColor: e.target.value })}
              className="w-10 h-10 rounded-lg border border-orbit-border cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
            />
          </div>
          <div className="flex-1">
            <Input
              value={user.brandColor || "#00BFFF"}
              onChange={(e) => setUser({ brandColor: e.target.value })}
              placeholder="#00BFFF"
              className="bg-white/5 border-orbit-border focus:border-orbit-cyan/50 font-mono text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {["#00BFFF", "#A020F0", "#FF6B35", "#2D6A4F", "#FF4081", "#FFB300"].map((color) => (
              <button
                key={color}
                onClick={() => setUser({ brandColor: color })}
                className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                  user.brandColor === color ? "border-white scale-110" : "border-white/10"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Editor Requirements Chat Box */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Editor Requirements
        </label>
        <div className="orbit-card rounded-xl overflow-hidden border border-orbit-cyan/10">
          {/* Chat Messages Area */}
          <div className="max-h-56 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,191,255,0.2) transparent" }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-orbit-cyan/20 to-orbit-purple/20 text-foreground border border-orbit-cyan/10"
                    : "bg-white/5 text-muted-foreground border border-orbit-border"
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-orbit-cyan/50" : "text-muted-foreground/40"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-orbit-border p-3 flex items-end gap-2 bg-white/[0.02]">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your editing requirements... (e.g. cinematic look, warm tones, slow-mo transitions)"
              rows={2}
              className="flex-1 bg-white/5 border border-orbit-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-orbit-cyan/50 focus:outline-none focus:ring-1 focus:ring-orbit-cyan/20 resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className="bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 shrink-0 rounded-xl h-10 w-10 p-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1.5">Press Enter to send. Your requirements will be shared with our editors.</p>
      </div>
    </motion.div>
  );
}