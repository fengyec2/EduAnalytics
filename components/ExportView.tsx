
import React, { useState, useMemo, useEffect } from 'react';
import { AnalysisState } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { useExportData } from './Export/useExportData';
import ExportSidebar, { ExportTab } from './Export/ExportSidebar';
import ReportShell from './Export/ReportShell';
import OverallReport from './Export/OverallReport';
import PersonalReport from './Export/PersonalReport';
import TableReport from './Export/TableReport';
import * as AnalysisEngine from '../utils/analysisUtils';

interface ExportViewProps {
  data: AnalysisState;
}

const ExportView: React.FC<ExportViewProps> = ({ data }) => {
  const { t } = useTranslation();
  
  // --- Global Settings ---
  const allPeriods = useMemo(() => 
    data.students[0]?.history.map(h => h.period) || [], 
    [data.students]
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>(allPeriods[allPeriods.length - 1] || '');
  const [exportTab, setExportTab] = useState<ExportTab>('overall');

  // --- OVERALL REPORT STATES ---
  const [sections, setSections] = useState({
    overview: true,
    school: true,
    comparison: false,
    kings: false,
    parameters: false,
    subject: false
  });
  const [compClasses, setCompClasses] = useState<string[]>(data.classes);
  const [benchmarkClass, setBenchmarkClass] = useState<string>(data.classes[0] || '');
  const [exportSubjects, setExportSubjects] = useState<string[]>([data.subjects[0] || '']);
  const [subjectClasses, setSubjectClasses] = useState<string[]>(data.classes);

  // --- PERSONAL REPORT STATES ---
  const [indivClass, setIndivClass] = useState<string>(data.classes[0] || '');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // --- TABLE REPORT STATES (Excel Config) ---
  const [excelConfig, setExcelConfig] = useState({
    overview: true,
    school: true,
    comparison: true,
    kings: true,
    subjects: true,
    progress: true,
    raw: true
  });
  
  const [progressParams, setProgressParams] = useState({
    coeffA: allPeriods[Math.max(0, allPeriods.length - 2)] || '',
    coeffB: allPeriods[allPeriods.length - 1] || '',
    streakStart: allPeriods[0] || '',
    streakEnd: allPeriods[allPeriods.length - 1] || ''
  });

  // --- Logic Hook ---
  const {
    allHistoricalRanks,
    allSubjectRanks,
    allClassHistoricalRanks,
    periodData,
    overviewStats,
    schoolStats,
    comparisonData,
    kingsData,
    duelData,
    classFirstStudentName,
    schoolFirstStudentName,
    paramsData,
    subjectAnalysisData,
    getStatusLabel,
    getSubjectCellStyle,
    effectiveThresholds
  } = useExportData({
    data,
    selectedPeriod,
    compClasses,
    benchmarkClass,
    exportSubjects,
    subjectClasses
  });

  // Reset students when class changes
  useEffect(() => {
    setSelectedStudentIds([]);
  }, [indivClass]);

  const toggleSection = (key: keyof typeof sections) => setSections(prev => ({ ...prev, [key]: !prev[key] }));
  const handlePrint = () => window.print();

  // --- Excel Export Logic ---
  const handleExcelExport = () => {
    if (!window.XLSX) return;
    const wb = window.XLSX.utils.book_new();

    // 1. Overview
    if (excelConfig.overview) {
      const wsData = [
        ['Metric', 'Value'],
        ['Total Students', overviewStats.count],
        ['Max Score', overviewStats.maxScore],
        ['Average Score', overviewStats.avgScore.toFixed(2)],
        ['Classes', data.classes.length]
      ];
      const ws = window.XLSX.utils.aoa_to_sheet(wsData);
      window.XLSX.utils.book_append_sheet(wb, ws, "Overview");
    }

    // 2. School Stats
    if (excelConfig.school) {
      const admData = [['Category', 'Count', 'Percentage']];
      schoolStats.admissionDist.forEach((d: any) => admData.push([d.name, d.value, `${((d.value/overviewStats.count)*100).toFixed(1)}%`]));
      const wsAdm = window.XLSX.utils.aoa_to_sheet(admData);
      window.XLSX.utils.book_append_sheet(wb, wsAdm, "Admission Stats");

      const subData = [['Subject', 'Average']];
      schoolStats.subjectAvgs.forEach((d: any) => subData.push([d.name, d.avg]));
      const wsSub = window.XLSX.utils.aoa_to_sheet(subData);
      window.XLSX.utils.book_append_sheet(wb, wsSub, "Subject Averages");
    }

    // 3. Comparison
    if (excelConfig.comparison) {
      const compRows = [['Class', 'Student Count', 'Average Score', `Elite (Top ${comparisonData.eliteThreshold})`, `Bench (Top ${comparisonData.benchThreshold})`]];
      comparisonData.stats.forEach((s: any) => compRows.push([s.className, s.count, s.average, s.eliteCount, s.benchCount]));
      const wsComp = window.XLSX.utils.aoa_to_sheet(compRows);
      window.XLSX.utils.book_append_sheet(wb, wsComp, "Class Comparison");
    }

    // 4. Kings
    if (excelConfig.kings) {
      const kingsRows = [['Subject', 'Class Max', 'Grade Max']];
      kingsData.forEach((k: any) => kingsRows.push([k.subject, k.classMax, k.gradeMax]));
      const wsKings = window.XLSX.utils.aoa_to_sheet(kingsRows);
      window.XLSX.utils.book_append_sheet(wb, wsKings, "Elite Benchmarks");
    }

    // 5. Subjects
    if (excelConfig.subjects) {
      // Export Focus List for selected subjects
      const focusRows = [['Subject', 'Student', 'Class', 'Rank', 'Status']];
      subjectAnalysisData.forEach((sa: any) => {
        sa.focusList.forEach((s: any) => {
          focusRows.push([sa.subject, s.name, s.class, s.rank, 'Below Threshold']);
        });
      });
      const wsFocus = window.XLSX.utils.aoa_to_sheet(focusRows);
      window.XLSX.utils.book_append_sheet(wb, wsFocus, "Subject Focus List");
    }

    // 6. Progress Analysis
    if (excelConfig.progress) {
       // Coefficient
       const coeffData = AnalysisEngine.getProgressAnalysisData(data.students, progressParams.coeffA, progressParams.coeffB, allHistoricalRanks);
       const coeffRows = [['Name', 'Class', `Rank ${progressParams.coeffA}`, `Rank ${progressParams.coeffB}`, 'Coefficient', 'Change']];
       coeffData.forEach((d: any) => coeffRows.push([d.name, d.class, d.rankX, d.rankY, d.coefficient, d.rankChange]));
       const wsCoeff = window.XLSX.utils.aoa_to_sheet(coeffRows);
       window.XLSX.utils.book_append_sheet(wb, wsCoeff, "Progress Coefficient");

       // Streak
       const streakRows = [['Name', 'Class', 'Start Period', 'End Period', 'Streak Count', 'Type', 'Total Change']];
       data.students.forEach(s => {
          const info = AnalysisEngine.calculateRangeStreakInfo(s, allHistoricalRanks, allPeriods, progressParams.streakStart, progressParams.streakEnd);
          streakRows.push([s.name, s.class, progressParams.streakStart, progressParams.streakEnd, info.count, info.type, info.totalChange]);
       });
       const wsStreak = window.XLSX.utils.aoa_to_sheet(streakRows);
       window.XLSX.utils.book_append_sheet(wb, wsStreak, "Progress Streak");
    }

    // 7. Raw Data
    if (excelConfig.raw) {
       const header = ['Name', 'Class', ...data.subjects, 'Total', 'School Rank', 'Status'];
       const rawRows = [header];
       periodData.forEach(s => {
         const row = [
           s.name, 
           s.class, 
           ...data.subjects.map(sub => s.currentScores[sub] || 0), 
           s.currentTotal, 
           s.periodSchoolRank,
           getStatusLabel(selectedPeriod, s.name, s)
         ];
         rawRows.push(row);
       });
       const wsRaw = window.XLSX.utils.aoa_to_sheet(rawRows);
       window.XLSX.utils.book_append_sheet(wb, wsRaw, "Raw Data");
    }

    window.XLSX.writeFile(wb, `Report_${selectedPeriod}.xlsx`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 print:block">
      <ExportSidebar 
        data={data}
        allPeriods={allPeriods}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        exportTab={exportTab}
        setExportTab={setExportTab}
        sections={sections}
        toggleSection={toggleSection}
        compClasses={compClasses}
        setCompClasses={setCompClasses}
        benchmarkClass={benchmarkClass}
        setBenchmarkClass={setBenchmarkClass}
        exportSubjects={exportSubjects}
        setExportSubjects={setExportSubjects}
        subjectClasses={subjectClasses}
        setSubjectClasses={setSubjectClasses}
        indivClass={indivClass}
        setIndivClass={setIndivClass}
        selectedStudentIds={selectedStudentIds}
        setSelectedStudentIds={setSelectedStudentIds}
        studentSearch={studentSearch}
        setStudentSearch={setStudentSearch}
        excelConfig={excelConfig}
        setExcelConfig={setExcelConfig}
        progressParams={progressParams}
        setProgressParams={setProgressParams}
        handleExcelExport={handleExcelExport}
        handlePrint={handlePrint}
      />

      <ReportShell
        title={exportTab === 'overall' ? t('export.tab_overall') : exportTab === 'personal' ? t('export.tab_personal') : t('export.tab_tables')}
        subtitle={selectedPeriod}
        hideHeaderOnPrint={exportTab === 'personal'}
      >
        {exportTab === 'overall' && (
          <OverallReport 
            sections={sections}
            overviewStats={overviewStats}
            schoolStats={schoolStats}
            comparisonData={comparisonData}
            kingsData={kingsData}
            duelData={duelData}
            classFirstStudentName={classFirstStudentName}
            schoolFirstStudentName={schoolFirstStudentName}
            benchmarkClass={benchmarkClass}
            paramsData={paramsData}
            subjectAnalysisData={subjectAnalysisData}
            compClasses={compClasses}
            totalClasses={data.classes.length}
          />
        )}
        
        {exportTab === 'personal' && (
          selectedStudentIds.length > 0 ? (
            <PersonalReport 
              students={data.students}
              selectedStudentIds={selectedStudentIds}
              selectedPeriod={selectedPeriod}
              allHistoricalRanks={allHistoricalRanks}
              allClassHistoricalRanks={allClassHistoricalRanks}
              allSubjectRanks={allSubjectRanks}
              periodData={periodData}
              subjects={data.subjects}
              totalStudents={data.students.length}
              getStatusLabel={getStatusLabel}
              getSubjectCellStyle={getSubjectCellStyle}
            />
          ) : (
            <div className="p-10 text-center text-gray-400 italic border-2 border-dashed rounded-xl">
              Please select students from the sidebar to generate reports.
            </div>
          )
        )}
        
        {exportTab === 'tables' && (
          <TableReport 
            excelConfig={excelConfig}
            periodData={periodData}
          />
        )}
      </ReportShell>
    </div>
  );
};

export default ExportView;
