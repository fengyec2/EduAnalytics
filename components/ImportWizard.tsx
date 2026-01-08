
import React, { useState, useCallback, useMemo } from 'react';
import { Upload, X, ArrowRight, ArrowLeft, Database, Settings2, Table, CheckCircle2, AlertCircle, FileText, LayoutGrid } from 'lucide-react';
import { AnalysisState, ImportMode, DataStructure, RankSource, ColumnMapping, StudentRecord, ScoreSnapshot } from '../types';

interface ImportWizardProps {
  onComplete: (data: AnalysisState) => void;
  onCancel: () => void;
  currentData: AnalysisState | null;
}

const ImportWizard: React.FC<ImportWizardProps> = ({ onComplete, onCancel, currentData }) => {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<ImportMode>('complete');
  const [structure, setStructure] = useState<DataStructure>('multi-file-single');
  const [rankSource, setRankSource] = useState<RankSource>('recalculate');
  
  const [excelData, setExcelData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    class: '',
    subjects: {},
    subjectRanks: {}
  });

  const [loading, setLoading] = useState(false);

  // Step 1: Upload Logic
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    // Explicitly cast to File[] to resolve potential 'unknown' inference issues.
    const newFiles = Array.from(e.target.files) as File[];
    setFiles(prev => [...prev, ...newFiles]);
    
    // Preview headers from first file
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      // Fixed: Casting window to any to access global XLSX property and resolve compilation error.
      const wb = (window as any).XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // Fixed: Casting window to any to access global XLSX property and resolve compilation error.
      const data = (window as any).XLSX.utils.sheet_to_json(ws);
      if (data.length > 0) {
        const foundHeaders = Object.keys(data[0] as object);
        setHeaders(foundHeaders);
        setExcelData(data);
        
        // Auto-mapping heuristics
        const autoMapping = { ...mapping };
        foundHeaders.forEach(h => {
          const lower = h.toLowerCase();
          if (lower.includes('名') || lower.includes('name')) autoMapping.name = h;
          if (lower.includes('班') || lower.includes('class')) autoMapping.class = h;
          // Subjects usually don't have "rank" or "id" in them
          if (!lower.includes('名') && !lower.includes('次') && !lower.includes('号') && !lower.includes('学') && h !== autoMapping.name && h !== autoMapping.class) {
             autoMapping.subjects[h] = h;
          }
        });
        setMapping(autoMapping);
      }
    };
    // Ensure the first file exists and is a valid Blob before reading.
    if (newFiles.length > 0) {
      reader.readAsBinaryString(newFiles[0]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Step 3: Execution Logic
  const handleFinalImport = async () => {
    setLoading(true);
    try {
      const allSubjects = Object.keys(mapping.subjects);
      const studentMap = new Map<string, { class: string; history: ScoreSnapshot[] }>();
      
      // Initialize with existing data if any
      if (currentData) {
        currentData.students.forEach(s => {
          studentMap.set(s.name, { class: s.class, history: [...s.history] });
        });
      }

      // Process each file
      for (const file of files) {
        const reader = new FileReader();
        const periodName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

        const content = await new Promise<any[]>((resolve) => {
          reader.onload = (e) => {
            // Fixed: Casting window to any to access global XLSX property and resolve compilation error.
            const wb = (window as any).XLSX.read(e.target?.result, { type: 'binary' });
            // Fixed: Casting window to any to access global XLSX property and resolve compilation error.
            resolve((window as any).XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
          };
          reader.readAsBinaryString(file);
        });

        content.forEach((row: any) => {
          const name = String(row[mapping.name]);
          const className = String(row[mapping.class]);
          if (!name || name === 'undefined') return;

          const scores: Record<string, number> = {};
          const ranks: Record<string, number> = {};
          let total = 0;

          allSubjects.forEach(sub => {
            const score = parseFloat(row[mapping.subjects[sub]]) || 0;
            scores[sub] = score;
            total += score;
            if (rankSource === 'imported' && mapping.subjectRanks[sub]) {
              ranks[sub] = parseInt(row[mapping.subjectRanks[sub]]) || 0;
            }
          });

          const snapshot: ScoreSnapshot = {
            period: periodName,
            scores,
            ranks: rankSource === 'imported' ? ranks : undefined,
            totalScore: total,
            averageScore: total / allSubjects.length,
            schoolRank: rankSource === 'imported' && mapping.totalRank ? parseInt(row[mapping.totalRank]) : undefined,
            isComplete: mode === 'complete'
          };

          if (!studentMap.has(name)) {
            studentMap.set(name, { class: className, history: [] });
          }
          const info = studentMap.get(name)!;
          // Avoid duplicate periods for same student
          const existingIdx = info.history.findIndex(h => h.period === periodName);
          if (existingIdx >= 0) {
            info.history[existingIdx] = snapshot;
          } else {
            info.history.push(snapshot);
          }
        });
      }

      const students: StudentRecord[] = Array.from(studentMap.entries()).map(([name, info], index) => {
        // Sort history by name for now, or use file weight
        const history = info.history.sort((a, b) => a.period.localeCompare(b.period));
        const latest = history[history.length - 1];
        return {
          id: `s-${index}`,
          name,
          class: info.class,
          scores: latest.scores,
          totalScore: latest.totalScore,
          averageScore: latest.averageScore,
          history
        };
      });

      const finalClasses = [...new Set(students.map(s => s.class))];
      const finalSubjects = allSubjects;

      onComplete({
        students,
        subjects: finalSubjects,
        classes: finalClasses,
        schoolStats: {
          average: students.reduce((acc, s) => acc + s.totalScore, 0) / students.length,
          max: Math.max(...students.map(s => s.totalScore)),
          min: Math.min(...students.map(s => s.totalScore)),
          subjectStats: {},
          distribution: []
        }
      });
    } catch (err) {
      console.error(err);
      alert("Error processing files. Please ensure mapping is correct.");
    } finally {
      setLoading(false);
    }
  };

  const isMappingValid = mapping.name && mapping.class && Object.keys(mapping.subjects).length > 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="flex border-b border-gray-50">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex-1 py-4 text-center text-[10px] font-black uppercase tracking-widest transition-colors ${step >= i ? 'text-blue-600 bg-blue-50/50' : 'text-gray-300'}`}>
            Step {i}: {i === 1 ? 'Upload' : i === 2 ? 'Config' : 'Mapping'}
          </div>
        ))}
      </div>

      <div className="p-8 min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center relative group hover:border-blue-400 transition-all">
              <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-gray-800">Drop your Excel files here</h3>
              <p className="text-sm text-gray-400">Supported formats: .xlsx, .xls</p>
            </div>
            {files.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((f, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-xl flex items-center justify-between border border-gray-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{f.name}</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid className="w-3 h-3" /> Data Scope
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setMode('complete')} className={`p-4 rounded-2xl border text-left transition-all ${mode === 'complete' ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-800 text-sm">Full Cohort Data</span>
                      {mode === 'complete' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[10px] text-gray-500">Dataset contains entire school/grade records.</p>
                  </button>
                  <button onClick={() => setMode('incomplete')} className={`p-4 rounded-2xl border text-left transition-all ${mode === 'incomplete' ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-800 text-sm">Partial/Class Sample</span>
                      {mode === 'incomplete' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[10px] text-gray-500">Dataset only contains specific groups or missing students.</p>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 className="w-3 h-3" /> Calculation Logic
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setRankSource('recalculate')} className={`p-4 rounded-2xl border text-left transition-all ${rankSource === 'recalculate' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-800 text-sm">Recalculate Rankings</span>
                      {rankSource === 'recalculate' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[10px] text-gray-500">System generates new ranks based on scores.</p>
                  </button>
                  <button onClick={() => setRankSource('imported')} className={`p-4 rounded-2xl border text-left transition-all ${rankSource === 'imported' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-800 text-sm">Use Imported Ranks</span>
                      {rankSource === 'imported' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[10px] text-gray-500">Directly use ranking data from the Excel files.</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <p className="text-[11px] text-yellow-800 leading-relaxed font-medium">
                Map your Excel column headers to system fields. Required fields are Name, Class, and at least one Subject.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Identity</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">Student Name</span>
                    <select value={mapping.name} onChange={(e) => setMapping({...mapping, name: e.target.value})} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Column...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">Class Label</span>
                    <select value={mapping.class} onChange={(e) => setMapping({...mapping, class: e.target.value})} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Column...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Stats</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">School-wide Rank</span>
                    <select 
                      disabled={rankSource === 'recalculate'}
                      value={mapping.totalRank} 
                      onChange={(e) => setMapping({...mapping, totalRank: e.target.value})} 
                      className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">(Optional/None)</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                <span>Subject Mapping</span>
                <span className="text-blue-600 normal-case font-bold">{Object.keys(mapping.subjects).length} Subjects Mapped</span>
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {headers.filter(h => h !== mapping.name && h !== mapping.class && !h.includes('名') && !h.includes('位')).map(h => (
                  <div key={h} className="bg-gray-50 p-3 rounded-xl flex items-center justify-between border border-gray-100 hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-3">
                      <Table className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-700">{h}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 mr-4">
                        <input 
                          type="checkbox" 
                          checked={!!mapping.subjects[h]} 
                          onChange={(e) => {
                            const newSubs = { ...mapping.subjects };
                            if (e.target.checked) newSubs[h] = h;
                            else delete newSubs[h];
                            setMapping({...mapping, subjects: newSubs});
                          }}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span className="text-[10px] font-bold text-gray-400">Include</span>
                      </div>
                      {rankSource === 'imported' && (
                        <select 
                          value={mapping.subjectRanks[h] || ''} 
                          onChange={(e) => {
                            const newRanks = { ...mapping.subjectRanks };
                            newRanks[h] = e.target.value;
                            setMapping({...mapping, subjectRanks: newRanks});
                          }}
                          className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-[10px] outline-none"
                        >
                          <option value="">Map Rank Column...</option>
                          {headers.map(head => <option key={head} value={head}>{head}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-6 flex justify-between items-center">
        <button onClick={onCancel} className="text-gray-500 font-bold hover:text-gray-800 px-4 py-2 transition-all">Cancel</button>
        <div className="flex gap-4">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-white transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < 3 ? (
            <button 
              disabled={files.length === 0}
              onClick={() => setStep(step + 1)} 
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              disabled={!isMappingValid || loading}
              onClick={handleFinalImport}
              className={`flex items-center gap-2 px-10 py-2.5 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 ${loading ? 'animate-pulse' : ''}`}
            >
              {loading ? 'Processing...' : 'Complete Import'} <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportWizard;
