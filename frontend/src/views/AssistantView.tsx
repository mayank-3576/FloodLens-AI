import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  Clock,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  Database,
  Info,
  RefreshCw
} from 'lucide-react';
import { Location, Citation } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
  mode?: string;
  timestamp: string;
}

interface AssistantViewProps {
  locations: Location[];
  activeLocationId: string;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  locations,
  activeLocationId
}) => {
  const { language, t } = useTranslation();
  const activeLocation = locations.find(l => l.id === activeLocationId);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init_welcome',
      sender: 'assistant',
      text: `### Welcome to GIRI AI Assistant\n\nI am your community flood awareness and historical intelligence helper for **${activeLocation?.name || 'India'}**.\n\nI am strictly grounded in verified database observations, documented past flood records, and official meteorological standards. How can I help you explore local flood awareness today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'grounded_knowledge_base',
      citations: [
        {
          title: 'GIRIRAKSHAK Community Knowledge Base',
          source_name: 'Local Grounded Database',
          type: 'Verified Intelligence',
          timestamp: '2026-10-24'
        }
      ]
    }
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    "What is the latest available rainfall for this area?",
    "Which locations have the most historical flood incidents in this dataset?",
    "Compare rainfall and flood history in Noida and Ghaziabad.",
    "What does 80 mm of rainfall mean?",
    "Why can historical flood records not predict the next flood?",
    "Which data sources are used for this location?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

      const res = await api.askAssistant(textToSend, activeLocationId, historyPayload, language);

      const assistantMessage: Message = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        mode: res.mode,
        citations: res.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Assistant error:', err);
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: "I encountered a connectivity error retrieving intelligence records from the backend database. Please ensure the backend server is running.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-bold text-sm text-teal-800 mt-2 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="font-bold text-base text-slate-900 mt-2 mb-1">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-3 border-teal-600 pl-3 py-1.5 my-2 text-slate-700 bg-teal-50/60 rounded-r text-[11px] italic leading-relaxed">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 my-0.5 leading-relaxed">
            {line.replace('- ', '')}
          </li>
        );
      }
      if (line.startsWith('|')) {
        return <div key={idx} className="font-mono text-[10px] text-slate-700 overflow-x-auto py-0.5">{line}</div>;
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return <p key={idx} className="my-1 leading-relaxed text-slate-800">{line}</p>;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
      {/* Left Chat Window (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl flex flex-col shadow-soft overflow-hidden h-[680px]">
        {/* Chat Header */}
        <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>GIRI AI Assistant</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Grounded in Records
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Local awareness inquiry assistant for <strong>{activeLocation?.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setMessages(messages.slice(0, 1))}
            className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors"
            title="Reset conversation"
          >
            Clear Conversation
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/40">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-soft leading-relaxed ${
                    isUser
                      ? 'bg-teal-700 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {isUser ? (
                    <p>{m.text}</p>
                  ) : (
                    <div className="space-y-1">
                      {renderMarkdown(m.text)}

                      {/* Citations & Source Chips */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <Database className="w-3 h-3 text-teal-700" /> Grounded Source References:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {m.citations.map((c, cIdx) => (
                              <span
                                key={cIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-teal-800 border border-slate-200 font-mono"
                              >
                                <span>{c.title}</span>
                                {c.timestamp && <span className="text-slate-400">({c.timestamp.slice(0, 10)})</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
                  {m.timestamp}
                </span>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-teal-700 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl max-w-[220px] shadow-soft">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Checking database records...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompt Chips */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={loading}
              className="shrink-0 px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-[11px] font-medium transition-colors disabled:opacity-50 shadow-2xs"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about recent rainfall, historical flood events, or meteorological standards..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Ask GIRI</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Right Column: AI Grounding & Safeguards (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Safety & Grounding Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft space-y-3">
          <div className="flex items-center gap-2 text-teal-800">
            <CheckCircle2 className="w-5 h-5 text-teal-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Responsible AI Guardrails
            </h4>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0 mt-1.5" />
              <span><strong>Grounding Policy:</strong> Responses retrieve concrete numbers and observation timestamps directly from the database before answering.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0 mt-1.5" />
              <span><strong>No Hallucinations:</strong> Does not invent measurements, flood incidents, or source citations.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0 mt-1.5" />
              <span><strong>No Forecast Guarantees:</strong> Explains that historical records provide context but cannot guarantee flood forecasts.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
              <span><strong>Emergency Disclaimer:</strong> Does not replace official district evacuation orders or IMD alerts.</span>
            </li>
          </ul>
        </div>

        {/* Common Community Inquiries */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-soft space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-teal-700" />
            <span>Suggested Questions</span>
          </h4>
          <div className="space-y-1.5">
            {suggestionChips.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 hover:text-teal-800 transition-colors"
              >
                &ldquo;{s}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Active Context Card */}
        {activeLocation && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-soft text-xs space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
              Active Context Focus:
            </span>
            <div className="text-slate-900 font-bold">{activeLocation.name}</div>
            <div className="text-teal-800 text-[11px]">{activeLocation.basin_name || 'River Basin'}</div>
            <div className="text-slate-500 text-[11px] font-mono">
              Coordinates: {activeLocation.latitude.toFixed(4)}°N, {activeLocation.longitude.toFixed(4)}°E
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
