export const initialProducts = [
  {
    id: "prod-1",
    title: "Logomarca 3D em Acrílico Espelhado (Sob Medida)",
    category: "Logomarcas & Letreiros",
    pricingType: "custom_m2", // custom_m2 or fixed
    pricePerM2: 180.00, // Custo de fabricação por m²
    suggestedPricePerM2: 380.00, // Sugestão de revenda por m²
    minWidth: 20, // cm
    maxWidth: 300, // cm
    minHeight: 20, // cm
    maxHeight: 200, // cm
    leadTimeDays: 3, // Prazo de produção fabril
    image: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=800&q=80",
    video: "https://assets.mixkit.co/videos/preview/mixkit-working-with-a-laser-cutter-41584-large.mp4",
    description: "Corte a laser de alta precisão em acrílico 3mm/5mm espelhado (dourado, prata, rose gold ou preto). Ideal para recepções, escritórios e lojas.",
    ncm: "3926.90.90",
    ean: "789981230101",
    inStock: true,
    requiresVector: true,
    mediaKit: {
      photos: [
        "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80"
      ],
      copyTitle: "Logomarca 3D Acrílico Espelhado Personalizada para Recepção e Loja",
      copyDescription: "Impressione seus clientes com uma logomarca em 3D de acrílico espelhado cortada a laser. Alta durabilidade, brilho intenso e acabamento premium."
    }
  },
  {
    id: "prod-2",
    title: "Letreiro Neon LED Personalizado (Sob Medida)",
    category: "Neon & Iluminação Custom",
    pricingType: "custom_m2",
    pricePerM2: 240.00,
    suggestedPricePerM2: 520.00,
    minWidth: 30,
    maxWidth: 250,
    minHeight: 20,
    maxHeight: 150,
    leadTimeDays: 4,
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    video: "https://assets.mixkit.co/videos/preview/mixkit-bright-neon-lights-in-a-dark-room-41588-large.mp4",
    description: "Letreiro Neon flex com base em acrílico transparente de 4mm. Disponível em 10 cores vibrantes. Acompanha fonte bivolt e plug de instalação.",
    ncm: "9405.40.90",
    ean: "789981230102",
    inStock: true,
    requiresVector: true,
    mediaKit: {
      photos: [
        "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80"
      ],
      copyTitle: "Letreiro Neon LED Sob Medida Personalizado - Várias Cores Fonte Bivolt",
      copyDescription: "Perfeito para cenários de lives, lojas, bares e decoração de ambientes. Produção ágil de fábrica e envio seguro."
    }
  },
  {
    id: "prod-3",
    title: "Luminária 3D RGB Minimalista com Controle",
    category: "Iluminação Pronta",
    pricingType: "fixed",
    wholesalePrice: 49.90, // Custo de atacado fábrica
    suggestedRetailPrice: 129.90, // Sugestão de venda
    factoryStock: 140, // Estoque físico
    leadTimeDays: 1, // Despacho em 24h
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    description: "Luminária com base em madeira nobre e gravação a laser em cristal acrílico. 16 cores RGB selecionáveis por controle remoto.",
    ncm: "9405.20.00",
    ean: "789981230104",
    inStock: true,
    requiresVector: false,
    mediaKit: {
      photos: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"
      ],
      copyTitle: "Luminária 3D LED RGB Controle Remoto Base Madeira Nobre",
      copyDescription: "Produto campeão de vendas! Design sofisticado, troca de cores automática e baixo consumo de energia."
    }
  },
  {
    id: "prod-4",
    title: "Troféu Corporativo em Acrílico & Ouro 25cm",
    category: "Troféus & Homenagens",
    pricingType: "fixed",
    wholesalePrice: 35.00,
    suggestedRetailPrice: 89.90,
    factoryStock: 85,
    leadTimeDays: 1,
    image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=800&q=80",
    description: "Troféu de acrílico maciço 8mm com detalhes espelhados em dourado. Excelente acabamento de lapidação fabril.",
    ncm: "3926.90.90",
    ean: "789981230105",
    inStock: true,
    requiresVector: false,
    mediaKit: {
      photos: [
        "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=800&q=80"
      ],
      copyTitle: "Troféu de Acrílico Premium 25cm Homenagem Corporativa",
      copyDescription: "Ideal para premiações de vendas, torneios e eventos empresariais. Alta lucratividade para revendedores."
    }
  },
  {
    id: "prod-5",
    title: "Placa de Sinalização em Acrílico (Sob Medida)",
    category: "Sinalização & Placas",
    pricingType: "custom_m2",
    pricePerM2: 150.00,
    suggestedPricePerM2: 320.00,
    minWidth: 15,
    maxWidth: 200,
    minHeight: 10,
    maxHeight: 150,
    leadTimeDays: 2,
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
    description: "Placas de orientação para condomínios, consultórios e escritórios. Fixação por distanciadores em inox.",
    ncm: "3926.90.90",
    ean: "789981230106",
    inStock: true,
    requiresVector: true,
    mediaKit: {
      photos: [
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"
      ],
      copyTitle: "Placa Indicativa de Acrílico Sob Medida com Separadores Inox",
      copyDescription: "Placas modernas com impressão UV direta ou adesivação em vinil de alta performance."
    }
  }
];
