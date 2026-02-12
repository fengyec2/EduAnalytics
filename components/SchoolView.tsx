
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Settings2, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { ChartContainer } from './SharedComponents';
import * as AnalysisEngine from '../utils/analysisUtils';
import { useTranslation } from '../context/LanguageContext';

interface SchoolViewProps {
  selectedPeriod: string;
  periodData: any[];
  subjects: string[];
  thresholds: Record<string, number>;
  setThresholds: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  thresholdType: 'rank' | 'percent';
  setThresholdType: React.Dispatch<React.SetStateAction<'rank' | 'percent'>>;
  hasImportedStatus?: boolean;
  totalStudents: number;
}

const SchoolView: React.FC<SchoolViewProps> = ({ 
  selectedPeriod, 
  periodData, 
  subjects,
  thresholds,
  setThresholds,
  thresholdType,
  setThresholdType,
  hasImportedStatus = false,
  totalStudents
}) => {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  
  const admissionLabels = [
    { key: '清北', color: '#be123c' },
    { key: 'C9', color: '#1e40af' },
    { key: '高分数', color: '#0369a1' },
    { key: '名校', color: '#0d9488' },
    { key: '特控', color: '#10b981' },
  ];

  const handleThresholdChange = (key: string, val: string) => {
    const num = parseFloat(val) || 0;
    setThresholds(prev => ({ ...prev, [key]: num }));
  };

  const admissionDistribution = useMemo(() => 
    AnalysisEngine.getAdmissionDistribution(periodData, thresholds, thresholdType, admissionLabels),
    [periodData, thresholds, thresholdType]
  );

  const subjectAvgs = useMemo(() => 
    AnalysisEngine.getSubjectAverages(periodData, subjects),
    [periodData, subjects]
  );

  const effectiveGradePopulation = useMemo(() => 
    Math.max(...periodData.map(s => s.periodSchoolRank || 0), totalStudents),
    [periodData, totalStudents]
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-6 py-4 flex items-center justify-between text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-600" />
            {t('school.config_title')}
          </div>
          <div className="flex items-center gap-4">
            {hasImportedStatus && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> {t('school.imported_meta')}
              </span>
            )}
            {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>
        
        {showSettings && (
          <div className="px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2">
            {!hasImportedStatus ? (
              <>
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl w-fit">
                  <button 
                    onClick={() => setThresholdType('rank')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${thresholdType === 'rank' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                  >
                    {t('school.rank_mode')}
                  </button>
                  <button 
                    onClick={() => setThresholdType('percent')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${thresholdType === 'percent' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                  >
                    {t('school.percent_mode')}
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
                          step={thresholdType === 'percent' ? "0.01" : "1"}
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
              </>
            ) : (
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
                <ShieldCheck className="w-10 h-10 text-blue-600 mb-3" />
                <h4 className="text-sm font-bold text-blue-900 mb-2">Metadata Overdrive Active</h4>
                <p className="text-xs text-blue-800 max-w-lg leading-relaxed">
                  Based on cohort size <strong>{effectiveGradePopulation}</strong>, thresholds are automatically calculated from imported admission flags.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title={`${t('school.chart_admissions')} (${selectedPeriod})`}>
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
                nameKey="name"
              >
                {admissionDistribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                formatter={(value, name) => [value, name]}
              />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title={`${t('school.chart_subjects')} (${selectedPeriod})`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectAvgs}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#475569" fontSize={12} tick={{ fill: '#475569' }} />
              <YAxis stroke="#475569" fontSize={12} tick={{ fill: '#475569' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                formatter={(value, name) => [value, t('common.average')]}
              />
              <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} name={t('common.average')} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default SchoolView;
