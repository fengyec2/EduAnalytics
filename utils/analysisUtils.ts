
import { StudentRecord, ScoreSnapshot } from '../types';

/**
 * 统一计算全周期总分名次映射
 * 返回格式: { [PeriodName]: { [StudentName]: Rank } }
 */
export const calculateHistoricalRanks = (students: StudentRecord[]) => {
  const allPeriods = Array.from(new Set(students.flatMap(s => s.history.map(h => h.period))));
  const periodRankMap: Record<string, Record<string, number>> = {};

  allPeriods.forEach(period => {
    const periodStudents = students
      .map(s => ({
        name: s.name,
        total: s.history.find(h => h.period === period)?.totalScore ?? -1
      }))
      .filter(s => s.total !== -1)
      .sort((a, b) => b.total - a.total);

    const ranks: Record<string, number> = {};
    periodStudents.forEach((s, idx) => {
      ranks[s.name] = idx + 1;
    });
    periodRankMap[period] = ranks;
  });

  return periodRankMap;
};

/**
 * 计算全周期、全科目的名次映射
 * 用于分析单科上线情况
 * 返回格式: { [PeriodName]: { [SubjectName]: { [StudentName]: Rank } } }
 */
export const calculateSubjectHistoricalRanks = (students: StudentRecord[], subjects: string[]) => {
  const allPeriods = Array.from(new Set(students.flatMap(s => s.history.map(h => h.period))));
  const result: Record<string, Record<string, Record<string, number>>> = {};

  allPeriods.forEach(period => {
    result[period] = {};
    subjects.forEach(sub => {
      const subRanks: Record<string, number> = {};
      const sortedStudents = students
        .map(s => ({
          name: s.name,
          score: s.history.find(h => h.period === period)?.scores[sub] ?? -1
        }))
        .filter(s => s.score !== -1)
        .sort((a, b) => b.score - a.score);

      sortedStudents.forEach((s, idx) => {
        subRanks[s.name] = idx + 1;
      });
      result[period][sub] = subRanks;
    });
  });

  return result;
};

/**
 * 计算每个考试周期的全校总分平均值
 */
export const calculateGradeAverages = (students: StudentRecord[]) => {
  const allPeriods = Array.from(new Set(students.flatMap(s => s.history.map(h => h.period))));
  const averages: Record<string, number> = {};

  allPeriods.forEach(period => {
    const periodTotals = students
      .map(s => s.history.find(h => h.period === period)?.totalScore)
      .filter((t): t is number => t !== undefined);

    if (periodTotals.length > 0) {
      averages[period] = periodTotals.reduce((a, b) => a + b, 0) / periodTotals.length;
    }
  });
  return averages;
};

/**
 * 获取特定考试周期的快照数据
 */
export const getPeriodSnapshot = (students: StudentRecord[], selectedPeriod: string, allHistoricalRanks: Record<string, Record<string, number>>) => {
  if (!selectedPeriod) return [];
  const ranks = allHistoricalRanks[selectedPeriod] || {};
  return students.map(s => {
    const historyItem = s.history.find(h => h.period === selectedPeriod);
    return {
      ...s,
      currentTotal: historyItem?.totalScore || 0,
      currentAverage: historyItem?.averageScore || 0,
      currentScores: historyItem?.scores || {},
      periodSchoolRank: ranks[s.name] || 9999
    };
  }).sort((a, b) => a.periodSchoolRank - b.periodSchoolRank);
};

/**
 * 计算上线分布（用于饼图）
 */
export const getAdmissionDistribution = (
  periodData: any[],
  thresholds: Record<string, number>,
  thresholdType: 'rank' | 'percent',
  labels: { key: string, color: string }[]
) => {
  if (!periodData.length) return [];

  const totalCount = periodData.length;
  const sortedThresholds = [...labels].map(l => ({
    ...l,
    limit: thresholdType === 'rank' 
      ? thresholds[l.key] 
      : Math.round((thresholds[l.key] / 100) * totalCount)
  })).sort((a, b) => a.limit - b.limit);

  const results = sortedThresholds.map((t, idx) => {
    const prevLimit = idx === 0 ? 0 : sortedThresholds[idx - 1].limit;
    const count = periodData.filter(s => s.periodSchoolRank > prevLimit && s.periodSchoolRank <= t.limit).length;
    return { name: t.key, value: count, color: t.color };
  });

  const lastLimit = sortedThresholds[sortedThresholds.length - 1].limit;
  results.push({
    name: '未上线',
    value: periodData.filter(s => s.periodSchoolRank > lastLimit).length,
    color: '#94a3b8'
  });

  return results.filter(r => r.value > 0);
};

