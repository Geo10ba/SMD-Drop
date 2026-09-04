import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare, CheckCircle, Sparkles } from 'lucide-react';

export const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Check iOS platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDetected = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDetected);

    // Listen for beforeinstallprompt event (Android / Chrome / Edge / Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if dismissed recently
      const dismissed = localStorage.getItem('smd_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleCustomOpenPrompt = () => {
      setShowBanner(true);
      if (iosDetected) {
        setShowIosModal(true);
      }
    };
    window.addEventListener('smd_open_pwa_prompt', handleCustomOpenPrompt);

    // Show banner on iOS if not dismissed and not standalone
    if (iosDetected && !localStorage.getItem('smd_pwa_dismissed')) {
      const isStandaloneMode = window.navigator.standalone === true;
      if (!isStandaloneMode) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('smd_open_pwa_prompt', handleCustomOpenPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosModal(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback prompt for browsers that don't support prompt
      alert('Para instalar o SMD Drop no seu celular:\n\n1. Abra o menu do navegador (3 pontinhos ou opções).\n2. Selecione "Instalar aplicativo" ou "Adicionar à Tela de Início".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('smd_pwa_dismissed', 'true');
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Floating Bottom PWA Mobile/Desktop Install Banner */}
      <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-[9999] animate-fade-in">
        <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500/50 p-4 rounded-2xl shadow-2xl text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center font-extrabold shrink-0 shadow-md">
              <Smartphone size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white font-['Outfit'] truncate">
                  Instalar App SMD Drop
                </span>
                <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-500/40 uppercase shrink-0">
                  Grátis
                </span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-1">
                Acesse o catálogo direto da tela inicial do celular!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="btn-gold py-2 px-3.5 text-xs font-extrabold flex items-center gap-1.5 shadow-lg whitespace-nowrap hover:scale-105 transition-transform"
            >
              <Download size={14} />
              <span>Instalar</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Fechar aviso"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Step-by-Step Installation Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-sm w-full p-6 text-white space-y-4 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white font-['Outfit']">
                    Instalar no iPhone / iPad
                  </h3>
                  <p className="text-[10px] text-slate-400">Siga 3 passos simples no Safari</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-200">Toque no botão Compartilhar</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    Localizado na barra inferior do Safari <Share2 size={13} className="text-amber-400" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-200">Adicionar à Tela de Início</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    Role as opções e selecione <PlusSquare size={13} className="text-amber-400" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-200">Pronto!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    O ícone do <strong>SMD Drop</strong> aparecerá na sua tela inicial como um aplicativo nativo.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="btn-gold w-full py-2.5 text-xs font-bold shadow-md"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
