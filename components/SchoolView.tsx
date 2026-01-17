
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
      <section className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm overflow-hidden transition-all">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-6 py-4 flex items-center justify-between text-sm font-bold text-slate-600 hover:bg-white/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-600" />
            {t('school.config_title')}
          </div>
          <div className="flex items-center gap-4">
            {hasImportedStatus && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50/50 backdrop-blur-sm text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
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
                <div className="flex items-center gap-4 bg-slate-50/50 p-2 rounded-xl w-fit border border-slate-100">
                  <button 
                    onClick={() => setThresholdType('rank')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${thresholdType === 'rank' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-100' : 'text-slate-400'}`}
                  >
                    {t('school.rank_mode')}
                  </button>
                  <button 
                    onClick={() => setThresholdType('percent')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${thresholdType === 'percent' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-100' : 'text-slate-400'}`}
                  >
                    {t('school.percent_mode')}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {admissionLabels.map(line => (
                    <div key={line.key} className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: line.color }} />
                        {line.key}
                      </label>
                      <div className="relative">
                        <input 
                          type="number"
                          step={thresholdType === 'percent' ? "0.01" : "1"}
                          value={thresholds[line.key]}
                          onChange={(e) => handleThresholdChange(line.key, e.target.value)}
                          className="w-full px-3 py-2 bg-white/50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all backdrop-blur-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                          {thresholdType === 'rank' ? '位' : '%'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-blue-50/40 backdrop-blur-sm p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
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
              >
                {admissionDistribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title={`${t('school.chart_subjects')} (${selectedPeriod})`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectAvgs}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                cursor={{ fill: 'rgba(248,250,252,0.5)' }}
                contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
              />
              <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default SchoolView;