/**
 * 计算单科平均分
 */
export const getSubjectAverages = (periodData: any[], subjects: string[]) => {
  return subjects.map(sub => {
    const avg = periodData.reduce((acc, s) => acc + (s.currentScores[sub] || 0), 0) / periodData.length;
    return { name: sub, avg: parseFloat(avg.toFixed(2)) };
  });
};

/**
 * 计算班级汇总统计
 */
export const getClassSummaries = (periodData: any[], selectedClasses: string[]) => {
  return selectedClasses.map(cls => {
    const clsStudents = periodData.filter(s => s.class === cls);
    const totalAvg = clsStudents.length > 0 
      ? clsStudents.reduce((acc, s) => acc + s.currentTotal, 0) / clsStudents.length 
      : 0;
    
    const top10Count = clsStudents.filter(s => s.periodSchoolRank <= 10).length;
    const top50Count = clsStudents.filter(s => s.periodSchoolRank <= 50).length;

    return {
      className: cls,
      count: clsStudents.length,
      average: parseFloat(totalAvg.toFixed(2)),
      top10: top10Count,
      top50: top50Count
    };
  });
};

/**
 * 获取班级荣誉榜（最高平均分、最多前10等）
 */
export const getClassLeaderboard = (classSummaries: any[]) => {
  if (classSummaries.length === 0) return null;
  return {
    highestAvg: [...classSummaries].sort((a, b) => b.average - a.average)[0],
    mostTop10: [...classSummaries].sort((a, b) => b.top10 - a.top10)[0],
    mostTop50: [...classSummaries].sort((a, b) => b.top50 - a.top50)[0],
  };
};

/**
 * 计算热力图最大值映射
 */
export const calculateHeatmapMaxValues = (data: any[], selectedClasses: string[]) => {
  const map: Record<string, number> = {};
  data.forEach(row => {
    const values = selectedClasses.map(cls => row[cls] || 0);
    map[row.name] = Math.max(...values);
  });
  return map;
};

/**
 * 计算特定学生的最新连续进退步状态
 */
export const calculateStreakInfo = (
  student: StudentRecord,
  allHistoricalRanks: Record<string, Record<string, number>>
) => {
  const history = student.history;
  const studentName = student.name;
  
  const rankList: number[] = history
    .map(h => allHistoricalRanks[h.period]?.[studentName])
    .filter((r): r is number => r !== undefined);

  if (rankList.length < 2) return null;

  const last = rankList[rankList.length - 1];
  const prev = rankList[rankList.length - 2];
  
  if (last === prev) return { count: 0, type: 'stable', totalChange: 0, steps: [] };

  const isImproving = last < prev;
  const type = isImproving ? 'improvement' : 'decline';
  
  let count = 0;
  let totalChange = 0;
  const steps: number[] = [];

  for (let i = rankList.length - 1; i > 0; i--) {
    const current = rankList[i];
    const previous = rankList[i - 1];
    const diff = previous - current;

    if ((isImproving && diff > 0) || (!isImproving && diff < 0)) {
      count++;
      totalChange += diff;
      steps.unshift(diff);
    } else {
      break;
    }
  }

  return { count, type, totalChange, steps };
};

/**
 * 计算考试参数（信度、区分度、难度等）
 */
export const calculateExamParameters = (periodData: any[], subjects: string[]) => {
  if (periodData.length === 0) return null;
  const n = periodData.length;
  const stats: any[] = [];

  subjects.forEach(sub => {
    const scores = periodData.map(s => s.currentScores[sub] || 0).sort((a, b) => a - b);
    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const max = scores[n - 1];
    let fullScore = max > 120 ? (max > 150 ? Math.ceil(max / 10) * 10 : 150) : (max > 100 ? 120 : 100);
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const median = n % 2 === 0 ? (scores[n/2 - 1] + scores[n/2]) / 2 : scores[Math.floor(n/2)];
    
    const counts: Record<number, number> = {};
    scores.forEach(s => counts[s] = (counts[s] || 0) + 1);
    let mode = scores[0];
    let maxCount = 0;
    Object.entries(counts).forEach(([val, count]) => { if (count > maxCount) { maxCount = count; mode = Number(val); } });

    const difficulty = mean / fullScore;
    const splitIdx = Math.round(n * 0.27);
    const top27 = scores.slice(n - splitIdx);
    const bottom27 = scores.slice(0, splitIdx);
    const meanTop = top27.length > 0 ? top27.reduce((a, b) => a + b, 0) / top27.length : 0;
    const meanBottom = bottom27.length > 0 ? bottom27.reduce((a, b) => a + b, 0) / bottom27.length : 0;
    const discrimination = (meanTop - meanBottom) / fullScore;

    stats.push({
      subject: sub,
      participants: n,
      max,
      mean: parseFloat(mean.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2)),
      mode,
      median,
      difficulty: parseFloat(difficulty.toFixed(2)),
      discrimination: parseFloat(discrimination.toFixed(2)),
      variance
    });
  });

  const k = subjects.length;
  const sumVarItems = stats.reduce((acc, s) => acc + s.variance, 0);
  const totalScores = periodData.map(s => s.currentTotal);
  const meanTotal = totalScores.reduce((a, b) => a + b, 0) / n;
  const varTotal = totalScores.reduce((a, b) => a + Math.pow(b - meanTotal, 2), 0) / n;
  const reliability = k > 1 ? (k / (k - 1)) * (1 - (sumVarItems / varTotal)) : 1;

  return { subjectStats: stats, reliability: parseFloat(reliability.toFixed(2)) };
};

