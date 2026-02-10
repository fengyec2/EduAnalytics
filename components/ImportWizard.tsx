
import React, { useState, useMemo } from 'react';
import { Upload, X, ArrowRight, ArrowLeft, Table, CheckCircle2, AlertCircle, FileText, LayoutGrid, ListFilter, Settings2, UserCheck, ShieldCheck, Edit3 } from 'lucide-react';
import { AnalysisState, ImportMode, DataStructure, RankSource, ColumnMapping, StudentRecord, ScoreSnapshot } from '../types';
import { useTranslation } from '../context/LanguageContext';
import * as AnalysisEngine from '../utils/analysisUtils';

interface ImportWizardProps {
  onComplete: (data: AnalysisState) => void;
  onCancel: () => void;
  currentData: AnalysisState | null;
}

const ImportWizard: React.FC<ImportWizardProps> = ({ onComplete, onCancel, currentData }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<ImportMode>('complete');
  const [structure, setStructure] = useState<DataStructure>('multi-file-single');
  const [rankSource, setRankSource] = useState<RankSource>('recalculate');
  const [periodNamesInput, setPeriodNamesInput] = useState<string>('');
  
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    class: '',
    customClass: '',
    subjects: {},
    subjectRanks: {}
  });

  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files) as File[];
    setFiles(prev => [...prev, ...newFiles]);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = (window as any).XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      
      const rows = (window as any).XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (rows.length > 0) {
        const firstRow = rows.find((r: any[]) => r && r.length > 0) as any[];
        if (!firstRow) return;

        const foundHeaders = firstRow.map(h => String(h || '').trim()).filter(h => h.length > 0);
        setHeaders(foundHeaders);
        
        const autoMapping: ColumnMapping = {
          name: '',
          class: '',
          customClass: '',
          subjects: {},
          subjectRanks: {}
        };

        foundHeaders.forEach(h => {
          const lower = h.toLowerCase();
          if (!autoMapping.name && (lower === '姓名' || lower === 'name' || lower.includes('学生姓名') || lower === '学生')) {
            autoMapping.name = h;
          } else if (!autoMapping.class && (lower === '班级' || lower === '班' || lower === 'class' || lower.includes('班级名称') || lower === '班别')) {
            autoMapping.class = h;
          }
        });

        foundHeaders.forEach(h => {
          const lower = h.toLowerCase();
          if (!autoMapping.totalRank && (lower === '级名' || lower === '年级排名' || lower === '全校名次' || lower === '总分名次' || lower === 'total rank')) {
            autoMapping.totalRank = h;
          }
          if (!autoMapping.status && (lower === '上线' || lower === '上线情况' || lower === '录取状态' || lower === '录取' || lower === 'admission' || lower === 'status' || lower === '等级')) {
            autoMapping.status = h;
          }
        });

        foundHeaders.forEach(h => {
          if (h === autoMapping.name || h === autoMapping.class || h === autoMapping.totalRank || h === autoMapping.status) return;
          const lower = h.toLowerCase();
          const isRankCol = lower.includes('名') || lower.includes('次') || lower.includes('rank') || lower === '排名' || lower.includes('位次');
          const isIdCol = lower.includes('号') || lower.includes('id') || lower === '学籍';
          
          if (!isRankCol && !isIdCol) {
            autoMapping.subjects[h] = h;
          }
        });

        const rankKeywords = ['排名', '名次', '名', '次', '位', 'rank'];
        Object.keys(autoMapping.subjects).forEach(sub => {
          const subName = sub.trim();
          const subShort = subName.substring(0, 1);
          
          const matchingRankCol = foundHeaders.find(h => {
            if (h === sub || autoMapping.subjects[h]) return false;
            if (h === autoMapping.name || h === autoMapping.class || h === autoMapping.totalRank) return false;

            const hl = h.toLowerCase();
            const sl = subName.toLowerCase();
            const ssl = subShort.toLowerCase();

            if (rankKeywords.some(kw => hl === (sl + kw) || hl === (sl + ' ' + kw))) return true;
            if (subName.length > 1 && rankKeywords.some(kw => hl === (ssl + kw))) return true;
            if (hl.includes(sl) && rankKeywords.some(kw => hl.includes(kw))) return true;
            return false;
          });

          if (matchingRankCol) {
            autoMapping.subjectRanks[sub] = matchingRankCol;
          }
        });

        setMapping(autoMapping);
      }
    };
    reader.readAsBinaryString(newFiles[0]);
  };

  const handleFinalImport = async () => {
    setLoading(true);
    try {
      const allSubjects = Object.keys(mapping.subjects);
      const studentMap = new Map<string, { class: string; history: ScoreSnapshot[] }>();
      
      if (currentData) {
        currentData.students.forEach(s => {
          studentMap.set(s.name, { class: s.class, history: [...s.history] });
        });
      }

      const getFileContent = (file: File) => new Promise<any[]>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const wb = (window as any).XLSX.read(e.target?.result, { type: 'binary' });
          resolve((window as any).XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null }));
        };
        reader.readAsBinaryString(file);
      });

      const createSnapshot = (row: any, period: string, subs: string[]): ScoreSnapshot => {
        const scores: Record<string, number> = {};
        const ranks: Record<string, number> = {};
        let total = 0;

        subs.forEach(sub => {
          const val = row[mapping.subjects[sub]];
          const score = typeof val === 'number' ? val : parseFloat(String(val || '0')) || 0;
          scores[sub] = score;
          total += score;
          
          if (rankSource === 'imported' && mapping.subjectRanks[sub]) {
            const rankVal = row[mapping.subjectRanks[sub]];
            ranks[sub] = typeof rankVal === 'number' ? rankVal : parseInt(String(rankVal || '0')) || 0;
          }
        });

        return {
          period,
          scores,
          ranks: rankSource === 'imported' ? ranks : undefined,
          totalScore: parseFloat(total.toFixed(2)),
          averageScore: parseFloat((total / (subs.length || 1)).toFixed(2)),
          schoolRank: rankSource === 'imported' && mapping.totalRank ? parseInt(String(row[mapping.totalRank] || '0')) : undefined,
          status: rankSource === 'imported' && mapping.status ? String(row[mapping.status] || '').trim() : undefined,
          isComplete: mode === 'complete'
        };
      };

      if (structure === 'multi-file-single') {
        for (const file of files) {
          const periodName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
          const content = await getFileContent(file);
          
          content.forEach((row: any) => {
            const name = String(row[mapping.name] || '').trim();
            if (!name || name === 'undefined' || name === mapping.name || name.toLowerCase() === 'name') return;
            
            const snapshot = createSnapshot(row, periodName, allSubjects);
            const studentClass = mapping.class ? String(row[mapping.class] || '').trim() : (mapping.customClass || 'Unknown Class');

            if (!studentMap.has(name)) {
              studentMap.set(name, { class: studentClass, history: [] });
            }
            const info = studentMap.get(name)!;
            const existingIdx = info.history.findIndex(h => h.period === periodName);
            if (existingIdx >= 0) info.history[existingIdx] = snapshot;
            else info.history.push(snapshot);
          });
        }
      } else {
        const content = await getFileContent(files[0]);
        const periods = periodNamesInput.split(',').map(s => s.trim()).filter(Boolean);
        const studentRows = new Map<string, { class: string, rows: any[] }>();
        content.forEach(row => {
          const name = String(row[mapping.name] || '').trim();
          if (!name || name === 'undefined' || name === mapping.name || name.toLowerCase() === 'name') return;
          
          const studentClass = mapping.class ? String(row[mapping.class] || '').trim() : (mapping.customClass || 'Unknown Class');
          
          if (!studentRows.has(name)) {
            studentRows.set(name, { class: studentClass, rows: [] });
          }
          studentRows.get(name)!.rows.push(row);
        });

        const maxExams = Array.from(studentRows.values()).reduce((max, s) => Math.max(max, s.rows.length), 0);
        const finalPeriodNames = Array.from({ length: maxExams }, (_, i) => periods[i] || `Exam ${i + 1}`);

        studentRows.forEach((data, name) => {
          if (!studentMap.has(name)) {
            studentMap.set(name, { class: data.class, history: [] });
          }
          const info = studentMap.get(name)!;
          data.rows.forEach((row, idx) => {
            const periodName = finalPeriodNames[idx];
            const snapshot = createSnapshot(row, periodName, allSubjects);
            const existingIdx = info.history.findIndex(h => h.period === periodName);
            if (existingIdx >= 0) info.history[existingIdx] = snapshot;
            else info.history.push(snapshot);
          });
        });
      }

      const students: StudentRecord[] = Array.from(studentMap.entries()).map(([name, info], index) => {
        const latest = info.history[info.history.length - 1];
        return {
          id: `s-${index}`,
          name,
          class: info.class,
          scores: latest.scores,
          totalScore: latest.totalScore,
          averageScore: latest.averageScore,
          history: info.history
        };
      });

      if (students.length === 0) throw new Error(t('wizard.error_no_records'));

      const rawClasses = Array.from(new Set(students.map(s => s.class)));

      onComplete({
        students,
        subjects: allSubjects,
        classes: AnalysisEngine.sortClasses(rawClasses),
        schoolStats: {
          average: students.reduce((acc, s) => acc + s.totalScore, 0) / students.length,
          max: Math.max(...students.map(s => s.totalScore)),
          min: Math.min(...students.map(s => s.totalScore)),
          subjectStats: {},
          distribution: []
        },
        // 初始导入时注入默认 settings
        settings: currentData?.settings || {
          manualThresholds: { '清北': 5, 'C9': 30, '高分数': 100, '名校': 300, '特控': 600 },
          comparisonThresholds: [50, 100, 200, 250, 400],
          thresholdType: 'rank'
        }
      });
    } catch (err: any) {
      console.error(err);
      alert(`${err.message || 'Error processing records'}`);
    } finally {
      setLoading(false);
    }
  };

  const availableSubjectColumns = useMemo(() => {
    return headers.filter(h => h !== mapping.name && h !== mapping.class);
  }, [headers, mapping.name, mapping.class]);

  const isMappingValid = mapping.name && (mapping.class || (mapping.customClass && mapping.customClass.trim() !== '')) && Object.keys(mapping.subjects).length > 0;

  const steps = [
    { id: 1, label: t('wizard.upload') },
    { id: 2, label: t('wizard.config') },
    { id: 3, label: t('wizard.mapping') },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="flex border-b border-gray-50">
        {steps.map(s => (
          <div key={s.id} className={`flex-1 py-4 text-center text-[10px] font-black uppercase tracking-widest transition-colors ${step >= s.id ? 'text-blue-600 bg-blue-50/50' : 'text-gray-300'}`}>
            {t('wizard.step')} {s.id}: {s.label}
          </div>
        ))}
      </div>

      <div className="p-8 min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center relative group hover:border-blue-400 transition-all">
              <input type="file" multiple={structure === 'multi-file-single'} onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-gray-800">{t('wizard.drop_files')}</h3>
              <p className="text-sm text-gray-400">{t('wizard.supported_formats')}</p>
            </div>
            {files.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((f, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-xl flex items-center justify-between border border-gray-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{f.name}</span>
                    </div>
                    <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-1 hover:bg-gray-200 rounded-lg text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 overflow-y-auto max-h-[500px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <LayoutGrid className="w-3 h-3" /> {t('wizard.data_mode')}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => setMode('complete')} className={`p-4 rounded-xl border text-left transition-all ${mode === 'complete' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800 text-sm">{t('wizard.mode_complete')}</span>
                        {mode === 'complete' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[10px] text-gray-500">{t('wizard.mode_complete_desc')}</p>
                    </button>
                    <button onClick={() => setMode('incomplete')} className={`p-4 rounded-xl border text-left transition-all ${mode === 'incomplete' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800 text-sm">{t('wizard.mode_partial')}</span>
                        {mode === 'incomplete' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[10px] text-gray-500">{t('wizard.mode_partial_desc')}</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <ListFilter className="w-3 h-3" /> {t('wizard.table_layout')}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => setStructure('multi-file-single')} className={`p-4 rounded-xl border text-left transition-all ${structure === 'multi-file-single' ? 'border-orange-600 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800 text-sm">{t('wizard.layout_multi')}</span>
                        {structure === 'multi-file-single' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                      </div>
                      <p className="text-[10px] text-gray-500">{t('wizard.layout_multi_desc')}</p>
                    </button>
                    <button onClick={() => setStructure('single-file-multi')} className={`p-4 rounded-xl border text-left transition-all ${structure === 'single-file-multi' ? 'border-orange-600 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800 text-sm">{t('wizard.layout_single')}</span>
                        {structure === 'single-file-multi' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                      </div>
                      <p className="text-[10px] text-gray-500">{t('wizard.layout_single_desc')}</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Settings2 className="w-3 h-3" /> {t('wizard.rank_source')}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => setRankSource('recalculate')} className={`p-4 rounded-xl border text-left transition-all ${rankSource === 'recalculate' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Settings2 className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-gray-800 text-sm">{t('wizard.source_system')}</span>
                        </div>
                        {rankSource === 'recalculate' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-[10px] text-gray-500">{t('wizard.source_system_desc')}</p>
                    </button>
                    <button onClick={() => setRankSource('imported')} className={`p-4 rounded-xl border text-left transition-all ${rankSource === 'imported' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-gray-800 text-sm">{t('wizard.source_import')}</span>
                        </div>
                        {rankSource === 'imported' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-[10px] text-gray-500">{t('wizard.source_import_desc')}</p>
                    </button>
                  </div>
                </div>
                {structure === 'single-file-multi' && (
                  <div className="space-y-2 p-5 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('wizard.define_sequence')}</label>
                    <input type="text" value={periodNamesInput} onChange={(e) => setPeriodNamesInput(e.target.value)} placeholder="e.g. Sep Monthly, Mid-term, Dec Monthly..." className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('wizard.identity_cols')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{t('wizard.student_name')}</span>
                    <select value={mapping.name} onChange={(e) => setMapping({...mapping, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">{t('wizard.choose_col')}</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{t('wizard.class_group')}</span>
                      <select value={mapping.class} onChange={(e) => setMapping({...mapping, class: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">{t('wizard.manual_input')}</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {!mapping.class && (
                      <div className="flex items-center gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100 animate-in slide-in-from-top-1">
                        <Edit3 className="w-4 h-4 text-blue-500" />
                        <input 
                          type="text" 
                          value={mapping.customClass || ''} 
                          onChange={(e) => setMapping({...mapping, customClass: e.target.value})} 
                          placeholder={t('wizard.enter_class')} 
                          className="bg-transparent border-none text-xs font-bold text-blue-900 focus:ring-0 w-full placeholder:text-blue-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('wizard.global_metrics')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{t('wizard.total_rank_col')}</span>
                    <select disabled={rankSource === 'recalculate'} value={mapping.totalRank} onChange={(e) => setMapping({...mapping, totalRank: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                      <option value="">{t('wizard.not_specified')}</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-500" /> {t('wizard.admission_status')}
                    </span>
                    <select disabled={rankSource === 'recalculate'} value={mapping.status} onChange={(e) => setMapping({...mapping, status: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                      <option value="">{t('wizard.not_specified')}</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                <span>{t('wizard.subject_mapping')}</span>
                <span className="text-blue-600 normal-case font-bold">{t('wizard.selected_count')}: {Object.keys(mapping.subjects).length}</span>
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {availableSubjectColumns.length === 0 && <p className="text-center py-12 text-gray-400 text-sm italic border-2 border-dashed rounded-2xl">{t('wizard.mapping_hint')}</p>}
                {availableSubjectColumns.map(h => (
                  <div key={h} className={`bg-gray-50 p-4 rounded-xl flex items-center justify-between border transition-all ${mapping.subjects[h] ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 hover:border-blue-300'}`}>
                    <div className="flex items-center gap-3">
                      <Table className={`w-4 h-4 ${mapping.subjects[h] ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className={`text-sm font-bold ${mapping.subjects[h] ? 'text-blue-900' : 'text-gray-700'}`}>{h}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {rankSource === 'imported' && mapping.subjects[h] && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm animate-in fade-in slide-in-from-right-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{t('wizard.rank_col')}:</span>
                          <select 
                            value={mapping.subjectRanks[h] || ''} 
                            onChange={(e) => setMapping({...mapping, subjectRanks: { ...mapping.subjectRanks, [h]: e.target.value }})}
                            className="bg-transparent text-[10px] outline-none font-bold text-indigo-600"
                          >
                            <option value="">{t('wizard.not_specified')}</option>
                            {headers.map(head => <option key={head} value={head}>{head}</option>)}
                          </select>
                        </div>
                      )}
                      <input 
                        type="checkbox" 
                        checked={!!mapping.subjects[h]} 
                        onChange={(e) => {
                          const newSubs = { ...mapping.subjects };
                          if (e.target.checked) newSubs[h] = h;
                          else delete newSubs[h];
                          setMapping({...mapping, subjects: newSubs});
                        }}
                        className="w-5 h-5 rounded text-blue-600 cursor-pointer border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-8 flex justify-between items-center border-t border-gray-100">
        <button onClick={onCancel} className="text-gray-500 font-bold hover:text-gray-800 transition-colors">{t('wizard.btn_discard')}</button>
        <div className="flex gap-4">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="px-8 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> {t('wizard.btn_back')}
            </button>
          )}
          {step < 3 ? (
            <button disabled={files.length === 0} onClick={() => setStep(step + 1)} className="px-10 py-3 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2">
              {t('wizard.btn_continue')} <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button disabled={!isMappingValid || loading} onClick={handleFinalImport} className="px-12 py-3 rounded-xl bg-green-600 text-white font-bold disabled:opacity-50 hover:bg-green-700 shadow-lg shadow-green-100 transition-all flex items-center gap-2">
              {loading ? t('wizard.processing') : t('wizard.btn_confirm')} <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportWizard;
