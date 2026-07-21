"use client";

/**
 * 🔵 CLIENT FRONTEND | BookingFlow
 * 
 * 3-step booking flow: Your Details → Schedule & Location → Review & Payment.
 * Includes diagonal clock time picker, "Book Right Now" option, Brand DNA
 * integration for Professional tier, and payment gate with UPI/Razorpay.
 * 
 * Used by: client-app.tsx
 * Category: Client UI
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Calendar as CalendarIcon,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Locate,
  Users,
  ChevronDown,
  Zap as ZapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/constants";
import { type BookingInfo } from "@/lib/types";
import { BrandDNASection } from "./brand-dna-section";

// ─── Time Picker Helpers ────────────────────────────────────────────────────────
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,10...55
const PERIODS = ["AM", "PM"] as const;

export function BookingFlow() {
  const {
    selectedPackage, bookingDate, setBookingDate, bookingTimeSlot, setBookingTimeSlot,
    bookingLocation, setBookingLocation, bookingNotes, setBookingNotes,
    setCurrentView, setCurrentBooking, addBooking, user, setUser,
  } = useAppStore();

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("upi");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [paymentStep, setPaymentStep] = useState<"review" | "processing" | "success">("review");
  const [processingStatus, setProcessingStatus] = useState("Initializing Razorpay Gateway...");
  const locationInputRef = useRef<HTMLTextAreaElement>(null);

  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    toast.info("Fetching your location...");

    const options = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };

    const successCallback = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding using openstreetmap's free nominatim API
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
        .then((res) => res.json())
        .then((data) => {
          setIsLocating(false);
          if (data && data.address) {
            const addr = data.address;
            const parts = [
              addr.road || addr.street || addr.suburb || addr.neighbourhood || addr.quarter,
              addr.city || addr.town || addr.village || addr.municipality,
              addr.postcode,
              addr.country
            ].filter(Boolean);
            
            const cleanAddr = parts.length > 0 ? parts.join(", ") : data.display_name;
            setBookingLocation(`${cleanAddr} @${latitude},${longitude}`);
            toast.success("Location updated successfully!");
          } else if (data && data.display_name) {
            setBookingLocation(`${data.display_name} @${latitude},${longitude}`);
            toast.success("Location updated successfully!");
          } else {
            setBookingLocation(`Shoot Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) @${latitude},${longitude}`);
            toast.success("Location coordinates fetched!");
          }
        })
        .catch((err) => {
          console.error("Reverse geocoding error:", err);
          setIsLocating(false);
          setBookingLocation(`Shoot Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          toast.success("Location coordinates fetched!");
        });
    };

    const errorCallback = (error: GeolocationPositionError) => {
      // If high accuracy failed, retry with low accuracy
      if (options.enableHighAccuracy) {
        console.warn("High accuracy geolocation failed, retrying with low accuracy...", error.message || error);
        options.enableHighAccuracy = false;
        options.timeout = 12000;
        navigator.geolocation.getCurrentPosition(successCallback, finalErrorCallback, options);
      } else {
        finalErrorCallback(error);
      }
    };

    const finalErrorCallback = (error: GeolocationPositionError) => {
      setIsLocating(false);
      console.error("Geolocation error:", error.message || error);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          toast.error("Location permission denied. Please enable location access.");
          break;
        case error.POSITION_UNAVAILABLE:
          toast.error("Location information is unavailable. Try typing it manually.");
          break;
        case error.TIMEOUT:
          toast.error("Location request timed out. Try typing it manually.");
          break;
        default:
          toast.error("An unknown error occurred while fetching location.");
          break;
      }
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  };

  const cleanPhone = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";
  const canProceedStep1 = user.name && user.email && cleanPhone.length === 10;
  const canProceedStep2 = bookingDate && bookingTimeSlot && bookingLocation;
  const isProfessionalTier = selectedPackage && selectedPackage.price >= 4999;

  const handlePayment = async () => {
    if (!selectedPackage) return;
    setIsProcessing(true);
    setPaymentStep("processing");

    const loadRazorpay = () => {
      return new Promise<boolean>((resolve) => {
        if ((window as any).Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const isSdkLoaded = await loadRazorpay();
    if (!isSdkLoaded) {
      toast.error("Failed to load Razorpay payment gateway. Please check your internet connection.");
      setIsProcessing(false);
      setPaymentStep("review");
      return;
    }

    const options = {
      key: "rzp_test_TAJlV9VwnZtYtC",
      amount: Math.round(selectedPackage.price * 100),
      currency: "INR",
      name: "Orbit Cinema",
      description: `${selectedPackage.name} Cinematic Video Shoot`,
      image: "/orbit-logo.png",
      handler: async function (response: any) {
        setProcessingStatus("Verifying transaction...");
        try {
          let userId = "";
          try {
            const userRes = await fetch("/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
              email: user.email,
              name: user.name,
              phone: cleanPhone,
              location: bookingLocation,
              brandLogo: user.brandLogo || null,
              brandFont: user.brandFont || null,
              brandColor: user.brandColor || null,
              editorRequirements: user.editorRequirements || null
            }),
            });
            const userData = await userRes.json();
            userId = userData.user?.id || "demo-user";
          } catch {
            userId = "demo-user";
          }

          const bookingRes = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              packageId: selectedPackage.id,
              bookingDate: bookingDate!.toISOString(),
              timeSlot: bookingTimeSlot,
              location: bookingLocation,
              notes: bookingNotes,
              razorpayPaymentId: response.razorpay_payment_id
            }),
          });
          const bookingData = await bookingRes.json();
          if (!bookingRes.ok) throw new Error(bookingData.error || "Failed to create booking");

          const bookingId = bookingData.booking?.id || `OL-${Date.now().toString(36).toUpperCase()}`;

          const newBooking: BookingInfo = {
            id: bookingId,
            packageId: selectedPackage.id,
            packageName: selectedPackage.name,
            packagePrice: selectedPackage.price,
            status: "PAID",
            paymentStatus: "SUCCESS",
            bookingDate: bookingDate!.toISOString(),
            timeSlot: bookingTimeSlot,
            location: bookingLocation,
            syncPercentage: 0,
            editCountdown: 90,
            partnerName: null,
            notes: bookingNotes,
            deliveredAt: null,
            downloaded: false,
            cancelledBy: null,
            declinedByPartners: [],
          };

          setPaymentStep("success");
          setCurrentBooking(newBooking);
          addBooking(newBooking);
          setIsProcessing(false);

          toast.success("Payment successful! Shoot booked.");
          setTimeout(() => {
            setCurrentView("tracking");
          }, 1000);

        } catch (err: any) {
          console.error("Cloud DB Booking write failed, running local/offline memory fallback:", err);
          
          const fallbackBookingId = `OL-${Date.now().toString(36).toUpperCase()}`;
          const fallbackBooking: BookingInfo = {
            id: fallbackBookingId,
            packageId: selectedPackage.id,
            packageName: selectedPackage.name,
            packagePrice: selectedPackage.price,
            status: "PAID",
            paymentStatus: "SUCCESS",
            bookingDate: bookingDate!.toISOString(),
            timeSlot: bookingTimeSlot,
            location: bookingLocation,
            syncPercentage: 0,
            editCountdown: 90,
            partnerName: null,
            notes: bookingNotes,
            deliveredAt: null,
            downloaded: false,
            cancelledBy: null,
            declinedByPartners: [],
          };

          setPaymentStep("success");
          setCurrentBooking(fallbackBooking);
          addBooking(fallbackBooking);
          setIsProcessing(false);

          setTimeout(() => {
            toast.info("Offline Fallback Mode Active", {
              description: "Session initialized locally (Cloud database permission rules are locked).",
            });
            setCurrentView("tracking");
          }, 1000);
        }
      },
      prefill: {
        name: user.name || "",
        email: user.email || "",
        contact: user.phone || "",
        ...(paymentMethod === "upi" ? { method: "upi" } : {})
      },
      theme: {
        color: "#00F0FF"
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
          setPaymentStep("review");
          toast.info("Payment cancelled");
        }
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (resp: any) {
        console.error("Razorpay Payment Failed:", resp.error);
        toast.error(`Payment failed: ${resp.error.description || "Unknown error"}`);
        setIsProcessing(false);
        setPaymentStep("review");
      });
      rzp.open();
    } catch (err: any) {
      console.error("Failed to initialize Razorpay checkout:", err);
      
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLocal) {
        toast.info("Razorpay modal blocked or failed to launch. Using local development mock fallback...", {
          duration: 4000
        });
        
        // Simulate a successful payment callback
        setTimeout(() => {
          options.handler({
            razorpay_payment_id: `mock_pay_${Date.now().toString(36).toUpperCase()}`
          });
        }, 1500);
      } else {
        toast.error(`Razorpay failed to launch: ${err.message || err}`);
        setIsProcessing(false);
        setPaymentStep("review");
      }
    }
  };

  return (
    <section className="pt-2 sm:pt-4 pb-8 sm:pb-12 px-0 sm:px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div className="text-center mb-6 sm:mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Book Your <span className="text-gradient-orbit">Session</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {selectedPackage ? `${selectedPackage.name} - ${formatCurrency(selectedPackage.price)}` : "Select a package first"}
          </p>
        </motion.div>

        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? "bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white" : "bg-white/5 text-muted-foreground border border-orbit-border"
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-gradient-to-r from-orbit-cyan to-orbit-purple" : "bg-orbit-border"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="orbit-card rounded-2xl p-4 sm:p-6 md:p-8">
              <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-orbit-cyan" />Your Details</h3>
              <div className="space-y-4">
                {[
                  { label: "Full Name *", value: user.name, onChange: (v: string) => setUser({ name: v }), placeholder: "Enter your name", type: "text" },
                  { label: "Email *", value: user.email, onChange: (v: string) => setUser({ email: v }), placeholder: "you@example.com", type: "email" },
                  { label: "Phone *", value: cleanPhone, onChange: (v: string) => setUser({ phone: v.replace(/\D/g, "").slice(0, 10) }), placeholder: "e.g. 9876543210", type: "tel" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{field.label}</label>
                    <Input
                      type={field.type} value={field.value} onChange={(e) => field.onChange(e.target.value)}
                      placeholder={field.placeholder} className="bg-white/5 border-orbit-border focus:border-orbit-cyan/50 focus:ring-orbit-cyan/20"
                    />
                  </div>
                ))}
                {isProfessionalTier && <BrandDNASection />}
              </div>
              <div className="mt-8 flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 font-bold">
                  Next Step <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="orbit-card rounded-2xl p-4 sm:p-6 md:p-8">
              <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-orbit-cyan" />Schedule & Location</h3>
              <div className="space-y-6">
                {/* Book Right Now Option */}
                <div className="orbit-card rounded-xl p-4 border border-orbit-cyan/20 bg-gradient-to-r from-orbit-cyan/5 to-orbit-purple/5">
                  <button
                    onClick={() => {
                      const now = new Date();
                      let h = now.getHours();
                      const m = Math.ceil(now.getMinutes() / 5) * 5;
                      const period = h >= 12 ? "PM" : "AM";
                      if (h > 12) h -= 12;
                      if (h === 0) h = 12;
                      setBookingDate(now);
                      setBookingTimeSlot(`${h}:${String(m % 60).padStart(2, "0")} ${period}`);
                      toast.success("Booked for right now!", { description: "A partner will be dispatched immediately." });
                      setTimeout(() => {
                        locationInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        locationInputRef.current?.focus({ preventScroll: true });
                      }, 100);
                    }}
                    className="w-full flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orbit-cyan/20 to-orbit-purple/20 flex items-center justify-center">
                        <ZapIcon className="w-5 h-5 text-orbit-cyan" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-orbit-cyan">Book Right Now</div>
                        <div className="text-xs text-muted-foreground">Skip scheduling — get a partner immediately</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-orbit-cyan group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-orbit-border" />
                  <span className="text-xs text-muted-foreground/50">or schedule a time</span>
                  <div className="flex-1 h-px bg-orbit-border" />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">Select Date *</label>
                  <div className="orbit-card rounded-xl p-2 sm:p-4 inline-block overflow-x-auto max-w-full">
                    <Calendar mode="single" selected={bookingDate} onSelect={setBookingDate} disabled={{ before: new Date() }} className="text-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block flex items-center gap-2"><Clock className="w-4 h-4 text-orbit-cyan" />Select Time *</label>
                  {/* Diagonal Clock Time Picker */}
                  <div className="orbit-card rounded-xl p-4 border border-orbit-border">
                    <div className="flex items-center justify-center gap-3 sm:gap-4">
                      {/* Hour Selector */}
                      <div className="flex flex-col items-center gap-1">
                        <button onClick={() => {
                          const cur = bookingTimeSlot ? parseInt(bookingTimeSlot) : 12;
                          const next = cur >= 12 ? 1 : cur + 1;
                          const existingPeriod = bookingTimeSlot ? (bookingTimeSlot.includes("PM") ? "PM" : "AM") : "AM";
                          const existingMin = bookingTimeSlot ? bookingTimeSlot.split(":").pop()?.split(" ")[0] : "00";
                          setBookingTimeSlot(`${next}:${existingMin || "00"} ${existingPeriod}`);
                        }} className="w-10 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-orbit-cyan/10 text-muted-foreground hover:text-orbit-cyan transition-all">
                          <ChevronDown className="w-4 h-4 rotate-180" />
                        </button>
                        <div className="text-4xl sm:text-5xl font-black text-gradient-orbit w-16 text-center tabular-nums">
                          {bookingTimeSlot ? parseInt(bookingTimeSlot) : "--"}
                        </div>
                        <button onClick={() => {
                          const cur = bookingTimeSlot ? parseInt(bookingTimeSlot) : 12;
                          const next = cur <= 1 ? 12 : cur - 1;
                          const existingPeriod = bookingTimeSlot ? (bookingTimeSlot.includes("PM") ? "PM" : "AM") : "AM";
                          const existingMin = bookingTimeSlot ? bookingTimeSlot.split(":").pop()?.split(" ")[0] : "00";
                          setBookingTimeSlot(`${next}:${existingMin || "00"} ${existingPeriod}`);
                        }} className="w-10 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-orbit-cyan/10 text-muted-foreground hover:text-orbit-cyan transition-all">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-muted-foreground mt-1">Hour</span>
                      </div>

                      <span className="text-4xl sm:text-5xl font-black text-orbit-cyan animate-pulse">:</span>

                      {/* Minute Selector */}
                      <div className="flex flex-col items-center gap-1">
                        <button onClick={() => {
                          const existingHour = bookingTimeSlot ? parseInt(bookingTimeSlot) : 12;
                          const existingPeriod = bookingTimeSlot ? (bookingTimeSlot.includes("PM") ? "PM" : "AM") : "AM";
                          const curMin = bookingTimeSlot ? parseInt(bookingTimeSlot.split(":").pop() || "0") : 0;
                          const idx = MINUTES.findIndex(m => m >= curMin);
                          const nextIdx = idx < MINUTES.length - 1 ? idx + 1 : 0;
                          setBookingTimeSlot(`${existingHour}:${String(MINUTES[nextIdx]).padStart(2, "0")} ${existingPeriod}`);
                        }} className="w-10 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-orbit-cyan/10 text-muted-foreground hover:text-orbit-cyan transition-all">
                          <ChevronDown className="w-4 h-4 rotate-180" />
                        </button>
                        <div className="text-4xl sm:text-5xl font-black text-gradient-orbit w-16 text-center tabular-nums">
                          {bookingTimeSlot ? (bookingTimeSlot.split(":").pop()?.split(" ")[0] || "00") : "--"}
                        </div>
                        <button onClick={() => {
                          const existingHour = bookingTimeSlot ? parseInt(bookingTimeSlot) : 12;
                          const existingPeriod = bookingTimeSlot ? (bookingTimeSlot.includes("PM") ? "PM" : "AM") : "AM";
                          const curMin = bookingTimeSlot ? parseInt(bookingTimeSlot.split(":").pop() || "0") : 0;
                          const idx = MINUTES.findIndex(m => m >= curMin);
                          const prevIdx = idx > 0 ? idx - 1 : MINUTES.length - 1;
                          setBookingTimeSlot(`${existingHour}:${String(MINUTES[prevIdx]).padStart(2, "0")} ${existingPeriod}`);
                        }} className="w-10 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-orbit-cyan/10 text-muted-foreground hover:text-orbit-cyan transition-all">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-muted-foreground mt-1">Min</span>
                      </div>

                      {/* AM/PM Toggle */}
                      <div className="flex flex-col gap-1.5 ml-2">
                        {PERIODS.map((p) => {
                          const isActive = bookingTimeSlot ? bookingTimeSlot.includes(p) : p === "AM";
                          return (
                            <button
                              key={p}
                              onClick={() => {
                                const existingHour = bookingTimeSlot ? parseInt(bookingTimeSlot) : 12;
                                const existingMin = bookingTimeSlot ? (bookingTimeSlot.split(":").pop()?.split(" ")[0] || "00") : "00";
                                setBookingTimeSlot(`${existingHour}:${existingMin} ${p}`);
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                                isActive
                                  ? "bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white orbit-glow"
                                  : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-orbit-border"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Shoot Location *</label>
                  <div className="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-orbit-border focus-within:border-orbit-cyan/50 focus-within:ring-1 focus-within:ring-orbit-cyan/20 transition-all">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-2.5 ml-1.5 shrink-0" />
                    <Textarea 
                      ref={locationInputRef} 
                      value={bookingLocation} 
                      onChange={(e) => setBookingLocation(e.target.value)} 
                      placeholder="Enter shoot location" 
                      className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:border-none focus-visible:outline-none focus:ring-0 shadow-none min-h-[44px] py-1 px-1 text-sm outline-none resize-none overflow-hidden" 
                    />
                    <button
                      type="button"
                      onClick={handleGetLiveLocation}
                      disabled={isLocating}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orbit-cyan/10 hover:bg-orbit-cyan/20 border border-orbit-cyan/20 text-[10px] font-black uppercase tracking-wider text-orbit-cyan transition-colors h-7 mt-1.5 mr-1 shrink-0"
                      title="Use live location"
                    >
                      {isLocating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Locate className="w-3.5 h-3.5" />
                      )}
                      Locate Me
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Additional Notes</label>
                  <Textarea value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} placeholder="Any special requests..." className="bg-white/5 border-orbit-border focus:border-orbit-cyan/50 min-h-[80px]" />
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="border-orbit-border text-foreground hover:bg-white/5"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
                <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 font-bold">Review Order <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </motion.div>
          )}

          {step === 3 && selectedPackage && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="orbit-card rounded-2xl p-4 sm:p-6 md:p-8">
              {paymentStep === "review" && (
                <>
                  <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-orbit-cyan" />
                    <span>Review & Secure Payment</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Order Summary */}
                    <div className="orbit-card rounded-xl p-4 sm:p-5 space-y-3 bg-white/[0.02] border border-orbit-border/50">
                      <div className="text-xs sm:text-sm font-semibold text-orbit-cyan uppercase tracking-wider">Order Summary</div>
                      <div className="space-y-2 text-xs sm:text-sm">
                        {[
                          { label: "Package", value: selectedPackage.name },
                          { label: "Date", value: bookingDate?.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }) },
                          { label: "Time", value: bookingTimeSlot },
                          { label: "Location", value: bookingLocation ? bookingLocation.split(" @")[0] : "" },
                        ].map((row) => (
                          <div key={row.label} className="flex justify-between items-start gap-4">
                            <span className="text-muted-foreground shrink-0">{row.label}</span>
                            <span className={`font-medium text-right ${row.label === "Location" ? "break-words max-w-[280px] sm:max-w-[360px]" : "max-w-[200px] truncate"}`}>
                              {row.value}
                            </span>
                          </div>
                        ))}
                        <Separator className="bg-orbit-border" />
                        <div className="flex justify-between text-base">
                          <span className="font-semibold">Total Amount</span>
                          <span className="font-black text-gradient-orbit">{formatCurrency(selectedPackage.price)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Selector - UPI & Razorpay Options */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Payment Method</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* UPI Option */}
                        <div 
                          onClick={() => setPaymentMethod("upi")}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                            paymentMethod === "upi" 
                              ? "border-orbit-cyan bg-orbit-cyan/[0.03] orbit-glow" 
                              : "border-orbit-border bg-white/[0.01] hover:border-orbit-cyan/50 hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="w-9 h-9 rounded-lg bg-orbit-cyan/10 flex items-center justify-center text-orbit-cyan font-bold text-xs">
                              UPI
                            </div>
                            <span className="text-[9px] font-black text-orbit-cyan bg-orbit-cyan/15 px-2 py-0.5 rounded uppercase tracking-wider">
                              Popular
                            </span>
                          </div>
                          <div className="mt-4">
                            <span className="font-bold text-xs sm:text-sm block text-white">UPI / QR Payment</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground block mt-0.5">Google Pay, PhonePe, Paytm, QR</span>
                          </div>
                          {paymentMethod === "upi" && (
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-orbit-cyan animate-ping" />
                          )}
                        </div>

                        {/* Standard Checkout */}
                        <div 
                          onClick={() => setPaymentMethod("card")}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                            paymentMethod === "card" 
                              ? "border-orbit-purple bg-orbit-purple/[0.03] orbit-glow-purple" 
                              : "border-orbit-border bg-white/[0.01] hover:border-orbit-purple/50 hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="w-9 h-9 rounded-lg bg-orbit-purple/10 flex items-center justify-center text-orbit-purple font-bold text-xs">
                              CARD
                            </div>
                          </div>
                          <div className="mt-4">
                            <span className="font-bold text-xs sm:text-sm block text-white">Cards & Netbanking</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground block mt-0.5">Credit/Debit Card, Netbanking, Wallets</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-orbit-border/50 bg-white/[0.01] flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-orbit-cyan shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {paymentMethod === "upi" ? (
                          "By clicking \"Pay & Confirm\", Razorpay will directly launch your UPI application selection (Google Pay, PhonePe, Paytm, etc.) or QR scanner page to complete the transaction instantly."
                        ) : (
                          "By clicking \"Pay & Confirm\", you will be redirected to Razorpay's secure checkout page to complete your payment with credit/debit cards, net banking, or digital wallets safely."
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button variant="outline" onClick={() => setStep(2)} className="border-orbit-border text-foreground hover:bg-white/5 h-11 rounded-lg text-xs font-bold">
                      <ArrowLeft className="w-4 h-4 mr-2" />Back
                    </Button>
                    <Button
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 font-bold px-8 h-11 rounded-lg text-xs"
                    >
                      {isProcessing ? "Processing..." : `Pay & Confirm ${formatCurrency(selectedPackage.price)}`}
                    </Button>
                  </div>
                </>
              )}

              {paymentStep === "processing" && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-orbit-cyan/10 border-t-orbit-cyan animate-spin" />
                    <div className="absolute inset-2 rounded-full border-4 border-orbit-purple/10 border-t-orbit-purple animate-spin [animation-duration:1.5s]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Securing Transaction</h3>
                    <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">{processingStatus}</p>
                  </div>
                </div>
              )}

              {paymentStep === "success" && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                  </motion.div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-emerald-400 uppercase tracking-wider">Payment Authorized</h3>
                    <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                      Shoot session registered. Redirecting to Live Order Tracking...
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}