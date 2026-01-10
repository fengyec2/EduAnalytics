
import React, { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Search, Filter, GraduationCap, TrendingUp, TrendingDown, Table as TableIcon, Flame, BarChart4, History as HistoryIcon, Target } from 'lucide-react';
import { StudentRecord } from '../types';
import { ChartContainer } from './SharedComponents';
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

  // 计算进退步状态
  const streakInfo = useMemo(() => 
    selectedStudent ? AnalysisEngine.calculateStreakInfo(selectedStudent, allHistoricalRanks) : null,
    [selectedStudent, allHistoricalRanks]
  );

  // 雷达图数据计算
  const radarData = useMemo(() => {
    if (!selectedStudent || !selectedPeriod) return [];
    const currentScores = selectedStudent.history.find(h => h.period === selectedPeriod)?.scores || {};
    
    // 计算对比基准（班级或年级平均分）
    const baselineSource = radarBaseline === 'class' 
      ? periodData.filter(s => s.class === selectedStudent.class)
      : periodData;

    return subjects.map(sub => {
      const studentScore = currentScores[sub] || 0;
      const baselineAvg = baselineSource.length > 0
        ? baselineSource.reduce((acc, s) => acc + (s.currentScores?.[sub] || 0), 0) / baselineSource.length
        : 0;

      return {
        subject: sub,
        score: studentScore,
        baseline: parseFloat(baselineAvg.toFixed(1)),
        fullMark: 150 // 假设满分用于比例参考，Recharts Radar会自动缩放
      };
    });
  }, [selectedStudent, selectedPeriod, subjects, radarBaseline, periodData]);

  // 单科历史排名趋势数据
  const subjectTrendData = useMemo(() => {
    if (!selectedStudent || !selectedSubjectForTrend) return [];
    return selectedStudent.history.map(h => ({
      period: h.period,
      rank: allSubjectRanks[h.period]?.[selectedSubjectForTrend]?.[selectedStudent.name] || null
    })).filter(d => d.rank !== null);
  }, [selectedStudent, selectedSubjectForTrend, allSubjectRanks]);

  const getStatusLabel = useCallback((period: string, studentName: string) => {
    const rank = allHistoricalRanks[period]?.[studentName];
    if (!rank) return '-';

    const lines = [
      { key: '清北', label: '清北' },
      { key: 'C9', label: 'C9' },
      { key: '高分数', label: '高分' },
      { key: '名校', label: '名校' },
      { key: '特控', label: '特控' },
    ];

    for (const line of lines) {
      const limit = thresholdType === 'rank' 
        ? thresholds[line.key] 
        : Math.round((thresholds[line.key] / 100) * totalStudents);
      
      if (rank <= limit) return line.label;
    }
    return '未上线';
  }, [allHistoricalRanks, thresholds, thresholdType, totalStudents]);

  const getSubjectCellStyle = useCallback((period: string, subject: string, studentName: string) => {
    const rank = allSubjectRanks[period]?.[subject]?.[studentName];
    if (!rank) return 'text-gray-400';

    const lines = [
      { key: '清北', style: 'bg-purple-100 text-purple-900 border-purple-200 font-bold border-b-2' },
      { key: 'C9', style: 'bg-green-100 text-green-900 border-green-200 font-bold border-b-2' },
      { key: '高分数', style: 'bg-blue-100 text-blue-900 border-blue-200 font-bold border-b-2' },
      { key: '名校', style: 'text-gray-600' }, 
      { key: '特控', style: 'bg-yellow-100 text-yellow-900 border-yellow-200 font-bold border-b-2' },
    ];

    for (const line of lines) {
      const limit = thresholdType === 'rank' 
        ? thresholds[line.key] 
        : Math.round((thresholds[line.key] / 100) * totalStudents);
      
      if (rank <= limit) {
        return line.style;
      }
    }
    return 'bg-red-50 text-red-700 border-red-100 font-bold border-b-2';
  }, [allSubjectRanks, thresholds, thresholdType, totalStudents]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" placeholder="Search for a student name..." value={studentSearchTerm} 
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="all">All Classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
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

          {/* New Dual Chart Area */}
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
                <select 
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedSubjectForTrend}
                  onChange={(e) => setSelectedSubjectForTrend(e.target.value)}
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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
                <p className="text-[10px] text-gray-400 mt-1 italic">Note:学科背景色基于当次全校单科排名计算</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-white text-gray-400 font-bold border-b border-gray-100"><th className="px-8 py-5">Period</th>{subjects.map(s => <th key={s} className="px-8 py-5 text-center">{s}</th>)}<th className="px-8 py-5 text-indigo-600 text-right">My Total</th><th className="px-8 py-5 text-blue-600 text-right">Grade Avg</th><th className="px-8 py-5 text-center text-blue-600">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedStudent.history.map((h, i) => (
                    <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-700">{h.period}</td>
                      {subjects.map(s => (
                        <td key={s} className={`px-8 py-5 text-center transition-all ${getSubjectCellStyle(h.period, s, selectedStudent.name)}`}>
                          {h.scores[s] || '-'}
                        </td>
                      ))}
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
            
            <div className="px-8 py-4 bg-gray-50 flex flex-wrap gap-4 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Legend:</span>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-purple-100 border border-purple-200" /> <span className="text-[10px] text-gray-600">清北线</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-100 border border-green-200" /> <span className="text-[10px] text-gray-600">C9线</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> <span className="text-[10px] text-gray-600">高分线</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border border-gray-300" /> <span className="text-[10px] text-gray-600">名校线</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" /> <span className="text-[10px] text-gray-600">特控线</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-50 border border-red-100" /> <span className="text-[10px] text-gray-600">未上线</span></div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white py-20 rounded-3xl border border-gray-100 shadow-sm text-center"><h3 className="text-xl font-bold text-gray-800">Please select a student above</h3></div>
      )}
    </div>
  );
};

export default StudentDetailView;
