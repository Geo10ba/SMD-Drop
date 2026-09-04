import React from 'react';
import { Home, ChevronRight, Store, Factory, Package, ShoppingBag, Settings, Calculator, HelpCircle, Truck, Layers, Users, Clock, PlusCircle, CheckCircle2, ShieldCheck, Share2, Copy, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const Breadcrumb = ({
  currentPath,
  onNavigate,
  customTitle
}) => {
  const { viewMode, setViewMode, showNotification } = useStore();
  const [copiedLink, setCopiedLink] = React.useState(false);

  const getBreadcrumbItems = () => {
    const items = [
      {
        label: 'Início',
        icon: Home,
        onClick: () => {
          setViewMode('reseller');
          if (onNavigate) onNavigate('catalogo');
        }
      }
    ];

    if (viewMode === 'reseller') {
      items.push({
        label: 'Portal Revendedor',
        icon: Store,
        onClick: () => {
          if (onNavigate) onNavigate('catalogo');
        }
      });
    } else {
      items.push({
        label: 'Painel Fábrica',
        icon: Factory,
        onClick: () => {
          if (onNavigate) onNavigate('fabrica/analytics');
        }
      });
    }

    // Active Section Details
    const sectionMap = {
      'catalogo': { label: 'Catálogo de Atacado', icon: Layers },
      'pedidos': { label: 'Meus Pedidos de Revenda', icon: Package },
      'carrinho': { label: 'Carrinho de Compras', icon: ShoppingBag },
      'checkout': { label: 'Finalizar Pedido', icon: CheckCircle2 },
      'calculadora-m2': { label: 'Calculadora sob Medida R$/m²', icon: Calculator },
      'ajuda': { label: 'Central de Ajuda & FAQ', icon: HelpCircle },
      'rastreio': { label: 'Rastreamento de Envio', icon: Truck },
      'cadastro': { label: 'Cadastro de Revendedor', icon: ShieldCheck },
      'login': { label: 'Acesso à Conta', icon: ShieldCheck },
      'admin-login': { label: 'Login do Administrador', icon: Factory },
      'fabrica/analytics': { label: 'Visão Geral & Métricas', icon: Layers },
      'fabrica/produtos': { label: 'Catálogo & Produtos Ativos', icon: Package },
      'fabrica/rascunhos': { label: 'Rascunhos de Importação Shopee', icon: Clock },
      'fabrica/pedidos': { label: 'Pedidos de Expedição Fábrica', icon: Truck },
      'fabrica/revendedores': { label: 'Gestão de Revendedores', icon: Users },
      'fabrica/solicitacoes': { label: 'Solicitações Pendentes', icon: Clock },
      'fabrica/configuracoes': { label: 'Configurações Gerais & Rodapé', icon: Settings },
      'fabrica/expedicao': { label: 'Central de Expedição & Impressão', icon: Truck },
      'fabrica/novo-produto': { label: 'Cadastro de Novo Produto', icon: PlusCircle }
    };

    const currentSection = sectionMap[currentPath] || {
      label: customTitle || 'Seção Atual',
      icon: Layers
    };

    if (currentPath !== 'catalogo' && currentPath !== 'fabrica/analytics') {
      items.push({
        label: currentSection.label,
        icon: currentSection.icon,
        isCurrent: true
      });
    }

    return items;
  };

  const items = getBreadcrumbItems();

  const handleCopyDirectLink = () => {
    const fullUrl = window.location.origin + window.location.pathname + '#' + (currentPath || 'catalogo');
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showNotification('Link direto para esta seção copiado!');
  };

  return (
    <nav
      aria-label="Trilha de Navegação"
      className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-3 sm:px-4 py-2 mb-4 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs"
    >
      {/* Path List */}
      <ol className="flex items-center flex-wrap gap-1.5 text-[var(--text-muted)]">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight size={13} className="text-[var(--text-muted)] opacity-50 shrink-0" />}
              
              {isLast ? (
                <span className="font-extrabold text-[var(--text-main)] flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/30 font-['Outfit']">
                  {Icon && <Icon size={14} className="shrink-0 text-amber-500" />}
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={item.onClick}
                  className="hover:text-[var(--text-main)] font-semibold flex items-center gap-1 transition-colors hover:underline"
                >
                  {Icon && <Icon size={13} className="shrink-0" />}
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {/* Copy Section Direct Link Pill */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface-hover)] px-2 py-0.5 rounded border border-[var(--border-color)] hidden sm:inline-block">
          path: #{currentPath || 'catalogo'}
        </span>
        <button
          onClick={handleCopyDirectLink}
          className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 transition-all hover:scale-105"
          title="Copiar link direto para esta seção"
        >
          {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
          <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
        </button>
      </div>
    </nav>
  );
};
