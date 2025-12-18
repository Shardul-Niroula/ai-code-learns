import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Trash2, User, Bot, Loader2, Sparkles, ChevronDown, Copy, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { createChatSession } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const TempChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCopying, setIsCopying] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession();
      }

      if (!chatSessionRef.current) {
        setMessages(prev => [...prev, { role: 'model', content: "AI setup failed. Please check your API key settings at the top right." }]);
        setIsTyping(false);
        return;
      }

      const stream = await chatSessionRef.current.sendMessageStream({ message: userMessage });
      
      let aiResponse = "";
      // Initialize with empty content to trigger the "Thinking" state first
      setMessages(prev => [...prev, { role: 'model', content: "" }]);

      for await (const chunk of stream) {
        const text = chunk.text;
        aiResponse += text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: aiResponse };
          return updated;
        });
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "An error occurred while chatting. This might be due to an invalid API key or connection issues." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    chatSessionRef.current = null;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopying(id);
    setTimeout(() => setIsCopying(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-primary relative">
      {/* Header Info */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-primary/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl text-white shadow-theme-lg shadow-indigo-100">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black text-primary tracking-tight flex items-center gap-2">
              AI Code Assistant
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black bg-indigo-50 text-indigo-600 uppercase tracking-widest border border-indigo-100">Pro</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em]">Ready to assist</span>
            </div>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
        >
          <Trash2 className="w-4 h-4" />
          Reset Chat
        </button>
      </div>

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 scrollbar-hide bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500 blur-[80px] rounded-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative p-12 bg-primary border border-color rounded-[48px] shadow-theme-2xl transition-transform group-hover:scale-105 duration-500">
                <Sparkles className="w-20 h-20 text-indigo-500 animate-pulse" />
              </div>
            </div>
            <div className="max-w-md px-4">
              <h3 className="text-4xl font-black text-primary tracking-tighter mb-4 uppercase">Free Flow Chat</h3>
              <p className="text-sm md:text-base font-medium text-secondary leading-relaxed mb-8">
                Your private, temporary playground for ideas, debugging, and learning. No history saved, no limits on curiosity.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Explain Closure', icon: '🔒' },
                  { label: 'Debug React Bug', icon: '🐛' },
                  { label: 'Write an API', icon: '🌐' },
                  { label: 'Code Career Tips', icon: '🚀' }
                ].map(item => (
                  <button 
                    key={item.label}
                    onClick={() => { setInput(item.label); handleSend(); }}
                    className="flex items-center gap-3 px-5 py-3.5 bg-primary border border-color text-xs font-black text-secondary rounded-2xl hover:border-indigo-400 hover:text-indigo-600 shadow-theme hover:shadow-indigo-100 hover:shadow-theme-xl transition-all group"
                  >
                    <span className="text-lg group-hover:scale-125 transition-transform">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-12">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-6 duration-500`}>
                <div className={`flex gap-5 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-theme-xl transition-transform hover:scale-110 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-primary border border-color'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <Bot className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />}
                  </div>
                  
                  {/* Bubble Container */}
                  <div className={`relative flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`
                      px-5 py-4 md:px-7 md:py-6 rounded-[32px] shadow-theme relative overflow-hidden
                      ${msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-200' 
                        : 'bg-primary text-primary border border-color rounded-tl-none shadow-theme'
                      }
                    `}>
                      {/* Thinking State for bot */}
                      {msg.role === 'model' && !msg.content && isTyping && (
                        <div className="flex items-center gap-3 py-2">
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                          </div>
                          <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Processing</span>
                        </div>
                      )}

                      <div className={`
                        prose prose-sm md:prose-base max-w-none 
                        ${msg.role === 'user' ? 'prose-p:text-white prose-p:font-medium' : 'prose-p:text-primary prose-headings:text-primary prose-headings:font-black prose-headings:tracking-tighter'}
                        prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:rounded-[24px] prose-pre:p-0 prose-pre:my-6
                        prose-strong:text-indigo-600 prose-strong:font-black
                        prose-ul:my-6 prose-li:my-2
                        prose-hr:border-color prose-hr:my-8
                      `}>
                        <ReactMarkdown
                          components={{
                            h1: ({children}) => <h1 className="text-2xl md:text-3xl border-b-2 border-indigo-50 pb-3 mb-6">{children}</h1>,
                            h2: ({children}) => <h2 className="text-xl md:text-2xl mt-8 mb-4 flex items-center gap-2">
                              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                              {children}
                            </h2>,
                            h3: ({children}) => <h3 className="text-lg md:text-xl font-bold text-indigo-700 mt-6 mb-3">{children}</h3>,
                            code({node, inline, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeValue = String(children).replace(/\n$/, '');
                              const codeId = `code-${idx}-${Math.random()}`;
                              
                              return !inline ? (
                                <div className="relative group/code rounded-[24px] overflow-hidden border border-gray-800 my-6 shadow-theme-2xl">
                                  <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                      {match ? match[1] : 'code'}
                                    </span>
                                    <button 
                                      onClick={() => copyToClipboard(codeValue, codeId)}
                                      className="text-gray-400 hover:text-white transition-colors"
                                    >
                                      {isCopying === codeId ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                  </div>
                                  <SyntaxHighlighter 
                                    style={atomDark} 
                                    language={match ? match[1] : 'javascript'} 
                                    PreTag="div"
                                    customStyle={{ margin: 0, padding: '24px', fontSize: '13px', lineHeight: '1.6' }}
                                    {...props}
                                  >
                                    {codeValue}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className={`px-2 py-0.5 rounded-md font-mono text-[13px] font-black ${msg.role === 'user' ? 'bg-indigo-500/50 text-white' : 'bg-indigo-50 text-indigo-600'}`} {...props}>
                                  {children}
                                </code>
                              );
                            },
                            blockquote: ({children}) => (
                              <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/50 p-4 rounded-r-2xl italic text-indigo-900 my-6">
                                {children}
                              </blockquote>
                            ),
                            ul: ({children}) => <ul className="list-none space-y-3 pl-2">{children}</ul>,
                            li: ({children}) => (
                              <li className="flex items-start gap-3">
                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                                <div className="flex-1">{children}</div>
                              </li>
                            )
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    {/* Timestamp or Status */}
                    <span className={`text-[9px] font-black uppercase tracking-widest text-gray-300 transition-opacity ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.role === 'model' && isTyping && idx === messages.length - 1 ? 'Streaming Response...' : 'Delivered'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} className="h-10" />
      </div>

      {/* Input Field Area */}
      <div className="p-4 md:p-10 border-t border-color bg-primary/80 backdrop-blur-md shrink-0 z-10">
        <div className="max-w-4xl mx-auto relative">
          {/* Action indicator */}
          {isTyping && (
            <div className="absolute -top-10 left-4 flex items-center gap-2 px-3 py-1 bg-indigo-600 rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-theme-xl animate-bounce">
              <Loader2 className="w-3 h-3 animate-spin" />
              Assistant is Thinking
            </div>
          )}

          <div className={`
            relative flex items-end gap-3 bg-secondary border border-color rounded-[32px] p-2 md:p-3 transition-all shadow-inner
            ${isTyping ? 'opacity-70 grayscale' : 'focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 focus-within:bg-primary'}
          `}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message AI Code Assistant..."
              className="flex-1 bg-transparent border-none outline-none text-sm md:text-base py-3 px-5 resize-none max-h-48 scrollbar-hide font-medium"
              rows={1}
              disabled={isTyping}
              style={{ minHeight: '3rem' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`
                p-4 rounded-[24px] transition-all shadow-theme-xl flex items-center justify-center
                ${input.trim() && !isTyping 
                  ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white hover:shadow-indigo-200 hover:scale-105 active:scale-95' 
                  : 'bg-tertiary text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex justify-between items-center mt-5 px-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Powered by Gemini 3 Flash</p>
            </div>
            <div className="hidden sm:flex gap-6">
               <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Shift+Enter for multi-line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempChat;