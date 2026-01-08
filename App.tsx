
import React, { useState } from 'react';
import { AnalysisState } from './types';
import Dashboard from './components/Dashboard';
import DataManager from './components/DataManager';
import { LayoutDashboard, GraduationCap, Github, Database } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AnalysisState | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'management'>('dashboard');

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">EduAnalytics</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button 
              onClick={() => setView('management')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${view === 'management' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              <Database className="w-4 h-4" />
              Data Manager
            </button>
            <button className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-2">
              <Github className="w-4 h-4" />
              Source
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {view === 'management' ? (
          <DataManager initialData={data} onDataUpdated={setData} />
        ) : (
          <>
            {!data && !loading && (
              <div className="max-w-3xl mx-auto text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                  Unlock Deep Academic Insights <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Driven by Data</span>
                </h1>
                <p className="text-lg text-gray-500 mb-12 max-w-xl mx-auto">
                  Transform your raw student records into actionable pedagogical intelligence. Start by managing your exam data.
                </p>
                <button 
                  onClick={() => setView('management')}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 mx-auto"
                >
                  <Database className="w-6 h-6" />
                  Go to Data Manager
                </button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Calculating complex metrics and rankings...</p>
              </div>
            )}

            {data && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-sm font-medium uppercase tracking-widest">Dashboard Overview</span>
                  </div>
                </div>
                <Dashboard data={data} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 py-3 px-4 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs text-gray-400">
          <p>© 2024 EduAnalytics Platform. Data-driven Educational Excellence.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-blue-500">Privacy</a>
            <a href="#" className="hover:text-blue-500">Terms</a>
            <a href="#" className="hover:text-blue-500">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
