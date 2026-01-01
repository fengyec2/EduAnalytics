
export interface ScoreSnapshot {
  period: string; // e.g., "Term 1", "2023-Q1", or "Exam 1"
  totalScore: number;
  averageScore: number;
  scores: Record<string, number>;
}

export interface StudentRecord {
  id: string;
  name: string;
  class: string;
  scores: Record<string, number>;
  totalScore: number;
  averageScore: number;
  rankInClass?: number;
  rankInSchool?: number;
  history: ScoreSnapshot[]; // Trend tracking
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
}

export interface AIInsight {
  title: string;
  content: string;
  type: 'success' | 'warning' | 'info';
}

declare global {
  interface Window {
    XLSX: any;
  }
}
