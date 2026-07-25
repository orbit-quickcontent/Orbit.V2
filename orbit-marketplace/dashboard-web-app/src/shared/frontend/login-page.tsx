"use client";

/**
 * SHARED | LoginPage
 *
 * Three-step login flow:
 * Step 1: Choose role (Client or Partner)
 * Step 2: Create profile with Google/Apple OAuth, 4 creative avatars + photo upload, India phone
 * Step 3: Verify email via OTP
 */

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  User,
  Mail,
  Phone,
  ImagePlus,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { AVATAR_COLORS, AVATAR_PRESETS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { type UserRole } from "@/lib/types";
import { toast } from "sonner";
import { AvatarGraphic } from "@/components/ui/avatar-graphic";
import OTPVerification from "./otp-verification";

type LoginStep = "profile" | "otp";
type AvatarMode = "avatar" | "photo";

export default function LoginPage() {
  const { login, setUser, user } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<LoginStep>("profile");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    if (roleParam === "USER" || roleParam === "PARTNER") {
      setSelectedRole(roleParam as UserRole);
    } else {
      setSelectedRole("USER");
    }
  }, []);


  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSocialLogin, setIsSocialLogin] = useState(false);
  const isSocial = user.authProvider === "google" || user.authProvider === "apple" || isSocialLogin;

  // Profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarMode, setAvatarMode] = useState<AvatarMode>("avatar");
  const [selectedAvatarPreset, setSelectedAvatarPreset] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phone validation for India (10 digits)
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const limited = raw.slice(0, 10);
    setPhone(limited);
  }, []);

  const isPhoneValid = phone.length === 0 || phone.length === 10;

  // Photo upload handler
  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setAvatarMode("photo");
    };
    reader.readAsDataURL(file);
  }, []);



  // Step 2→3 (Firebase Passwordless Email Link Auth)
  const handleProfileComplete = useCallback(async () => {
    if (!name.trim() || !email.trim()) return;
    if (phone.length > 0 && phone.length !== 10) return;

    const avatarValue = avatarMode === "avatar" && selectedAvatarPreset
      ? AVATAR_PRESETS.find(p => p.id === selectedAvatarPreset)?.gradient ?? AVATAR_COLORS[0]
      : photoPreview;

    const selectedPreset = avatarMode === "avatar" && selectedAvatarPreset
      ? AVATAR_PRESETS.find(p => p.id === selectedAvatarPreset)
      : null;

    const isSocial = user.authProvider === "google" || user.authProvider === "apple" || isSocialLogin;
    
    const userPayload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() ? phone.trim() : "",
      avatar: avatarValue ?? AVATAR_COLORS[0],
      avatarType: avatarMode === "photo" ? ("photo" as const) : ("avatar" as const),
      avatarEmoji: selectedPreset?.emoji ?? null,
      avatarPhotoUrl: avatarMode === "photo" ? photoPreview : null,
      avatarImage: selectedPreset?.image ?? null,
      isVerified: isSocial,
    };

    setUser(userPayload);

    if (isSocial) {
      if (selectedRole) {
        login(selectedRole);
        toast.success("Welcome aboard!", { 
          description: `Logged in successfully as a ${selectedRole === "USER" ? "Client" : "Partner"}.` 
        });
      }
    } else {
      setStep("otp");
    }
  }, [name, email, phone, avatarMode, selectedAvatarPreset, photoPreview, setUser, user.authProvider, isSocialLogin, selectedRole, login]);

  const handleOtpVerified = useCallback(async () => {
    try {
      const { auth: firebaseAuth } = await import("@/lib/firebase");
      const { signInAnonymously } = await import("firebase/auth");
      
      try {
        await signInAnonymously(firebaseAuth);
      } catch (anonErr) {
        console.warn("Firebase Anonymous Sign-In fallback active:", anonErr);
      }

      setUser({ authProvider: "email", isVerified: true });
      if (selectedRole) login(selectedRole);
    } catch (err: any) {
      console.error("Firebase Email OTP Auth Error:", err);
      toast.error("Firebase Authentication failed", {
        description: err.message || "Please try again."
      });
    }
  }, [selectedRole, login, setUser]);

  const handleOtpBack = useCallback(() => {
    setStep("profile");
  }, []);

  // Google OAuth
  const handleGoogleLogin = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    const loadingToast = toast.loading("Connecting to Google...");
    try {
      const { auth } = await import("@/lib/firebase");
      const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      setName(user.displayName || "Google User");
      setEmail(user.email || "");
      
      if (user.photoURL) {
        setPhotoPreview(user.photoURL);
        setAvatarMode("photo");
      } else {
        setSelectedAvatarPreset(AVATAR_PRESETS[0].id);
        setAvatarMode("avatar");
      }
      
      setUser({ authProvider: "google" });
      setIsSocialLogin(true);
      
      toast.dismiss(loadingToast);
      toast.success("Signed in with Google!", { 
        description: "Profile auto-filled from your Google account. You can now customize your details below." 
      });
    } catch (err: any) {
      console.error("Firebase Google Login Error:", err);
      toast.dismiss(loadingToast);
      
      if (err.code === "auth/cancelled-popup-request" || err.code === "auth/popup-closed-by-user") {
        toast.info("Sign-in cancelled", {
          description: "Google sign-in popup was closed."
        });
      } else if (err.code === "auth/popup-blocked") {
        toast.warning("Popup blocked", {
          description: "Please allow popups for this website in your browser settings to sign in."
        });
      } else {
        toast.error("Google Sign-In failed", { 
          description: err.message || "Please try again." 
        });
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [setUser, isAuthenticating]);

  // Apple OAuth
  const handleAppleLogin = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    const loadingToast = toast.loading("Connecting to Apple...");
    try {
      const { auth } = await import("@/lib/firebase");
      const { signInWithPopup, OAuthProvider } = await import("firebase/auth");
      const provider = new OAuthProvider("apple.com");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      setName(user.displayName || "Apple User");
      setEmail(user.email || "");
      
      if (user.photoURL) {
        setPhotoPreview(user.photoURL);
        setAvatarMode("photo");
      } else {
        setSelectedAvatarPreset(AVATAR_PRESETS[1].id);
        setAvatarMode("avatar");
      }
      
      setUser({ authProvider: "apple" });
      setIsSocialLogin(true);
      
      toast.dismiss(loadingToast);
      toast.success("Signed in with Apple!", { 
        description: "Profile auto-filled from your Apple ID. You can now customize your details below." 
      });
    } catch (err: any) {
      console.error("Firebase Apple Login Error:", err);
      toast.dismiss(loadingToast);
      
      if (err.code === "auth/cancelled-popup-request" || err.code === "auth/popup-closed-by-user") {
        toast.info("Sign-in cancelled", {
          description: "Apple sign-in popup was closed."
        });
      } else if (err.code === "auth/popup-blocked") {
        toast.warning("Popup blocked", {
          description: "Please allow popups for this website in your browser settings to sign in."
        });
      } else {
        toast.error("Apple Sign-In failed", { 
          description: err.message || "Please try again." 
        });
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [setUser, isAuthenticating]);

  // Render the current avatar preview based on mode
  const renderAvatarPreview = () => {
    if (avatarMode === "photo" && photoPreview) {
      return (
        <div className="relative group">
          <div className="absolute inset-0 w-28 h-28 rounded-full bg-[#00D4FF] opacity-20 blur-xl scale-125 animate-pulse" />
          <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-2xl ring-2 ring-[#00D4FF]">
            <img src={photoPreview} alt="Profile photo" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={() => { setPhotoPreview(null); setAvatarMode("avatar"); }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500/90 flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors z-20"
            title="Remove photo"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    const currentPresetId = selectedAvatarPreset || "creator";
    return (
      <div className="relative flex items-center justify-center w-36 h-36">
        {/* Outer concentric dashed ring */}
        <div className="absolute inset-0 rounded-full border border-dashed border-[#00D4FF]/40 animate-orbit" />
        {/* Inner concentric dotted ring */}
        <div className="absolute inset-2.5 rounded-full border border-dotted border-[#A855F7]/40" />
        {/* Center avatar box */}
        <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-2xl ring-2 ring-white/10 flex items-center justify-center bg-[#161616]">
          <AvatarGraphic id={currentPresetId} size={80} />
        </div>
      </div>
    );
  };

  const isAccentCyan = selectedRole === "USER";

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col bg-background relative overflow-y-auto">
        <div className="absolute inset-0 bg-black" />
        <header className="relative z-10 pt-8 pb-4 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Image
                src="/orbit-logo.png"
                alt="Orbit Logo"
                width={48}
                height={48}
                className="rounded-full"
              />
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-gradient-orbit">ORBIT</span>
            </div>
          </div>
        </header>
        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orbit-cyan"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-y-auto">
      {/* Background — pure black, no image */}
      <div className="absolute inset-0 bg-black" />

      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Image
              src="/orbit-logo.png"
              alt="Orbit Logo"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-gradient-orbit">ORBIT</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-6">
            <Badge variant="outline" className={`mb-4 ${
              isAccentCyan
                ? "border-orbit-cyan/30 text-orbit-cyan bg-orbit-cyan/5"
                : "border-orbit-purple/30 text-orbit-purple bg-orbit-purple/5"
            } px-4 py-1.5`}>
              {selectedRole === "USER" ? "Client Account" : "Partner Account"}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
              <span className="text-gradient-orbit">Join the</span>{" "}
              <span className="text-foreground">Orbit</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in or create your account to get started
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Profile Card */}
              <div className="orbit-card rounded-3xl p-5 sm:p-7 border border-white/[0.08]">
                {/* ─── Social Login ─── */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Google Login */}
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isAuthenticating}
                    className={`bg-white rounded-xl px-4 py-3.5 flex items-center justify-center gap-2.5 transition-all duration-200 ${
                      isAuthenticating
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                    }`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">Google</span>
                  </button>

                  {/* Apple Login */}
                  <button
                    onClick={handleAppleLogin}
                    disabled={isAuthenticating}
                    className={`bg-black rounded-xl px-4 py-3.5 flex items-center justify-center gap-2.5 transition-all duration-200 ${
                      isAuthenticating
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-900 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                    }`}
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <span className="text-sm font-semibold text-white">Apple</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-3 text-muted-foreground/60 tracking-widest">Or Email</span>
                  </div>
                </div>

                {/* ─── Avatar Selection (Unified: Avatar + Photo) ─── */}
                <div className="bg-white/[0.07] backdrop-blur-lg rounded-2xl p-5 sm:p-6 mb-4 border border-white/10">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
                    Choose Your Profile Picture
                  </h3>

                  {/* Large avatar preview */}
                  <div className="flex items-center justify-center mb-5">
                    {renderAvatarPreview()}
                  </div>

                  {/* Avatar mode tabs — only Avatar & Photo */}
                  <div className="flex items-center justify-center gap-2 mb-5">
                    {[
                      { mode: "avatar" as AvatarMode, label: "Avatar", icon: <User className="w-3.5 h-3.5" /> },
                      { mode: "photo" as AvatarMode, label: "Photo", icon: <ImagePlus className="w-3.5 h-3.5" /> },
                    ].map((tab) => (
                      <button
                        key={tab.mode}
                        onClick={() => setAvatarMode(tab.mode)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          avatarMode === tab.mode
                            ? "bg-white/15 text-white ring-1 ring-white/20"
                            : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/5"
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* 5 Avatar Presets — Matching Orbit reference UI */}
                  {avatarMode === "avatar" && (
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {AVATAR_PRESETS.map((preset) => {
                        const isSelected = (selectedAvatarPreset || "creator") === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedAvatarPreset(preset.id)}
                            className="flex flex-col items-center gap-1.5 group focus:outline-none"
                          >
                            <div
                              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden transition-all duration-200 ${
                                isSelected
                                  ? "ring-2 ring-[#00B5FF] shadow-[0_0_14px_#00B5FF] scale-105"
                                  : "opacity-75 hover:opacity-100 hover:scale-100"
                              }`}
                            >
                              <AvatarGraphic id={preset.id} size={48} />
                            </div>
                            <span
                              className={`text-[9px] sm:text-[10px] font-bold tracking-tight transition-colors ${
                                isSelected ? "text-[#00B5FF]" : "text-[#8E92A0]"
                              }`}
                            >
                              {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Photo upload */}
                  {avatarMode === "photo" && (
                    <div className="flex flex-col items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#222630] text-xs font-semibold text-[#8E92A0] hover:text-white transition-all"
                      >
                        <Camera className="w-4 h-4 text-[#00B5FF]" />
                        {photoPreview ? "Change Photo" : "Choose from Gallery"}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <p className="text-[10px] text-[#8E92A0]">Max 5MB • JPG, PNG, WebP</p>
                    </div>
                  )}
                </div>

                {/* ─── Profile Form Fields ─── */}
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-[#00B5FF] uppercase flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00B5FF]" /> FULL NAME <span className="text-[#00B5FF]">*</span>
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Test User"
                      className="bg-[#0F1115] border-[#222630] text-white text-sm font-semibold rounded-2xl h-12 focus:border-[#00B5FF] focus:ring-1 focus:ring-[#00B5FF] transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-[#A832FF] uppercase flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#A832FF]" /> EMAIL ADDRESS <span className="text-[#A832FF]">*</span>
                    </label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="test@example.com"
                      type="email"
                      disabled={isSocial}
                      className="bg-[#0F1115] border-[#222630] text-white text-sm font-semibold rounded-2xl h-12 focus:border-[#A832FF] focus:ring-1 focus:ring-[#A832FF] transition-all disabled:opacity-60"
                    />
                  </div>

                  {/* Mobile Phone (India) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-[#00B5FF] uppercase flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#00B5FF]" /> MOBILE PHONE (INDIA) <span className="text-[#00B5FF]">*</span>
                    </label>
                    <div className="flex items-center bg-[#0F1115] border border-[#222630] rounded-2xl overflow-hidden focus-within:border-[#00B5FF] transition-all h-12">
                      <div className="bg-[#16181E] px-4 text-xs font-bold text-[#8E92A0] border-r border-[#222630] flex items-center h-full">
                        +91
                      </div>
                      <input
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="9876543210"
                        type="tel"
                        maxLength={10}
                        className="bg-transparent text-white font-semibold text-sm px-4 outline-none w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Gradient CTA Button */}
                <button
                  type="button"
                  onClick={handleProfileComplete}
                  className="w-full mt-6 py-4 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 bg-gradient-to-r from-[#00D2FF] via-[#A832FF] to-[#B53CFF] shadow-[0_0_25px_rgba(0,210,255,0.35)] hover:shadow-[0_0_35px_rgba(0,210,255,0.55)] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Join the Orbit Console</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Footer Security Badge */}
                <div className="flex items-center justify-center gap-2 pt-6 text-[10px] text-[#8E92A0] font-mono tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#00B5FF]" />
                  <span>Secured by Orbit Identity Engine v2.0</span>
                </div>
                {/* Footer links */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-6">
                  <button className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
                    Privacy Policy
                  </button>
                  <span className="text-muted-foreground/20 hidden sm:inline">|</span>
                  <button className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
                    Terms of Service
                  </button>
                  <span className="text-muted-foreground/20 hidden sm:inline">|</span>
                  <button className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
                    Support
                  </button>
                </div>
              </div>
            </motion.div>
          )}

            {step === "otp" && selectedRole && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
              >
                <OTPVerification
                  email={email.trim()}
                  role={selectedRole}
                  onVerified={handleOtpVerified}
                  onBack={handleOtpBack}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-4 mt-auto">
        <div className="text-center text-xs text-muted-foreground/40">
          &copy; {new Date().getFullYear()} Orbit. All rights reserved.
        </div>
      </footer>
    </div>
  );
}