import { describe, it, expect } from 'vitest';
import { 
  resolveSmartNcm, 
  resolveSmartFiscalDetails, 
  serializeProductForSupabase, 
  deserializeProductFromSupabase 
} from '../productSerialization';

describe('productSerialization - Fiscal e Supabase', () => {
  it('deve inferir NCM correto a partir do título/categoria do produto', () => {
    expect(resolveSmartNcm({ title: 'Relógio de Parede 30cm', category: 'Decoração' })).toBe('9105.29.00');
    expect(resolveSmartNcm({ title: 'Luminária Neon LED Quarto', category: 'Iluminação' })).toBe('8539.51.00');
    expect(resolveSmartNcm({ title: 'Painel MDF Madeira Vazado', category: 'Artesanato' })).toBe('4421.99.00');
    expect(resolveSmartNcm({ title: 'Letreiro Fachada ACM Espelhado', category: 'Comunicação' })).toBe('8306.29.00');
    expect(resolveSmartNcm({ title: 'Placa Acrílico Neutra', category: 'Geral' })).toBe('3926.90.90');
  });

  it('deve resolver detalhes fiscais (CEST, CFOP, Unidade de Medida)', () => {
    const fiscal = resolveSmartFiscalDetails({
      title: 'Letreiro MDF Decorativo',
      pricingType: 'custom_m2'
    });

    expect(fiscal.ncm).toBe('4421.99.00');
    expect(fiscal.cest).toBe('28.057.00');
    expect(fiscal.measureUnit).toContain('M2');
    expect(fiscal.cfopSame).toBe('5101');
    expect(fiscal.cfopDiff).toBe('6101');
  });

  it('deve serializar e desserializar produto preservando metadados', () => {
    const original = {
      id: 'prod-teste-10',
      title: 'Quadro Decorativo Acrílico',
      category: 'Quadros',
      pricingType: 'fixed',
      wholesalePrice: 40,
      suggestedRetailPrice: 95,
      description: 'Quadro em acrílico cast nobre.',
      image: 'https://example.com/img.jpg',
      variations: [{ name: 'Preto', price: 95 }]
    };

    const serialized = serializeProductForSupabase(original);
    expect(serialized.id).toBe('prod-teste-10');
    expect(serialized.description).toContain('<!--SMD_META:');

    const deserialized = deserializeProductFromSupabase(serialized);
    expect(deserialized.id).toBe('prod-teste-10');
    expect(deserialized.title).toBe(original.title);
    expect(deserialized.wholesalePrice).toBe(original.wholesalePrice);
    expect(deserialized.suggestedRetailPrice).toBe(original.suggestedRetailPrice);
    expect(deserialized.variations.length).toBe(1);
    expect(deserialized.description).toBe(original.description);
  });
});
