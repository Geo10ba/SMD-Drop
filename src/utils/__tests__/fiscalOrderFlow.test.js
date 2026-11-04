import { describe, it, expect } from 'vitest';
import { 
  FACTORY_FISCAL_DATA, 
  isValidNfeKey, 
  isValidCpf, 
  buildFiscalOrderData 
} from '../fiscalOrderFlow';

describe('fiscalOrderFlow - Motor de Conformidade Fiscal', () => {
  it('deve conter os dados fiscais da fábrica configurados', () => {
    expect(FACTORY_FISCAL_DATA.cnpj).toBe('45.109.892/0001-99');
    expect(FACTORY_FISCAL_DATA.corporateName).toContain('SMD DROP');
  });

  it('deve validar chave de acesso NF-e de 44 dígitos numéricos', () => {
    const validKey = '35261045109892000199550010000000011000000010';
    expect(isValidNfeKey(validKey)).toBe(true);

    const invalidShort = '35261045109892000199';
    expect(isValidNfeKey(invalidShort)).toBe(false);

    expect(isValidNfeKey('')).toBe(false);
    expect(isValidNfeKey(null)).toBe(false);
  });

  it('deve validar formato básico de CPF com 11 dígitos', () => {
    expect(isValidCpf('123.456.789-01')).toBe(true);
    expect(isValidCpf('12345678901')).toBe(true);
    expect(isValidCpf('11111111111')).toBe(false); // Dígitos todos iguais
    expect(isValidCpf('123')).toBe(false);
  });

  it('deve liberar despacho para MEI com declaração de conteúdo anexada', () => {
    const fiscal = buildFiscalOrderData({
      reseller: { name: 'Revenda Alpha', fiscalRegime: 'mei' },
      customer: { name: 'Cliente Final', cpf: '123.456.789-01', address: 'Rua das Flores 10' },
      dispatchMode: 'marketplace_label',
      fiscalRegime: 'mei',
      documentType: 'declaracao_conteudo',
      hasLabelAttached: true
    });

    expect(fiscal.isFiscalComplete).toBe(true);
    expect(fiscal.documentType).toBe('declaracao_conteudo');
  });

  it('deve bloquear despacho quando faltar etiqueta e chave no Simples Nacional', () => {
    const fiscal = buildFiscalOrderData({
      reseller: { name: 'Revenda Beta', fiscalRegime: 'simples' },
      customer: { name: 'Cliente Final', cpf: '', address: '' },
      dispatchMode: 'marketplace_label',
      fiscalRegime: 'simples',
      documentType: 'nfe_venda',
      nfeKey: '',
      hasLabelAttached: false
    });

    expect(fiscal.isFiscalComplete).toBe(false);
    expect(fiscal.missingReasons.length).toBeGreaterThan(0);
  });
});
