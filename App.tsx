import React, { useState } from 'react';
import Header from './components/Header';
import CodeExplainer from './components/CodeExplainer';
import WordsDictionary from './components/WordsDictionary';
import TempChat from './components/TempChat';
import { TabType } from './types';
import { BookText, MessageSquare, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('explainer');

  const tabs = [
    { id: 'explainer', label: 'Explainer', icon: Sparkles },
    { id: 'words', label: 'Words', icon: BookText },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header />
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b px-4 md:px-6 pt-1 md:pt-2 flex items-center shrink-0">
        <nav className="flex space-x-4 md:space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center gap-1.5 md:gap-2 py-2.5 md:py-3 px-0.5 border-b-2 font-bold text-[11px] md:text-sm transition-all
                  ${isActive 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'}
                `}
              >
                <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area - Keeping components mounted to preserve state */}
      <main className="flex-1 overflow-hidden relative">
        <div className={`h-full w-full ${activeTab === 'explainer' ? 'block' : 'hidden'}`}>
          <CodeExplainer />
        </div>
        <div className={`h-full w-full ${activeTab === 'words' ? 'block' : 'hidden'}`}>
          <WordsDictionary />
        </div>
        <div className={`h-full w-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
          <TempChat />
        </div>
      </main>

      {/* Footer Info */}
      <footer className="h-6 md:h-8 bg-white border-t flex items-center justify-between px-4 md:px-6 shrink-0 text-[8px] md:text-[10px] text-gray-400 uppercase tracking-widest font-bold">
        <div className="truncate pr-4">AI Code Assistant v1.0</div>
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <span className="hidden sm:inline">Privacy First</span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full" />
            Ready
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;