import React, { useState, useRef, useEffect } from "react";
import {
  X, Send, Bot, User, Sparkles, Trophy, Search,
  Focus, ChevronUp, ChevronDown, Trash2, Copy, BookOpen
} from "lucide-react";
import { LumenMascot } from "./SmdFlowMascot";
import { SmdFlowCelebration } from "./SmdFlowCelebration";
import { SmdFlowQuests } from "./SmdFlowQuests";
import { SmdFlowTutorials } from "./SmdFlowTutorials";
import { askLumenAssistant } from "../../lib/smdAssistIa";
import { useStore } from "../../context/StoreContext";

const MEMORY_KEY = "lumen_memory";
const MEMORY_TTL_MS = 48 * 60 * 60 * 1000; // 48h

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return null;
    const mem = JSON.parse(raw);
    if (Date.now() - mem.lastSeenAt > MEMORY_TTL_MS) {
      localStorage.removeItem(MEMORY_KEY);
      return null;
    }
    return mem;
  } catch {
    return null;
  }
}

function saveMemory(messages, userName) {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const lastTopic = lastUserMsg?.content?.slice(0, 80) ?? null;
  const mem = { messages: messages.slice(-10), lastTopic, lastSeenAt: Date.now(), userName };
  localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
}

function clearMemory() {
  localStorage.removeItem(MEMORY_KEY);
}

function buildGreeting(mem) {
  const hour = new Date().getHours();
  const period = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const name = mem?.userName ? `, ${mem.userName}` : "";
  if (mem?.lastTopic) {
    return `${period}${name}! 👋 Bem-vindo de volta ao Lumen! Você estava me perguntando sobre "${mem.lastTopic.trim()}" — quer continuar ou tem alguma dúvida nova?`;
  }
  return `${period}${name}! 👋 Eu sou o Lumen, seu assistente na plataforma SMD Drop. Como posso te ajudar hoje?`;
}

const SUGGESTIONS = [
  "Qual o status do meu pedido em produção?",
  "Como gerar kit de marketing e legendas no Lumen?",
  "Qual o cálculo de lucro para Mercado Livre e Shopee?",
  "Quais produtos temos no catálogo atual?",
];

