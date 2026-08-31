import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialProducts } from '../data/initialProducts';
import { 
  getSupabaseClient, 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  testSupabaseConnection, 
  syncToSupabase 
} from '../lib/supabase';

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
  const broadcastSync = (key, data) => {
    if (typeof window === 'undefined') return;
    try {
      const channel = new BroadcastChannel('smd_drop_sync_channel');
      channel.postMessage({ type: 'SYNC_FIELD_UPDATE', key, data });
      channel.close();
    } catch (e) {}
  };

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
          if (parsed && parsed.email) {
            if (parsed.email.toLowerCase() === adminEmail.toLowerCase()) {
              parsed.role = 'admin';
            }
            return parsed;
          }
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
    setUsersState((prev) => {
      const next = typeof usrs === 'function' ? usrs(prev) : usrs;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_users', JSON.stringify(next));
        broadcastSync('users', next);
      }
      return next;
    });
  };

  // Dynamic Categories State (Zerado para Produção)
  const [categories, setCategoriesState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_categories');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  });

  const setCategories = (cats) => {
    setCategoriesState((prev) => {
      const next = typeof cats === 'function' ? cats(prev) : cats;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_categories', JSON.stringify(next));
        broadcastSync('categories', next);
      }
      return next;
    });
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
    setMaterialsState((prev) => {
      const next = typeof mats === 'function' ? mats(prev) : mats;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_materials', JSON.stringify(next));
        broadcastSync('materials', next);
      }
      return next;
    });
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

  // Products State (Zerado para Produção Real)
  const [products, setProductsState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  });

  const setProducts = (prods) => {
    setProductsState((prev) => {
      const next = typeof prods === 'function' ? prods(prev) : prods;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_products', JSON.stringify(next));
        broadcastSync('products', next);
      }
      return next;
    });
  };

  // Reseller Suggested Products (Pending Approval by Admin)
  const [pendingProducts, setPendingProductsState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_pending_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  });

  const setPendingProducts = (pProds) => {
    setPendingProductsState((prev) => {
      const next = typeof pProds === 'function' ? pProds(prev) : pProds;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_pending_products', JSON.stringify(next));
        broadcastSync('pendingProducts', next);
      }
      return next;
    });
  };

  // Reseller Cart
  const [cart, setCart] = useState([]);

  // Orders State (Zerado para Produção)
  const [orders, setOrdersState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smd_orders');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  });

  const setOrders = (ords) => {
    setOrdersState((prev) => {
      const next = typeof ords === 'function' ? ords(prev) : ords;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smd_orders', JSON.stringify(next));
        broadcastSync('orders', next);
      }
      return next;
    });
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
    const isAdmin = email.toLowerCase() === adminEmail.toLowerCase();
    const resellerUser = {
      id: isAdmin ? 'admin-geovan' : 'user-' + Date.now(),
      email,
      name: name || (isAdmin ? 'Geovan Calado (Admin Fábrica)' : 'Revendedor Autorizado'),
      cnpj: '45.109.892/0001-99',
      phone: '(11) 99999-8888',
      pixKey: email,
      role: isAdmin ? 'admin' : 'reseller',
      status: 'aprovado',
      tier: isAdmin ? 'VIP Gold' : 'Bronze',
      discountPercent: isAdmin ? 100 : 0
    };
    setCurrentUser(resellerUser);
    setViewMode(isAdmin ? 'factory' : 'reseller');
    showNotification(isAdmin ? '👑 Autenticado como Administrador da Fábrica!' : `Bem-vindo, ${resellerUser.name}!`);

    // Sync to Supabase
    syncToSupabase('users', {
      id: resellerUser.id,
      name: resellerUser.name,
      email: resellerUser.email,
      phone: resellerUser.phone,
      cnpj: resellerUser.cnpj,
      role: resellerUser.role,
      status: resellerUser.status,
      tier: resellerUser.tier
    });
  };

  const registerReseller = (userData) => {
    // Security Helper: Sanitize inputs to prevent XSS script injection
    const sanitize = (str) => (typeof str === 'string' ? str.replace(/<[^>]*>?/gm, '').trim() : '');

    const userEmail = sanitize(userData.email).toLowerCase();
    const isAdmin = userEmail === adminEmail.toLowerCase();

    const newResellerUser = {
      id: isAdmin ? 'admin-geovan' : 'user-' + Date.now(),
      name: sanitize(userData.storeName) || (isAdmin ? 'Geovan Calado (Admin Fábrica)' : 'Nova Loja Revendedora'),
      email: userEmail,
      phone: sanitize(userData.phone) || '(11) 99999-9999',
      cnpj: sanitize(userData.cnpj) || '45.109.892/0001-99',
      role: isAdmin ? 'admin' : 'reseller',
      status: 'aprovado',
      tier: isAdmin ? 'VIP Gold' : 'Bronze',
      discountPercent: isAdmin ? 100 : 0,
      totalOrders: 0,
      totalSpent: 0.00,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers((prev) => [newResellerUser, ...prev]);
    setCurrentUser(newResellerUser);
    setViewMode(isAdmin ? 'factory' : 'reseller');

    if (isAdmin) {
      showNotification(`👑 Conta de Administrador da Fábrica ativada! Bem-vindo, Geovan!`);
    } else {
      showNotification(`🎉 Conta criada com sucesso! Bem-vindo, ${newResellerUser.name}!`);
    }

    // Sync to Supabase table 'users'
    syncToSupabase('users', {
      id: newResellerUser.id,
      name: newResellerUser.name,
      email: newResellerUser.email,
      phone: newResellerUser.phone,
      cnpj: newResellerUser.cnpj,
      role: newResellerUser.role,
      status: newResellerUser.status,
      tier: newResellerUser.tier
    });

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

  // Real-time Cross-Tab & Incognito Window Synchronizer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel;
    try {
      channel = new BroadcastChannel('smd_drop_sync_channel');
    } catch (e) {}

    const handleMessage = (event) => {
      const { type, key, data, payload } = event.data || {};

      if (type === 'REQUEST_STATE_SYNC' && channel) {
        channel.postMessage({
          type: 'RESPONSE_STATE_SYNC',
          payload: {
            products,
            categories,
            materials,
            orders,
            users,
            pendingProducts,
            companySettings
          }
        });
      } else if (type === 'RESPONSE_STATE_SYNC' && payload) {
        if (payload.products && Array.isArray(payload.products)) {
          setProductsState(payload.products);
          localStorage.setItem('smd_products', JSON.stringify(payload.products));
        }
        if (payload.categories && Array.isArray(payload.categories)) {
          setCategoriesState(payload.categories);
          localStorage.setItem('smd_categories', JSON.stringify(payload.categories));
        }
        if (payload.materials && Array.isArray(payload.materials)) {
          setMaterialsState(payload.materials);
          localStorage.setItem('smd_materials', JSON.stringify(payload.materials));
        }
        if (payload.orders && Array.isArray(payload.orders)) {
          setOrdersState(payload.orders);
          localStorage.setItem('smd_orders', JSON.stringify(payload.orders));
        }
        if (payload.users && Array.isArray(payload.users)) {
          setUsersState(payload.users);
          localStorage.setItem('smd_users', JSON.stringify(payload.users));
        }
        if (payload.pendingProducts && Array.isArray(payload.pendingProducts)) {
          setPendingProductsState(payload.pendingProducts);
          localStorage.setItem('smd_pending_products', JSON.stringify(payload.pendingProducts));
        }
        if (payload.companySettings) {
          setCompanySettingsState(payload.companySettings);
          localStorage.setItem('smd_company_settings', JSON.stringify(payload.companySettings));
        }
      } else if (type === 'SYNC_FIELD_UPDATE') {
        if (key === 'products' && Array.isArray(data)) {
          setProductsState(data);
          localStorage.setItem('smd_products', JSON.stringify(data));
        } else if (key === 'categories' && Array.isArray(data)) {
          setCategoriesState(data);
          localStorage.setItem('smd_categories', JSON.stringify(data));
        } else if (key === 'materials' && Array.isArray(data)) {
          setMaterialsState(data);
          localStorage.setItem('smd_materials', JSON.stringify(data));
        } else if (key === 'orders' && Array.isArray(data)) {
          setOrdersState(data);
          localStorage.setItem('smd_orders', JSON.stringify(data));
        } else if (key === 'users' && Array.isArray(data)) {
          setUsersState(data);
          localStorage.setItem('smd_users', JSON.stringify(data));
        } else if (key === 'pendingProducts' && Array.isArray(data)) {
          setPendingProductsState(data);
          localStorage.setItem('smd_pending_products', JSON.stringify(data));
        } else if (key === 'companySettings' && data) {
          setCompanySettingsState(data);
          localStorage.setItem('smd_company_settings', JSON.stringify(data));
        }
      }
    };

    if (channel) {
      channel.addEventListener('message', handleMessage);
      channel.postMessage({ type: 'REQUEST_STATE_SYNC' });
    }

    const handleStorage = (e) => {
      if (e.key === 'smd_products' && e.newValue) {
        try { setProductsState(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'smd_categories' && e.newValue) {
        try { setCategoriesState(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'smd_orders' && e.newValue) {
        try { setOrdersState(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'smd_users' && e.newValue) {
        try { setUsersState(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'smd_materials' && e.newValue) {
        try { setMaterialsState(JSON.parse(e.newValue)); } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) {
        channel.removeEventListener('message', handleMessage);
        channel.close();
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Load & Hydrate Data from Supabase Database on App Startup (Syncs Vercel & Localhost)
  useEffect(() => {
    const fetchSupabaseData = async () => {
      const client = getSupabaseClient();
      if (!client) return;

      try {
        // 1. Fetch Categories from Supabase
        const { data: dbCategories, error: catErr } = await client.from('categories').select('*');
        if (!catErr && dbCategories && dbCategories.length > 0) {
          const catNames = dbCategories.map((c) => c.name);
          setCategoriesState(catNames);
          if (typeof window !== 'undefined') {
            localStorage.setItem('smd_categories', JSON.stringify(catNames));
          }
        }

        // 2. Fetch Products from Supabase
        const { data: dbProducts, error: prodErr } = await client.from('products').select('*');
        if (!prodErr && dbProducts && dbProducts.length > 0) {
          const normalizedProds = dbProducts.map((p) => ({
            id: p.id,
            title: p.title,
            category: p.category_name || p.category || 'Geral',
            pricingType: p.pricing_type || p.pricingType || 'fixed',
            wholesalePrice: Number(p.wholesale_price ?? p.wholesalePrice ?? 0),
            suggestedRetailPrice: Number(p.suggested_retail_price ?? p.suggestedRetailPrice ?? 0),
            pricePerM2: Number(p.price_per_m2 ?? p.pricePerM2 ?? 530),
            suggestedPricePerM2: Number(p.suggested_price_per_m2 ?? p.suggestedPricePerM2 ?? 800),
            description: p.description || '',
            image: p.image_url || p.image || '',
            video: p.video || '',
            inStock: p.in_stock !== false,
            mediaKit: {
              photos: [p.image_url || p.image || ''],
              copyTitle: p.title,
              copyDescription: p.description
            }
          }));
          setProductsState(normalizedProds);
          if (typeof window !== 'undefined') {
            localStorage.setItem('smd_products', JSON.stringify(normalizedProds));
          }
        }

        // 3. Fetch Orders from Supabase
        const { data: dbOrders, error: ordErr } = await client.from('orders').select('*');
        if (!ordErr && dbOrders && dbOrders.length > 0) {
          const normalizedOrders = dbOrders.map((o) => ({
            id: o.id,
            resellerName: o.reseller_name || o.resellerName || 'Revendedor',
            resellerEmail: o.reseller_email || o.resellerEmail || '',
            wholesaleTotal: Number(o.wholesale_total ?? o.wholesaleTotal ?? 0),
            total: Number(o.total ?? 0),
            status: o.status || 'aguardando_impressao',
            trackingCode: o.tracking_code || o.trackingCode || null,
            createdAt: o.created_at || o.createdAt,
            items: o.items || []
          }));
          setOrdersState(normalizedOrders);
          if (typeof window !== 'undefined') {
            localStorage.setItem('smd_orders', JSON.stringify(normalizedOrders));
          }
        }
      } catch (err) {
        console.warn('Supabase initial fetch fallback:', err);
      }
    };

    fetchSupabaseData();
  }, []);

  // Sync all current state to Supabase
  const syncAllToSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      showNotification('Supabase não configurado. Adicione a URL e Chave Anon primeiro.', 'error');
      return false;
    }

    try {
      // 1. Sync Categories
      for (const cat of categories) {
        await client.from('categories').upsert({
          id: 'cat-' + cat.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: cat,
          slug: cat.toLowerCase().replace(/[^a-z0-9]/g, '-')
        });
      }

      // 2. Sync Products
      for (const prod of products) {
        await client.from('products').upsert({
          id: prod.id,
          title: prod.title,
          category_name: prod.category || null,
          pricing_type: prod.pricingType || 'fixed',
          wholesale_price: Number(prod.wholesalePrice) || 0,
          suggested_retail_price: Number(prod.suggestedRetailPrice) || 0,
          price_per_m2: Number(prod.pricePerM2) || 0,
          suggested_price_per_m2: Number(prod.suggestedPricePerM2) || 0,
          description: prod.description || '',
          image_url: prod.image || '',
          status: 'approved'
        });
      }

      // 3. Sync Orders
      for (const ord of orders) {
        await client.from('orders').upsert({
          id: ord.id,
          reseller_name: ord.resellerName || 'Revendedor',
          reseller_email: ord.resellerEmail || '',
          wholesale_total: Number(ord.wholesaleTotal) || 0,
          total: Number(ord.wholesaleTotal) || 0,
          status: ord.status || 'aguardando_impressao',
          dispatch_mode: ord.dispatchMode || 'marketplace_label',
          customer_name: ord.customerName || 'Cliente Final',
          customer_address: ord.customerAddress || 'Endereço',
          customer_city: ord.customerCity || 'São Paulo',
          customer_state: ord.customerState || 'SP',
          customer_zip: ord.customerZip || '01000-000'
        });
      }

      showNotification('🚀 Todos os dados foram sincronizados com o Supabase!', 'success');
      return true;
    } catch (err) {
      showNotification(`Erro ao sincronizar com Supabase: ${err.message}`, 'error');
      return false;
    }
  };

  // Category Operations
  const addCategory = async (categoryName) => {
    if (!categoryName) return;
    const cleanName = categoryName.trim();
    setCategories((prev) => {
      if (prev.includes(cleanName)) return prev;
      return [...prev, cleanName];
    });
    showNotification(`Categoria "${cleanName}" criada!`);

    // Sync to Supabase table 'categories'
    await syncToSupabase('categories', {
      id: 'cat-' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: cleanName,
      slug: cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    });
  };

  const editCategory = (oldName, newName) => {
    if (!newName) return;
    const cleanName = newName.trim();
    setCategories((prev) => prev.map((c) => (c === oldName ? cleanName : c)));
    setProducts((prev) =>
      prev.map((p) => (p.category === oldName ? { ...p, category: cleanName } : p))
    );
    showNotification(`Categoria renomeada para "${cleanName}"!`);
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

    // Sync to Supabase
    syncToSupabase('orders', {
      id: newOrder.id,
      reseller_name: currentUser?.name || 'Revendedor',
      reseller_email: newOrder.resellerEmail,
      wholesale_total: newOrder.wholesaleTotal || 0,
      total: newOrder.wholesaleTotal || 0,
      status: newOrder.status,
      dispatch_mode: orderData.dispatchMode || 'marketplace_label',
      customer_name: orderData.customerName || 'Cliente Final',
      customer_address: orderData.customerAddress || 'Endereço',
      customer_city: orderData.customerCity || 'São Paulo',
      customer_state: orderData.customerState || 'SP',
      customer_zip: orderData.customerZip || '01000-000'
    });

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
  const addProduct = async (productData) => {
    // Ensure category exists in Supabase first
    if (productData.category) {
      await syncToSupabase('categories', {
        id: 'cat-' + productData.category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: productData.category,
        slug: productData.category.toLowerCase().replace(/[^a-z0-9]/g, '-')
      });
    }

    const newProduct = {
      id: "prod-" + Date.now(),
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

    // Sync to Supabase matching schema.sql columns
    syncToSupabase('products', {
      id: newProduct.id,
      title: newProduct.title,
      category_name: newProduct.category || null,
      pricing_type: newProduct.pricingType || 'fixed',
      wholesale_price: Number(newProduct.wholesalePrice) || 0,
      suggested_retail_price: Number(newProduct.suggestedRetailPrice) || 0,
      price_per_m2: Number(newProduct.pricePerM2) || 0,
      suggested_price_per_m2: Number(newProduct.suggestedPricePerM2) || 0,
      description: newProduct.description || '',
      image_url: newProduct.image || '',
      status: 'approved'
    });
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
        resetSystemForProduction,
        syncAllToSupabase,
        getSupabaseCredentials,
        saveSupabaseCredentials,
        testSupabaseConnection
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
