
import React from 'react';

export const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; subtitle: string }> = ({ icon, title, value, subtitle }) => (
  <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/50 flex items-start gap-4 transition-all hover:shadow-md hover:bg-white/80 hover:scale-[1.02]">
    <div className="p-3 rounded-xl bg-white/50 shadow-sm">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 leading-none">{value}</h3>
      <p className="text-[10px] text-gray-500 mt-1 font-medium">{subtitle}</p>
    </div>
  </div>
);

export const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
      active ? 'bg-blue-600/90 text-white shadow-lg backdrop-blur-sm ring-2 ring-blue-200' : 'text-gray-500 hover:bg-white/50 hover:text-blue-600'
    }`}
  >
    {icon} {label}
  </button>
);

export const ChartContainer: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/50 relative transition-all hover:border-blue-200/50 hover:shadow-md ${className}`}>
    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> {title}
    </h3>
    <div className="h-[300px]">
      {children}
    </div>
  </div>
);
