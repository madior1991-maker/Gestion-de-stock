/**
 * StockManager Pro v2 - Data Store & LocalStorage Engine
 * Includes Products, Categories, Suppliers, Movements, Invoices, Financial Metrics, POs, Settings, User Accounts & Role Permissions (RBAC).
 */

const STORAGE_KEYS = {
  PRODUCTS: 'stockmanager_products_v1',
  CATEGORIES: 'stockmanager_categories_v1',
  SUPPLIERS: 'stockmanager_suppliers_v1',
  MOVEMENTS: 'stockmanager_movements_v1',
  INVOICES: 'stockmanager_invoices_v1',
  PURCHASE_ORDERS: 'stockmanager_po_v1',
  SETTINGS: 'stockmanager_settings_v1',
  USER_ROLE: 'stockmanager_user_role_v1',
  USERS: 'stockmanager_users_v1'
};

// Global FCFA Currency Formatter Helper
function formatFCFA(amount) {
  const settings = window.store ? window.store.getSettings() : {};
  const currencySymbol = settings.currency || 'FCFA';
  const val = Math.round(Number(amount) || 0);
  return val.toLocaleString('fr-FR') + ' ' + currencySymbol;
}
window.formatFCFA = formatFCFA;

// French Number-to-Words Converter for FCFA Compliance
function numberToWordsFR(num) {
  num = Math.floor(Math.abs(Number(num) || 0));
  if (num === 0) return "zéro FCFA";

  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingts", "quatre-vingt-dix"];

  function convertGroup(n) {
    let str = "";
    const h = Math.floor(n / 100);
    const r = n % 100;

    if (h > 0) {
      if (h === 1) str += "cent ";
      else str += units[h] + " cent ";
    }

    if (r > 0) {
      if (r < 20) {
        str += units[r];
      } else {
        const t = Math.floor(r / 10);
        const u = r % 10;
        if (t === 7 || t === 9) {
          str += tens[t - 1] + (u === 1 ? "-et-onze" : "-" + units[10 + u]);
        } else {
          str += tens[t] + (u === 1 ? "-et-un" : (u > 0 ? "-" + units[u] : ""));
        }
      }
    }
    return str.trim();
  }

  let result = "";
  const billions = Math.floor(num / 1000000000);
  let rem = num % 1000000000;
  const millions = Math.floor(rem / 1000000);
  rem = rem % 1000000;
  const thousands = Math.floor(rem / 1000);
  const ones = rem % 1000;

  if (billions > 0) result += convertGroup(billions) + (billions > 1 ? " milliards " : " milliard ");
  if (millions > 0) result += convertGroup(millions) + (millions > 1 ? " millions " : " million ");
  if (thousands > 0) {
    if (thousands === 1) result += "mille ";
    else result += convertGroup(thousands) + " mille ";
  }
  if (ones > 0) result += convertGroup(ones);

  result = result.trim();
  if (!result) result = "zéro";
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result + " FCFA";
}
window.numberToWordsFR = numberToWordsFR;

// Default Settings & Official 2M GLOBAL SERVICES Legal Info
const DEFAULT_SETTINGS = {
  companyName: '2M GLOBAL SERVICES',
  companyLogo: 'assets/logo.png',
  companyAddress: 'LIBERTE O1 VILLA N• 1336',
  companyPhone: '76-192-34-41',
  companyEmail: '2mglobalservices11@gmail.COM',
  companyTaxId: 'N.I.N.E.A: 012457695 - SN.DKR.2025.A.35597 - 35529/2025/RCCM/RA',
  companyStamp: '',
  currency: 'FCFA',
  defaultVatRate: 18,
  invoicePrefix: 'FAC-',
  proformaPrefix: 'PRO-',
  poPrefix: 'BC-',
  defaultMinStock: 5,
  showQrCode: true,
  allowNegativeStock: false,
  invoiceFooterLine1: '2M GLOBAL SERVICES - N.I.N.E.A: 012457695 - SN.DKR.2025.A.35597 - 35529/2025/RCCM/RA',
  invoiceFooterLine2: 'Adresse: LIBERTE O1 VILLA N• 1336 - 📧 E-MAIL: 2mglobalservices11@gmail.COM - ☎️ Tél: 76-192-34-41'
};

