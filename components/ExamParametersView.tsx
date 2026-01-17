
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sigma, Activity } from 'lucide-react';
import { GlassCard, TableContainer } from './SharedComponents';

interface ExamParametersViewProps {
  selectedPeriod: string;
  examParameters: any;
  colors: string[];
  totalParticipants: number;
}

const ExamParametersView: React.FC<ExamParametersViewProps> = ({ 
  selectedPeriod, examParameters, colors, totalParticipants 
}) => {
  if (!examParameters) return null;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gradient-to-br from-blue-600/90 to-indigo-700/90 backdrop-blur-md p-8 rounded-3xl text-white shadow-xl border border-white/10">
          <Sigma className="w-10 h-10 mb-4 opacity-50" />
          <h3 className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">Global Reliability (α)</h3>
          <p className="text-5xl font-black mb-4">{examParameters.reliability}</p>
          <p className="text-xs opacity-80 leading-relaxed">
            Calculated using Cronbach's Alpha. A value &gt; 0.7 indicates high internal consistency and test reliability.
          </p>
          <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-xs">
            <span>Method: Internal Consistency</span>
            <span className="font-bold px-2 py-1 bg-white/10 rounded-lg">
              {examParameters.reliability >= 0.7 ? 'Stable' : 'Unstable'}
            </span>
          </div>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassCard>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Difficulty & Discrimination Matrix</p>
             <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" dataKey="difficulty" name="Difficulty" domain={[0, 1]} stroke="#94a3b8" fontSize={10} label={{ value: 'Easier ->', position: 'insideBottom', offset: -5 }} />
                    <YAxis type="number" dataKey="discrimination" name="Discrimination" domain={[0, 1]} stroke="#94a3b8" fontSize={10} label={{ value: 'Better ->', angle: -90, position: 'insideLeft' }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Scatter name="Subjects" data={examParameters.subjectStats} fill="#3b82f6">
                      {examParameters.subjectStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
             </div>
          </GlassCard>
          <GlassCard className="flex flex-col justify-center text-center">
             <Activity className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
             <h4 className="text-sm font-bold text-gray-800">Total Participants</h4>
             <p className="text-4xl font-black text-indigo-600">{totalParticipants}</p>
             <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Valid Exam Records</p>
          </GlassCard>
        </div>
      </div>

      <TableContainer
        title={`Subject Parameter Matrix (${selectedPeriod})`}
        icon={<Sigma className="w-4 h-4" />}
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-white/30 text-gray-400 font-bold border-b border-slate-100">
              <th className="px-8 py-5">Subject</th>
              <th className="px-6 py-5 text-center">Max</th>
              <th className="px-6 py-5 text-center">Mean</th>
              <th className="px-6 py-5 text-center">Median</th>
              <th className="px-6 py-5 text-center">Mode</th>
              <th className="px-6 py-5 text-center">Std Dev (σ)</th>
              <th className="px-6 py-5 text-center bg-blue-50/20 text-blue-700">Difficulty (L)</th>
              <th className="px-6 py-5 text-center bg-indigo-50/20 text-indigo-700">Discrimination (D)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50/50">
            {examParameters.subjectStats.map((s: any, i: number) => (
              <tr key={i} className="hover:bg-white/60 transition-colors">
                <td className="px-8 py-5 font-bold text-gray-700">{s.subject}</td>
                <td className="px-6 py-5 text-center text-gray-600 font-medium">{s.max}</td>
                <td className="px-6 py-5 text-center text-gray-900 font-bold">{s.mean}</td>
                <td className="px-6 py-5 text-center text-gray-600">{s.median}</td>
                <td className="px-6 py-5 text-center text-gray-600">{s.mode}</td>
                <td className="px-6 py-5 text-center text-gray-600">{s.stdDev}</td>
                <td className="px-6 py-5 text-center bg-blue-50/10">
                  <span className={`px-2 py-1 rounded-lg font-bold text-xs ${s.difficulty > 0.8 ? 'text-green-600 bg-green-50/50' : s.difficulty < 0.4 ? 'text-red-600 bg-red-50/50' : 'text-blue-600 bg-blue-50/50'}`}>
                    {s.difficulty}
                  </span>
                </td>
                <td className="px-6 py-5 text-center bg-indigo-50/10">
                  <span className={`px-2 py-1 rounded-lg font-bold text-xs ${s.discrimination > 0.4 ? 'text-green-600 bg-green-50/50' : s.discrimination < 0.2 ? 'text-red-600 bg-red-50/50' : 'text-indigo-600 bg-indigo-50/50'}`}>
                    {s.discrimination}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
};

export default ExamParametersView;
