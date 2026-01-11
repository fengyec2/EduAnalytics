
import { StudentRecord, ScoreSnapshot } from '../types';

/**
 * 获取特定周期、特定科目的名次计算基数（分母）
 * 如果存在导入的名次，则取最大名次值；否则取当前样本总数
 */
export const getEffectiveCohortSize = (
  period: string,
  subject: string | null, // null 表示总分
  periodData: any[],
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>,
  allHistoricalRanks: Record<string, Record<string, number>>
): number => {
  let maxRankFound = 0;

  if (subject) {
    // 处理单科名次基数
    const subRanks = allSubjectRanks[period]?.[subject] || {};
    const values = Object.values(subRanks);
    if (values.length > 0) {
      maxRankFound = Math.max(...values);
    }
  } else {
    // 处理总分名次基数
    const totalRanks = allHistoricalRanks[period] || {};
    const values = Object.values(totalRanks);
    if (values.length > 0) {
      maxRankFound = Math.max(...values);
    }
  }

  // 基数至少是当前文件内的学生数，防止数据异常
  return Math.max(periodData.length, maxRankFound);
};

/**
 * 计算全周期总分名次映射
 */
export const calculateHistoricalRanks = (students: StudentRecord[]) => {
  const allPeriods = Array.from(new Set(students.flatMap(s => s.history.map(h => h.period))));
  const periodRankMap: Record<string, Record<string, number>> = {};

  allPeriods.forEach(period => {
    const hasImportedRanks = students.some(s => {
      const h = s.history.find(p => p.period === period);
      return h?.schoolRank !== undefined && h.schoolRank > 0;
    });

    if (hasImportedRanks) {
      const ranks: Record<string, number> = {};
      students.forEach(s => {
        const h = s.history.find(p => p.period === period);
        if (h && h.schoolRank) ranks[s.name] = h.schoolRank;
      });
      if (Object.keys(ranks).length > 0) {
        periodRankMap[period] = ranks;
        return;
      }
    }

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
      const hasImportedRanks = students.some(s => {
        const h = s.history.find(p => p.period === period);
        return h?.ranks?.[sub] !== undefined && h.ranks[sub] > 0;
      });

      if (hasImportedRanks) {
        const subRanks: Record<string, number> = {};
        students.forEach(s => {
          const h = s.history.find(p => p.period === period);
          if (h?.ranks?.[sub]) subRanks[s.name] = h.ranks[sub];
        });
        if (Object.keys(subRanks).length > 0) {
          result[period][sub] = subRanks;
          return;
        }
      }

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
 * 根据导入的 Metadata 自动推算名次百分比阈值
 */
export const deriveThresholdsFromMetadata = (
  periodData: any[], 
  labels: { key: string, color: string }[],
  cohortSize: number
): Record<string, number> => {
  const derived: Record<string, number> = {};
  if (cohortSize === 0) return derived;

  let cumulativeCount = 0;
  labels.forEach(label => {
    const count = periodData.filter(s => {
      const status = (s.currentStatus || '').trim();
      return status === label.key || status.includes(label.key);
    }).length;
    
    cumulativeCount += count;
    // 这里的推算目前还是基于样本内的分布，因为元数据 status 是样本自带的
    // 我们将其存为相对于 cohortSize 的百分比
    derived[label.key] = parseFloat(((cumulativeCount / periodData.length) * 100).toFixed(4));
  });

  return derived;
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
      periodSchoolRank: ranks[s.name] || historyItem?.schoolRank || 9999
    };
  }).sort((a, b) => a.periodSchoolRank - b.periodSchoolRank);
};

/**
 * 计算总分上线分布
 */
