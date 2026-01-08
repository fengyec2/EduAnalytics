
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { ChartContainer } from './SharedComponents';

interface SchoolViewProps {
  selectedPeriod: string;
  periodData: any[];
  subjects: string[];
  thresholds: Record<string, number>;
  setThresholds: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  thresholdType: 'rank' | 'percent';
  setThresholdType: React.Dispatch<React.SetStateAction<'rank' | 'percent'>>;
}

const SchoolView: React.FC<SchoolViewProps> = ({ 
  selectedPeriod, 
  periodData, 
  subjects,
  thresholds,
  setThresholds,
  thresholdType,
  setThresholdType
}) => {
  const [showSettings, setShowSettings] = useState(false);
  
  const admissionLabels = [
    { key: '清北', color: '#be123c' }, // Rose 700
    { key: 'C9', color: '#1e40af' },    // Blue 800
    { key: '高分数', color: '#0369a1' }, // Sky 700
    { key: '名校', color: '#0d9488' },   // Teal 600
    { key: '特控', color: '#10b981' },   // Emerald 500
  ];

  const handleThresholdChange = (key: string, val: string) => {
    const num = parseInt(val) || 0;
    setThresholds(prev => ({ ...prev, [key]: num }));
  };

  const admissionDistribution = useMemo(() => {
    if (!periodData.length) return [];

    const totalCount = periodData.length;
    const sortedThresholds = [...admissionLabels].map(l => ({
      ...l,
      limit: thresholdType === 'rank' 
        ? thresholds[l.key] 
        : Math.round((thresholds[l.key] / 100) * totalCount)
    })).sort((a, b) => a.limit - b.limit);

    const results = sortedThresholds.map((t, idx) => {
      const prevLimit = idx === 0 ? 0 : sortedThresholds[idx - 1].limit;
      const count = periodData.filter(s => s.periodSchoolRank > prevLimit && s.periodSchoolRank <= t.limit).length;
      return { name: t.key, value: count, color: t.color };
    });

    // Add "Below Line" (未上线)
    const lastLimit = sortedThresholds[sortedThresholds.length - 1].limit;
    results.push({
      name: '未上线',
      value: periodData.filter(s => s.periodSchoolRank > lastLimit).length,
      color: '#94a3b8' // Slate 400
    });

    return results.filter(r => r.value > 0);
  }, [periodData, thresholds, thresholdType]);

  const subjectAvgs = useMemo(() => {
    return subjects.map(sub => {
      const avg = periodData.reduce((acc, s) => acc + (s.currentScores[sub] || 0), 0) / periodData.length;
      return { name: sub, avg: parseFloat(avg.toFixed(2)) };
    });
  }, [periodData, subjects]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      {/* Admission Line Settings */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-6 py-4 flex items-center justify-between text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-600" />
            上线分析参数配置 (Admissions Thresholds)
          </div>
          {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showSettings && (
          <div className="px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl w-fit">
              <button 
                onClick={() => setThresholdType('rank')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${thresholdType === 'rank' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
              >
                按绝对名次 (Rank)
              </button>
              <button 
                onClick={() => setThresholdType('percent')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${thresholdType === 'percent' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
              >
                按百分比 (%)
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {admissionLabels.map(line => (
                <div key={line.key} className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: line.color }} />
                    {line.key}
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={thresholds[line.key]}
                      onChange={(e) => handleThresholdChange(line.key, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">
                      {thresholdType === 'rank' ? '位' : '%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 italic">注：系统将按名次从小到大自动区间切分。例如 C9 设为 30 则统计 6-30 名的学生。</p>
          </div>
        )}
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title={`Admissions Status Analysis (${selectedPeriod})`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={admissionDistribution} 
                cx="50%" 
                cy="50%" 
                innerRadius={60} 
                outerRadius={85} 
                paddingAngle={5} 
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {admissionDistribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`${value} 人`, '数量']}
              />
              <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title={`Subject Performance (${selectedPeriod})`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectAvgs}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
              />
              <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Average Score" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default SchoolView;
