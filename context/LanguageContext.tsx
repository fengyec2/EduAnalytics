
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'zh' | 'en';

interface TranslationDict {
  [key: string]: string;
}

const translations: Record<Language, TranslationDict> = {
  zh: {
    'nav.dashboard': '仪表盘',
    'nav.manager': '数据管理',
    'nav.source': '源码',
    'hero.title': '解锁深度学情洞察',
    'hero.subtitle': '驱动教学决策',
    'hero.desc': '将原始成绩单转化为可落地的教学情报。从管理您的考试数据开始。',
    'hero.cta': '进入数据管理',
    'stat.total_students': '学生总数',
    'stat.classes': '班级总数',
    'stat.above_line': '上线人数',
    'stat.best_score': '最高分',
    'tab.school': '学校概览',
    'tab.comparison': '班级对比',
    'tab.kings': '尖子生对标',
    'tab.parameters': '考试参数',
    'tab.subject': '单科分析',
    'tab.progress': '进退步分析',
    'tab.student': '学生详情',
    'school.config_title': '上线分析参数配置',
    'school.imported_meta': '使用导入元数据推算',
    'school.rank_mode': '按绝对名次',
    'school.percent_mode': '按百分比',
    'school.chart_admissions': '上线情况分析',
    'school.chart_subjects': '学科均分表现',
    'comparison.title': '班级对比分析',
    'comparison.desc': '对比所选群体的学术表现',
    'comparison.highest_avg': '最高均分班级',
    'comparison.most_top10': 'Top 10 密度最高',
    'comparison.strongest_bench': '年级中坚力量 (Top 50)',
    'common.subject': '科目',
    'common.class': '班级',
    'common.rank': '名次',
    'common.score': '分数',
    'common.average': '平均分',
    'common.search': '搜索...',
    'common.select_all': '全选',
    'manager.title': '考试数据管理',
    'manager.desc': '导入、组织和检查您的学术记录',
    'manager.import_new': '导入新数据',
    'manager.timeline': '考试时间轴',
    'manager.empty': '暂无数据',
    'manager.delete_confirm': '确定要永久删除此考试的所有数据吗？',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.manager': 'Data Manager',
    'nav.source': 'Source',
    'hero.title': 'Unlock Deep Academic Insights',
    'hero.subtitle': 'Driven by Data',
    'hero.desc': 'Transform your raw student records into actionable pedagogical intelligence. Start by managing your exam data.',
    'hero.cta': 'Go to Data Manager',
    'stat.total_students': 'Total Students',
    'stat.classes': 'Classes',
    'stat.above_line': 'Above Line',
    'stat.best_score': 'Best Score',
    'tab.school': 'School View',
    'tab.comparison': 'Class Comparison',
    'tab.kings': 'Elite Benchmarks',
    'tab.parameters': 'Exam Parameters',
    'tab.subject': 'Subject Analysis',
    'tab.progress': 'Progress Analysis',
    'tab.student': 'Student Detail',
    'school.config_title': 'Admissions Thresholds Config',
    'school.imported_meta': 'Derived from Metadata',
    'school.rank_mode': 'By Absolute Rank',
    'school.percent_mode': 'By Percentage',
    'school.chart_admissions': 'Admissions Status',
    'school.chart_subjects': 'Subject Performance',
    'comparison.title': 'Class Comparison Analysis',
    'comparison.desc': 'Comparing performance across groups',
    'comparison.highest_avg': 'Highest Average',
    'comparison.most_top10': 'Most Top 10 Elite',
    'comparison.strongest_bench': 'Strongest Bench (Top 50)',
    'common.subject': 'Subject',
    'common.class': 'Class',
    'common.rank': 'Rank',
    'common.score': 'Score',
    'common.average': 'Average',
    'common.search': 'Search...',
    'common.select_all': 'Select All',
    'manager.title': 'Exam Data Management',
    'manager.desc': 'Import, organize, and inspect records',
    'manager.import_new': 'Import New Data',
    'manager.timeline': 'Exam Timeline',
    'manager.empty': 'No Data',
    'manager.delete_confirm': 'Are you sure you want to delete this exam record?',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('edu_lang') as Language) || 'zh';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('edu_lang', lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
};
