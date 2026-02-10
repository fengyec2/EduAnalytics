
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, BarChart2, Star, TrendingUp, Zap, Users, PieChart as PieIcon, Plus, X, Settings2, Target } from 'lucide-react';
import { ChartContainer, FilterChip, SelectInput } from './SharedComponents';
import * as AnalysisEngine from '../utils/analysisUtils';
import { useTranslation } from '../context/LanguageContext';

interface ClassComparisonViewProps {
  selectedPeriod: string;
  classes: string[];
  selectedClasses: string[];
  setSelectedClasses: React.Dispatch<React.SetStateAction<string[]>>;
  classComparisonData: any[];
  rankingDistributionData: any[];
  colors: string[];
  periodData: any[];
  thresholds: number[];
  setThresholds: React.Dispatch<React.SetStateAction<number[]>>;
}

const ClassComparisonView: React.FC<ClassComparisonViewProps> = ({ 
  selectedPeriod, classes, selectedClasses, setSelectedClasses, classComparisonData, rankingDistributionData, colors, periodData, thresholds, setThresholds 
}) => {
  const { t } = useTranslation();
  const [newThreshold, setNewThreshold] = useState<string>('');
  const [ownershipThreshold, setOwnershipThreshold] = useState<number>(thresholds[0] || 50);

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

  // 动态生成阈值色阶
  const tierColors = useMemo(() => {
    const base = ['#be123c', '#1e40af', '#0369a1', '#0d9488', '#10b981', '#8b5cf6', '#d946ef'];
    const result = thresholds.map((_, i) => base[i % base.length]);
    result.push('#94a3b8'); // 其他
    return result;
  }, [thresholds]);

  const populationDistData = useMemo(() => {
    const sortedThresholds = [...thresholds].sort((a, b) => a - b);
    return selectedClasses.map(cls => {
      const clsStudents = periodData.filter(s => s.class === cls);
      const totalCount = clsStudents.length;
      if (totalCount === 0) return { className: cls, data: [] };

      const data = sortedThresholds.map((limit, idx) => {
        const prevLimit = idx === 0 ? 0 : sortedThresholds[idx - 1];
        const count = clsStudents.filter(s => s.periodSchoolRank > prevLimit && s.periodSchoolRank <= limit).length;
        return { name: `Top ${limit}`, value: count, color: tierColors[idx] };
      });

      const handledCount = data.reduce((acc, d) => acc + d.value, 0);
      data.push({
        name: t('comparison.tier_others'),
        value: Math.max(0, totalCount - handledCount),
        color: tierColors[tierColors.length - 1]
      });

      return { className: cls, data: data.filter(d => d.value >= 0) };
    });
  }, [selectedClasses, periodData, t, thresholds, tierColors]);

  // 计算精英占有率环状图数据
  const ownershipData = useMemo(() => {
    if (!ownershipThreshold) return [];
    
    const results = selectedClasses.map((cls, idx) => {
      const count = periodData.filter(s => s.class === cls && s.periodSchoolRank <= ownershipThreshold).length;
      return {
        name: cls,
        value: count,
        color: colors[idx % colors.length]
      };
    });

    const totalInSelected = results.reduce((acc, r) => acc + r.value, 0);
    const otherCount = ownershipThreshold - totalInSelected;

    if (otherCount > 0) {
      results.push({
        name: t('comparison.other_classes'),
        value: otherCount,
        color: '#e2e8f0'
      });
    }

    return results.filter(r => r.value > 0);
  }, [selectedClasses, periodData, ownershipThreshold, colors, t]);

  const handleAddThreshold = () => {
    const val = parseInt(newThreshold);
    if (!isNaN(val) && val > 0 && !thresholds.includes(val)) {
      setThresholds(prev => [...prev, val].sort((a, b) => a - b));
      setNewThreshold('');
    }
  };

  const removeThreshold = (val: number) => {
    setThresholds(prev => prev.filter(t => t !== val));
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">{t('comparison.title')}</h2>
            <p className="text-xs text-gray-500 mt-1">{t('comparison.desc')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {classes.map(cls => (
              <FilterChip 
                key={cls}
                label={cls}
                active={selectedClasses.includes(cls)}
                onClick={() => setSelectedClasses(prev => prev.includes(cls) ? prev.filter(p => p !== cls) : [...prev, cls])}
                color="blue"
              />
            ))}
          </div>
        </div>

        {/* 动态阈值配置面板 */}
        <div className="pt-4 border-t border-gray-50 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Settings2 className="w-3.5 h-3.5 text-blue-500" />
            配置统计名次段 (阈值)
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {thresholds.sort((a,b)=>a-b).map(val => (
              <div key={val} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 pl-3 pr-1 py-1.5 rounded-xl transition-all hover:border-blue-300">
                <span className="text-xs font-black text-gray-700">Top {val}</span>
                <button onClick={() => removeThreshold(val)} className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-300 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 ml-2">
              <input 
                type="number" 
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddThreshold()}
                placeholder="新增阈值"
                className="w-24 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button 
                onClick={handleAddThreshold}
                className="p-1.5 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {leaderboard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-6 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden group">
            <Star className="w-20 h-20 text-amber-200/50 absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform" />
            <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Trophy className="w-3 h-3" /> {t('comparison.stat_highest_avg')}
            </h4>
            <p className={`font-black text-amber-900 leading-tight ${leaderboard.highestAvg.className.length > 8 ? 'text-xl' : 'text-3xl'}`}>{leaderboard.highestAvg.className}</p>
            <p className="text-sm font-bold text-amber-700 mt-1">{leaderboard.highestAvg.average} {t('comparison.stat_points_avg')}</p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-3xl border border-indigo-200 shadow-sm relative overflow-hidden group">
            <Zap className="w-20 h-20 text-indigo-200/50 absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform" />
            <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Star className="w-3 h-3" /> {t('comparison.stat_most_top10')}
            </h4>
            <p className={`font-black text-indigo-900 leading-tight ${leaderboard.mostTop10.className.length > 8 ? 'text-xl' : 'text-3xl'}`}>{leaderboard.mostTop10.className}</p>
            <p className="text-sm font-bold text-indigo-700 mt-1">{leaderboard.mostTop10.top10} {t('comparison.stat_students_top10')}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-100 p-6 rounded-3xl border border-emerald-200 shadow-sm relative overflow-hidden group">
            <TrendingUp className="w-20 h-20 text-emerald-200/50 absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform" />
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users className="w-3 h-3" /> {t('comparison.stat_strongest_bench')}
            </h4>
            <p className={`font-black text-emerald-900 leading-tight ${leaderboard.mostTop50.className.length > 8 ? 'text-xl' : 'text-3xl'}`}>{leaderboard.mostTop50.className}</p>
            <p className="text-sm font-bold text-emerald-700 mt-1">{leaderboard.mostTop50.top50} {t('comparison.stat_students_top50')}</p>
          </div>
        </div>
      )}

      {/* Elite Ownership Pie Chart Section */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" /> {t('comparison.ownership_title').replace('{threshold}', String(ownershipThreshold))}
            </h3>
            <p className="text-xs text-gray-400 mt-1">展示所选班级在年级顶尖段位中的名额分布情况。</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('comparison.ownership_selector')}</span>
            <SelectInput 
              containerClassName="min-w-[140px]"
              value={ownershipThreshold}
              onChange={(e) => setOwnershipThreshold(parseInt(e.target.value))}
            >
              {thresholds.map(t => <option key={t} value={t}>Top {t}</option>)}
            </SelectInput>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="h-[320px] relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Total Capacity</span>
              <span className="text-4xl font-black text-indigo-900">{ownershipThreshold}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ownershipData}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={115}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {ownershipData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`${value} ${t('comparison.count')}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ownershipData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-bold text-gray-700">{item.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-indigo-900">{item.value}</span>
                    <span className="text-[10px] font-bold text-gray-400">{((item.value / ownershipThreshold) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
                注：该环状图的总容量固定为设定阈值 {ownershipThreshold}。
                各班级占比反映了其在全校前 {ownershipThreshold} 名中的“精英浓度”。
                灰色部分代表非选定班级的占位。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Population Distribution Donut Charts */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-indigo-500" /> {t('comparison.chart_population_dist')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {populationDistData.map((clsData, idx) => (
            <div key={clsData.className} className="flex flex-col items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all">
              <h4 className="text-sm font-black text-gray-800 mb-2">{clsData.className}</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clsData.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {clsData.data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`${value} ${t('comparison.count')}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 w-full px-2">
                {clsData.data.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-500 truncate">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="truncate">{d.name}</span>
                    <span className="font-bold ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
        <div className="px-8 py-6 bg-gray-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-400" /> {t('comparison.matrix_title')}
            </h3>
            <p className="text-[10px] opacity-60 mt-1">{t('comparison.matrix_desc')}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 min-w-[180px]">{t('comparison.matrix_header')}</th>
                {selectedClasses.map((cls, idx) => (
                  <th key={cls} className="px-8 py-6 text-center border-r border-gray-100 min-w-[160px]">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 text-white font-black" style={{ backgroundColor: colors[idx % colors.length] }}>
                      {idx + 1}
                    </div>
                    <div className="text-lg font-black text-gray-900">{cls}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="bg-blue-50/10">
                <td className="px-8 py-5 font-black text-blue-600 flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> {t('comparison.matrix_total_avg')}
                </td>
                {classSummaries.map((s, idx) => {
                  const isMax = s.average === leaderboard?.highestAvg.average;
                  return (
                    <td key={idx} className={`px-8 py-5 text-center transition-all ${isMax ? 'bg-amber-50 font-black text-amber-700' : 'text-gray-600 font-bold'}`}>
                      {s.average}
                      {isMax && <Star className="w-3 h-3 inline ml-1 fill-current" />}
                    </td>
                  );
                })}
              </tr>
              
              <tr className="bg-gray-50/30">
                <td colSpan={selectedClasses.length + 1} className="px-8 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('comparison.matrix_subject_avg')}</td>
              </tr>

              {classComparisonData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-4 text-gray-700 font-bold">{row.name}</td>
                  {selectedClasses.map((cls, colIdx) => {
                    const val = row[cls] || 0;
                    const isMax = val === rowMaxMap[row.name] && val > 0;
                    return (
                      <td key={colIdx} className={`px-8 py-4 text-center transition-all ${isMax ? 'bg-emerald-50 text-emerald-700 font-black' : 'text-gray-600'}`}>
                        {val || '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr className="bg-gray-50/30">
                <td colSpan={selectedClasses.length + 1} className="px-8 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('comparison.matrix_rank_dist')}</td>
              </tr>

              {rankingDistributionData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-4 text-gray-600 font-medium">{row.name} {t('comparison.count')}</td>
                  {selectedClasses.map((cls, colIdx) => {
                    const val = row[cls] || 0;
                    const isMax = val === distRowMaxMap[row.name] && val > 0;
                    return (
                      <td key={colIdx} className={`px-8 py-4 text-center ${isMax ? 'bg-indigo-50 text-indigo-700 font-black' : 'text-gray-500'}`}>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${isMax ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                          {val}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title={t('comparison.chart_gap')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classComparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}} 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} 
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

        <ChartContainer title={t('comparison.chart_density')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankingDistributionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}} 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} 
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
