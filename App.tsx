
import React, { useState, useEffect } from 'react';
import { AnalysisState } from './types';
import Dashboard from './components/Dashboard';
import DataManager from './components/DataManager';
import ExportView from './components/ExportView';
import { LayoutDashboard, GraduationCap, Database, ShieldCheck, RefreshCw, Languages, Printer } from 'lucide-react';
import { loadState, saveState, clearState } from './services/storageService';
import { LanguageProvider, useTranslation, Language } from './context/LanguageContext';

const AppContent: React.FC = () => {
  const [data, setData] = useState<AnalysisState | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'management' | 'export'>('dashboard');
  const [persistenceActive, setPersistenceActive] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  useEffect(() => {
    const initPersistence = async () => {
      try {
        const savedData = await loadState();
        if (savedData) {
          setData(savedData);
          setPersistenceActive(true);
        }
      } catch (err) {
        console.error("Storage initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };
    initPersistence();
  }, []);

  const handleDataUpdate = async (newState: AnalysisState | null) => {
    setData(newState);
    if (newState) {
      await saveState(newState);
      setPersistenceActive(true);
    } else {
      await clearState();
      setPersistenceActive(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 print:pb-0">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">EduAnalytics</span>
          </div>
          
          <nav className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.dashboard')}</span>
            </button>
            <button 
              onClick={() => setView('management')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'management' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.manager')}</span>
            </button>
            <button 
              onClick={() => setView('export')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'export' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.export')}</span>
            </button>

            <div className="h-4 w-px bg-gray-200" />

            <button 
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-blue-600 transition-all px-2 py-1 rounded-lg hover:bg-gray-50"
            >
              <Languages className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>
            
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 print:mt-0 print:px-0 print:max-w-none">
        {view === 'management' ? (
          <DataManager initialData={data} onDataUpdated={handleDataUpdate} />
        ) : view === 'export' ? (
          data ? <ExportView data={data} /> : (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <div className="bg-blue-50 p-6 rounded-full"><Database className="w-10 h-10 text-blue-400"/></div>
              <p className="text-gray-500 font-medium">Please import data first to generate reports.</p>
              <button onClick={() => setView('management')} className="text-blue-600 font-bold hover:underline">Go to Data Manager</button>
            </div>
          )
        ) : (
          <>
            {!data && !loading && (
              <div className="max-w-3xl mx-auto text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                  {t('hero.title')} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('hero.subtitle')}</span>
                </h1>
                <p className="text-lg text-gray-500 mb-12 max-w-xl mx-auto">
                  {t('hero.desc')}
                </p>
                <button 
                  onClick={() => setView('management')}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 mx-auto"
                >
                  <Database className="w-6 h-6" />
                  {t('hero.cta')}
                </button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Initializing analytics engine...</p>
              </div>
            )}

            {data && !loading && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-sm font-medium uppercase tracking-widest">{t('nav.dashboard')}</span>
                  </div>
                  {persistenceActive && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Storage Active</span>
                    </div>
                  )}
                </div>
                <Dashboard data={data} onUpdate={handleDataUpdate} />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 py-3 px-4 z-40 no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <p>© 2026 EduAnalytics.</p>
            {persistenceActive && (
              <span className="flex items-center gap-1 text-emerald-500 font-bold">
                <RefreshCw className="w-3 h-3" /> Auto-saved
              </span>
            )}
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-blue-500">Privacy</a>
            <a href="#" className="hover:text-blue-500">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);

export default App;
