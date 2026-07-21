/**
 * Orbit - Zustand State Management
 *
 * Central application state using Zustand with localStorage persistence.
 * Manages auth, navigation, user profile, packages, bookings, and partner state.
 *
 * IMPORTANT: localStorage is read AFTER mount (via useHydrate hook) to avoid
 * server/client hydration mismatches.
 */

import { create } from "zustand";
import { type AppView, type AppPhase, type BookingStatus, type PaymentStatus, type UserRole, type PackageInfo, type BookingInfo, type UserProfile, type ReviewInfo, type BankAccount, type PartnerWallet, type PartnerSettings } from "./types";

// Generate a stable ID for this device/session
function generatePartnerId(): string {
  if (typeof window === "undefined") return "";
  const key = "orbit-partner-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `partner-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = "orbit-app-state";

function loadFromStorage(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(state: any) {
  if (typeof window === "undefined") return;
  try {
    const toSave = {
      isAuthenticated: state.isAuthenticated,
      userRole: state.userRole,
      user: state.user,
      currentView: state.currentView,
      bookings: state.bookings,
      reviews: state.reviews,
      partnerActiveBooking: state.partnerActiveBooking,
      partnerId: state.partnerId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

function clearStorage() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

const defaultWallet: PartnerWallet = {
  balance: 0,
  pendingClearance: 0,
  totalWithdrawn: 0,
  lastWithdrawnAt: null,
};

const defaultSettings: PartnerSettings = {
  notificationsEnabled: true,
  newBookingAlerts: true,
  paymentAlerts: true,
  autoSyncOnWifi: true,
  highQualityUpload: false,
  locationTracking: true,
};

const defaultUser: UserProfile = {
  name: "",
  email: "",
  phone: "",
  location: "",
  avatar: null,
  avatarType: "color",
  avatarEmoji: null,
  avatarPhotoUrl: null,
  avatarImage: null,
  brandLogo: null,
  brandFont: null,
  brandColor: null,
  editorRequirements: "",
  authProvider: null,
  isOnline: true,
  bankAccount: null,
  wallet: defaultWallet,
  settings: defaultSettings,
  isVerified: false,
};

interface AppState {
  // Hydration
  _hydrated: boolean;
  _hydrate: () => void;

  // App phase
  appPhase: AppPhase;
  setAppPhase: (phase: AppPhase) => void;

  // Auth
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (role: UserRole) => Promise<void>;
  logout: () => void;

  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // User
  user: UserProfile;
  setUser: (user: Partial<UserProfile>) => void;
  toggleOnline: () => Promise<void>;

  // Packages
  packages: PackageInfo[];
  fetchPackages: () => Promise<void>;
  selectedPackage: PackageInfo | null;
  setSelectedPackage: (pkg: PackageInfo | null) => void;

  // Package highlight (used when Brand DNA redirects to packages page)
  highlightedPackageId: string | null;
  setHighlightedPackageId: (id: string | null) => void;

  // Booking
  currentBooking: BookingInfo | null;
  setCurrentBooking: (booking: BookingInfo | null) => void;
  bookings: BookingInfo[];
  addBooking: (booking: BookingInfo) => void;
  updateBookingStatus: (id: string, status: BookingStatus, extra?: Partial<BookingInfo>) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void;
  updateSyncPercentage: (id: string, percentage: number) => void;
  updateEditCountdown: (id: string, minutes: number) => void;
  completeBooking: (id: string) => void;
  cancelBooking: (id: string, cancelledBy: "CLIENT" | "PARTNER") => void;
  markBookingDownloaded: (id: string) => void;
  markBookingDelivered: (id: string) => void;
  fetchClientBookings: () => Promise<void>;

  // Partner
  partnerActiveBooking: BookingInfo | null;
  setPartnerActiveBooking: (booking: BookingInfo | null) => void;

  // Partner wallet
  creditPartnerWallet: (amount: number) => void;
  withdrawFromWallet: (amount: number) => Promise<void>;
  linkBankAccount: (account: BankAccount) => Promise<void>;
  fetchPartnerProfile: () => Promise<void>;

  // Partner settings
  updatePartnerSettings: (settings: Partial<PartnerSettings>) => void;

  // Available bookings pushed to this partner via API/WebSocket
  availableBookings: BookingInfo[];
  setAvailableBookings: (bookings: BookingInfo[]) => void;
  addAvailableBooking: (booking: BookingInfo) => void;
  removeAvailableBooking: (bookingId: string) => void;

  // Partner ID for API/WebSocket identification
  partnerId: string;
  setPartnerId: (id: string) => void;

  // Fetch available bookings from API
  fetchAvailableBookings: () => Promise<void>;

  // Booking form
  bookingDate: Date | undefined;
  setBookingDate: (date: Date | undefined) => void;
  bookingTimeSlot: string;
  setBookingTimeSlot: (slot: string) => void;
  bookingLocation: string;
  setBookingLocation: (location: string) => void;
  bookingNotes: string;
  setBookingNotes: (notes: string) => void;

  // Reviews
  reviews: ReviewInfo[];
  submitReview: (review: ReviewInfo) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Hydration — starts false, set to true after localStorage is read
  _hydrated: false,
  _hydrate: () => {
    const stored = loadFromStorage();
    if (stored) {
      const storedUser = (stored.user as UserProfile) ?? defaultUser;
      const storedBookings = ((stored.bookings as BookingInfo[]) ?? []).map((b) => ({
        ...b,
        deliveredAt: b.deliveredAt ?? null,
        downloaded: b.downloaded ?? false,
        cancelledBy: b.cancelledBy ?? null,
        declinedByPartners: b.declinedByPartners ?? [],
      }));
      set({
        _hydrated: true,
        isAuthenticated: (stored.isAuthenticated as boolean) ?? false,
        userRole: (stored.userRole as UserRole) ?? "USER",
        user: {
          ...defaultUser,
          ...storedUser,
          authProvider: storedUser.authProvider ?? null,
          isOnline: storedUser.isOnline ?? true,
          bankAccount: storedUser.bankAccount ?? null,
          wallet: { ...defaultWallet, ...(storedUser.wallet ?? {}) },
          settings: { ...defaultSettings, ...(storedUser.settings ?? {}) },
          isVerified: storedUser.isVerified ?? false,
        },
        currentView: (stored.currentView as AppView) ?? "landing",
        bookings: storedBookings,
        reviews: (stored.reviews as ReviewInfo[]) ?? [],
        partnerActiveBooking: (stored.partnerActiveBooking as BookingInfo | null) ?? null,
        partnerId: (stored.partnerId as string) || generatePartnerId(),
        appPhase: stored.isAuthenticated ? "app" : "auth",
      });
    } else {
      set({ _hydrated: true, partnerId: generatePartnerId() });
    }
  },

  // App phase
  appPhase: "auth",
  setAppPhase: (phase) => set({ appPhase: phase }),

  // Auth
  isAuthenticated: false,
  userRole: "USER",
  login: async (role) => {
    let pid = get().partnerId;
    const email = get().user.email;
    const name = get().user.name;
    const phone = get().user.phone;

    if (role === "PARTNER" && email) {
      try {
        // 1. Fetch all partners to check if partner with this email exists
        const res = await fetch("/api/partners");
        if (res.ok) {
          const data = await res.json();
          const existingPartner = data.partners?.find(
            (p: any) => p.user?.email?.toLowerCase().trim() === email.toLowerCase().trim()
          );

          if (existingPartner) {
            pid = existingPartner.id;
            console.log(`[Store] Found existing partner in DB: ${pid}`);
          } else {
            // 2. If not found, check if a User exists or create one
            let dbUserId = "";
            const userRes = await fetch("/api/users");
            if (userRes.ok) {
              const userData = await userRes.json();
              const existingUser = userData.users?.find(
                (u: any) => u.email?.toLowerCase().trim() === email.toLowerCase().trim()
              );
              if (existingUser) {
                dbUserId = existingUser.id;
              }
            }

            if (!dbUserId) {
              // Create user
              const createUserRes = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name, phone, role: "PARTNER" }),
              });
              if (createUserRes.ok) {
                const newUserData = await createUserRes.json();
                dbUserId = newUserData.user?.id;
              }
            }

            if (dbUserId) {
              // Create partner
              const createPartnerRes = await fetch("/api/partners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: dbUserId,
                  location: get().user.location || "Mumbai, India",
                  deviceInfo: "iPhone 15 Pro",
                }),
              });
              if (createPartnerRes.ok) {
                const partnerData = await createPartnerRes.json();
                pid = partnerData.partner?.id;
                console.log(`[Store] Created new partner in DB: ${pid}`);
              }
            }
          }
        }
      } catch (err) {
        console.error("[Store] Error syncing partner on login:", err);
      }
    }

    if (!pid) pid = generatePartnerId();

    const newState = {
      isAuthenticated: true,
      userRole: role,
      currentView: (role === "PARTNER" ? "partner" : "landing") as AppView,
      appPhase: "app" as AppPhase,
      partnerId: pid,
    };
    set(newState);
    saveToStorage({ ...get(), ...newState });

    if (role === "PARTNER") {
      await get().fetchPartnerProfile();
    }
  },
  logout: () => {
    set({
      isAuthenticated: false,
      userRole: "USER" as UserRole,
      currentView: "landing" as AppView,
      currentBooking: null,
      partnerActiveBooking: null,
      appPhase: "auth" as AppPhase,
      user: defaultUser,
      bookings: [],
      reviews: [],
      availableBookings: [],
    });
    clearStorage();
  },

  // Navigation
  currentView: "landing",
  setCurrentView: (view) => {
    set({ currentView: view });
    saveToStorage(get());
  },

  // User
  user: defaultUser,
  setUser: (user) =>
    set((state) => {
      const newUser = { ...state.user, ...user };
      const newState = { user: newUser };
      saveToStorage({ ...get(), ...newState });
      return newState;
    }),
  toggleOnline: async () => {
    const state = get();
    const nextVal = !state.user.isOnline;
    const updatedUser = { ...state.user, isOnline: nextVal };
    set({ user: updatedUser });
    saveToStorage({ ...get(), user: updatedUser });

    if (state.partnerId && state.userRole === "PARTNER") {
      try {
        await fetch(`/api/partners/${state.partnerId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ availability: nextVal }),
        });
      } catch (err) {
        console.error("[Store] Failed to update availability on server:", err);
      }
    }
  },

  // Packages
  packages: [
    {
      id: "pkg-personalized",
      name: "Personalized",
      tier: "PERSONALIZED",
      price: 1999,
      focus: "Individual/Event cinematic reels",
      deliveryTime: "60-120 mins",
      features: [
        "Professional cinematic edit",
        "1 Reel (up to 60 sec)",
        "Color grading & transitions",
        "Background music sync",
        "60-120 min delivery",
        "1 revision round",
      ],
      popular: false,
    },
    {
      id: "pkg-professional",
      name: "Professional (UGC)",
      tier: "PROFESSIONAL",
      price: 4999,
      focus: "Brand-focused storytelling with Brand DNA",
      deliveryTime: "60-120 mins",
      features: [
        "All Personalized features",
        "Brand DNA integration",
        "Logo/Font matching & Editor chat",
        "Up to 3 Reels (60 sec each)",
        "Multi-platform optimization",
        "2 revision rounds",
        "Priority editing queue",
      ],
      popular: true,
    },
  ],
  fetchPackages: async () => {
    try {
      const res = await fetch('/api/packages');
      if (res.ok) {
        const data = await res.json();
        if (data.packages && data.packages.length > 0) {
          const mapped: PackageInfo[] = data.packages.map((pkg: Record<string, unknown>) => ({
            id: pkg.id as string,
            name: pkg.name as string,
            tier: pkg.tier as string,
            price: pkg.price as number,
            focus: pkg.focus as string,
            deliveryTime: pkg.deliveryTime as string,
            features: Array.isArray(pkg.features) ? pkg.features as string[] : JSON.parse(pkg.features as string || '[]'),
            popular: pkg.popular as boolean,
          }));
          set({ packages: mapped });
        }
      }
    } catch {
      // Keep client-side defaults
    }
  },
  selectedPackage: null,
  setSelectedPackage: (pkg) => set({ selectedPackage: pkg }),

  // Package highlight
  highlightedPackageId: null,
  setHighlightedPackageId: (id) => set({ highlightedPackageId: id }),

  // Booking
  currentBooking: null,
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  bookings: [],
  addBooking: (booking) =>
    set((state) => {
      const exists = state.bookings.some((b) => b.id === booking.id);
      if (exists) {
        const newBookings = state.bookings.map((b) =>
          b.id === booking.id ? booking : b
        );
        saveToStorage({ ...get(), bookings: newBookings });
        return { bookings: newBookings };
      }
      const newBookings = [...state.bookings, booking];
      saveToStorage({ ...get(), bookings: newBookings });
      return { bookings: newBookings };
    }),
  updateBookingStatus: (id, status, extra) =>
    set((state) => {
      const newState = {
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, status, ...extra } : b
        ),
        currentBooking:
          state.currentBooking?.id === id
            ? { ...state.currentBooking, status, ...extra }
            : state.currentBooking,
        ...(status === "EDITING" && state.userRole === "PARTNER"
          ? {
              user: {
                ...state.user,
                wallet: {
                  ...state.user.wallet,
                  balance: state.user.wallet.balance + 700,
                },
              },
            }
          : {}),
      };
      saveToStorage({ ...get(), ...newState });
      return newState;
    }),
  updatePaymentStatus: (id, paymentStatus) =>
    set((state) => {
      const newState = {
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, paymentStatus } : b
        ),
        currentBooking:
          state.currentBooking?.id === id
            ? { ...state.currentBooking, paymentStatus }
            : state.currentBooking,
      };
      saveToStorage({ ...get(), ...newState });
      return newState;
    }),
  updateSyncPercentage: (id, syncPercentage) =>
    set((state) => {
      const newState = {
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, syncPercentage } : b
        ),
        currentBooking:
          state.currentBooking?.id === id
            ? { ...state.currentBooking, syncPercentage }
            : state.currentBooking,
      };
      saveToStorage({ ...get(), ...newState });
      return newState;
    }),
  updateEditCountdown: (id, editCountdown) =>
    set((state) => {
      const newState = {
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, editCountdown } : b
        ),
        currentBooking:
          state.currentBooking?.id === id
            ? { ...state.currentBooking, editCountdown }
            : state.currentBooking,
      };
      saveToStorage({ ...get(), ...newState });
      return newState;
    }),
  completeBooking: (id) =>
    set((state) => {
      const updatedBookings = state.bookings.map((b) =>
        b.id === id ? { ...b, status: "DELIVERED" as BookingStatus } : b
      );
      const newState = {
        bookings: updatedBookings,
        currentBooking: null as BookingInfo | null,
      };
      saveToStorage({ ...get(), ...newState });
      return newState;
    }),
  cancelBooking: (id, cancelledBy) =>
    set((state) => {
      const updatedBookings = state.bookings.map((b) =>
        b.id === id
          ? { ...b, status: "CANCELLED" as BookingStatus, cancelledBy, paymentStatus: "REFUNDED" as PaymentStatus }
          : b
      );
      const updatedCurrentBooking =
        state.currentBooking?.id === id
          ? { ...state.currentBooking, status: "CANCELLED" as BookingStatus, cancelledBy, paymentStatus: "REFUNDED" as PaymentStatus }
          : state.currentBooking;
      const newState = {
        bookings: updatedBookings,
        currentBooking: cancelledBy === "CLIENT" ? null : updatedCurrentBooking,
      };
      saveToStorage({ ...get(), ...newState });
      return newState;
    }),
  markBookingDownloaded: (id) =>
    set((state) => {
      const newState = {
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, downloaded: true } : b
        ),
        currentBooking:
          state.currentBooking?.id === id
            ? { ...state.currentBooking, downloaded: true }
            : state.currentBooking,
      };
      saveToStorage({ ...get(), ...newState });
      return newState;
    }),
  markBookingDelivered: (id) =>
    set((state) => {
      const newState = {
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, deliveredAt: new Date().toISOString() } : b
        ),
        currentBooking:
          state.currentBooking?.id === id
            ? { ...state.currentBooking, deliveredAt: new Date().toISOString() }
            : state.currentBooking,
      };
      saveToStorage({ ...get(), ...newState });
      return newState;
    }),
  fetchClientBookings: async () => {
    const state = get();
    if (!state.user.email) return;
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(state.user.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.bookings) {
          const historicalBookings: BookingInfo[] = data.bookings.map((b: any) => {
            // Normalise READY_TO_EDIT → EDITING so the client pipeline step is correct
            const normStatus = b.status === "READY_TO_EDIT" ? "EDITING" : b.status;
            return {
              id: b.id,
              packageId: b.packageId,
              packageName: b.package?.name || "",
              packagePrice: b.package?.price || 0,
              status: normStatus as BookingStatus,
              paymentStatus: b.paymentStatus as PaymentStatus,
              bookingDate: b.bookingDate,
              timeSlot: b.timeSlot,
              location: b.location || "",
              syncPercentage: b.syncPercentage || 0,
              editCountdown: b.editCountdown || null,
              partnerName: b.partner?.user?.name || null,
              notes: b.notes || "",
              deliveredAt: b.deliveredAt || null,
              downloaded: b.downloaded || false,
              cancelledBy: b.cancelledBy || null,
              declinedByPartners: b.declinedBy ? (typeof b.declinedBy === 'string' ? JSON.parse(b.declinedBy) : b.declinedBy) : [],
              reelUrl: b.reelUrl,
              masterReelUrl: b.masterReelUrl || null,
              hlsPlaylistUrl: b.hlsPlaylistUrl || null,
              proxyFootageUrl: b.proxyFootageUrl || null,
            };
          });

          // Include DELIVERED bookings that haven't been downloaded yet so
          // the tracking page stays visible until the client downloads their reel.
          const activeBooking = historicalBookings.find(
            (b) => b.status !== "CANCELLED" && !(b.status === "DELIVERED" && b.downloaded)
          ) || null;

          set({
            bookings: historicalBookings,
            currentBooking: activeBooking,
          });
          saveToStorage({ ...get(), bookings: historicalBookings, currentBooking: activeBooking });
        }
      }
    } catch (err) {
      console.error("[Store] Error fetching client bookings:", err);
    }
  },

  // Partner
  partnerActiveBooking: null,
  setPartnerActiveBooking: (booking) => {
    const newState = { partnerActiveBooking: booking };
    set(newState);
    saveToStorage({ ...get(), ...newState });
  },

  // Partner wallet operations
  creditPartnerWallet: (amount) =>
    set((state) => {
      const newState = {
        user: {
          ...state.user,
          wallet: {
            ...state.user.wallet,
            balance: state.user.wallet.balance + amount,
          },
        },
      };
      saveToStorage({ ...get(), ...newState });
      return newState;
    }),
  withdrawFromWallet: async (amount) => {
    const state = get();
    const pid = state.partnerId;
    if (!pid) return;

    try {
      const res = await fetch(`/api/partners/${pid}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        await get().fetchPartnerProfile();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Withdrawal failed");
      }
    } catch (err) {
      console.error("[Store] Error withdrawing from wallet:", err);
      throw err;
    }
  },
  linkBankAccount: async (account) => {
    // NOTE: The linkBankAccount store action is intentionally kept for legacy
    // compatibility (e.g. types). The real bank-linking call is made directly
    // from the UI forms via fetch("/api/partners/link-bank") so that the form
    // can surface per-field validation errors and PAN/penny-drop status to the
    // user in real-time. After the API call succeeds, fetchPartnerProfile() is
    // called to sync the verified bank state back to the store.
    try {
      const res = await fetch("/api/partners/link-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountHolderName: account.accountHolderName,
          accountNumber: account.accountNumber,
          ifsc: account.ifscCode,
          pan: (account as any).pan || "",
        }),
      });

      if (res.ok) {
        await get().fetchPartnerProfile();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Bank linking failed");
      }
    } catch (err) {
      console.error("[Store] Error linking bank account:", err);
      throw err;
    }
  },
  fetchPartnerProfile: async () => {
    const state = get();
    const pid = state.partnerId;
    if (!pid || state.userRole !== "PARTNER") return;

    try {
      // 1. Fetch partner detail (including bookings & user details)
      const res = await fetch(`/api/partners/${pid}`);
      if (!res.ok) return;
      const data = await res.json();
      const partner = data.partner;
      if (!partner) return;

      // 2. Fetch partner wallet detail
      const walletRes = await fetch(`/api/partners/${pid}/wallet`);
      let walletData = defaultWallet;
      let bankData: BankAccount | null = null;
      if (walletRes.ok) {
        const wData = await walletRes.json();
        walletData = {
          balance: wData.balance || 0,
          pendingClearance: wData.pendingClearance || 0,
          totalWithdrawn: wData.totalWithdrawn || 0,
          lastWithdrawnAt: wData.transactions?.find((t: any) => t.type === 'WITHDRAWAL')?.createdAt || null,
        };
        if (wData.bankVerified && wData.accountNumberMasked) {
          bankData = {
            id: 'bank-acc',
            bankName: wData.bankName || "",
            accountNumber: wData.accountNumberMasked || "",
            ifscCode: partner.ifscCode || "",
            accountHolderName: partner.accountHolderName || partner.user?.name || "",
            isVerified: wData.bankVerified,
            linkedAt: partner.updatedAt,
          };
        }
      }

      // 3. Map bookings list
      const rawBookingsList = partner.bookings || [...(partner.activeBookings || []), ...(partner.completedBookings || [])];
      const historicalBookings: BookingInfo[] = rawBookingsList.map((b: any) => ({
        id: b.id,
        packageId: b.packageId,
        packageName: b.package?.name || "",
        packagePrice: b.package?.price || 0,
        status: b.status as BookingStatus,
        paymentStatus: b.paymentStatus as PaymentStatus,
        bookingDate: b.bookingDate,
        timeSlot: b.timeSlot,
        location: b.location || "",
        syncPercentage: b.syncPercentage || 0,
        editCountdown: b.editCountdown || null,
        partnerName: partner.user?.name || null,
        notes: b.notes || "",
        deliveredAt: b.deliveredAt || null,
        downloaded: b.downloaded || false,
        cancelledBy: b.cancelledBy || null,
        declinedByPartners: (() => {
          if (!b.declinedBy) return [];
          if (typeof b.declinedBy === 'string') {
            try {
              return JSON.parse(b.declinedBy);
            } catch {
              return [];
            }
          }
          return Array.isArray(b.declinedBy) ? b.declinedBy : [];
        })(),
        reelUrl: b.reelUrl,
        masterReelUrl: b.masterReelUrl || null,
        hlsPlaylistUrl: b.hlsPlaylistUrl || null,
        proxyFootageUrl: b.proxyFootageUrl || null,
      }));

      // 4. Find active booking
      const activeBooking = historicalBookings.find(
        (b) => b.status !== "DELIVERED" && b.status !== "CANCELLED"
      ) || null;

      // Update local state
      const updatedUser = {
        ...state.user,
        name: partner.user?.name || state.user.name,
        email: partner.user?.email || state.user.email,
        phone: partner.user?.phone || state.user.phone,
        location: partner.location || state.user.location,
        avatar: partner.user?.avatar || state.user.avatar,
        wallet: walletData,
        bankAccount: bankData,
      };

      set({
        user: updatedUser,
        bookings: historicalBookings,
        partnerActiveBooking: activeBooking,
      });

      saveToStorage({ ...get(), user: updatedUser, bookings: historicalBookings, partnerActiveBooking: activeBooking });
    } catch (err) {
      console.error("[Store] Error fetching partner profile:", err);
    }
  },

  // Partner settings
  updatePartnerSettings: (settings) =>
    set((state) => {
      const newState = {
        user: {
          ...state.user,
          settings: { ...state.user.settings, ...settings },
        },
      };
      saveToStorage({ ...get(), ...newState });
      return newState;
    }),

  // Available bookings for partner (from API/WebSocket)
  availableBookings: [],
  setAvailableBookings: (bookings) => set({ availableBookings: bookings }),
  addAvailableBooking: (booking) =>
    set((state) => {
      if (state.availableBookings.some((b) => b.id === booking.id)) return state;
      return { availableBookings: [...state.availableBookings, booking] };
    }),
  removeAvailableBooking: (bookingId) =>
    set((state) => ({
      availableBookings: state.availableBookings.filter((b) => b.id !== bookingId),
    })),

  // Partner ID
  partnerId: "",
  setPartnerId: (id) => set({ partnerId: id }),

  // Fetch available bookings from API
  fetchAvailableBookings: async () => {
    const state = get();
    if (!state.partnerId || state.userRole !== "PARTNER") return;
    try {
      const res = await fetch(`/api/bookings/available?partnerId=${state.partnerId}`);
      if (res.ok) {
        const data = await res.json();
        const bookings: BookingInfo[] = (data.availableBookings || []).map((d: Record<string, unknown>) => {
          // API returns nested { dispatchId, round, dispatchedAt, booking: {...} }
          const booking = (d.booking as Record<string, unknown>) ?? d;
          const pkg = (booking.package as Record<string, unknown>) ?? {};
          return {
            id: booking.id as string,
            packageId: (booking.packageId as string) ?? (pkg.id as string) ?? "",
            packageName: (booking.packageName as string) ?? (pkg.name as string) ?? "",
            packagePrice: (booking.packagePrice as number) ?? (pkg.price as number) ?? 0,
            status: booking.status as BookingStatus,
            paymentStatus: booking.paymentStatus as PaymentStatus,
            bookingDate: booking.bookingDate as string,
            timeSlot: booking.timeSlot as string,
            location: (booking.location as string) || "",
            syncPercentage: (booking.syncPercentage as number) || 0,
            editCountdown: (booking.editCountdown as number | null) || null,
            partnerName: (booking.partnerName as string | null) || null,
            notes: (booking.notes as string) || "",
            deliveredAt: (booking.deliveredAt as string | null) || null,
            downloaded: (booking.downloaded as boolean) || false,
            cancelledBy: (booking.cancelledBy as "CLIENT" | "PARTNER" | null) || null,
            declinedByPartners: (booking.declinedByPartners as string[]) || [],
          };
        });
        set({ availableBookings: bookings });
      }
    } catch {
      // Graceful fallback — keep existing state
    }
  },

  // Booking form
  bookingDate: undefined,
  setBookingDate: (date) => set({ bookingDate: date }),
  bookingTimeSlot: "",
  setBookingTimeSlot: (slot) => set({ bookingTimeSlot: slot }),
  bookingLocation: "",
  setBookingLocation: (location) => set({ bookingLocation: location }),
  bookingNotes: "",
  setBookingNotes: (notes) => set({ bookingNotes: notes }),

  // Reviews
  reviews: [],
  submitReview: (review) =>
    set((state) => {
      const newReviews = [...state.reviews.filter((r) => r.bookingId !== review.bookingId), review];
      saveToStorage({ ...get(), reviews: newReviews });
      return { reviews: newReviews };
    }),
}));
