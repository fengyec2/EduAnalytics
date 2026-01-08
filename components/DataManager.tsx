
import React, { useState } from 'react';
import { Database, Plus, Trash2, GripVertical, AlertTriangle, CheckCircle2, FileSpreadsheet, Layers } from 'lucide-react';
import { AnalysisState, ExamEntity } from '../types';
import ImportWizard from './ImportWizard';

interface DataManagerProps {
  initialData: AnalysisState | null;
  onDataUpdated: (data: AnalysisState | null) => void;
}

const DataManager: React.FC<DataManagerProps> = ({ initialData, onDataUpdated }) => {
  const [showWizard, setShowWizard] = useState(false);
  const [exams, setExams] = useState<ExamEntity[]>(() => {
    if (!initialData) return [];
    // Extract exams from initialData.students[0].history
    const sampleHistory = initialData.students[0]?.history || [];
    return sampleHistory.map((h, idx) => ({
      id: `exam-${idx}`,
      name: h.period,
      weight: idx,
      isComplete: true,
      fileCount: 1
    }));
  });

  const handleDeleteExam = (examName: string) => {
    if (!confirm(`Are you sure you want to delete "${examName}"?`)) return;

    if (!initialData) return;

    const newStudents = initialData.students.map(s => ({
      ...s,
      history: s.history.filter(h => h.period !== examName)
    })).filter(s => s.history.length > 0);

    if (newStudents.length === 0) {
      onDataUpdated(null);
      setExams([]);
    } else {
      const newClasses = [...new Set(newStudents.map(s => s.class))];
      const newSubjects = [...new Set(newStudents.flatMap(s => Object.keys(s.history[0]?.scores || {})))];
      
      onDataUpdated({
        ...initialData,
        students: newStudents,
        classes: newClasses,
        subjects: newSubjects
      });
      setExams(prev => prev.filter(e => e.name !== examName));
    }
  };

  const handleImportComplete = (newState: AnalysisState) => {
    onDataUpdated(newState);
    setShowWizard(false);
    
    // Update local exam list
    const sampleHistory = newState.students[0]?.history || [];
    setExams(sampleHistory.map((h, idx) => ({
      id: `exam-${idx}`,
      name: h.period,
      weight: idx,
      isComplete: true,
      fileCount: 1
    })));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Exam Data Management</h2>
          <p className="text-sm text-gray-500">Import, clean, and organize your academic records.</p>
        </div>
        {!showWizard && (
          <button 
            onClick={() => setShowWizard(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-200 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Import New Data
          </button>
        )}
      </div>

      {showWizard ? (
        <ImportWizard onComplete={handleImportComplete} onCancel={() => setShowWizard(false)} currentData={initialData} />
      ) : (
        <div className="space-y-4">
          {exams.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">No Data Imported Yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Use the import wizard to upload Excel files and start analyzing student performance.</p>
              </div>
              <button 
                onClick={() => setShowWizard(true)}
                className="text-blue-600 font-bold hover:underline"
              >
                Launch Import Wizard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-3 border border-blue-100">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  <strong>Notice:</strong> The order of exams here determines the timeline in your charts. 
                  Drag and drop sorting feature is coming soon to help you refine your academic story.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Active Exam Timeline
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400">{exams.length} Records</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {exams.map((exam, index) => (
                    <div key={exam.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-gray-300 cursor-grab active:cursor-grabbing" />
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-black text-gray-400">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            {exam.name}
                            {exam.isComplete ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                            )}
                          </h4>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                            {exam.isComplete ? 'Complete Cohort' : 'Partial Sample'} • {exam.fileCount} Files
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteExam(exam.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Exam Record"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataManager;
