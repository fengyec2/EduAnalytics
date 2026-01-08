
import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, GripVertical, AlertTriangle, CheckCircle2, FileSpreadsheet, Layers } from 'lucide-react';
import { AnalysisState, ExamEntity } from '../types';
import ImportWizard from './ImportWizard';

interface DataManagerProps {
  initialData: AnalysisState | null;
  onDataUpdated: (data: AnalysisState | null) => void;
}

const DataManager: React.FC<DataManagerProps> = ({ initialData, onDataUpdated }) => {
  const [showWizard, setShowWizard] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Local state for exams, initialized from data
  const [exams, setExams] = useState<ExamEntity[]>([]);

  // Sync local exams with initialData if it changes externally
  useEffect(() => {
    if (!initialData || initialData.students.length === 0) {
      setExams([]);
      return;
    }
    // We use the first student's history as the source of truth for the exam list/order
    const sampleHistory = initialData.students[0].history || [];
    setExams(sampleHistory.map((h, idx) => ({
      id: `exam-${h.period}-${idx}`,
      name: h.period,
      weight: idx,
      isComplete: h.isComplete ?? true,
      fileCount: 1
    })));
  }, [initialData]);

  const updateGlobalOrder = (newExams: ExamEntity[]) => {
    if (!initialData) return;

    const periodOrder = newExams.map(e => e.name);
    
    // Create new students array where each student's history is sorted by the new period order
    const updatedStudents = initialData.students.map(student => ({
      ...student,
      history: [...student.history].sort((a, b) => 
        periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period)
      )
    }));

    onDataUpdated({
      ...initialData,
      students: updatedStudents
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const newExams = [...exams];
    const [movedItem] = newExams.splice(draggedIndex, 1);
    newExams.splice(index, 0, movedItem);
    
    setExams(newExams);
    setDraggedIndex(null);
    updateGlobalOrder(newExams);
  };

  const handleDeleteExam = (examName: string) => {
    if (!confirm(`Are you sure you want to delete "${examName}"?`)) return;

    if (!initialData) return;

    const newStudents = initialData.students.map(s => ({
      ...s,
      history: s.history.filter(h => h.period !== examName)
    })).filter(s => s.history.length > 0);

    if (newStudents.length === 0) {
      onDataUpdated(null);
    } else {
      const newClasses = [...new Set(newStudents.map(s => s.class))];
      const newSubjects = [...new Set(newStudents.flatMap(s => Object.keys(s.history[0]?.scores || {})))];
      
      onDataUpdated({
        ...initialData,
        students: newStudents,
        classes: newClasses,
        subjects: newSubjects
      });
    }
  };

  const handleImportComplete = (newState: AnalysisState) => {
    onDataUpdated(newState);
    setShowWizard(false);
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
                  <strong>Chronology Management:</strong> Drag the handles below to reorder exams. This determines the timeline of student progress charts.
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
                    <div 
                      key={exam.id} 
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      className={`p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-default ${draggedIndex === index ? 'opacity-40 bg-gray-100' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                        </div>
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
