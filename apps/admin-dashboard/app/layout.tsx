import './globals.css';
import React from 'react';

export const metadata = {
  title: 'ORBIT Live Map Admin Dashboard',
  description: 'Real-Time Nearby Partner Tracking and Dispatch Admin Control Center',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0F172A] text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
