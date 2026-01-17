
import React, { useState, useMemo } from 'react';
import { Filter, ArrowUpDown, TrendingUp, TrendingDown, Search, Calculator, Calendar } from 'lucide-react';
import { StudentRecord } from '../types';
import * as AnalysisEngine from '../utils/analysisUtils';

interface ProgressAnalysisViewProps {
  students: StudentRecord[];
  allPeriods: string[];
  allHistoricalRanks: Record<string, Record<string, number>>;
  classes: string[];
}

const ProgressAnalysisView: React.FC<ProgressAnalysisViewProps> = ({
  students, allPeriods, allHistoricalRanks, classes
}) => {
  const [periodX, setPeriodX] = useState<string>(allPeriods[allPeriods.length - 2] || allPeriods[0] || '');
  const [periodY, setPeriodY] = useState<string>(allPeriods[allPeriods.length - 1] || '');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(classes);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'coefficient',
    direction: 'desc'
  });

  const analysisData = useMemo(() => {
    const rawData = AnalysisEngine.getProgressAnalysisData(students, periodX, periodY, allHistoricalRanks);
    
    // Filter by class and search term
    return rawData.filter(d => 
      selectedClasses.includes(d.class) && 
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, periodX, periodY, allHistoricalRanks, selectedClasses, searchTerm]);

  const sortedData = useMemo(() => {
    return [...analysisData].sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [analysisData, sortConfig]);

  const toggleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(p => p !== cls) : [...prev, cls]
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Select Comparison Periods
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold ml-1">第一次考试 (x)</p>
                <select 
                  className="w-full bg-white/50 border border-white/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                  value={periodX}
                  onChange={(e) => setPeriodX(e.target.value)}
                >
                  {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold ml-1">第二次考试 (y)</p>
                <select 
                  className="w-full bg-white/50 border border-white/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                  value={periodY}
                  onChange={(e) => setPeriodY(e.target.value)}
                >
                  {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-3 h-3" /> Filter by Class
            </h4>
            <div className="flex flex-wrap gap-2">
              {classes.map(cls => (
                <button 
                  key={cls}
                  onClick={() => toggleClass(cls)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedClasses.includes(cls) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white/50 text-gray-500 border-gray-200 hover:border-blue-300 hover:bg-white'}`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-blue-50/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-blue-100">
            <Calculator className="w-3 h-3 text-blue-600" />
            Coefficient (z) = 2 * (x - y) / (x + y)
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/90 text-white backdrop-blur-md">
              <tr>
                <th className="px-6 py-5 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-2">姓名 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => toggleSort('rankX')}>
                  <div className="flex items-center justify-center gap-2">{periodX || '第一次'}级名 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => toggleSort('rankY')}>
                  <div className="flex items-center justify-center gap-2">{periodY || '第二次'}级名 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => toggleSort('rankChange')}>
                  <div className="flex items-center justify-center gap-2">进退步名次 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => toggleSort('coefficient')}>
                  <div className="flex items-center justify-center gap-2">进退步系数 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => toggleSort('streakCount')}>
                  <div className="flex items-center justify-center gap-2">连续进退步 <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {sortedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{row.name}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">{row.class}</div>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 font-medium">#{row.rankX}</td>
                  <td className="px-6 py-4 text-center text-gray-600 font-medium">#{row.rankY}</td>
                  <td className={`px-6 py-4 text-center font-black ${row.rankChange > 0 ? 'text-emerald-600' : row.rankChange < 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                    <div className="flex items-center justify-center gap-1">
                      {row.rankChange > 0 ? <TrendingUp className="w-3 h-3" /> : row.rankChange < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      {row.rankChange > 0 ? `+${row.rankChange}` : row.rankChange === 0 ? '-' : row.rankChange}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${row.coefficient > 0 ? 'bg-emerald-100/50 text-emerald-700' : row.coefficient < 0 ? 'bg-rose-100/50 text-rose-700' : 'bg-slate-100/50 text-gray-500'}`}>
                      {row.coefficient > 0 ? `+${row.coefficient.toFixed(2)}` : row.coefficient.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold">
                    {row.streakCount !== 0 ? (
                      <span className={`text-xs ${row.streakCount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {row.streakCount > 0 ? `进 ${row.streakCount}` : `退 ${Math.abs(row.streakCount)}`}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic">
                    No data available for the selected period or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProgressAnalysisView;
