
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Settings, Loader2, Wand2, Info, Plus, Trash2, Edit2, Check, X, GripVertical, FilePlus, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { explainCode } from '../services/geminiService';
import { DEFAULT_PREFERENCES, Preference } from '../types';

const CodeExplainer: React.FC = () => {
  const [code, setCode] = useState<string>('// Paste your code here to get an explanation\n\nfunction helloWorld() {\n  console.log("Hello, student!");\n}');
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Resizing and Responsive state
  const [leftWidth, setLeftWidth] = useState<number>(50); 
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  
  // Mobile Top-Sheet state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(true);
  const [mobileDragY, setMobileDragY] = useState<number>(0);
  const [isDraggingMobile, setIsDraggingMobile] = useState<boolean>(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);

  // Preference management
  const [allPreferences, setAllPreferences] = useState<Preference[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Editing state for Preferences
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editInstruction, setEditInstruction] = useState('');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileDragY(0);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load Preferences
  useEffect(() => {
    const savedAll = localStorage.getItem('all_available_prefs');
    const savedSelected = localStorage.getItem('user_selected_prefs');
    if (savedAll) {
      try { setAllPreferences(JSON.parse(savedAll)); } catch (e) { setAllPreferences(DEFAULT_PREFERENCES); }
    } else { setAllPreferences(DEFAULT_PREFERENCES); }
    if (savedSelected) {
      try { setSelectedIds(JSON.parse(savedSelected)); } catch (e) {}
    }
  }, []);

  // Persist Preferences
  useEffect(() => {
    if (allPreferences.length > 0) localStorage.setItem('all_available_prefs', JSON.stringify(allPreferences));
  }, [allPreferences]);

  useEffect(() => {
    localStorage.setItem('user_selected_prefs', JSON.stringify(selectedIds));
  }, [selectedIds]);

  const handleAddPreference = () => {
    const newId = `custom-${Date.now()}`;
    const newPref: Preference = { id: newId, label: 'New Style', instruction: 'Explain as if...' };
    setAllPreferences([newPref, ...allPreferences]);
    startEditing(newPref);
  };

  const startEditing = (pref: Preference) => {
    setEditingId(pref.id);
    setEditLabel(pref.label);
    setEditInstruction(pref.instruction);
  };

  const saveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingId) return;
    setAllPreferences(allPreferences.map(p => 
      p.id === editingId ? { ...p, label: editLabel, instruction: editInstruction } : p
    ));
    setEditingId(null);
  };

  const deletePreference = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAllPreferences(allPreferences.filter(p => p.id !== id));
    setSelectedIds(selectedIds.filter(sid => sid !== id));
    if (editingId === id) setEditingId(null);
  };

  const handlePreferenceToggle = (id: string) => {
    if (editingId === id) return; // Don't toggle while editing
    const next = selectedIds.includes(id) ? selectedIds.filter(p => p !== id) : [...selectedIds, id];
    setSelectedIds(next);
  };

  // Resizing/Dragging handlers (simplified for brevity while maintaining function)
  const startResizing = useCallback((e: React.MouseEvent | React.TouchEvent) => { if (!isMobile) setIsResizing(true); }, [isMobile]);
  const startMobileDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isMobile) return;
    setIsDraggingMobile(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStartY.current = clientY;
  }, [isMobile]);

  const stopDragging = useCallback(() => {
    setIsResizing(false);
    if (isDraggingMobile) {
      setIsDraggingMobile(false);
      if (mobileDragY > 100) setIsEditorOpen(true);
      else if (mobileDragY < -100) setIsEditorOpen(false);
      setMobileDragY(0);
    }
  }, [isDraggingMobile, mobileDragY]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (isResizing && !isMobile && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const newWidth = ((clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
    }
    if (isDraggingMobile && isMobile) {
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      setMobileDragY(clientY - dragStartY.current);
    }
  }, [isResizing, isDraggingMobile, isMobile]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', stopDragging);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [handleMouseMove, stopDragging]);

  const handleSubmit = async () => {
    if (!code.trim() || isLoading) return;
    setIsLoading(true);
    setExplanation('');
    if (isMobile) setIsEditorOpen(false);
    const selectedPrefs = allPreferences.filter(p => selectedIds.includes(p.id));
    try {
      const result = await explainCode(code, selectedPrefs);
      setExplanation(result);
    } catch (err) { setExplanation("Failed to fetch explanation."); }
    finally { setIsLoading(false); }
  };

  const handleClearAll = () => { setCode('// Paste your code here...\n\n'); setExplanation(''); if (isMobile) setIsEditorOpen(true); };

  const mobileSheetOffset = isEditorOpen ? 0 : -90;
  const finalMobileTransform = isDraggingMobile 
    ? `translateY(calc(${isEditorOpen ? '0%' : '-90%'} + ${mobileDragY}px))` 
    : `translateY(${mobileSheetOffset}%)`;

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row flex-1 overflow-hidden h-full relative bg-gray-50">
      
      {/* Settings Modal: CRUD for Styles */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-5 md:p-8 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg md:text-2xl font-bold flex items-center gap-2 text-gray-800">
                <Settings className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" /> AI Styles
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={handleAddPreference} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {allPreferences.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm">No styles found. Add your first one!</p>
                </div>
              )}
              {allPreferences.map(pref => (
                <div 
                  key={pref.id} 
                  onClick={() => handlePreferenceToggle(pref.id)} 
                  className={`group relative p-3 md:p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedIds.includes(pref.id) ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                >
                  {editingId === pref.id ? (
                    <form onSubmit={saveEdit} className="space-y-3" onClick={e => e.stopPropagation()}>
                      <input 
                        className="w-full text-sm font-bold bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Label"
                        autoFocus
                      />
                      <textarea 
                        className="w-full text-[10px] md:text-xs bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 h-16 resize-none"
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        placeholder="AI Prompt..."
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingId(null)} className="text-[10px] uppercase font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Save</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selectedIds.includes(pref.id) ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                        {selectedIds.includes(pref.id) && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-gray-800 text-sm md:text-base truncate">{pref.label}</h4>
                        <p className="text-[10px] md:text-xs text-gray-500 truncate">{pref.instruction}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); startEditing(pref); }} className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => deletePreference(pref.id, e)} className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-rose-600 border border-transparent hover:border-rose-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setShowSettings(false)} className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold text-sm md:text-base shadow-lg shadow-indigo-100">
              Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* Editor Section */}
      <div 
        style={isMobile ? { transform: finalMobileTransform, transition: isDraggingMobile ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 40 } : { width: `${leftWidth}%` }}
        className={`bg-white flex flex-col border-b md:border-r shadow-2xl md:shadow-none ${isMobile ? 'absolute top-0 left-0 right-0 h-[60vh] rounded-b-[40px]' : 'h-full'}`}
      >
        <div className="flex-1 min-h-0">
          <Editor height="100%" defaultLanguage="javascript" value={code} onChange={(val) => setCode(val || '')} theme="vs-light"
            options={{ minimap: { enabled: false }, fontSize: isMobile ? 12 : 14, automaticLayout: true, scrollBeyondLastLine: false, padding: { top: 20 }, lineNumbers: 'on', roundedSelection: true }} />
        </div>
        <div className="p-3 md:p-4 border-t bg-gray-50 flex items-center justify-between shrink-0">
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-[11px] md:text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-all shadow-sm">
            <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Styles</span>
            {selectedIds.length > 0 && <span className="bg-indigo-600 text-white text-[9px] rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center font-bold">{selectedIds.length}</span>}
          </button>
          <button onClick={handleSubmit} disabled={isLoading || !code.trim()} className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-indigo-600 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100">
            {isLoading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Wand2 className="w-4 h-4 md:w-5 md:h-5" />}
            <span>Explain</span>
          </button>
        </div>
        {isMobile && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer" onClick={() => setIsEditorOpen(!isEditorOpen)} onMouseDown={startMobileDrag} onTouchStart={startMobileDrag}>
            <div className="bg-white p-2 rounded-full shadow-lg border border-indigo-50 text-indigo-600">
              {isEditorOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        )}
      </div>

      {!isMobile && (
        <div onMouseDown={startResizing} className={`w-2 cursor-col-resize flex items-center justify-center transition-all z-10 ${isResizing ? 'bg-indigo-600' : 'bg-gray-100 hover:bg-indigo-200'}`}>
          <div className="p-0.5 rounded-full bg-white shadow-md border border-gray-200"><GripVertical className="w-4 h-4 text-gray-400" /></div>
        </div>
      )}

      {/* Explanation Area */}
      <div style={!isMobile ? { width: `${100 - leftWidth}%` } : {}} className={`flex-1 flex flex-col bg-white overflow-hidden ${isMobile ? 'pt-12' : ''}`}>
        <div className="p-3 md:p-4 border-b bg-gray-50/50 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-gray-700 flex items-center gap-2 text-sm md:text-base">
            <Info className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" /> AI Help
          </h2>
          <button onClick={handleClearAll} className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 transition-all shadow-sm">
            <FilePlus className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 md:p-10 prose prose-indigo max-w-none prose-pre:bg-transparent prose-pre:p-0">
          {explanation ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ReactMarkdown components={{
                p: 'div',
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <div className="rounded-2xl overflow-hidden my-6 shadow-xl border border-gray-100">
                      <SyntaxHighlighter style={atomDark} language={match ? match[1] : 'javascript'} PreTag="div" {...props}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
                    </div>
                  ) : ( <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[13px] md:text-sm font-bold" {...props}>{children}</code> )
                }
              }}>{explanation}</ReactMarkdown>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 py-20">
              <div className="w-16 h-16 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm md:text-base font-bold text-gray-600">Thinking...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-6 py-20">
              <Wand2 className="w-12 h-12 md:w-16 md:h-16 text-indigo-100" />
              <div className="text-center max-w-xs px-4">
                <p className="text-xl font-extrabold text-gray-800">Start Learning</p>
                <p className="text-xs text-gray-400 mt-2">Paste code above and click Explain to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeExplainer;
