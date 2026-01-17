
import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

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

export const SearchInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = "Search...", className = "" }) => (
  <div className={`relative ${className}`}>
    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
    />
  </div>
);

export const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {
  icon?: React.ElementType;
  containerClassName?: string;
}> = ({ icon: Icon, containerClassName = "", className = "", children, ...props }) => (
  <div className={`relative ${containerClassName}`}>
    {Icon && <Icon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />}
    <select
      className={`appearance-none bg-gray-50 border border-gray-200 rounded-xl ${Icon ? 'pl-10' : 'pl-4'} pr-8 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 w-full transition-all cursor-pointer text-gray-700 ${className}`}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

export const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  color?: 'blue' | 'indigo' | 'purple' | 'gray';
  className?: string;
}> = ({ label, active, onClick, color = 'blue', className = "" }) => {
  const colorStyles = {
    blue: active ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-300',
    indigo: active ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-300',
    purple: active ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-purple-300',
    gray: active ? 'bg-gray-800 text-white border-gray-800 shadow-md' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${colorStyles[color]} ${className}`}
    >
      {label}
    </button>
  );
};
