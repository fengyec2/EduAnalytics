
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
 * 计算进退步系数
 */
export const calculateProgressCoefficient = (x: number, y: number): number => {
  if (x <= 0 || y <= 0) return 0;
  const z = (2 * (x - y)) / (x + y);
  return parseFloat(z.toFixed(2));
};

/**
 * 获取进退步分析全量数据
 */
export const getProgressAnalysisData = (
  students: StudentRecord[],
  periodX: string,
  periodY: string,
  allHistoricalRanks: Record<string, Record<string, number>>
) => {
  if (!periodX || !periodY) return [];

  const ranksX = allHistoricalRanks[periodX] || {};
  const ranksY = allHistoricalRanks[periodY] || {};

  return students.map(s => {
    const x = ranksX[s.name];
    const y = ranksY[s.name];
    
    if (x === undefined || y === undefined) return null;

    const coefficient = calculateProgressCoefficient(x, y);
    const rankChange = x - y; 
    
    const streakInfo = calculateStreakInfo(s, allHistoricalRanks);
    let streakCount = 0;
    if (streakInfo && streakInfo.count > 0) {
      streakCount = streakInfo.type === 'improvement' ? streakInfo.count : -streakInfo.count;
    }

    return {
      name: s.name,
      class: s.class,
      rankX: x,
      rankY: y,
      rankChange,
      coefficient,
      streakCount
    };
  }).filter((d): d is NonNullable<typeof d> => d !== null);
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
      currentStatus: historyItem?.status,
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

  const hasImportedStatus = periodData.some(s => s.currentStatus !== undefined && s.currentStatus !== '');

  if (hasImportedStatus) {
    const statusCounts: Record<string, number> = {};
    periodData.forEach(s => {
      const status = (s.currentStatus || '未上线').trim();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, count]) => {
      const match = labels.find(l => l.key === name || name.includes(l.key));
      return {
        name,
        value: count,
        color: match ? match.color : '#94a3b8'
      };
    }).sort((a, b) => b.value - a.value);
  }

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
 * 获取班级荣誉榜
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
 * 获取上线类别
 */
export const getAdmissionCategory = (
  rank: number,
  thresholds: Record<string, number>,
  thresholdType: 'rank' | 'percent',
  totalStudents: number,
  snapshotStatus?: string
) => {
  if (snapshotStatus && snapshotStatus !== '') return snapshotStatus;

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
 * 计算考试参数
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
 * 计算单科上线分布
 * 优化：如果导入了全局上线状态，Bar图将显示这些状态在所选科目/班级中的分布
 */
export const getSubjectDistribution = (
  selectedPeriod: string,
  subject: string,
  selectedClasses: string[],
  periodData: any[],
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>,
  thresholds: Record<string, number>,
  thresholdType: 'rank' | 'percent',
  totalStudents: number
) => {
  const filteredData = periodData.filter(s => selectedClasses.includes(s.class));
  const hasImportedStatus = filteredData.some(s => s.currentStatus !== undefined && s.currentStatus !== '');

  if (hasImportedStatus) {
    const statusCounts: Record<string, number> = {};
    filteredData.forEach(s => {
      const status = (s.currentStatus || '未上线').trim();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const labels = [
      { key: '清北', color: '#be123c' },
      { key: 'C9', color: '#1e40af' },
      { key: '高分数', color: '#0369a1' },
      { key: '名校', color: '#0d9488' },
      { key: '特控', color: '#10b981' },
    ];

    return Object.entries(statusCounts).map(([name, count]) => {
      const match = labels.find(l => l.key === name || name.includes(l.key));
      return {
        name,
        count,
        color: match ? match.color : '#94a3b8'
      };
    }).sort((a, b) => b.count - a.count);
  }

  const subjectRanks = allSubjectRanks[selectedPeriod]?.[subject] || {};
  const labels = [
    { key: '清北', color: '#be123c' },
    { key: 'C9', color: '#1e40af' },
    { key: '高分数', color: '#0369a1' },
    { key: '名校', color: '#0d9488' },
    { key: '特控', color: '#10b981' },
  ];

  const results = labels.map((l, idx) => {
    const limit = thresholdType === 'rank' 
      ? thresholds[l.key] 
      : Math.round((thresholds[l.key] / 100) * totalStudents);
    const prevLimit = idx === 0 ? 0 : (thresholdType === 'rank' 
      ? thresholds[labels[idx-1].key] 
      : Math.round((thresholds[labels[idx-1].key] / 100) * totalStudents));

    const count = filteredData.filter(s => {
      const rank = subjectRanks[s.name];
      return rank !== undefined && rank > prevLimit && rank <= limit;
    }).length;

    return { name: l.key, count, color: l.color };
  });

  const maxLimit = thresholdType === 'rank' 
    ? thresholds[labels[labels.length - 1].key] 
    : Math.round((thresholds[labels[labels.length - 1].key] / 100) * totalStudents);
  
  results.push({
    name: '未上线',
    count: filteredData.filter(s => {
      const rank = subjectRanks[s.name];
      return rank !== undefined && rank > maxLimit;
    }).length,
    color: '#94a3b8'
  });

  return results.filter(r => r.count > 0);
};

/**
 * 获取特定科目未达上线标准的学生列表
 * 优化：优先考虑导入的全局上线状态
 */
export const getBelowLineStudents = (
  selectedPeriod: string,
  subject: string,
  selectedClasses: string[],
  periodData: any[],
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>,
  teKongLimit: number
) => {
  const subjectRanks = allSubjectRanks[selectedPeriod]?.[subject] || {};
  const filteredData = periodData.filter(s => selectedClasses.includes(s.class));
  const hasImportedStatus = filteredData.some(s => s.currentStatus !== undefined && s.currentStatus !== '');

  if (hasImportedStatus) {
    const validPassedKeywords = ['清北', 'C9', '高分', '名校', '特控', '上线', '一本', '本科'];
    return filteredData
      .filter(s => {
        const status = s.currentStatus || '';
        const isNotPassed = status === '未上线' || status === '' || !validPassedKeywords.some(kw => status.includes(kw));
        return isNotPassed;
      })
      .map(s => ({
        name: s.name,
        class: s.class,
        rank: subjectRanks[s.name] || 'N/A'
      }))
      .sort((a, b) => {
        if (typeof a.rank === 'number' && typeof b.rank === 'number') return a.rank - b.rank;
        return 0;
      });
  }

  return filteredData
    .filter(s => {
      const rank = subjectRanks[s.name];
      return rank !== undefined && rank > teKongLimit;
    })
    .map(s => ({
      name: s.name,
      class: s.class,
      rank: subjectRanks[s.name]
    }))
    .sort((a, b) => a.rank - b.rank);
};
