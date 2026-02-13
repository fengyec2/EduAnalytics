
import React from 'react';
import { 
  GraduationCap, Target, Zap, ShieldAlert, Flame, TrendingUp, TrendingDown, Table as TableIcon
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { StudentRecord } from '../../types';
import * as AnalysisEngine from '../../utils/analysisUtils';
import { useTranslation } from '../../context/LanguageContext';

interface PersonalReportProps {
  students: StudentRecord[];
  selectedStudentIds: string[];
  selectedPeriod: string;
  allHistoricalRanks: Record<string, Record<string, number>>;
  allClassHistoricalRanks: Record<string, Record<string, number>>;
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>;
  periodData: any[];
  subjects: string[];
  totalStudents: number;
  getStatusLabel: (period: string, studentName: string, student: StudentRecord) => string;
  getSubjectCellStyle: (period: string, subject: string, studentName: string) => string;
}

const PersonalReport: React.FC<PersonalReportProps> = ({
  students,
  selectedStudentIds,
  selectedPeriod,
  allHistoricalRanks,
  allClassHistoricalRanks,
  allSubjectRanks,
  periodData,
  subjects,
  totalStudents,
  getStatusLabel,
  getSubjectCellStyle
}) => {
  const { t, language } = useTranslation();

  return (
    <div className="space-y-0">
      {selectedStudentIds.map((studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return null;

        const swot = AnalysisEngine.getStudentSWOT(student, selectedPeriod, subjects, allHistoricalRanks, allSubjectRanks, totalStudents);
        const radar = AnalysisEngine.getStudentRadarData(student, selectedPeriod, subjects, 'grade', periodData);
        const history = student.history.map(h => ({
          period: h.period,
          totalScore: h.totalScore,
          schoolRank: allHistoricalRanks[h.period]?.[student.name]
        }));
        const streak = AnalysisEngine.calculateStreakInfo(student, allHistoricalRanks);
        const historyMeanTotal = student.history.reduce((acc, h) => acc + h.totalScore, 0) / student.history.length;
        
        const firstTotal = student.history[0].totalScore;
        const lastTotal = student.history[student.history.length - 1].totalScore;
        const improvement = student.history.length > 1 ? ((lastTotal - firstTotal) / firstTotal) * 100 : 0;
        const improvementStr = student.history.length > 1 ? (improvement > 0 ? `+${improvement.toFixed(1)}%` : `${improvement.toFixed(1)}%`) : 'N/A';

        return (
          <div key={studentId} className="print:break-after-page print:min-h-screen print:flex print:flex-col pb-10 border-b-8 border-gray-100 mb-10 print:border-none print:mb-0 print:pb-0">
            {/* Header - Outline Style for Print Savings */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm w-full mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">{student.name}</h2>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{student.class} • {t('student.academic_performer')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{t('student.latest_rank')}</p>
                  <p className="text-4xl font-black text-gray-900">#{allHistoricalRanks[selectedPeriod]?.[student.name] || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-8">
                 <div className="flex flex-col">
                   <span className="text-xs text-gray-400 uppercase font-bold">{t('student.avg_total')}</span>
                   <span className="font-black text-lg text-gray-800">{historyMeanTotal.toFixed(1)}</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xs text-gray-400 uppercase font-bold">{t('student.improvement_total')}</span>
                   <span className={`font-black text-lg ${improvement > 0 ? 'text-emerald-600' : improvement < 0 ? 'text-rose-600' : 'text-gray-800'}`}>{improvementStr}</span>
                 </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6 mb-6">
               <div className="h-48 border rounded-2xl p-2 relative">
                  <p className="absolute top-2 left-3 text-[9px] font-bold text-gray-400 uppercase">Competency Radar</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radar}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 9, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                      <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} isAnimationActive={false} />
                      <Radar dataKey="baseline" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.3} isAnimationActive={false} />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
               <div className="h-48 border rounded-2xl p-2 relative">
                  <p className="absolute top-2 left-3 text-[9px] font-bold text-gray-400 uppercase">Rank Trend</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" fontSize={9} tick={{fill: '#475569'}} />
                      <YAxis reversed width={30} fontSize={9} domain={['auto', 'auto']} tick={{fill: '#475569'}} />
                      <Line type="monotone" dataKey="schoolRank" stroke="#8b5cf6" strokeWidth={2} dot={{r: 2}} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* SWOT & Streak Row */}
            <div className="grid grid-cols-2 gap-6 mb-6">
               {/* SWOT Analysis */}
               <div className="border rounded-2xl p-4">
                  <h4 className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-3 flex items-center gap-1"><Target className="w-3 h-3" /> SWOT Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-start text-xs">
                        <Zap className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /> 
                        <div>
                            <span className="font-bold text-gray-500 block mb-0.5">Strengths:</span> 
                            <span className="text-gray-800">{swot.strengths.length ? swot.strengths.join(', ') : '-'}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 items-start text-xs pt-2 border-t border-gray-50">
                        <ShieldAlert className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" /> 
                        <div>
                            <span className="font-bold text-gray-500 block mb-0.5">Weaknesses:</span> 
                            <span className="text-gray-800">{swot.weaknesses.length ? swot.weaknesses.join(', ') : '-'}</span>
                        </div>
                    </div>
                  </div>
               </div>
               
               {/* Full Trend Analysis Card Replica (Outline Style) */}
               {streak && streak.count > 0 ? (
                <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-xl ${streak.type === 'improvement' ? 'bg-emerald-500' : streak.type === 'decline' ? 'bg-rose-500' : 'bg-gray-500'}`}><Flame className="w-4 h-4 text-white" /></div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${streak.type === 'improvement' ? 'text-emerald-600' : streak.type === 'decline' ? 'text-rose-600' : 'text-gray-600'}`}>{t('student.trend_analysis')}</p>
                      <h4 className={`text-sm font-black ${streak.type === 'improvement' ? 'text-emerald-900' : streak.type === 'decline' ? 'text-rose-900' : 'text-gray-900'}`}>
                        {t('student.streak_msg')
                          .replace('{type}', streak.type === 'improvement' ? t('student.streak_improvement') : streak.type === 'decline' ? t('student.streak_decline') : t('student.streak_stable'))
                          .replace('{count}', String(streak.count))
                        }
                      </h4>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end"><span className="text-[10px] text-gray-500">{t('student.total_rank_change')}</span><span className={`text-xl font-black ${streak.type === 'improvement' ? 'text-emerald-600' : streak.type === 'decline' ? 'text-rose-600' : 'text-gray-600'}`}>{streak.totalChange > 0 ? `+${streak.totalChange}` : streak.totalChange}</span></div>
                    <div className="flex flex-wrap gap-1">{streak.steps.map((step, idx) => (<div key={idx} className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 border ${streak.type === 'improvement' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>{streak.type === 'improvement' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}{step > 0 ? `+${step}` : step}</div>))}</div>
                  </div>
                </div>
               ) : (
                <div className="p-4 rounded-2xl border border-gray-200 bg-white flex flex-col justify-center items-center text-center shadow-sm">
                    <div className="p-2 bg-gray-100 rounded-full mb-2"><Flame className="w-4 h-4 text-gray-400" /></div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('student.trend_analysis')}</p>
                    <p className="text-xs text-gray-500 font-medium">Performance is stable.</p>
                </div>
               )}
            </div>

            {/* Detailed Ledger Table Replica */}
            <div className="border rounded-xl overflow-hidden mt-auto">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                 <TableIcon className="w-3 h-3 text-gray-400" />
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('student.ledger_title')}</span>
              </div>
              <table className="w-full text-[10px] text-left">
                <thead>
                  <tr className="bg-white text-gray-400 font-bold border-b border-gray-100">
                    <th className="px-3 py-2 whitespace-nowrap bg-gray-50/50">{t('student.ledger_period')}</th>
                    {subjects.map(s => (
                      <React.Fragment key={s}>
                        <th className="px-2 py-2 text-center border-l border-gray-50">{s}</th>
                        <th className="px-1 py-2 text-center text-[9px] text-gray-300 font-normal">{s.substring(0, 1)}{language === 'zh' ? '名' : ' Rk'}</th>
                      </React.Fragment>
                    ))}
                    <th className="px-3 py-2 text-indigo-600 text-right border-l border-gray-100">{t('student.ledger_total')}</th>
                    <th className="px-3 py-2 text-blue-600 text-center">{t('student.ledger_class_rank')}</th>
                    <th className="px-3 py-2 text-purple-600 text-center">{t('student.ledger_grade_rank')}</th>
                    <th className="px-3 py-2 text-center text-gray-600">{t('student.ledger_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {student.history.map((h, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                        <td className="px-3 py-2 font-bold text-gray-700 whitespace-nowrap bg-gray-50/50">{h.period}</td>
                        {subjects.map(s => (
                          <React.Fragment key={s}>
                            <td className={`px-2 py-2 text-center border-l border-gray-50 ${getSubjectCellStyle(h.period, s, student.name)}`}>
                              {h.scores[s] || '-'}
                            </td>
                            <td className="px-1 py-2 text-center text-gray-400 font-medium text-[9px]">
                               {allSubjectRanks[h.period]?.[s]?.[student.name] || '-'}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="px-3 py-2 font-black text-indigo-600 text-right border-l border-gray-100">{h.totalScore}</td>
                        <td className="px-3 py-2 text-center">
                            <span className="font-black text-blue-600">
                                {allClassHistoricalRanks[h.period]?.[student.name] || '-'}
                            </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                            <span className="font-black text-purple-600">
                                #{allHistoricalRanks[h.period]?.[student.name] || '-'}
                            </span>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-gray-600 text-[9px]">
                            {getStatusLabel(h.period, student.name, student)}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Page Footer for Print */}
            <div className="hidden print:block mt-auto text-center text-[8px] text-gray-400 pt-2">
              {student.name} ({student.class}) • Individual Performance Report • Generated by EduAnalytics
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PersonalReport;
