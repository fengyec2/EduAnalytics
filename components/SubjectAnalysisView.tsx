
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Filter, Search, UserX, Info } from 'lucide-react';
import { ChartContainer } from './SharedComponents';

interface SubjectAnalysisViewProps {
  selectedPeriod: string;
  periodData: any[];
  subjects: string[];
  classes: string[];
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>;
  thresholds: Record<string, number>;
  thresholdType: 'rank' | 'percent';
  totalStudents: number;
}

const SubjectAnalysisView: React.FC<SubjectAnalysisViewProps> = ({
  selectedPeriod, periodData, subjects, classes, allSubjectRanks, thresholds, thresholdType, totalStudents
}) => {
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([classes[0]]);

  // 计算当前的特控线限制（作为未上线的界限）
  const teKongLimit = useMemo(() => {
    return thresholdType === 'rank' 
      ? thresholds['特控'] 
      : Math.round((thresholds['特控'] / 100) * totalStudents);
  }, [thresholds, thresholdType, totalStudents]);

  const distributionData = useMemo(() => {
    if (!selectedPeriod || !selectedSubject) return [];

    const subjectRanks = allSubjectRanks[selectedPeriod]?.[selectedSubject] || {};
    const filteredStudents = periodData.filter(s => selectedClasses.includes(s.class));

    // Calculate absolute limits based on threshold type
    const getLimit = (key: string) => {
      if (key === '未上线') return Infinity;
      return thresholdType === 'rank' 
        ? thresholds[key] 
        : Math.round((thresholds[key] / 100) * totalStudents);
    };

    const limits = {
      '清北': getLimit('清北'),
      'C9': getLimit('C9'),
      '高分数': getLimit('高分数'),
      '名校': getLimit('名校'),
      '特控': getLimit('特控'),
      '未上线': Infinity
    };

    // Calculate exclusive buckets
    const results = [
      { name: '清北线', count: 0, color: '#a855f7' },
      { name: 'C9线', count: 0, color: '#22c55e' },
      { name: '高分线', count: 0, color: '#3b82f6' },
      { name: '名校线', count: 0, color: '#94a3b8' },
      { name: '特控线', count: 0, color: '#eab308' },
      { name: '未上线', count: 0, color: '#ef4444' },
    ];

    filteredStudents.forEach(s => {
      const rank = subjectRanks[s.name];
      if (!rank) return;

      if (rank <= limits['清北']) results[0].count++;
      else if (rank <= limits['C9']) results[1].count++;
      else if (rank <= limits['高分数']) results[2].count++;
      else if (rank <= limits['名校']) results[3].count++;
      else if (rank <= limits['特控']) results[4].count++;
      else results[5].count++;
    });

    return results;
  }, [selectedPeriod, selectedSubject, selectedClasses, allSubjectRanks, thresholds, thresholdType, totalStudents, periodData]);

  // 提取未上线学生名单
  const belowLineStudents = useMemo(() => {
    if (!selectedPeriod || !selectedSubject) return [];
    
    const subjectRanks = allSubjectRanks[selectedPeriod]?.[selectedSubject] || {};
    
    return periodData
      .filter(s => selectedClasses.includes(s.class))
      .filter(s => {
        const rank = subjectRanks[s.name];
        return rank && rank > teKongLimit;
      })
      .map(s => ({
        name: s.name,
        rank: subjectRanks[s.name],
        class: s.class
      }))
      .sort((a, b) => a.rank - b.rank);
  }, [selectedPeriod, selectedSubject, selectedClasses, allSubjectRanks, teKongLimit, periodData]);

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(p => p !== cls) : [...prev, cls]
    );
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      {/* 筛选控制器 */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
        <div className="space-y-3 flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Search className="w-3 h-3" /> Select Subject
          </p>
          <div className="flex flex-wrap gap-2">
            {subjects.map(sub => (
              <button 
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedSubject === sub ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-300'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Filter className="w-3 h-3" /> Select Classes
          </p>
          <div className="flex flex-wrap gap-2">
            {classes.map(cls => (
              <button 
                key={cls}
                onClick={() => toggleClass(cls)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedClasses.includes(cls) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-300'}`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 柱状分布图 */}
      <ChartContainer title={`${selectedSubject} Distribution in Selected Classes (${selectedPeriod})`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              formatter={(value: number) => [`${value} 人`, '人数']}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50}>
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList dataKey="count" position="top" style={{ fill: '#64748b', fontSize: '12px', fontWeight: 'bold' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* 未上线名单展示 */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="px-8 py-6 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
              <UserX className="w-4 h-4" /> Focus List: Students Below Any Line
            </h3>
            <p className="text-[10px] text-rose-400 mt-1">
              当前 {selectedClasses.join(', ')} 班在 {selectedSubject} 科目共有 {belowLineStudents.length} 人未达上线标准
            </p>
          </div>
        </div>
        <div className="p-8">
          {belowLineStudents.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {belowLineStudents.map((s, idx) => (
                <div 
                  key={idx}
                  className="bg-white border border-rose-100 rounded-xl p-3 flex flex-col gap-1 hover:shadow-md transition-all hover:scale-[1.02]"
                >
                  <span className="text-sm font-bold text-gray-800">{s.name}</span>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">{s.class}</span>
                    <span className="text-rose-600 font-black">#{s.rank}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 italic">
              <Info className="w-8 h-8 mb-2 opacity-20 text-green-500" />
              <p className="text-sm">Great! No students in the selected group are below the thresholds for this subject.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-3">Analysis Insight</h4>
        <p className="text-sm text-blue-800 leading-relaxed">
          当前图表展示了所选班级在 <strong>{selectedSubject}</strong> 科目的上线情况分布。
          排名计算基于 <strong>{selectedPeriod}</strong> 全年级的单科排名。每个柱条代表仅存在于该名次区间的学生人数（即：清北线学生不包含在C9线统计中）。
        </p>
      </div>
    </div>
  );
};

export default SubjectAnalysisView;
