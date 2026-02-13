
import React, { useState, useMemo, useEffect } from 'react';
import { AnalysisState } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { useExportData } from './Export/useExportData';
import ExportSidebar, { ExportTab } from './Export/ExportSidebar';
import ReportShell from './Export/ReportShell';
import OverallReport from './Export/OverallReport';
import PersonalReport from './Export/PersonalReport';
import TableReport from './Export/TableReport';

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

  // --- TABLE REPORT STATES ---
  const [tableOptions, setTableOptions] = useState({
    rawScore: true,
    ranks: true,
    stats: true
  });

  // --- Logic Hook ---
  const {
    allHistoricalRanks,
    allSubjectRanks,
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
    getSubjectCellStyle
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
        tableOptions={tableOptions}
        setTableOptions={setTableOptions}
        handlePrint={handlePrint}
      />

      <ReportShell
        title={exportTab === 'overall' ? t('export.tab_overall') : exportTab === 'personal' ? t('export.tab_personal') : t('export.tab_tables')}
        subtitle={selectedPeriod}
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
            tableOptions={tableOptions}
            periodData={periodData}
            subjects={data.subjects}
            selectedPeriod={selectedPeriod}
            allSubjectRanks={allSubjectRanks}
          />
        )}
      </ReportShell>
    </div>
  );
};

export default ExportView;
