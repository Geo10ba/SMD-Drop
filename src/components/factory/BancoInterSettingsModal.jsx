import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Key, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Save, 
  X,
  Zap,
  Lock
} from 'lucide-react';
import { 
  getBancoInterConfig, 
  saveBancoInterConfig, 
  testBancoInterConnection 
} from '../../lib/bancoInter';
import { SMD_DROP_CNPJ_FORMATTED } from '../../utils/pixGenerator';
import { useStore } from '../../context/StoreContext';

export const BancoInterSettingsModal = ({ isOpen, onClose }) => {
  const { showNotification } = useStore();
  const [config, setConfig] = useState(getBancoInterConfig);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleCrtUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig((prev) => ({ ...prev, certificateCrt: event.target.result }));
        showNotification(`Certificado ${file.name} carregado!`);
      };
      reader.readAsText(file);
    }
  };

  const handleKeyUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig((prev) => ({ ...prev, certificateKey: event.target.result }));
        showNotification(`Chave privada ${file.name} carregada!`);
      };
      reader.readAsText(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveBancoInterConfig(config);
    showNotification('Configurações da API Banco Inter salvas com sucesso!', 'success');
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testBancoInterConnection(config);
    setTesting(false);
    setTestResult(result);
    if (result.success) {
      showNotification(result.message, 'success');
    } else {
      showNotification(result.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col p-6 shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black shadow-inner">
              <Building2 size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-gold uppercase tracking-wider text-[10px] font-black">
                  API PIX OFICIAL BANCO INTER PJ
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  0% DE TAXAS
                </span>
              </div>
              <h3 className="text-xl font-black text-white font-['Outfit'] mt-0.5">
                Confirmação Automática de PIX (Inter PJ)
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Zap size={16} />
              <span>Como funciona a baixa automática com o Banco Inter?</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Ao conectar sua aplicação PJ do Banco Inter, o sistema gera o QR Code com TxID único para a conta do CNPJ <strong className="text-amber-400">{SMD_DROP_CNPJ_FORMATTED}</strong>. Assim que o cliente paga no banco dele, o Inter dispara o Webhook instantâneo e a tela confirma o pedido/saldo em <strong>2 segundos sem nenhuma taxa</strong>!
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                Chave PIX Cadastrada no Inter (CNPJ Fixo)
              </label>
              <input 
                type="text" 
                readOnly 
                value={SMD_DROP_CNPJ_FORMATTED}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                  Client ID (Gerado no Internet Banking Inter)
                </label>
                <input 
                  type="text"
                  placeholder="Ex: 8b3c...-....-..."
                  value={config.clientId}
                  onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white placeholder-slate-600 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-1">
                  Client Secret
                </label>
                <input 
                  type="password"
                  placeholder="••••••••••••••••••••"
                  value={config.clientSecret}
                  onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white placeholder-slate-600 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Certificate Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="border border-slate-800 bg-slate-900/60 p-3 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-300 block uppercase flex items-center gap-1">
                  <FileCode size={13} className="text-amber-400" /> Certificado (.crt)
                </span>
                <input 
                  type="file" 
                  accept=".crt,.pem" 
                  onChange={handleCrtUpload}
                  className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
                {config.certificateCrt && (
                  <span className="text-[10px] text-emerald-400 font-bold block flex items-center gap-1">
                    <CheckCircle2 size={11} /> Certificado Carregado
                  </span>
                )}
              </div>

              <div className="border border-slate-800 bg-slate-900/60 p-3 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-300 block uppercase flex items-center gap-1">
                  <Key size={13} className="text-amber-400" /> Chave Privada (.key)
                </span>
                <input 
                  type="file" 
                  accept=".key" 
                  onChange={handleKeyUpload}
                  className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
                {config.certificateKey && (
                  <span className="text-[10px] text-emerald-400 font-bold block flex items-center gap-1">
                    <CheckCircle2 size={11} /> Chave Privada Carregada
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tutorial Quick Links */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-[11px] space-y-1.5 text-slate-400">
            <span className="font-bold text-white block">Onde encontrar no seu Internet Banking do Inter:</span>
            <p>1. Acesse o Inter PJ pelo computador $\to$ <strong>Conta Digital</strong> $\to$ <strong>Aplicações / API Empresas</strong>.</p>
            <p>2. Clique em <strong>Nova Aplicação</strong> $\to$ marque <strong>PIX</strong> $\to$ baixe os 2 arquivos de certificado e copie o Client ID/Secret.</p>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
              testResult.success 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {testing ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              <span>Testar Conexão</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-gold px-5 py-2.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5"
              >
                <Save size={14} /> Salvar Credenciais
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
