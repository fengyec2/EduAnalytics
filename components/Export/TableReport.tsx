
import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface TableReportProps {
  excelConfig: {
    overview: boolean;
    school: boolean;
    comparison: boolean;
    kings: boolean;
    subjects: boolean;
    progress: boolean;
    raw: boolean;
  };
  periodData: any[];
}

const TableReport: React.FC<TableReportProps> = ({
  excelConfig,
  periodData
}) => {
  const { t } = useTranslation();

  const selectedCount = Object.values(excelConfig).filter(Boolean).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-6">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100">
        <FileSpreadsheet className="w-12 h-12 text-green-600" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-gray-900">Excel Export Ready</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          You are about to export a comprehensive data set containing <strong>{periodData.length}</strong> student records and <strong>{selectedCount}</strong> analysis modules.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-lg border border-gray-100 text-left">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Selected Sheets</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(excelConfig).map(([key, enabled]) => (
            <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${enabled ? 'text-gray-700 bg-white shadow-sm border border-gray-100' : 'text-gray-300 bg-gray-100'}`}>
              <CheckCircle2 className={`w-4 h-4 ${enabled ? 'text-green-500' : 'text-gray-300'}`} />
              <span className="text-sm font-bold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 font-medium">
        Configure modules on the left sidebar and click "Export Full Excel" to download.
      </p>
    </div>
  );
};

export default TableReport;
