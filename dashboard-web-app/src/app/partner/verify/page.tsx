"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PartnerVerifyPage() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appointmentInfo, setAppointmentInfo] = useState<any | null>(null);
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !verificationCode) {
      setErrorMessage('Please provide both your email and partner verification code');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setAppointmentInfo(null);

    try {
      const response = await fetch('/api/partner/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          verificationCode: verificationCode.trim().toUpperCase()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token) {
          localStorage.setItem('orbit_token', data.token);
          localStorage.setItem('orbit_user_role', 'PARTNER');
        }
        router.push('/partner/dashboard');
      } else {
        setErrorMessage(data.error || 'Verification failed');
        if (data.appointmentInfo || data.requiresAppointment) {
          setAppointmentInfo(data.appointmentInfo || {
            status: 'PENDING_OFFLINE_TRAINING',
            message: 'Your partner account requires offline training completion before full access is unlocked.',
            supportEmail: 'orbit.quickcontent@gmail.com'
          });
        }
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#0D0F17] border border-gray-800 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-block bg-cyan-500/10 text-cyan-400 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-cyan-500/20">
            Orbit Partner Network
          </div>
          <h1 className="text-2xl font-black text-white">Partner Verification</h1>
          <p className="text-gray-400 text-xs">
            Enter the special verification code provided by your trainer after offline training.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
              Partner Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 bg-gray-900 text-white rounded-xl border border-gray-700 focus:border-cyan-500 text-sm focus:outline-none"
              placeholder="orbit.quickcontent@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
              Verification Code
            </label>
            <input
              type="text"
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
              className="w-full p-3.5 bg-gray-900 text-white rounded-xl border border-gray-700 focus:border-cyan-500 text-sm font-mono tracking-widest uppercase focus:outline-none"
              placeholder="123456"
              maxLength={12}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Master Owner Code: <span className="text-cyan-400 font-mono">123456</span> for email <span className="text-cyan-400 font-mono">orbit.quickcontent@gmail.com</span>
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl text-xs">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Verifying Code...' : 'Verify & Enter Partner App'}
          </button>
        </form>

        {/* Pending Appointment Info Card */}
        {appointmentInfo && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 text-xs space-y-2 text-amber-200">
            <div className="font-bold flex items-center gap-1 text-amber-300">
              <span>📅</span> Offline Training Session Required
            </div>
            <p className="text-amber-200/90">{appointmentInfo.message}</p>
            <div className="pt-2 text-[11px] text-amber-300/80 border-t border-amber-500/20">
              Contact Trainer / Owner: <a href="mailto:orbit.quickcontent@gmail.com" className="underline font-bold">orbit.quickcontent@gmail.com</a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
