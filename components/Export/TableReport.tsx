
import React from 'react';
import { useTranslation } from '../../context/LanguageContext';

interface TableReportProps {
  tableOptions: {
    rawScore: boolean;
    ranks: boolean;
    stats: boolean;
  };
  periodData: any[];
  subjects: string[];
  selectedPeriod: string;
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>;
}

const TableReport: React.FC<TableReportProps> = ({
  tableOptions,
  periodData,
  subjects,
  selectedPeriod,
  allSubjectRanks
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {tableOptions.rawScore && (
        <section className="print-break-inside-avoid">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">{t('export.table_raw_score')}</h3>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-800 text-white font-bold uppercase">
                <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Class</th>{subjects.map(s => <th key={s} className="px-2 py-2 text-center">{s}</th>)}<th className="px-3 py-2 text-center">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {periodData.slice(0, 50).map((s, i) => (
                  <tr key={i} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-3 py-2 font-bold">{s.name}</td>
                    <td className="px-3 py-2">{s.class}</td>
                    {subjects.map(sub => <td key={sub} className="px-2 py-2 text-center">{s.currentScores[sub]}</td>)}
                    <td className="px-3 py-2 text-center font-bold">{s.currentTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-gray-400 p-2 text-center italic">* Displaying top 50 records. Full export available via CSV.</p>
          </div>
        </section>
      )}
      {tableOptions.ranks && (
        <section className="print-break-inside-avoid">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">{t('export.table_ranks')}</h3>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-indigo-900 text-white font-bold uppercase">
                <tr><th className="px-3 py-2">Name</th>{subjects.map(s => <th key={s} className="px-2 py-2 text-center">{s} Rank</th>)}<th className="px-3 py-2 text-center">Total Rank</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {periodData.slice(0, 50).map((s, i) => (
                  <tr key={i} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-3 py-2 font-bold">{s.name}</td>
                    {subjects.map(sub => <td key={sub} className="px-2 py-2 text-center text-gray-500">{allSubjectRanks[selectedPeriod]?.[sub]?.[s.name]}</td>)}
                    <td className="px-3 py-2 text-center font-bold text-indigo-600">#{s.periodSchoolRank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default TableReport;
