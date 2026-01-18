import React, { useState, useMemo } from 'react';
import { Filter, ArrowUpDown, TrendingUp, TrendingDown, Search, Calculator, Calendar } from 'lucide-react';
import { StudentRecord } from '../types';
import { SelectInput, SearchInput, FilterChip } from './SharedComponents';
import * as AnalysisEngine from '../utils/analysisUtils';
import { useTranslation } from '../context/LanguageContext';

interface ProgressAnalysisViewProps {
  students: StudentRecord[];
  allPeriods: string[];
  allHistoricalRanks: Record<string, Record<string, number>>;
  classes: string[];
}

const ProgressAnalysisView: React.FC<ProgressAnalysisViewProps> = ({
  students, allPeriods, allHistoricalRanks, classes
}) => {
  const { t } = useTranslation();
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
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> {t('progress.period_select')}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold ml-1">{t('progress.period_x')}</p>
                <SelectInput 
                  value={periodX}
                  onChange={(e) => setPeriodX(e.target.value)}
                >
                  {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
                </SelectInput>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold ml-1">{t('progress.period_y')}</p>
                <SelectInput 
                  value={periodY}
                  onChange={(e) => setPeriodY(e.target.value)}
                >
                  {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
                </SelectInput>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-3 h-3" /> {t('progress.class_filter')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {classes.map(cls => (
                <FilterChip 
                  key={cls}
                  label={cls}
                  active={selectedClasses.includes(cls)}
                  onClick={() => toggleClass(cls)}
                  color="blue"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <SearchInput 
             className="w-full md:w-64"
             placeholder={t('common.search')}
             value={searchTerm}
             onChange={setSearchTerm}
          />
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            <Calculator className="w-3 h-3 text-blue-600" />
            {t('progress.coefficient_formula')}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-6 py-5 cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-2">{t('progress.table_name')} <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => toggleSort('rankX')}>
                  <div className="flex items-center justify-center gap-2">{t('progress.table_rank_x').replace('{period}', periodX || '')} <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => toggleSort('rankY')}>
                  <div className="flex items-center justify-center gap-2">{t('progress.table_rank_x').replace('{period}', periodY || '')} <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => toggleSort('rankChange')}>
                  <div className="flex items-center justify-center gap-2">{t('progress.table_rank_change')} <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => toggleSort('coefficient')}>
                  <div className="flex items-center justify-center gap-2">{t('progress.table_coefficient')} <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => toggleSort('streakCount')}>
                  <div className="flex items-center justify-center gap-2">{t('progress.table_streak')} <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
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
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${row.coefficient > 0 ? 'bg-emerald-100 text-emerald-700' : row.coefficient < 0 ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'}`}>
                      {row.coefficient > 0 ? `+${row.coefficient.toFixed(2)}` : row.coefficient.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold">
                    {row.streakCount !== 0 ? (
                      <span className={`text-xs ${row.streakCount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {row.streakCount > 0 
                          ? t('progress.table_streak_up').replace('{count}', String(row.streakCount))
                          : t('progress.table_streak_down').replace('{count}', String(Math.abs(row.streakCount)))}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic">
                    {t('progress.no_data')}
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