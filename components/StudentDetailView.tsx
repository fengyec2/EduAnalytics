
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Filter, GraduationCap, TrendingUp, Table as TableIcon } from 'lucide-react';
import { StudentRecord } from '../types';
import { ChartContainer } from './SharedComponents';

interface StudentDetailViewProps {
  studentSearchTerm: string;
  setStudentSearchTerm: (s: string) => void;
  classFilter: string;
  setClassFilter: (c: string) => void;
  classes: string[];
  selectableStudents: StudentRecord[];
  selectedStudentId: string | undefined;
  setSelectedStudentId: (id: string) => void;
  selectedStudent: StudentRecord | undefined;
  subjects: string[];
  gradeAveragesByPeriod: Record<string, number>;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ 
  studentSearchTerm, setStudentSearchTerm, classFilter, setClassFilter, classes, selectableStudents, selectedStudentId, setSelectedStudentId, selectedStudent, subjects, gradeAveragesByPeriod 
}) => {
  // 处理趋势图表数据，注入年级总分平均值作为参考
  const chartData = useMemo(() => {
    if (!selectedStudent) return [];
    return selectedStudent.history.map(h => ({
      ...h,
      gradeAvgTotal: gradeAveragesByPeriod[h.period] || 0
    }));
  }, [selectedStudent, gradeAveragesByPeriod]);

  // 计算个人历史平均总分
  const historyMeanTotal = useMemo(() => {
    if (!selectedStudent || selectedStudent.history.length === 0) return 0;
    const sum = selectedStudent.history.reduce((acc, h) => acc + h.totalScore, 0);
    return sum / selectedStudent.history.length;
  }, [selectedStudent]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search for a student name..." 
              value={studentSearchTerm} 
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="all">All Classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
          {selectableStudents.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStudentId(s.id)}
              className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                selectedStudentId === s.id 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                  : 'bg-white border-gray-100 hover:border-blue-300 text-gray-700'
              }`}
            >
              <span className="font-bold truncate">{s.name}</span>
              <span className={`text-[10px] opacity-70 ${selectedStudentId === s.id ? 'text-blue-100' : 'text-gray-400'}`}>{s.class}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedStudent ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-2xl shadow-xl text-white">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] opacity-70 uppercase font-black tracking-widest">Latest Rank</p>
                    <p className="text-4xl font-black">#{selectedStudent.rankInSchool}</p>
                  </div>
                </div>
                <h4 className="text-2xl font-black mb-1">{selectedStudent.name}</h4>
                <p className="text-sm opacity-80 mb-6">{selectedStudent.class} • Academic Performer</p>
                
                <div className="space-y-4 pt-6 border-t border-white/10">
                   <div className="flex justify-between items-center">
                     <span className="text-xs opacity-60 uppercase">Average Total Score</span>
                     <span className="text-xl font-bold">{historyMeanTotal.toFixed(1)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-xs opacity-60 uppercase">Improvement (Total)</span>
                     <span className="text-xl font-bold flex items-center gap-1">
                       {selectedStudent.history.length > 1 
                         ? (((selectedStudent.history[selectedStudent.history.length-1].totalScore - selectedStudent.history[0].totalScore) / selectedStudent.history[0].totalScore * 100).toFixed(1) + '%')
                         : 'N/A'
                       }
                       <TrendingUp className="w-4 h-4" />
                     </span>
                   </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <ChartContainer title="📈 Performance vs Grade Average Curve">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                    <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [value.toFixed(1), '']}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Line type="monotone" dataKey="totalScore" name="My Total Score" stroke="#3b82f6" strokeWidth={4} dot={{r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="gradeAvgTotal" name="Grade Avg Total (Ref)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <TableIcon className="w-4 h-4" /> Historical Grade Ledger
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white text-gray-400 font-bold border-b border-gray-100">
                    <th className="px-8 py-5">Period</th>
                    {subjects.map(s => <th key={s} className="px-8 py-5">{s}</th>)}
                    <th className="px-8 py-5 text-indigo-600">My Total</th>
                    <th className="px-8 py-5 text-blue-600">Grade Avg Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedStudent.history.map((h, i) => (
                    <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-700">{h.period}</td>
                      {subjects.map(s => (
                        <td key={s} className="px-8 py-5 text-gray-600">{h.scores[s] || '-'}</td>
                      ))}
                      <td className="px-8 py-5 font-black text-indigo-600">{h.totalScore}</td>
                      <td className="px-8 py-5 font-black text-blue-600">
                        {gradeAveragesByPeriod[h.period]?.toFixed(1) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white py-20 rounded-3xl border border-gray-100 shadow-sm text-center">
          <h3 className="text-xl font-bold text-gray-800">Please select a student above</h3>
        </div>
      )}
    </div>
  );
};

export default StudentDetailView;
