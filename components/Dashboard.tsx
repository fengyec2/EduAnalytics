
import React, { useState, useMemo, useEffect } from 'react';
import { Users, Layers, Target, Award, History, Crown, Calculator, Calendar, BarChart3, TrendingUp, Download } from 'lucide-react';
import { AnalysisState } from '../types';
import { StatCard, TabButton } from './SharedComponents';
import * as AnalysisEngine from '../utils/analysisUtils';
import { useTranslation } from '../context/LanguageContext';

// View Imports
import SchoolView from './SchoolView';
import ClassComparisonView from './ClassComparisonView';
import EliteBenchmarksView from './EliteBenchmarksView';
import ExamParametersView from './ExamParametersView';
import StudentDetailView from './StudentDetailView';
import SubjectAnalysisView from './SubjectAnalysisView';
import ProgressAnalysisView from './ProgressAnalysisView';
import ExportView from './ExportView';

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const Dashboard: React.FC<{ data: AnalysisState; onUpdate: (data: AnalysisState) => void }> = ({ data, onUpdate }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'school' | 'comparison' | 'kings' | 'subjectAnalysis' | 'parameters' | 'student' | 'progress' | 'export'>('school');
  
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

  // 配置状态：优先从持久化数据读取
  const [comparisonThresholds, setComparisonThresholds] = useState<number[]>(
    data.settings?.comparisonThresholds || [50, 100, 200, 250, 400]
  );
  const [thresholdType, setThresholdType] = useState<'rank' | 'percent'>(
    data.settings?.thresholdType || 'rank'
  );
  const [manualThresholds, setManualThresholds] = useState<Record<string, number>>(
    data.settings?.manualThresholds || {
      '清北': 5, 'C9': 30, '高分数': 100, '名校': 300, '特控': 600,
    }
  );

  // 监听配置变化并同步到全局状态
  useEffect(() => {
    const newSettings = {
      manualThresholds,
      comparisonThresholds,
      thresholdType
    };
    
    // 只有当配置确实发生变化时才触发更新，避免死循环
    if (JSON.stringify(data.settings) !== JSON.stringify(newSettings)) {
      onUpdate({
        ...data,
        settings: newSettings
      });
    }
  }, [manualThresholds, comparisonThresholds, thresholdType, data, onUpdate]);

  const allHistoricalRanks = useMemo(() => 
    AnalysisEngine.calculateHistoricalRanks(data.students), 
    [data.students]
  );

  const allClassHistoricalRanks = useMemo(() => 
    AnalysisEngine.calculateClassHistoricalRanks(data.students), 
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

  const hasImportedStatus = useMemo(() => 
    periodData.some(s => s.currentStatus !== undefined && s.currentStatus !== ''),
    [periodData]
  );

  const admissionLabels = [
    { key: '清北', color: '#be123c' },
    { key: 'C9', color: '#1e40af' },
    { key: '高分数', color: '#0369a1' },
    { key: '名校', color: '#0d9488' },
    { key: '特控', color: '#10b981' },
  ];

  const thresholds = useMemo(() => {
    if (hasImportedStatus) {
      return AnalysisEngine.deriveThresholdsFromMetadata(periodData, admissionLabels);
    }
    return manualThresholds;
  }, [hasImportedStatus, periodData, manualThresholds]);

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
    const limit = effectiveThresholdType === 'rank' ? (thresholds['特控'] || 0) : Math.round(((thresholds['特控'] || 0) / 100) * periodData.length);
    return periodData.filter(s => s.periodSchoolRank <= limit).length;
  }, [periodData, thresholds, effectiveThresholdType, hasImportedStatus]);

  const classComparisonData = useMemo(() => data.subjects.map(sub => {
    const entry: any = { name: sub };
    selectedClasses.forEach(cls => {
      const clsStudents = periodData.filter(s => s.class === cls);
      entry[cls] = clsStudents.length > 0 ? parseFloat((clsStudents.reduce((acc, s) => acc + (s.currentScores[sub] || 0), 0) / clsStudents.length).toFixed(2)) : 0;
    });
    return entry;
  }), [periodData, data.subjects, selectedClasses]);

  const rankingDistributionData = useMemo(() => 
    comparisonThresholds.sort((a, b) => a - b).map(bucket => {
      const entry: any = { name: `Top ${bucket}`, limit: bucket };
      selectedClasses.forEach(cls => { 
        entry[cls] = periodData.filter(s => s.class === cls && s.periodSchoolRank <= bucket).length; 
      });
      return entry;
    }), [periodData, selectedClasses, comparisonThresholds]);

  const kingsData = useMemo(() => data.subjects.map(sub => ({
    subject: sub,
    classMax: Math.max(...periodData.filter(s => s.class === benchmarkClass).map(s => s.currentScores[sub] || 0), 0),
    gradeMax: Math.max(...periodData.map(s => s.currentScores[sub] || 0), 0)
  })), [periodData, data.subjects, benchmarkClass]);

  const duelData = useMemo(() => {
    const classFirst = periodData.filter(s => s.class === benchmarkClass).sort((a,b) => b.currentTotal - a.currentTotal)[0];
    const schoolFirst = periodData[0];
    return data.subjects.map(sub => ({ subject: sub, classFirst: classFirst?.currentScores[sub] || 0, schoolFirst: schoolFirst?.currentScores[sub] || 0 }));
  }, [periodData, data.subjects, benchmarkClass]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Dashboard Stats (Visible on screen and report) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print-break-inside-avoid">
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} title={t('stat.total_students')} value={data.students.length.toString()} subtitle="Cohort Size" />
        <StatCard icon={<Layers className="w-5 h-5 text-green-600" />} title={t('stat.classes')} value={data.classes.length.toString()} subtitle="Groups" />
        <StatCard icon={<Target className="w-5 h-5 text-purple-600" />} title={t('stat.above_line')} value={aboveLineCount.toString()} subtitle={selectedPeriod} />
        <StatCard icon={<Award className="w-5 h-5 text-orange-600" />} title={t('stat.best_score')} value={data.schoolStats.max.toString()} subtitle="School Record" />
      </div>

      {/* Navigation and Selectors (Hidden on print) */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between no-print">
        <div className="flex flex-wrap gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
          <TabButton active={activeTab === 'school'} onClick={() => setActiveTab('school')} icon={<History className="w-4 h-4"/>} label={t('tab.school')} />
          <TabButton active={activeTab === 'comparison'} onClick={() => setActiveTab('comparison')} icon={<Layers className="w-4 h-4"/>} label={t('tab.comparison')} />
          <TabButton active={activeTab === 'kings'} onClick={() => setActiveTab('kings')} icon={<Crown className="w-4 h-4"/>} label={t('tab.kings')} />
          <TabButton active={activeTab === 'parameters'} onClick={() => setActiveTab('parameters')} icon={<Calculator className="w-4 h-4"/>} label={t('tab.parameters')} />
          <TabButton active={activeTab === 'subjectAnalysis'} onClick={() => setActiveTab('subjectAnalysis')} icon={<BarChart3 className="w-4 h-4"/>} label={t('tab.subject')} />
          <TabButton active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} icon={<TrendingUp className="w-4 h-4"/>} label={t('tab.progress')} />
          <TabButton active={activeTab === 'student'} onClick={() => setActiveTab('student')} icon={<Target className="w-4 h-4"/>} label={t('tab.student')} />
          <TabButton active={activeTab === 'export'} onClick={() => setActiveTab('export')} icon={<Download className="w-4 h-4"/>} label={t('tab.export')} />
        </div>
        <div className="flex items-center gap-3 bg-blue-50/50 px-4 py-2 rounded-2xl border border-blue-100">
          <Calendar className="w-4 h-4 text-blue-600" />
          <select className="bg-transparent border-none text-sm font-black text-blue-900 focus:ring-0 cursor-pointer" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
            {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Main View Container */}
      <div className="w-full">
        {/* Export Center view specifically handles its own UI */}
        {activeTab === 'export' && (
          <ExportView 
            data={data} 
            selectedPeriod={selectedPeriod} 
            selectedClasses={selectedClasses} 
            allHistoricalRanks={allHistoricalRanks}
            allSubjectRanks={allSubjectRanks}
            examParameters={examParameters}
            classComparisonData={classComparisonData}
            rankingDistributionData={rankingDistributionData}
            kingsData={kingsData}
            duelData={duelData}
          />
        )}

        {/* Regular Tabs (Hidden when printing if activeTab is 'export') */}
        <div className={activeTab === 'export' ? 'no-print' : ''}>
          {activeTab === 'school' && <SchoolView selectedPeriod={selectedPeriod} periodData={periodData} subjects={data.subjects} thresholds={thresholds} setThresholds={setManualThresholds} thresholdType={effectiveThresholdType} setThresholdType={setThresholdType} hasImportedStatus={hasImportedStatus} totalStudents={data.students.length} />}
          {activeTab === 'comparison' && (
            <ClassComparisonView 
              selectedPeriod={selectedPeriod} 
              classes={data.classes} 
              selectedClasses={selectedClasses} 
              setSelectedClasses={setSelectedClasses} 
              classComparisonData={classComparisonData} 
              rankingDistributionData={rankingDistributionData} 
              colors={colors} 
              periodData={periodData} 
              thresholds={comparisonThresholds}
              setThresholds={setComparisonThresholds}
            />
          )}
          {activeTab === 'kings' && <EliteBenchmarksView selectedPeriod={selectedPeriod} classes={data.classes} benchmarkClass={benchmarkClass} setBenchmarkClass={setBenchmarkClass} kingsData={kingsData} duelData={duelData} />}
          {activeTab === 'parameters' && <ExamParametersView selectedPeriod={selectedPeriod} examParameters={examParameters} colors={colors} totalParticipants={periodData.length} />}
          {activeTab === 'subjectAnalysis' && (
            <SubjectAnalysisView 
              selectedPeriod={selectedPeriod}
              periodData={periodData}
              subjects={data.subjects}
              classes={data.classes}
              allSubjectRanks={allSubjectRanks}
              thresholds={thresholds}
              thresholdType={effectiveThresholdType}
              totalStudents={data.students.length}
            />
          )}
          {activeTab === 'progress' && (
            <ProgressAnalysisView 
              students={data.students}
              allPeriods={allPeriods}
              allHistoricalRanks={allHistoricalRanks}
              classes={data.classes}
            />
          )}
          {activeTab === 'student' && (
            <StudentDetailView 
              studentSearchTerm={studentSearchTerm} setStudentSearchTerm={setStudentSearchTerm} 
              classFilter={classFilter} setClassFilter={setClassFilter} classes={data.classes} 
              selectableStudents={data.students.filter(s => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) && (classFilter === 'all' || s.class === classFilter))} 
              selectedStudentId={selectedStudentId} setSelectedStudentId={setSelectedStudentId} 
              selectedStudent={data.students.find(s => s.id === selectedStudentId)} 
              subjects={data.subjects} gradeAveragesByPeriod={gradeAveragesByPeriod} 
              allHistoricalRanks={allHistoricalRanks}
              allClassHistoricalRanks={allClassHistoricalRanks}
              allSubjectRanks={allSubjectRanks}
              thresholds={thresholds}
              thresholdType={effectiveThresholdType}
              totalStudents={data.students.length}
              selectedPeriod={selectedPeriod}
              periodData={periodData}
            />
          )}
        </div>

        {/* PRINT ONLY: Sequential Report Rendering */}
        {/* This block only appears during browser printing when the Export tab is active or specifically triggered */}
        <div className="hidden print:block space-y-12">
           <div className="text-center py-10 border-b-2 border-gray-900 mb-10">
              <h1 className="text-4xl font-black text-gray-900">{t('export.filename_report')}</h1>
              <p className="text-lg text-gray-500 mt-2">{selectedPeriod} • {new Date().toLocaleDateString()}</p>
           </div>
           
           <div className="print-break-inside-avoid">
             <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <History className="w-5 h-5" /> {t('tab.school')}
             </h2>
             <SchoolView selectedPeriod={selectedPeriod} periodData={periodData} subjects={data.subjects} thresholds={thresholds} setThresholds={setManualThresholds} thresholdType={effectiveThresholdType} setThresholdType={setThresholdType} hasImportedStatus={hasImportedStatus} totalStudents={data.students.length} />
           </div>

           <div className="print-break-inside-avoid print-mt-10">
             <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5" /> {t('tab.comparison')}
             </h2>
             <ClassComparisonView 
                selectedPeriod={selectedPeriod} classes={data.classes} selectedClasses={selectedClasses} 
                setSelectedClasses={setSelectedClasses} classComparisonData={classComparisonData} 
                rankingDistributionData={rankingDistributionData} colors={colors} 
                periodData={periodData} thresholds={comparisonThresholds} setThresholds={setComparisonThresholds}
              />
           </div>

           <div className="print-break-inside-avoid print-mt-10">
             <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5" /> {t('tab.parameters')}
             </h2>
             <ExamParametersView selectedPeriod={selectedPeriod} examParameters={examParameters} colors={colors} totalParticipants={periodData.length} />
           </div>
           
           <div className="print-break-inside-avoid print-mt-10">
             <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5" /> {t('tab.kings')}
             </h2>
             <EliteBenchmarksView selectedPeriod={selectedPeriod} classes={data.classes} benchmarkClass={benchmarkClass} setBenchmarkClass={setBenchmarkClass} kingsData={kingsData} duelData={duelData} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
