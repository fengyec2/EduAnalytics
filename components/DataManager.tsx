
import React, { useState, useEffect, useMemo } from 'react';
import { Database, Plus, Trash2, GripVertical, AlertTriangle, CheckCircle2, FileSpreadsheet, Layers, Users, TrendingUp, Award, Info, X, BarChart, ChevronRight } from 'lucide-react';
import { AnalysisState, ExamEntity } from '../types';
import ImportWizard from './ImportWizard';
import { useTranslation } from '../context/LanguageContext';
import * as AnalysisEngine from '../utils/analysisUtils';

interface DataManagerProps {
  initialData: AnalysisState | null;
  onDataUpdated: (data: AnalysisState | null) => void;
}

const DataManager: React.FC<DataManagerProps> = ({ initialData, onDataUpdated }) => {
  const { t } = useTranslation();
  const [showWizard, setShowWizard] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedExamName, setSelectedExamName] = useState<string | null>(null);
  
  const [exams, setExams] = useState<ExamEntity[]>([]);

  useEffect(() => {
    if (!initialData || initialData.students.length === 0) {
      setExams([]);
      setSelectedExamName(null);
      return;
    }
    const allPeriods: string[] = Array.from(new Set(initialData.students.flatMap(s => s.history.map(h => h.period))));
    
    const examEntities: ExamEntity[] = allPeriods.map((period, idx) => {
      const representative = initialData.students.find(s => s.history.some(h => h.period === period))
        ?.history.find(h => h.period === period);
        
      return {
        id: `exam-${period}-${idx}`,
        name: period,
        weight: idx,
        isComplete: representative?.isComplete ?? true,
        fileCount: 1
      };
    });
    
    setExams(examEntities);
    
    if (!selectedExamName && examEntities.length > 0) {
      setSelectedExamName(examEntities[examEntities.length - 1].name);
    }
  }, [initialData]);

  const updateGlobalOrder = (newExams: ExamEntity[]) => {
    if (!initialData) return;

    const periodOrder = newExams.map(e => e.name);
    
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

  const handleDeleteExam = (examName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(t('manager.delete_confirm').replace('{name}', examName))) return;

    if (!initialData) return;

    const newStudents = initialData.students.map(s => ({
      ...s,
      history: s.history.filter(h => h.period !== examName)
    })).filter(s => s.history.length > 0);

    if (selectedExamName === examName) {
      setSelectedExamName(null);
    }

    if (newStudents.length === 0) {
      onDataUpdated(null);
    } else {
      const rawClasses = [...new Set(newStudents.map(s => s.class))];
      const newSubjects = [...new Set(newStudents.flatMap(s => Object.keys(s.history[0]?.scores || {})))];
      
      onDataUpdated({
        ...initialData,
        students: newStudents,
        classes: AnalysisEngine.sortClasses(rawClasses),
        subjects: newSubjects
      });
    }
  };

  const handleImportComplete = (newState: AnalysisState) => {
    onDataUpdated(newState);
    setShowWizard(false);
  };

  const selectedExamStats = useMemo(() => {
    if (!selectedExamName || !initialData) return null;

    const periodStudents = initialData.students
      .map(s => {
        const historyItem = s.history.find(h => h.period === selectedExamName);
        return historyItem ? { ...s, historyItem } : null;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    if (periodStudents.length === 0) return null;

    const totals = periodStudents.map(s => s.historyItem.totalScore);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const max = Math.max(...totals);
    const topStudent = periodStudents.find(s => s.historyItem.totalScore === max);
    const subjects = Object.keys(periodStudents[0].historyItem.scores);

    return {
      name: selectedExamName,
      participants: periodStudents.length,
      average: avg.toFixed(2),
      highest: max,
      topStudentName: topStudent?.name || 'N/A',
      subjects: subjects,
      classes: AnalysisEngine.sortClasses([...new Set(periodStudents.map(s => s.class))])
    };
  }, [selectedExamName, initialData]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">{t('manager.title')}</h2>
          <p className="text-sm text-gray-500">{t('manager.desc')}</p>
        </div>
        {!showWizard && (
          <button 
            onClick={() => setShowWizard(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-200 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            {t('manager.btn_import')}
          </button>
        )}
      </div>

      {showWizard ? (
        <ImportWizard onComplete={handleImportComplete} onCancel={() => setShowWizard(false)} currentData={initialData} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {exams.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{t('manager.no_data_title')}</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">{t('manager.no_data_desc')}</p>
                </div>
                <button 
                  onClick={() => setShowWizard(true)}
                  className="text-blue-600 font-bold hover:underline"
                >
                  {t('manager.launch_wizard')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-3 border border-blue-100">
                  <Info className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-xs text-blue-800 font-bold uppercase tracking-wider mb-0.5">{t('manager.manage_timeline')}</p>
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                      {t('manager.manage_timeline_desc')}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Layers className="w-4 h-4" /> {t('manager.timeline_title')}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400">{exams.length} {t('manager.records')}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {exams.map((exam, index) => (
                      <div 
                        key={exam.id} 
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                        onClick={() => setSelectedExamName(exam.name)}
                        className={`p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer ${draggedIndex === index ? 'opacity-40 bg-gray-100' : ''} ${selectedExamName === exam.name ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${selectedExamName === exam.name ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
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
                              {exam.isComplete ? t('manager.full_dataset') : t('manager.partial_dataset')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {selectedExamName === exam.name && <ChevronRight className="w-4 h-4 text-blue-400 animate-pulse" />}
                          <button 
                            onClick={(e) => handleDeleteExam(exam.name, e)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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

          <div className="lg:col-span-5">
            {selectedExamStats ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8 animate-in slide-in-from-right-4 duration-300 h-fit sticky top-24">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{selectedExamStats.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t('manager.details_title')}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedExamName(null)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('manager.stats_participants')}</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{selectedExamStats.participants}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-bold">{t('manager.records')}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('manager.stats_avg')}</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{selectedExamStats.average}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-bold">{t('manager.stats_cohort_mean')}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-blue-100 relative overflow-hidden group">
                  <Award className="w-16 h-16 text-blue-200/50 absolute -right-2 -bottom-2 rotate-12 group-hover:scale-110 transition-transform" />
                  <div className="flex items-center gap-2 text-indigo-600 mb-4">
                    <Award className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('manager.stats_top_perf')}</span>
                  </div>
                  <h4 className="text-2xl font-black text-indigo-900 leading-tight">{selectedExamStats.topStudentName}</h4>
                  <p className="text-sm font-bold text-indigo-600 mt-1">{t('manager.stats_score')}: {selectedExamStats.highest}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <BarChart className="w-3 h-3" /> {t('manager.stats_subject_coverage')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExamStats.subjects.map(sub => (
                      <span key={sub} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-3 h-3" /> {t('manager.stats_active_classes')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExamStats.classes.map(cls => (
                      <span key={cls} className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-500 uppercase">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <button 
                    onClick={(e) => handleDeleteExam(selectedExamStats.name, e)}
                    className="w-full py-3 rounded-xl border-2 border-rose-100 text-rose-600 font-bold text-sm hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('manager.btn_delete_exam')}
                  </button>
                </div>
              </div>
            ) : exams.length > 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center space-y-4 h-fit sticky top-24">
                <Info className="w-12 h-12 text-gray-300 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-400">{t('manager.select_exam_hint_title')}</h3>
                  <p className="text-xs text-gray-400 max-w-[200px] mx-auto">{t('manager.select_exam_hint_desc')}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManager;
