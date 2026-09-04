import React, { useState, useRef } from 'react';
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
  Building2,
  FileSpreadsheet,
  UploadCloud,
  CheckSquare,
  Square,
  Zap,
  Eye,
  RefreshCw,
  Play,
  Upload,
  FileEdit,
  Image as ImageIcon
} from 'lucide-react';
import { CategoryManagerModal } from './CategoryManagerModal';
import { EditProductModal } from './EditProductModal';
import { ApproveRejectProductModal } from './ApproveRejectProductModal';
import { MaterialManagerModal } from './MaterialManagerModal';
import { MagicImportModal } from '../reseller/MagicImportModal';
import { Wand2, Clock, CheckCircle, XCircle as XCircleIcon } from 'lucide-react';
import { parseShopeeFiles } from '../../lib/shopeeImporter';

export const FactoryDashboard = ({ onOpenFulfillment, onOpenNewProduct }) => {
  const { 
    orders, 
    products, 
    categories, 
    materials,
    users, 
    pendingProducts,
    importShopeeProducts,
    activateProduct,
    activateSelectedDrafts,
    moveProductToDraft,
    moveSelectedToDraft,
    deleteSelectedDrafts,
    updateProduct,
    deleteProduct,
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
    showNotification,
    resetSystemForProduction,
    syncAllToSupabase,
    getSupabaseCredentials,
    saveSupabaseCredentials,
    testSupabaseConnection
  } = useStore();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'products', 'drafts', 'orders', 'users', 'pending', 'settings'
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isMaterialManagerOpen, setIsMaterialManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [evaluatingPendingProduct, setEvaluatingPendingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Draft Management State
  const [draftSearchTerm, setDraftSearchTerm] = useState('');
  const [draftCategoryFilter, setDraftCategoryFilter] = useState('Todos');
  const [selectedDraftIds, setSelectedDraftIds] = useState([]);
  const [isImportingLocal, setIsImportingLocal] = useState(false);
  const fileInputRef = useRef(null);

  // Helper: Auto Import from public/Planilha
  const handleImportLocalFolder = async () => {
    setIsImportingLocal(true);
    showNotification('⏳ Lendo planilhas da pasta public/Planilha...', 'gold');
    try {
      const filenames = [
        'mass_update_basic_info_574648231_20260901072516.xlsx',
        'mass_update_media_info_574648231_20260901072723.xlsx',
        'mass_update_sales_info_574648231_20260901072537.xlsx',
        'mass_update_shipping_info_574648231_20260901072617.xlsx',
        'mass_update_tax_info_574648231_20260901072725.xlsx'
      ];

      const fileObjs = [];
      for (const fn of filenames) {
        try {
          const resp = await fetch(`/Planilha/${fn}`);
          if (resp.ok) {
            const buf = await resp.arrayBuffer();
            fileObjs.push({ name: fn, data: buf });
          }
        } catch (e) {
          console.warn(`Could not fetch /Planilha/${fn}`, e);
        }
      }

      if (fileObjs.length === 0) {
        showNotification('Nenhuma planilha válida foi acessada em public/Planilha', 'error');
        setIsImportingLocal(false);
        return;
      }

      const parsedProds = parseShopeeFiles(fileObjs);
      if (parsedProds && parsedProds.length > 0) {
        const count = importShopeeProducts(parsedProds);
        setActiveTab('drafts');
      } else {
        showNotification('Nenhum produto foi extraído das planilhas.', 'error');
      }
    } catch (err) {
      console.error('Error importing local spreadsheets:', err);
      showNotification(`Erro ao importar planilhas: ${err.message}`, 'error');
    }
    setIsImportingLocal(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsImportingLocal(true);
    showNotification(`⏳ Lendo ${files.length} arquivo(s) de planilha Shopee...`, 'gold');

    try {
      const fileObjs = [];
      for (const file of files) {
        const buf = await file.arrayBuffer();
        fileObjs.push({ name: file.name, data: buf });
      }

      const parsedProds = parseShopeeFiles(fileObjs);
      if (parsedProds && parsedProds.length > 0) {
        importShopeeProducts(parsedProds);
        setActiveTab('drafts');
      } else {
        showNotification('Nenhum produto válido encontrado nas planilhas enviadas.', 'error');
      }
    } catch (err) {
      console.error('Error reading files:', err);
      showNotification(`Erro ao ler arquivos: ${err.message}`, 'error');
    }
    setIsImportingLocal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered product lists
  const draftProducts = products.filter(p => p.status === 'rascunho' || p.status === 'draft' || !p.status);
  const activeCatalogProducts = products.filter(p => p.status === 'approved');

  const filteredDrafts = draftProducts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(draftSearchTerm.toLowerCase()) ||
                          (p.shopeeId && String(p.shopeeId).includes(draftSearchTerm)) ||
                          (p.sku && p.sku.toLowerCase().includes(draftSearchTerm.toLowerCase()));
    const matchesCat = draftCategoryFilter === 'Todos' || p.category === draftCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const toggleSelectDraft = (id) => {
    setSelectedDraftIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAllDrafts = () => {
    if (selectedDraftIds.length === filteredDrafts.length && filteredDrafts.length > 0) {
      setSelectedDraftIds([]);
    } else {
      setSelectedDraftIds(filteredDrafts.map(p => p.id));
    }
  };

  const handleActivateSelected = () => {
    if (selectedDraftIds.length === 0) return;
    if (window.confirm(`Deseja ATIVAR os ${selectedDraftIds.length} produtos selecionados e publicá-los no catálogo oficial?`)) {
      activateSelectedDrafts(selectedDraftIds);
      setSelectedDraftIds([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedDraftIds.length === 0) return;
    if (window.confirm(`Tem certeza que deseja EXCLUIR os ${selectedDraftIds.length} rascunhos selecionados?`)) {
      deleteSelectedDrafts(selectedDraftIds);
      setSelectedDraftIds([]);
    }
  };

  const handleBulkPercentAdjustmentSelected = () => {
    if (selectedDraftIds.length === 0) return;
    const input = window.prompt(`Digite a % de reajuste de preço para aplicar em TODAS as variações dos ${selectedDraftIds.length} produtos selecionados (ex: 10 para aumentar 10%, ou -5 para reduzir 5%):`, "10");
    if (input === null) return;
    const pct = parseFloat(input.replace(',', '.'));
    if (isNaN(pct)) {
      showNotification('Porcentagem inválida informada.', 'error');
      return;
    }

    const factor = 1 + (pct / 100);

    selectedDraftIds.forEach(id => {
      const prod = products.find(p => p.id === id);
      if (prod) {
        let updatedVars = (prod.variations || []).map(v => {
          const nextW = Math.round((parseFloat(v.wholesalePrice) || 0) * factor * 100) / 100;
          const nextR = Math.round((nextW / 0.45) * 100) / 100;
          return { ...v, wholesalePrice: nextW, price: nextR };
        });

        const newWholesale = Math.round((Number(prod.wholesalePrice) || 0) * factor * 100) / 100;
        const newRetail = Math.round((newWholesale / 0.45) * 100) / 100;

        updateProduct(prod.id, {
          wholesalePrice: newWholesale,
          suggestedRetailPrice: newRetail,
          variations: updatedVars
        });
      }
    });

    showNotification(`⚡ Reajuste de ${pct > 0 ? '+' : ''}${pct}% aplicado com sucesso nos ${selectedDraftIds.length} produtos selecionados!`, 'success');
  };

  // Database & Cloud Sync State
  const [dbUrl, setDbUrl] = useState(() => getSupabaseCredentials?.().url || '');
  const [dbKey, setDbKey] = useState(() => getSupabaseCredentials?.().key || '');
  const [dbTestResult, setDbTestResult] = useState(null);
  const [isSyncingDb, setIsSyncingDb] = useState(false);

  const handleTestDb = async () => {
    setDbTestResult({ loading: true, message: 'Testando conexão com Supabase...' });
    const res = await testSupabaseConnection(dbUrl, dbKey);
    setDbTestResult(res);
  };

  const handleSaveDbCredentials = (e) => {
    e.preventDefault();
    saveSupabaseCredentials(dbUrl, dbKey);
    showNotification('Credenciais do banco de dados salvas!');
  };

  const handleSyncAll = async () => {
    setIsSyncingDb(true);
    await syncAllToSupabase();
    setIsSyncingDb(false);
  };

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

  // SVG Chart Data (Factory Monthly Volume calculated dynamically from real orders)
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  const factoryMonthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      revenue: 0,
      count: 0
    };
  });

  orders.forEach((o) => {
    if (!o.createdAt) return;
    const date = new Date(o.createdAt);
    const m = date.getMonth();
    const y = date.getFullYear();
    const found = factoryMonthlyData.find((item) => item.monthIndex === m && item.year === y);
    if (found) {
      found.revenue += (o.wholesaleTotal || 0);
      found.count += 1;
    }
  });

  const maxRevenue = Math.max(100, ...factoryMonthlyData.map(d => d.revenue));

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
              title="Gerenciar Tabela de Preços por m² e Lucro Líquido da Fábrica"
            >
              <Layers size={16} /> 🎨 Preços & Lucro m²
            </button>

            <button
              onClick={() => setIsCategoryManagerOpen(true)}
              className="bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-700 py-2.5 px-3.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
            >
              <FolderTree size={15} className="text-amber-400" /> Categorias ({categories.length})
            </button>

            <button
              onClick={onOpenFulfillment}
              className="bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-700 py-2.5 px-3.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Truck size={16} className="text-amber-400" /> Central de Expedição ({pendingOrders.length})
            </button>

            <button
              onClick={onOpenNewProduct}
              className="bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-700 py-2.5 px-3.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Plus size={16} className="text-amber-400" /> + Cadastro Manual
            </button>

            <button
              onClick={handleImportLocalFolder}
              disabled={isImportingLocal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl text-xs font-extrabold shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Importar produtos em massa das planilhas na pasta public/Planilha como RASCUNHO"
            >
              <FileSpreadsheet size={16} /> ⚡ Importar Planilhas Shopee
            </button>

            <button
              onClick={() => openMagicImport()}
              className="btn-gold py-2.5 px-4 text-xs font-bold shadow-lg flex items-center gap-1.5"
            >
              <Wand2 size={16} /> ⚡ Botão Mágico
            </button>

            <button
              onClick={async () => {
                if (window.confirm("⚠️ Tem certeza de que deseja ZERAR todos os dados (produtos, rascunhos, pedidos e banco de dados Supabase) para colocar o sistema 100% limpo em produção?")) {
                  await resetSystemForProduction();
                }
              }}
              className="bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-300 py-2.5 px-4 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
              title="Zerar dados de simulação para produção"
            >
              <Trash2 size={16} /> 🧹 Zerar Sistema
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
          </div>
        </div>

        {/* Tab Navigation Menu Grid - Zero Horizontal Scroll */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 w-full pt-6 border-t border-slate-700/60 mt-6 text-xs font-bold">
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
            onClick={() => setActiveTab('drafts')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-between gap-1.5 border text-xs ${
              activeTab === 'drafts' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md border-amber-400' 
                : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <FileSpreadsheet size={15} className="shrink-0 text-amber-400" /> Rascunhos
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
              activeTab === 'drafts' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {draftProducts.length}
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
              {activeCatalogProducts.length}
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
        {/* Draft Products Alert Banner */}
        {draftProducts.length > 0 && (
          <div className="mt-3 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent border border-blue-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500 text-slate-900 font-extrabold shrink-0">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <p className="font-extrabold text-blue-400 text-sm">
                  📥 {draftProducts.length} Produto(s) Importado(s) em RASCUNHO Aguardando Ativação!
                </p>
                <p className="text-slate-300 text-xs mt-0.5">
                  Produtos importados das planilhas ficam ocultos no catálogo até você ativá-los.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('drafts')}
              className="btn-gold py-2 px-4 text-xs font-extrabold whitespace-nowrap shrink-0 shadow-md"
            >
              📂 Ver Rascunhos Agora →
            </button>
          </div>
        )}
      </div>

      {/* TAB: DRAFTS & SHOPEE SPREADSHEET IMPORT */}
      {activeTab === 'drafts' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Import Action Panel */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
              <div>
                <span className="badge-gold uppercase tracking-wider text-[10px] font-bold mb-1 inline-flex items-center gap-1">
                  <FileSpreadsheet size={13} /> IMPORTADOR EM MASSA DE PLANILHAS SHOPEE
                </span>
                <h3 className="text-xl font-bold text-[var(--text-main)] font-['Outfit']">
                  Gerenciador de Rascunhos & Importação Shopee
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Ao importar planilhas, os produtos entram no sistema como <strong>RASCUNHO</strong> (ocultos para revendedores), permitindo que você edite e ative apenas os que desejar.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleImportLocalFolder}
                  disabled={isImportingLocal}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Zap size={16} /> ⚡ Importar de public/Planilha
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImportingLocal}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 font-bold text-xs py-2.5 px-4 rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <UploadCloud size={16} /> 📁 Upload Planilha Shopee (.xlsx/.csv)
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
              </div>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)]">
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Total de Rascunhos</span>
                <p className="text-xl font-extrabold text-amber-500 font-['Outfit'] mt-0.5">
                  {draftProducts.length} <span className="text-xs font-normal text-[var(--text-muted)]">itens</span>
                </p>
              </div>

              <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)]">
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Categorias Identificadas</span>
                <p className="text-xl font-extrabold text-[var(--text-main)] font-['Outfit'] mt-0.5">
                  {new Set(draftProducts.map(d => d.category)).size} <span className="text-xs font-normal text-[var(--text-muted)]">categorias</span>
                </p>
              </div>

              <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)]">
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Produtos Ativos no Catálogo</span>
                <p className="text-xl font-extrabold text-emerald-500 font-['Outfit'] mt-0.5">
                  {activeCatalogProducts.length} <span className="text-xs font-normal text-[var(--text-muted)]">visíveis</span>
                </p>
              </div>

              <div className="bg-[var(--bg-surface-hover)] p-3.5 rounded-xl border border-[var(--border-color)]">
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Rascunhos Selecionados</span>
                <p className="text-xl font-extrabold text-blue-400 font-['Outfit'] mt-0.5">
                  {selectedDraftIds.length} <span className="text-xs font-normal text-[var(--text-muted)]">marcados</span>
                </p>
              </div>
            </div>
          </div>

          {/* Draft Products List Section */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Buscar por título, SKU ou ID Shopee..."
                    value={draftSearchTerm}
                    onChange={(e) => setDraftSearchTerm(e.target.value)}
                    className="input-field pl-9 py-1.5 text-xs font-medium"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={draftCategoryFilter}
                  onChange={(e) => setDraftCategoryFilter(e.target.value)}
                  className="input-field py-1.5 text-xs font-bold md:w-48"
                >
                  <option value="Todos">Todas as Categorias ({Array.from(new Set(draftProducts.map(p => p.category))).length})</option>
                  {Array.from(new Set(draftProducts.map(p => p.category))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Batch Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {selectedDraftIds.length > 0 && (
                  <>
                    <button
                      onClick={handleActivateSelected}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold text-xs py-1.5 px-3 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <Play size={14} /> Ativar Selecionados ({selectedDraftIds.length})
                    </button>

                    <button
                      onClick={handleBulkPercentAdjustmentSelected}
                      className="btn-gold font-extrabold text-xs py-1.5 px-3 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles size={14} /> Reajustar % em Massa ({selectedDraftIds.length})
                    </button>

                    <button
                      onClick={handleDeleteSelected}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 size={14} /> Excluir ({selectedDraftIds.length})
                    </button>
                  </>
                )}

                <button
                  onClick={toggleSelectAllDrafts}
                  className="btn-secondary text-xs py-1.5 px-3 font-semibold flex items-center gap-1.5"
                >
                  {selectedDraftIds.length === filteredDrafts.length && filteredDrafts.length > 0 ? (
                    <> <CheckSquare size={14} className="text-amber-500" /> Desmarcar Todos </>
                  ) : (
                    <> <Square size={14} /> Selecionar Todos ({filteredDrafts.length}) </>
                  )}
                </button>
              </div>
            </div>

            {/* Table of Draft Products */}
            {filteredDrafts.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl font-bold">
                  📥
                </div>
                <h4 className="text-base font-bold text-[var(--text-main)] font-['Outfit']">
                  Nenhum Produto em Rascunho Encontrado
                </h4>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                  Clique no botão "⚡ Importar Planilhas Shopee" para carregar as planilhas existentes ou envie novos arquivos .xlsx/.csv!
                </p>
                <button
                  onClick={handleImportLocalFolder}
                  disabled={isImportingLocal}
                  className="btn-gold text-xs font-bold py-2 px-4 shadow-md inline-flex items-center gap-1.5 mt-2"
                >
                  <Zap size={15} /> Importar Planilhas da Pasta public/Planilha
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedDraftIds.length === filteredDrafts.length && filteredDrafts.length > 0}
                          onChange={toggleSelectAllDrafts}
                          className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Produto</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Custo Atacado</th>
                      <th className="p-3">Venda Sugerida</th>
                      <th className="p-3">NCM & Peso</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                    {filteredDrafts.map((p) => {
                      const isSelected = selectedDraftIds.includes(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-amber-500/10 dark:bg-amber-500/20' : 'hover:bg-[var(--bg-surface-hover)]'
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectDraft(p.id)}
                              className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt={p.title}
                                className="w-11 h-11 rounded-lg object-cover border border-[var(--border-color)] shrink-0"
                              />
                              <div className="space-y-0.5">
                                <span className="font-bold text-[var(--text-main)] block line-clamp-1" title={p.title}>
                                  {p.title}
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                                  {p.shopeeId && <span className="font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">ID: {p.shopeeId}</span>}
                                  {p.variations && p.variations.length > 0 && <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">✨ {p.variations.length} variações</span>}
                                  {p.images && p.images.length > 0 && <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">📸 {p.images.length} fotos</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-[var(--text-muted)] font-medium">
                            <span className="bg-[var(--bg-surface-hover)] border border-[var(--border-color)] px-2 py-1 rounded-lg font-semibold text-[11px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-3 font-bold font-mono text-amber-600 dark:text-amber-400">
                            R$ {p.wholesalePrice?.toFixed(2)}
                          </td>
                          <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            R$ {p.suggestedRetailPrice?.toFixed(2)}
                          </td>
                          <td className="p-3 text-[11px]">
                            <div className="font-mono">{p.ncm || '3926.90.90'}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{p.weightKg || 0.5} kg</div>
                          </td>
                          <td className="p-3">
                            <span className="badge-gold text-[10px] font-extrabold whitespace-nowrap">
                              📝 Rascunho
                            </span>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => activateProduct(p.id)}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-[11px] py-1 px-3 rounded-lg shadow-sm flex items-center gap-1"
                                title="Ativar este produto e publicar no catálogo oficial"
                              >
                                <Play size={12} /> Ativar
                              </button>

                              <button
                                onClick={() => setEditingProduct(p)}
                                className="btn-secondary text-[11px] font-bold py-1 px-2.5"
                                title="Editar informações do rascunho"
                              >
                                <Edit2 size={13} />
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm(`Excluir o rascunho "${p.title}"?`)) deleteProduct(p.id);
                                }}
                                className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                title="Excluir Rascunho"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="btn-secondary text-[11px] font-bold py-1 px-3"
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja mover "${p.title}" de volta para os RASCUNHOS? O produto ficará oculto no catálogo até ser ativado novamente.`)) {
                              moveProductToDraft(p.id);
                            }
                          }}
                          className="bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-500 font-bold text-[11px] py-1 px-2.5 rounded-lg flex items-center gap-1 transition-all"
                          title="Mover de volta para Rascunho"
                        >
                          <FileEdit size={13} /> Rascunho
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

          {/* Box 5: Hero Banner Manager (Renda Extra & Revenda) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <h4 className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Sparkles size={16} /> 5. Gestão do Banner Hero da Capa (Renda Extra & Revenda)
              </h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-main)]">
                <input
                  type="checkbox"
                  checked={settingsForm.heroSettings?.enabled ?? true}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    heroSettings: {
                      ...settingsForm.heroSettings,
                      enabled: e.target.checked
                    }
                  })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                Exibir Banner na Capa
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--text-muted)]">Badge Superior (Tag Dourada)</label>
                <input
                  type="text"
                  value={settingsForm.heroSettings?.badge || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    heroSettings: { ...settingsForm.heroSettings, badge: e.target.value }
                  })}
                  className="input-field text-xs"
                  placeholder="Ex: OPORTUNIDADE DE RENDA EXTRA..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--text-muted)]">Texto do Botão Principal (CTA)</label>
                <input
                  type="text"
                  value={settingsForm.heroSettings?.ctaText || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    heroSettings: { ...settingsForm.heroSettings, ctaText: e.target.value }
                  })}
                  className="input-field text-xs"
                  placeholder="Ex: ✨ Criar Conta Grátis e Liberar Atacado..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-muted)]">Título Principal do Banner</label>
              <textarea
                rows={2}
                value={settingsForm.heroSettings?.title || ''}
                onChange={(e) => setSettingsForm({
                  ...settingsForm,
                  heroSettings: { ...settingsForm.heroSettings, title: e.target.value }
                })}
                className="input-field text-xs font-semibold"
                placeholder="Ex: Venda Produtos de Acrílico & Neon LED..."
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-muted)]">Subtítulo / Descrição Explicativa</label>
              <textarea
                rows={3}
                value={settingsForm.heroSettings?.subtitle || ''}
                onChange={(e) => setSettingsForm({
                  ...settingsForm,
                  heroSettings: { ...settingsForm.heroSettings, subtitle: e.target.value }
                })}
                className="input-field text-xs"
                placeholder="Ex: A fábrica SMD Drop cuida de tudo para você..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-amber-500 block">Destaque 1</span>
                <input
                  type="text"
                  value={settingsForm.heroSettings?.bullet1Title || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    heroSettings: { ...settingsForm.heroSettings, bullet1Title: e.target.value }
                  })}
                  className="input-field text-xs font-bold"
                  placeholder="Título ex: Zero Estoque"
                />
                <input
                  type="text"
                  value={settingsForm.heroSettings?.bullet1Subtitle || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    heroSettings: { ...settingsForm.heroSettings, bullet1Subtitle: e.target.value }
                  })}
                  className="input-field text-xs"
                  placeholder="Subtítulo ex: Só pague após vender"
                />
              </div>

              <div className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-amber-500 block">Destaque 2</span>
                <input
                  type="text"
                  value={settingsForm.heroSettings?.bullet2Title || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    heroSettings: { ...settingsForm.heroSettings, bullet2Title: e.target.value }
                  })}
                  className="input-field text-xs font-bold"
                  placeholder="Título ex: Envio Cego Neutro"
                />
                <input
                  type="text"
                  value={settingsForm.heroSettings?.bullet2Subtitle || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    heroSettings: { ...settingsForm.heroSettings, bullet2Subtitle: e.target.value }
                  })}
                  className="input-field text-xs"
                  placeholder="Subtítulo ex: Sua marca na etiqueta"
                />
              </div>

              <div className="bg-[var(--bg-surface-hover)] p-3 rounded-xl border border-[var(--border-color)] space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-amber-500 block">Destaque 3</span>
                <input
                  type="text"
                  value={settingsForm.heroSettings?.bullet3Title || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    heroSettings: { ...settingsForm.heroSettings, bullet3Title: e.target.value }
                  })}
                  className="input-field text-xs font-bold"
                  placeholder="Título ex: Margem de 300%"
                />
                <input
                  type="text"
                  value={settingsForm.heroSettings?.bullet3Subtitle || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    heroSettings: { ...settingsForm.heroSettings, bullet3Subtitle: e.target.value }
                  })}
                  className="input-field text-xs"
                  placeholder="Subtítulo ex: Preços direto de fábrica"
                />
              </div>
            </div>
          </div>

          {/* Box 6: Database Connection & Cloud Sync */}
          <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Layers size={16} /> 6. Banco de Dados & Sincronização em Nuvem (Supabase & Guia Anônima)
              </h4>
              <span className="badge-emerald text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                <CheckCircle size={12} /> Sync Cross-Tab & Incôgnito Ativo
              </span>
            </div>

            <div className="bg-[var(--bg-surface-hover)] p-4 rounded-xl border border-[var(--border-color)] space-y-3">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Sua plataforma possui sincronização em tempo real via BroadcastChannel para todas as abas e guias anônimas. Para conectar com o banco de dados remoto PostgreSQL/Supabase, configure a URL e Chave Anon abaixo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">VITE_SUPABASE_URL</label>
                  <input
                    type="text"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    placeholder="https://suasubdominio.supabase.co"
                    className="input-field text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">VITE_SUPABASE_ANON_KEY</label>
                  <input
                    type="password"
                    value={dbKey}
                    onChange={(e) => setDbKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="input-field text-xs font-mono"
                  />
                </div>
              </div>

              {dbTestResult && (
                <div className={`p-3 rounded-lg text-xs font-semibold border ${
                  dbTestResult.success ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'
                }`}>
                  {dbTestResult.message}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveDbCredentials}
                  className="btn-gold text-xs py-2 px-4 font-bold flex items-center gap-1.5"
                >
                  <Save size={14} /> Salvar Credenciais
                </button>

                <button
                  type="button"
                  onClick={handleTestDb}
                  className="btn-secondary text-xs py-2 px-4 font-bold flex items-center gap-1.5"
                >
                  <CheckCircle size={14} className="text-amber-500" /> Testar Conexão Supabase
                </button>

                <button
                  type="button"
                  onClick={handleSyncAll}
                  disabled={isSyncingDb}
                  className="btn-emerald text-xs py-2 px-4 font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  <Sparkles size={14} /> {isSyncingDb ? 'Sincronizando...' : '🚀 Sincronizar Tudo com Supabase Agora'}
                </button>
              </div>
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
                    <th className="p-3">Observações / Solicitação</th>
                    <th className="p-3">Preço Desejado Revenda</th>
                    <th className="p-3">Status & Resposta</th>
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
                      <td className="p-3 max-w-xs">
                        {item.resellerNotes ? (
                          <p className="text-[11px] text-[var(--text-main)] font-medium italic bg-amber-500/10 border border-amber-500/20 p-1.5 rounded-lg line-clamp-2">
                            "{item.resellerNotes}"
                          </p>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)] italic">Sem observações específicas</span>
                        )}
                      </td>
                      <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        R$ {item.suggestedRetailPrice?.toFixed(2)}
                      </td>
                      <td className="p-3 space-y-1">
                        {item.status === 'pending_approval' && (
                          <span className="badge-gold text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <Clock size={12} /> Aguardando Precificação
                          </span>
                        )}
                        {item.status === 'approved' && (
                          <div>
                            <span className="badge-emerald text-[10px] font-extrabold flex items-center gap-1 w-fit">
                              <CheckCircle size={12} /> Aprovado (Atacado: R$ {item.wholesalePrice?.toFixed(2) || '0.00'})
                            </span>
                            {item.factoryNotes && (
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                                Resp: {item.factoryNotes}
                              </p>
                            )}
                          </div>
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
