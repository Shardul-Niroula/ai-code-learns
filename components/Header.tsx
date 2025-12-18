import React, { useState, useEffect } from 'react';
import { Terminal, Key, CheckCircle2, XCircle, X, Trash2, Save, Info, Zap, Shield, Globe, Moon, Sun } from 'lucide-react';
import { DAILY_QUOTA } from '../types';

const Header: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('user_api_key');
    setStoredKey(key);

    const savedUsage = localStorage.getItem('ai_usage_stats');
    if (savedUsage) {
      const stats = JSON.parse(savedUsage);
      if (stats.date === new Date().toDateString()) {
        setUsageCount(stats.count);
      }
    }

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(initialDark);
    document.documentElement.setAttribute('data-theme', initialDark ? 'dark' : 'light');

    const handleUsageUpdate = (e: any) => {
      setUsageCount(e.detail);
    };

    window.addEventListener('ai_usage_updated', handleUsageUpdate);
    return () => window.removeEventListener('ai_usage_updated', handleUsageUpdate);
  }, []);

  const handleSave = () => {
    if (!inputKey.trim()) return;
    localStorage.setItem('user_api_key', inputKey.trim());
    setStoredKey(inputKey.trim());
    setInputKey('');
    setShowModal(false);
    window.location.reload();
  };

  const handleDelete = () => {
    localStorage.removeItem('user_api_key');
    setStoredKey(null);
    setShowModal(false);
    window.location.reload();
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newDark ? 'dark' : 'light');
  };

  const isConnected = !!storedKey;
  const statusLabel = isConnected ? "Personal Key" : "API Key Required";
  const usagePercentage = Math.min(100, (usageCount / DAILY_QUOTA) * 100);

  return (
    <header className="h-14 md:h-16 border-b bg-primary border-color flex items-center justify-between px-4 md:px-6 shrink-0 z-40 relative">
      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="bg-indigo-600 p-1.5 md:p-2 rounded-lg shadow-theme-md shadow-indigo-100">
          <Terminal className="text-white w-4 h-4 md:w-5 md:h-5" />
        </div>
        <h1 className="text-base md:text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          AI Code Assistant
        </h1>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={toggleTheme}
          className="group flex items-center gap-2 md:gap-3 pl-2 pr-3 md:pl-3 md:pr-4 py-1.5 md:py-2 rounded-xl border bg-secondary border-color text-secondary hover:bg-tertiary transition-all duration-200 shadow-theme"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
          ) : (
            <Moon className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
          )}
          <span className="text-[9px] md:text-[10px] font-bold tracking-tight uppercase opacity-80">
            {isDark ? 'Light' : 'Dark'}
          </span>
        </button>
        <button 
          onClick={() => setShowModal(true)}
          className={`group flex items-center gap-2 md:gap-3 pl-2 pr-3 md:pl-3 md:pr-4 py-1.5 md:py-2 rounded-xl border transition-all duration-200 ${
            isConnected 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
              : 'bg-secondary border-color text-secondary hover:bg-tertiary shadow-theme'
          }`}
        >
          <div className="relative">
            <Key className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isConnected ? 'text-emerald-600' : 'text-gray-400'}`} />
            <div className="absolute -top-1.5 -right-1.5 bg-primary rounded-full">
              {isConnected ? (
                <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500 fill-white" />
              ) : (
                <XCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-rose-400 fill-white" />
              )}
            </div>
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[9px] md:text-[10px] font-bold tracking-tight uppercase opacity-80">
              {statusLabel}
            </span>
            <span className="text-[8px] md:text-[9px] font-medium flex items-center gap-1">
              {!isConnected ? (
                <>
                  <Zap className="w-2 h-2 text-amber-500 fill-amber-500" />
                  {usageCount}/{DAILY_QUOTA}
                </>
              ) : (
                <span className="text-emerald-600 font-bold">Unlimited</span>
              )}
            </span>
          </div>
        </button>

        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
              className="bg-primary rounded-2xl shadow-theme-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 md:p-6 border-b flex justify-between items-center bg-secondary">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary text-sm md:text-lg">API Key Manager</h3>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Connection Settings</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-tertiary rounded-full transition-colors text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 md:p-8 space-y-6">
                {/* Educational Section */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <Shield className="w-4 h-4 text-indigo-600 mb-2" />
                    <h4 className="text-[10px] font-bold text-primary uppercase mb-1">Privacy First</h4>
                    <p className="text-[9px] text-secondary leading-relaxed">Your custom key stays in local storage. We never see your requests.</p>
                  </div>
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                    <Globe className="w-4 h-4 text-amber-600 mb-2" />
                    <h4 className="text-[10px] font-bold text-primary uppercase mb-1">No Limits</h4>
                    <p className="text-[9px] text-secondary leading-relaxed">Personal keys bypass shared quotas for uninterrupted learning.</p>
                  </div>
                </div>

                {!isConnected && (
                  <div className="space-y-2 p-4 bg-secondary rounded-xl border border-color">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-tight">Daily Shared Quota</span>
                      <span className="text-xs font-black text-indigo-600">{usageCount} / {DAILY_QUOTA}</span>
                    </div>
                    <div className="h-2 w-full bg-tertiary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${usagePercentage > 80 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 italic">Shared quota resets every 24 hours.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {isConnected ? (
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-emerald-100 bg-emerald-50/30 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-700">Custom Key Active</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 mb-4 leading-relaxed">You are currently using your own Gemini Pro connection. No quotas apply.</p>
                        <button 
                          onClick={handleDelete}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all shadow-theme"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove Personal Key
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Enter your Gemini API Key</label>
                        <div className="relative">
                          <input 
                            type="password"
                            placeholder="AIzaSy..."
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            className="w-full bg-primary border border-color rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-theme"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleSave}
                        disabled={!inputKey.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-theme-lg shadow-indigo-100"
                      >
                        <Save className="w-4 h-4" />
                        Save Connection
                      </button>
                      
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                        <a 
                          href="https://aistudio.google.com/app/apikey" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] text-indigo-600 font-black border-b border-indigo-200 hover:border-indigo-600 transition-colors uppercase tracking-wider"
                        >
                          Get a free key from Google
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;