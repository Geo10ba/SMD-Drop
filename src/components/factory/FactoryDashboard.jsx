import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  DollarSign, 
  Package, 
  Truck, 
  Users, 
  TrendingUp, 
  Factory, 
  AlertCircle, 
  FileUp, 
  Sparkles, 
  FolderTree, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Award,
  BarChart2,
  Layers,
  ShoppingBag,
  Download,
  FileText,
  Sliders,
  Settings,
  Globe,
  ShieldCheck,
  Plus,
  Save,
  Building2
} from 'lucide-react';
import { CategoryManagerModal } from './CategoryManagerModal';
import { EditProductModal } from './EditProductModal';
import { ApproveRejectProductModal } from './ApproveRejectProductModal';
import { MaterialManagerModal } from './MaterialManagerModal';
import { MagicImportModal } from '../reseller/MagicImportModal';
import { Wand2, Clock, CheckCircle, XCircle as XCircleIcon } from 'lucide-react';

export const FactoryDashboard = ({ onOpenFulfillment, onOpenNewProduct }) => {
  const { 
    orders, 
    products, 
    categories, 
    materials,
    users, 
    pendingProducts,
    openMagicImport,
    itemsPerPage,
    setItemsPerPage,
    itemsPerRow,
    setItemsPerRow,
    companySettings,
    updateCompanySettings,
    updateUserStatus, 
    deleteUser, 
    deleteOrder, 
    updateOrderStatus,
    showNotification
  } = useStore();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'products', 'orders', 'users', 'pending', 'settings'
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isMaterialManagerOpen, setIsMaterialManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [evaluatingPendingProduct, setEvaluatingPendingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState(() => ({ ...companySettings }));
  const [newSiteTitle, setNewSiteTitle] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');

  React.useEffect(() => {
    if (companySettings) {
      setSettingsForm({ ...companySettings });
    }
  }, [companySettings]);

  const handleSaveCompanySettings = (e) => {
    e.preventDefault();
    updateCompanySettings(settingsForm);
  };

  const handleAddMySite = () => {
    if (!newSiteTitle || !newSiteUrl) {
      showNotification('Informe o título e a URL do site.', 'error');
      return;
    }
    const updatedSites = [...(settingsForm.mySites || []), { title: newSiteTitle, url: newSiteUrl }];
    setSettingsForm((prev) => ({ ...prev, mySites: updatedSites }));
    setNewSiteTitle('');
    setNewSiteUrl('');
    showNotification('Site adicionado à lista do rodapé!');
  };

  const handleRemoveMySite = (index) => {
    const updatedSites = (settingsForm.mySites || []).filter((_, idx) => idx !== index);
    setSettingsForm((prev) => ({ ...prev, mySites: updatedSites }));
  };

  // Metrics
  const totalWholesaleRevenue = orders.reduce((acc, order) => acc + order.wholesaleTotal, 0);
  const pendingOrders = orders.filter((o) => o.status === 'aguardando_impressao');
  const inProductionOrders = orders.filter((o) => o.status === 'em_producao');
  const dispatchedOrders = orders.filter((o) => o.status === 'despachado' || o.status === 'entregue');

  const marketplaceOrdersCount = orders.filter((o) => o.dispatchMode === 'marketplace_label').length;
  const directOrdersCount = orders.filter((o) => o.dispatchMode === 'direct_blind_shipping').length;

  // Filtered Products for Management
  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // SVG Chart Data (Factory Monthly Volume)
  const factoryMonthlyData = [
    { month: 'Mar', revenue: 14200, count: 85 },
    { month: 'Abr', revenue: 21900, count: 120 },
    { month: 'Mai', revenue: 38400, count: 210 },
    { month: 'Jun', revenue: 32000, count: 180 },
    { month: 'Jul', revenue: 54900, count: 310 },
    { month: 'Ago', revenue: 68200, count: 390 },
  ];
  const maxRevenue = Math.max(...factoryMonthlyData.map(d => d.revenue));

  const handleDownloadLabelPdf = (order) => {
    const labelFileName = order.labelPdf || `Etiqueta_${order.marketplace || 'Marketplace'}_${order.id}.pdf`;
    const dummyContent = `PDF ETIQUETA ENVIOS MARKETPLACE - PEDIDO ${order.id} - RASTREIO ${order.trackingCode}`;
    const element = document.createElement("a");
    const file = new Blob([dummyContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = labelFileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification(`Etiqueta "${labelFileName}" baixada com sucesso!`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Factory Overview Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-8 text-white shadow-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="badge-gold uppercase tracking-widest text-[10px] mb-2 inline-flex items-center gap-1">
              <Factory size={12} /> CENTRAL DE PRODUÇÃO & EXPEDIÇÃO DE FÁBRICA
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-['Outfit'] tracking-tight">
              Painel do Fabricante (Gestão Total)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Controle absoluto sobre produtos, pedidos, revendedores cadastrados e expedição de etiquetas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsMaterialManagerOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 py-2.5 px-4 rounded-xl text-xs font-extrabold shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Layers size={16} /> 🎨 Tabela de Materiais (R$/m²)
            </button>

            <button
              onClick={() => openMagicImport()}
              className="btn-gold py-2.5 px-4 text-xs font-bold shadow-lg flex items-center gap-1.5"
            >
              <Wand2 size={16} /> ⚡ Botão Mágico (Importar)
            </button>

            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-2 rounded-xl border border-slate-700 text-xs shadow-inner">
              <span className="text-amber-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Sliders size={14} /> Por Página:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-900 text-amber-400 font-extrabold px-2 py-1 rounded-lg border border-amber-500/40 text-xs cursor-pointer focus:outline-none"
              >
                <option value={3}>3 p/ página</option>
                <option value={6}>6 p/ página</option>
                <option value={12}>12 p/ página</option>
                <option value={18}>18 p/ página</option>
                <option value={24}>24 p/ página</option>
                <option value={48}>48 p/ página</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-2 rounded-xl border border-slate-700 text-xs shadow-inner">
              <span className="text-amber-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Layers size={14} /> Por Linha:
              </span>
              <select
                value={itemsPerRow}
                onChange={(e) => setItemsPerRow(Number(e.target.value))}
                className="bg-slate-900 text-amber-400 font-extrabold px-2 py-1 rounded-lg border border-amber-500/40 text-xs cursor-pointer focus:outline-none"
              >
                <option value={3}>3 por linha</option>
                <option value={4}>4 por linha</option>
                <option value={6}>⚡ 6 por linha (Recomendado)</option>
              </select>
            </div>

            <button
              onClick={() => setIsMaterialManagerOpen(true)}
              className="btn-gold py-2.5 px-3.5 text-xs font-bold shadow-md flex items-center gap-1.5"
              title="Gerenciar Tabela de Preços por m² e Lucro Líquido da Fábrica"
            >
              <Layers size={16} /> Preços & Lucro m²
            </button>

            <button
              onClick={() => setIsCategoryManagerOpen(true)}
              className="btn-secondary py-2.5 px-3.5 text-xs font-semibold bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700"
            >
              <FolderTree size={15} /> Categorias ({categories.length})
            </button>

            <button
              onClick={onOpenFulfillment}
              className="btn-secondary py-2.5 px-3.5 text-xs font-semibold bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700"
            >
              <Truck size={16} /> Central de Expedição ({pendingOrders.length})
            </button>

            <button
              onClick={onOpenNewProduct}
              className="btn-secondary py-2.5 px-3.5 text-xs font-semibold bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700"
            >
              + Cadastro Manual
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu Grid - Zero Horizontal Scroll */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full pt-6 border-t border-slate-700/60 mt-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-between gap-1.5 border text-xs ${
              activeTab === 'analytics' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md border-amber-400' 
                : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <BarChart2 size={15} className="shrink-0" /> Analítico
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-between gap-1.5 border text-xs ${
              activeTab === 'pending' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md border-amber-400' 
                : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Clock size={15} className="shrink-0" /> Solicitações
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
              activeTab === 'pending' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {pendingProducts.filter(p => p.status === 'pending_approval').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-between gap-1.5 border text-xs ${
              activeTab === 'orders' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md border-amber-400' 
                : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <ShoppingBag size={15} className="shrink-0" /> Pedidos
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
              activeTab === 'orders' ? 'bg-slate-950/20 text-slate-950' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-between gap-1.5 border text-xs ${
              activeTab === 'products' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md border-amber-400' 
                : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Package size={15} className="shrink-0" /> Catálogo
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
              activeTab === 'products' ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-between gap-1.5 border text-xs ${
              activeTab === 'users' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md border-amber-400' 
                : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Users size={15} className="shrink-0" /> Revendedores
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
              activeTab === 'users' ? 'bg-slate-950/20 text-slate-950' : 'bg-purple-500/20 text-purple-400'
            }`}>
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-between gap-1.5 border text-xs ${
              activeTab === 'settings' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md border-amber-400' 
                : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Settings size={15} className="shrink-0" /> Configurações
            </span>
          </button>
        </div>

        {/* Pending Approval Alert Banner for Admin */}
        {pendingProducts.filter(p => p.status === 'pending_approval').length > 0 && (
          <div className="mt-4 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-slate-900 font-extrabold shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="font-extrabold text-amber-500 text-sm">
                  ⚠️ {pendingProducts.filter(p => p.status === 'pending_approval').length} Produto(s) Sugerido(s) por Revendedores Aguardando sua Aprovação!
                </p>
                <p className="text-[var(--text-muted)] text-xs mt-0.5">
                  Revise as sugestões, defina o Custo Fábrica de Atacado e publique no catálogo oficial.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('pending')}
              className="btn-gold py-2 px-4 text-xs font-extrabold whitespace-nowrap shrink-0 shadow-md"
            >
              📋 Avaliar Produtos Agora →
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          {/* Financial & Production Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="text-xs font-bold uppercase tracking-wider">Faturamento Atacado</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <DollarSign size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[var(--text-main)] font-['Outfit']">
                R$ {totalWholesaleRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp size={12} /> Receita da fábrica recebida via PIX
              </span>
            </div>

            <div className="glass-panel p-5 space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="text-xs font-bold uppercase tracking-wider">Revendedores Ativos</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <Users size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[var(--text-main)] font-['Outfit']">
                {users.length} <span className="text-xs font-normal text-[var(--text-muted)]">contas</span>
              </p>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                {users.filter(u => u.status === 'aprovado').length} aprovados no portal
              </span>
            </div>

            <div className="glass-panel p-5 space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="text-xs font-bold uppercase tracking-wider">Aguardando Impressão</span>
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                  <FileUp size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[var(--text-main)] font-['Outfit']">
                {pendingOrders.length} <span className="text-xs font-normal text-[var(--text-muted)]">pedidos</span>
              </p>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <AlertCircle size={12} /> Requer despacho urgente
              </span>
            </div>

            <div className="glass-panel p-5 space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="text-xs font-bold uppercase tracking-wider">Etiquetas Marketplaces</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Package size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[var(--text-main)] font-['Outfit']">
                {marketplaceOrdersCount} <span className="text-xs font-normal text-[var(--text-muted)]">pedidos</span>
              </p>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                Mercado Livre, Shopee & Amazon
              </span>
            </div>
          </div>

          {/* SVG Bar Chart for Factory Revenue */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                  CRESCIMENTO OPERACIONAL FABRIL
                </span>
                <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit']">
                  Faturamento de Atacado da Fábrica (Últimos 6 Meses)
                </h3>
              </div>
            </div>

            <div className="h-64 w-full pt-4">
              <div className="h-full flex items-end justify-between gap-4 px-4 border-b border-[var(--border-color)] pb-2">
                {factoryMonthlyData.map((d, i) => {
                  const barHeight = (d.revenue / maxRevenue) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full bg-slate-800/40 rounded-t-lg h-full flex items-end justify-center p-1 relative">
                        <div
                          className="w-full bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 rounded-t-md transition-all duration-300 group-hover:brightness-110 relative"
                          style={{ height: `${barHeight}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap shadow z-20">
                            R$ {d.revenue.toLocaleString('pt-BR')} ({d.count} ped)
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[var(--text-muted)] font-mono">{d.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & ETIQUETAS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
                <FileUp className="text-amber-500" /> Gestão de Pedidos & Download de Etiquetas
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Baixe o PDF da etiqueta anexada pelo revendedor ou altere o status de produção.
              </p>
            </div>
            <button onClick={onOpenFulfillment} className="btn-gold text-xs font-bold py-2 px-4">
              <Truck size={14} /> Abrir Expedição Térmica
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Revendedor</th>
                  <th className="p-3">Modalidade</th>
                  <th className="p-3">Baixar Etiqueta PDF</th>
                  <th className="p-3">Valor Custo</th>
                  <th className="p-3">Status Atual</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="p-3 font-mono font-extrabold text-amber-600 dark:text-amber-400">{o.id}</td>
                    <td className="p-3 font-semibold">{o.resellerName}</td>
                    <td className="p-3">
                      {o.dispatchMode === 'marketplace_label' ? (
                        <span className="badge-ml text-[10px] whitespace-nowrap">{o.marketplace}</span>
                      ) : (
                        <span className="badge-gold text-[10px] whitespace-nowrap">Envio Direto Cego</span>
                      )}
                    </td>
                    <td className="p-3">
                      {o.dispatchMode === 'marketplace_label' ? (
                        <button
                          onClick={() => handleDownloadLabelPdf(o)}
                          className="btn-gold text-[11px] font-bold py-1.5 px-3 whitespace-nowrap shadow-sm flex items-center gap-1.5"
                        >
                          <Download size={13} /> Baixar Etiqueta (PDF)
                        </button>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)] font-medium">Frete Fábrica</span>
                      )}
                    </td>
                    <td className="p-3 font-bold font-mono">R$ {o.wholesaleTotal.toFixed(2)}</td>
                    <td className="p-3">
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        className="input-field py-1 text-[11px] font-bold"
                      >
                        <option value="aguardando_impressao">Aguardando Impressão</option>
                        <option value="em_producao">Em Produção / Corte</option>
                        <option value="despachado">Despachado</option>
                        <option value="entregue">Entregue</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir pedido ${o.id}?`)) deleteOrder(o.id);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                        title="Excluir Pedido"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit']">
                Gestão Total do Catálogo de Produtos
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Altere custos, valores por m², estoque e imagens de qualquer item cadastrado na fábrica.
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-9 py-1.5 text-xs font-medium"
                />
              </div>
              <button onClick={onOpenNewProduct} className="btn-gold text-xs font-bold py-1.5 px-3 shrink-0">
                + Novo Produto
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Tipo Precificação</th>
                  <th className="p-3">Custo Fábrica</th>
                  <th className="p-3">Preço Sugerido</th>
                  <th className="p-3">Estoque</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="p-3 font-semibold flex items-center gap-3">
                      <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-[var(--border-color)]" />
                      <span>{p.title}</span>
                    </td>
                    <td className="p-3 text-[var(--text-muted)] font-medium">{p.category}</td>
                    <td className="p-3">
                      {p.pricingType === 'custom_m2' ? (
                        <span className="badge-gold text-[10px]">Sob Medida (m²)</span>
                      ) : (
                        <span className="badge-emerald text-[10px]">Preço Fixo</span>
                      )}
                    </td>
                    <td className="p-3 font-bold font-mono">
                      {p.pricingType === 'custom_m2' ? `R$ ${p.pricePerM2.toFixed(2)}/m²` : `R$ ${p.wholesalePrice.toFixed(2)}`}
                    </td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      {p.pricingType === 'custom_m2' ? `R$ ${p.suggestedPricePerM2.toFixed(2)}/m²` : `R$ ${p.suggestedRetailPrice.toFixed(2)}`}
                    </td>
                    <td className="p-3 font-bold">
                      {p.pricingType === 'custom_m2' ? "Corte a Laser" : `${p.factoryStock} un`}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="btn-secondary text-[11px] font-bold py-1 px-3"
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USERS / RESELLERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit']">
                Gestão de Revendedores Cadastrados & Níveis VIP
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Aprove novos revendedores, conceda descontos de atacado por volume e gerencie permissões.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3">Revendedor / Empresa</th>
                  <th className="p-3">CNPJ / CPF</th>
                  <th className="p-3">WhatsApp / Email</th>
                  <th className="p-3">Status Aprovação</th>
                  <th className="p-3">Nível VIP & Desconto</th>
                  <th className="p-3">Total Comprado</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="p-3 font-extrabold">{u.name}</td>
                    <td className="p-3 font-mono">{u.cnpj}</td>
                    <td className="p-3 text-[var(--text-muted)] font-medium">{u.phone} <br/> {u.email}</td>
                    <td className="p-3">
                      {u.status === 'aprovado' ? (
                        <span className="badge-emerald text-[10px] whitespace-nowrap inline-block font-extrabold">Aprovado</span>
                      ) : (
                        <span className="badge-gold text-[10px] whitespace-nowrap inline-block font-extrabold">Aguardando Aprovação</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 font-bold text-amber-500 whitespace-nowrap">
                        <Award size={14} /> {u.tier} ({u.discountPercent}% OFF)
                      </div>
                    </td>
                    <td className="p-3 font-bold font-mono whitespace-nowrap">R$ {u.totalSpent.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        {u.status !== 'aprovado' && (
                          <button
                            onClick={() => updateUserStatus(u.id, 'aprovado', 'Bronze', 0)}
                            className="btn-gold text-[11px] font-bold py-1.5 px-3 shadow-sm shrink-0"
                          >
                            Aprovar Conta
                          </button>
                        )}
                        <button
                          onClick={() => updateUserStatus(u.id, 'aprovado', 'VIP Gold', 5)}
                          className="btn-secondary text-[11px] font-bold py-1.5 px-3 shrink-0"
                          title="Tornar VIP Gold (+5% Desconto)"
                        >
                          Tornar VIP
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Remover revendedor ${u.name}?`)) deleteUser(u.id);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded shrink-0"
                          title="Excluir Revendedor"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS, FOOTER, MY SITES & LEGAL SHIELDING */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveCompanySettings} className="glass-panel p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
                <Settings className="text-amber-500" /> Configurações Gerais, Rodapé & Blindagem Jurídica
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Altere o nome da empresa, redes sociais, lista de Meus Sites e edite os Termos e Privacidade da plataforma.
              </p>
            </div>

            <button type="submit" className="btn-gold py-2.5 px-6 font-bold shadow-md text-xs flex items-center gap-1.5 shrink-0">
              <Save size={16} /> Salvar Todas as Configurações
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Company Profile & Contacts */}
            <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)] space-y-3">
              <h4 className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
                <Building2 size={15} /> 1. Dados Institucionais & Suporte
              </h4>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={settingsForm.name || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="input-field font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Subtítulo Institucional</label>
                <input
                  type="text"
                  value={settingsForm.subtitle || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, subtitle: e.target.value })}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">CNPJ Fábrica</label>
                  <input
                    type="text"
                    value={settingsForm.cnpj || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cnpj: e.target.value })}
                    className="input-field font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Telefone Suporte</label>
                  <input
                    type="text"
                    value={settingsForm.phone || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="input-field font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Email Oficial de Contato</label>
                <input
                  type="email"
                  value={settingsForm.email || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  className="input-field font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Endereço do Galpão Fabril</label>
                <input
                  type="text"
                  value={settingsForm.address || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="input-field text-xs"
                />
              </div>
            </div>

            {/* Box 2: Social Media Links */}
            <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)] space-y-3">
              <h4 className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
                <Globe size={15} /> 2. Links das Redes Sociais no Rodapé
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Link Instagram</label>
                <input
                  type="text"
                  value={settingsForm.socialLinks?.instagram || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    socialLinks: { ...settingsForm.socialLinks, instagram: e.target.value }
                  })}
                  placeholder="https://instagram.com/..."
                  className="input-field font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Link Facebook</label>
                <input
                  type="text"
                  value={settingsForm.socialLinks?.facebook || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    socialLinks: { ...settingsForm.socialLinks, facebook: e.target.value }
                  })}
                  placeholder="https://facebook.com/..."
                  className="input-field font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Link WhatsApp Direct</label>
                <input
                  type="text"
                  value={settingsForm.socialLinks?.whatsapp || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    socialLinks: { ...settingsForm.socialLinks, whatsapp: e.target.value }
                  })}
                  placeholder="https://wa.me/55..."
                  className="input-field font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Link YouTube</label>
                <input
                  type="text"
                  value={settingsForm.socialLinks?.youtube || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    socialLinks: { ...settingsForm.socialLinks, youtube: e.target.value }
                  })}
                  placeholder="https://youtube.com/@..."
                  className="input-field font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Box 3: My Sites Management */}
          <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)] space-y-3">
            <h4 className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
              <Globe size={15} /> 3. Gerenciamento de "Meus Sites" (Links no Rodapé)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Título do Site (ex: Loja Oficial)"
                value={newSiteTitle}
                onChange={(e) => setNewSiteTitle(e.target.value)}
                className="input-field text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="URL completa (https://...)"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                className="input-field text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleAddMySite}
                className="btn-gold text-xs font-bold py-2 px-4 flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus size={15} /> Adicionar Site
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {settingsForm.mySites && settingsForm.mySites.map((site, index) => (
                <div key={index} className="flex items-center justify-between bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-color)] text-xs">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-amber-500 shrink-0" />
                    <span className="font-bold">{site.title}</span>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">({site.url})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMySite(index)}
                    className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                    title="Remover Site"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Box 4: Legal Shielding Editors */}
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
              <ShieldCheck size={16} /> 4. Blindagem Jurídica & Documentos Contratuais
            </h4>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--text-main)]">
                Termos e Condições de Uso (Blindagem Fabril, CDC & Logística Cega)
              </label>
              <textarea
                rows={8}
                value={settingsForm.termsContent || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, termsContent: e.target.value })}
                className="input-field text-xs font-mono leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--text-main)]">
                Política de Privacidade & Proteção de Dados (LGPD - Lei 13.709/2018)
              </label>
              <textarea
                rows={8}
                value={settingsForm.privacyContent || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, privacyContent: e.target.value })}
                className="input-field text-xs font-mono leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-color)] flex justify-end">
            <button type="submit" className="btn-gold py-3 px-8 font-bold text-xs shadow-lg flex items-center gap-2">
              <Save size={16} /> Salvar Todas as Configurações da Empresa
            </button>
          </div>
        </form>
      )}

      {/* TAB: PENDING PRODUCTS FOR ADMIN APPROVAL & PRICING */}
      {activeTab === 'pending' && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
                <Clock className="text-amber-500" /> Solicitações de Produtos Cadastrados por Revendedores
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Revise os produtos sugeridos, defina o Custo de Atacado da Fábrica e Aprove ou Recuse informando o motivo.
              </p>
            </div>
          </div>

          {pendingProducts.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] space-y-2">
              <CheckCircle size={36} className="mx-auto text-emerald-500 opacity-60" />
              <p className="text-sm font-semibold">Nenhuma solicitação pendente no momento.</p>
              <p className="text-xs">Todos os produtos sugeridos por revendedores foram precificados e avaliados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3">Produto Sugerido</th>
                    <th className="p-3">Revendedor</th>
                    <th className="p-3">Categoria Sugerida</th>
                    <th className="p-3">Preço Desejado Revenda</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ação Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                  {pendingProducts.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="p-3 font-semibold flex items-center gap-3">
                        <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover border border-[var(--border-color)]" />
                        <div>
                          <p className="font-extrabold">{item.title}</p>
                          <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{item.description}</p>
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        <span className="font-bold">{item.resellerName}</span>
                        <br />
                        <span className="text-[10px] text-[var(--text-muted)]">{item.resellerEmail}</span>
                      </td>
                      <td className="p-3 text-[var(--text-muted)]">{item.category || "Geral"}</td>
                      <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        R$ {item.suggestedRetailPrice?.toFixed(2)}
                      </td>
                      <td className="p-3">
                        {item.status === 'pending_approval' && (
                          <span className="badge-gold text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <Clock size={12} /> Aguardando Precificação
                          </span>
                        )}
                        {item.status === 'approved' && (
                          <span className="badge-emerald text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <CheckCircle size={12} /> Aprovado no Catálogo
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <div>
                            <span className="badge-red text-[10px] font-extrabold flex items-center gap-1 w-fit">
                              <XCircleIcon size={12} /> Recusado
                            </span>
                            <p className="text-[10px] text-red-500 font-medium mt-0.5 line-clamp-1">
                              Motivo: {item.rejectionReason}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {item.status === 'pending_approval' ? (
                          <button
                            onClick={() => setEvaluatingPendingProduct(item)}
                            className="btn-gold text-[11px] font-bold py-1.5 px-3 shadow-sm"
                          >
                            Avaliar & Precificar
                          </button>
                        ) : (
                          <button
                            onClick={() => setEvaluatingPendingProduct(item)}
                            className="btn-secondary text-[11px] font-bold py-1 px-3"
                          >
                            Reavaliar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* Evaluate Pending Product Modal */}
      {evaluatingPendingProduct && (
        <ApproveRejectProductModal
          pendingProduct={evaluatingPendingProduct}
          onClose={() => setEvaluatingPendingProduct(null)}
        />
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />

      {/* Material Manager Modal */}
      <MaterialManagerModal
        isOpen={isMaterialManagerOpen}
        onClose={() => setIsMaterialManagerOpen(false)}
      />
    </div>
  );
};
