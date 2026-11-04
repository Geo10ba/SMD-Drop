import { describe, it, expect } from 'vitest';
import { 
  PRODUCTION_STAGES, 
  STAGE_ORDER, 
  normalizeProductionStatus, 
  getStageInfo, 
  getNextProductionStage, 
  getPrevProductionStage 
} from '../productionCycle';

describe('productionCycle - Ciclo de Vida e Esteira de Produção', () => {
  it('deve conter os 7 estágios canônicos na ordem correta', () => {
    expect(PRODUCTION_STAGES.length).toBe(7);
    expect(STAGE_ORDER).toEqual([
      'pagamento_confirmado',
      'aguardando_producao',
      'em_producao',
      'conferencia_qualidade',
      'aguardando_expedicao',
      'enviado',
      'entregue'
    ]);
  });

  it('deve normalizar status legados para os estágios canônicos', () => {
    expect(normalizeProductionStatus('aguardando_impressao')).toBe('pagamento_confirmado');
    expect(normalizeProductionStatus('pendente')).toBe('pagamento_confirmado');
    expect(normalizeProductionStatus('despachado')).toBe('enviado');
    expect(normalizeProductionStatus('em_producao')).toBe('em_producao');
    expect(normalizeProductionStatus('status_desconhecido')).toBe('pagamento_confirmado');
  });

  it('deve retornar metadados corretos do estágio', () => {
    const stage = getStageInfo('conferencia_qualidade');
    expect(stage.label).toContain('Controle de Qualidade');
    expect(stage.stepNumber).toBe(4);
  });

  it('deve avançar corretamente para o próximo estágio', () => {
    expect(getNextProductionStage('pagamento_confirmado')).toBe('aguardando_producao');
    expect(getNextProductionStage('aguardando_producao')).toBe('em_producao');
    expect(getNextProductionStage('aguardando_expedicao')).toBe('enviado');
    expect(getNextProductionStage('entregue')).toBe(null); // Último estágio
  });

  it('deve permitir retroceder para reprocesso ou retrabalho', () => {
    expect(getPrevProductionStage('conferencia_qualidade')).toBe('em_producao');
    expect(getPrevProductionStage('pagamento_confirmado')).toBe(null); // Primeiro estágio
  });
});
