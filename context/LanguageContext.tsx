
import React, { createContext, useContext, useState, ReactNode } from 'react';

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
    'common.subject': '科目',
    'common.class': '班级',
    'common.rank': '名次',
    'common.score': '分数',
    'common.average': '平均分',
    'common.search': '搜索...',
    'common.select_all': '全选',
    'wizard.step': '步骤',
    'wizard.upload': '上传文件',
    'wizard.config': '配置选项',
    'wizard.mapping': '字段映射',
    'wizard.drop_files': '将 Excel 文件拖拽至此处',
    'wizard.supported_formats': '支持格式：.xlsx, .xls',
    'wizard.data_mode': '数据模式',
    'wizard.mode_complete': '全校/级部数据',
    'wizard.mode_complete_desc': '包含完整的年级数据，系统将基于全员计算名次。',
    'wizard.mode_partial': '部分样本/班级',
    'wizard.mode_partial_desc': '仅包含特定群体，计算出的年级排名可能存在偏差。',
    'wizard.table_layout': '表格布局',
    'wizard.layout_multi': '多文件模式 (一考一文)',
    'wizard.layout_multi_desc': '传统格式。选择多个文件来构建学情时间轴。',
    'wizard.layout_single': '单文件多考汇总表',
    'wizard.layout_single_desc': '单个文件内包含多行学生记录（如同一学生占5行）。',
    'wizard.rank_source': '排名判定权威',
    'wizard.source_system': '系统自动计算',
    'wizard.source_system_desc': '系统将基于分数自动推算名次和上线情况。',
    'wizard.source_import': '使用导入的元数据',
    'wizard.source_import_desc': '优先使用 Excel 文件中已存在的排名和状态列。',
    'wizard.define_sequence': '定义考试顺序 (英文逗号分隔)',
    'wizard.identity_cols': '身份识别列',
    'wizard.student_name': '学生姓名',
    'wizard.class_group': '所在班级',
    'wizard.choose_col': '-- 选择列 --',
    'wizard.manual_input': '-- 手动输入 --',
    'wizard.enter_class': '输入班级名称 (如：高三1班)',
    'wizard.global_metrics': '全局指标 (可选)',
    'wizard.total_rank_col': '总分排名列',
    'wizard.admission_status': '录取/上线状态',
    'wizard.not_specified': '(未指定)',
    'wizard.subject_mapping': '学科映射',
    'wizard.selected_count': '已选',
    'wizard.mapping_hint': '请先指定“姓名”和“班级”列以解锁学科选择。',
    'wizard.rank_col': '排名列',
    'wizard.btn_discard': '放弃并关闭',
    'wizard.btn_back': '返回',
    'wizard.btn_continue': '继续',
    'wizard.btn_confirm': '确认并生成仪表盘',
    'wizard.processing': '正在处理数据...',
    'wizard.error_no_records': '未找到学生记录，请检查映射。',
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
    'common.subject': 'Subject',
    'common.class': 'Class',
    'common.rank': 'Rank',
    'common.score': 'Score',
    'common.average': 'Average',
    'common.search': 'Search...',
    'common.select_all': 'Select All',
    'wizard.step': 'Step',
    'wizard.upload': 'Upload',
    'wizard.config': 'Config',
    'wizard.mapping': 'Mapping',
    'wizard.drop_files': 'Drop your Excel files here',
    'wizard.supported_formats': 'Supported formats: .xlsx, .xls',
    'wizard.data_mode': 'Data Mode',
    'wizard.mode_complete': 'Whole School (Cohort)',
    'wizard.mode_complete_desc': 'Full ranking computation will be based on all available records.',
    'wizard.mode_partial': 'Partial Sample / Group',
    'wizard.mode_partial_desc': 'Only selected groups provided. Ranks might be skewed.',
    'wizard.table_layout': 'Table Layout',
    'wizard.layout_multi': 'One Exam Per File',
    'wizard.layout_multi_desc': 'Traditional format. Select multiple files to build a timeline.',
    'wizard.layout_single': 'Multi-Exam Summary Table',
    'wizard.layout_single_desc': 'Single file with grouped student records (e.g. 5 rows for 1 student).',
    'wizard.rank_source': 'Ranking Authority',
    'wizard.source_system': 'System Calculation',
    'wizard.source_system_desc': 'The system will derive rankings and admission status automatically from scores.',
    'wizard.source_import': 'Imported Metadata',
    'wizard.source_import_desc': 'Prioritize using pre-existing ranking and admission status columns.',
    'wizard.define_sequence': 'Define Exam Sequence (Comma separated)',
    'wizard.identity_cols': 'Identity Columns',
    'wizard.student_name': 'Student Name',
    'wizard.class_group': 'Class Group',
    'wizard.choose_col': '-- Choose Column --',
    'wizard.manual_input': '-- Manual Input --',
    'wizard.enter_class': 'Enter Class Name (e.g. 301)',
    'wizard.global_metrics': 'Global Metrics',
    'wizard.total_rank_col': 'Total Rank',
    'wizard.admission_status': 'Admission Status',
    'wizard.not_specified': '(Not Specified)',
    'wizard.subject_mapping': 'Subject Mapping',
    'wizard.selected_count': 'Selected',
    'wizard.mapping_hint': 'First specify Name and Class columns to reveal remaining fields.',
    'wizard.rank_col': 'Rank Col',
    'wizard.btn_discard': 'Discard & Close',
    'wizard.btn_back': 'Back',
    'wizard.btn_continue': 'Continue',
    'wizard.btn_confirm': 'Confirm & Build Dashboard',
    'wizard.processing': 'Processing Data...',
    'wizard.error_no_records': 'No student records found. Check mapping.',
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
