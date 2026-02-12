
import React, { useState, useMemo } from 'react';
import { AnalysisState } from '../types';
import { SelectInput, FilterChip } from './SharedComponents';
import { 
  Calendar, Printer, FileSpreadsheet, Layers, 
  PieChart as PieIcon, BarChart2, CheckSquare, Square, 
  GraduationCap, Crown, Calculator, TrendingUp, Target, 
  ChevronDown, ChevronRight, Settings2, Filter
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import * as AnalysisEngine from '../utils/analysisUtils';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Legend, ResponsiveContainer, LineChart, Line, Tooltip 
} from 'recharts';

interface ExportViewProps {
  data: AnalysisState;
}

const ExportView: React.FC<ExportViewProps> = ({ data }) => {
  const { t } = useTranslation();
  const totalStudents = data.students.length;
  
  // --- Global Settings ---
  const allPeriods = useMemo(() => 
    data.students[0]?.history.map(h => h.period) || [], 
    [data.students]
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>(allPeriods[allPeriods.length - 1] || '');

  // --- Section Visibility States ---
  const [sections, setSections] = useState({
    school: true,
    comparison: false,
    kings: false,
    parameters: false,
    subject: false,
    progress: false,
    student: false
  });

  // --- Sub-Configuration States ---
  
  // Comparison Config
  const [compClasses, setCompClasses] = useState<string[]>(data.classes);
  
  // Kings Config
  const [benchmarkClass, setBenchmarkClass] = useState<string>(data.classes[0] || '');
  
  // Subject Config
  const [exportSubject, setExportSubject] = useState<string>(data.subjects[0] || '');
  const [subjectClasses, setSubjectClasses] = useState<string[]>(data.classes);
  
  // Progress Config
  const [periodX, setPeriodX] = useState<string>(allPeriods[allPeriods.length - 2] || allPeriods[0] || '');
  const [periodY, setPeriodY] = useState<string>(allPeriods[allPeriods.length - 1] || '');
  const [progressClasses, setProgressClasses] = useState<string[]>(data.classes);
  
  // Student Detail Config (Class Filter Only)
  const [studentClassFilter, setStudentClassFilter] = useState<string>(data.classes[0] || '');

  // --- Helpers ---
  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleArrayItem = (item: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(item)) {
      setter(current.filter(i => i !== item));
    } else {
      setter([...current, item]);
    }
  };

  const selectAll = (all: string[], setter: (val: string[]) => void) => setter([...all]);
  const clearAll = (setter: (val: string[]) => void) => setter([]);

  // --- Data Calculations (Memoized for Performance) ---

  const allHistoricalRanks = useMemo(() => 
    AnalysisEngine.calculateHistoricalRanks(data.students), 
    [data.students]
  );

  const allSubjectRanks = useMemo(() => 
    AnalysisEngine.calculateSubjectHistoricalRanks(data.students, data.subjects),
    [data.students, data.subjects]
  );

  // Global Period Data
  const periodData = useMemo(() => 
    AnalysisEngine.getPeriodSnapshot(data.students, selectedPeriod, allHistoricalRanks),
    [data.students, selectedPeriod, allHistoricalRanks]
  );

  // 1. School View Data
  const admissionLabels = [
    { key: '清北', color: '#be123c' },
    { key: 'C9', color: '#1e40af' },
    { key: '高分数', color: '#0369a1' },
    { key: '名校', color: '#0d9488' },
    { key: '特控', color: '#10b981' },
  ];
  const thresholds = data.settings?.manualThresholds || { '清北': 5, 'C9': 30, '高分数': 100, '名校': 300, '特控': 600 };
  const thresholdType = (data.settings?.thresholdType || 'rank') as 'rank' | 'percent';
  const hasImportedStatus = periodData.some(s => s.currentStatus !== undefined && s.currentStatus !== '');
  const effectiveThresholds = hasImportedStatus 
    ? AnalysisEngine.deriveThresholdsFromMetadata(periodData, admissionLabels)
    : thresholds;
  const effectiveType = hasImportedStatus ? 'percent' : thresholdType;

  const schoolStats = useMemo(() => ({
    admissionDist: AnalysisEngine.getAdmissionDistribution(periodData, effectiveThresholds, effectiveType, admissionLabels),
    subjectAvgs: AnalysisEngine.getSubjectAverages(periodData, data.subjects)
  }), [periodData, effectiveThresholds, effectiveType, data.subjects]);

  // 2. Comparison Data
  const comparisonData = useMemo(() => {
    const t1 = data.settings?.comparisonThresholds?.[0] || 50;
    const t2 = data.settings?.comparisonThresholds?.[1] || 100;
    const stats = AnalysisEngine.getClassSummaries(periodData, compClasses, t1, t2);
    
    // Transform for gap chart
    const gapData = data.subjects.map(sub => {
      const entry: any = { name: sub };
      compClasses.forEach(cls => {
        const clsStudents = periodData.filter(s => s.class === cls);
        entry[cls] = clsStudents.length > 0 ? parseFloat((clsStudents.reduce((acc, s) => acc + (s.currentScores[sub] || 0), 0) / clsStudents.length).toFixed(2)) : 0;
      });
      return entry;
    });

    return { stats, gapData };
  }, [periodData, compClasses, data.settings, data.subjects]);

  // 3. Kings Data
  const kingsData = useMemo(() => {
    const kings = data.subjects.map(sub => ({
      subject: sub,
      classMax: Math.max(...periodData.filter(s => s.class === benchmarkClass).map(s => s.currentScores[sub] || 0), 0),
      gradeMax: Math.max(...periodData.map(s => s.currentScores[sub] || 0), 0)
    }));
    return kings;
  }, [periodData, data.subjects, benchmarkClass]);

  // 4. Parameters Data
  const paramsData = useMemo(() => 
    AnalysisEngine.calculateExamParameters(periodData, data.subjects),
    [periodData, data.subjects]
  );

  // 5. Subject Data
  const subjectData = useMemo(() => {
    const dist = AnalysisEngine.getSubjectDistribution(
      selectedPeriod, exportSubject, subjectClasses, periodData, allSubjectRanks, thresholds, effectiveType, periodData.length
    );
    return dist;
  }, [selectedPeriod, exportSubject, subjectClasses, periodData, allSubjectRanks, thresholds, effectiveType]);

  // 6. Progress Data
  const progressData = useMemo(() => {
    const raw = AnalysisEngine.getProgressAnalysisData(data.students, periodX, periodY, allHistoricalRanks);
    return raw.filter(d => progressClasses.includes(d.class)).sort((a, b) => b.rankChange - a.rankChange); // Sort by improvement
  }, [data.students, periodX, periodY, allHistoricalRanks, progressClasses]);

  // 7. Student Data (Ledger)
  const studentLedgerData = useMemo(() => {
    return periodData.filter(s => s.class === studentClassFilter);
  }, [periodData, studentClassFilter]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  // --- Handlers ---
  const handlePrint = () => window.print();

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 print:block">
      {/* --- SIDEBAR CONFIGURATION (Hidden on Print) --- */}
      <div className="w-full lg:w-96 space-y-6 no-print shrink-0">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-24 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
          
          {/* Header & Global Settings */}
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-gray-900 mb-1">{t('export.title')}</h2>
            <p className="text-xs text-gray-500 mb-4">{t('export.subtitle')}</p>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3" /> {t('export.config_period')}
              </label>
              <SelectInput value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
                {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
              </SelectInput>
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3 h-3" /> {t('export.options_title')}
              </label>
              
              {/* 1. School View Toggle */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSection('school')} 
                  className={`flex items-center gap-3 w-full p-3 transition-colors ${sections.school ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}
                >
                  {sections.school ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                  <span className="text-sm font-bold">{t('tab.school')}</span>
                </button>
              </div>

              {/* 2. Comparison Toggle & Config */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSection('comparison')} 
                  className={`flex items-center justify-between w-full p-3 transition-colors ${sections.comparison ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    {sections.comparison ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                    <span className="text-sm font-bold">{t('tab.comparison')}</span>
                  </div>
                  {sections.comparison && <ChevronDown className="w-4 h-4 text-blue-400" />}
                </button>
                {sections.comparison && (
                   <div className="p-3 bg-blue-50/30 border-t border-blue-100 space-y-3 animate-in slide-in-from-top-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{t('subject.select_classes')}</span>
                        <div className="flex gap-2">
                          <button onClick={() => selectAll(data.classes, setCompClasses)} className="text-[10px] text-blue-600 hover:underline">{t('common.select_all')}</button>
                          <button onClick={() => clearAll(setCompClasses)} className="text-[10px] text-gray-400 hover:underline">Clear</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                        {data.classes.map(cls => (
                          <FilterChip 
                            key={cls} label={cls} active={compClasses.includes(cls)} 
                            onClick={() => toggleArrayItem(cls, compClasses, setCompClasses)} 
                            color="blue" className="text-[10px] px-2 py-0.5"
                          />
                        ))}
                      </div>
                   </div>
                )}
              </div>

              {/* 3. Kings Toggle & Config */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSection('kings')} 
                  className={`flex items-center justify-between w-full p-3 transition-colors ${sections.kings ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    {sections.kings ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                    <span className="text-sm font-bold">{t('tab.kings')}</span>
                  </div>
                  {sections.kings && <ChevronDown className="w-4 h-4 text-blue-400" />}
                </button>
                {sections.kings && (
                   <div className="p-3 bg-blue-50/30 border-t border-blue-100 space-y-2 animate-in slide-in-from-top-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{t('kings.selector_prefix')}</span>
                      <SelectInput value={benchmarkClass} onChange={(e) => setBenchmarkClass(e.target.value)} className="text-xs py-1.5">
                        {data.classes.map(c => <option key={c} value={c}>{c}</option>)}
                      </SelectInput>
                   </div>
                )}
              </div>

              {/* 4. Parameters Toggle */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSection('parameters')} 
                  className={`flex items-center gap-3 w-full p-3 transition-colors ${sections.parameters ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}
                >
                  {sections.parameters ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                  <span className="text-sm font-bold">{t('tab.parameters')}</span>
                </button>
              </div>

              {/* 5. Subject Toggle & Config */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSection('subject')} 
                  className={`flex items-center justify-between w-full p-3 transition-colors ${sections.subject ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    {sections.subject ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                    <span className="text-sm font-bold">{t('tab.subject')}</span>
                  </div>
                  {sections.subject && <ChevronDown className="w-4 h-4 text-blue-400" />}
                </button>
                {sections.subject && (
                   <div className="p-3 bg-blue-50/30 border-t border-blue-100 space-y-3 animate-in slide-in-from-top-1">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{t('subject.select_subject')}</span>
                        <SelectInput value={exportSubject} onChange={(e) => setExportSubject(e.target.value)} className="text-xs py-1.5 mt-1">
                          {data.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </SelectInput>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{t('subject.select_classes')}</span>
                          <button onClick={() => selectAll(data.classes, setSubjectClasses)} className="text-[10px] text-blue-600 hover:underline">{t('common.select_all')}</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                          {data.classes.map(cls => (
                            <FilterChip 
                              key={cls} label={cls} active={subjectClasses.includes(cls)} 
                              onClick={() => toggleArrayItem(cls, subjectClasses, setSubjectClasses)} 
                              color="indigo" className="text-[10px] px-2 py-0.5"
                            />
                          ))}
                        </div>
                      </div>
                   </div>
                )}
              </div>

              {/* 6. Progress Toggle & Config */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSection('progress')} 
                  className={`flex items-center justify-between w-full p-3 transition-colors ${sections.progress ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    {sections.progress ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                    <span className="text-sm font-bold">{t('tab.progress')}</span>
                  </div>
                  {sections.progress && <ChevronDown className="w-4 h-4 text-blue-400" />}
                </button>
                {sections.progress && (
                   <div className="p-3 bg-blue-50/30 border-t border-blue-100 space-y-3 animate-in slide-in-from-top-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{t('progress.period_x')}</span>
                          <SelectInput value={periodX} onChange={(e) => setPeriodX(e.target.value)} className="text-xs py-1.5 mt-1">
                            {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
                          </SelectInput>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{t('progress.period_y')}</span>
                          <SelectInput value={periodY} onChange={(e) => setPeriodY(e.target.value)} className="text-xs py-1.5 mt-1">
                            {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
                          </SelectInput>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{t('progress.class_filter')}</span>
                          <button onClick={() => selectAll(data.classes, setProgressClasses)} className="text-[10px] text-blue-600 hover:underline">{t('common.select_all')}</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                          {data.classes.map(cls => (
                            <FilterChip 
                              key={cls} label={cls} active={progressClasses.includes(cls)} 
                              onClick={() => toggleArrayItem(cls, progressClasses, setProgressClasses)} 
                              color="blue" className="text-[10px] px-2 py-0.5"
                            />
                          ))}
                        </div>
                      </div>
                   </div>
                )}
              </div>

              {/* 7. Student Toggle & Config */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSection('student')} 
                  className={`flex items-center justify-between w-full p-3 transition-colors ${sections.student ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    {sections.student ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                    <span className="text-sm font-bold">{t('tab.student')}</span>
                  </div>
                  {sections.student && <ChevronDown className="w-4 h-4 text-blue-400" />}
                </button>
                {sections.student && (
                   <div className="p-3 bg-blue-50/30 border-t border-blue-100 space-y-2 animate-in slide-in-from-top-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{t('student.all_classes')}</span>
                      <SelectInput value={studentClassFilter} onChange={(e) => setStudentClassFilter(e.target.value)} className="text-xs py-1.5">
                        {data.classes.map(c => <option key={c} value={c}>{c}</option>)}
                      </SelectInput>
                      <p className="text-[9px] text-blue-400 italic mt-1">
                        * {t('export.student_limit_note')}
                      </p>
                   </div>
                )}
              </div>

          </div>

          <button 
            onClick={handlePrint}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg"
          >
            <Printer className="w-4 h-4" /> {t('export.btn_print')}
          </button>
        </div>
      </div>

      {/* --- PREVIEW AREA (The Paper) --- */}
      <div className="flex-1 bg-white min-h-screen lg:rounded-3xl lg:shadow-xl lg:border lg:border-gray-100 print-shadow-none overflow-hidden print:w-full print:block print:overflow-visible print:min-h-0">
        
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

        <div className="p-8 space-y-12">
          
          {/* SECTION 1: SCHOOL VIEW */}
          {sections.school && (
            <section className="print-break-inside-avoid">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                <PieIcon className="w-4 h-4 text-blue-500" /> {t('tab.school')}
              </h3>
              <div className="grid grid-cols-2 gap-8 h-64 mb-6">
                <div className="border rounded-2xl p-4 print:border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 mb-2">{t('school.chart_admissions')}</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={schoolStats.admissionDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70} 
                        paddingAngle={5} dataKey="value" isAnimationActive={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {schoolStats.admissionDist.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="border rounded-2xl p-4 print:border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 mb-2">{t('school.chart_subjects')}</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={schoolStats.subjectAvgs}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={9} interval={0} tick={{fill: '#6b7280'}} />
                      <YAxis fontSize={9} tick={{fill: '#6b7280'}} />
                      <Bar dataKey="avg" fill="#3b82f6" isAnimationActive={false} label={{ position: 'top', fontSize: 9, fill: '#666' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2: COMPARISON VIEW */}
          {sections.comparison && (
            <section className="print-break-inside-avoid">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                <Layers className="w-4 h-4 text-indigo-500" /> {t('tab.comparison')}
              </h3>
              <div className="space-y-6">
                 {/* Matrix Table */}
                 <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                        <tr>
                          <th className="px-4 py-2">{t('common.class')}</th>
                          <th className="px-4 py-2 text-center">{t('common.participants')}</th>
                          <th className="px-4 py-2 text-center">{t('common.average')}</th>
                          <th className="px-4 py-2 text-center">Top {data.settings?.comparisonThresholds?.[0] || 50}</th>
                          <th className="px-4 py-2 text-center">Top {data.settings?.comparisonThresholds?.[1] || 100}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {comparisonData.stats.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 font-bold text-gray-800">{row.className}</td>
                            <td className="px-4 py-2 text-center text-gray-600">{row.count}</td>
                            <td className="px-4 py-2 text-center font-bold text-blue-600">{row.average}</td>
                            <td className="px-4 py-2 text-center text-gray-600">{row.eliteCount}</td>
                            <td className="px-4 py-2 text-center text-gray-600">{row.benchCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
                 {/* Gap Chart */}
                 <div className="h-60 border rounded-xl p-4">
                    <h4 className="text-xs font-bold text-gray-700 mb-2">{t('comparison.chart_gap')}</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData.gapData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={9} />
                        <YAxis fontSize={9} />
                        <Legend verticalAlign="top" align="right" wrapperStyle={{fontSize: '9px', paddingBottom: '10px'}} />
                        {compClasses.map((cls, idx) => (
                          <Bar 
                            key={cls} dataKey={cls} fill={colors[idx % colors.length]} 
                            isAnimationActive={false} radius={[2, 2, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </section>
          )}

          {/* SECTION 3: KINGS VIEW */}
          {sections.kings && (
            <section className="print-break-inside-avoid">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                <Crown className="w-4 h-4 text-amber-500" /> {t('tab.kings')} ({benchmarkClass})
              </h3>
              <div className="h-80 border rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kingsData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                    <YAxis dataKey="subject" type="category" stroke="#94a3b8" fontSize={9} width={60} />
                    <Legend verticalAlign="top" wrapperStyle={{fontSize: '10px'}} />
                    <Bar dataKey="classMax" name={t('kings.legend_class_top')} fill="#3b82f6" isAnimationActive={false} barSize={12} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="gradeMax" name={t('kings.legend_grade_top')} fill="#e2e8f0" isAnimationActive={false} barSize={8} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* SECTION 4: PARAMETERS VIEW */}
          {sections.parameters && (
            <section className="print-break-inside-avoid">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                <Calculator className="w-4 h-4 text-purple-500" /> {t('tab.parameters')}
              </h3>
              {paramsData && (
                <div className="border rounded-xl overflow-hidden">
                   <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                      <tr>
                        <th className="px-4 py-2">{t('common.subject')}</th>
                        <th className="px-4 py-2 text-center">{t('params.table_mean')}</th>
                        <th className="px-4 py-2 text-center">{t('params.table_max')}</th>
                        <th className="px-4 py-2 text-center">{t('params.table_std_dev')}</th>
                        <th className="px-4 py-2 text-center">{t('params.table_difficulty')}</th>
                        <th className="px-4 py-2 text-center">{t('params.table_discrimination')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paramsData.subjectStats.map((s: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 font-bold text-gray-700">{s.subject}</td>
                          <td className="px-4 py-2 text-center">{s.mean}</td>
                          <td className="px-4 py-2 text-center">{s.max}</td>
                          <td className="px-4 py-2 text-center">{s.stdDev}</td>
                          <td className="px-4 py-2 text-center">{s.difficulty}</td>
                          <td className="px-4 py-2 text-center">{s.discrimination}</td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                </div>
              )}
            </section>
          )}

          {/* SECTION 5: SUBJECT VIEW */}
          {sections.subject && (
             <section className="print-break-inside-avoid">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" /> {t('tab.subject')} - {exportSubject}
              </h3>
              <div className="h-60 border rounded-xl p-4 mb-4">
                 <h4 className="text-xs font-bold text-gray-700 mb-2">
                    {t('subject.dist_title').replace('{subject}', exportSubject).replace('{period}', selectedPeriod)}
                 </h4>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={9} />
                      <YAxis fontSize={9} />
                      <Bar dataKey="count" isAnimationActive={false} label={{ position: 'top', fontSize: 9, fill: '#666' }}>
                        {subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              </div>
             </section>
          )}

          {/* SECTION 6: PROGRESS VIEW */}
          {sections.progress && (
            <section className="print-break-inside-avoid">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                <TrendingUp className="w-4 h-4 text-green-500" /> {t('tab.progress')} ({periodX} → {periodY})
              </h3>
              <div className="border rounded-xl overflow-hidden">
                 <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                    <tr>
                      <th className="px-4 py-2">{t('progress.table_name')}</th>
                      <th className="px-4 py-2 text-center">{t('common.class')}</th>
                      <th className="px-4 py-2 text-center">Rank {periodX}</th>
                      <th className="px-4 py-2 text-center">Rank {periodY}</th>
                      <th className="px-4 py-2 text-center">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {progressData.slice(0, 30).map((row: any, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 font-bold text-gray-800">{row.name}</td>
                        <td className="px-4 py-2 text-center text-gray-500">{row.class}</td>
                        <td className="px-4 py-2 text-center text-gray-600">{row.rankX}</td>
                        <td className="px-4 py-2 text-center text-gray-600">{row.rankY}</td>
                        <td className={`px-4 py-2 text-center font-bold ${row.rankChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.rankChange > 0 ? `+${row.rankChange}` : row.rankChange}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                 </table>
                 <p className="p-2 text-[10px] text-gray-400 text-center italic">
                   * Showing top 30 improvements. Full list available in Excel export.
                 </p>
              </div>
            </section>
          )}

          {/* SECTION 7: STUDENT (LEDGER) VIEW */}
          {sections.student && (
             <section className="print-break-inside-avoid">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
                <Target className="w-4 h-4 text-rose-500" /> {t('tab.student')} - {t('student.ledger_title')} ({studentClassFilter})
              </h3>
              <div className="border rounded-xl overflow-hidden">
                 <table className="w-full text-[10px] text-left">
                  <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                    <tr>
                       <th className="px-2 py-2">Rank</th>
                       <th className="px-2 py-2">Name</th>
                       {data.subjects.slice(0, 6).map(s => <th key={s} className="px-2 py-2 text-center">{s}</th>)}
                       <th className="px-2 py-2 text-center font-bold">Total</th>
                       <th className="px-2 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentLedgerData.map((s, idx) => (
                       <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-1.5 font-bold text-indigo-600">#{s.periodSchoolRank}</td>
                          <td className="px-2 py-1.5 font-bold text-gray-800">{s.name}</td>
                          {data.subjects.slice(0, 6).map(sub => (
                            <td key={sub} className="px-2 py-1.5 text-center text-gray-600">{s.currentScores[sub]}</td>
                          ))}
                          <td className="px-2 py-1.5 text-center font-black text-gray-900">{s.currentTotal}</td>
                          <td className="px-2 py-1.5 text-center text-gray-500">
                             {AnalysisEngine.getAdmissionCategory(s.periodSchoolRank, effectiveThresholds, effectiveType, totalStudents, s.currentStatus)}
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
