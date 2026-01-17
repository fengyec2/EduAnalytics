
import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle, Files, CheckCircle2 } from 'lucide-react';
import { StudentRecord, AnalysisState, ScoreSnapshot } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: AnalysisState) => void;
  setLoading: (loading: boolean) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, setLoading }) => {
  const [dragActive, setDragActive] = useState(false);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    const sortedFiles = Array.from(files).sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    const studentMap = new Map<string, { class: string; history: ScoreSnapshot[] }>();
    const allSubjects = new Set<string>();

    try {
      const filePromises = sortedFiles.map(file => {
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          const periodName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

          reader.onload = (evt) => {
            try {
              const bstr = evt.target?.result;
              // Fixed: Added explicit casting to any to access global XLSX and resolve compilation errors.
              const wb = (window as any).XLSX.read(bstr, { type: 'binary' });
              const ws = wb.Sheets[wb.SheetNames[0]];
              // Fixed: Added explicit casting to any to access global XLSX and resolve compilation errors.
              const data = (window as any).XLSX.utils.sheet_to_json(ws);

              if (data.length === 0) {
                resolve();
                return;
              }

              const keys = Object.keys(data[0] as object);
              const nameCol = keys.find(k => k.includes('名') || k.toLowerCase().includes('name')) || keys[0];
              const classCol = keys.find(k => k.includes('班') || k.toLowerCase().includes('class')) || keys[1];
              const subjectCols = keys.filter(k => k !== nameCol && k !== classCol);
              
              subjectCols.forEach(s => allSubjects.add(s));

              data.forEach((row: any) => {
                const name = String(row[nameCol]);
                const className = String(row[classCol]);
                const scores: Record<string, number> = {};
                let total = 0;
                subjectCols.forEach(sub => {
                  const score = parseFloat(row[sub]) || 0;
                  scores[sub] = score;
                  total += score;
                });

                const snapshot: ScoreSnapshot = {
                  period: periodName,
                  scores,
                  totalScore: total,
                  averageScore: total / subjectCols.length
                };

                if (!studentMap.has(name)) {
                  studentMap.set(name, { class: className, history: [] });
                }
                studentMap.get(name)?.history.push(snapshot);
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsBinaryString(file);
        });
      });

      await Promise.all(filePromises);

      const subjects = Array.from(allSubjects);
      const students: StudentRecord[] = Array.from(studentMap.entries()).map(([name, info], index) => {
        const history = info.history;
        const latest = history[history.length - 1];
        return {
          id: `s-${index}`,
          name,
          class: info.class,
          scores: latest.scores,
          totalScore: latest.totalScore,
          averageScore: latest.averageScore,
          history: history
        };
      });

      if (students.length === 0) throw new Error("No student data found");

      // 仅负责生成基础结构，复杂统计留给 Dashboard 实时计算
      onDataLoaded({
        students,
        subjects,
        classes: [...new Set(students.map(s => s.class))],
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
      alert("Error processing files. Please ensure they are valid Excel tables.");
    } finally {
      setLoading(false);
    }
  }, [onDataLoaded, setLoading]);

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  return (
    <div 
      className={`relative flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-2xl bg-white/60 backdrop-blur-xl shadow-sm transition-all duration-300 ${
        dragActive ? 'border-blue-600 bg-blue-50/60 scale-[1.01]' : 'border-blue-200 hover:border-blue-400'
      }`}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
    >
      <div className="bg-blue-50/50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm">
        <Files className="w-12 h-12 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Import Multiple Exams</h3>
      <p className="text-gray-500 text-center max-w-sm mb-6 text-sm">
        Select all your exam Excel files at once. We'll automatically merge records and build a chronological timeline for each student.
      </p>
      
      <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all flex items-center gap-2 active:scale-95">
        <Upload className="w-5 h-5" />
        Select Files
        <input 
          type="file" 
          className="hidden" 
          accept=".xlsx, .xls" 
          multiple 
          onChange={(e) => processFiles(e.target.files)} 
        />
      </label>
    </div>
  );
};

export default FileUpload;