export const getAdmissionDistribution = (
  period: string,
  periodData: any[],
  thresholds: Record<string, number>,
  thresholdType: 'rank' | 'percent',
  labels: { key: string, color: string }[],
  allHistoricalRanks: Record<string, Record<string, number>>
) => {
  if (!periodData.length) return [];

  const hasImportedStatus = periodData.some(s => s.currentStatus !== undefined && s.currentStatus !== '');

  if (hasImportedStatus) {
    const statusCounts: Record<string, number> = {};
    periodData.forEach(s => {
      const status = (s.currentStatus || '未上线').trim();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const results = labels.map(l => ({
      name: l.key,
      value: statusCounts[l.key] || 0,
      color: l.color
    })).filter(r => r.value > 0);

    const otherCount = periodData.length - results.reduce((acc, r) => acc + r.value, 0);
    if (otherCount > 0) {
      results.push({ name: '未上线', value: otherCount, color: '#94a3b8' });
    }
    return results;
  }

  // 关键修正：使用总分名次基数
  const cohortSize = getEffectiveCohortSize(period, null, periodData, {}, allHistoricalRanks);

  const sortedThresholds = [...labels].map(l => ({
    ...l,
    limit: thresholdType === 'rank' 
      ? thresholds[l.key] 
      : Math.round((thresholds[l.key] / 100) * cohortSize)
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
 * 单科上线分布核心逻辑
 */
export const getSubjectDistribution = (
  selectedPeriod: string,
  subject: string,
  selectedClasses: string[],
  periodData: any[],
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>,
  allHistoricalRanks: Record<string, Record<string, number>>,
  thresholds: Record<string, number>,
  thresholdType: 'rank' | 'percent'
) => {
  const filteredData = periodData.filter(s => selectedClasses.includes(s.class));
  const subjectRanks = allSubjectRanks[selectedPeriod]?.[subject] || {};
  
  // 核心：基于该科目的年级名次最大值来计算基数
  const cohortSize = getEffectiveCohortSize(selectedPeriod, subject, periodData, allSubjectRanks, allHistoricalRanks);

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
      : Math.round((thresholds[l.key] / 100) * cohortSize);
    
    const prevLimit = idx === 0 ? 0 : (thresholdType === 'rank' 
      ? thresholds[labels[idx-1].key] 
      : Math.round((thresholds[labels[idx-1].key] / 100) * cohortSize));

    const count = filteredData.filter(s => {
      const rank = subjectRanks[s.name];
      return rank !== undefined && rank > prevLimit && rank <= limit;
    }).length;

    return { name: l.key, count, color: l.color };
  });

  const maxLimit = thresholdType === 'rank' 
    ? thresholds[labels[labels.length - 1].key] 
    : Math.round((thresholds[labels[labels.length - 1].key] / 100) * cohortSize);
  
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
 * 获取特定科目关注名单
 */
export const getBelowLineStudents = (
  selectedPeriod: string,
  subject: string,
  selectedClasses: string[],
  periodData: any[],
  allSubjectRanks: Record<string, Record<string, Record<string, number>>>,
  allHistoricalRanks: Record<string, Record<string, number>>,
  teKongThreshold: number,
  thresholdType: 'rank' | 'percent' = 'rank'
) => {
  const subjectRanks = allSubjectRanks[selectedPeriod]?.[subject] || {};
  const filteredData = periodData.filter(s => selectedClasses.includes(s.class));
  const cohortSize = getEffectiveCohortSize(selectedPeriod, subject, periodData, allSubjectRanks, allHistoricalRanks);
  
  const effectiveLimit = thresholdType === 'percent' 
    ? Math.round((teKongThreshold / 100) * cohortSize)
    : teKongThreshold;

  return filteredData
    .filter(s => {
      const rank = subjectRanks[s.name];
      return rank !== undefined && rank > effectiveLimit;
    })
    .map(s => ({
      name: s.name,
      class: s.class,
      rank: subjectRanks[s.name]
    }))
    .sort((a, b) => (a.rank as number) - (b.rank as number));
};

/**
 * 获取单科排名等级样式
 */
export const getSubjectRankCategory = (
  rank: number,
  thresholds: Record<string, number>,
  thresholdType: 'rank' | 'percent',
  cohortSize: number
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
      : Math.round((thresholds[cat.key] / 100) * cohortSize);
    
    if (rank <= limit) return cat.type;
  }
  return 'fail';
};

export const calculateProgressCoefficient = (x: number, y: number): number => {
  if (x <= 0 || y <= 0) return 0;
  return parseFloat(((2 * (x - y)) / (x + y)).toFixed(2));
};

export const getProgressAnalysisData = (students: StudentRecord[], periodX: string, periodY: string, allHistoricalRanks: Record<string, Record<string, number>>) => {
  if (!periodX || !periodY) return [];
  const ranksX = allHistoricalRanks[periodX] || {};
  const ranksY = allHistoricalRanks[periodY] || {};

  return students.map(s => {
    const x = ranksX[s.name];
    const y = ranksY[s.name];
    if (x === undefined || y === undefined) return null;
    const coefficient = calculateProgressCoefficient(x, y);
    const streakInfo = calculateStreakInfo(s, allHistoricalRanks);
    return {
      name: s.name,
      class: s.class,
      rankX: x,
      rankY: y,
      rankChange: x - y,
      coefficient,
      streakCount: streakInfo ? (streakInfo.type === 'improvement' ? streakInfo.count : -streakInfo.count) : 0
    };
  }).filter((d): d is NonNullable<typeof d> => d !== null);
};

export const calculateGradeAverages = (students: StudentRecord[]) => {
  const allPeriods = Array.from(new Set(students.flatMap(s => s.history.map(h => h.period))));
  const averages: Record<string, number> = {};
  allPeriods.forEach(period => {
    const totals = students.map(s => s.history.find(h => h.period === period)?.totalScore).filter((t): t is number => t !== undefined);
    if (totals.length > 0) averages[period] = totals.reduce((a, b) => a + b, 0) / totals.length;
  });
  return averages;
};

export const calculateStreakInfo = (student: StudentRecord, allHistoricalRanks: Record<string, Record<string, number>>) => {
  const studentName = student.name;
  const rankList: number[] = student.history.map(h => allHistoricalRanks[h.period]?.[studentName]).filter((r): r is number => r !== undefined);
  if (rankList.length < 2) return null;
  const last = rankList[rankList.length - 1];
  const prev = rankList[rankList.length - 2];
  if (last === prev) return { count: 0, type: 'stable', totalChange: 0, steps: [] };
  const isImproving = last < prev;
  const type = isImproving ? 'improvement' : 'decline';
  let count = 0, totalChange = 0;
  const steps: number[] = [];
  for (let i = rankList.length - 1; i > 0; i--) {
    const current = rankList[i], previous = rankList[i - 1], diff = previous - current;
    if ((isImproving && diff > 0) || (!isImproving && diff < 0)) {
      count++;
      totalChange += diff;
      steps.unshift(diff);
    } else break;
  }
  return { count, type, totalChange, steps };
};

export const getAdmissionCategory = (rank: number, thresholds: Record<string, number>, thresholdType: 'rank' | 'percent', cohortSize: number, snapshotStatus?: string) => {
  if (snapshotStatus && snapshotStatus !== '' && snapshotStatus !== '未上线') return snapshotStatus;
  const lines = [{ key: '清北', label: '清北' }, { key: 'C9', label: 'C9' }, { key: '高分数', label: '高分' }, { key: '名校', label: '名校' }, { key: '特控', label: '特控' }];
  for (const line of lines) {
    const limit = thresholdType === 'rank' ? thresholds[line.key] : Math.round((thresholds[line.key] / 100) * cohortSize);
    if (rank <= limit) return line.label;
  }
  return '未上线';
};

export const calculateExamParameters = (periodData: any[], subjects: string[]) => {
  if (periodData.length === 0) return null;
  const n = periodData.length, stats: any[] = [];
  subjects.forEach(sub => {
    const scores = periodData.map(s => s.currentScores[sub] || 0).sort((a, b) => a - b);
    const sum = scores.reduce((a, b) => a + b, 0), mean = sum / n, max = scores[n - 1];
    let fullScore = max > 120 ? (max > 150 ? Math.ceil(max / 10) * 10 : 150) : (max > 100 ? 120 : 100);
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance), median = n % 2 === 0 ? (scores[n/2 - 1] + scores[n/2]) / 2 : scores[Math.floor(n/2)];
    const difficulty = mean / fullScore;
    const splitIdx = Math.round(n * 0.27), top27 = scores.slice(n - splitIdx), bottom27 = scores.slice(0, splitIdx);
    const meanTop = top27.length > 0 ? top27.reduce((a, b) => a + b, 0) / top27.length : 0;
    const meanBottom = bottom27.length > 0 ? bottom27.reduce((a, b) => a + b, 0) / bottom27.length : 0;
    const discrimination = (meanTop - meanBottom) / fullScore;
    stats.push({ subject: sub, participants: n, max, mean: parseFloat(mean.toFixed(2)), stdDev: parseFloat(stdDev.toFixed(2)), difficulty: parseFloat(difficulty.toFixed(2)), discrimination: parseFloat(discrimination.toFixed(2)), variance, median });
  });
  const k = subjects.length, sumVarItems = stats.reduce((acc, s) => acc + s.variance, 0);
  const totalScores = periodData.map(s => s.currentTotal), meanTotal = totalScores.reduce((a, b) => a + b, 0) / n;
  const varTotal = totalScores.reduce((a, b) => a + Math.pow(b - meanTotal, 2), 0) / n;
  const reliability = k > 1 ? (k / (k - 1)) * (1 - (sumVarItems / varTotal)) : 1;
  return { subjectStats: stats, reliability: parseFloat(reliability.toFixed(2)) };
};

export const getStudentRadarData = (student: StudentRecord, selectedPeriod: string, subjects: string[], radarBaseline: 'class' | 'grade', periodData: any[]) => {
  const currentScores = student.history.find(h => h.period === selectedPeriod)?.scores || {};
  const baselineSource = radarBaseline === 'class' ? periodData.filter(s => s.class === student.class) : periodData;
  return subjects.map(sub => ({
    subject: sub,
    score: currentScores[sub] || 0,
    baseline: parseFloat((baselineSource.length > 0 ? baselineSource.reduce((acc, s) => acc + (s.currentScores?.[sub] || 0), 0) / baselineSource.length : 0).toFixed(1)),
    fullMark: 150
  }));
};

export const getStudentSubjectTrend = (student: StudentRecord, subject: string, allSubjectRanks: Record<string, Record<string, Record<string, number>>>) => {
  return student.history.map(h => ({ period: h.period, rank: allSubjectRanks[h.period]?.[subject]?.[student.name] || null })).filter(d => d.rank !== null);
};

export const getSubjectAverages = (periodData: any[], subjects: string[]) => {
  return subjects.map(sub => ({ name: sub, avg: parseFloat((periodData.reduce((acc, s) => acc + (s.currentScores[sub] || 0), 0) / periodData.length).toFixed(2)) }));
};

export const getClassSummaries = (periodData: any[], selectedClasses: string[]) => {
  return selectedClasses.map(cls => {
    const clsStudents = periodData.filter(s => s.class === cls);
    const totalAvg = clsStudents.length > 0 ? clsStudents.reduce((acc, s) => acc + s.currentTotal, 0) / clsStudents.length : 0;
    const top10Count = clsStudents.filter(s => s.periodSchoolRank <= 10).length;
    const top50Count = clsStudents.filter(s => s.periodSchoolRank <= 50).length;
    return { className: cls, count: clsStudents.length, average: parseFloat(totalAvg.toFixed(2)), top10: top10Count, top50: top50Count };
  });
};

export const getClassLeaderboard = (classSummaries: any[]) => {
  if (classSummaries.length === 0) return null;
  return {
    highestAvg: [...classSummaries].sort((a, b) => b.average - a.average)[0],
    mostTop10: [...classSummaries].sort((a, b) => b.top10 - a.top10)[0],
    mostTop50: [...classSummaries].sort((a, b) => b.top50 - a.top50)[0],
  };
};

export const calculateHeatmapMaxValues = (data: any[], selectedClasses: string[]) => {
  const map: Record<string, number> = {};
  data.forEach(row => { map[row.name] = Math.max(...selectedClasses.map(cls => row[cls] || 0)); });
  return map;
};
