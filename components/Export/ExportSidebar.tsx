
import React from 'react';
import { 
  Calendar, Printer, Layers, 
  CheckSquare, Square, ChevronDown, 
  LayoutTemplate, Table as TableIcon, Trophy 
} from 'lucide-react';
import { SelectInput, FilterChip, SearchInput } from '../SharedComponents';
import { AnalysisState } from '../../types';
import { useTranslation } from '../../context/LanguageContext';

export type ExportTab = 'overall' | 'personal' | 'tables';

interface ExportSidebarProps {
  data: AnalysisState;
  allPeriods: string[];
  selectedPeriod: string;
  setSelectedPeriod: (v: string) => void;
  exportTab: ExportTab;
  setExportTab: (v: ExportTab) => void;
  sections: {
    overview: boolean;
    school: boolean;
    comparison: boolean;
    kings: boolean;
    parameters: boolean;
    subject: boolean;
  };
  toggleSection: (key: keyof ExportSidebarProps['sections']) => void;
  compClasses: string[];
  setCompClasses: (v: string[]) => void;
  benchmarkClass: string;
  setBenchmarkClass: (v: string) => void;
  exportSubjects: string[];
  setExportSubjects: (v: string[]) => void;
  indivClass: string;
  setIndivClass: (v: string) => void;
  selectedStudentIds: string[];
  setSelectedStudentIds: (v: string[] | ((prev: string[]) => string[])) => void;
  studentSearch: string;
  setStudentSearch: (v: string) => void;
  tableOptions: {
    rawScore: boolean;
    ranks: boolean;
    stats: boolean;
  };
  setTableOptions: (v: React.SetStateAction<{ rawScore: boolean; ranks: boolean; stats: boolean; }>) => void;
  handlePrint: () => void;
}

