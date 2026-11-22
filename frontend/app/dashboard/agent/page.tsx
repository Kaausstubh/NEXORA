"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Cpu,
  Layers,
  Search,
  BarChart2,
  Bookmark,
  RefreshCw,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { api, getUser } from "@/lib/api";

const QUICK_PROMPTS = [
  "Find Python internships in Pune with at least ₹15,000 stipend and PPO",
  "Show remote AI/ML internships in Indian startups with PPO",
  "Find AICTE and PM Internship Scheme opportunities in India",
  "Analyze my skill gap for an AI Backend Engineer role",
  "Compare top opportunities in Pune and Bengaluru"
];

export default function AgentPage() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string; tool_calls?: any }>>([
    {
      id: "intro",
      role: "assistant",
      content: "Hello! I am your **NEXORA Career Intelligence Agent**, powered by our LangGraph workflow.\n\nI have active context on your candidate profile, registered skills, and the active pgvector opportunity index. How can I help steer your career trajectory today?",
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getUser());
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      if (list.length > 0 && !conversationId) {
        setConversationId(list[0].id);
        if (list[0].messages && list[0].messages.length > 0) {
          setMessages(list[0].messages);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setConversationId(id);
    try {
      const conv = await api.getConversation(id);
      if (conv.messages) {
        setMessages(conv.messages);
      }
    } catch (err) {
      console.error("Failed to fetch conversation details", err);
    }
  };

  const startNewConversation = () => {
    setConversationId(undefined);
    setMessages([
      {
        id: "intro-new",
        role: "assistant",
        content: "Started a fresh career strategy session. Ask me to find matching jobs, compare companies, or run skill gap diagnostics.",
      }
    ]);
  };

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await api.chatWithAgent(text, conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: response.id || `ai-${Date.now()}`,
          role: response.role,
          content: response.content,
          tool_calls: response.tool_calls,
        }
      ]);

      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
      }
      loadConversations();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Error executing agent workflow: ${err.message || "Failed to reach AI service."}`,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row gap-6">
      {/* Sidebar: Conversation Threads */}
      <div className="w-full lg:w-72 bg-white rounded-2xl border border-border p-4 shadow-subtle flex flex-col shrink-0">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-stone" />
            <h2 className="font-heading font-bold text-sm text-charcoal">
              Conversations
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={startNewConversation} className="text-xs">
            + New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-stone p-2">No previous sessions yet.</p>
          ) : (
            conversations.map((c) => {
              const isActive = conversationId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all truncate block ${
                    isActive
                      ? "bg-ivory border border-border text-charcoal font-bold"
                      : "text-stone hover:text-charcoal hover:bg-ivory/50"
                  }`}
                >
                  {c.title || "Career Strategy Chat"}
                </button>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-border">
          <div className="p-2.5 rounded-xl bg-ivory border border-border text-[11px] text-stone space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-charcoal">
              <Cpu className="w-3.5 h-3.5 text-lime-dark" />
              LangGraph State Graph
            </div>
            <p className="text-[10px] leading-tight">
              Tools: search_jobs, compare_jobs, analyze_skill_gap, candidate_profile
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl border border-border shadow-subtle flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-charcoal flex items-center justify-center text-lime font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-charcoal flex items-center gap-2">
                NEXORA Autonomous Career Agent
                <Badge variant="lime" size="sm">Active</Badge>
              </h3>
              <p className="text-[11px] text-stone">
                Stateful tool-calling agent with memory in PostgreSQL
              </p>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto justify-end" : ""}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-charcoal flex items-center justify-center text-lime shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="space-y-1.5 max-w-2xl">
                  {/* Tool Call Pill if present */}
                  {m.tool_calls && m.tool_calls.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {m.tool_calls.map((tc: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-ivory border border-border text-[10px] font-mono text-stone-dark">
                          <Cpu className="w-2.5 h-2.5 text-lime-dark" />
                          executed tool: <strong>{tc.name}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? "bg-charcoal text-white rounded-tr-none"
                        : "bg-ivory border border-border text-charcoal rounded-tl-none whitespace-pre-wrap font-sans"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-lime flex items-center justify-center text-charcoal shrink-0 font-bold text-xs mt-0.5">
                    {user?.name?.[0] || "U"}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-7 h-7 rounded-lg bg-charcoal flex items-center justify-center text-lime shrink-0">
                <Bot className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-ivory border border-border text-stone text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-lime animate-ping" />
                Invoking LangGraph agent: detecting intent, selecting tools, retrieving PostgreSQL opportunities...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-ivory/50 border-t border-border flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] uppercase font-bold text-stone shrink-0">
            Suggested:
          </span>
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="px-2.5 py-1 bg-white border border-border hover:border-charcoal rounded-md text-stone-dark hover:text-charcoal whitespace-nowrap text-xs transition-colors shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything: 'Find FastAPI jobs', 'Compare TechNova and TensorPath', 'What skills am I missing?'"
              className="flex-1 px-4 py-3 bg-ivory rounded-xl border border-border text-sm text-charcoal focus:outline-none focus:border-charcoal focus:bg-white transition-all"
            />
            <Button
              type="submit"
              variant="accent"
              size="md"
              disabled={loading || !inputMessage.trim()}
              className="px-5 py-3 rounded-xl shadow-sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
