import { z } from 'zod';

/**
 * Esquemas de Validação com Zod para a Plataforma SMD Drop
 * Fornece validação estrita e amigável em português para fluxos fabris e comerciais.
 */

// 1. Validação de Medidas e Cálculo por M² (Corte a Laser)
export const customM2Schema = z.object({
  widthCm: z.coerce
    .number({ invalid_type_error: 'A largura deve ser um número válido em centímetros.' })
    .min(5, { message: 'A largura mínima de corte permitida é 5 cm.' })
    .max(300, { message: 'A largura máxima de chapa suportada pela mesa laser é 300 cm.' }),
  heightCm: z.coerce
    .number({ invalid_type_error: 'A altura deve ser um número válido em centímetros.' })
    .min(5, { message: 'A altura mínima de corte permitida é 5 cm.' })
    .max(250, { message: 'A altura máxima de chapa suportada pela mesa laser é 250 cm.' }),
  quantity: z.coerce
    .number()
    .int('A quantidade deve ser um número inteiro.')
    .min(1, 'A quantidade mínima é 1 unidade.')
    .default(1),
  materialName: z.string({ required_error: 'O material deve ser selecionado.' }).min(1, 'Selecione o material.'),
  pricePerM2: z.coerce.number().min(0, 'O valor por m² não pode ser negativo.'),
  phrase: z.string().optional().default('')
}).refine((data) => {
  const m2 = (data.widthCm * data.heightCm) / 10000;
  return m2 >= 0.0025; // no mínimo 5x5cm = 0.0025 m²
}, {
  message: 'A área calculada é inferior ao limite fabril de corte.',
  path: ['widthCm']
});

// 2. Validação de Item do Pedido
export const orderItemSchema = z.object({
  productId: z.string().optional(),
  title: z.string().min(1, 'Título do item é obrigatório.'),
  pricingType: z.enum(['fixed', 'custom_m2']).default('fixed'),
  materialName: z.string().optional(),
  widthCm: z.coerce.number().optional(),
  heightCm: z.coerce.number().optional(),
  calculatedM2: z.coerce.number().optional(),
  unitWholesalePrice: z.coerce.number().min(0, 'Preço de atacado deve ser maior ou igual a zero.'),
  suggestedRetailPrice: z.coerce.number().min(0, 'Preço sugerido deve ser maior ou igual a zero.'),
  customSellingPrice: z.coerce.number().optional(),
  quantity: z.coerce.number().int().min(1, 'Quantidade mínima é 1.'),
  finishOption: z.string().optional(),
  vectorFileUrl: z.string().nullable().optional()
});

// 3. Validação do Pedido Completo (Checkout / Expedição)
export const orderSchema = z.object({
  resellerName: z.string().min(2, 'Nome do revendedor é obrigatório.').default('Revendedor Convidado'),
  resellerEmail: z.string().email('E-mail do revendedor inválido.').default('revendedor@smddrop.com.br'),
  dispatchMode: z.enum(['marketplace_label', 'direct_blind']).default('marketplace_label'),
  marketplace: z.string().optional().default('Shopee'),
  customerName: z.string().optional(),
  customerCpf: z.string().optional().default(''),
  customerAddress: z.string().optional(),
  customerCity: z.string().optional(),
  customerState: z.string().optional(),
  customerZip: z.string().optional(),
  customerData: z.object({
    name: z.string().optional(),
    cpf: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional()
  }).optional(),
  items: z.array(orderItemSchema).min(1, 'O pedido deve conter pelo menos 1 item.'),
  wholesaleTotal: z.coerce.number().min(0, 'Total de atacado inválido.'),
  shippingTotal: z.coerce.number().min(0, 'Valor de frete inválido.').default(0),
  total: z.coerce.number().min(0, 'Total do pedido inválido.'),
  paymentMethod: z.string().default('pix'),
  labelPdfUrl: z.string().nullable().optional(),
  labelPdf: z.any().optional(),
  vectorFileUrl: z.string().nullable().optional(),
  notes: z.string().optional()
}).superRefine((data, ctx) => {
  const name = data.customerName || data.customerData?.name;
  if (!name || name.trim().length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Nome do destinatário deve ter no mínimo 3 caracteres.',
      path: ['customerName']
    });
  }

  const address = data.customerAddress || data.customerData?.address;
  if (data.dispatchMode === 'direct_blind' && (!address || address.trim().length < 5)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Endereço completo de entrega é obrigatório para envio cego direto.',
      path: ['customerAddress']
    });
  }
});

// 4. Validação de Cadastro / Edição de Produto no Catálogo
export const productSchema = z.object({
  title: z.string().min(3, 'O título do produto deve ter pelo menos 3 caracteres.'),
  category: z.string().min(2, 'Selecione uma categoria válida.'),
  pricingType: z.enum(['fixed', 'custom_m2']).default('fixed'),
  wholesalePrice: z.coerce.number().min(0, 'Preço de custo/atacado não pode ser negativo.'),
  suggestedRetailPrice: z.coerce.number().min(0, 'Preço sugerido de venda não pode ser negativo.'),
  factoryStock: z.coerce.number().int().min(0, 'Estoque deve ser zero ou positivo.').default(100),
  leadTimeDays: z.coerce.number().int().min(1, 'Prazo de produção deve ser de no mínimo 1 dia.').default(3),
  weightKg: z.coerce.number().min(0.01, 'Peso do produto deve ser maior que 0 kg.').max(50, 'Peso máximo é 50 kg.').default(0.5),
  ncm: z.string().regex(/^(\d{4}\.\d{2}\.\d{2}|\d{8})$/, 'NCM deve conter 8 dígitos (ex: 3926.90.90 ou 39269090).').default('3926.90.90'),
  cest: z.string().optional(),
  description: z.string().optional()
}).refine((data) => {
  if (data.pricingType === 'fixed') {
    return data.suggestedRetailPrice >= data.wholesalePrice;
  }
  return true;
}, {
  message: 'O preço sugerido de venda deve ser maior ou igual ao preço de atacado.',
  path: ['suggestedRetailPrice']
});

// 5. Validação de Transação de Carteira (Recarga)
export const walletRechargeSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'O valor da recarga deve ser numérico.' })
    .min(10, 'O valor mínimo para recarga da carteira é de R$ 10,00.')
    .max(50000, 'O valor máximo por transação é de R$ 50.000,00.'),
  resellerEmail: z.string().email('E-mail do revendedor é inválido.'),
  description: z.string().optional().default('Recarga via PIX Instantâneo')
});

/**
 * Função utilitária genérica para aplicar esquemas Zod e formatar respostas
 */
export function formatZodValidation(schema, rawData) {
  const result = schema.safeParse(rawData);
  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: [],
      errorMap: {}
    };
  }

  const errors = [];
  const errorMap = {};

  result.error.issues.forEach((issue) => {
    const field = issue.path.join('.') || 'geral';
    const msg = issue.message;
    errors.push(msg);
    if (!errorMap[field]) {
      errorMap[field] = msg;
    }
  });

  return {
    success: false,
    errors,
    errorMap
  };
}

// Métodos de conveniência
export const validateOrder = (data) => formatZodValidation(orderSchema, data);
export const validateCustomM2 = (data) => formatZodValidation(customM2Schema, data);
export const validateProduct = (data) => formatZodValidation(productSchema, data);
export const validateWalletRecharge = (data) => formatZodValidation(walletRechargeSchema, data);
