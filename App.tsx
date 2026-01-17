
import React, { useState, useEffect } from 'react';
import { AnalysisState } from './types';
import Dashboard from './components/Dashboard';
import DataManager from './components/DataManager';
import { LayoutDashboard, GraduationCap, Github, Database, ShieldCheck, RefreshCw, Languages } from 'lucide-react';
import { loadState, saveState, clearState } from './services/storageService';
import { LanguageProvider, useTranslation, Language } from './context/LanguageContext';

const AppContent: React.FC = () => {
  const [data, setData] = useState<AnalysisState | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'management'>('dashboard');
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
    <div className="min-h-screen pb-20">
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">EduAnalytics</span>
          </div>
          
          <nav className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 text-sm font-bold transition-all px-3 py-1.5 rounded-lg ${view === 'dashboard' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50/50'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.dashboard')}</span>
            </button>
            <button 
              onClick={() => setView('management')}
              className={`flex items-center gap-2 text-sm font-bold transition-all px-3 py-1.5 rounded-lg ${view === 'management' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50/50'}`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.manager')}</span>
            </button>

            <div className="h-4 w-px bg-slate-200" />

            <button 
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-all px-2 py-1 rounded-lg hover:bg-white/50"
            >
              <Languages className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>
            
            <button className="hidden sm:flex bg-slate-900/90 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all items-center gap-2 backdrop-blur-md shadow-lg shadow-slate-500/20">
              <Github className="w-4 h-4" />
              {t('nav.source')}
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {view === 'management' ? (
          <DataManager initialData={data} onDataUpdated={handleDataUpdate} />
        ) : (
          <>
            {!data && !loading && (
              <div className="max-w-3xl mx-auto text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="inline-flex items-center justify-center p-2 bg-blue-50/50 backdrop-blur-sm rounded-2xl mb-8 border border-blue-100">
                  <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                  {t('hero.title')} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">{t('hero.subtitle')}</span>
                </h1>
                <p className="text-lg text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed">
                  {t('hero.desc')}
                </p>
                <button 
                  onClick={() => setView('management')}
                  className="group relative bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl hover:shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-3 mx-auto overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Database className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">{t('hero.cta')}</span>
                </button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Initializing analytics engine...</p>
              </div>
            )}

            {data && !loading && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500/80">
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-widest">{t('nav.dashboard')}</span>
                  </div>
                  {persistenceActive && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50/50 backdrop-blur-sm text-emerald-600 rounded-full border border-emerald-100">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Storage Active</span>
                    </div>
                  )}
                </div>
                <Dashboard data={data} />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-md border-t border-white/20 py-3 px-4 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <p className="font-medium">© 2026 EduAnalytics.</p>
            {persistenceActive && (
              <span className="flex items-center gap-1 text-emerald-500 font-bold">
                <RefreshCw className="w-3 h-3" /> Auto-saved
              </span>
            )}
          </div>
          <div className="flex gap-4 font-medium">
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Terms</a>
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
