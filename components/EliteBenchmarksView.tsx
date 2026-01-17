
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, GlassCard } from './SharedComponents';

interface EliteBenchmarksViewProps {
  selectedPeriod: string;
  classes: string[];
  benchmarkClass: string;
  setBenchmarkClass: (c: string) => void;
  kingsData: any[];
  duelData: any[];
}

const EliteBenchmarksView: React.FC<EliteBenchmarksViewProps> = ({ 
  selectedPeriod, classes, benchmarkClass, setBenchmarkClass, kingsData, duelData 
}) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <GlassCard className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Class Benchmarking ({selectedPeriod})</h3>
          <p className="text-xs text-gray-500">Compare class leaders against grade-wide masters.</p>
        </div>
        <select 
          className="bg-white/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto backdrop-blur-sm cursor-pointer"
          value={benchmarkClass}
          onChange={(e) => setBenchmarkClass(e.target.value)}
        >
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title={`👑 Class ${benchmarkClass} King vs Grade King`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kingsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
              <YAxis dataKey="subject" type="category" stroke="#94a3b8" fontSize={12} width={80} />
              <Tooltip cursor={{fill: 'rgba(248,250,252,0.5)'}} contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" align="center" iconType="diamond" />
              <Bar dataKey="classMax" name="Class Top" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              <Bar dataKey="gradeMax" name="Grade Top" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="🔍 First-in-Class vs First-in-Grade Duel">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={duelData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip cursor={{fill: 'rgba(248,250,252,0.5)'}} contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="classFirst" name={`#1 in ${benchmarkClass}`} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="schoolFirst" name="#1 in School" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default EliteBenchmarksView;
