
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, AreaChart, Area, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  Users, BookOpen, GraduationCap, TrendingUp, ChevronRight, 
  Award, AlertTriangle, Lightbulb, Search, Activity, History,
  Table as TableIcon, Layers, Crown, Target, Filter, Calendar
} from 'lucide-react';
import { AnalysisState, AIInsight, StudentRecord } from '../types';
import { getAIInsights } from '../services/geminiService';

const Dashboard: React.FC<{ data: AnalysisState }> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'school' | 'comparison' | 'kings' | 'student'>('school');
  
  // Available Periods derived from first student's history
  const allPeriods = useMemo(() => {
    if (!data.students[0]) return [];
    return data.students[0].history.map(h => h.period);
  }, [data.students]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(allPeriods[allPeriods.length - 1] || '');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([data.classes[0]]);
  const [benchmarkClass, setBenchmarkClass] = useState(data.classes[0]);
  const [selectedStudentId, setSelectedStudentId] = useState(data.students[0]?.id);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  
  // Student Selector States
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');

  useEffect(() => {
    const fetchAI = async () => {
      setAiLoading(true);
      const insights = await getAIInsights(data);
      setAiInsights(insights);
      setAiLoading(false);
    };
    fetchAI();
  }, [data]);

  const selectedStudent = useMemo(() => 
    data.students.find(s => s.id === selectedStudentId), 
    [data.students, selectedStudentId]
  );

  // --- DYNAMIC DATA COMPUTATION FOR SELECTED PERIOD ---
  
  // Calculate period-specific metrics for all students
  const periodData = useMemo(() => {
    if (!selectedPeriod) return [];
    
    // 1. Extract raw scores for this period
    const snapshot = data.students.map(s => {
      const historyItem = s.history.find(h => h.period === selectedPeriod);
      return {
        ...s,
        currentTotal: historyItem?.totalScore || 0,
        currentAverage: historyItem?.averageScore || 0,
        currentScores: historyItem?.scores || {},
      };
    });

    // 2. Calculate School Ranks for this specific period
    snapshot.sort((a, b) => b.currentTotal - a.currentTotal);
    snapshot.forEach((s, idx) => (s as any).periodSchoolRank = idx + 1);

    // 3. Calculate Class Ranks for this specific period
    data.classes.forEach(cls => {
      const classStudents = snapshot.filter(s => s.class === cls);
      classStudents.sort((a, b) => b.currentTotal - a.currentTotal);
      classStudents.forEach((s, idx) => (s as any).periodClassRank = idx + 1);
    });

    return snapshot as Array<StudentRecord & { 
      currentTotal: number; 
      currentAverage: number; 
      currentScores: Record<string, number>;
      periodSchoolRank: number;
      periodClassRank: number;
    }>;
  }, [data.students, data.classes, selectedPeriod]);

  // School Stats for Selected Period
  const periodSchoolStats = useMemo(() => {
    if (periodData.length === 0) return null;
    
    const dist = [
      { name: 'Excellent (≥90)', value: 0, color: '#10b981' },
      { name: 'Good (80-89)', value: 0, color: '#3b82f6' },
      { name: 'Fair (70-79)', value: 0, color: '#f59e0b' },
      { name: 'Pass (60-69)', value: 0, color: '#6366f1' },
      { name: 'Fail (<60)', value: 0, color: '#ef4444' },
    ];

    periodData.forEach(s => {
      const avg = s.currentAverage;
      if (avg >= 90) dist[0].value++;
      else if (avg >= 80) dist[1].value++;
      else if (avg >= 70) dist[2].value++;
      else if (avg >= 60) dist[3].value++;
      else dist[4].value++;
    });

    const subjectAvgs = data.subjects.map(sub => {
      const avg = periodData.reduce((acc, s) => acc + (s.currentScores[sub] || 0), 0) / periodData.length;
      return { name: sub, avg: parseFloat(avg.toFixed(2)) };
    });

    return { distribution: dist.filter(d => d.value > 0), subjectAvgs };
  }, [periodData, data.subjects]);

  // Class Comparison for Selected Period
  const classComparisonData = useMemo(() => {
    return data.subjects.map(sub => {
      const entry: any = { name: sub };
      selectedClasses.forEach(cls => {
        const clsStudents = periodData.filter(s => s.class === cls);
        const avg = clsStudents.length > 0 ? clsStudents.reduce((acc, s) => acc + (s.currentScores[sub] || 0), 0) / clsStudents.length : 0;
        entry[cls] = parseFloat(avg.toFixed(2));
      });
      return entry;
    });
  }, [periodData, data.subjects, selectedClasses]);

  const rankingBuckets = [10, 20, 50, 100, 200, 400];
  const rankingDistributionData = useMemo(() => {
    return rankingBuckets.map(bucket => {
      const entry: any = { name: `Top ${bucket}` };
      selectedClasses.forEach(cls => {
        const count = periodData.filter(s => s.class === cls && s.periodSchoolRank <= bucket).length;
        entry[cls] = count;
      });
      return entry;
    });
  }, [periodData, selectedClasses]);

  // Kings for Selected Period
  const kingsData = useMemo(() => {
    return data.subjects.map(sub => {
      const classMax = Math.max(...periodData.filter(s => s.class === benchmarkClass).map(s => s.currentScores[sub] || 0), 0);
      const gradeMax = Math.max(...periodData.map(s => s.currentScores[sub] || 0), 0);
      return { subject: sub, classMax, gradeMax };
    });
  }, [periodData, data.subjects, benchmarkClass]);

  const duelData = useMemo(() => {
    const classFirst = periodData.filter(s => s.class === benchmarkClass).sort((a,b) => b.currentTotal - a.currentTotal)[0];
    const schoolFirst = periodData.sort((a,b) => b.currentTotal - a.currentTotal)[0];
    
    return data.subjects.map(sub => ({
      subject: sub,
      classFirst: classFirst?.currentScores[sub] || 0,
      schoolFirst: schoolFirst?.currentScores[sub] || 0
    }));
  }, [periodData, data.subjects, benchmarkClass]);

  // Filtered Students for the Selector
  const selectableStudents = useMemo(() => {
    return data.students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(studentSearchTerm.toLowerCase());
      const matchesClass = classFilter === 'all' || s.class === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [data.students, studentSearchTerm, classFilter]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Overview Stats (Always based on latest, but icons and period selection are key) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} title="Total Students" value={data.students.length.toString()} subtitle="Full Cohort" />
        <StatCard icon={<Layers className="w-5 h-5 text-green-600" />} title="Classes" value={data.classes.length.toString()} subtitle="Groups" />
        <StatCard icon={<Target className="w-5 h-5 text-purple-600" />} title="Pass Rate" value={`${(data.students.filter(s => s.averageScore >= 60).length / data.students.length * 100).toFixed(0)}%`} subtitle="Avg performance" />
        <StatCard icon={<Award className="w-5 h-5 text-orange-600" />} title="Top Score" value={data.schoolStats.max.toString()} subtitle="School Best" />
      </div>

      {/* Global Exam & Navigation Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
          <TabButton active={activeTab === 'school'} onClick={() => setActiveTab('school')} icon={<History className="w-4 h-4"/>} label="School View" />
          <TabButton active={activeTab === 'comparison'} onClick={() => setActiveTab('comparison')} icon={<Layers className="w-4 h-4"/>} label="Class Comparison" />
          <TabButton active={activeTab === 'kings'} onClick={() => setActiveTab('kings')} icon={<Crown className="w-4 h-4"/>} label="Elite Benchmarks" />
          <TabButton active={activeTab === 'student'} onClick={() => setActiveTab('student')} icon={<Target className="w-4 h-4"/>} label="Student Detail" />
        </div>

        {/* Global Period Selector - Not shown in student detail because that has its own historical view */}
        {activeTab !== 'student' && (
          <div className="flex items-center gap-3 bg-blue-50/50 px-4 py-2 rounded-2xl border border-blue-100 animate-in slide-in-from-right-4">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Exam Analysis:</span>
            <select 
              className="bg-transparent border-none text-sm font-black text-blue-900 focus:ring-0 cursor-pointer"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="w-full space-y-8">
        {/* TAB: SCHOOL VIEW */}
        {activeTab === 'school' && periodSchoolStats && (
          <div className="space-y-8">
            <section className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <h2 className="text-lg font-bold text-gray-800">AI Educational Guidance</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className="p-3 bg-white/50 rounded-xl border border-white text-sm">
                    <span className="font-bold text-indigo-600 block mb-1 text-[10px] uppercase tracking-widest">{insight.title}</span>
                    <p className="text-gray-600 leading-snug">{insight.content}</p>
                  </div>
                ))}
              </div>
            </section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartContainer title={`Performance Distribution (${selectedPeriod})`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={periodSchoolStats.distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                      {periodSchoolStats.distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <ChartContainer title={`Subject Performance (${selectedPeriod})`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodSchoolStats.subjectAvgs}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Average Score" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* TAB: CLASS COMPARISON */}
        {activeTab === 'comparison' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Filter className="w-3 h-3" /> Select Classes to Compare ({selectedPeriod})
              </p>
              <div className="flex flex-wrap gap-2">
                {data.classes.map(cls => (
                  <button 
                    key={cls}
                    onClick={() => setSelectedClasses(prev => prev.includes(cls) ? prev.filter(p => p !== cls) : [...prev, cls])}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedClasses.includes(cls) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-300'}`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartContainer title="Subject Averages Comparison">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="top" align="right" />
                    {selectedClasses.map((cls, idx) => (
                      <Bar key={cls} dataKey={cls} fill={colors[idx % colors.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Ranking Distribution (Student Count)">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rankingDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="top" align="right" />
                    {selectedClasses.map((cls, idx) => (
                      <Bar key={cls} dataKey={cls} fill={colors[idx % colors.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* TAB: ELITE BENCHMARKS (KINGS) */}
        {activeTab === 'kings' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Class Benchmarking ({selectedPeriod})</h3>
                <p className="text-xs text-gray-500">Compare class leaders against grade-wide masters.</p>
              </div>
              <select 
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                value={benchmarkClass}
                onChange={(e) => setBenchmarkClass(e.target.value)}
              >
                {data.classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartContainer title={`👑 Class ${benchmarkClass} King vs Grade King`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kingsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                    <YAxis dataKey="subject" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="top" align="center" iconType="diamond" />
                    <Bar dataKey="classMax" name="Class Top" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    <Bar dataKey="gradeMax" name="Grade Top" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="🔍 First-in-Class vs First-in-Grade Duel">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={duelData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="classFirst" name={`#1 in ${benchmarkClass}`} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="schoolFirst" name="#1 in School" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* TAB: STUDENT DETAIL */}
        {activeTab === 'student' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            {/* IN-PAGE STUDENT SELECTOR */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search for a student name..." 
                    value={studentSearchTerm} 
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select 
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    {data.classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                {selectableStudents.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                      selectedStudentId === s.id 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : 'bg-white border-gray-100 hover:border-blue-300 text-gray-700'
                    }`}
                  >
                    <span className="font-bold truncate">{s.name}</span>
                    <span className={`text-[10px] opacity-70 ${selectedStudentId === s.id ? 'text-blue-100' : 'text-gray-400'}`}>{s.class}</span>
                  </button>
                ))}
                {selectableStudents.length === 0 && (
                  <div className="col-span-full py-8 text-center text-gray-400 italic text-sm">No students match your search.</div>
                )}
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
                          <p className="text-[10px] opacity-70 uppercase font-black tracking-widest">School Rank</p>
                          <p className="text-4xl font-black">#{selectedStudent.rankInSchool}</p>
                        </div>
                      </div>
                      <h4 className="text-2xl font-black mb-1">{selectedStudent.name}</h4>
                      <p className="text-sm opacity-80 mb-6">{selectedStudent.class} • Academic Performer</p>
                      
                      <div className="space-y-4 pt-6 border-t border-white/10">
                         <div className="flex justify-between items-center">
                           <span className="text-xs opacity-60 uppercase">Average Score</span>
                           <span className="text-xl font-bold">{selectedStudent.averageScore.toFixed(1)}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-xs opacity-60 uppercase">Improvement (Total)</span>
                           <span className="text-xl font-bold flex items-center gap-1">
                             {selectedStudent.history.length > 1 
                               ? (((selectedStudent.history[selectedStudent.history.length-1].totalScore - selectedStudent.history[0].totalScore) / selectedStudent.history[0].totalScore * 100).toFixed(1) + '%')
                               : 'N/A'
                             }
                             <TrendingUp className="w-4 h-4" />
                           </span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-xs opacity-60 uppercase">Class Rank</span>
                           <span className="text-xl font-bold">#{selectedStudent.rankInClass}</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                    <ChartContainer title="📈 Performance Total Score Curve">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedStudent.history}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                          <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                          <Legend verticalAlign="top" height={36}/>
                          <Line type="monotone" dataKey="totalScore" name="Total Score" stroke="#3b82f6" strokeWidth={4} dot={{r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="averageScore" name="Avg Score (Ref)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <TableIcon className="w-4 h-4" /> Historical Grade Ledger
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-white text-gray-400 font-bold border-b border-gray-100">
                          <th className="px-8 py-5">Period</th>
                          {data.subjects.map(s => <th key={s} className="px-8 py-5">{s}</th>)}
                          <th className="px-8 py-5 text-indigo-600">Total</th>
                          <th className="px-8 py-5 text-blue-600">Average</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedStudent.history.map((h, i) => (
                          <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-8 py-5 font-bold text-gray-700">{h.period}</td>
                            {data.subjects.map(s => (
                              <td key={s} className="px-8 py-5 text-gray-600">{h.scores[s] || '-'}</td>
                            ))}
                            <td className="px-8 py-5 font-black text-indigo-600">{h.totalScore}</td>
                            <td className="px-8 py-5 font-black text-blue-600">{h.averageScore.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white py-20 rounded-3xl border border-gray-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Please select a student above</h3>
                <p className="text-gray-400 max-w-xs mx-auto mt-2">Pick a student from the filter to view their personalized academic insights.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; subtitle: string }> = ({ icon, title, value, subtitle }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 transition-all hover:shadow-md">
    <div className="p-3 rounded-xl bg-gray-50">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 leading-none">{value}</h3>
      <p className="text-[10px] text-gray-400 mt-1 font-medium">{subtitle}</p>
    </div>
  </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
      active ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'
    }`}
  >
    {icon} {label}
  </button>
);

const ChartContainer: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative transition-all hover:border-blue-100 ${className}`}>
    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {title}
    </h3>
    <div className="h-[300px]">
      {children}
    </div>
  </div>
);

export default Dashboard;
