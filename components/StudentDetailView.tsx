
import React, { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Filter, GraduationCap, TrendingUp, TrendingDown, Table as TableIcon, Flame } from 'lucide-react';
import { StudentRecord } from '../types';
import { ChartContainer, SearchInput, SelectInput } from './SharedComponents';
import * as AnalysisEngine from '../utils/analysisUtils';

interface StudentDetailViewProps {
  studentSearchTerm: string;
  setStudentSearchTerm: (s: string) => void;
  classFilter: string;
  setClassFilter: (c: string) => void;
  classes: string[];
  selectableStudents: StudentRecord[];
  selectedStudentId: string | undefined;
  setSelectedStudentId: (id: string) => void;
  selectedStudent: StudentRecord | undefined;
  subjects: string[];
  gradeAveragesByPeriod: Record<string, number>;
  allHistoricalRanks: Record<string, Record<string, number>>;
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>;
  thresholds: Record<string, number>;
  thresholdType: 'rank' | 'percent';
  totalStudents: number;
  selectedPeriod: string;
  periodData: any[];
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ 
  studentSearchTerm, setStudentSearchTerm, classFilter, setClassFilter, classes, selectableStudents, selectedStudentId, setSelectedStudentId, selectedStudent, subjects, gradeAveragesByPeriod, allHistoricalRanks, allSubjectRanks, thresholds, thresholdType, totalStudents, selectedPeriod, periodData
}) => {
  const [radarBaseline, setRadarBaseline] = useState<'class' | 'grade'>('class');
  const [selectedSubjectForTrend, setSelectedSubjectForTrend] = useState<string>(subjects[0] || '');

  const chartData = useMemo(() => {
    if (!selectedStudent) return [];
    return selectedStudent.history.map(h => ({
      ...h,
      gradeAvgTotal: gradeAveragesByPeriod[h.period] || 0,
      schoolRank: allHistoricalRanks[h.period]?.[selectedStudent.name] || null
    }));
  }, [selectedStudent, gradeAveragesByPeriod, allHistoricalRanks]);

  const historyMeanTotal = useMemo(() => {
    if (!selectedStudent || selectedStudent.history.length === 0) return 0;
    return selectedStudent.history.reduce((acc, h) => acc + h.totalScore, 0) / selectedStudent.history.length;
  }, [selectedStudent]);

  const streakInfo = useMemo(() => 
    selectedStudent ? AnalysisEngine.calculateStreakInfo(selectedStudent, allHistoricalRanks) : null,
    [selectedStudent, allHistoricalRanks]
  );

  const radarData = useMemo(() => {
    if (!selectedStudent || !selectedPeriod) return [];
    return AnalysisEngine.getStudentRadarData(selectedStudent, selectedPeriod, subjects, radarBaseline, periodData);
  }, [selectedStudent, selectedPeriod, subjects, radarBaseline, periodData]);

  const subjectTrendData = useMemo(() => {
    if (!selectedStudent || !selectedSubjectForTrend) return [];
    return AnalysisEngine.getStudentSubjectTrend(selectedStudent, selectedSubjectForTrend, allSubjectRanks);
  }, [selectedStudent, selectedSubjectForTrend, allSubjectRanks]);

  const getStatusLabel = useCallback((period: string, studentName: string) => {
    const rank = allHistoricalRanks[period]?.[studentName];
    if (!rank) return '-';
    const snapshot = selectedStudent?.history.find(h => h.period === period);
    return AnalysisEngine.getAdmissionCategory(rank, thresholds, thresholdType, totalStudents, snapshot?.status);
  }, [allHistoricalRanks, thresholds, thresholdType, totalStudents, selectedStudent]);

  const getSubjectCellStyle = useCallback((period: string, subject: string, studentName: string) => {
    // Explicitly define subRanksForPeriod type as Record<string, number> to prevent unknown inference
    const subRanksForPeriod: Record<string, number> = allSubjectRanks[period]?.[subject] || {};
    const rank = subRanksForPeriod[studentName];
    if (!rank) return 'text-gray-400';

    // 关键修正：对于 Historical Ledger，我们需要基于该科目在该时期的最大名次计算有效人数
    // 这样才能在 Partial Dataset 模式下正确应用基于元数据推算的百分比阈值
    // Added explicit type casting for Object.values result to resolve "unknown" spread in Math.max
    const maxSubRankInPeriod = Math.max(...(Object.values(subRanksForPeriod) as number[]), 0);
    const subjectParticipants = maxSubRankInPeriod || totalStudents;
    
    const category = AnalysisEngine.getSubjectRankCategory(rank, thresholds, thresholdType, subjectParticipants);
    
    const styles: Record<string, string> = {
      'king': 'bg-purple-100 text-purple-900 border-purple-200 font-bold border-b-2',
      'elite': 'bg-green-100 text-green-900 border-green-200 font-bold border-b-2',
      'high': 'bg-blue-100 text-blue-900 border-blue-200 font-bold border-b-2',
      'standard': 'text-gray-600',
      'pass': 'bg-yellow-100 text-yellow-900 border-yellow-200 font-bold border-b-2',
      'fail': 'bg-red-50 text-red-700 border-red-100 font-bold border-b-2'
    };
    return styles[category] || styles['standard'];
  }, [allSubjectRanks, thresholds, thresholdType, totalStudents]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchInput 
             className="flex-1"
             placeholder="Search for a student name..."
             value={studentSearchTerm}
             onChange={setStudentSearchTerm}
          />
          <SelectInput 
            icon={Filter}
            value={classFilter} 
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </SelectInput>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
          {selectableStudents.map(s => (
            <button
              key={s.id} onClick={() => setSelectedStudentId(s.id)}
              className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                selectedStudentId === s.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-100 hover:border-blue-300 text-gray-700'
              }`}
            >
              <span className="font-bold truncate">{s.name}</span>
              <span className={`text-[10px] opacity-70 ${selectedStudentId === s.id ? 'text-blue-100' : 'text-gray-400'}`}>{s.class}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedStudent ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-2xl shadow-xl text-white">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] opacity-70 uppercase font-black tracking-widest">Latest Rank</p>
                    <p className="text-4xl font-black">#{allHistoricalRanks[selectedStudent.history[selectedStudent.history.length-1].period]?.[selectedStudent.name] || 'N/A'}</p>
                  </div>
                </div>
                <h4 className="text-2xl font-black mb-1">{selectedStudent.name}</h4>
                <p className="text-sm opacity-80 mb-6">{selectedStudent.class} • Academic Performer</p>
                <div className="space-y-4 pt-6 border-t border-white/10">
                   <div className="flex justify-between items-center"><span className="text-xs opacity-60 uppercase">Average Total Score</span><span className="text-xl font-bold">{historyMeanTotal.toFixed(1)}</span></div>
                   <div className="flex justify-between items-center"><span className="text-xs opacity-60 uppercase">Improvement (Total)</span><span className="text-xl font-bold flex items-center gap-1">{selectedStudent.history.length > 1 ? (((selectedStudent.history[selectedStudent.history.length-1].totalScore - selectedStudent.history[0].totalScore) / selectedStudent.history[0].totalScore * 100).toFixed(1) + '%') : 'N/A'}<TrendingUp className="w-4 h-4" /></span></div>
                </div>
              </div>

              {streakInfo && streakInfo.count > 0 && (
                <div className={`p-6 rounded-2xl border shadow-sm transition-all animate-in slide-in-from-left-4 ${streakInfo.type === 'improvement' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl ${streakInfo.type === 'improvement' ? 'bg-emerald-500' : 'bg-rose-500'}`}><Flame className="w-5 h-5 text-white" /></div>
                    <div><p className={`text-[10px] font-black uppercase tracking-widest ${streakInfo.type === 'improvement' ? 'text-emerald-600' : 'text-rose-600'}`}>Trend Analysis</p><h4 className={`text-lg font-black ${streakInfo.type === 'improvement' ? 'text-emerald-900' : 'text-rose-900'}`}>连续{streakInfo.type === 'improvement' ? '进步' : '退步'} {streakInfo.count} 次</h4></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end"><span className="text-xs text-gray-500">总位次变动</span><span className={`text-2xl font-black ${streakInfo.type === 'improvement' ? 'text-emerald-600' : 'text-rose-600'}`}>{streakInfo.totalChange > 0 ? `+${streakInfo.totalChange}` : streakInfo.totalChange}</span></div>
                    <div className="flex flex-wrap gap-2">{streakInfo.steps.map((step, idx) => (<div key={idx} className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${streakInfo.type === 'improvement' ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>{streakInfo.type === 'improvement' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{step > 0 ? `+${step}` : step}</div>))}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-8">
              <ChartContainer title="📉 School Ranking Trend (Upwards is Better)">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="period" stroke="#94a3b8" fontSize={12} /><YAxis reversed domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value: number) => [`第 ${value} 名`, 'School Rank']} />
                    <Legend verticalAlign="top" height={36}/><Line type="monotone" dataKey="schoolRank" name="School Rank" stroke="#8b5cf6" strokeWidth={4} dot={{r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
              <ChartContainer title="📈 Performance vs Grade Average Curve">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="period" stroke="#94a3b8" fontSize={12} /><YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value: number) => [value.toFixed(1), '']} />
                    <Legend verticalAlign="top" height={36}/><Line type="monotone" dataKey="totalScore" name="My Total Score" stroke="#3b82f6" strokeWidth={4} dot={{r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 8 }} /><Line type="monotone" dataKey="gradeAvgTotal" name="Grade Avg Total (Ref)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartContainer title={`📊 Subject Competency Radar (${selectedPeriod})`}>
              <div className="absolute top-6 right-8 flex gap-2">
                <button 
                  onClick={() => setRadarBaseline('class')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${radarBaseline === 'class' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                >
                  班级平均
                </button>
                <button 
                  onClick={() => setRadarBaseline('grade')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${radarBaseline === 'grade' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                >
                  年级平均
                </button>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name="My Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} strokeWidth={2} />
                  <Radar name={radarBaseline === 'class' ? 'Class Avg' : 'Grade Avg'} dataKey="baseline" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.3} strokeWidth={1} strokeDasharray="4 4" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title={`📈 ${selectedSubjectForTrend} Historical Rank Trend`}>
              <div className="absolute top-6 right-8">
                <SelectInput 
                  className="py-1 text-[10px]"
                  value={selectedSubjectForTrend}
                  onChange={(e) => setSelectedSubjectForTrend(e.target.value)}
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={subjectTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                  <YAxis reversed domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value: number) => [`第 ${value} 名`, 'Subject Rank']} />
                  <Legend verticalAlign="bottom" height={36} />
                  <Line type="stepAfter" dataKey="rank" name={`${selectedSubjectForTrend} Rank`} stroke="#10b981" strokeWidth={3} dot={{r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><TableIcon className="w-4 h-4" /> Historical Grade Ledger</h3>
                <p className="text-[10px] text-gray-400 mt-1 italic">Note: 学科背景色严格基于导入元数据推算的百分比阈值与该次考试实际参考人数动态匹配。</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white text-gray-400 font-bold border-b border-gray-100">
                    <th className="px-8 py-5">Period</th>
                    {subjects.flatMap(s => [
                      <th key={s} className="px-8 py-5 text-center">{s}</th>,
                      <th key={`${s}-rank`} className="px-4 py-5 text-center text-gray-400 font-medium">{s.substring(0, 1)}名</th>
                    ])}
                    <th className="px-8 py-5 text-indigo-600 text-right">My Total</th>
                    <th className="px-8 py-5 text-blue-600 text-right">Grade Avg</th>
                    <th className="px-8 py-5 text-center text-blue-600">上线</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedStudent.history.map((h, i) => (
                    <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-700">{h.period}</td>
                      {subjects.flatMap(s => [
                        <td key={s} className={`px-8 py-5 text-center transition-all ${getSubjectCellStyle(h.period, s, selectedStudent.name)}`}>
                          {h.scores[s] || '-'}
                        </td>,
                        <td key={`${s}-rank`} className="px-4 py-5 text-center text-gray-500 font-medium">
                          {allSubjectRanks[h.period]?.[s]?.[selectedStudent.name] || '-'}
                        </td>
                      ])}
                      <td className="px-8 py-5 font-black text-indigo-600 text-right">{h.totalScore}</td>
                      <td className="px-8 py-5 font-black text-blue-600 text-right">{gradeAveragesByPeriod[h.period]?.toFixed(1) || '-'}</td>
                      <td className="px-8 py-5 text-center font-bold text-gray-600">
                        {getStatusLabel(h.period, selectedStudent.name)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white py-20 rounded-3xl border border-gray-100 shadow-sm text-center">
          <h3 className="text-xl font-bold text-gray-800">Please select a student above</h3>
        </div>
      )}
    </div>
  );
};

export default StudentDetailView;
