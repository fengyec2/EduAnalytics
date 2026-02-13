
import { useMemo, useCallback } from 'react';
import { AnalysisState, StudentRecord } from '../../types';
import * as AnalysisEngine from '../../utils/analysisUtils';

interface UseExportDataProps {
  data: AnalysisState;
  selectedPeriod: string;
  compClasses: string[];
  benchmarkClass: string;
  exportSubjects: string[];
  subjectClasses: string[];
}

export const useExportData = ({
  data,
  selectedPeriod,
  compClasses,
  benchmarkClass,
  exportSubjects,
  subjectClasses
}: UseExportDataProps) => {
  const totalStudents = data.students.length;

  const allHistoricalRanks = useMemo(() => AnalysisEngine.calculateHistoricalRanks(data.students), [data.students]);
  const allSubjectRanks = useMemo(() => AnalysisEngine.calculateSubjectHistoricalRanks(data.students, data.subjects), [data.students, data.subjects]);
  const allClassHistoricalRanks = useMemo(() => AnalysisEngine.calculateClassHistoricalRanks(data.students), [data.students]);
  
  const periodData = useMemo(() => 
    AnalysisEngine.getPeriodSnapshot(data.students, selectedPeriod, allHistoricalRanks),
    [data.students, selectedPeriod, allHistoricalRanks]
  );

  const overviewStats = useMemo(() => {
    const maxScore = Math.max(...periodData.map(s => s.currentTotal), 0);
    const avgScore = periodData.reduce((acc, s) => acc + s.currentTotal, 0) / (periodData.length || 1);
    return { count: periodData.length, maxScore, avgScore };
  }, [periodData]);

  const admissionLabels = [
    { key: '清北', color: '#be123c' },
    { key: 'C9', color: '#1e40af' },
    { key: '高分数', color: '#0369a1' },
    { key: '名校', color: '#0d9488' },
    { key: '特控', color: '#10b981' },
  ];
  
  const effectiveThresholds = useMemo(() => {
    const hasImportedStatus = periodData.some(s => s.currentStatus !== undefined && s.currentStatus !== '');
    if (hasImportedStatus) return AnalysisEngine.deriveThresholdsFromMetadata(periodData, admissionLabels);
    return data.settings?.manualThresholds || { '清北': 5, 'C9': 30, '高分数': 100, '名校': 300, '特控': 600 };
  }, [periodData, data.settings]);
  
  const effectiveType = periodData.some(s => s.currentStatus) ? 'percent' : (data.settings?.thresholdType || 'rank');

  const schoolStats = useMemo(() => ({
    admissionDist: AnalysisEngine.getAdmissionDistribution(periodData, effectiveThresholds, effectiveType as any, admissionLabels),
    subjectAvgs: AnalysisEngine.getSubjectAverages(periodData, data.subjects)
  }), [periodData, effectiveThresholds, effectiveType, data.subjects]);

  const comparisonData = useMemo(() => {
    const thresholds = data.settings?.comparisonThresholds || [50, 100, 200, 400];
    const sorted = [...thresholds].sort((a, b) => a - b);
    const elite = sorted[0] || 50;
    const bench = sorted[sorted.length - 1] || 100;
    const stats = AnalysisEngine.getClassSummaries(periodData, compClasses, elite, bench);
    const leaderboard = AnalysisEngine.getClassLeaderboard(stats);
    
    const subjectMatrix = data.subjects.map(sub => {
      const entry: any = { name: sub };
      compClasses.forEach(cls => {
        const clsStudents = periodData.filter(s => s.class === cls);
        entry[cls] = clsStudents.length > 0 ? parseFloat((clsStudents.reduce((acc, s) => acc + (s.currentScores[sub] || 0), 0) / clsStudents.length).toFixed(2)) : 0;
      });
      return entry;
    });

    const rankMatrix = sorted.map(bucket => {
      const entry: any = { name: `Top ${bucket}` };
      compClasses.forEach(cls => {
        entry[cls] = periodData.filter(s => s.class === cls && s.periodSchoolRank <= bucket).length;
      });
      return entry;
    });

    const rowMaxMap: Record<string, number> = {};
    [...subjectMatrix, ...rankMatrix].forEach(row => rowMaxMap[row.name] = Math.max(...compClasses.map(c => row[c] || 0)));

    return { stats, leaderboard, subjectMatrix, rankMatrix, rowMaxMap, eliteThreshold: elite, benchThreshold: bench };
  }, [periodData, compClasses, data.settings, data.subjects]);

  const { kingsData, duelData, classFirstStudentName, schoolFirstStudentName } = useMemo(() => {
    const kings = data.subjects.map(sub => ({
      subject: sub,
      classMax: Math.max(...periodData.filter(s => s.class === benchmarkClass).map(s => s.currentScores[sub] || 0), 0),
      gradeMax: Math.max(...periodData.map(s => s.currentScores[sub] || 0), 0)
    }));
    const classFirst = periodData.filter(s => s.class === benchmarkClass).sort((a,b) => b.currentTotal - a.currentTotal)[0];
    const schoolFirst = periodData[0];
    const duel = data.subjects.map(sub => ({ 
      subject: sub, 
      classFirst: classFirst?.currentScores[sub] || 0, 
      schoolFirst: schoolFirst?.currentScores[sub] || 0 
    }));
    return { kingsData: kings, duelData: duel, classFirstStudentName: classFirst?.name || 'N/A', schoolFirstStudentName: schoolFirst?.name || 'N/A' };
  }, [periodData, data.subjects, benchmarkClass]);

  const paramsData = useMemo(() => AnalysisEngine.calculateExamParameters(periodData, data.subjects), [periodData, data.subjects]);

  const subjectAnalysisData = useMemo(() => exportSubjects.map(sub => ({
    subject: sub,
    dist: AnalysisEngine.getSubjectDistribution(selectedPeriod, sub, subjectClasses, periodData, allSubjectRanks, effectiveThresholds, effectiveType as any, periodData.length),
    focusList: AnalysisEngine.getBelowLineStudents(selectedPeriod, sub, subjectClasses, periodData, allSubjectRanks, effectiveThresholds['特控'] || 0, effectiveType as any)
  })), [selectedPeriod, exportSubjects, subjectClasses, periodData, allSubjectRanks, effectiveThresholds, effectiveType]);

  const getStatusLabel = useCallback((period: string, studentName: string, student: StudentRecord) => {
    const rank = allHistoricalRanks[period]?.[studentName];
    if (!rank) return '-';
    const snapshot = student.history.find(h => h.period === period);
    return AnalysisEngine.getAdmissionCategory(rank, effectiveThresholds, effectiveType as any, totalStudents, snapshot?.status);
  }, [allHistoricalRanks, effectiveThresholds, effectiveType, totalStudents]);

  const getSubjectCellStyle = useCallback((period: string, subject: string, studentName: string) => {
    const subRanksForPeriod = allSubjectRanks[period]?.[subject] || {};
    const rank = subRanksForPeriod[studentName];
    if (!rank) return 'text-gray-400';
    const maxSubRankInPeriod = Math.max(...(Object.values(subRanksForPeriod) as number[]), 0);
    const subjectParticipants = maxSubRankInPeriod || totalStudents;
    const category = AnalysisEngine.getSubjectRankCategory(rank, effectiveThresholds, effectiveType as any, subjectParticipants);
    const styles: Record<string, string> = {
      'king': 'bg-purple-100 text-purple-900 border-purple-200 font-bold border-b-2',
      'elite': 'bg-green-100 text-green-900 border-green-200 font-bold border-b-2',
      'high': 'bg-blue-100 text-blue-900 border-blue-200 font-bold border-b-2',
      'standard': 'text-gray-600',
      'pass': 'bg-yellow-100 text-yellow-900 border-yellow-200 font-bold border-b-2',
      'fail': 'bg-red-50 text-red-700 border-red-100 font-bold border-b-2'
    };
    return styles[category] || styles['standard'];
  }, [allSubjectRanks, effectiveThresholds, effectiveType, totalStudents]);

  return {
    allHistoricalRanks,
    allSubjectRanks,
    allClassHistoricalRanks,
    periodData,
    overviewStats,
    schoolStats,
    comparisonData,
    kingsData,
    duelData,
    classFirstStudentName,
    schoolFirstStudentName,
    paramsData,
    subjectAnalysisData,
    getStatusLabel,
    getSubjectCellStyle,
    effectiveThresholds,
    effectiveType
  };
};
