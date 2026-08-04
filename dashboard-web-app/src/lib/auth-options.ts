import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { firestoreDb } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    // 1. Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
    }),
    // 2. Apple OAuth
    AppleProvider({
      clientId: process.env.APPLE_ID || "mock-apple-id",
      clientSecret: {
        appleId: process.env.APPLE_ID || "",
        teamId: process.env.APPLE_TEAM_ID || "",
        privateKey: process.env.APPLE_PRIVATE_KEY || "",
        keyId: process.env.APPLE_KEY_ID || "",
      } as any,
    }),
    // 3. Credentials Provider (Email/Password or verified OTP)
    CredentialsProvider({
      name: "Orbit Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        otpVerified: { label: "OTP Verified", type: "text" }, // "true" if OTP was verified on client or in-memory
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email.toLowerCase().trim();

        // Find user in partner db first, then client db
        let user = await firestoreDb.partnerUsers.findUnique({
          where: { email },
        });

        if (!user) {
          user = await firestoreDb.clientUsers.findUnique({
            where: { email },
          });
        }

        // OTP verification bypass/shortcut flow
        if (credentials.otpVerified === "true") {
          if (!user) {
            user = await firestoreDb.clientUsers.create({
              data: {
                email,
                role: "USER",
              },
            });
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name || "",
            role: user.role,
          };
        }

        // Standard Email/Password flow
        if (!credentials.password) return null;

        if (!user || !user.passwordHash) {
          // In production, return null if user or passwordHash is missing
          return null;
        }

        const isValid = verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "orbit-super-secret-jwt-key",
  pages: {
    signIn: "/",
    error: "/",
  },
};
