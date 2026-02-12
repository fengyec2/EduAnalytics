
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sigma, Activity } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface ExamParametersViewProps {
  selectedPeriod: string;
  examParameters: any;
  colors: string[];
  totalParticipants: number;
}

const ExamParametersView: React.FC<ExamParametersViewProps> = ({ 
  selectedPeriod, examParameters, colors, totalParticipants 
}) => {
  const { t } = useTranslation();
  if (!examParameters) return null;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl">
          <Sigma className="w-10 h-10 mb-4 opacity-50" />
          <h3 className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">{t('params.reliability_title')}</h3>
          <p className="text-5xl font-black mb-4">{examParameters.reliability}</p>
          <p className="text-xs opacity-80 leading-relaxed">
            {t('params.reliability_desc')}
          </p>
          <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-xs">
            <span>{t('params.reliability_method')}</span>
            <span className="font-bold px-2 py-1 bg-white/10 rounded-lg">
              {examParameters.reliability >= 0.7 ? t('params.reliability_stable') : t('params.reliability_unstable')}
            </span>
          </div>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{t('params.difficulty_discrimination')}</p>
             <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="difficulty" name="Difficulty" domain={[0, 1]} stroke="#475569" fontSize={10} label={{ value: 'Easier ->', position: 'insideBottom', offset: -5, fill: '#475569' }} tick={{ fill: '#475569' }} />
                    <YAxis type="number" dataKey="discrimination" name="Discrimination" domain={[0, 1]} stroke="#475569" fontSize={10} label={{ value: 'Better ->', angle: -90, position: 'insideLeft', fill: '#475569' }} tick={{ fill: '#475569' }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Subjects" data={examParameters.subjectStats} fill="#3b82f6">
                      {examParameters.subjectStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center text-center">
             <Activity className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
             <h4 className="text-sm font-bold text-gray-800">{t('params.total_participants')}</h4>
             <p className="text-4xl font-black text-indigo-600">{totalParticipants}</p>
             <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{t('params.valid_records')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Sigma className="w-4 h-4" /> {t('params.matrix_title')} ({selectedPeriod})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white text-gray-400 font-bold border-b border-gray-100">
                <th className="px-8 py-5">{t('common.subject')}</th>
                <th className="px-6 py-5 text-center">{t('params.table_max')}</th>
                <th className="px-6 py-5 text-center">{t('params.table_mean')}</th>
                <th className="px-6 py-5 text-center">{t('params.table_median')}</th>
                <th className="px-6 py-5 text-center">{t('params.table_mode')}</th>
                <th className="px-6 py-5 text-center">{t('params.table_std_dev')}</th>
                <th className="px-6 py-5 text-center bg-blue-50/30 text-blue-700">{t('params.table_difficulty')}</th>
                <th className="px-6 py-5 text-center bg-indigo-50/30 text-indigo-700">{t('params.table_discrimination')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {examParameters.subjectStats.map((s: any, i: number) => (
                <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-8 py-5 font-bold text-gray-700">{s.subject}</td>
                  <td className="px-6 py-5 text-center text-gray-600 font-medium">{s.max}</td>
                  <td className="px-6 py-5 text-center text-gray-900 font-bold">{s.mean}</td>
                  <td className="px-6 py-5 text-center text-gray-600">{s.median}</td>
                  <td className="px-6 py-5 text-center text-gray-600">{s.mode}</td>
                  <td className="px-6 py-5 text-center text-gray-600">{s.stdDev}</td>
                  <td className="px-6 py-5 text-center bg-blue-50/20">
                    <span className={`px-2 py-1 rounded-lg font-bold text-xs ${s.difficulty > 0.8 ? 'text-green-600 bg-green-50' : s.difficulty < 0.4 ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'}`}>
                      {s.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center bg-indigo-50/20">
                    <span className={`px-2 py-1 rounded-lg font-bold text-xs ${s.discrimination > 0.4 ? 'text-green-600 bg-green-50' : s.discrimination < 0.2 ? 'text-red-600 bg-red-50' : 'text-indigo-600 bg-indigo-50'}`}>
                      {s.discrimination}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamParametersView;
