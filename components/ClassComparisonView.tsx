
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, BarChart2, Star, TrendingUp, Zap, Users } from 'lucide-react';
import { ChartContainer, GlassCard, TableContainer } from './SharedComponents';
import * as AnalysisEngine from '../utils/analysisUtils';

interface ClassComparisonViewProps {
  selectedPeriod: string;
  classes: string[];
  selectedClasses: string[];
  setSelectedClasses: React.Dispatch<React.SetStateAction<string[]>>;
  classComparisonData: any[];
  rankingDistributionData: any[];
  colors: string[];
  periodData: any[];
}

const ClassComparisonView: React.FC<ClassComparisonViewProps> = ({ 
  selectedPeriod, classes, selectedClasses, setSelectedClasses, classComparisonData, rankingDistributionData, colors, periodData 
}) => {
  
  const classSummaries = useMemo(() => 
    AnalysisEngine.getClassSummaries(periodData, selectedClasses),
    [selectedClasses, periodData]
  );

  const leaderboard = useMemo(() => 
    AnalysisEngine.getClassLeaderboard(classSummaries),
    [classSummaries]
  );

  const rowMaxMap = useMemo(() => 
    AnalysisEngine.calculateHeatmapMaxValues(classComparisonData, selectedClasses),
    [classComparisonData, selectedClasses]
  );

  const distRowMaxMap = useMemo(() => 
    AnalysisEngine.calculateHeatmapMaxValues(rankingDistributionData, selectedClasses),
    [rankingDistributionData, selectedClasses]
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <GlassCard className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Class Comparison Analysis</h2>
          <p className="text-xs text-slate-500 mt-1">Comparing academic performance across selected groups.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {classes.map(cls => (
            <button 
              key={cls}
              onClick={() => setSelectedClasses(prev => prev.includes(cls) ? prev.filter(p => p !== cls) : [...prev, cls])}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedClasses.includes(cls) ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' : 'bg-white/50 text-slate-500 border-slate-200 hover:border-blue-300 hover:bg-white'}`}
            >
              {cls}
            </button>
          ))}
        </div>
      </GlassCard>

      {leaderboard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-amber-50/80 to-orange-100/80 backdrop-blur-md p-6 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden group">
            <Star className="w-20 h-20 text-amber-200/50 absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform" />
            <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Trophy className="w-3 h-3" /> Highest Average Score
            </h4>
            <p className="text-3xl font-black text-amber-900">{leaderboard.highestAvg.className}</p>
            <p className="text-sm font-bold text-amber-700 mt-1">{leaderboard.highestAvg.average} Points Average</p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50/80 to-blue-100/80 backdrop-blur-md p-6 rounded-3xl border border-indigo-200 shadow-sm relative overflow-hidden group">
            <Zap className="w-20 h-20 text-indigo-200/50 absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform" />
            <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Star className="w-3 h-3" /> Most Top 10 Elite
            </h4>
            <p className="text-3xl font-black text-indigo-900">{leaderboard.mostTop10.className}</p>
            <p className="text-sm font-bold text-indigo-700 mt-1">{leaderboard.mostTop10.top10} Students in Top 10</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-100/80 backdrop-blur-md p-6 rounded-3xl border border-emerald-200 shadow-sm relative overflow-hidden group">
            <TrendingUp className="w-20 h-20 text-emerald-200/50 absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform" />
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users className="w-3 h-3" /> Strongest Bench (Top 50)
            </h4>
            <p className="text-3xl font-black text-emerald-900">{leaderboard.mostTop50.className}</p>
            <p className="text-sm font-bold text-emerald-700 mt-1">{leaderboard.mostTop50.top50} Students in Top 50</p>
          </div>
        </div>
      )}

      <TableContainer
        title="Subject Competition Matrix"
        icon={<BarChart2 className="w-4 h-4 text-blue-400" />}
        subtitle={<p className="text-[10px] opacity-60 mt-1">Highlighted cells indicate the leading class in that subject.</p>}
        headerClassName="bg-slate-900/90 text-white backdrop-blur-md"
        titleClassName="text-white"
        className="shadow-lg"
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 min-w-[180px]">Subject / Metric</th>
              {selectedClasses.map((cls, idx) => (
                <th key={cls} className="px-8 py-6 text-center border-r border-slate-100 min-w-[160px]">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 text-white font-black shadow-md" style={{ backgroundColor: colors[idx % colors.length] }}>
                    {idx + 1}
                  </div>
                  <div className="text-lg font-black text-slate-900">{cls}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            <tr className="bg-blue-50/20">
              <td className="px-8 py-5 font-black text-blue-600 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> TOTAL AVG
              </td>
              {classSummaries.map((s, idx) => {
                const isMax = s.average === leaderboard?.highestAvg.average;
                return (
                  <td key={idx} className={`px-8 py-5 text-center transition-all ${isMax ? 'bg-amber-50/50 font-black text-amber-700' : 'text-slate-600 font-bold'}`}>
                    {s.average}
                    {isMax && <Star className="w-3 h-3 inline ml-1 fill-current" />}
                  </td>
                );
              })}
            </tr>
            
            <tr className="bg-slate-50/30">
              <td colSpan={selectedClasses.length + 1} className="px-8 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Specific Averages</td>
            </tr>

            {classComparisonData.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-white/40 transition-colors">
                <td className="px-8 py-4 text-slate-700 font-bold">{row.name}</td>
                {selectedClasses.map((cls, colIdx) => {
                  const val = row[cls] || 0;
                  const isMax = val === rowMaxMap[row.name] && val > 0;
                  return (
                    <td key={colIdx} className={`px-8 py-4 text-center transition-all ${isMax ? 'bg-emerald-50/50 text-emerald-700 font-black' : 'text-slate-600'}`}>
                      {val || '-'}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr className="bg-slate-50/30">
              <td colSpan={selectedClasses.length + 1} className="px-8 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ranking Distribution (Top Tier)</td>
            </tr>

            {rankingDistributionData.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-white/40 transition-colors">
                <td className="px-8 py-4 text-slate-600 font-medium">{row.name} Count</td>
                {selectedClasses.map((cls, colIdx) => {
                  const val = row[cls] || 0;
                  const isMax = val === distRowMaxMap[row.name] && val > 0;
                  return (
                    <td key={colIdx} className={`px-8 py-4 text-center ${isMax ? 'bg-indigo-50/50 text-indigo-700 font-black' : 'text-slate-500'}`}>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${isMax ? 'bg-indigo-100/80 shadow-sm' : 'bg-slate-100/50'}`}>
                        {val}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Subject Performance Gap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classComparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                cursor={{fill: 'rgba(248,250,252,0.5)'}} 
                contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} 
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
              {selectedClasses.map((cls, idx) => (
                <Bar 
                  key={cls} 
                  dataKey={cls} 
                  fill={colors[idx % colors.length]} 
                  radius={[6, 6, 0, 0]} 
                  barSize={selectedClasses.length > 3 ? 15 : 30}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Elite Density Heatmap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankingDistributionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                cursor={{fill: 'rgba(248,250,252,0.5)'}} 
                contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} 
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
              {selectedClasses.map((cls, idx) => (
                <Bar 
                  key={cls} 
                  dataKey={cls} 
                  fill={colors[idx % colors.length]} 
                  radius={[6, 6, 0, 0]}
                  barSize={selectedClasses.length > 3 ? 15 : 30}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default ClassComparisonView;
