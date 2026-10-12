import React from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.hash = '#catalogo';
    window.location.reload();
  };

  handleClearCacheAndRecover = () => {
    if (window.confirm('Isso redefinirá os dados temporários em cache do navegador para restaurar a integridade do sistema. Deseja prosseguir?')) {
      try {
        sessionStorage.clear();
      } catch (e) {}
      window.location.href = '/';
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/40">
              <AlertTriangle size={36} />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Sistema de Proteção & Recuperação Fabril
              </span>
              <h1 className="text-2xl font-bold font-['Outfit'] text-white">
                Ops! Ocorreu uma interrupção inesperada.
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                Não se preocupe: seus dados e pedidos estão protegidos. Escolha uma das opções abaixo para retomar a navegação imediatamente.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw size={15} /> Recarregar Página
              </button>

              <button
                onClick={this.handleGoHome}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Home size={15} /> Voltar ao Início
              </button>

              <button
                onClick={this.handleClearCacheAndRecover}
                className="py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/30 flex items-center gap-2 transition-all cursor-pointer"
                title="Limpar memória cache e restaurar"
              >
                <Trash2 size={15} /> Restaurar Sessão
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 text-left">
              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 mx-auto font-medium transition-colors cursor-pointer"
              >
                {this.state.showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {this.state.showDetails ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos do diagnóstico'}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-red-400 overflow-x-auto max-h-48 overflow-y-auto space-y-1">
                  <p className="font-bold">{this.state.error?.toString()}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="text-slate-500 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
