
export interface ScoreSnapshot {
  period: string; // e.g., "Term 1"
  totalScore: number;
  averageScore: number;
  scores: Record<string, number>;
  ranks?: Record<string, number>; // Imported ranks
  schoolRank?: number; // Imported school total rank
  status?: string; // Imported admission status (e.g., "特控", "一本", "本科")
  isComplete?: boolean; // Data completeness flag
}

export interface StudentRecord {
  id: string;
  name: string;
  class: string;
  scores: Record<string, number>;
  totalScore: number;
  averageScore: number;
  history: ScoreSnapshot[]; 
}

export interface ExamEntity {
  id: string;
  name: string;
  weight: number;
  isComplete: boolean;
  fileCount: number;
}

export interface AnalysisState {
  students: StudentRecord[];
  subjects: string[];
  classes: string[];
  schoolStats: {
    average: number;
    max: number;
    min: number;
    subjectStats: Record<string, { average: number; max: number; min: number }>;
    distribution: { name: string; value: number; color: string }[];
  };
  // 新增：持久化配置项
  settings?: {
    manualThresholds: Record<string, number>;
    comparisonThresholds: number[];
    thresholdType: 'rank' | 'percent';
  };
}

export type ImportMode = 'complete' | 'incomplete';
export type DataStructure = 'multi-file-single' | 'single-file-multi';
export type RankSource = 'recalculate' | 'imported';

export interface ColumnMapping {
  name: string;
  class: string;
  customClass?: string; // Added to support manual class name entry
  subjects: Record<string, string>;
  subjectRanks: Record<string, string>;
  totalRank?: string;
  status?: string;
}

// Fixed the global augmentation by using uppercase Window interface.
declare global {
  interface Window {
    XLSX: any;
  }
}
