
import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download, CheckCircle2, History, Layers, Calculator, BarChart3, TrendingUp, Target, Crown } from 'lucide-react';
import { AnalysisState } from '../types';
import { useTranslation } from '../context/LanguageContext';
import * as AnalysisEngine from '../utils/analysisUtils';

interface ExportViewProps {
  data: AnalysisState;
  selectedPeriod: string;
  selectedClasses: string[];
  allHistoricalRanks: Record<string, Record<string, number>>;
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>;
  examParameters: any;
  classComparisonData: any[];
  rankingDistributionData: any[];
  kingsData: any[];
  duelData: any[];
}

const ExportView: React.FC<ExportViewProps> = ({ 
  data, selectedPeriod, selectedClasses, allHistoricalRanks, allSubjectRanks, examParameters, classComparisonData, rankingDistributionData, kingsData, duelData 
}) => {
  const { t, language } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const [modules, setModules] = useState({
    school: true,
    comparison: true,
    kings: true,
    parameters: true,
    subject: true,
    progress: false,
    student: false
  });

  const toggleModule = (m: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [m]: !prev[m] }));
  };

  const handleExcelExport = () => {
    setIsExporting(true);
    try {
      const XLSX = (window as any).XLSX;
      const wb = XLSX.utils.book_new();

      // Sheet 1: Student Master Records (Latest Period)
      const periodRanks = allHistoricalRanks[selectedPeriod] || {};
      const studentData = data.students.map(s => {
        const historyItem = s.history.find(h => h.period === selectedPeriod);
        const row: any = {
          [t('progress.table_name')]: s.name,
          [t('common.class')]: s.class,
          [t('student.ledger_total')]: historyItem?.totalScore || 0,
          [t('common.rank')]: periodRanks[s.name] || '-',
          [t('student.ledger_status')]: historyItem?.status || '-'
        };
        data.subjects.forEach(sub => {
          row[sub] = historyItem?.scores[sub] || 0;
          row[`${sub}_${t('common.rank')}`] = allSubjectRanks[selectedPeriod]?.[sub]?.[s.name] || '-';
        });
        return row;
      });
      const wsStudents = XLSX.utils.json_to_sheet(studentData);
      XLSX.utils.book_append_sheet(wb, wsStudents, "Student_Data");

      // Sheet 2: Exam Parameters
      if (examParameters?.subjectStats) {
        const statsData = examParameters.subjectStats.map((s: any) => ({
          [t('common.subject')]: s.subject,
          [t('params.table_mean')]: s.mean,
          [t('params.table_max')]: s.max,
          [t('params.table_std_dev')]: s.stdDev,
          [t('params.table_difficulty')]: s.difficulty,
          [t('params.table_discrimination')]: s.discrimination,
          [t('params.valid_records')]: s.participants
        }));
        const wsStats = XLSX.utils.json_to_sheet(statsData);
        XLSX.utils.book_append_sheet(wb, wsStats, "Exam_Metrics");
      }

      // Sheet 3: Class Comparison Matrix
      const matrixData = classComparisonData.map(row => {
        const entry: any = { [t('common.subject')]: row.name };
        selectedClasses.forEach(cls => { entry[cls] = row[cls]; });
        return entry;
      });
      const wsMatrix = XLSX.utils.json_to_sheet(matrixData);
      XLSX.utils.book_append_sheet(wb, wsMatrix, "Class_Comparison");

      const filename = `${t('export.filename_data')}_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error(err);
      alert("Excel export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintReport = () => {
    // We utilize the browser's window.print()
    // In Dashboard.tsx, we'll need a "Report Mode" that renders all components vertically.
    // For now, this triggers the OS print dialog.
    window.print();
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 no-print">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{t('export.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('export.desc')}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">
              {data.students.length} {t('common.participants')} {t('export.status_ready')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PDF Report Option */}
          <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-white shadow-xl hover:scale-[1.02] transition-all cursor-default relative overflow-hidden group">
            <FileText className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <FileText className="w-6 h-6" /> {t('export.pdf_title')}
            </h3>
            <p className="text-sm opacity-80 mb-8 max-w-[280px]">{t('export.pdf_desc')}</p>
            
            <div className="space-y-4 mb-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t('export.config_sections')}</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(modules).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <input 
                      type="checkbox" 
                      checked={val} 
                      onChange={() => toggleModule(key as keyof typeof modules)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 checked:bg-white checked:border-white transition-all"
                    />
                    <span className="text-xs font-bold capitalize">{t(`tab.${key}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={handlePrintReport}
              className="w-full py-4 bg-white text-blue-600 font-black rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {t('export.btn_generate_pdf')}
            </button>
          </div>

          {/* Excel Export Option */}
          <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col h-full relative group overflow-hidden">
            <FileSpreadsheet className="w-24 h-24 text-emerald-100 absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform" />
            <div className="flex-1">
              <h3 className="text-xl font-black text-emerald-900 mb-2 flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" /> {t('export.excel_title')}
              </h3>
              <p className="text-sm text-emerald-700/70 mb-8 max-w-[280px]">{t('export.excel_desc')}</p>
              
              <div className="bg-white/50 border border-emerald-100 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
                  <span>Sheet 1: Student Grades</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
                  <span>Sheet 2: Subject Metrics</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
                  <span>Sheet 3: Class Matrices</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleExcelExport}
              disabled={isExporting}
              className="mt-8 w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700 hover:shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Exporting...' : t('export.btn_generate_excel')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Print Instructions */}
      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
        <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-3 flex items-center gap-2">
           💡 PDF 导出技巧
        </h4>
        <ul className="text-sm text-amber-800 space-y-2 list-disc pl-5">
          <li>点击“生成报告”后，在打印预览中选择“另存为 PDF”。</li>
          <li><b>重要：</b>请在打印设置中勾选“背景图形 (Background Graphics)”，以保留所有颜色和状态标注。</li>
          <li>建议将页面设置设为 A4，边距设为“无”或“默认”。</li>
          <li>该导出逻辑会自动移除网页交互按钮，确保报告呈现最纯净的分析内容。</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportView;
