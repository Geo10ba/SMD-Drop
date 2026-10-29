import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  PackageCheck, 
  Truck, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Search, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Eye,
  User,
  ShoppingBag
} from 'lucide-react';
import { TrackingModal } from '../TrackingModal';
import { Breadcrumb } from '../common/Breadcrumb';
import { ProductionTimeline } from '../common/ProductionTimeline';
import { getStageInfo, normalizeProductionStatus } from '../../utils/productionCycle';

export const ResellerOrdersModal = ({ isOpen, onClose, onOpenCatalog }) => {
  const { orders, currentUser } = useStore();
  const [selectedTrackingCode, setSelectedTrackingCode] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'geovancalado@gmail.com';

  // Strict Access Separation (Prioridade 5):
  // Revendedor vê estritamente apenas os seus próprios pedidos.
  // Admin vê todos ou pode filtrar por revendedor.
  const authorizedOrders = orders.filter((order) => {
    if (isAdmin) return true;
    if (!currentUser) return false;

    const matchesEmail = order.resellerEmail && currentUser.email && 
      order.resellerEmail.toLowerCase() === currentUser.email.toLowerCase();
    const matchesId = currentUser.id && order.resellerId === currentUser.id;
    const matchesName = currentUser.name && order.resellerName &&
      order.resellerName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]);

    return matchesEmail || matchesId || matchesName;
  });

  const filteredOrders = authorizedOrders.filter((order) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      order.id?.toLowerCase().includes(query) ||
      order.trackingCode?.toLowerCase().includes(query) ||
      order.customerData?.name?.toLowerCase().includes(query) ||
      (order.items || []).some(item => item.title?.toLowerCase().includes(query))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col p-5 sm:p-7 shadow-2xl relative animate-fade-in my-auto text-white">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-3 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black shadow-inner">
              <PackageCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-gold uppercase tracking-wider text-[10px] font-black">
                  AMBIENTE SEGURO DO REVENDEDOR
                </span>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Modo Administrador (Todos os Pedidos)
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] mt-0.5">
                {isAdmin ? 'Gestão de Pedidos dos Revendedores' : 'Meus Pedidos de Revenda & Acompanhamento'}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white text-xl font-bold p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Breadcrumb & Search Row */}
        <div className="shrink-0 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Breadcrumb currentPath="pedidos" />
          
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, rastreio ou produto..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-all font-medium"
            />
          </div>
        </div>

        {/* Orders Grid / List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {!currentUser && !isAdmin ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <AlertCircle size={40} className="mx-auto text-amber-400 opacity-80" />
              <h4 className="text-base font-bold text-white">Identificação Necessária</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Faça login ou crie sua conta de revendedor para visualizar os seus pedidos com total privacidade e segurança.
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-slate-950/50 rounded-2xl border border-slate-800/80 space-y-3">
              <PackageCheck size={44} className="mx-auto text-slate-600 mb-1" />
              <p className="text-sm font-bold text-slate-300">
                {searchFilter ? 'Nenhum pedido encontrado com esse termo.' : 'Você ainda não possui pedidos enviados para a fábrica.'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Seus pedidos faturados aparecerão aqui automaticamente com acompanhamento em tempo real da linha de produção até o despacho.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isMarketplace = order.dispatchMode === 'marketplace_label';
                const stage = getStageInfo(order.status);

                return (
                  <div
                    key={order.id}
                    className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/30 rounded-2xl p-5 space-y-4 transition-all shadow-md"
                  >
                    {/* Top Row: ID, Date, Channel, Status */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-base font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          {order.id}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        {isAdmin && (
                          <span className="text-xs text-slate-400 font-medium">
                            Revendedor: <strong className="text-slate-200">{order.resellerName}</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isMarketplace ? (
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-black ${
                            order.marketplace === 'Mercado Livre' ? 'badge-ml' :
                            order.marketplace === 'Shopee' ? 'badge-shopee' : 'badge-amazon'
                          }`}>
                            ETIQUETA {order.marketplace?.toUpperCase()}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            ENVIO DIRETO (LOGÍSTICA CEGA)
                          </span>
                        )}

                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${stage.badgeClass}`}>
                          <span>{stage.icon}</span>
                          <span>{stage.shortLabel}</span>
                        </span>
                      </div>
                    </div>

                    {/* Timeline de Produção em Tempo Real para o Revendedor */}
                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock size={13} className="text-amber-400" /> Status da Fabricação na SMD Drop
                        </span>
                        <span className="text-[11px] text-amber-300 font-mono font-bold">
                          Fase Atual: {stage.label}
                        </span>
                      </div>
                      <ProductionTimeline status={order.status} timeline={order.timeline || []} />
                    </div>

                    {/* Items & Shipping Destinatário */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Products Summary */}
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Produtos Fabricados ({(order.items || []).length})
                        </span>
                        <div className="space-y-1.5">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-slate-200">
                              <span className="truncate pr-2 font-medium">
                                • {item.title} {item.pricingType === 'custom_m2' ? `(${item.widthCm}x${item.heightCm}cm)` : ''}
                              </span>
                              <span className="font-mono font-bold text-slate-300 shrink-0">
                                R$ {(Number(item.unitWholesalePrice) || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recipient Details (Seu Cliente) */}
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-slate-300">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Destinatário Final (Seu Cliente)
                        </span>
                        <p className="font-bold text-white text-xs truncate">
                          {order.customerData?.name || order.customerName || 'Cliente Final'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {order.customerData?.city ? `${order.customerData.city} - ${order.customerData.state}` : 'Envio via etiqueta anexada'}
                        </p>
                        <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Embalagem & Remetente:</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <ShieldCheck size={13} /> 100% Neutro / Seu Nome
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Custo Atacado & Rastreamento */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400 text-xs">Custo Total Atacado: </span>
                        <strong className="text-base font-mono font-black text-amber-400">
                          R$ {(Number(order.wholesaleTotal) || 0).toFixed(2)}
                        </strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTrackingCode(order.trackingCode || order.id)}
                          className="btn-gold text-xs font-black py-2 px-4 flex items-center gap-1.5 shadow-md"
                        >
                          <Truck size={14} /> 
                          <span>Rastrear ({order.trackingCode || "Gerando..."})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tracking Modal Sub-level */}
        {selectedTrackingCode && (
          <TrackingModal
            isOpen={!!selectedTrackingCode}
            onClose={() => setSelectedTrackingCode(null)}
            initialTrackingCode={selectedTrackingCode}
          />
        )}
      </div>
    </div>
  );
};

