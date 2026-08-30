import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialProducts } from '../data/initialProducts';

const StoreContext = createContext();

// Synchronously parse URL query parameters on initial load
const getInitialBookmarkletData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('magic') === '1' || params.get('auto') === '1' || params.get('title')) {
      const title = params.get('title') || '';
      const desc = params.get('desc') || '';
      const img = params.get('img') || '';
      const video = params.get('video') || '';
      const priceStr = params.get('price') || '';
      const price = priceStr ? parseFloat(priceStr) : 120;

      return {
        title: title || 'Produto Capturado Mágico',
        description: desc || (title ? `Produto ${title} fabricado em material nobre com corte a laser.` : 'Descrição importada do anúncio.'),
        image: img || 'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80',
        video: video || '',
        suggestedRetailPrice: price || 120,
        wholesalePrice: Math.round((price || 120) * 0.45)
      };
    }
  } catch (e) {
    console.error('Error parsing query params:', e);
  }
  return null;
};

export const StoreProvider = ({ children }) => {
  // Theme Management (Default: 'light' Luxe)
  const [theme, setTheme] = useState('light');

  // View Mode: 'reseller' or 'factory' (Persisted in localStorage)
  const [viewMode, setViewModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_view_mode');
      if (saved === 'factory' || saved === 'reseller') return saved;
    }
    return 'reseller';
  });

  const setViewMode = (mode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smd_view_mode', mode);
    }
  };

  // Admin Auth State & Persistence
  const [adminEmail, setAdminEmail] = useState('geovancalado@gmail.com');

  const defaultAdminUser = {
    id: 'admin-1',
    email: 'geovancalado@gmail.com',
    name: 'Geovan Calado (Admin Fábrica)',
    role: 'admin'
  };

  const defaultResellerUser = {
    id: 'user-1',
    email: 'revendedor@loja.com',
    name: 'Lucas E-Commerce Store',
    cnpj: '45.109.892/0001-99',
    phone: '(11) 98765-4321',
    pixKey: '45.109.892/0001-99',
    role: 'reseller',
    status: 'aprovado',
    tier: 'VIP Gold',
    discountPercent: 5
  };

  const [currentUser, setCurrentUserState] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('smd_current_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.email) return parsed;
        } catch (e) {}
      }
      const mode = localStorage.getItem('smd_view_mode');
      if (mode === 'factory') return defaultAdminUser;
    }
    return null; // Visitantes não logados iniciam como Visitantes/Visitante Convidado
  });

  const setCurrentUser = (user) => {
    setCurrentUserState(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('smd_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('smd_current_user');
      }
    }
  };

  // Global Magic Import Modal State (Initialized Synchronously)
  const [magicImportInitialData, setMagicImportInitialData] = useState(getInitialBookmarkletData);
  const [isMagicImportOpen, setIsMagicImportOpen] = useState(() => !!getInitialBookmarkletData());

  // Clean URL parameters after initial render if captured
  useEffect(() => {
    if (isMagicImportOpen && magicImportInitialData) {
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      showNotification('⚡ Produto capturado com o Botão Mágico!');
    }
  }, []);

  const openMagicImport = (data = null) => {
    if (data) setMagicImportInitialData(data);
    setIsMagicImportOpen(true);
  };

  const closeMagicImport = () => {
    setIsMagicImportOpen(false);
  };

  // Users List (Resellers Managed by Factory Admin)
  const [users, setUsersState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_users');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const setUsers = (usrs) => {
    setUsersState(usrs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smd_users', JSON.stringify(usrs));
    }
  };

  // Dynamic Categories State (Zerado para Produção)
  const [categories, setCategoriesState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_categories');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const setCategories = (cats) => {
    setCategoriesState(cats);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smd_categories', JSON.stringify(cats));
    }
  };

  // Factory Materials Catalog (Official User Pricing Table Persisted in localStorage)
  const defaultInitialMaterials = [
    {
      id: 'mat-mdf-cru',
      name: 'MDF Cru',
      factoryCostPerM2: 180.00, // Custo Real de Produção da Fábrica
      wholesalePricePerM2: 530.00, // Preço de Venda da Fábrica (Atacado)
      suggestedPricePerM2: 800.00,
      style: 'madeira',
      leadTimeDays: 2,
      description: 'Econômico / Básico para uso interno com acabamento natural.'
    },
    {
      id: 'mat-pvc-branco',
      name: 'PVC Expandido (Branco)',
      factoryCostPerM2: 210.00,
      wholesalePricePerM2: 615.00,
      suggestedPricePerM2: 950.00,
      style: 'prata',
      leadTimeDays: 2,
      description: 'Leve e resistente à umidade, ideal para letras e placas decorativas.'
    },
    {
      id: 'mat-mdf-pvc-pintado',
      name: 'MDF ou PVC Pintado',
      factoryCostPerM2: 240.00,
      wholesalePricePerM2: 670.00,
      suggestedPricePerM2: 1100.00,
      style: 'preto',
      leadTimeDays: 3,
      description: 'Personalizado com acabamento fosco ou brilhante e alta durabilidade.'
    },
    {
      id: 'mat-acm',
      name: 'ACM (Alumínio Composto)',
      factoryCostPerM2: 230.00,
      wholesalePricePerM2: 670.00,
      suggestedPricePerM2: 1000.00,
      style: 'prata',
      leadTimeDays: 3,
      description: 'Metálico e moderno, para fachadas, letreiros externos e painéis.'
    },
    {
      id: 'mat-acrilico-luxo',
      name: 'Acrílico Premium (Luxo)',
      factoryCostPerM2: 320.00,
      wholesalePricePerM2: 920.00,
      suggestedPricePerM2: 1380.00,
      style: 'dourado',
      leadTimeDays: 3,
      description: 'Corte a laser de alta precisão em acrílico cast nobre espelhado.'
    }
  ];

  const [materials, setMaterialsState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_materials');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return defaultInitialMaterials;
  });

  const setMaterials = (mats) => {
    setMaterialsState(mats);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smd_materials', JSON.stringify(mats));
    }
  };

  const addMaterial = (newMat) => {
    const item = {
      id: 'mat-' + Date.now(),
      name: newMat.name || 'Novo Material',
      factoryCostPerM2: Number(newMat.factoryCostPerM2) || 180,
      wholesalePricePerM2: Number(newMat.wholesalePricePerM2) || 530,
      suggestedPricePerM2: Number(newMat.suggestedPricePerM2) || 800,
      style: newMat.style || 'dourado',
      leadTimeDays: Number(newMat.leadTimeDays) || 3,
      description: newMat.description || 'Material fabril sob medida.'
    };
    const updated = [item, ...materials];
    setMaterials(updated);
    showNotification(`Material "${item.name}" adicionado com sucesso!`);
  };

  const updateMaterial = (id, updatedFields) => {
    const updated = materials.map((m) => (m.id === id ? { ...m, ...updatedFields } : m));
    setMaterials(updated);
    showNotification('Valores do material atualizados com sucesso!');
  };

  const deleteMaterial = (id) => {
    const updated = materials.filter((m) => m.id !== id);
    setMaterials(updated);
    showNotification('Material removido.');
  };

  // Products State (Zerado para Produção)
  const [products, setProductsState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_products');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const setProducts = (prods) => {
    setProductsState(prods);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smd_products', JSON.stringify(prods));
    }
  };

  // Reseller Suggested Products (Pending Approval by Admin)
  const [pendingProducts, setPendingProductsState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_pending_products');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const setPendingProducts = (pProds) => {
    setPendingProductsState(pProds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smd_pending_products', JSON.stringify(pProds));
    }
  };

  // Reseller Cart
  const [cart, setCart] = useState([]);

  // Orders State (Zerado para Produção)
  const [orders, setOrdersState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_orders');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const setOrders = (ords) => {
    setOrdersState(ords);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smd_orders', JSON.stringify(ords));
    }
  };

  const resetSystemForProduction = () => {
    setProducts([]);
    setCategories([]);
    setOrders([]);
    setPendingProducts([]);
    setUsers([]);
    setCart([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smd_products');
      localStorage.removeItem('smd_categories');
      localStorage.removeItem('smd_orders');
      localStorage.removeItem('smd_pending_products');
      localStorage.removeItem('smd_users');
      localStorage.removeItem('smd_cart');
    }
    showNotification('🧹 Sistema zerado com sucesso! Prontíssimo para produção.', 'success');
  };

  // Notifications Toast
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Auth Functions
  const loginAsAdmin = (email, password) => {
    if (email.toLowerCase() === adminEmail.toLowerCase()) {
      const adminUser = {
        id: 'admin-1',
        email: adminEmail,
        name: 'Administrador da Fábrica',
        role: 'admin'
      };
      setCurrentUser(adminUser);
      setViewMode('factory');
      showNotification('Autenticado como Administrador da Fábrica!');
      return true;
    } else {
      showNotification('Email não autorizado como administrador.', 'error');
      return false;
    }
  };

  const loginAsReseller = (email, name) => {
    const resellerUser = {
      id: 'user-' + Date.now(),
      email,
      name: name || 'Revendedor Autorizado',
      cnpj: '12.345.678/0001-99',
      phone: '(11) 99999-8888',
      pixKey: email,
      role: 'reseller',
      status: 'aprovado',
      tier: 'Bronze',
      discountPercent: 0
    };
    setCurrentUser(resellerUser);
    setViewMode('reseller');
    showNotification(`Bem-vindo, ${resellerUser.name}!`);
  };

  const registerReseller = (userData) => {
    // Security Helper: Sanitize inputs to prevent XSS script injection
    const sanitize = (str) => (typeof str === 'string' ? str.replace(/<[^>]*>?/gm, '').trim() : '');

    const newResellerUser = {
      id: 'user-' + Date.now(),
      name: sanitize(userData.storeName) || 'Nova Loja Revendedora',
      email: sanitize(userData.email).toLowerCase(),
      phone: sanitize(userData.phone) || '(11) 99999-9999',
      cnpj: sanitize(userData.cnpj) || '00.000.000/0001-00',
      role: 'reseller',
      status: 'aprovado',
      tier: 'Bronze',
      discountPercent: 0,
      totalOrders: 0,
      totalSpent: 0.00,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers((prev) => [newResellerUser, ...prev]);
    setCurrentUser(newResellerUser);
    setViewMode('reseller');

    showNotification(`🎉 Conta criada com sucesso! Bem-vindo, ${newResellerUser.name}!`);
    return true;
  };

  const logout = () => {
    setCurrentUser(defaultResellerUser);
    setViewMode('reseller');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smd_current_user');
      localStorage.setItem('smd_view_mode', 'reseller');
    }
    showNotification('Sessão encerrada.');
  };

  // User Management Functions
  const updateUserStatus = (userId, newStatus, newTier, newDiscount) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            status: newStatus || u.status,
            tier: newTier || u.tier,
            discountPercent: newDiscount !== undefined ? newDiscount : u.discountPercent
          };
        }
        return u;
      })
    );
    showNotification(`Dados do revendedor atualizados com sucesso!`);
  };

  const deleteUser = (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showNotification('Revendedor removido da base.');
  };

  const updateProfile = (updatedProfile) => {
    setCurrentUser((prev) => ({ ...prev, ...updatedProfile }));
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updatedProfile } : u))
    );
    showNotification('Seus dados de perfil foram salvos!');
  };

  // Category Operations
  const addCategory = (categoryName) => {
    if (!categoryName || categories.includes(categoryName)) return;
    setCategories((prev) => [...prev, categoryName]);
    showNotification(`Categoria "${categoryName}" criada!`);
  };

  const editCategory = (oldName, newName) => {
    if (!newName || categories.includes(newName)) return;
    setCategories((prev) => prev.map((c) => (c === oldName ? newName : c)));
    setProducts((prev) =>
      prev.map((p) => (p.category === oldName ? { ...p, category: newName } : p))
    );
    showNotification(`Categoria renomeada para "${newName}"!`);
  };

  const deleteCategory = (categoryName) => {
    setCategories((prev) => prev.filter((c) => c !== categoryName));
    showNotification(`Categoria "${categoryName}" removida.`);
  };

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Add Item to Cart
  const addToCart = (cartItem) => {
    setCart((prev) => [...prev, { ...cartItem, cartId: 'cart-' + Date.now() + Math.random() }]);
    showNotification(`Item "${cartItem.title}" adicionado ao carrinho!`);
  };

  const removeFromCart = (cartId) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Submit Order
  const submitOrder = (orderData) => {
    const newOrder = {
      id: "ORD-" + Math.floor(1000 + Math.random() * 9000),
      resellerEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      status: "aguardando_impressao",
      ...orderData
    };
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    showNotification(`Pedido ${newOrder.id} enviado para a fábrica!`, 'gold');
    return newOrder;
  };

  // Update Order Status by Factory
  const updateOrderStatus = (orderId, newStatus, trackingCode = null) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            trackingCode: trackingCode || order.trackingCode
          };
        }
        return order;
      })
    );
    showNotification(`Status do Pedido ${orderId} atualizado!`);
  };

  const deleteOrder = (orderId) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showNotification(`Pedido ${orderId} excluído do sistema.`);
  };

  // Add Product by Admin (Direct active publication)
  const addProduct = (productData) => {
    const newProduct = {
      id: "prod-" + (products.length + 1),
      inStock: true,
      mediaKit: {
        photos: [productData.image],
        copyTitle: productData.title,
        copyDescription: productData.description
      },
      ...productData
    };
    setProducts((prev) => [newProduct, ...prev]);
    showNotification(`Novo produto "${productData.title}" cadastrado no catálogo!`);
  };

  // Suggest Product by Reseller (Requires Admin Approval)
  const suggestProductByReseller = (productData) => {
    const newPending = {
      id: "pending-" + Date.now(),
      createdAt: new Date().toISOString(),
      resellerName: currentUser.name,
      resellerEmail: currentUser.email,
      status: "pending_approval",
      wholesalePrice: 0,
      ...productData
    };
    setPendingProducts((prev) => [newPending, ...prev]);
    showNotification(`Produto "${productData.title}" enviado para aprovação da fábrica!`, 'gold');
  };

  // Approve Reseller Suggested Product (Admin action with pricing)
  const approveProductByAdmin = (pendingId, wholesalePrice, suggestedPrice, category) => {
    const item = pendingProducts.find((p) => p.id === pendingId);
    if (!item) return;

    const approvedProduct = {
      id: "prod-" + (products.length + 1),
      title: item.title,
      category: category || item.category || categories[0],
      pricingType: item.pricingType || 'fixed',
      wholesalePrice: Number(wholesalePrice),
      suggestedRetailPrice: Number(suggestedPrice),
      pricePerM2: Number(wholesalePrice),
      suggestedPricePerM2: Number(suggestedPrice),
      factoryStock: 50,
      leadTimeDays: item.pricingType === 'custom_m2' ? 3 : 1,
      description: item.description || "Produto cadastrado e aprovado pela fábrica.",
      image: item.image || "https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80",
      video: item.video || "",
      inStock: true,
      ncm: "3926.90.90",
      ean: "7899812" + Math.floor(10000 + Math.random() * 90000)
    };

    setProducts((prev) => [approvedProduct, ...prev]);
    setPendingProducts((prev) =>
      prev.map((p) => (p.id === pendingId ? { ...p, status: 'approved' } : p))
    );
    showNotification(`Produto "${approvedProduct.title}" precificado e APROVADO para o catálogo oficial!`);
  };

  // Reject Reseller Suggested Product (Admin action with reason)
  const rejectProductByAdmin = (pendingId, rejectionReason) => {
    setPendingProducts((prev) =>
      prev.map((p) =>
        p.id === pendingId
          ? { ...p, status: 'rejected', rejectionReason: rejectionReason || "Solicitação não atende aos padrões fabris." }
          : p
      )
    );
    showNotification('Produto recusado com motivo especificado.', 'error');
  };

  const updateProduct = (productId, updatedFields) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updatedFields } : p))
    );
    showNotification(`Produto atualizado com sucesso!`);
  };

  const deleteProduct = (productId) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showNotification('Produto removido do catálogo.');
  };

  // Items Per Page Setting (Configured by Factory Admin)
  const [itemsPerPage, setItemsPerPageState] = useState(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('apex_items_per_page')) || 12;
    }
    return 12;
  });

  const setItemsPerPage = (num) => {
    const val = Number(num);
    setItemsPerPageState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex_items_per_page', String(val));
    }
    showNotification(`Limite do catálogo configurado para ${val} produtos por página!`);
  };

  // Items Per Row Setting (Configured by Factory Admin: 3, 4, or 6 columns)
  const [itemsPerRow, setItemsPerRowState] = useState(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('apex_items_per_row')) || 6;
    }
    return 6;
  });

  const setItemsPerRow = (num) => {
    const val = Number(num);
    setItemsPerRowState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex_items_per_row', String(val));
    }
    showNotification(`Grade configurada para ${val} produtos por linha!`);
  };

  // Company Settings & Legal Shielding (Configurable by Admin)
  const [companySettings, setCompanySettingsState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_company_settings');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved); 
          if (parsed && parsed.name && !parsed.name.includes('Apex')) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return {
      name: "SMD Drop",
      subtitle: "Plataforma Fabril de Dropshipping & Produtos sob Medida",
      cnpj: "45.109.892/0001-99",
      phone: "(11) 98765-4321",
      email: "contato@smddrop.com.br",
      address: "Av. Industrial Fabril, 1500 - Galpão 4 - São Paulo, SP",
      socialLinks: {
        instagram: "https://instagram.com/smddrop",
        facebook: "https://facebook.com/smddrop",
        whatsapp: "https://wa.me/5511987654321",
        youtube: "https://youtube.com/@smddrop"
      },
      heroSettings: {
        enabled: true,
        badge: "OPORTUNIDADE DE RENDA EXTRA • FABRICAÇÃO PRÓPRIA B2B",
        title: "Venda Produtos de Acrílico & Neon LED Sem Estoque e Lucre de R$ 3.000 a R$ 15.000/mês!",
        subtitle: "A fábrica SMD Drop cuida de tudo para você: nós produzimos sob medida, embalamos em caixa neutra e despachamos direto para o seu cliente final com a sua etiqueta do Mercado Livre, Shopee ou Amazon.",
        ctaText: "✨ Criar Conta Grátis e Liberar Atacado em 30s →",
        bullet1Title: "Zero Estoque",
        bullet1Subtitle: "Só pague após vender",
        bullet2Title: "Envio Cego Neutro",
        bullet2Subtitle: "Sua marca na etiqueta",
        bullet3Title: "Margem de 300%",
        bullet3Subtitle: "Preços direto de fábrica"
      },
      mySites: [
        { title: "Loja Oficial SMD Drop", url: "https://smddrop.com.br" },
        { title: "Portal de Atacado Fabril", url: "https://atacado.smddrop.com.br" },
        { title: "Catálogo Acrílico & Neon", url: "https://acrilico.smddrop.com.br" }
      ],
      termsContent: `1. ACEITAÇÃO DOS TERMOS E CONDIÇÕES
Ao utilizar a plataforma SMD Drop, o contratante (Revendedor) declara ter lido, compreendido e aceito integralmente estes Termos de Uso. A SMD Drop atua como parceira fabril e prestadora de serviços de fabricação, processamento e postagem de pedidos em modalidade de logística cega (Blind Shipping).

2. DA MODALIDADE DE ENVIO CEGO (BLIND SHIPPING) E RESPONSABILIDADE DAS ETIQUETAS
2.1. A SMD Drop compromete-se a efetuar o despacho de mercadorias utilizando as etiquetas de envio fornecidas pelo contratante (provenientes de plataformas parceiras como Mercado Livre, Shopee, Amazon, Magalu, Nuvemshop ou Shopify).
2.2. A embalagem utilizada pela fábrica é 100% neutra, isenta de marcas, logotipos ou materiais publicitários da SMD Drop, preservando o anonimato da operação perante o cliente final do revendedor.
2.3. O revendedor é o único responsável pela veracidade, conformidade fiscal e validade das etiquetas de frete e declarações de conteúdo cadastradas no sistema.

3. PRODUTOS PERSONALIZADOS SOB MEDIDA (CÁLCULO POR M²) E DIREITO DE ARREPENDIMENTO
3.1. Em estrita conformidade com a jurisprudência brasileira e exceções ao Artigo 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990), produtos fabricados sob medida, personalizados com logomarcas específicas do cliente ou cortados a laser sob demandas customizadas NÃO estão sujeitos a cancelamento injustificado ou devolução por simples arrependimento após a iniciação do processo fabril.
3.2. A SMD Drop garante a substituição ou refabricação sem custos adicionais de qualquer produto que apresente comprovado defeito de fabricação ou divergência em relação ao arquivo vetorial/medidas contratadas.

4. PROPRIEDADE INTELECTUAL E MARCAS REGISTRADAS
4.1. O revendedor declara possuir todos os direitos de uso, autorizações de imagem e licenças de marcas registradas sobre quaisquer logomarcas, arquivos vetoriais ou designs enviados para produção na fábrica.
4.2. A SMD Drop atua estritamente como executora técnica de corte e montagem, ficando isenta de qualquer responsabilidade civil ou criminal por violação de propriedade intelectual cometida pelo contratante.

5. PRAZOS FABRIS E FORÇA MAIOR
5.1. O prazo padrão de fabricação e despacho é de 24h a 72h úteis após a confirmação do pagamento e validação do arquivo vetorial.
5.2. Eventuais atrasos decorrentes de greves de transportadoras, indisponibilidade de serviços de correios ou eventos de força maior não ensejarão multa ou penalidades à contratada.`,
      privacyContent: `1. DECLARAÇÃO DE CONFORMIDADE COM A LGPD (LEI Nº 13.709/2018)
A SMD Drop reafirma seu compromisso inegociável com a segurança, privacidade e proteção dos dados pessoais de seus revendedores e dos clientes finais cujos dados são processados para fins de etiquetação e despacho.

2. DADOS COLETADOS E FINALIDADE DO PROCESSAMENTO
2.1. Coletamos dados do revendedor (Nome/Razão Social, CNPJ/CPF, Email, WhatsApp, Chave PIX) exclusivamente para gestão de cadastro, emissão de cobranças de atacado e suporte operacional.
2.2. Os dados de destinatários contidos nas etiquetas de envio anexadas pelo revendedor são utilizados ESTRITAMENTE para a impressão da etiqueta e colagem no pacote de despacho.
2.3. A SMD Drop NÃO comercializa, compartilha ou utiliza os dados dos clientes finais dos revendedores para fins de marketing ou prospecção própria em nenhuma hipótese.

3. ARMAZENAMENTO E SEGURANÇA DA INFORMAÇÃO
3.1. Todos os dados são armazenados em servidores seguros equipados com criptografia de ponta a ponta e controle de acesso restrito.
3.2. Os arquivos de etiquetas de envio em formato PDF são mantidos no sistema durante o período de garantia legal e descartados/arquivados com segurança após o cumprimento do despacho.

4. DIREITOS DO TITULAR DE DADOS
Nos termos do Artigo 18 da LGPD, o titular dos dados possui o direito de solicitar a confirmação do tratamento, acesso aos dados, correção de informações incompletas ou eliminação de dados pessoais desnecessários.

5. CONTATO DO ENCARREGADO DE DADOS (DPO)
Para exercer seus direitos de privacidade ou esclarecer dúvidas contratuais, entre em contato com nosso Encarregado de Proteção de Dados pelo email: privacidade@smddrop.com.br.`
    };
  });

  const updateCompanySettings = (newSettings) => {
    setCompanySettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_company_settings', JSON.stringify(updated));
      }
      return updated;
    });
    showNotification('Configurações da empresa e jurídicas salvas com sucesso!');
  };

  return (
    <StoreContext.Provider
      value={{
        theme,
        toggleTheme,
        viewMode,
        setViewMode,
        adminEmail,
        setAdminEmail,
        currentUser,
        users,
        updateUserStatus,
        deleteUser,
        updateProfile,
        loginAsAdmin,
        loginAsReseller,
        registerReseller,
        logout,
        categories,
        addCategory,
        editCategory,
        deleteCategory,
        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        products,
        addProduct,
        pendingProducts,
        suggestProductByReseller,
        approveProductByAdmin,
        rejectProductByAdmin,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        orders,
        submitOrder,
        updateOrderStatus,
        deleteOrder,
        notification,
        showNotification,
        isMagicImportOpen,
        magicImportInitialData,
        openMagicImport,
        closeMagicImport,
        itemsPerPage,
        setItemsPerPage,
        itemsPerRow,
        setItemsPerRow,
        companySettings,
        updateCompanySettings,
        resetSystemForProduction
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
