
import React, { useState, useEffect, useMemo } from 'react';
import { Users, Layers, Target, Award, History, Crown, Calculator, Calendar } from 'lucide-react';
import { AnalysisState, AIInsight, StudentRecord } from '../types';
import { getAIInsights } from '../services/geminiService';
import { StatCard, TabButton } from './SharedComponents';

// View Imports
import SchoolView from './SchoolView';
import ClassComparisonView from './ClassComparisonView';
import EliteBenchmarksView from './EliteBenchmarksView';
import ExamParametersView from './ExamParametersView';
import StudentDetailView from './StudentDetailView';

const Dashboard: React.FC<{ data: AnalysisState }> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'school' | 'comparison' | 'kings' | 'student' | 'parameters'>('school');
  
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

  const periodData = useMemo(() => {
    if (!selectedPeriod) return [];
    const snapshot = data.students.map(s => {
      const historyItem = s.history.find(h => h.period === selectedPeriod);
      return {
        ...s,
        currentTotal: historyItem?.totalScore || 0,
        currentAverage: historyItem?.averageScore || 0,
        currentScores: historyItem?.scores || {},
      };
    });
    snapshot.sort((a, b) => b.currentTotal - a.currentTotal);
    snapshot.forEach((s, idx) => (s as any).periodSchoolRank = idx + 1);
    data.classes.forEach(cls => {
      const classStudents = snapshot.filter(s => s.class === cls);
      classStudents.sort((a, b) => b.currentTotal - a.currentTotal);
      classStudents.forEach((s, idx) => (s as any).periodClassRank = idx + 1);
    });
    return snapshot as any[];
  }, [data.students, data.classes, selectedPeriod]);

  // 计算“特控上线人数”：即排名在 600 名以内的学生总数（与 SchoolView 默认阈值同步）
  const aboveLineCount = useMemo(() => {
    const threshold = 600;
    return periodData.filter(s => s.periodSchoolRank <= threshold).length;
  }, [periodData]);

  // Calculations for sub-views passed as props
  const examParameters = useMemo(() => {
    if (periodData.length === 0) return null;
    const subjects = data.subjects;
    const n = periodData.length;
    const stats: any[] = [];
    subjects.forEach(sub => {
      const scores = periodData.map(s => s.currentScores[sub] || 0).sort((a, b) => a - b);
      const sum = scores.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      const max = scores[n - 1];
      let fullScore = max > 120 ? (max > 150 ? Math.ceil(max / 10) * 10 : 150) : (max > 100 ? 120 : 100);
      const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      const median = n % 2 === 0 ? (scores[n/2 - 1] + scores[n/2]) / 2 : scores[Math.floor(n/2)];
      const counts: Record<number, number> = {};
      scores.forEach(s => counts[s] = (counts[s] || 0) + 1);
      let mode = scores[0];
      let maxCount = 0;
      Object.entries(counts).forEach(([val, count]) => { if (count > maxCount) { maxCount = count; mode = Number(val); } });
      const difficulty = mean / fullScore;
      const splitIdx = Math.round(n * 0.27);
      const top27 = scores.slice(n - splitIdx);
      const bottom27 = scores.slice(0, splitIdx);
      const meanTop = top27.length > 0 ? top27.reduce((a, b) => a + b, 0) / top27.length : 0;
      const meanBottom = bottom27.length > 0 ? bottom27.reduce((a, b) => a + b, 0) / bottom27.length : 0;
      const discrimination = (meanTop - meanBottom) / fullScore;
      stats.push({ subject: sub, participants: n, max, mean: parseFloat(mean.toFixed(2)), stdDev: parseFloat(stdDev.toFixed(2)), mode, median, difficulty: parseFloat(difficulty.toFixed(2)), discrimination: parseFloat(discrimination.toFixed(2)), variance });
    });
    const k = subjects.length;
    const sumVarItems = stats.reduce((acc, s) => acc + s.variance, 0);
    const totalScores = periodData.map(s => s.currentTotal);
    const meanTotal = totalScores.reduce((a, b) => a + b, 0) / n;
    const varTotal = totalScores.reduce((a, b) => a + Math.pow(b - meanTotal, 2), 0) / n;
    const reliability = k > 1 ? (k / (k - 1)) * (1 - (sumVarItems / varTotal)) : 1;
    return { subjectStats: stats, reliability: parseFloat(reliability.toFixed(2)) };
  }, [periodData, data.subjects]);

  const classComparisonData = useMemo(() => data.subjects.map(sub => {
    const entry: any = { name: sub };
    selectedClasses.forEach(cls => {
      const clsStudents = periodData.filter(s => s.class === cls);
      entry[cls] = clsStudents.length > 0 ? parseFloat((clsStudents.reduce((acc, s) => acc + (s.currentScores[sub] || 0), 0) / clsStudents.length).toFixed(2)) : 0;
    });
    return entry;
  }), [periodData, data.subjects, selectedClasses]);

  const rankingDistributionData = useMemo(() => [10, 20, 50, 100, 200, 400].map(bucket => {
    const entry: any = { name: `Top ${bucket}` };
    selectedClasses.forEach(cls => { entry[cls] = periodData.filter(s => s.class === cls && s.periodSchoolRank <= bucket).length; });
    return entry;
  }), [periodData, selectedClasses]);

  const kingsData = useMemo(() => data.subjects.map(sub => ({
    subject: sub,
    classMax: Math.max(...periodData.filter(s => s.class === benchmarkClass).map(s => s.currentScores[sub] || 0), 0),
    gradeMax: Math.max(...periodData.map(s => s.currentScores[sub] || 0), 0)
  })), [periodData, data.subjects, benchmarkClass]);

  const duelData = useMemo(() => {
    const classFirst = periodData.filter(s => s.class === benchmarkClass).sort((a,b) => b.currentTotal - a.currentTotal)[0];
    const schoolFirst = periodData.sort((a,b) => b.currentTotal - a.currentTotal)[0];
    return data.subjects.map(sub => ({ subject: sub, classFirst: classFirst?.currentScores[sub] || 0, schoolFirst: schoolFirst?.currentScores[sub] || 0 }));
  }, [periodData, data.subjects, benchmarkClass]);

  const selectableStudents = useMemo(() => data.students.filter(s => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) && (classFilter === 'all' || s.class === classFilter)), [data.students, studentSearchTerm, classFilter]);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} title="Total Students" value={data.students.length.toString()} subtitle="Cohort Size" />
        <StatCard icon={<Layers className="w-5 h-5 text-green-600" />} title="Classes" value={data.classes.length.toString()} subtitle="Active Groups" />
        <StatCard icon={<Target className="w-5 h-5 text-purple-600" />} title="特控上线人数" value={aboveLineCount.toString()} subtitle={`Based on ${selectedPeriod}`} />
        <StatCard icon={<Award className="w-5 h-5 text-orange-600" />} title="Best Score" value={data.schoolStats.max.toString()} subtitle="School Record" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
          <TabButton active={activeTab === 'school'} onClick={() => setActiveTab('school')} icon={<History className="w-4 h-4"/>} label="School View" />
          <TabButton active={activeTab === 'comparison'} onClick={() => setActiveTab('comparison')} icon={<Layers className="w-4 h-4"/>} label="Class Comparison" />
          <TabButton active={activeTab === 'kings'} onClick={() => setActiveTab('kings')} icon={<Crown className="w-4 h-4"/>} label="Elite Benchmarks" />
          <TabButton active={activeTab === 'parameters'} onClick={() => setActiveTab('parameters')} icon={<Calculator className="w-4 h-4"/>} label="Exam Parameters" />
          <TabButton active={activeTab === 'student'} onClick={() => setActiveTab('student')} icon={<Target className="w-4 h-4"/>} label="Student Detail" />
        </div>
        {activeTab !== 'student' && (
          <div className="flex items-center gap-3 bg-blue-50/50 px-4 py-2 rounded-2xl border border-blue-100 animate-in slide-in-from-right-4">
            <Calendar className="w-4 h-4 text-blue-600" />
            <select className="bg-transparent border-none text-sm font-black text-blue-900 focus:ring-0 cursor-pointer" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
              {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="w-full">
        {activeTab === 'school' && <SchoolView selectedPeriod={selectedPeriod} aiInsights={aiInsights} periodData={periodData} subjects={data.subjects} />}
        {activeTab === 'comparison' && <ClassComparisonView selectedPeriod={selectedPeriod} classes={data.classes} selectedClasses={selectedClasses} setSelectedClasses={setSelectedClasses} classComparisonData={classComparisonData} rankingDistributionData={rankingDistributionData} colors={colors} />}
        {activeTab === 'kings' && <EliteBenchmarksView selectedPeriod={selectedPeriod} classes={data.classes} benchmarkClass={benchmarkClass} setBenchmarkClass={setBenchmarkClass} kingsData={kingsData} duelData={duelData} />}
        {activeTab === 'parameters' && <ExamParametersView selectedPeriod={selectedPeriod} examParameters={examParameters} colors={colors} totalParticipants={periodData.length} />}
        {activeTab === 'student' && <StudentDetailView studentSearchTerm={studentSearchTerm} setStudentSearchTerm={setStudentSearchTerm} classFilter={classFilter} setClassFilter={setClassFilter} classes={data.classes} selectableStudents={selectableStudents} selectedStudentId={selectedStudentId} setSelectedStudentId={setSelectedStudentId} selectedStudent={selectedStudent} subjects={data.subjects} />}
      </div>
    </div>
  );
};

export default Dashboard;
