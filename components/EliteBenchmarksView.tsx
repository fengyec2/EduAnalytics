import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, SelectInput } from './SharedComponents';
import { useTranslation } from '../context/LanguageContext';

interface EliteBenchmarksViewProps {
  selectedPeriod: string;
  classes: string[];
  benchmarkClass: string;
  setBenchmarkClass: (c: string) => void;
  kingsData: any[];
  duelData: any[];
}

const EliteBenchmarksView: React.FC<EliteBenchmarksViewProps> = ({ 
  selectedPeriod, classes, benchmarkClass, setBenchmarkClass, kingsData, duelData 
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">{t('kings.title')} ({selectedPeriod})</h3>
          <p className="text-xs text-gray-500">{t('kings.desc')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{t('kings.selector_prefix')}</span>
          <SelectInput 
            className="w-full md:w-auto"
            value={benchmarkClass}
            onChange={(e) => setBenchmarkClass(e.target.value)}
          >
            {classes.map(c => <option key={c} value={c}>{t('common.class')} {c}</option>)}
          </SelectInput>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title={`👑 ${t('kings.chart_kings_title').replace('{className}', benchmarkClass)}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kingsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
              <YAxis dataKey="subject" type="category" stroke="#94a3b8" fontSize={12} width={80} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" align="center" iconType="diamond" />
              <Bar dataKey="classMax" name={t('kings.legend_class_top')} fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              <Bar dataKey="gradeMax" name={t('kings.legend_grade_top')} fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title={`🔍 ${t('kings.chart_duel_title')}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={duelData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="classFirst" name={t('kings.legend_class_first').replace('{className}', benchmarkClass)} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="schoolFirst" name={t('kings.legend_school_first')} fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default EliteBenchmarksView;