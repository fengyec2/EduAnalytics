
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Lightbulb } from 'lucide-react';
import { AIInsight } from '../types';
import { ChartContainer } from './SharedComponents';

interface SchoolViewProps {
  selectedPeriod: string;
  aiInsights: AIInsight[];
  periodSchoolStats: any;
}

const SchoolView: React.FC<SchoolViewProps> = ({ selectedPeriod, aiInsights, periodSchoolStats }) => {
  if (!periodSchoolStats) return null;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <section className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h2 className="text-lg font-bold text-gray-800">AI Educational Guidance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map((insight, idx) => (
            <div key={idx} className="p-3 bg-white/50 rounded-xl border border-white text-sm">
              <span className="font-bold text-indigo-600 block mb-1 text-[10px] uppercase tracking-widest">{insight.title}</span>
              <p className="text-gray-600 leading-snug">{insight.content}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title={`Performance Distribution (${selectedPeriod})`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={periodSchoolStats.distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                {periodSchoolStats.distribution.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title={`Subject Performance (${selectedPeriod})`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={periodSchoolStats.subjectAvgs}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Average Score" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default SchoolView;
