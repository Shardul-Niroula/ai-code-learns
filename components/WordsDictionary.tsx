
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Search, History, Trash2, BookOpen, Wand2, Info, GripVertical, ChevronUp, ChevronDown, Clock, X, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { defineWord } from '../services/geminiService';
import { WordDefinition } from '../types';

const WordsDictionary: React.FC = () => {
  const [term, setTerm] = useState<string>('async');
  const [definition, setDefinition] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<WordDefinition[]>([]);
  
  // Layout states
  const [leftWidth, setLeftWidth] = useState<number>(40);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [editorTheme, setEditorTheme] = useState<string>(document.documentElement.getAttribute('data-theme') === 'dark' ? 'vs-dark' : 'vs-light');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    const savedHistory = localStorage.getItem('code_words_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'vs-dark' : 'vs-light';
      setEditorTheme(theme);
    };
    
    // Initial theme
    updateTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  const saveToHistory = (word: string, def: string) => {
    const newEntry: WordDefinition = {
      id: Date.now().toString(),
      word,
      definition: def,
      timestamp: Date.now()
    };
    const updatedHistory = [newEntry, ...history.filter(h => h.word.toLowerCase() !== word.toLowerCase())].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('code_words_history', JSON.stringify(updatedHistory));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('code_words_history', JSON.stringify(updated));
  };

  const handleSearch = async () => {
    if (!term.trim() || isLoading) return;
    setIsLoading(true);
    setDefinition('');
    if (isMobile) setIsEditorOpen(false);

    try {
      const result = await defineWord(term.trim());
      setDefinition(result);
      saveToHistory(term.trim(), result);
    } catch (err) {
      setDefinition("Failed to fetch word definition.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: WordDefinition) => {
    setTerm(item.word);
    setDefinition(item.definition);
    if (isMobile) setIsEditorOpen(false);
  };

  const startResizing = () => !isMobile && setIsResizing(true);
  const stopResizing = () => setIsResizing(false);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    if (newWidth > 25 && newWidth < 60) setLeftWidth(newWidth);
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, handleMouseMove]);

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row flex-1 overflow-hidden h-full relative bg-secondary">
      
      {/* Left Pane: Input & History */}
      <div 
        style={isMobile ? { transform: isEditorOpen ? 'translateY(0)' : 'translateY(-90%)', zIndex: 40, transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' } : { width: `${leftWidth}%` }}
        className={`bg-primary border-b md:border-r border-color flex flex-col shadow-theme-2xl md:shadow-none ${isMobile ? 'absolute top-0 left-0 right-0 h-[50vh] rounded-b-[30px]' : 'h-full'}`}
      >
        <div className="p-4 md:p-6 flex-1 flex flex-col min-h-0">
          <div className="mb-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Word / Concept</label>
            <div className="h-20 md:h-24 border border-color rounded-xl overflow-hidden shadow-inner bg-secondary mb-3">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={term}
                onChange={(val) => setTerm(val || '')}
                theme={editorTheme}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'off',
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 10, bottom: 10 }
                }}
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={isLoading || !term.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-theme-lg shadow-indigo-100"
            >
              {isLoading ? <Wand2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Define Quick
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <History className="w-3 h-3" /> Search History
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
              {history.length === 0 ? (
                <div className="text-center py-10 opacity-30">
                  <Terminal className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No history yet</p>
                </div>
              ) : (
                history.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => loadFromHistory(item)}
                    className="group flex items-center justify-between p-3 bg-secondary hover:bg-indigo-50 border border-color hover:border-indigo-100 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="text-xs font-bold text-primary truncate">{item.word}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteHistoryItem(item.id, e)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-100 text-rose-400 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {isMobile && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer" onClick={() => setIsEditorOpen(!isEditorOpen)}>
            <div className="bg-primary p-2 rounded-full shadow-theme-lg border border-indigo-50 text-indigo-600">
              {isEditorOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        )}
      </div>

      {!isMobile && (
        <div onMouseDown={startResizing} className={`w-2 cursor-col-resize flex items-center justify-center transition-all z-10 ${isResizing ? 'bg-indigo-600' : 'bg-tertiary hover:bg-indigo-200'}`}>
          <div className="p-0.5 rounded-full bg-primary shadow-theme-md border border-color">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}

      {/* Right Pane: Definition Display */}
      <div 
        style={!isMobile ? { width: `${100 - leftWidth}%` } : {}}
        className={`flex-1 flex flex-col bg-primary overflow-hidden ${isMobile ? 'pt-12' : ''}`}
      >
        <div className="p-4 border-b bg-secondary flex items-center gap-2 shrink-0">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm md:text-base font-bold text-primary uppercase tracking-wider">Concept Insight</h2>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 md:p-8 prose prose-indigo max-w-none">
          {definition ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
              <ReactMarkdown 
                components={{
                  h3: ({node, children, ...props}) => {
                    const content = String(children);
                    // Match the custom emoji-based headers from geminiService
                    const isMetadata = /🏷️|📂|🎯|⚙️|📥|💎/.test(content);
                    const isSection = /✨|💻/.test(content);
                    
                    if (isMetadata) {
                      return (
                        <div className="flex items-center gap-3 px-4 py-3 bg-secondary border-l-4 border-indigo-500 rounded-r-xl my-2 shadow-theme">
                          <span className="text-sm md:text-base font-black text-primary tracking-tight">{children}</span>
                        </div>
                      );
                    }
                    
                    if (isSection) {
                      return (
                        <h3 className="text-indigo-600 font-black text-lg md:text-xl border-b-2 border-indigo-50 pb-2 mt-8 mb-4 uppercase tracking-tighter" {...props}>
                          {children}
                        </h3>
                      );
                    }

                    return <h3 className="text-primary font-bold text-lg my-4" {...props}>{children}</h3>;
                  },
                  li: ({node, ...props}) => (
                    <li className="flex gap-3 items-start mb-3 text-sm md:text-base text-secondary bg-indigo-50/30 p-2 rounded-lg border border-indigo-100/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                      <span className="font-medium">{props.children}</span>
                    </li>
                  ),
                  ul: ({node, ...props}) => <ul className="list-none p-0 my-4 space-y-2" {...props} />,
                  code: ({node, inline, className, children, ...props}) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <div className="rounded-2xl overflow-hidden my-6 shadow-theme-2xl shadow-indigo-100/50 border border-color bg-gray-900">
                        <SyntaxHighlighter style={atomDark} language={match ? match[1] : 'javascript'} PreTag="div" {...props}>
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-mono text-[13px] font-bold" {...props}>{children}</code>
                    );
                  },
                  p: ({node, ...props}) => <p className="text-sm md:text-base text-secondary leading-relaxed my-2" {...props} />,
                  hr: () => <hr className="my-8 border-color" />
                }}
              >
                {definition}
              </ReactMarkdown>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
              <div className="w-20 h-20 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-black text-gray-400 tracking-widest uppercase animate-pulse">Scanning student dictionary...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-200 space-y-8 py-20">
              <div className="p-10 bg-secondary rounded-full">
                <Search className="w-20 h-20 text-indigo-100" />
              </div>
              <div className="text-center max-w-sm px-6">
                <p className="text-2xl font-black text-primary uppercase tracking-tighter">Fast Knowledge</p>
                <p className="text-xs md:text-sm text-gray-400 mt-3 font-medium leading-relaxed">
                  Enter any coding word like <span className="text-indigo-400 font-bold underline">"map"</span> or <span className="text-indigo-400 font-bold underline">"const"</span>. 
                  We'll give you category, purpose, properties, and more in seconds.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordsDictionary;
