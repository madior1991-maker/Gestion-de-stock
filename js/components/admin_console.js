/**
 * StockManager Pro v2 - Admin Console & Management Hub Component
 * Dedicated General Administrator View for modifying & deleting Factures, Bons de Commande, Produits, Mouvements, and Catégories.
 */

let activeAdminTab = 'invoices';

function renderAdminConsole(tab = activeAdminTab) {
  activeAdminTab = tab;

  // Check RBAC Admin access
  const isAdmin = window.store.isAdmin();
  const warningBanner = document.getElementById('admin-access-warning');
  const mainContentBox = document.getElementById('admin-tab-content');

  if (!isAdmin) {
    if (warningBanner) warningBanner.style.display = 'block';
    if (mainContentBox) mainContentBox.style.display = 'none';
    return;
  }

  if (warningBanner) warningBanner.style.display = 'none';
  if (mainContentBox) mainContentBox.style.display = 'block';

  // Highlight active sub-tab button
  const buttons = document.querySelectorAll('.admin-tab-btn');
  buttons.forEach(btn => {
    if (btn.dataset.tab === activeAdminTab) {
      btn.classList.add('active');
      btn.style.background = 'var(--accent-primary)';
      btn.style.color = '#ffffff';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'var(--bg-tertiary)';
      btn.style.color = 'var(--text-secondary)';
    }
  });

  // Render content according to active tab
  if (activeAdminTab === 'invoices') renderAdminInvoicesTable();
  else if (activeAdminTab === 'pos') renderAdminPOTable();
  else if (activeAdminTab === 'products') renderAdminProductsTable();
  else if (activeAdminTab === 'movements') renderAdminMovementsTable();
  else if (activeAdminTab === 'categories') renderAdminCategoriesTable();
  else if (activeAdminTab === 'users') renderAdminUsersTable();
}

