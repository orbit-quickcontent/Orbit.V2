import React, { useState } from 'react';
import ClientBookingScreen from './screens/ClientBookingScreen';
import PartnerRequestScreen from './screens/PartnerRequestScreen';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'PARTNER'>('CLIENT');

  return (
    <div className="bg-slate-950 min-h-screen">
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-sm">
            O
          </div>
          <span className="font-extrabold text-lg text-white tracking-wide">ORBIT Multi-App</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('CLIENT')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'CLIENT'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Client Screen
          </button>

          <button
            onClick={() => setActiveTab('PARTNER')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'PARTNER'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Partner Screen
          </button>
        </div>
      </nav>

      <main>
        {activeTab === 'CLIENT' ? <ClientBookingScreen /> : <PartnerRequestScreen />}
      </main>
    </div>
  );
};

export default App;
