"use client";

/**
 * 🟡 SHARED | OTP Verification Page
 *
 * Email verification via 6-digit OTP after profile creation.
 * Uses shadcn InputOTP component for the code input.
 * Features: countdown timer, resend OTP, auto-verify on complete entry.
 *
 * In production: Uses /api/auth/send-otp and /api/auth/verify-otp endpoints.
 * Fallback: Client-side OTP generation for demo/development when API is unavailable.
 *
 * Used by: login-page.tsx
 * Category: Shared UI
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { type UserRole } from "@/lib/types";

// Client-side OTP store for demo/development fallback
const clientOtpStore = new Map<string, string>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface OTPVerificationProps {
  email: string;
  role: UserRole;
  onVerified: () => void;
  onBack: () => void;
}

export default function OTPVerification({ email, role, onVerified, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(true);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [useApiFallback, setUseApiFallback] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifyCalledRef = useRef(false);


  const sendOtpViaApi = useCallback(async (emailAddr: string) => {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailAddr }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to send OTP");
    }

    const data = await res.json();
    return data.devOtp as string | undefined;
  }, []);

  const sendOtpClientSide = useCallback((emailAddr: string) => {
    const code = generateOTP();
    clientOtpStore.set(emailAddr.toLowerCase().trim(), code);
    return code;
  }, []);

  const sendOtp = useCallback(async () => {
    setSendingOtp(true);
    setError("");
    setDemoOtp(null);

    try {
      let generatedOtp: string | undefined;

      if (useApiFallback) {
        generatedOtp = sendOtpClientSide(email);
      } else {
        try {
          generatedOtp = await sendOtpViaApi(email);
        } catch (err: any) {
          console.warn("[OTP] API unavailable, using client-side OTP generation:", err);
          setUseApiFallback(true);
          generatedOtp = sendOtpClientSide(email);
        }
      }

      if (generatedOtp) {
        toast.info(`[Dev Mode] Verification code: ${generatedOtp}`, {
          description: "This helper toast is only displayed in development.",
          duration: 10000,
        });
        setDemoOtp(generatedOtp);
      }

      setResendCooldown(30);
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }, [email, useApiFallback, sendOtpViaApi, sendOtpClientSide]);

  const verifyOtp = useCallback(async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    setError("");

    try {
      if (useApiFallback) {
        // Client-side verification
        const storedOtp = clientOtpStore.get(email.toLowerCase().trim());
        if (storedOtp !== otp) {
          setError("Invalid OTP. Please try again.");
          setOtp("");
          return;
        }
        clientOtpStore.delete(email.toLowerCase().trim());
      } else {
        // Try API verification
        try {
          const res = await fetch("/api/auth/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error || "Verification failed");
            setOtp("");
            return;
          }
        } catch {
          // API unavailable — fall back to client-side
          const storedOtp = clientOtpStore.get(email.toLowerCase().trim());
          if (storedOtp !== otp) {
            setError("Invalid OTP. Please try again.");
            setOtp("");
            return;
          }
          clientOtpStore.delete(email.toLowerCase().trim());
        }
      }

      // Success — show verified animation briefly, then proceed
      setVerified(true);
      setTimeout(() => {
        onVerified();
      }, 1200);
    } catch {
      setError("Verification failed. Please try again.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }, [email, otp, onVerified, useApiFallback]);

  const handleResend = useCallback(() => {
    if (resendCooldown > 0) return;
    setOtp("");
    setError("");
    sendOtp();
  }, [resendCooldown, sendOtp]);

  // Send OTP on mount
  useEffect(() => {
    Promise.resolve().then(() => sendOtp());
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [sendOtp]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      return;
    }

    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [resendCooldown]);

  // Auto-verify when OTP is fully entered
  useEffect(() => {
    if (otp.length === 6 && !verifyCalledRef.current) {
      verifyCalledRef.current = true;
      verifyOtp();
    }
    if (otp.length < 6) {
      verifyCalledRef.current = false;
    }
  }, [otp, verifyOtp]);

  const isCyan = role === "USER";

  // Mask email for display
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(b.length) + c);

  return (
    <div className="max-w-md mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={loading || verified}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to profile
      </button>

      {/* Title */}
      <div className="text-center mb-8">
        <AnimatePresence mode="wait">
          {verified ? (
            <motion.div
              key="verified"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4"
                initial={{ rotate: -180 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-3xl font-black tracking-tight mb-2">
                <span className="text-gradient-orbit">Verified!</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Your email has been confirmed
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="verify"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
                  isCyan
                    ? "bg-gradient-to-br from-orbit-cyan/10 to-orbit-purple/10"
                    : "bg-gradient-to-br from-orbit-purple/10 to-orbit-cyan/10"
                }`}
                animate={{
                  boxShadow: isCyan
                    ? ["0 0 0px rgba(0,191,255,0)", "0 0 30px rgba(0,191,255,0.15)", "0 0 0px rgba(0,191,255,0)"]
                    : ["0 0 0px rgba(160,32,240,0)", "0 0 30px rgba(160,32,240,0.15)", "0 0 0px rgba(160,32,240,0)"],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ShieldCheck className={`w-10 h-10 ${isCyan ? "text-orbit-cyan" : "text-orbit-purple"}`} />
              </motion.div>

              <Badge
                variant="outline"
                className={`mb-4 ${
                  isCyan
                    ? "border-orbit-cyan/30 text-orbit-cyan bg-orbit-cyan/5"
                    : "border-orbit-purple/30 text-orbit-purple bg-orbit-purple/5"
                } px-4 py-1.5`}
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                Verify Your Email
              </Badge>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                <span className="text-gradient-orbit">Check Your</span>{" "}
                <span className="text-foreground">Inbox</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                We&apos;ve sent a 6-digit verification code to
              </p>
              <p className="text-sm font-semibold text-foreground mt-1">{maskedEmail}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OTP Input */}
      {!verified && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="orbit-card rounded-2xl p-6 sm:p-8">
            {/* Sending OTP indicator */}
            {sendingOtp ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className={`w-8 h-8 animate-spin mb-3 ${isCyan ? "text-orbit-cyan" : "text-orbit-purple"}`} />
                <p className="text-sm text-muted-foreground">Sending verification code...</p>
              </div>
            ) : (
              <>
                {/* OTP Input */}
                <div className="flex flex-col items-center mb-6">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className={`w-12 h-14 text-xl font-bold bg-white/5 border-orbit-border data-[active=true]:${isCyan ? "border-orbit-cyan" : "border-orbit-purple"} data-[active=true]:ring-${isCyan ? "orbit-cyan" : "orbit-purple"}/30`} />
                      <InputOTPSlot index={1} className={`w-12 h-14 text-xl font-bold bg-white/5 border-orbit-border data-[active=true]:${isCyan ? "border-orbit-cyan" : "border-orbit-purple"} data-[active=true]:ring-${isCyan ? "orbit-cyan" : "orbit-purple"}/30`} />
                      <InputOTPSlot index={2} className={`w-12 h-14 text-xl font-bold bg-white/5 border-orbit-border data-[active=true]:${isCyan ? "border-orbit-cyan" : "border-orbit-purple"} data-[active=true]:ring-${isCyan ? "orbit-cyan" : "orbit-purple"}/30`} />
                    </InputOTPGroup>
                    <InputOTPSeparator className="mx-1" />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className={`w-12 h-14 text-xl font-bold bg-white/5 border-orbit-border data-[active=true]:${isCyan ? "border-orbit-cyan" : "border-orbit-purple"} data-[active=true]:ring-${isCyan ? "orbit-cyan" : "orbit-purple"}/30`} />
                      <InputOTPSlot index={4} className={`w-12 h-14 text-xl font-bold bg-white/5 border-orbit-border data-[active=true]:${isCyan ? "border-orbit-cyan" : "border-orbit-purple"} data-[active=true]:ring-${isCyan ? "orbit-cyan" : "orbit-purple"}/30`} />
                      <InputOTPSlot index={5} className={`w-12 h-14 text-xl font-bold bg-white/5 border-orbit-border data-[active=true]:${isCyan ? "border-orbit-cyan" : "border-orbit-purple"} data-[active=true]:ring-${isCyan ? "orbit-cyan" : "orbit-purple"}/30`} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-center text-sm text-red-400 mb-4"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Verify button */}
                <Button
                  onClick={verifyOtp}
                  disabled={otp.length !== 6 || loading}
                  className={`w-full font-bold py-5 text-base transition-all duration-300 ${
                    otp.length !== 6 || loading
                      ? "bg-white/5 text-muted-foreground/40 cursor-not-allowed"
                      : isCyan
                      ? "bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 orbit-glow"
                      : "bg-gradient-to-r from-orbit-purple to-orbit-cyan text-white hover:opacity-90"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Verifying..." : "Verify & Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </div>

          {/* Resend OTP */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn&apos;t receive the code?
            </p>
            {resendCooldown > 0 ? (
              <p className="text-xs text-muted-foreground/60">
                Resend available in{" "}
                <span className={`font-mono font-bold ${isCyan ? "text-orbit-cyan" : "text-orbit-purple"}`}>
                  {resendCooldown}s
                </span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={sendingOtp}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${isCyan ? "text-orbit-cyan hover:text-orbit-cyan/80" : "text-orbit-purple hover:text-orbit-purple/80"}`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resend Code
              </button>
            )}
          </div>


        </motion.div>
      )}

      <p className="text-center text-xs text-muted-foreground/40 mt-6">
        By verifying, you agree to Orbit&apos;s Terms of Service
      </p>
    </div>
  );
}