
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Settings2, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { ChartContainer } from './SharedComponents';
import * as AnalysisEngine from '../utils/analysisUtils';

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
            上线分析参数配置 (Admissions Thresholds)
          </div>
          <div className="flex items-center gap-4">
            {hasImportedStatus && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> 使用导入元数据推算
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
                <h4 className="text-sm font-bold text-blue-900 mb-2">已开启“导入元数据”优先模式</h4>
                <p className="text-xs text-blue-800 max-w-lg leading-relaxed">
                  系统检测到导入数据包含原始“上线情况”。基于年级有效人数 <strong>{effectiveGradePopulation}</strong>，系统已推算出各级别的“百分比阈值”并将动态适配各学科人数：
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 w-full">
                  {admissionLabels.map(label => {
                    const pct = thresholds[label.key] || 0;
                    const approxRank = Math.round((pct / 100) * effectiveGradePopulation);
                    return (
                      <div key={label.key} className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{label.key}</p>
                        <p className="text-lg font-black text-blue-600">{pct.toFixed(2)}%</p>
                        <p className="text-[10px] text-gray-400 font-medium">切分名次约 {approxRank}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="text-[10px] text-gray-400 italic">注：百分比阈值将应用于各学科对应的“最高名次”以实现名次线的科学适配。</p>
          </div>
        )}
      </section>

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
