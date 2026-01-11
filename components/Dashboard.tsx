
import React, { useState, useMemo } from 'react';
import { Users, Layers, Target, Award, History, Crown, Calculator, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import { AnalysisState } from '../types';
import { StatCard, TabButton } from './SharedComponents';
import * as AnalysisEngine from '../utils/analysisUtils';

// View Imports
import SchoolView from './SchoolView';
import ClassComparisonView from './ClassComparisonView';
import EliteBenchmarksView from './EliteBenchmarksView';
import ExamParametersView from './ExamParametersView';
import StudentDetailView from './StudentDetailView';
import SubjectAnalysisView from './SubjectAnalysisView';
import ProgressAnalysisView from './ProgressAnalysisView';

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const Dashboard: React.FC<{ data: AnalysisState }> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'school' | 'comparison' | 'kings' | 'subjectAnalysis' | 'parameters' | 'student' | 'progress'>('school');
  
  const allPeriods = useMemo(() => 
    data.students[0]?.history.map(h => h.period) || [], 
    [data.students]
  );

  const [selectedPeriod, setSelectedPeriod] = useState<string>(allPeriods[allPeriods.length - 1] || '');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([data.classes[0]]);
  const [benchmarkClass, setBenchmarkClass] = useState(data.classes[0]);
  const [selectedStudentId, setSelectedStudentId] = useState(data.students[0]?.id);
  
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');

  const [thresholdType, setThresholdType] = useState<'rank' | 'percent'>('rank');
  const [manualThresholds, setManualThresholds] = useState<Record<string, number>>({
    '清北': 5, 'C9': 30, '高分数': 100, '名校': 300, '特控': 600,
  });

  const admissionLabels = [
    { key: '清北', color: '#be123c' },
    { key: 'C9', color: '#1e40af' },
    { key: '高分数', color: '#0369a1' },
    { key: '名校', color: '#0d9488' },
    { key: '特控', color: '#10b981' },
  ];

  const allHistoricalRanks = useMemo(() => 
    AnalysisEngine.calculateHistoricalRanks(data.students), 
    [data.students]
  );

  const allSubjectRanks = useMemo(() => 
    AnalysisEngine.calculateSubjectHistoricalRanks(data.students, data.subjects),
    [data.students, data.subjects]
  );

  const gradeAveragesByPeriod = useMemo(() => 
    AnalysisEngine.calculateGradeAverages(data.students), 
    [data.students]
  );

  const periodData = useMemo(() => 
    AnalysisEngine.getPeriodSnapshot(data.students, selectedPeriod, allHistoricalRanks),
    [data.students, selectedPeriod, allHistoricalRanks]
  );

  // Added missing data calculations for comparison and kings views to fix compilation errors
  const classComparisonData = useMemo(() => {
    return data.subjects.map(sub => {
      const row: any = { name: sub };
      data.classes.forEach(cls => {
        const clsStudents = periodData.filter(s => s.class === cls);
        const avg = clsStudents.length > 0 
          ? clsStudents.reduce((acc, s) => acc + (s.currentScores[sub] || 0), 0) / clsStudents.length 
          : 0;
        row[cls] = parseFloat(avg.toFixed(2));
      });
      return row;
    });
  }, [data.subjects, data.classes, periodData]);

  const rankingDistributionData = useMemo(() => {
    const brackets = [
      { name: 'Top 10', limit: 10 },
      { name: 'Top 50', limit: 50 },
      { name: 'Top 100', limit: 100 },
      { name: 'Top 300', limit: 300 }
    ];
    return brackets.map(b => {
      const row: any = { name: b.name };
      data.classes.forEach(cls => {
        row[cls] = periodData.filter(s => s.class === cls && s.periodSchoolRank <= b.limit).length;
      });
      return row;
    });
  }, [data.classes, periodData]);

  const kingsData = useMemo(() => {
    return data.subjects.map(sub => {
      const classStudents = periodData.filter(s => s.class === benchmarkClass);
      const classMax = classStudents.length > 0 ? Math.max(...classStudents.map(s => s.currentScores[sub] || 0)) : 0;
      const gradeMax = periodData.length > 0 ? Math.max(...periodData.map(s => s.currentScores[sub] || 0)) : 0;
      return { subject: sub, classMax, gradeMax };
    });
  }, [data.subjects, periodData, benchmarkClass]);

  const duelData = useMemo(() => {
    return data.subjects.map(sub => {
      const classStudents = periodData.filter(s => s.class === benchmarkClass);
      const classMax = classStudents.length > 0 ? Math.max(...classStudents.map(s => s.currentScores[sub] || 0)) : 0;
      const schoolFirst = periodData.length > 0 ? Math.max(...periodData.map(s => s.currentScores[sub] || 0)) : 0;
      return { subject: sub, classFirst: classMax, schoolFirst };
    });
  }, [data.subjects, periodData, benchmarkClass]);

  const hasImportedStatus = useMemo(() => 
    periodData.some(s => s.currentStatus !== undefined && s.currentStatus !== ''),
    [periodData]
  );

  // 获取总分基数用于阈值推算
  const totalCohortSize = useMemo(() => 
    AnalysisEngine.getEffectiveCohortSize(selectedPeriod, null, periodData, {}, allHistoricalRanks),
    [selectedPeriod, periodData, allHistoricalRanks]
  );

  const thresholds = useMemo(() => {
    if (hasImportedStatus) {
      return AnalysisEngine.deriveThresholdsFromMetadata(periodData, admissionLabels, totalCohortSize);
    }
    return manualThresholds;
  }, [hasImportedStatus, periodData, totalCohortSize, manualThresholds]);

  const effectiveThresholdType = hasImportedStatus ? 'percent' : thresholdType;

  const examParameters = useMemo(() => 
    AnalysisEngine.calculateExamParameters(periodData, data.subjects),
    [periodData, data.subjects]
  );

  const aboveLineCount = useMemo(() => {
    if (hasImportedStatus) {
      const validLabels = ['清北', 'C9', '高分', '名校', '特控', '上线', '一本', '本科'];
      return periodData.filter(s => {
        const status = s.currentStatus || '';
        return status !== '' && status !== '未上线' && validLabels.some(label => status.includes(label));
      }).length;
    }

    const limit = effectiveThresholdType === 'rank' 
      ? (thresholds['特控'] || 0) 
      : Math.round(((thresholds['特控'] || 0) / 100) * totalCohortSize);
    return periodData.filter(s => s.periodSchoolRank <= limit).length;
  }, [periodData, thresholds, effectiveThresholdType, hasImportedStatus, totalCohortSize]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} title="Students in File" value={data.students.length.toString()} subtitle="Current Sample" />
        <StatCard icon={<Layers className="w-5 h-5 text-green-600" />} title="Classes" value={data.classes.length.toString()} subtitle="Active Groups" />
        <StatCard icon={<Target className="w-5 h-5 text-purple-600" />} title="上线人数" value={aboveLineCount.toString()} subtitle={`Based on ${selectedPeriod}`} />
        <StatCard icon={<Award className="w-5 h-5 text-orange-600" />} title="Grade Size (Est)" value={totalCohortSize.toString()} subtitle="Computed Cohort Size" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
          <TabButton active={activeTab === 'school'} onClick={() => setActiveTab('school')} icon={<History className="w-4 h-4"/>} label="School View" />
          <TabButton active={activeTab === 'comparison'} onClick={() => setActiveTab('comparison')} icon={<Layers className="w-4 h-4"/>} label="Class Comparison" />
          <TabButton active={activeTab === 'kings'} onClick={() => setActiveTab('kings')} icon={<Crown className="w-4 h-4"/>} label="Elite Benchmarks" />
          <TabButton active={activeTab === 'parameters'} onClick={() => setActiveTab('parameters')} icon={<Calculator className="w-4 h-4"/>} label="Exam Parameters" />
          <TabButton active={activeTab === 'subjectAnalysis'} onClick={() => setActiveTab('subjectAnalysis')} icon={<BarChart3 className="w-4 h-4"/>} label="Subject Analysis" />
          <TabButton active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} icon={<TrendingUp className="w-4 h-4"/>} label="Progress Analysis" />
          <TabButton active={activeTab === 'student'} onClick={() => setActiveTab('student')} icon={<Target className="w-4 h-4"/>} label="Student Detail" />
        </div>
        <div className="flex items-center gap-3 bg-blue-50/50 px-4 py-2 rounded-2xl border border-blue-100 animate-in slide-in-from-right-4">
          <Calendar className="w-4 h-4 text-blue-600" />
          <select className="bg-transparent border-none text-sm font-black text-blue-900 focus:ring-0 cursor-pointer" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
            {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="w-full">
        {activeTab === 'school' && (
          <SchoolView 
            selectedPeriod={selectedPeriod} 
            periodData={periodData} 
            subjects={data.subjects} 
            thresholds={thresholds} 
            setThresholds={setManualThresholds} 
            thresholdType={effectiveThresholdType} 
            setThresholdType={setThresholdType} 
            hasImportedStatus={hasImportedStatus} 
            totalStudents={totalCohortSize}
            allHistoricalRanks={allHistoricalRanks}
          />
        )}
        {activeTab === 'comparison' && <ClassComparisonView selectedPeriod={selectedPeriod} classes={data.classes} selectedClasses={selectedClasses} setSelectedClasses={setSelectedClasses} classComparisonData={classComparisonData} rankingDistributionData={rankingDistributionData} colors={colors} periodData={periodData} />}
        {activeTab === 'kings' && <EliteBenchmarksView selectedPeriod={selectedPeriod} classes={data.classes} benchmarkClass={benchmarkClass} setBenchmarkClass={setBenchmarkClass} kingsData={kingsData} duelData={duelData} />}
        {activeTab === 'parameters' && <ExamParametersView selectedPeriod={selectedPeriod} examParameters={examParameters} colors={colors} totalParticipants={periodData.length} />}
        {activeTab === 'subjectAnalysis' && (
          <SubjectAnalysisView 
            selectedPeriod={selectedPeriod}
            periodData={periodData}
            subjects={data.subjects}
            classes={data.classes}
            allSubjectRanks={allSubjectRanks}
            allHistoricalRanks={allHistoricalRanks}
            thresholds={thresholds}
            thresholdType={effectiveThresholdType}
          />
        )}
        {activeTab === 'progress' && <ProgressAnalysisView students={data.students} allPeriods={allPeriods} allHistoricalRanks={allHistoricalRanks} classes={data.classes} />}
        {activeTab === 'student' && (
          <StudentDetailView 
            studentSearchTerm={studentSearchTerm} setStudentSearchTerm={setStudentSearchTerm} 
            classFilter={classFilter} setClassFilter={setClassFilter} classes={data.classes} 
            selectableStudents={data.students.filter(s => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) && (classFilter === 'all' || s.class === classFilter))} 
            selectedStudentId={selectedStudentId} setSelectedStudentId={setSelectedStudentId} 
            selectedStudent={data.students.find(s => s.id === selectedStudentId)} 
            subjects={data.subjects} gradeAveragesByPeriod={gradeAveragesByPeriod} 
            allHistoricalRanks={allHistoricalRanks}
            allSubjectRanks={allSubjectRanks}
            thresholds={thresholds}
            thresholdType={effectiveThresholdType}
            totalStudents={totalCohortSize}
            selectedPeriod={selectedPeriod}
            periodData={periodData}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
