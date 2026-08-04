import { z } from "zod";

// 1. User / Profile Validation Schema
export const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional().or(z.literal("")),
  location: z.string().optional(),
  role: z.enum(["USER", "PARTNER", "ADMIN"]).default("USER"),
  brandLogo: z.string().url("Invalid logo URL").optional().or(z.null()),
  brandFont: z.string().optional().or(z.null()),
  brandColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid Hex color").optional().or(z.null()),
  editorRequirements: z.string().optional().or(z.null()),
  avatar: z.string().optional().or(z.null()),
});

export const bookingSchema = z.object({
  userId: z.string().min(1, "Invalid User ID format"),
  packageId: z.string().min(1, "Invalid Package ID format"),
  bookingDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid booking date format",
  }),
  timeSlot: z.string().min(1, "Time slot is required"),
  location: z.string().min(3, "Shoot location is required"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  razorpayPaymentId: z.string().optional(),
});

// 3. Partner Onboarding Validation Schema
export const partnerSchema = z.object({
  userId: z.string().min(1, "Invalid User ID format"),
  location: z.string().min(3, "Location is required"),
  deviceInfo: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// 4. Partner Wallet Withdrawal Validation Schema
export const withdrawSchema = z.object({
  amount: z.number().min(500, "Minimum withdrawal amount is ₹500"),
});

// Helper validation checker
export function validateBody<T>(schema: z.Schema<T>, body: any): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      errors: result.error.issues.map((err) => `${err.path.join(".")}: ${err.message}`),
    };
  }
}
