import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  PieChart, 
  BarChart2, 
  UserCheck, 
  Building2, 
  Save, 
  Truck, 
  ShieldCheck, 
  Award,
  Sparkles,
  PackageCheck,
  Wand2,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const ResellerDashboard = ({ onOpenCart, onOpenOrders, onOpenTracking }) => {
  const { currentUser, orders, pendingProducts, updateProfile } = useStore();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'orders', 'profile', 'suggested'

  // Filter reseller specific orders and suggested products
  const resellerOrders = orders.filter(
    (o) => o.resellerEmail === currentUser.email || o.resellerName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])
  );

  const mySuggestedProducts = pendingProducts.filter(
    (p) => p.resellerEmail === currentUser.email || p.resellerName === currentUser.name
  );

  // Calculations
  const totalCost = resellerOrders.reduce((acc, o) => acc + o.wholesaleTotal, 0);
  const estimatedRevenue = resellerOrders.reduce((acc, o) => {
    const resellerTotal = o.items.reduce((sum, item) => sum + ((item.customSellingPrice || item.suggestedRetailPrice) * item.quantity), 0);
    return acc + resellerTotal;
  }, 0);
  const totalNetProfit = Math.max(0, estimatedRevenue - totalCost);
  const avgMargin = estimatedRevenue > 0 ? ((totalNetProfit / estimatedRevenue) * 100).toFixed(1) : "0.0";

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name || '',
    cnpj: currentUser.cnpj || '',
    phone: currentUser.phone || '',
    pixKey: currentUser.pixKey || currentUser.email || ''
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile(profileForm);
  };

  // SVG Chart Data (Monthly Sales calculated dynamically from real reseller orders)
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      sales: 0,
      profit: 0
    };
  });

  resellerOrders.forEach((o) => {
    if (!o.createdAt) return;
    const date = new Date(o.createdAt);
    const m = date.getMonth();
    const y = date.getFullYear();
    const found = monthlyData.find((item) => item.monthIndex === m && item.year === y);
    if (found) {
      const wholesaleCost = o.wholesaleTotal || 0;
      const retailRevenue = o.items.reduce((sum, item) => sum + ((item.customSellingPrice || item.suggestedRetailPrice || 0) * item.quantity), 0);
      found.sales += retailRevenue;
      found.profit += Math.max(0, retailRevenue - wholesaleCost);
    }
  });

  const maxSales = Math.max(100, ...monthlyData.map(d => d.sales));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-8 text-white shadow-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-gold uppercase tracking-widest text-[10px] inline-flex items-center gap-1">
                <Award size={12} /> NÍVEL {currentUser.tier || 'BRONZE'} ({currentUser.discountPercent || 0}% DESC. ADICIONAL)
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                CONTA APROVADA
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-['Outfit'] tracking-tight">
              {currentUser.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Painel Profissional de Desempenho de Revenda & Gestão de Loja.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'analytics' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <BarChart2 size={15} /> Métricas & Gráficos
            </button>
            <button
              onClick={() => setActiveTab('suggested')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'suggested' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Wand2 size={15} /> Produtos Sugeridos ({mySuggestedProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'orders' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <PackageCheck size={15} /> Pedidos ({resellerOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'profile' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building2 size={15} /> Dados da Loja
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          {/* Reseller KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="text-xs font-bold uppercase tracking-wider">Vendas Totais</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <DollarSign size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[var(--text-main)] font-['Outfit']">
                R$ {estimatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp size={12} /> Faturamento bruto acumulado
              </span>
            </div>

            <div className="glass-panel p-5 space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="text-xs font-bold uppercase tracking-wider">Lucro Líquido Real</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <TrendingUp size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                R$ {totalNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Margem Líquida Média: {avgMargin}%
              </span>
            </div>

            <div className="glass-panel p-5 space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="text-xs font-bold uppercase tracking-wider">Total de Pedidos</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <ShoppingBag size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[var(--text-main)] font-['Outfit']">
                {resellerOrders.length} <span className="text-xs font-normal text-[var(--text-muted)]">pedidos</span>
              </p>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                Despachados pela fábrica
              </span>
            </div>

            <div className="glass-panel p-5 space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="text-xs font-bold uppercase tracking-wider">Desconto Atacado</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <Award size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[var(--text-main)] font-['Outfit']">
                {currentUser.discountPercent || 5}% OFF
              </p>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                Nível {currentUser.tier || 'VIP Gold'}
              </span>
            </div>
          </div>

          {/* Interactive SVG Graphs Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graph 1: Monthly Sales & Profit SVG Bar Chart */}
            <div className="lg:col-span-2 glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                    EVOLUÇÃO FINANCEIRA DE REVENDA
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit']">
                    Vendas & Lucro Líquido (Últimos 6 Meses)
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-amber-500">
                    <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Faturamento
                  </span>
                  <span className="flex items-center gap-1 text-emerald-500">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Lucro Líquido
                  </span>
                </div>
              </div>

              {/* SVG Bar Chart Canvas */}
              <div className="h-64 w-full pt-4">
                <div className="h-full flex items-end justify-between gap-3 px-2 border-b border-[var(--border-color)] pb-2">
                  {monthlyData.map((d, i) => {
                    const salesHeight = (d.sales / maxSales) * 100;
                    const profitHeight = (d.profit / maxSales) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          {/* Sales Bar */}
                          <div
                            className="w-1/2 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md transition-all duration-300 group-hover:brightness-110 relative"
                            style={{ height: `${salesHeight}%` }}
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap shadow z-20">
                              R$ {d.sales}
                            </span>
                          </div>
                          {/* Profit Bar */}
                          <div
                            className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-300 group-hover:brightness-110 relative"
                            style={{ height: `${profitHeight}%` }}
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap shadow z-20">
                              R$ {d.profit}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[var(--text-muted)] font-mono">{d.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Graph 2: Sales Channel Distribution Donut */}
            <div className="glass-panel p-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                  DISTRIBUIÇÃO DE CANAIS
                </span>
                <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit']">
                  Vendas por Plataforma
                </h3>
              </div>

              {/* Donut Simulation */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3.8"
                      strokeDasharray="50, 100"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#ea580c"
                      strokeWidth="3.8"
                      strokeDasharray="30, 100"
                      strokeDashoffset="-50"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="3.8"
                      strokeDasharray="20, 100"
                      strokeDashoffset="-80"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Total Canais</span>
                    <span className="text-lg font-extrabold text-[var(--text-main)] font-['Outfit']">100%</span>
                  </div>
                </div>

                <div className="w-full space-y-2 pt-4 text-xs font-medium">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Mercado Livre</span>
                    <span className="font-bold">50%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-600" /> Shopee</span>
                    <span className="font-bold">30%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> Amazon / Loja Própria</span>
                    <span className="font-bold">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Products by Reseller Tab */}
      {activeTab === 'suggested' && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
                <Wand2 className="text-amber-500" /> Meus Produtos Sugeridos via Botão Mágico
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Acompanhe em tempo real o status de precificação e aprovação dos produtos sugeridos para o catálogo oficial da fábrica.
              </p>
            </div>
          </div>

          {mySuggestedProducts.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] space-y-2">
              <Wand2 size={36} className="mx-auto text-amber-500 opacity-60" />
              <p className="text-sm font-semibold">Você ainda não sugeriu nenhum produto.</p>
              <p className="text-xs">Use o Botão Mágico no catálogo para capturar e enviar produtos para a avaliação da fábrica!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3">Produto Sugerido</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Preço Sugerido Venda</th>
                    <th className="p-3">Status de Aprovação</th>
                    <th className="p-3">Observações / Motivo da Fábrica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                  {mySuggestedProducts.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="p-3 font-semibold flex items-center gap-3">
                        <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover border border-[var(--border-color)]" />
                        <div>
                          <p className="font-extrabold">{item.title}</p>
                          <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{item.description}</p>
                        </div>
                      </td>
                      <td className="p-3 text-[var(--text-muted)] font-medium">{item.category || "Geral"}</td>
                      <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        R$ {item.suggestedRetailPrice?.toFixed(2)}
                      </td>
                      <td className="p-3">
                        {item.status === 'pending_approval' && (
                          <span className="badge-gold text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <Clock size={12} /> Em Análise pela Fábrica
                          </span>
                        )}
                        {item.status === 'approved' && (
                          <span className="badge-emerald text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <CheckCircle size={12} /> Aprovado & Publicado!
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span className="badge-red text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <XCircle size={12} /> Recusado
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {item.status === 'rejected' ? (
                          <div className="bg-red-500/10 border border-red-500/30 p-2 rounded-lg text-red-600 dark:text-red-400 text-[11px] font-medium max-w-md">
                            <strong>Motivo da Recusa:</strong> {item.rejectionReason || "Produto fora do padrão de fabricação."}
                          </div>
                        ) : item.status === 'approved' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            ✅ Produto cadastrado no catálogo oficial com desconto atacado!
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] italic text-[11px]">
                            A fábrica está avaliando o custo fabril...
                          </span>
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

      {/* Profile & Shop Settings Tab */}
      {activeTab === 'profile' && (
        <div className="glass-panel p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="border-b border-[var(--border-color)] pb-4">
            <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit'] flex items-center gap-2">
              <Building2 size={20} className="text-amber-500" /> Dados Comerciais da Sua Loja
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Atualize as informações da sua marca revendedora e chave PIX para acertos financeiro de reembolsos.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">Nome Comercial da Loja</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="input-field font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">CNPJ / CPF do Revendedor</label>
                <input
                  type="text"
                  required
                  value={profileForm.cnpj}
                  onChange={(e) => setProfileForm({ ...profileForm, cnpj: e.target.value })}
                  className="input-field font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">WhatsApp Comercial</label>
                <input
                  type="text"
                  required
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="input-field font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">Chave PIX (Para Reembolsos & Acertos)</label>
              <input
                type="text"
                required
                value={profileForm.pixKey}
                onChange={(e) => setProfileForm({ ...profileForm, pixKey: e.target.value })}
                className="input-field font-mono font-bold"
              />
            </div>

            <div className="pt-2">
              <button type="submit" className="btn-gold py-3 px-6 font-bold text-xs shadow-md">
                <Save size={16} /> Salvar Dados do Perfil
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders History Tab */}
      {activeTab === 'orders' && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
            <h3 className="text-lg font-bold text-[var(--text-main)] font-['Outfit']">
              Meus Pedidos de Revenda Enviados à Fábrica
            </h3>
            <button onClick={onOpenOrders} className="btn-gold text-xs font-bold py-2 px-4">
              Ver Histórico Completo & Timeline
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3">Código Pedido</th>
                  <th className="p-3">Modalidade Envio</th>
                  <th className="p-3">Cliente Final</th>
                  <th className="p-3">Valor Custo Fábrica</th>
                  <th className="p-3">Status Expedição</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                {resellerOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="p-3 font-mono font-extrabold text-amber-600 dark:text-amber-400">
                      {o.id}
                    </td>
                    <td className="p-3">
                      {o.dispatchMode === 'marketplace_label' ? (
                        <span className="badge-ml text-[10px]">Marketplace ({o.marketplace})</span>
                      ) : (
                        <span className="badge-gold text-[10px]">Envio Direto Cego</span>
                      )}
                    </td>
                    <td className="p-3 font-medium">
                      {o.customerData?.name || "Cliente Final"}
                    </td>
                    <td className="p-3 font-bold font-mono">
                      R$ {o.wholesaleTotal.toFixed(2)}
                    </td>
                    <td className="p-3 font-bold">
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-[10px] uppercase">
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={onOpenTracking}
                        className="btn-secondary text-[11px] font-bold py-1 px-2.5"
                      >
                        <Truck size={13} /> Rastrear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