// Seed Users for User Accounts Management
const INITIAL_USERS = [
  { id: 'usr-1', name: 'Administrateur Général', email: 'admin@2mglobalservices.ci', role: 'ADMIN', active: true, permissions: { editValidatedInvoices: true, accessSettings: true, accessReports: true, manageStock: true } },
  { id: 'usr-2', name: 'Jean K. (Magasinier)', email: 'magasin@2mglobalservices.ci', role: 'MAGASINIER', active: true, permissions: { editValidatedInvoices: false, accessSettings: false, accessReports: false, manageStock: true } },
  { id: 'usr-3', name: 'Awa T. (Vendeuse)', email: 'ventes@2mglobalservices.ci', role: 'VENDEUR', active: true, permissions: { editValidatedInvoices: false, accessSettings: false, accessReports: false, manageStock: false } }
];

// Seed Data for Demo Purpose
const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Informatique & High-Tech', color: '#6366f1', description: 'Ordinateurs, périphériques et équipements' },
  { id: 'cat-2', name: 'Mobilier de Bureau', color: '#10b981', description: 'Bureaux, sièges et rangements' },
  { id: 'cat-3', name: 'Fournitures de Bureau', color: '#f59e0b', description: 'Papeterie, écriture et consommables' },
  { id: 'cat-4', name: 'Téléphonie & Réseau', color: '#06b6d4', description: 'Smartphones, câbles et switchs' }
];

const INITIAL_SUPPLIERS = [
  { id: 'sup-1', name: 'TechGlobal Distribution', contact: 'Marc Dupont', email: 'contact@techglobal.ci', phone: '+225 07 45 89 66 00' },
  { id: 'sup-2', name: 'Office Supply Afrique', contact: 'Sophie Martin', email: 'ventes@officesupply.sn', phone: '+221 33 820 12 34' },
  { id: 'sup-3', name: 'Mobilier & Design Pro', contact: 'Jean Lefebvre', email: 'info@mobidesign.ci', phone: '+225 27 22 52 90 00' }
];