// 1. ADMIN TAB: INVOICES (FACTURES PROFORMA & DÉFINITIVES)
function renderAdminInvoicesTable() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  const invoices = window.store.getInvoices();

  if (invoices.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem; color: var(--text-muted);">
        <i class="fa-solid fa-receipt" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block;"></i>
        Aucune facture enregistrée dans le système.
      </div>
    `;
    return;
  }

  const rows = invoices.map(inv => {
    const isProforma = inv.type === 'PROFORMA';
    const typeBadge = isProforma ?
      '<span class="badge badge-info"><i class="fa-solid fa-file-lines"></i> PROFORMA</span>' :
      '<span class="badge badge-success"><i class="fa-solid fa-file-invoice"></i> DÉFINITIVE</span>';

    const formattedDate = new Date(inv.date).toLocaleDateString('fr-FR');

    return `
      <tr>
        <td><strong style="color: var(--accent-primary);">${escapeHtml(inv.number)}</strong></td>
        <td>${typeBadge}</td>
        <td>${formattedDate}</td>
        <td><strong>${escapeHtml(inv.clientName)}</strong></td>
        <td><strong>${window.formatFCFA(inv.totalAmount)}</strong></td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn-secondary" style="padding: 0.28rem 0.6rem; font-size: 0.78rem; border-color: var(--info); color: var(--info);" onclick="openEditInvoiceModal('${inv.id}')" title="Modifier cette facture">
              <i class="fa-solid fa-pen-to-square"></i> Éditer
            </button>
            <button class="btn-secondary" style="padding: 0.28rem 0.6rem; font-size: 0.78rem; color: var(--danger); border-color: var(--danger);" onclick="adminDeleteInvoice('${inv.id}')" title="Supprimer définitivement cette facture">
              <i class="fa-solid fa-trash-can"></i> Supprimer
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card" style="padding: 0;">
      <div class="card-header" style="padding: 1rem 1.25rem;">
        <h3 class="card-title"><i class="fa-solid fa-file-invoice-dollar" style="color: var(--accent-primary);"></i> Administration des Factures & Devis</h3>
        <span class="badge badge-primary">${invoices.length} Document(s)</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>N° Document</th>
              <th>Type</th>
              <th>Date</th>
              <th>Client</th>
              <th>Montant TTC</th>
              <th>Actions Administrateur</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function adminDeleteInvoice(id) {
  if (!window.store.isAdmin()) return;
  const inv = window.store.getInvoiceById(id);
  if (!inv) return;

  const msg = inv.type === 'DEFINITIVE' ?
    `Confirmer la SUPPRESSION DÉFINITIVE de la facture #${inv.number} ? Le stock des articles vendus sera ré-crédité.` :
    `Confirmer la SUPPRESSION DÉFINITIVE du devis proforma #${inv.number} ?`;

  if (confirm(msg)) {
    try {
      window.store.deleteInvoice(id, true);
      showToast(`Facture #${inv.number} supprimée avec succès par l'Administrateur Général.`, 'info');

      renderAdminConsole('invoices');
      if (window.renderInvoices) window.renderInvoices();
      if (window.renderDashboard) window.renderDashboard();
      if (window.renderProducts) window.renderProducts();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

// 2. ADMIN TAB: PURCHASE ORDERS (BONS DE COMMANDE)
function renderAdminPOTable() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  const pos = window.store.getPurchaseOrders();

  if (pos.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem; color: var(--text-muted);">
        <i class="fa-solid fa-file-contract" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block;"></i>
        Aucun bon de commande trouvé.
      </div>
    `;
    return;
  }

  const rows = pos.map(p => {
    const formattedDate = new Date(p.date).toLocaleDateString('fr-FR');
    const statusBadge = p.status === 'RECEIVED' ?
      '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Réceptionné</span>' :
      '<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Envoyé</span>';

    return `
      <tr>
        <td><strong style="color: var(--accent-primary);">${escapeHtml(p.number)}</strong></td>
        <td>${formattedDate}</td>
        <td><strong>${escapeHtml(p.supplierName)}</strong></td>
        <td><strong>${window.formatFCFA(p.totalAmount)}</strong></td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn-secondary" style="padding: 0.28rem 0.6rem; font-size: 0.78rem; color: var(--danger); border-color: var(--danger);" onclick="adminDeletePO('${p.id}')" title="Supprimer ce bon de commande">
              <i class="fa-solid fa-trash-can"></i> Supprimer
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card" style="padding: 0;">
      <div class="card-header" style="padding: 1rem 1.25rem;">
        <h3 class="card-title"><i class="fa-solid fa-file-contract" style="color: var(--warning);"></i> Administration des Bons de Commande</h3>
        <span class="badge badge-warning">${pos.length} Bon(s)</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>N° Bon Commande</th>
              <th>Date</th>
              <th>Fournisseur</th>
              <th>Montant Estimé</th>
              <th>Statut</th>
              <th>Actions Administrateur</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function adminDeletePO(id) {
  if (!window.store.isAdmin()) return;
  const po = window.store.getPurchaseOrderById(id);
  if (!po) return;

  if (confirm(`Confirmer la suppression du Bon de Commande #${po.number} ?`)) {
    try {
      window.store.deletePurchaseOrder(id);
      showToast(`Bon de commande #${po.number} supprimé par l'Administrateur Général.`, 'info');

      renderAdminConsole('pos');
      if (window.renderPurchaseOrders) window.renderPurchaseOrders();
      if (window.renderDashboard) window.renderDashboard();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

// 3. ADMIN TAB: PRODUCTS (PRODUITS & INVENTAIRE)
function renderAdminProductsTable() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  const products = window.store.getProducts();

  if (products.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem; color: var(--text-muted);">
        <i class="fa-solid fa-box-open" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block;"></i>
        Aucun produit dans le catalogue.
      </div>
    `;
    return;
  }

  const rows = products.map(p => {
    return `
      <tr>
        <td><strong style="font-family: monospace; color: var(--accent-primary);">${escapeHtml(p.sku)}</strong></td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td><span class="badge badge-secondary">${p.quantity} unité(s)</span></td>
        <td>${window.formatFCFA(p.buyPrice)}</td>
        <td><strong>${window.formatFCFA(p.sellPrice)}</strong></td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn-secondary" style="padding: 0.28rem 0.6rem; font-size: 0.78rem;" onclick="openProductModal('${p.id}')" title="Éditer le produit">
              <i class="fa-solid fa-pen-to-square"></i> Éditer
            </button>
            <button class="btn-secondary" style="padding: 0.28rem 0.6rem; font-size: 0.78rem; color: var(--danger); border-color: var(--danger);" onclick="adminDeleteProduct('${p.id}')" title="Supprimer du catalogue">
              <i class="fa-solid fa-trash-can"></i> Supprimer
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card" style="padding: 0;">
      <div class="card-header" style="padding: 1rem 1.25rem;">
        <h3 class="card-title"><i class="fa-solid fa-boxes-stacked" style="color: var(--success);"></i> Administration du Catalogue Produits</h3>
        <span class="badge badge-success">${products.length} Produit(s)</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>SKU / Réf</th>
              <th>Nom du Produit</th>
              <th>Stock Actuel</th>
              <th>Prix Achat HT</th>
              <th>Prix Vente TTC</th>
              <th>Actions Administrateur</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function adminDeleteProduct(id) {
  if (!window.store.isAdmin()) return;
  const prod = window.store.getProductById(id);
  if (!prod) return;

  if (confirm(`Confirmer la suppression du produit "${prod.name}" (${prod.sku}) du catalogue ?`)) {
    try {
      window.store.deleteProduct(id);
      showToast(`Produit "${prod.name}" supprimé par l'Administrateur Général.`, 'info');

      renderAdminConsole('products');
      if (window.renderProducts) window.renderProducts();
      if (window.renderDashboard) window.renderDashboard();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

// 4. ADMIN TAB: MOVEMENTS AUDIT LOG
function renderAdminMovementsTable() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  const movements = window.store.getMovements();

  if (movements.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem; color: var(--text-muted);">
        <i class="fa-solid fa-right-left" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block;"></i>
        Aucun mouvement dans l'historique.
      </div>
    `;
    return;
  }

  const rows = movements.map(m => {
    const prod = window.store.getProductById(m.productId);
    const prodName = prod ? prod.name : 'Produit Supprimé';
    const formattedDate = new Date(m.date).toLocaleString('fr-FR');

    const typeBadge = m.type === 'IN' ?
      '<span class="badge badge-success"><i class="fa-solid fa-arrow-down"></i> Entrée (+)</span>' :
      (m.type === 'OUT' ?
        '<span class="badge badge-danger"><i class="fa-solid fa-arrow-up"></i> Sortie (-)</span>' :
        '<span class="badge badge-info"><i class="fa-solid fa-equals"></i> Ajustement (=)</span>');

    return `
      <tr>
        <td>${formattedDate}</td>
        <td><strong>${escapeHtml(prodName)}</strong></td>
        <td>${typeBadge}</td>
        <td><strong>${m.quantity}</strong></td>
        <td>${escapeHtml(m.reason || 'Saisie directe')}</td>
        <td>
          <button class="btn-secondary" style="padding: 0.28rem 0.6rem; font-size: 0.78rem; color: var(--danger); border-color: var(--danger);" onclick="adminDeleteMovement('${m.id}')" title="Annuler & Supprimer ce mouvement">
            <i class="fa-solid fa-ban"></i> Annuler Mouvement
          </button>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card" style="padding: 0;">
      <div class="card-header" style="padding: 1rem 1.25rem;">
        <h3 class="card-title"><i class="fa-solid fa-right-left" style="color: var(--info);"></i> Administration du Journal des Mouvements</h3>
        <span class="badge badge-info">${movements.length} Mouvement(s)</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Produit</th>
              <th>Type</th>
              <th>Qté</th>
              <th>Motif</th>
              <th>Action Admin</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function adminDeleteMovement(id) {
  if (!window.store.isAdmin()) return;

  if (confirm(`Confirmer l'annulation de ce mouvement de stock ? La quantité en stock sera ajustée en conséquence.`)) {
    try {
      window.store.deleteMovement(id, true);
      showToast(`Mouvement de stock annulé et stock rétabli par l'Administrateur Général.`, 'info');

      renderAdminConsole('movements');
      if (window.renderMovements) window.renderMovements();
      if (window.renderProducts) window.renderProducts();
      if (window.renderDashboard) window.renderDashboard();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

// 5. ADMIN TAB: CATEGORIES
function renderAdminCategoriesTable() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  const categories = window.store.getCategories();

  if (categories.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem; color: var(--text-muted);">
        <i class="fa-solid fa-tags" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block;"></i>
        Aucune catégorie enregistrée.
      </div>
    `;
    return;
  }

  const rows = categories.map(c => {
    return `
      <tr>
        <td>
          <span class="badge" style="background: ${c.color || '#6366f1'}; color: #fff; padding: 0.3rem 0.65rem;">
            <i class="fa-solid fa-tag"></i> ${escapeHtml(c.name)}
          </span>
        </td>
        <td>${escapeHtml(c.description || 'Aucune description')}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn-secondary" style="padding: 0.28rem 0.6rem; font-size: 0.78rem;" onclick="openCategoryModal('${c.id}')" title="Éditer la catégorie">
              <i class="fa-solid fa-pen-to-square"></i> Éditer
            </button>
            <button class="btn-secondary" style="padding: 0.28rem 0.6rem; font-size: 0.78rem; color: var(--danger); border-color: var(--danger);" onclick="adminDeleteCategory('${c.id}')" title="Supprimer la catégorie">
              <i class="fa-solid fa-trash-can"></i> Supprimer
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card" style="padding: 0;">
      <div class="card-header" style="padding: 1rem 1.25rem;">
        <h3 class="card-title"><i class="fa-solid fa-tags" style="color: var(--accent-primary);"></i> Administration des Catégories de Produits</h3>
        <span class="badge badge-primary">${categories.length} Catégorie(s)</span>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom de la Catégorie</th>
              <th>Description</th>
              <th>Actions Administrateur</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function adminDeleteCategory(id) {
  if (!window.store.isAdmin()) return;
  const cat = window.store.getCategories().find(c => c.id === id);
  if (!cat) return;

  if (confirm(`Confirmer la suppression de la catégorie "${cat.name}" ?`)) {
    try {
      window.store.deleteCategory(id);
      showToast(`Catégorie "${cat.name}" supprimée par l'Administrateur Général.`, 'info');

      renderAdminConsole('categories');
      if (window.renderCategories) window.renderCategories();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

function renderAdminUsersTable() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  const users = window.store.getUsers();

  const rows = users.map(u => {
    const isApproved = u.isApproved && u.status !== 'SUSPENDED';
    const statusBadge = isApproved ?
      '<span class="badge badge-success"><i class="fa-solid fa-user-check"></i> Accès Autorisé</span>' :
      '<span class="badge badge-danger"><i class="fa-solid fa-user-lock"></i> Accès Bloqué / En Attente</span>';

    const roleBadgeMap = {
      'ADMIN': '<span class="badge badge-primary">👑 Administrateur Général</span>',
      'MAGASINIER': '<span class="badge badge-info">📦 Magasinier</span>',
      'VENDEUR': '<span class="badge badge-warning">💼 Vendeur Commercial</span>'
    };

    const actionBtn = isApproved ? `
      <button class="btn-secondary" style="padding: 0.28rem 0.6rem; font-size: 0.78rem; border-color: var(--danger); color: var(--danger);" onclick="toggleUserApprovalWithConfirm('${u.id}')" title="Suspendre l'accès de cet utilisateur">
        <i class="fa-solid fa-user-minus"></i> Suspendre Accès
      </button>
    ` : `
      <button class="btn-success" style="padding: 0.28rem 0.6rem; font-size: 0.78rem;" onclick="toggleUserApprovalWithConfirm('${u.id}')" title="Autoriser l'accès de cet utilisateur">
        <i class="fa-solid fa-user-check"></i> Autoriser l'Accès
      </button>
    `;

    return `
      <tr>
        <td><strong style="color: var(--text-primary);">${escapeHtml(u.name)}</strong></td>
        <td><span style="font-family: monospace; font-size: 0.85rem;">${escapeHtml(u.email)}</span></td>
        <td>${roleBadgeMap[u.role] || u.role}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            ${actionBtn}
            ${u.role !== 'ADMIN' ? `
              <button class="btn-secondary" style="padding: 0.28rem 0.6rem; font-size: 0.78rem; color: var(--danger); border-color: var(--danger);" onclick="adminDeleteUserWithConfirm('${u.id}')" title="Supprimer ce compte utilisateur">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card" style="padding: 0;">
      <div class="card-header" style="padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h3 class="card-title"><i class="fa-solid fa-users-gear" style="color: var(--accent-primary);"></i> Administration & Autorisation des Comptes</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">L'Administrateur Général valide et autorise chaque utilisateur avant qu'il ne puisse se connecter.</p>
        </div>
        <button class="btn-primary" onclick="openNewUserModal()">
          <i class="fa-solid fa-user-plus"></i> Créer un Compte Utilisateur
        </button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom & Prénom</th>
              <th>Adresse Email / Identifiant</th>
              <th>Rôle</th>
              <th>Statut d'Autorisation</th>
              <th>Actions Administrateur</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function toggleUserApprovalWithConfirm(userId) {
  if (!window.store.isAdmin()) return;
  try {
    const user = window.store.toggleUserApproval(userId);
    const stateText = user.isApproved ? 'AUTORISÉ' : 'SUSPENDU';
    showToast(`Accès pour "${user.name}" désormais ${stateText}.`, user.isApproved ? 'success' : 'warning');
    renderAdminConsole('users');
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function adminDeleteUserWithConfirm(userId) {
  if (!window.store.isAdmin()) return;
  if (confirm('Supprimer définitivement ce compte utilisateur ?')) {
    try {
      window.store.deleteUser(userId);
      showToast('Compte utilisateur supprimé.', 'info');
      renderAdminConsole('users');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

window.renderAdminConsole = renderAdminConsole;
window.adminDeleteInvoice = adminDeleteInvoice;
window.adminDeletePO = adminDeletePO;
window.adminDeleteProduct = adminDeleteProduct;
window.adminDeleteMovement = adminDeleteMovement;
window.adminDeleteCategory = adminDeleteCategory;
window.renderAdminUsersTable = renderAdminUsersTable;
window.toggleUserApprovalWithConfirm = toggleUserApprovalWithConfirm;
window.adminDeleteUserWithConfirm = adminDeleteUserWithConfirm;
