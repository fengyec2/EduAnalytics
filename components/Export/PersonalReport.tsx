
import React from 'react';
import { 
  GraduationCap, Target, Zap, ShieldAlert, Flame 
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
  allSubjectRanks,
  periodData,
  subjects,
  totalStudents,
  getStatusLabel,
  getSubjectCellStyle
}) => {
  const { t } = useTranslation();

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

        return (
          <div key={studentId} className="print:break-after-page print:min-h-screen print:flex print:flex-col pb-10 border-b-4 border-gray-100 mb-10 print:border-none print:mb-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-sm text-white w-full">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{student.name}</h2>
                    </div>
                    <p className="text-sm opacity-80">{student.class} • {t('student.academic_performer')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] opacity-70 uppercase font-black tracking-widest">{t('student.latest_rank')}</p>
                    <p className="text-4xl font-black">#{allHistoricalRanks[selectedPeriod]?.[student.name] || 'N/A'}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex gap-6">
                   <div className="flex flex-col"><span className="text-xs opacity-60 uppercase">{t('student.avg_total')}</span><span className="font-bold">{historyMeanTotal.toFixed(1)}</span></div>
                   <div className="flex flex-col"><span className="text-xs opacity-60 uppercase">{t('student.improvement_total')}</span><span className="font-bold">{student.history.length > 1 ? (((student.history[student.history.length-1].totalScore - student.history[0].totalScore) / student.history[0].totalScore * 100).toFixed(1) + '%') : 'N/A'}</span></div>
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

            {/* SWOT & Streak */}
            <div className="grid grid-cols-2 gap-6 mb-6">
               <div className="border rounded-2xl p-4">
                  <h4 className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-3 flex items-center gap-1"><Target className="w-3 h-3" /> SWOT Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center text-xs"><Zap className="w-3 h-3 text-emerald-500" /> <span className="font-bold text-gray-500">Strengths:</span> {swot.strengths.length ? swot.strengths.join(', ') : '-'}</div>
                    <div className="flex gap-2 items-center text-xs"><ShieldAlert className="w-3 h-3 text-rose-500" /> <span className="font-bold text-gray-500">Weaknesses:</span> {swot.weaknesses.length ? swot.weaknesses.join(', ') : '-'}</div>
                  </div>
               </div>
               <div className={`border rounded-2xl p-4 flex items-center gap-4 ${streak?.type === 'improvement' ? 'bg-emerald-50/30' : 'bg-gray-50/30'}`}>
                  <div className={`p-2 rounded-full ${streak?.type === 'improvement' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}><Flame className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Trend</p>
                    <p className="text-xs font-bold text-gray-800">{streak ? (streak.type === 'improvement' ? `Improving (${streak.count})` : 'Stable/Decline') : 'Stable'}</p>
                  </div>
               </div>
            </div>

            {/* Ledger Table */}
            <div className="border rounded-xl overflow-hidden mt-auto">
              <table className="w-full text-[10px] text-left">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                  <tr>
                    <th className="px-3 py-2">{t('student.ledger_period')}</th>
                    {subjects.slice(0, 6).map(s => <th key={s} className="px-2 py-2 text-center">{s}</th>)}
                    <th className="px-3 py-2 text-center font-bold">{t('student.ledger_total')}</th>
                    <th className="px-3 py-2 text-center">{t('student.ledger_grade_rank')}</th>
                    <th className="px-3 py-2 text-center">{t('student.ledger_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {student.history.map((h, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-1.5 font-bold text-gray-700">{h.period}</td>
                        {subjects.slice(0, 6).map(sub => (
                          <td key={sub} className={`px-2 py-1.5 text-center ${getSubjectCellStyle(h.period, sub, student.name)}`}>{h.scores[sub]}</td>
                        ))}
                        <td className="px-3 py-1.5 text-center font-black text-indigo-600">{h.totalScore}</td>
                        <td className="px-3 py-1.5 text-center font-bold text-purple-600">#{allHistoricalRanks[h.period]?.[student.name] || '-'}</td>
                        <td className="px-3 py-1.5 text-center text-gray-500">{getStatusLabel(h.period, student.name, student)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Page Footer for Print */}
            <div className="hidden print:block mt-auto text-center text-[8px] text-gray-400 pt-4">
              {student.name} - Individual Performance Report - Generated by EduAnalytics
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PersonalReport;