const INITIAL_PRODUCTS = [
  {
    id: 'prod-101',
    sku: 'LAP-DELL-15',
    name: 'PC Portable Dell XPS 15',
    categoryId: 'cat-1',
    quantity: 14,
    minStock: 5,
    buyPrice: 750000,
    sellPrice: 950000,
    location: 'Allée A - Étagère 2',
    supplierId: 'sup-1',
    notes: 'Intel i7, 16GB RAM, SSD 512GB',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'prod-102',
    sku: 'MON-LG-27',
    name: 'Écran LG UltraFine 27" 4K',
    categoryId: 'cat-1',
    quantity: 3,
    minStock: 5,
    buyPrice: 185000,
    sellPrice: 250000,
    location: 'Allée A - Étagère 4',
    supplierId: 'sup-1',
    notes: 'Dalle IPS, USB-C 65W',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
  },
  {
    id: 'prod-103',
    sku: 'CHA-ERG-PRO',
    name: 'Chaise Ergonomique Herman Miller',
    categoryId: 'cat-2',
    quantity: 8,
    minStock: 3,
    buyPrice: 380000,
    sellPrice: 520000,
    location: 'Zone Mobilier B',
    supplierId: 'sup-3',
    notes: 'Finition noir carbone, soutien lombaire',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'prod-104',
    sku: 'PAP-A4-80G',
    name: 'Carton Papier A4 80g (5 ramettes)',
    categoryId: 'cat-3',
    quantity: 0,
    minStock: 10,
    buyPrice: 12500,
    sellPrice: 16500,
    location: 'Reserve Consommables C1',
    supplierId: 'sup-2',
    notes: 'Papier blanc certifié FSC',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString()
  },
  {
    id: 'prod-105',
    sku: 'SWI-CIS-24P',
    name: 'Switch Réseau Cisco 24 Ports PoE+',
    categoryId: 'cat-4',
    quantity: 6,
    minStock: 2,
    buyPrice: 210000,
    sellPrice: 320000,
    location: 'Allée B - Étagère 1',
    supplierId: 'sup-1',
    notes: 'Géré Niveau 2+, Fanless',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'prod-106',
    sku: 'CLAV-LOG-MX',
    name: 'Clavier Sans Fil Logitech MX Keys',
    categoryId: 'cat-1',
    quantity: 18,
    minStock: 4,
    buyPrice: 45000,
    sellPrice: 68000,
    location: 'Allée A - Tiroir 3',
    supplierId: 'sup-1',
    notes: 'Rétroéclairé, Multi-dispositifs',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

const INITIAL_MOVEMENTS = [
  {
    id: 'mov-1',
    productId: 'prod-101',
    type: 'IN',
    quantity: 20,
    reason: 'Réception Commande Fournisseur',
    date: new Date(Date.now() - 10 * 86400000).toISOString(),
    user: 'Admin'
  },
  {
    id: 'mov-2',
    productId: 'prod-101',
    type: 'OUT',
    quantity: 2,
    reason: 'Facture #FAC-2026-0001',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    user: 'Admin'
  }
];

const INITIAL_INVOICES = [
  {
    id: 'inv-1',
    type: 'DEFINITIVE',
    number: 'FAC-2026-0001',
    clientName: 'Société SOTRA CI',
    clientPhone: '+225 01 02 03 04',
    clientTaxId: 'RCCM: 987654321B',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    items: [
      { productId: 'prod-101', productName: 'PC Portable Dell XPS 15', sku: 'LAP-DELL-15', quantity: 2, unitPrice: 950000, total: 1900000 }
    ],
    subtotal: 1900000,
    discountAmount: 0,
    netSubtotal: 1900000,
    vatRate: 18,
    vatAmount: 342000,
    totalAmount: 2242000,
    paymentMethod: 'Virement bancaire',
    notes: 'Paiement sous 15 jours à compter de la date de facturation.',
    status: 'PAID'
  },
  {
    id: 'inv-2',
    type: 'PROFORMA',
    number: 'PRO-2026-0001',
    clientName: 'Groupe Banque d\'Abidjan',
    clientPhone: '+225 27 21 00 11 22',
    clientTaxId: 'RCCM: CI-ABJ-2023-B-54321',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    items: [
      { productId: 'prod-103', productName: 'Chaise Ergonomique Herman Miller', sku: 'CHA-ERG-PRO', quantity: 5, unitPrice: 520000, total: 2600000 }
    ],
    subtotal: 2600000,
    discountAmount: 100000,
    netSubtotal: 2500000,
    vatRate: 18,
    vatAmount: 450000,
    totalAmount: 2950000,
    paymentMethod: 'Virement bancaire',
    notes: 'Offre de prix valable 30 jours à compter de la date de délivrance.',
    status: 'PENDING'
  }
];

const INITIAL_PURCHASE_ORDERS = [
  {
    id: 'po-1',
    number: 'BC-2026-0001',
    supplierId: 'sup-1',
    supplierName: 'TechGlobal Distribution',
    date: new Date(Date.now() - 8 * 86400000).toISOString(),
    items: [
      { productId: 'prod-102', productName: 'Écran LG UltraFine 27" 4K', sku: 'MON-LG-27', quantity: 10, unitPrice: 185000, total: 1850000 }
    ],
    totalAmount: 1850000,
    status: 'SENT'
  }
];

class DataStore {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.resetDemoData();
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER_ROLE)) {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'ADMIN');
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
  }

  resetDemoData() {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(INITIAL_PURCHASE_ORDERS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'ADMIN');
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }

  // --- USER ROLE MANAGEMENT (RBAC) ---
  getUserRole() {
    return localStorage.getItem(STORAGE_KEYS.USER_ROLE) || 'ADMIN';
  }

  setUserRole(role) {
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    return role;
  }

  isAdmin() {
    return this.getUserRole() === 'ADMIN';
  }

  // --- USER ACCOUNTS MANAGEMENT (ADMIN ONLY) ---
  getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  saveUser(userData) {
    if (!this.isAdmin()) throw new Error('Seul l\'Administrateur Général peut gérer les comptes d\'accès.');

    const users = this.getUsers();
    if (userData.id) {
      const idx = users.findIndex(u => u.id === userData.id);
      if (idx !== -1) users[idx] = { ...users[idx], ...userData };
    } else {
      const newUser = {
        id: 'usr-' + Date.now().toString(36),
        name: userData.name,
        email: userData.email,
        role: userData.role || 'VENDEUR',
        active: true,
        permissions: userData.permissions || { editValidatedInvoices: userData.role === 'ADMIN', accessSettings: userData.role === 'ADMIN', accessReports: userData.role === 'ADMIN', manageStock: userData.role !== 'VENDEUR' }
      };
      users.push(newUser);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return users;
  }

  deleteUser(id) {
    if (!this.isAdmin()) throw new Error('Seul l\'Administrateur Général peut supprimer un utilisateur.');
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // --- SETTINGS ---
  getSettings() {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  }

  saveSettings(newSettings) {
    const updated = { ...this.getSettings(), ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // --- PRODUCTS CRUD ---
  getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id);
  }

  saveProduct(productData) {
    const products = this.getProducts();
    let product;

    if (productData.id) {
      const index = products.findIndex(p => p.id === productData.id);
      if (index !== -1) {
        const existingSku = products.find(p => p.id !== productData.id && p.sku.toLowerCase() === productData.sku.toLowerCase());
        if (existingSku) {
          throw new Error(`Le SKU "${productData.sku}" est déjà utilisé par un autre produit.`);
        }
        products[index] = { ...products[index], ...productData, updatedAt: new Date().toISOString() };
        product = products[index];
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      } else {
        throw new Error('Produit non trouvé pour la modification.');
      }
    } else {
      const existingSku = products.find(p => p.sku.toLowerCase() === productData.sku.toLowerCase());
      if (existingSku) {
        throw new Error(`Un produit avec le SKU "${productData.sku}" existe déjà.`);
      }

      const initialQty = parseInt(productData.quantity, 10) || 0;
      
      product = {
        ...productData,
        quantity: 0,
        id: 'prod-' + Date.now().toString(36),
        createdAt: new Date().toISOString()
      };

      products.unshift(product);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

      if (initialQty > 0) {
        this.addMovement({
          productId: product.id,
          type: 'IN',
          quantity: initialQty,
          reason: 'Stock Initial à la création',
          user: 'Admin'
        });
        product = this.getProductById(product.id);
      }
    }

    return product;
  }

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  // --- TOP SELLING PRODUCTS ANALYTICS ---
  getTopSellingProducts(limit = 5) {
    const invoices = this.getInvoices().filter(i => (i.type === 'DEFINITIVE' || !i.type) && i.status === 'PAID');
    const products = this.getProducts();

    const salesMap = {};
    products.forEach(p => {
      salesMap[p.id] = { product: p, totalQty: 0, totalRevenue: 0 };
    });

    invoices.forEach(inv => {
      if (inv.items) {
        inv.items.forEach(item => {
          if (salesMap[item.productId]) {
            salesMap[item.productId].totalQty += item.quantity || 0;
            salesMap[item.productId].totalRevenue += item.total || 0;
          }
        });
      }
    });

    return Object.values(salesMap)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, limit);
  }

  // --- SYSTEM NOTIFICATIONS CENTER ---
  getNotifications() {
    const notifications = [];
    const lowStockProds = this.getLowStockProducts();
    const invoices = this.getInvoices();

    lowStockProds.forEach(p => {
      const isOut = p.quantity <= 0;
      notifications.push({
        id: 'notif-' + p.id,
        type: isOut ? 'danger' : 'warning',
        title: isOut ? 'Rupture de Stock' : 'Stock d\'Alerte Min.',
        message: `"${p.name}" (${p.sku}) a un stock de ${p.quantity} unité(s).`,
        time: 'En direct'
      });
    });

    invoices.slice(0, 3).forEach(inv => {
      notifications.push({
        id: 'notif-inv-' + inv.id,
        type: 'success',
        title: inv.type === 'PROFORMA' ? 'Proforma Émise' : 'Nouvelle Vente',
        message: `Document #${inv.number} pour ${inv.clientName} (${formatFCFA(inv.totalAmount)})`,
        time: new Date(inv.date).toLocaleDateString('fr-FR')
      });
    });

    return notifications;
  }

  // --- STOCK MOVEMENTS ---
  getMovements() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENTS) || '[]');
  }

  addMovement({ productId, type, quantity, reason, user = 'Admin' }) {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);

    if (!product) throw new Error('Produit non trouvé');

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) throw new Error('Quantité invalide');

    const settings = this.getSettings();

    if (type === 'OUT' && !settings.allowNegativeStock && product.quantity < qty) {
      throw new Error(`Stock insuffisant pour "${product.name}" ! Stock disponible: ${product.quantity}`);
    }

    if (type === 'IN') {
      product.quantity += qty;
    } else if (type === 'OUT') {
      product.quantity -= qty;
    } else if (type === 'ADJUST') {
      product.quantity = qty;
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    const movement = {
      id: 'mov-' + Date.now().toString(36),
      productId,
      type,
      quantity: qty,
      reason: reason || (type === 'IN' ? 'Entrée de stock' : 'Sortie de stock'),
      date: new Date().toISOString(),
      user
    };

    const movements = this.getMovements();
    movements.unshift(movement);
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));

    return { product, movement };
  }

  // --- INVOICES & FINANCIAL ANALYTICS ---
  getInvoices() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
  }

  getInvoiceById(id) {
    return this.getInvoices().find(i => i.id === id);
  }

  createInvoice(invoiceData) {
    const settings = this.getSettings();
    const invoices = this.getInvoices();
    const isProforma = invoiceData.type === 'PROFORMA';

    if (!isProforma && !settings.allowNegativeStock) {
      invoiceData.items.forEach(item => {
        const prod = this.getProductById(item.productId);
        if (!prod) throw new Error(`Produit introuvable : ${item.productName}`);
        if (prod.quantity < item.quantity) {
          throw new Error(`Stock insuffisant pour "${prod.name}" (${prod.quantity} disponible(s), ${item.quantity} demandé(s)).`);
        }
      });
    }

    const prefix = isProforma ? (settings.proformaPrefix || 'PRO-') : (settings.invoicePrefix || 'FAC-');
    const invCount = invoices.filter(i => isProforma ? i.type === 'PROFORMA' : i.type !== 'PROFORMA').length + 1;
    const invNumber = invoiceData.number || `${prefix}${new Date().getFullYear()}-${invCount.toString().padStart(4, '0')}`;

    const invoice = {
      id: 'inv-' + Date.now().toString(36),
      type: isProforma ? 'PROFORMA' : 'DEFINITIVE',
      number: invNumber,
      clientName: invoiceData.clientName || 'Client Passage',
      clientPhone: invoiceData.clientPhone || '',
      clientTaxId: invoiceData.clientTaxId || '',
      date: new Date().toISOString(),
      dueDate: invoiceData.dueDate || new Date(Date.now() + 15 * 86400000).toISOString(),
      items: invoiceData.items,
      subtotal: invoiceData.subtotal,
      discountAmount: invoiceData.discountAmount || 0,
      netSubtotal: invoiceData.netSubtotal || invoiceData.subtotal,
      vatRate: invoiceData.vatRate || 0,
      vatAmount: invoiceData.vatAmount || 0,
      totalAmount: invoiceData.totalAmount,
      paymentMethod: invoiceData.paymentMethod || 'Espèces',
      notes: invoiceData.notes || '',
      status: isProforma ? 'PENDING' : (invoiceData.status || 'PAID')
    };

    if (!isProforma) {
      invoice.items.forEach(item => {
        this.addMovement({
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          reason: `Vente Facture #${invoice.number}`,
          user: 'Vendeur'
        });
      });
    }

    invoices.unshift(invoice);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    return invoice;
  }

  updateInvoice(invoiceId, updatedData) {
    if (!this.isAdmin()) {
      throw new Error('ACCÈS REFUSÉ : Seul l\'Administrateur Général a le droit de modifier une facture déjà validée.');
    }

    const invoices = this.getInvoices();
    const index = invoices.findIndex(i => i.id === invoiceId);
    if (index === -1) throw new Error('Facture introuvable.');

    const oldInv = invoices[index];
    const isDefinitive = oldInv.type === 'DEFINITIVE' || oldInv.status === 'PAID';

    if (isDefinitive && oldInv.items) {
      oldInv.items.forEach(item => {
        this.addMovement({
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          reason: `Annulation/Modification Facture #${oldInv.number} (Re-crédit par Admin)`,
          user: 'Administrateur'
        });
      });
    }

    if (isDefinitive && updatedData.items) {
      updatedData.items.forEach(item => {
        this.addMovement({
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          reason: `Ajustement Facture #${oldInv.number} (Débit par Admin)`,
          user: 'Administrateur'
        });
      });
    }

    invoices[index] = {
      ...oldInv,
      ...updatedData,
      id: oldInv.id,
      number: oldInv.number,
      date: oldInv.date,
      lastModifiedBy: 'Administrateur Général',
      lastModifiedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    return invoices[index];
  }

  convertProformaToDefinitive(proformaId) {
    const invoices = this.getInvoices();
    const proforma = invoices.find(i => i.id === proformaId);

    if (!proforma) throw new Error('Facture proforma introuvable.');
    if (proforma.type !== 'PROFORMA') throw new Error('Ce document n\'est pas une facture proforma.');

    const settings = this.getSettings();

    if (!settings.allowNegativeStock) {
      proforma.items.forEach(item => {
        const prod = this.getProductById(item.productId);
        if (!prod) throw new Error(`Produit introuvable : ${item.productName}`);
        if (prod.quantity < item.quantity) {
          throw new Error(`Stock insuffisant pour "${prod.name}" (${prod.quantity} disponible(s), ${item.quantity} demandé(s)).`);
        }
      });
    }

    const defCount = invoices.filter(i => i.type === 'DEFINITIVE').length + 1;
    const newNumber = `${settings.invoicePrefix || 'FAC-'}${new Date().getFullYear()}-${defCount.toString().padStart(4, '0')}`;

    proforma.status = 'CONVERTED';

    const definitiveInvoice = {
      id: 'inv-' + Date.now().toString(36),
      type: 'DEFINITIVE',
      number: newNumber,
      convertedFrom: proforma.number,
      clientName: proforma.clientName,
      clientPhone: proforma.clientPhone,
      clientTaxId: proforma.clientTaxId,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      items: proforma.items,
      subtotal: proforma.subtotal,
      discountAmount: proforma.discountAmount,
      netSubtotal: proforma.netSubtotal,
      vatRate: proforma.vatRate,
      vatAmount: proforma.vatAmount,
      totalAmount: proforma.totalAmount,
      paymentMethod: proforma.paymentMethod,
      notes: proforma.notes,
      status: 'PAID'
    };

    definitiveInvoice.items.forEach(item => {
      this.addMovement({
        productId: item.productId,
        type: 'OUT',
        quantity: item.quantity,
        reason: `Conversion Proforma #${proforma.number} en Facture #${definitiveInvoice.number}`,
        user: 'Vendeur'
      });
    });

    invoices.unshift(definitiveInvoice);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    return definitiveInvoice;
  }

  getFinancialMetrics() {
    const invoices = this.getInvoices().filter(i => (i.type === 'DEFINITIVE' || !i.type) && i.status === 'PAID');

    let caTtc = 0;
    let caHt = 0;
    let totalTva = 0;
    let totalDiscount = 0;
    let cogs = 0;

    invoices.forEach(inv => {
      caTtc += (inv.totalAmount || 0);
      caHt += (inv.netSubtotal || inv.subtotal || 0);
      totalTva += (inv.vatAmount || 0);
      totalDiscount += (inv.discountAmount || 0);

      if (inv.items) {
        inv.items.forEach(item => {
          const prod = this.getProductById(item.productId);
          const buyPrice = prod ? (prod.buyPrice || 0) : 0;
          cogs += buyPrice * (item.quantity || 0);
        });
      }
    });

    const netProfit = caHt - cogs;
    const profitMargin = caHt > 0 ? Math.round((netProfit / caHt) * 1000) / 10 : 0;
    const avgOrderValue = invoices.length > 0 ? Math.round(caTtc / invoices.length) : 0;

    const proformaInvoices = this.getInvoices().filter(i => i.type === 'PROFORMA' && i.status !== 'CONVERTED');
    const pendingProformaAmount = proformaInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);

    return {
      caTtc,
      caHt,
      totalTva,
      totalDiscount,
      cogs,
      netProfit,
      profitMargin,
      paidInvoicesCount: invoices.length,
      avgOrderValue,
      pendingProformaCount: proformaInvoices.length,
      pendingProformaAmount
    };
  }

  // --- PURCHASE ORDERS ---
  getPurchaseOrders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || '[]');
  }

  getPurchaseOrderById(id) {
    return this.getPurchaseOrders().find(p => p.id === id);
  }

  createPurchaseOrder(poData) {
    const settings = this.getSettings();
    const pos = this.getPurchaseOrders();

    const poCount = pos.length + 1;
    const poNumber = poData.number || `${settings.poPrefix || 'BC-'}${new Date().getFullYear()}-${poCount.toString().padStart(4, '0')}`;

    const po = {
      id: 'po-' + Date.now().toString(36),
      number: poNumber,
      supplierId: poData.supplierId || '',
      supplierName: poData.supplierName || 'Fournisseur Général',
      date: new Date().toISOString(),
      items: poData.items,
      totalAmount: poData.totalAmount,
      status: poData.status || 'SENT'
    };

    pos.unshift(po);
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(pos));
    return po;
  }

  receivePurchaseOrder(poId) {
    const pos = this.getPurchaseOrders();
    const po = pos.find(p => p.id === poId);
    if (!po) throw new Error('Bon de commande non trouvé.');
    if (po.status === 'RECEIVED') throw new Error('Ce bon de commande a déjà été réceptionné.');

    po.items.forEach(item => {
      this.addMovement({
        productId: item.productId,
        type: 'IN',
        quantity: item.quantity,
        reason: `Réception Bon de Commande #${po.number}`,
        user: 'Magasinier'
      });
    });

    po.status = 'RECEIVED';
    po.receivedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(pos));
    return po;
  }

  // --- CATEGORIES & SUPPLIERS ---
  getCategories() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
  }

  saveCategory(catData) {
    const categories = this.getCategories();
    if (catData.id) {
      const idx = categories.findIndex(c => c.id === catData.id);
      if (idx !== -1) categories[idx] = { ...categories[idx], ...catData };
    } else {
      categories.push({
        ...catData,
        id: 'cat-' + Date.now().toString(36)
      });
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  deleteCategory(id) {
    const categories = this.getCategories().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  getSuppliers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPLIERS) || '[]');
  }

  // --- METRICS ---
  getMetrics() {
    const products = this.getProducts();
    const invoices = this.getInvoices();

    let totalValuationBuy = 0;
    let totalValuationSell = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      totalValuationBuy += (p.buyPrice || 0) * (p.quantity || 0);
      totalValuationSell += (p.sellPrice || 0) * (p.quantity || 0);

      if (p.quantity <= 0) {
        outOfStockCount++;
      } else if (p.quantity <= p.minStock) {
        lowStockCount++;
      }
    });

    const totalSalesAmount = invoices
      .filter(i => (i.type === 'DEFINITIVE' || !i.type) && i.status === 'PAID')
      .reduce((acc, i) => acc + (i.totalAmount || 0), 0);

    return {
      totalProducts: products.length,
      totalValuationBuy,
      totalValuationSell,
      totalSalesAmount,
      lowStockCount,
      outOfStockCount,
      totalAlerts: lowStockCount + outOfStockCount
    };
  }

  getLowStockProducts() {
    return this.getProducts().filter(p => p.quantity <= p.minStock);
  }
}

const store = new DataStore();
window.store = store;
