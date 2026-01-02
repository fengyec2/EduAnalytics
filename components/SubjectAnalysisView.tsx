
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Filter, Search } from 'lucide-react';
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

  const admissionBuckets = [
    { key: '清北', label: '清北线', color: '#a855f7' }, // Purple
    { key: 'C9', label: 'C9线', color: '#22c55e' },    // Green
    { key: '高分数', label: '高分线', color: '#3b82f6' }, // Blue
    { key: '名校', label: '名校线', color: '#94a3b8' },   // Gray (Neutral as requested)
    { key: '特控', label: '特控线', color: '#eab308' },   // Yellow
    { key: '未上线', label: '未上线', color: '#ef4444' },  // Red
  ];

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

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(p => p !== cls) : [...prev, cls]
    );
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
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
