
import React from 'react';
import { 
  FileText, Users, Layers, Award, TrendingUp, 
  PieChart as PieIcon, Crown, Calculator, BarChart2,
  Trophy, Star, Zap, Target
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Legend, ResponsiveContainer, LabelList, Tooltip
} from 'recharts';
import { StatCard } from '../SharedComponents';
import { useTranslation } from '../../context/LanguageContext';

interface OverallReportProps {
  sections: {
    overview: boolean;
    school: boolean;
    comparison: boolean;
    kings: boolean;
    parameters: boolean;
    subject: boolean;
  };
  overviewStats: { count: number; maxScore: number; avgScore: number };
  schoolStats: {
    admissionDist: any[];
    subjectAvgs: any[];
  };
  comparisonData: {
    stats: any[];
    leaderboard: any;
    subjectMatrix: any[];
    rankMatrix: any[];
    rowMaxMap: Record<string, number>;
    eliteThreshold: number;
    benchThreshold: number;
    ownershipData: any[];
    ownershipThreshold: number;
    populationDistData: any[];
    colors: string[];
  };
  kingsData: any[];
  duelData: any[];
  classFirstStudentName: string;
  schoolFirstStudentName: string;
  benchmarkClass: string;
  paramsData: any;
  subjectAnalysisData: any[];
  compClasses: string[];
  totalClasses: number;
}

