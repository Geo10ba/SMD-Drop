/**
 * SMD DROP - Motor de Conformidade Fiscal & Venda à Ordem
 * Legislação: Art. 40 do Convênio S/N 1970 (CONFAZ) e Ajuste SINIEF
 * 
 * Regras:
 * 1. Fornecedor/Fábrica: Remetente físico por conta e ordem (CFOP 5.923/6.923)
 * 2. Revendedor (Adquirente Originário): Venda comercial para o consumidor final (MEI ou Simples CFOP 5.120/6.120)
 * 3. Consumidor Final: Destinatário com CPF/CNPJ e endereço completo
 * 4. Trava de Expedição: Não despachar sem documento fiscal idôneo ou declaração legal
 */

export const FACTORY_FISCAL_DATA = {
  corporateName: 'SMD DROP PRODUTOS PERSONALIZADOS LTDA',
  tradeName: 'SMD Drop Industrial',
  cnpj: '45.109.892/0001-99',
  stateRegistration: '112.334.556.778',
  address: 'Av. Industrial, 450 - Galpão 03',
  neighborhood: 'Distrito Industrial',
  city: 'São Paulo',
  state: 'SP',
  zip: '03100-000',
  phone: '(11) 4003-8921'
};

/**
 * Valida a chave de acesso de 44 dígitos da NF-e
 */
export function isValidNfeKey(key) {
  if (!key) return false;
  const clean = String(key).replace(/\D/g, '');
  return clean.length === 44;
}

/**
 * Valida CPF (básico com dígitos e formato)
 */
export function isValidCpf(cpf) {
  if (!cpf) return false;
  const clean = String(cpf).replace(/\D/g, '');
  return clean.length === 11 && !/^(\d)\1+$/.test(clean);
}

/**
 * Monta e valida o registro fiscal completo do pedido tripartite
 */
export function buildFiscalOrderData({
  reseller = {},
  customer = {},
  dispatchMode = 'marketplace_label',
  marketplace = 'Mercado Livre',
  fiscalRegime = 'mei', // 'mei' | 'simples' | 'lucro_presumido'
  documentType = 'declaracao_conteudo', // 'declaracao_conteudo' | 'nfe_venda' | 'marketplace_integrated'
  nfeKey = '',
  hasLabelAttached = false
}) {
  const cleanNfeKey = String(nfeKey || '').replace(/\D/g, '');
  const cleanCpf = String(customer.cpf || '').replace(/\D/g, '');

  const missingReasons = [];

  // 1. Validação de Dados do Consumidor
  if (!customer.name || customer.name.trim().length < 3) {
    missingReasons.push('Nome do consumidor final não informado.');
  }

  if (dispatchMode === 'direct_blind_shipping') {
    if (!cleanCpf || cleanCpf.length < 11) {
      missingReasons.push('CPF válido do consumidor final é obrigatório.');
    }
    if (!customer.address || customer.address.trim().length < 5) {
      missingReasons.push('Endereço completo de entrega é obrigatório.');
    }
    if (!customer.zip || String(customer.zip).replace(/\D/g, '').length !== 8) {
      missingReasons.push('CEP de destino válido (8 dígitos) é obrigatório.');
    }
  }

  // 2. Validação Documental Fiscal
  if (fiscalRegime === 'simples' || fiscalRegime === 'lucro_presumido' || documentType === 'nfe_venda') {
    if (!cleanNfeKey || cleanNfeKey.length !== 44) {
      missingReasons.push('Chave de Acesso da NF-e de Venda (44 dígitos - CFOP 5.120/6.120) obrigatória.');
    }
  } else if (fiscalRegime === 'mei') {
    // MEI usa declaração de conteúdo
    if (dispatchMode === 'marketplace_label' && !hasLabelAttached) {
      missingReasons.push('Etiqueta com Declaração/DANFE do marketplace não foi anexada.');
    }
  }

  // Se for marketplace e não anexou etiqueta
  if (dispatchMode === 'marketplace_label' && !hasLabelAttached) {
    missingReasons.push('Arquivo da etiqueta de frete do marketplace não anexado.');
  }

  const isFiscalComplete = missingReasons.length === 0;

  return {
    operationType: 'venda_a_ordem', // Art. 40 Convênio S/N 1970
    legalBasis: 'Art. 40 do Convênio S/N 1970 (Venda à Ordem) e Ajuste SINIEF',
    supplier: FACTORY_FISCAL_DATA,
    reseller: {
      name: reseller.name || 'Revendedor Autorizado',
      document: reseller.document || reseller.cnpj || 'MEI - Isento',
      email: reseller.email || '',
      phone: reseller.phone || '',
      fiscalRegime: fiscalRegime || 'mei',
      stateRegistration: reseller.stateRegistration || 'ISENTO'
    },
    customer: {
      name: customer.name || '',
      cpf: customer.cpf || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      zip: customer.zip || ''
    },
    dispatchMode,
    marketplace: dispatchMode === 'marketplace_label' ? marketplace : null,
    documentType: fiscalRegime === 'mei' ? 'declaracao_conteudo' : (documentType || 'nfe_venda'),
    nfeKey: cleanNfeKey,
    cfopVenda: fiscalRegime === 'mei' ? 'ISENTO_MEI' : '5.120 / 6.120 (Venda à Ordem)',
    cfopRemessa: '5.923 / 6.923 (Remessa por Conta e Ordem)',
    isFiscalComplete,
    missingReasons,
    validatedAt: new Date().toISOString()
  };
}
