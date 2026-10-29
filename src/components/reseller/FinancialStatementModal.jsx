import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import * as XLSX from 'xlsx';
import { 
  TrendingUp, 
  DollarSign, 
  Download, 
  Percent, 
  ShoppingBag, 
  FileSpreadsheet, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Building2, 
  PackageCheck,
  CheckCircle2,
  X
} from 'lucide-react';

export const FinancialStatementModal = ({ isOpen, onClose }) => {
  const { orders, showNotification } = useStore();

  const [periodFilter, setPeriodFilter] = useState('all'); // 'all' | '7days' | '30days'
  const [channelFilter, setChannelFilter] = useState('all'); // 'all' | 'Mercado Livre' | 'Shopee' | 'Amazon' | 'direct'

  // Process financial calculations per order
  const financialData = useMemo(() => {
    return orders.map((order) => {
      const wholesaleCost = Number(order.wholesaleTotal ?? order.total ?? 0) || 0;
      
      // Calculate estimated final retail sales price
      let retailSalesTotal = 0;
      if (Array.isArray(order.items) && order.items.length > 0) {
        retailSalesTotal = order.items.reduce((acc, it) => {
          const itemRetail = Number(it.customSellingPrice || it.suggestedRetailPrice || (it.unitWholesalePrice * 2.2)) || 0;
          return acc + (itemRetail * (it.quantity || 1));
        }, 0);
      } else {
        retailSalesTotal = wholesaleCost * 2.2; // Margem padrão estimada caso não especificado
      }

      // Marketplace fee deduction: Shopee (14% + R$4), ML (16% + R$6), Direct (3% gateway)
      let marketplaceFee = 0;
      const mpName = order.marketplace || (order.dispatchMode === 'direct_blind_shipping' ? 'Venda Direta' : 'Outros');
      if (mpName.includes('Shopee')) {
        marketplaceFee = (retailSalesTotal * 0.14) + 4.00;
      } else if (mpName.includes('Mercado Livre')) {
        marketplaceFee = (retailSalesTotal * 0.16) + 6.00;
      } else if (mpName.includes('Amazon')) {
        marketplaceFee = (retailSalesTotal * 0.15);
      } else {
        marketplaceFee = (retailSalesTotal * 0.03); // Cartão/PIX gateway
      }

      const shippingPaid = Number(order.shippingTotal || 0);
      const netProfit = retailSalesTotal - wholesaleCost - marketplaceFee - shippingPaid;
      const profitMarginPct = retailSalesTotal > 0 ? (netProfit / retailSalesTotal) * 100 : 0;

      return {
        id: order.id,
        date: order.createdAt || new Date().toISOString(),
        resellerName: order.resellerName || 'Revendedor',
        channel: mpName,
        retailSalesTotal,
        wholesaleCost,
        marketplaceFee,
        shippingPaid,
        netProfit,
        profitMarginPct,
        status: order.status || 'aguardando_impressao',
        itemsCount: Array.isArray(order.items) ? order.items.length : 1
      };
    });
  }, [orders]);

  // Apply filters
  const filteredOrders = useMemo(() => {
    const now = new Date().getTime();
    return financialData.filter((item) => {
      // Channel Filter
      if (channelFilter !== 'all') {
        if (channelFilter === 'direct' && !item.channel.includes('Direta')) return false;
        if (channelFilter !== 'direct' && !item.channel.includes(channelFilter)) return false;
      }

      // Period Filter
      if (periodFilter === '7days') {
        const itemTime = new Date(item.date).getTime();
        if (now - itemTime > 7 * 24 * 3600 * 1000) return false;
      } else if (periodFilter === '30days') {
        const itemTime = new Date(item.date).getTime();
        if (now - itemTime > 30 * 24 * 3600 * 1000) return false;
      }

      return true;
    });
  }, [financialData, channelFilter, periodFilter]);

  // Totals & KPI Metrics
  const summary = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;
    const totalGrossRevenue = filteredOrders.reduce((acc, o) => acc + o.retailSalesTotal, 0);
    const totalFactoryCost = filteredOrders.reduce((acc, o) => acc + o.wholesaleCost, 0);
    const totalMarketplaceFees = filteredOrders.reduce((acc, o) => acc + o.marketplaceFee, 0);
    const totalShipping = filteredOrders.reduce((acc, o) => acc + o.shippingPaid, 0);
    const totalNetProfit = filteredOrders.reduce((acc, o) => acc + o.netProfit, 0);
    const averageMargin = totalGrossRevenue > 0 ? (totalNetProfit / totalGrossRevenue) * 100 : 0;
    const averageTicket = totalOrdersCount > 0 ? (totalGrossRevenue / totalOrdersCount) : 0;

    return {
      totalOrdersCount,
      totalGrossRevenue,
      totalFactoryCost,
      totalMarketplaceFees,
      totalShipping,
      totalNetProfit,
      averageMargin,
      averageTicket
    };
  }, [filteredOrders]);

  if (!isOpen) return null;

  // Excel Export Handler using real XLSX library
  const handleExportToExcel = () => {
    try {
      const rows = filteredOrders.map((o) => ({
        "ID do Pedido": o.id,
        "Data": new Date(o.date).toLocaleDateString('pt-BR'),
        "Canal de Venda": o.channel,
        "Status": o.status,
        "Faturamento Bruto (R$)": Number(o.retailSalesTotal.toFixed(2)),
        "Custo Fábrica Atacado (R$)": Number(o.wholesaleCost.toFixed(2)),
        "Taxa de Marketplace (R$)": Number(o.marketplaceFee.toFixed(2)),
        "Frete (R$)": Number(o.shippingPaid.toFixed(2)),
        "Lucro Líquido Real (R$)": Number(o.netProfit.toFixed(2)),
        "Margem Líquida (%)": `${o.profitMarginPct.toFixed(1)}%`
      }));

      // Append summary row
      rows.push({
        "ID do Pedido": "TOTAL GERAL",
        "Data": "-",
        "Canal de Venda": "-",
        "Status": `${summary.totalOrdersCount} pedidos`,
        "Faturamento Bruto (R$)": Number(summary.totalGrossRevenue.toFixed(2)),
        "Custo Fábrica Atacado (R$)": Number(summary.totalFactoryCost.toFixed(2)),
        "Taxa de Marketplace (R$)": Number(summary.totalMarketplaceFees.toFixed(2)),
        "Frete (R$)": Number(summary.totalShipping.toFixed(2)),
        "Lucro Líquido Real (R$)": Number(summary.totalNetProfit.toFixed(2)),
        "Margem Líquida (%)": `${summary.averageMargin.toFixed(1)}%`
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Demonstrativo_Financeiro");

      const fileName = `DRE_Financeiro_SMD_Drop_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      showNotification(`📊 Relatório "${fileName}" exportado com sucesso!`);
    } catch (e) {
      console.error(e);
      showNotification('Erro ao exportar planilha Excel.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-[var(--border-color)] text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800/80 p-2 rounded-full transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <TrendingUp size={11} className="text-emerald-400" /> DRE & Margem Líquida
            </span>
            <span className="text-slate-400 text-xs">Gestão Financeira do Revendedor</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <h3 className="text-2xl font-bold font-['Outfit'] text-white">
                Extrato Financeiro & Lucro Líquido
              </h3>
              <p className="text-xs text-slate-300">
                Acompanhe o faturamento real, custos de fábrica e a lucratividade líquida no bolso.
              </p>
            </div>

            <button
              onClick={handleExportToExcel}
              className="btn-gold text-xs font-bold py-2.5 px-4 flex items-center gap-2 shadow-lg shrink-0"
              title="Baixar planilha completa em formato Excel (.xlsx)"
            >
              <FileSpreadsheet size={16} /> Exportar Relatório Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-[var(--bg-surface-hover)] p-4 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[var(--text-muted)] flex items-center gap-1">
              <Calendar size={13} /> Período:
            </span>
            {[
              { id: 'all', label: 'Todo o Histórico' },
              { id: '30days', label: 'Últimos 30 Dias' },
              { id: '7days', label: 'Últimos 7 Dias' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodFilter(p.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  periodFilter === p.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--text-muted)] flex items-center gap-1">
              <Filter size={13} /> Canal:
            </span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="input-field py-1.5 px-3 text-xs bg-[var(--bg-surface)]"
            >
              <option value="all">Todos os Canais</option>
              <option value="Shopee">Shopee</option>
              <option value="Mercado Livre">Mercado Livre</option>
              <option value="Amazon">Amazon</option>
              <option value="direct">Envio Direto / Balcão</option>
            </select>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Faturamento Bruto */}
            <div className="bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-4 rounded-2xl relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
                Faturamento Bruto
              </span>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-[var(--text-main)] mt-1">
                R$ {summary.totalGrossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                {summary.totalOrdersCount} pedidos processados
              </span>
            </div>

            {/* Card 2: Custo de Fábrica Pago */}
            <div className="bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-4 rounded-2xl relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
                Custo de Fábrica (Atacado)
              </span>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1">
                R$ {summary.totalFactoryCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                Produção & Matérias-Primas
              </span>
            </div>

            {/* Card 3: Taxas de Marketplace */}
            <div className="bg-[var(--bg-surface-hover)] border border-[var(--border-color)] p-4 rounded-2xl relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
                Taxas dos Marketplaces
              </span>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-rose-500 mt-1">
                R$ {summary.totalMarketplaceFees.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                Comissões ML/Shopee estimadas
              </span>
            </div>

            {/* Card 4: Lucro Líquido Real */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 p-4 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                  LUCRO LÍQUIDO REAL
                </span>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono">
                  {summary.averageMargin.toFixed(1)}% Margem
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                R$ {summary.totalNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                Livre no bolso após todas as taxas
              </span>
            </div>
          </div>

          {/* DRE Detail Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
              <span>Demonstrativo de Resultado do Exercício (DRE por Pedido)</span>
              <span>Ticket Médio: <strong className="font-mono text-[var(--text-main)]">R$ {summary.averageTicket.toFixed(2)}</strong></span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)] text-xs border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-surface-hover)]">
                Nenhum pedido encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="border border-[var(--border-color)] rounded-2xl overflow-hidden bg-[var(--bg-surface)] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-surface-hover)] text-[var(--text-muted)] font-bold uppercase text-[10px] border-b border-[var(--border-color)]">
                        <th className="py-3 px-4">Pedido / Data</th>
                        <th className="py-3 px-3">Canal</th>
                        <th className="py-3 px-3 text-right">Venda Bruta</th>
                        <th className="py-3 px-3 text-right">Custo Atacado</th>
                        <th className="py-3 px-3 text-right">Taxas Canal</th>
                        <th className="py-3 px-3 text-right">Lucro Líquido</th>
                        <th className="py-3 px-4 text-right">Margem %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[var(--text-main)] block">{ord.id}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {new Date(ord.date).toLocaleDateString('pt-BR')}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {ord.channel}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-[var(--text-main)]">
                            R$ {ord.retailSalesTotal.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-[var(--text-muted)]">
                            R$ {ord.wholesaleCost.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-rose-500">
                            - R$ {ord.marketplaceFee.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            + R$ {ord.netProfit.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-bold text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                              {ord.profitMarginPct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[var(--bg-surface-hover)] p-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>* Cálculos baseados em margens e taxas médias praticadas no comércio eletrônico brasileiro.</span>
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-1.5 px-4 font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
