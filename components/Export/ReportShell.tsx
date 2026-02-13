
import React, { ReactNode } from 'react';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

interface ReportShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const ReportShell: React.FC<ReportShellProps> = ({ title, subtitle, children }) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 bg-white min-h-screen lg:rounded-3xl lg:shadow-xl lg:border lg:border-gray-100 print-shadow-none overflow-hidden print:w-full print:block print:overflow-visible print:min-h-0">
      <div className="p-8 border-b border-gray-100 flex justify-between items-end bg-gray-50/30">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <GraduationCap className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">EduAnalytics Pro</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">
            {title}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">{t('export.report_generated')}</p>
          <p className="text-sm font-bold text-gray-700">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="p-8">
        {children}
      </div>

      <div className="p-8 border-t border-gray-100 mt-auto bg-gray-50/50 print:bg-white print:border-none print:hidden">
        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {t('export.report_footer')} • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default ReportShell;