export function SmdAssistantChat() {
  const { viewMode, setViewMode, products, materials, orders, cart, currentUser } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const getLiveSystemContext = () => {
    const modeText = viewMode === 'factory' ? 'Fábrica / Administração' : 'Revendedor / Catálogo de Atacado';
    const userText = currentUser ? `${currentUser.name} (${currentUser.role || 'revendedor'})` : 'Revendedor Visitante';

    const prodList = products && products.length > 0
      ? products.map((p) => `- ${p.title} (Categoria: ${p.category || 'Geral'})`).join('\n')
      : 'Nenhum produto cadastrado no momento.';

    const matList = materials && materials.length > 0
      ? materials.map((m) => `- ${m.name}`).join('\n')
      : 'Nenhum material de fábrica cadastrado no momento.';

    const orderList = orders && orders.length > 0
      ? orders.map((o) => {
          const statusMap = {
            draft: 'Rascunho / Carrinho',
            pending: 'Pendente de Pagamento',
            in_production: 'Em Produção na Fábrica',
            shipped: 'Enviado (Em trânsito)',
            delivered: 'Entregue',
            cancelled: 'Cancelado'
          };
          const statusLabel = statusMap[o.status] || o.status || 'Em Processamento';
          return `- Pedido #${o.id || o.orderNumber}: Status = "${statusLabel}", Total = R$ ${(parseFloat(o.total) || 0).toFixed(2)}, Data = ${o.date || 'Hoje'}, Rastreio = ${o.trackingCode || 'Aguardando envio'}`;
        }).join('\n')
      : 'Nenhum pedido cadastrado no momento.';

    return `Modo de Visualização Ativo: ${modeText}\n` +
           `Usuário Conectado: ${userText}\n\n` +
           `📦 PRODUTOS REALMENTE CADASTRADOS NO CATÁLOGO ATUAL:\n${prodList}\n\n` +
           `🛠️ MATERIAIS REALMENTE DISPONÍVEIS NA FÁBRICA:\n${matList}\n\n` +
           `🚚 PEDIDOS DO USUÁRIO EM ACOMPANHAMENTO:\n${orderList}`;
  };

  const [messages, setMessages] = useState(() => {
    const mem = loadMemory();
    if (mem && mem.messages.length > 0) {
      return [{ role: "assistant", content: buildGreeting(mem) }, ...mem.messages];
    }
    return [{
      role: "assistant",
      content: "Olá! Eu sou o Lumen, seu assistente inteligente na plataforma SMD Drop! ⚡\n\nComo posso te ajudar hoje?"
    }];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState("normal");
  const messagesEndRef = useRef(null);

  // Drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, isDragging: false, hasMoved: false });

  // Idle state
  const [isIdle, setIsIdle] = useState(false);
  const idleTimeoutRef = useRef(null);

  // Modals & Panels
  const [showQuests, setShowQuests] = useState(false);
  const [showTutorials, setShowTutorials] = useState(false);

  // Spotlight (copiloto rapido)
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [spotlightInput, setSpotlightInput] = useState("");
  const [spotlightLoading, setSpotlightLoading] = useState(false);
  const [spotlightResult, setSpotlightResult] = useState(null);
  const spotlightInputRef = useRef(null);

  // Focus Mode (25 min timer)
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60);

  // Quick actions menu above mascot
  const [showActions, setShowActions] = useState(false);

  // Easter egg dizzy
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const [isDizzy, setIsDizzy] = useState(false);

  // Idle tip timer
  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 60000);
  };

  useEffect(() => {
    resetIdleTimer();
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowSpotlight(false);
        setShowQuests(false);
        setShowTutorials(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Timer do Modo Foco
  useEffect(() => {
    let timer;
    if (isFocusMode && focusTimeLeft > 0) {
      timer = setInterval(() => setFocusTimeLeft((p) => p - 1), 1000);
    } else if (focusTimeLeft === 0 && isFocusMode) {
      setIsFocusMode(false);
      setEmotion("celebrating");
      window.dispatchEvent(new CustomEvent("smdflow-sale", { detail: { value: "Sessão de Foco SMD Concluída por Lumen! 🎯" } }));
      setTimeout(() => setEmotion("normal"), 4000);
    }
    return () => clearInterval(timer);
  }, [isFocusMode, focusTimeLeft]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) setTimeout(scrollToBottom, 100);
  }, [isOpen, messages]);

  // Handle Drag / Click on mascot
  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastX: position.x,
      lastY: position.y,
      isDragging: true,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragRef.current.hasMoved = true;
    }
    setPosition({ x: dragRef.current.lastX + deltaX, y: dragRef.current.lastY + deltaY });
  };

  const handlePointerUp = (e) => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;

    if (!dragRef.current.hasMoved) {
      // Click detected
      clickCountRef.current += 1;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

      clickTimerRef.current = setTimeout(() => {
        if (clickCountRef.current === 1) {
          setIsOpen((prev) => !prev);
          setShowQuests(false);
          setShowTutorials(false);
        }
        clickCountRef.current = 0;
      }, 300);

      if (clickCountRef.current >= 5) {
        setIsDizzy(true);
        clickCountRef.current = 0;
        setTimeout(() => setIsDizzy(false), 2000);
      }
    }

    setTimeout(() => setIsDragging(false), 50);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Enviar mensagem no Chat Principal
  const handleSend = async (text) => {
    if (!text.trim() || loading) return;
    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setEmotion("thinking");

    try {
      const response = await askLumenAssistant({
        tool: "suporte-sistema",
        input: text,
        history: [...messages, userMessage].slice(-6),
        systemContext: getLiveSystemContext(),
      });

      if (response && response.success && response.content) {
        const nextMessages = [...messages, userMessage, { role: "assistant", content: response.content }];
        setMessages(nextMessages);
        saveMemory(nextMessages, "Revendedor SMD");
        setEmotion("happy");
        setTimeout(() => setEmotion("normal"), 3000);
      } else {
        const errMsg = response?.error || "Desculpe, ocorreu um erro ao consultar o Lumen.";
        setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
        setEmotion("error");
        setTimeout(() => setEmotion("normal"), 3000);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erro de conexão com o Lumen." }]);
      setEmotion("error");
      setTimeout(() => setEmotion("normal"), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Enviar no Spotlight
  const handleSpotlightSend = async () => {
    if (!spotlightInput.trim() || spotlightLoading) return;
    setSpotlightLoading(true);
    setSpotlightResult(null);
    setEmotion("thinking");

    try {
      const response = await askLumenAssistant({
        tool: "suporte-sistema",
        input: spotlightInput,
        history: [],
        systemContext: getLiveSystemContext(),
      });

      if (response && response.success && response.content) {
        setSpotlightResult(response.content);
        setEmotion("happy");
        setTimeout(() => setEmotion("normal"), 3000);
      } else {
        setSpotlightResult("Erro ao consultar o assistente. Tente novamente.");
        setEmotion("error");
        setTimeout(() => setEmotion("normal"), 3000);
      }
    } catch {
      setSpotlightResult("Erro de conexão com o Lumen.");
      setEmotion("error");
      setTimeout(() => setEmotion("normal"), 3000);
    } finally {
      setSpotlightLoading(false);
    }
  };

  const currentEmotion = isFocusMode ? "focus" : isIdle && !isOpen ? "sleeping" : emotion;

  return (
    <>
      <SmdFlowCelebration />

      {/* === SPOTLIGHT COPILOTO IA MODAL === */}
      {showSpotlight && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSpotlight(false);
              setSpotlightResult(null);
            }
          }}
        >
          <div className="w-[520px] max-w-[92vw] bg-slate-900/95 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-white">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-gradient-to-r from-purple-950/60 to-slate-900">
              <div className="size-9 rounded-xl bg-purple-600/30 flex items-center justify-center shrink-0 border border-purple-500/50">
                <Sparkles className="size-5 text-purple-400 animate-pulse" />
              </div>
              <input
                ref={spotlightInputRef}
                type="text"
                value={spotlightInput}
                onChange={(e) => setSpotlightInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSpotlightSend()}
                placeholder="Copiloto Lumen: O que deseja calcular ou saber agora?"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
              />
              {spotlightInput && (
                <button
                  onClick={handleSpotlightSend}
                  disabled={spotlightLoading}
                  className="size-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shrink-0 transition active:scale-95 disabled:opacity-50"
                >
                  {spotlightLoading ? (
                    <span className="size-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="size-3.5" />
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowSpotlight(false);
                  setSpotlightResult(null);
                }}
                className="size-8 rounded-lg hover:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 hover:text-white transition"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {spotlightResult && (
              <div className="p-4 max-h-72 overflow-y-auto bg-slate-950/50">
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{spotlightResult}</p>
              </div>
            )}

            {!spotlightResult && !spotlightLoading && (
              <div className="p-3 flex flex-wrap gap-1.5 bg-slate-950/40">
                {[
                  "Como orçar acrílico por m²?",
                  "Regras de envio cego de marketplace",
                  "Dicas de precificação Neon LED",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSpotlightInput(s);
                      setTimeout(handleSpotlightSend, 50);
                    }}
                    className="text-xs bg-slate-800/80 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-500/50 rounded-full px-3 py-1 text-slate-300 hover:text-white transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {spotlightLoading && (
              <div className="p-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <span className="size-4 border-2 border-purple-500/40 border-t-purple-400 rounded-full animate-spin" />
                Lumen analisando sua solicitação...
              </div>
            )}

            <div className="px-4 py-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>Pressione ESC para fechar</span>
              <span>Lumen Copiloto</span>
            </div>
          </div>
        </div>
      )}

      {/* === FLOATING WIDGET === */}
      <div
        className={`fixed bottom-6 right-6 z-[1900] flex flex-col items-end ${
          !isDragging ? "transition-transform duration-700 ease-out" : ""
        }`}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        {/* Chat Window */}
        {isOpen && (
          <div className="w-[350px] md:w-[380px] h-[500px] bg-slate-900/95 border border-purple-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-xl text-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 p-3.5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="size-9 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-400/30 relative">
                  <Bot className="size-5 text-purple-200" />
                  <div className="absolute bottom-0 right-0 size-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-none flex items-center gap-1">
                    Lumen ⚡
                    <Sparkles className="size-3 text-amber-300 fill-amber-300 animate-pulse" />
                  </p>
                  <p className="text-[10px] text-purple-200 mt-0.5">Assistente Virtual SMD Drop</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowTutorials((p) => !p)}
                  title="Guias Práticos Lumen"
                  className={`size-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition ${
                    showTutorials ? "bg-white/20 text-white" : "text-amber-300"
                  }`}
                >
                  <BookOpen className="size-4" />
                </button>
                <button
                  onClick={() => setShowQuests((p) => !p)}
                  title="Missões Diárias"
                  className="size-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition text-amber-300"
                >
                  <Trophy className="size-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Deseja reiniciar a conversa com o Lumen?")) {
                      clearMemory();
                      setMessages([
                        { role: "assistant", content: "Conversa reiniciada! Como posso te ajudar agora?" }
                      ]);
                    }
                  }}
                  title="Limpar Conversa"
                  className="size-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition text-slate-300 hover:text-white"
                >
                  <Trash2 className="size-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="size-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            {showTutorials ? (
              <div className="flex-1 overflow-y-auto p-3.5 bg-slate-950/40">
                <SmdFlowTutorials onClose={() => setShowTutorials(false)} />
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-950/50">
                  {messages.map((m, idx) => (
                    <div key={idx} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div
                        className={`size-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          m.role === "user"
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "bg-slate-800 border-purple-500/30 text-purple-300"
                        }`}
                      >
                        {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                      </div>
                      <div className="flex flex-col gap-1 max-w-[78%]">
                        <div
                          className={`p-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                            m.role === "user"
                              ? "bg-purple-600 text-white rounded-tr-none font-medium"
                              : "bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none"
                          }`}
                        >
                          {m.content}
                        </div>
                        {m.role === "assistant" && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(m.content);
                            }}
                            className="self-start text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 ml-1 transition"
                          >
                            <Copy className="size-3" /> Copiar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2.5 flex-row items-center text-xs text-slate-400">
                      <div className="size-7 rounded-lg bg-slate-800 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <Bot className="size-3.5 text-purple-400" />
                      </div>
                      <div className="p-2.5 bg-slate-800/80 rounded-xl rounded-tl-none border border-slate-700/80 flex items-center gap-1">
                        <span className="size-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="size-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="size-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestions on start */}
                {messages.length <= 2 && (
                  <div className="p-2.5 bg-slate-950/70 border-t border-slate-800 flex flex-col gap-1">
                    <p className="text-[10px] text-slate-400 font-bold px-1 uppercase tracking-wider">Perguntas Rápidas:</p>
                    <div className="flex flex-wrap gap-1">
                      {SUGGESTIONS.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(s)}
                          className="text-[10px] bg-slate-800 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-500/50 px-2.5 py-1 rounded-full text-slate-300 hover:text-white transition text-left truncate max-w-full"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(input);
                  }}
                  className="p-2.5 border-t border-slate-800 bg-slate-900 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pergunte ao Lumen..."
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="size-8 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white flex items-center justify-center transition active:scale-95 shrink-0"
                  >
                    <Send className="size-3.5" />
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Mascot & Popups */}
        <div className="relative">
          {/* Quests popup */}
          {showQuests && !isOpen && (
            <div className="absolute bottom-[105%] right-0">
              <SmdFlowQuests onClose={() => setShowQuests(false)} />
            </div>
          )}

          {/* Quick Actions toggle button */}
          {!isOpen && (
            <div className="flex justify-center mb-1">
              <button
                onClick={() => setShowActions(!showActions)}
                className="size-5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-purple-500/30 backdrop-blur-md transition shadow-md"
                title="Opções Rápidas do Lumen"
              >
                {showActions ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
              </button>
            </div>
          )}

          {/* Quick Buttons above mascot */}
          {showActions && !isOpen && (
            <div className="flex justify-center gap-1.5 mb-2 animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => {
                  setShowQuests((p) => !p);
                }}
                className="size-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transition active:scale-90"
                title="Missões Diárias"
              >
                <Trophy className="size-3.5" />
              </button>
              <button
                onClick={() => {
                  setShowSpotlight(true);
                  setSpotlightResult(null);
                  setSpotlightInput("");
                  setTimeout(() => spotlightInputRef.current?.focus(), 100);
                }}
                className="size-7 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transition active:scale-90"
                title="Copiloto IA"
              >
                <Sparkles className="size-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsFocusMode(!isFocusMode);
                }}
                className={`size-7 rounded-full text-white flex items-center justify-center shadow-lg transition active:scale-90 ${
                  isFocusMode ? "bg-red-500 animate-pulse" : "bg-rose-600 hover:bg-rose-500"
                }`}
                title="Modo Foco Faturamento (25 min)"
              >
                <Focus className="size-3.5" />
              </button>
            </div>
          )}

          {/* Mascot Component */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"} relative flex flex-col items-center`}
          >
            <LumenMascot
              emotion={currentEmotion}
              isDizzy={isDizzy}
              className={isDragging ? "scale-105" : ""}
            />

            {/* Timer do Modo Foco sob o mascote */}
            {isFocusMode && (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">
                {Math.floor(focusTimeLeft / 60)}:{(focusTimeLeft % 60).toString().padStart(2, "0")}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Export para compatibilidade
export { SmdAssistantChat as LumenAssistantChat };
