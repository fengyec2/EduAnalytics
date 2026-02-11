
import React, { useState, useMemo } from 'react';
import { AnalysisState } from '../types';
import { SelectInput, FilterChip, StatCard } from './SharedComponents';
import { Calendar, Filter, Printer, FileSpreadsheet, Layers, PieChart as PieIcon, BarChart2, CheckSquare, Square, GraduationCap } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import * as AnalysisEngine from '../utils/analysisUtils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

interface ExportViewProps {
  data: AnalysisState;
}

const ExportView: React.FC<ExportViewProps> = ({ data }) => {
  const { t } = useTranslation();
  const allPeriods = useMemo(() => 
    data.students[0]?.history.map(h => h.period) || [], 
    [data.students]
  );
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>(allPeriods[allPeriods.length - 1] || '');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(data.classes);
  const [includeSections, setIncludeSections] = useState({
    overview: true,
    charts: true,
    matrix: true,
    students: true
  });

  const toggleSection = (key: keyof typeof includeSections) => {
    setIncludeSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(p => p !== cls) : [...prev, cls]
    );
  };

  const toggleAllClasses = () => {
    if (selectedClasses.length === data.classes.length) setSelectedClasses([]);
    else setSelectedClasses([...data.classes]);
  };

  // --- Data Calculations for Report ---

  const allHistoricalRanks = useMemo(() => 
    AnalysisEngine.calculateHistoricalRanks(data.students), 
    [data.students]
  );

  const periodData = useMemo(() => {
    const raw = AnalysisEngine.getPeriodSnapshot(data.students, selectedPeriod, allHistoricalRanks);
    return raw.filter(s => selectedClasses.includes(s.class));
  }, [data.students, selectedPeriod, allHistoricalRanks, selectedClasses]);

  const totalStudents = periodData.length;
  const avgScore = totalStudents > 0 ? periodData.reduce((acc, s) => acc + s.currentTotal, 0) / totalStudents : 0;
  const maxScore = totalStudents > 0 ? Math.max(...periodData.map(s => s.currentTotal)) : 0;
  
  // Admission Stats
  const thresholds = data.settings?.manualThresholds || { '清北': 5, 'C9': 30, '高分数': 100, '名校': 300, '特控': 600 };
  const thresholdType = (data.settings?.thresholdType || 'rank') as 'rank' | 'percent';
  const admissionLabels = [
    { key: '清北', color: '#be123c' },
    { key: 'C9', color: '#1e40af' },
    { key: '高分数', color: '#0369a1' },
    { key: '名校', color: '#0d9488' },
    { key: '特控', color: '#10b981' },
  ];
  
  // Determine if we need to derive thresholds (metadata mode)
  const hasImportedStatus = periodData.some(s => s.currentStatus !== undefined && s.currentStatus !== '');
  const effectiveThresholds = hasImportedStatus 
    ? AnalysisEngine.deriveThresholdsFromMetadata(periodData, admissionLabels)
    : thresholds;
  const effectiveType = hasImportedStatus ? 'percent' : thresholdType;

  const admissionDist = useMemo(() => 
    AnalysisEngine.getAdmissionDistribution(periodData, effectiveThresholds, effectiveType, admissionLabels),
    [periodData, effectiveThresholds, effectiveType]
  );

  // Subject Averages
  const subjectAvgs = useMemo(() => 
    AnalysisEngine.getSubjectAverages(periodData, data.subjects),
    [periodData, data.subjects]
  );

  // Class Matrix Data
  const classStats = useMemo(() => {
    // For print view, use fixed thresholds for "Elite" and "Bench" based on settings or defaults
    const t1 = data.settings?.comparisonThresholds?.[0] || 50;
    const t2 = data.settings?.comparisonThresholds?.[1] || 100;
    return AnalysisEngine.getClassSummaries(periodData, selectedClasses, t1, t2);
  }, [periodData, selectedClasses, data.settings]);

  // Top Students
  const topStudents = useMemo(() => {
    return [...periodData].sort((a, b) => a.periodSchoolRank - b.periodSchoolRank).slice(0, 50);
  }, [periodData]);


  // --- Actions ---

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const wb = (window as any).XLSX.utils.book_new();

    // Sheet 1: Overview
    const overviewData = [
      ['Report', 'Exam Analysis Report'],
      ['Period', selectedPeriod],
      ['Generated On', new Date().toLocaleString()],
      ['Classes', selectedClasses.join(', ')],
      [],
      ['Metric', 'Value'],
      ['Total Students', totalStudents],
      ['Average Score', avgScore.toFixed(2)],
      ['Max Score', maxScore],
    ];
    const wsOverview = (window as any).XLSX.utils.aoa_to_sheet(overviewData);
    (window as any).XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

    // Sheet 2: Class Stats
    const wsClasses = (window as any).XLSX.utils.json_to_sheet(classStats.map(c => ({
      Class: c.className,
      Count: c.count,
      Average: c.average,
      [`Top ${data.settings?.comparisonThresholds?.[0] || 50}`]: c.eliteCount,
      [`Top ${data.settings?.comparisonThresholds?.[1] || 100}`]: c.benchCount
    })));
    (window as any).XLSX.utils.book_append_sheet(wb, wsClasses, "Class Statistics");

    // Sheet 3: Subject Avgs
    const wsSubjects = (window as any).XLSX.utils.json_to_sheet(subjectAvgs);
    (window as any).XLSX.utils.book_append_sheet(wb, wsSubjects, "Subject Averages");

    // Sheet 4: Students List
    const wsStudents = (window as any).XLSX.utils.json_to_sheet(periodData.map(s => ({
      Rank: s.periodSchoolRank,
      Name: s.name,
      Class: s.class,
      Total: s.currentTotal,
      Status: AnalysisEngine.getAdmissionCategory(s.periodSchoolRank, effectiveThresholds, effectiveType, totalStudents, s.currentStatus),
      ...s.currentScores
    })));
    (window as any).XLSX.utils.book_append_sheet(wb, wsStudents, "Student List");

    (window as any).XLSX.writeFile(wb, `Report_${selectedPeriod}.xlsx`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* Sidebar Controls - Hidden on Print */}
      <div className="w-full lg:w-80 space-y-6 no-print shrink-0">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-24">
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-1">{t('export.title')}</h2>
            <p className="text-xs text-gray-500">{t('export.subtitle')}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3" /> {t('export.config_period')}
              </label>
              <SelectInput value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
                {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
              </SelectInput>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Filter className="w-3 h-3" /> {t('export.config_classes')}
                </label>
                <button onClick={toggleAllClasses} className="text-[10px] text-blue-600 font-bold hover:underline">
                  {selectedClasses.length === data.classes.length ? 'Clear' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-1 custom-scrollbar">
                {data.classes.map(cls => (
                  <FilterChip 
                    key={cls}
                    label={cls}
                    active={selectedClasses.includes(cls)}
                    onClick={() => toggleClass(cls)}
                    color="blue"
                    className="text-xs py-1 px-2.5"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-50">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3 h-3" /> {t('export.options_title')}
              </label>
              <div className="space-y-2">
                <button onClick={() => toggleSection('overview')} className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  {includeSections.overview ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                  <span className="text-sm font-medium text-gray-700">{t('export.section_overview')}</span>
                </button>
                <button onClick={() => toggleSection('charts')} className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  {includeSections.charts ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                  <span className="text-sm font-medium text-gray-700">{t('export.section_charts')}</span>
                </button>
                <button onClick={() => toggleSection('matrix')} className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  {includeSections.matrix ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                  <span className="text-sm font-medium text-gray-700">{t('export.section_matrix')}</span>
                </button>
                <button onClick={() => toggleSection('students')} className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  {includeSections.students ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                  <span className="text-sm font-medium text-gray-700">{t('export.section_students')}</span>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
              <button 
                onClick={handlePrint}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg"
              >
                <Printer className="w-4 h-4" /> {t('export.btn_print')}
              </button>
              <button 
                onClick={handleExportExcel}
                className="w-full bg-emerald-50 text-emerald-600 border border-emerald-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" /> {t('export.btn_excel')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area / Print Area */}
      <div className="flex-1 bg-white min-h-screen lg:rounded-3xl lg:shadow-xl lg:border lg:border-gray-100 print-shadow-none overflow-hidden print:w-full print:block">
        {/* Report Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-end bg-gray-50/30">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <GraduationCap className="w-6 h-6" />
              <span className="font-bold text-lg tracking-tight">EduAnalytics Pro</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900">{t('export.preview_header')}</h1>
            <p className="text-gray-500 mt-2 font-medium">{selectedPeriod}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">{t('export.report_generated')}</p>
            <p className="text-sm font-bold text-gray-700">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="p-8 space-y-10">
          
          {/* Section 1: Overview */}
          {includeSections.overview && (
            <section className="print-break-inside-avoid">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <Layers className="w-4 h-4" /> {t('export.section_overview')}
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 border rounded-xl bg-gray-50 print:bg-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{t('stat.total_students')}</p>
                  <p className="text-2xl font-black text-gray-900">{totalStudents}</p>
                </div>
                <div className="p-4 border rounded-xl bg-gray-50 print:bg-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{t('common.average')}</p>
                  <p className="text-2xl font-black text-blue-600">{avgScore.toFixed(1)}</p>
                </div>
                <div className="p-4 border rounded-xl bg-gray-50 print:bg-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{t('stat.best_score')}</p>
                  <p className="text-2xl font-black text-indigo-600">{maxScore}</p>
                </div>
                <div className="p-4 border rounded-xl bg-gray-50 print:bg-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{t('stat.classes')}</p>
                  <p className="text-2xl font-black text-gray-900">{selectedClasses.length}</p>
                </div>
              </div>
            </section>
          )}

          {/* Section 2: Visual Charts */}
          {includeSections.charts && (
            <section className="print-break-inside-avoid">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <PieIcon className="w-4 h-4" /> {t('export.section_charts')}
              </h3>
              <div className="grid grid-cols-2 gap-8 h-80">
                <div className="border rounded-2xl p-6 print:border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-4">{t('school.chart_admissions')}</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={admissionDist} 
                        cx="50%" cy="50%" 
                        innerRadius={40} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value" 
                        isAnimationActive={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {admissionDist.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="border rounded-2xl p-6 print:border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-4">{t('school.chart_subjects')}</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectAvgs}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} interval={0} />
                      <YAxis fontSize={10} />
                      <Bar dataKey="avg" fill="#3b82f6" isAnimationActive={false} label={{ position: 'top', fontSize: 10, fill: '#666' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          )}

          {/* Section 3: Class Matrix Table */}
          {includeSections.matrix && (
            <section className="print-break-inside-avoid">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <BarChart2 className="w-4 h-4" /> {t('export.section_matrix')}
              </h3>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">{t('common.class')}</th>
                      <th className="px-6 py-3 text-center">{t('common.participants')}</th>
                      <th className="px-6 py-3 text-center">{t('common.average')}</th>
                      <th className="px-6 py-3 text-center">Top {data.settings?.comparisonThresholds?.[0] || 50}</th>
                      <th className="px-6 py-3 text-center">Top {data.settings?.comparisonThresholds?.[1] || 100}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classStats.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-3 font-bold text-gray-800">{row.className}</td>
                        <td className="px-6 py-3 text-center text-gray-600">{row.count}</td>
                        <td className="px-6 py-3 text-center font-bold text-blue-600">{row.average}</td>
                        <td className="px-6 py-3 text-center text-gray-600">{row.eliteCount}</td>
                        <td className="px-6 py-3 text-center text-gray-600">{row.benchCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section 4: Top Students List */}
          {includeSections.students && (
            <section className="print-break-inside-avoid">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <GraduationCap className="w-4 h-4" /> {t('export.top_students_title').replace('{count}', String(topStudents.length))}
              </h3>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 w-16">#</th>
                      <th className="px-6 py-3">{t('progress.table_name')}</th>
                      <th className="px-6 py-3 text-center">{t('common.class')}</th>
                      <th className="px-6 py-3 text-right">{t('common.score')}</th>
                      <th className="px-6 py-3 text-center">{t('wizard.admission_status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topStudents.map((s, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-2 font-black text-indigo-600">{s.periodSchoolRank}</td>
                        <td className="px-6 py-2 font-bold text-gray-800">{s.name}</td>
                        <td className="px-6 py-2 text-center text-gray-500 text-xs font-bold uppercase">{s.class}</td>
                        <td className="px-6 py-2 text-right font-bold text-gray-900">{s.currentTotal}</td>
                        <td className="px-6 py-2 text-center">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            {AnalysisEngine.getAdmissionCategory(s.periodSchoolRank, effectiveThresholds, effectiveType, totalStudents, s.currentStatus)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 mt-auto bg-gray-50/50 print:bg-white print:border-none">
          <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {t('export.report_footer')} • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportView;