const OverallReport: React.FC<OverallReportProps> = ({
  sections,
  overviewStats,
  schoolStats,
  comparisonData,
  kingsData,
  duelData,
  classFirstStudentName,
  schoolFirstStudentName,
  benchmarkClass,
  paramsData,
  subjectAnalysisData,
  compClasses,
  totalClasses
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-10">
      {sections.overview && (
        <section className="print-break-inside-avoid">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
            <FileText className="w-4 h-4 text-blue-500" /> {t('export.section_overview')}
          </h3>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard icon={<Users className="w-4 h-4 text-blue-600" />} title={t('stat.total_students')} value={overviewStats.count.toString()} subtitle="Total" />
            <StatCard icon={<Layers className="w-4 h-4 text-green-600" />} title={t('stat.classes')} value={totalClasses.toString()} subtitle="Active Groups" />
            <StatCard icon={<Award className="w-4 h-4 text-purple-600" />} title={t('stat.best_score')} value={overviewStats.maxScore.toString()} subtitle="School Highest" />
            <StatCard icon={<TrendingUp className="w-4 h-4 text-orange-600" />} title={t('common.average')} value={overviewStats.avgScore.toFixed(1)} subtitle="Global Avg" />
          </div>
        </section>
      )}

      {sections.school && (
        <section className="print-break-inside-avoid">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
            <PieIcon className="w-4 h-4 text-blue-500" /> {t('tab.school')}
          </h3>
          <div className="grid grid-cols-2 gap-8 h-64 mb-6">
            <div className="border rounded-2xl p-4 print:border-gray-200">
              <h4 className="text-xs font-bold text-gray-700 mb-2">{t('school.chart_admissions')}</h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={schoolStats.admissionDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value" nameKey="name" isAnimationActive={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {schoolStats.admissionDist.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="border rounded-2xl p-4 print:border-gray-200">
              <h4 className="text-xs font-bold text-gray-700 mb-2">{t('school.chart_subjects')}</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={schoolStats.subjectAvgs}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={9} interval={0} tick={{fill: '#475569'}} />
                  <YAxis fontSize={9} tick={{fill: '#475569'}} />
                  <Bar dataKey="avg" fill="#3b82f6" isAnimationActive={false} label={{ position: 'top', fontSize: 9, fill: '#666' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {sections.comparison && (
        <section className="print-break-inside-avoid space-y-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
            <Layers className="w-4 h-4 text-indigo-500" /> {t('tab.comparison')}
          </h3>

          {/* 1. Leaderboard Cards */}
          {comparisonData.leaderboard && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 relative overflow-hidden">
                <Trophy className="w-8 h-8 text-amber-200 absolute right-2 bottom-2" />
                <h4 className="text-[10px] font-black text-amber-700 uppercase">{t('comparison.stat_highest_avg')}</h4>
                <p className="text-xl font-black text-amber-900">{comparisonData.leaderboard.highestAvg.className}</p>
                <p className="text-xs font-bold text-amber-600">{comparisonData.leaderboard.highestAvg.average} {t('comparison.stat_points_avg')}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 relative overflow-hidden">
                <Star className="w-8 h-8 text-indigo-200 absolute right-2 bottom-2" />
                <h4 className="text-[10px] font-black text-indigo-700 uppercase">{t('comparison.stat_most_top10').replace('{threshold}', String(comparisonData.eliteThreshold))}</h4>
                <p className="text-xl font-black text-indigo-900">{comparisonData.leaderboard.mostElite.className}</p>
                <p className="text-xs font-bold text-indigo-600">{comparisonData.leaderboard.mostElite.count} {t('comparison.stat_students_top10').replace('{threshold}', '')}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 relative overflow-hidden">
                <Users className="w-8 h-8 text-emerald-200 absolute right-2 bottom-2" />
                <h4 className="text-[10px] font-black text-emerald-700 uppercase">{t('comparison.stat_strongest_bench').replace('{threshold}', String(comparisonData.benchThreshold))}</h4>
                <p className="text-xl font-black text-emerald-900">{comparisonData.leaderboard.mostBench.className}</p>
                <p className="text-xs font-bold text-emerald-600">{comparisonData.leaderboard.mostBench.count} {t('comparison.stat_students_top50').replace('{threshold}', '')}</p>
              </div>
            </div>
          )}

          {/* 2. Ownership & Population Dist */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="border rounded-xl p-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                <Target className="w-3 h-3 text-indigo-500" /> {t('comparison.ownership_title').replace('{threshold}', String(comparisonData.ownershipThreshold))}
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={comparisonData.ownershipData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" nameKey="name" isAnimationActive={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {comparisonData.ownershipData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '9px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="border rounded-xl p-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                <PieIcon className="w-3 h-3 text-indigo-500" /> {t('comparison.chart_population_dist')}
              </h4>
              <div className="grid grid-cols-2 gap-2 h-48 overflow-hidden">
                 {comparisonData.populationDistData.slice(0, 4).map((clsData, idx) => (
                    <div key={idx} className="relative">
                      <p className="absolute top-0 left-0 text-[9px] font-black text-gray-500">{clsData.className}</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={clsData.data} cx="50%" cy="60%" innerRadius={20} outerRadius={35} paddingAngle={0} dataKey="value" nameKey="name" isAnimationActive={false}>
                            {clsData.data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                 ))}
              </div>
            </div>
          </div>

          {/* 3. Matrix */}
          <div className="border rounded-xl overflow-hidden mb-6">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                <tr>
                  <th className="px-4 py-2 border-r border-gray-200">{t('comparison.matrix_header')}</th>
                  {compClasses.map(cls => <th key={cls} className="px-4 py-2 text-center">{cls}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-blue-50/20">
                  <td className="px-4 py-2 font-black text-blue-600 border-r border-blue-100">{t('comparison.matrix_total_avg')}</td>
                  {comparisonData.stats.map((s, idx) => <td key={idx} className={`px-4 py-2 text-center font-bold`}>{s.average}</td>)}
                </tr>
                {comparisonData.subjectMatrix.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="px-4 py-2 font-bold text-gray-700 border-r border-gray-100">{row.name}</td>
                    {compClasses.map((cls, colIdx) => <td key={colIdx} className={`px-4 py-2 text-center ${row[cls] === comparisonData.rowMaxMap[row.name] ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-500'}`}>{row[cls]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. Gap & Density Charts */}
          <div className="grid grid-cols-2 gap-6">
            <div className="h-48 border rounded-xl p-2 relative">
               <p className="absolute top-2 left-3 text-[9px] font-bold text-gray-400 uppercase">{t('comparison.chart_gap')}</p>
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData.subjectMatrix} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" fontSize={9} />
                  <YAxis stroke="#475569" fontSize={9} />
                  {compClasses.map((cls, idx) => (
                    <Bar key={cls} dataKey={cls} fill={comparisonData.colors[idx % comparisonData.colors.length]} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-48 border rounded-xl p-2 relative">
               <p className="absolute top-2 left-3 text-[9px] font-bold text-gray-400 uppercase">{t('comparison.chart_density')}</p>
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData.rankMatrix} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" fontSize={9} />
                  <YAxis stroke="#475569" fontSize={9} />
                  {compClasses.map((cls, idx) => (
                    <Bar key={cls} dataKey={cls} fill={comparisonData.colors[idx % comparisonData.colors.length]} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {sections.kings && (
        <section className="print-break-inside-avoid">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
            <Crown className="w-4 h-4 text-amber-500" /> {t('tab.kings')} ({benchmarkClass})
          </h3>
          <div className="grid grid-cols-2 gap-4 h-80">
            <div className="border rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-700 mb-2">{t('kings.chart_kings_title').replace('{className}', benchmarkClass)}</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kingsData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#475569" fontSize={9} />
                  <YAxis dataKey="subject" type="category" stroke="#475569" fontSize={9} width={60} />
                  <Bar dataKey="classMax" fill="#3b82f6" isAnimationActive={false} barSize={12} radius={[0, 4, 4, 0]}>
                     <LabelList dataKey="classMax" position="right" fontSize={9} fill="#3b82f6" />
                  </Bar>
                  <Bar dataKey="gradeMax" fill="#64748b" isAnimationActive={false} barSize={8} radius={[0, 4, 4, 0]}>
                     <LabelList dataKey="gradeMax" position="right" fontSize={9} fill="#64748b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="border rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-700 mb-2">{t('kings.chart_duel_title')}</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={duelData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="subject" stroke="#475569" fontSize={9} />
                  <YAxis stroke="#475569" fontSize={9} />
                  <Bar dataKey="classFirst" name={`${classFirstStudentName}`} fill="#8b5cf6" isAnimationActive={false} radius={[4, 4, 0, 0]}>
                     <LabelList dataKey="classFirst" position="top" fontSize={9} fill="#8b5cf6" />
                  </Bar>
                  <Bar dataKey="schoolFirst" name={`${schoolFirstStudentName}`} fill="#ec4899" isAnimationActive={false} radius={[4, 4, 0, 0]}>
                     <LabelList dataKey="schoolFirst" position="top" fontSize={9} fill="#ec4899" />
                  </Bar>
                  <Legend verticalAlign="top" wrapperStyle={{fontSize: '9px'}}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {sections.parameters && (
        <section className="print-break-inside-avoid">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
            <Calculator className="w-4 h-4 text-purple-500" /> {t('tab.parameters')}
          </h3>
          {paramsData && (
            <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                  <tr><th className="px-4 py-2">{t('common.subject')}</th><th className="px-4 py-2 text-center">{t('params.table_mean')}</th><th className="px-4 py-2 text-center">{t('params.table_difficulty')}</th><th className="px-4 py-2 text-center">{t('params.table_discrimination')}</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paramsData.subjectStats.map((s: any, i: number) => (
                    <tr key={i}><td className="px-4 py-2 font-bold">{s.subject}</td><td className="px-4 py-2 text-center">{s.mean}</td><td className="px-4 py-2 text-center">{s.difficulty}</td><td className="px-4 py-2 text-center">{s.discrimination}</td></tr>
                  ))}
                </tbody>
                </table>
            </div>
          )}
        </section>
      )}

      {sections.subject && (
        <section className="print-break-inside-avoid space-y-6">
          {subjectAnalysisData.map((dataItem) => (
            <div key={dataItem.subject} className="break-inside-avoid">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" /> {t('tab.subject')} - {dataItem.subject}
              </h3>
              <div className="bg-white p-4 border rounded-xl h-40 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataItem.dist}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} />
                      <Bar dataKey="count" isAnimationActive={false} radius={[4, 4, 0, 0]} barSize={40}>
                        {dataItem.dist.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        <LabelList dataKey="count" position="top" style={{ fill: '#475569', fontSize: '10px', fontWeight: 'bold' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default OverallReport;