const ExportSidebar: React.FC<ExportSidebarProps> = ({
  data, allPeriods, selectedPeriod, setSelectedPeriod,
  exportTab, setExportTab, sections, toggleSection,
  compClasses, setCompClasses, benchmarkClass, setBenchmarkClass,
  exportSubjects, setExportSubjects, indivClass, setIndivClass,
  selectedStudentIds, setSelectedStudentIds, studentSearch, setStudentSearch,
  tableOptions, setTableOptions, handlePrint
}) => {
  const { t } = useTranslation();

  const toggleArrayItem = (item: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(item)) setter(current.filter(i => i !== item));
    else setter([...current, item]);
  };

  return (
    <div className="w-full lg:w-96 space-y-6 no-print shrink-0">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-24 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
        
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

        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setExportTab('overall')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${exportTab === 'overall' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t('export.tab_overall')}</button>
          <button onClick={() => setExportTab('personal')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${exportTab === 'personal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t('export.tab_personal')}</button>
          <button onClick={() => setExportTab('tables')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${exportTab === 'tables' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t('export.tab_tables')}</button>
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-3 h-3" /> {t('export.module_config')}
            </label>
            
            {exportTab === 'overall' && (
              <>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <button onClick={() => toggleSection('overview')} className={`flex items-center gap-3 w-full p-3 transition-colors ${sections.overview ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}>
                    {sections.overview ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                    <span className="text-sm font-bold">{t('export.section_overview')}</span>
                  </button>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <button onClick={() => toggleSection('school')} className={`flex items-center gap-3 w-full p-3 transition-colors ${sections.school ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}>
                    {sections.school ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                    <span className="text-sm font-bold">{t('tab.school')}</span>
                  </button>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <button onClick={() => toggleSection('comparison')} className={`flex items-center justify-between w-full p-3 transition-colors ${sections.comparison ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">{sections.comparison ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}<span className="text-sm font-bold">{t('tab.comparison')}</span></div>
                    {sections.comparison && <ChevronDown className="w-4 h-4 text-blue-400" />}
                  </button>
                  {sections.comparison && (
                     <div className="p-3 bg-blue-50/30 border-t border-blue-100 space-y-3">
                        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                          {data.classes.map(cls => (
                            <FilterChip key={cls} label={cls} active={compClasses.includes(cls)} onClick={() => toggleArrayItem(cls, compClasses, setCompClasses)} color="blue" className="text-[10px] px-2 py-0.5"/>
                          ))}
                        </div>
                     </div>
                  )}
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <button onClick={() => toggleSection('kings')} className={`flex items-center justify-between w-full p-3 transition-colors ${sections.kings ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">{sections.kings ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}<span className="text-sm font-bold">{t('tab.kings')}</span></div>
                    {sections.kings && <ChevronDown className="w-4 h-4 text-blue-400" />}
                  </button>
                  {sections.kings && (
                     <div className="p-3 bg-blue-50/30 border-t border-blue-100 space-y-2"><span className="text-[10px] font-bold text-gray-400 uppercase">{t('kings.selector_prefix')}</span><SelectInput value={benchmarkClass} onChange={(e) => setBenchmarkClass(e.target.value)} className="text-xs py-1.5">{data.classes.map(c => <option key={c} value={c}>{c}</option>)}</SelectInput></div>
                  )}
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <button onClick={() => toggleSection('subject')} className={`flex items-center justify-between w-full p-3 transition-colors ${sections.subject ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">{sections.subject ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}<span className="text-sm font-bold">{t('tab.subject')}</span></div>
                    {sections.subject && <ChevronDown className="w-4 h-4 text-blue-400" />}
                  </button>
                  {sections.subject && (
                     <div className="p-3 bg-blue-50/30 border-t border-blue-100 space-y-3">
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                          {data.subjects.map(s => <FilterChip key={s} label={s} active={exportSubjects.includes(s)} onClick={() => toggleArrayItem(s, exportSubjects, setExportSubjects)} color="indigo" className="text-[10px] px-2 py-0.5"/>)}
                        </div>
                     </div>
                  )}
                </div>
              </>
            )}

            {exportTab === 'personal' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('common.class')}</label>
                  <SelectInput value={indivClass} onChange={(e) => setIndivClass(e.target.value)} className="mt-1">
                    {data.classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </SelectInput>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('export.select_student')}</label>
                    <button 
                      onClick={() => {
                        const classStudents = data.students.filter(s => s.class === indivClass).map(s => s.id);
                        setSelectedStudentIds(prev => prev.length === classStudents.length ? [] : classStudents);
                      }}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      {t('export.select_all_class')}
                    </button>
                  </div>
                  <SearchInput value={studentSearch} onChange={setStudentSearch} placeholder="Filter students..." className="mb-2 text-xs" />
                  <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-xl bg-white p-2 space-y-1">
                    {data.students.filter(s => s.class === indivClass && s.name.toLowerCase().includes(studentSearch.toLowerCase())).map(s => (
                      <div key={s.id} onClick={() => toggleArrayItem(s.id, selectedStudentIds, setSelectedStudentIds as any)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${selectedStudentIds.includes(s.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>
                        {selectedStudentIds.includes(s.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-300" />}
                        <span className="text-xs font-bold">{s.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 text-right">{selectedStudentIds.length} selected</p>
                </div>
              </div>
            )}

            {exportTab === 'tables' && (
              <div className="space-y-2">
                {[
                  { id: 'rawScore', label: t('export.table_raw_score'), icon: LayoutTemplate },
                  { id: 'ranks', label: t('export.table_ranks'), icon: Trophy },
                  { id: 'stats', label: t('export.table_stats'), icon: TableIcon }
                ].map(opt => (
                  <button 
                    key={opt.id} 
                    onClick={() => setTableOptions(prev => ({ ...prev, [opt.id]: !prev[opt.id as keyof typeof tableOptions] }))}
                    className={`flex items-center justify-between w-full p-3 rounded-xl border transition-all ${tableOptions[opt.id as keyof typeof tableOptions] ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-gray-100 text-gray-600'}`}
                  >
                    <div className="flex items-center gap-3">
                      <opt.icon className="w-4 h-4" />
                      <span className="text-xs font-bold">{opt.label}</span>
                    </div>
                    {tableOptions[opt.id as keyof typeof tableOptions] && <CheckSquare className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
        </div>

        <button onClick={handlePrint} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg">
          <Printer className="w-4 h-4" /> {t('export.btn_print')}
        </button>
      </div>
    </div>
  );
};

export default ExportSidebar;
