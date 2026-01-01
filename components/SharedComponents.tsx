
import React from 'react';

export const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; subtitle: string }> = ({ icon, title, value, subtitle }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 transition-all hover:shadow-md">
    <div className="p-3 rounded-xl bg-gray-50">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 leading-none">{value}</h3>
      <p className="text-[10px] text-gray-400 mt-1 font-medium">{subtitle}</p>
    </div>
  </div>
);

export const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
      active ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'
    }`}
  >
    {icon} {label}
  </button>
);

export const ChartContainer: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative transition-all hover:border-blue-100 ${className}`}>
    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {title}
    </h3>
    <div className="h-[300px]">
      {children}
    </div>
  </div>
);
