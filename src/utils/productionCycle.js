/**
 * SMD DROP - Motor de Controle de Produção Fabril & Ciclo Estrito
 * 
 * Ciclo Estrito de 7 Estágios Auditáveis:
 * 1. pagamento_confirmado (Custo fabril liquidado)
 * 2. aguardando_producao (Vetor na esteira de corte)
 * 3. em_producao (Corte Laser / CNC / Montagem Neon LED)
 * 4. conferencia_qualidade (Inspeção visual, teste 12V e medidas)
 * 5. aguardando_expedicao (Embalado em caixa neutra com canguru)
 * 6. enviado (Coletado por Correios / Mercado Envios / Transportadora)
 * 7. entregue (Concluído no consumidor final)
 */

export const PRODUCTION_STAGES = [
  {
    id: 'pagamento_confirmado',
    label: '1. Pagamento Confirmado',
    shortLabel: 'Pagamento OK',
    description: 'Custo fabril liquidado ou debitado da carteira. Pedido autorizado para a esteira fabril.',
    stepNumber: 1,
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/30'
  },
  {
    id: 'aguardando_producao',
    label: '2. Aguardando Produção',
    shortLabel: 'Fila de Corte',
    description: 'Ficha de Ordem de Produção (OP) emitida e chapas de acrílico/MDF separadas.',
    stepNumber: 2,
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/30'
  },
  {
    id: 'em_producao',
    label: '3. Em Produção / Corte',
    shortLabel: 'Corte & Montagem',
    description: 'Operação ativa de corte a laser, gravação CNC, acabamento e colagem de fita LED.',
    stepNumber: 3,
    badgeBg: 'bg-orange-500/15',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-500/30'
  },
  {
    id: 'conferencia_qualidade',
    label: '4. Controle de Qualidade (QC)',
    shortLabel: 'Conferência QC',
    description: 'Inspeção técnica: teste de iluminação 12V, calibragem de esquadro, película e limpeza.',
    stepNumber: 4,
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/30'
  },
  {
    id: 'aguardando_expedicao',
    label: '5. Aguardando Expedição',
    shortLabel: 'Embalado Neutro',
    description: 'Caixa neutra selada, etiqueta 10x15 colada e envelope canguru afixado externamente.',
    stepNumber: 5,
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/30'
  },
  {
    id: 'enviado',
    label: '6. Despachado / Enviado',
    shortLabel: 'Em Trânsito',
    description: 'Pacote coletado pela transportadora ou despachado nos Correios/Mercado Envios.',
    stepNumber: 6,
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/30'
  },
  {
    id: 'entregue',
    label: '7. Entregue com Sucesso',
    shortLabel: 'Entregue',
    description: 'Mercadoria entregue ao consumidor final.',
    stepNumber: 7,
    badgeBg: 'bg-green-500/20',
    badgeText: 'text-green-300',
    badgeBorder: 'border-green-500/40'
  }
];

export const STAGE_ORDER = PRODUCTION_STAGES.map(s => s.id);

/**
 * Normaliza status legados para os 7 estágios canônicos
 */
export function normalizeProductionStatus(status) {
  if (!status) return 'pagamento_confirmado';
  const clean = String(status).toLowerCase().trim();
  
  if (clean === 'aguardando_impressao' || clean === 'pendente') return 'pagamento_confirmado';
  if (clean === 'despachado') return 'enviado';
  if (STAGE_ORDER.includes(clean)) return clean;
  
  return 'pagamento_confirmado';
}

/**
 * Retorna as informações do estágio atual
 */
export function getStageInfo(status) {
  const norm = normalizeProductionStatus(status);
  return PRODUCTION_STAGES.find(s => s.id === norm) || PRODUCTION_STAGES[0];
}

/**
 * Retorna o próximo estágio na esteira
 */
export function getNextProductionStage(currentStatus) {
  const norm = normalizeProductionStatus(currentStatus);
  const idx = STAGE_ORDER.indexOf(norm);
  if (idx >= 0 && idx < STAGE_ORDER.length - 1) {
    return STAGE_ORDER[idx + 1];
  }
  return null;
}

/**
 * Retorna o estágio anterior para reprocesso/retrabalho
 */
export function getPrevProductionStage(currentStatus) {
  const norm = normalizeProductionStatus(currentStatus);
  const idx = STAGE_ORDER.indexOf(norm);
  if (idx > 0) {
    return STAGE_ORDER[idx - 1];
  }
  return null;
}
