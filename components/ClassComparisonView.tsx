
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, Table as TableIcon, Users, Trophy, BarChart2 } from 'lucide-react';
import { ChartContainer } from './SharedComponents';

interface ClassComparisonViewProps {
  selectedPeriod: string;
  classes: string[];
  selectedClasses: string[];
  setSelectedClasses: React.Dispatch<React.SetStateAction<string[]>>;
  classComparisonData: any[]; // 格式: [{ name: 'Math', 'Class 1': 90, ... }]
  rankingDistributionData: any[]; // 格式: [{ name: 'Top 10', 'Class 1': 2, ... }]
  colors: string[];
  periodData: any[]; // 需要原始数据来计算班级总均分等额外指标
}

const ClassComparisonView: React.FC<ClassComparisonViewProps> = ({ 
  selectedPeriod, classes, selectedClasses, setSelectedClasses, classComparisonData, rankingDistributionData, colors, periodData 
}) => {
  
  // 计算班级汇总统计数据
  const classSummaries = useMemo(() => {
    return selectedClasses.map(cls => {
      const clsStudents = periodData.filter(s => s.class === cls);
      const totalAvg = clsStudents.length > 0 
        ? clsStudents.reduce((acc, s) => acc + s.currentTotal, 0) / clsStudents.length 
        : 0;
      
      return {
        className: cls,
        count: clsStudents.length,
        average: parseFloat(totalAvg.toFixed(2))
      };
    });
  }, [selectedClasses, periodData]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      {/* 班级选择器 */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Filter className="w-3 h-3" /> Select Classes to Compare ({selectedPeriod})
        </p>
        <div className="flex flex-wrap gap-2">
          {classes.map(cls => (
            <button 
              key={cls}
              onClick={() => setSelectedClasses(prev => prev.includes(cls) ? prev.filter(p => p !== cls) : [...prev, cls])}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedClasses.includes(cls) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-300'}`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* 班级绩效对比矩阵 - 新增功能 */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <TableIcon className="w-4 h-4" /> Class Performance Matrix
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest border-r border-gray-50 min-w-[180px]">Metric</th>
                {selectedClasses.map((cls, idx) => (
                  <th key={cls} className="px-8 py-6 text-center border-r border-gray-50 min-w-[160px]" style={{ borderTop: `4px solid ${colors[idx % colors.length]}` }}>
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-black text-gray-900">{cls}</span>
                      <span className="text-[10px] text-gray-400 uppercase mt-1">Cohort Group</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* 基础概况 */}
              <tr className="bg-blue-50/20">
                <td className="px-8 py-4 font-bold text-blue-700 flex items-center gap-2"><Users className="w-3 h-3"/> Students Count</td>
                {classSummaries.map((s, idx) => (
                  <td key={idx} className="px-8 py-4 text-center font-black text-gray-700">{s.count}</td>
                ))}
              </tr>
              <tr className="bg-indigo-50/20">
                <td className="px-8 py-4 font-bold text-indigo-700 flex items-center gap-2"><Trophy className="w-3 h-3"/> Total Average</td>
                {classSummaries.map((s, idx) => (
                  <td key={idx} className="px-8 py-4 text-center font-black text-indigo-600 text-xl">{s.average}</td>
                ))}
              </tr>
              
              {/* 学科均分细项 */}
              <tr className="bg-gray-50/30">
                <td colSpan={selectedClasses.length + 1} className="px-8 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject Average Breakdowns</td>
              </tr>
              {classComparisonData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-4 text-gray-600 font-medium">{row.name} (Avg)</td>
                  {selectedClasses.map((cls, colIdx) => (
                    <td key={colIdx} className="px-8 py-4 text-center text-gray-800 font-bold">{row[cls] || '-'}</td>
                  ))}
                </tr>
              ))}

              {/* 分段人数分布 */}
              <tr className="bg-gray-50/30">
                <td colSpan={selectedClasses.length + 1} className="px-8 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank Distribution (Headcount)</td>
              </tr>
              {rankingDistributionData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-4 text-gray-600 font-medium">{row.name} Count</td>
                  {selectedClasses.map((cls, colIdx) => (
                    <td key={colIdx} className="px-8 py-4 text-center">
                      <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-700">
                        {row[cls] || 0}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 原有图表展示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Visual Average Comparison">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classComparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" align="right" />
              {selectedClasses.map((cls, idx) => (
                <Bar key={cls} dataKey={cls} fill={colors[idx % colors.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Ranking Density Comparison">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankingDistributionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" align="right" />
              {selectedClasses.map((cls, idx) => (
                <Bar key={cls} dataKey={cls} fill={colors[idx % colors.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default ClassComparisonView;