/**
 * 获取学生雷达图数据
 */
export const getStudentRadarData = (
  student: StudentRecord,
  selectedPeriod: string,
  subjects: string[],
  radarBaseline: 'class' | 'grade',
  periodData: any[]
) => {
  const currentScores = student.history.find(h => h.period === selectedPeriod)?.scores || {};
  const baselineSource = radarBaseline === 'class' 
    ? periodData.filter(s => s.class === student.class)
    : periodData;

  return subjects.map(sub => {
    const studentScore = currentScores[sub] || 0;
    const baselineAvg = baselineSource.length > 0
      ? baselineSource.reduce((acc, s) => acc + (s.currentScores?.[sub] || 0), 0) / baselineSource.length
      : 0;

    return {
      subject: sub,
      score: studentScore,
      baseline: parseFloat(baselineAvg.toFixed(1)),
      fullMark: 150
    };
  });
};

/**
 * 获取学生单科历史名次趋势
 */
export const getStudentSubjectTrend = (
  student: StudentRecord,
  subject: string,
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>
) => {
  return student.history.map(h => ({
    period: h.period,
    rank: allSubjectRanks[h.period]?.[subject]?.[student.name] || null
  })).filter(d => d.rank !== null);
};

/**
 * 获取上线类别
 */
export const getAdmissionCategory = (
  rank: number,
  thresholds: Record<string, number>,
  thresholdType: 'rank' | 'percent',
  totalStudents: number
) => {
  const lines = [
    { key: '清北', label: '清北' },
    { key: 'C9', label: 'C9' },
    { key: '高分数', label: '高分' },
    { key: '名校', label: '名校' },
    { key: '特控', label: '特控' },
  ];

  for (const line of lines) {
    const limit = thresholdType === 'rank' 
      ? thresholds[line.key] 
      : Math.round((thresholds[line.key] / 100) * totalStudents);
    
    if (rank <= limit) return line.label;
  }
  return '未上线';
};

/**
 * 获取单科排名等级
 */
export const getSubjectRankCategory = (
  rank: number,
  thresholds: Record<string, number>,
  thresholdType: 'rank' | 'percent',
  totalStudents: number
) => {
  const categories = [
    { key: '清北', type: 'king' },
    { key: 'C9', type: 'elite' },
    { key: '高分数', type: 'high' },
    { key: '名校', type: 'standard' },
    { key: '特控', type: 'pass' },
  ];

  for (const cat of categories) {
    const limit = thresholdType === 'rank' 
      ? thresholds[cat.key] 
      : Math.round((thresholds[cat.key] / 100) * totalStudents);
    
    if (rank <= limit) return cat.type;
  }
  return 'fail';
};

/**
 * 计算单科名次分布
 */
export const getSubjectDistribution = (
  selectedPeriod: string,
  selectedSubject: string,
  selectedClasses: string[],
  periodData: any[],
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>,
  thresholds: Record<string, number>,
  thresholdType: 'rank' | 'percent',
  totalStudents: number
) => {
  if (!selectedPeriod || !selectedSubject) return [];

  const subjectRanks = allSubjectRanks[selectedPeriod]?.[selectedSubject] || {};
  const filteredStudents = periodData.filter(s => selectedClasses.includes(s.class));

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
};

/**
 * 获取未上线学生列表
 */
export const getBelowLineStudents = (
  selectedPeriod: string,
  selectedSubject: string,
  selectedClasses: string[],
  periodData: any[],
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>,
  teKongLimit: number
) => {
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
};
