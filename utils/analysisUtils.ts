
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
    
    // 简单众数
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
