/**
 * StockManager Pro v2 - Portefeuille Client & CRM Component
 * (Gestion des Clients, Fiches Détaillées, Historique d'Achats, CA & Intégration Directe Factures / WhatsApp)
 */

let currentClientFilter = 'ALL';

function renderClients() {
  const tbody = document.getElementById('clients-table-body');
  if (!tbody) return;

  const clients = window.store.getClients();
  const searchInput = document.getElementById('search-clients');
  const typeFilterSelect = document.getElementById('filter-client-type');

  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedType = typeFilterSelect ? typeFilterSelect.value : 'ALL';

  // Compute KPI metrics
  let totalCompanyCount = 0;
  let totalIndividualCount = 0;
  let totalPortfolioRevenue = 0;

  clients.forEach(c => {
    if (c.type === 'COMPANY') totalCompanyCount++;
    else totalIndividualCount++;

    const metrics = window.store.getClientMetrics(c.id);
    totalPortfolioRevenue += metrics.totalRevenue;
  });

  const kpiTotalClients = document.getElementById('kpi-total-clients');
  const kpiCompanyCount = document.getElementById('kpi-company-clients');
  const kpiIndividualCount = document.getElementById('kpi-individual-clients');
  const kpiPortfolioRevenue = document.getElementById('kpi-portfolio-revenue');

  if (kpiTotalClients) kpiTotalClients.textContent = clients.length;
  if (kpiCompanyCount) kpiCompanyCount.textContent = totalCompanyCount;
  if (kpiIndividualCount) kpiIndividualCount.textContent = totalIndividualCount;
  if (kpiPortfolioRevenue) kpiPortfolioRevenue.textContent = window.formatFCFA(totalPortfolioRevenue);

  // Filter clients
  let filtered = clients;
  if (selectedType !== 'ALL') {
    filtered = filtered.filter(c => c.type === selectedType);
  }

  if (searchQuery) {
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(searchQuery) ||
      (c.code && c.code.toLowerCase().includes(searchQuery)) ||
      (c.phone && c.phone.toLowerCase().includes(searchQuery)) ||
      (c.contactName && c.contactName.toLowerCase().includes(searchQuery)) ||
      (c.address && c.address.toLowerCase().includes(searchQuery))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <i class="fa-solid fa-users-slash" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
          Aucun client ne correspond aux critères de recherche.
        </td>
      </tr>
    `;
    return;
  }

  const isAdmin = window.store.isAdmin();

  tbody.innerHTML = filtered.map(c => {
    const isCompany = c.type === 'COMPANY';
    const typeBadge = isCompany ?
      '<span class="badge badge-primary" style="background: linear-gradient(135deg, #0284c7, #0369a1); color:#fff;"><i class="fa-solid fa-building"></i> Entreprise</span>' :
      '<span class="badge badge-info"><i class="fa-solid fa-user"></i> Particulier</span>';

    const metrics = window.store.getClientMetrics(c.id);
    const formattedLastDate = metrics.lastPurchaseDate ? 
      new Date(metrics.lastPurchaseDate).toLocaleDateString('fr-FR') : 'Aucun achat';

    return `
      <tr>
        <td>
          <span style="font-family: monospace; font-weight: 700; color: var(--accent-primary); font-size: 0.85rem;">${escapeHtml(c.code || 'CLI-000')}</span>
        </td>
        <td>
          <strong style="color: var(--text-primary); font-size: 0.92rem; cursor: pointer;" onclick="openClientDetailModal('${c.id}')">${escapeHtml(c.name)}</strong>
          ${c.contactName && c.contactName !== c.name ? `<span style="display:block; font-size:0.75rem; color:var(--text-muted);"><i class="fa-solid fa-user-tag"></i> Contact: ${escapeHtml(c.contactName)}</span>` : ''}
          ${c.category ? `<span class="badge badge-secondary" style="font-size:0.68rem; margin-top:0.2rem;">${escapeHtml(c.category)}</span>` : ''}
        </td>
        <td>${typeBadge}</td>
        <td>
          <div style="font-size: 0.82rem;">
            ${c.phone ? `<div><i class="fa-solid fa-phone" style="color: var(--accent-primary); font-size:0.75rem;"></i> ${escapeHtml(c.phone)}</div>` : ''}
            ${c.email ? `<div style="color: var(--text-secondary); font-size:0.75rem;"><i class="fa-solid fa-envelope" style="font-size:0.75rem;"></i> ${escapeHtml(c.email)}</div>` : ''}
            ${c.address ? `<div style="color: var(--text-muted); font-size:0.72rem;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(c.address)}</div>` : ''}
          </div>
        </td>
        <td>
          <strong style="font-size: 0.98rem; color: #10b981;">${window.formatFCFA(metrics.totalRevenue)}</strong>
          <span style="display:block; font-size:0.75rem; color:var(--text-muted);">${metrics.totalInvoices} facture(s)</span>
        </td>
        <td>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">${formattedLastDate}</span>
          ${metrics.pendingAmount > 0 ? `<span style="display:block; font-size:0.72rem; color:var(--warning); font-weight:600;">Encours: ${window.formatFCFA(metrics.pendingAmount)}</span>` : ''}
        </td>
        <td>
          <div style="display: flex; gap: 0.3rem; align-items: center;">
            <button class="btn-primary" style="padding: 0.28rem 0.55rem; font-size: 0.76rem;" onclick="createInvoiceForClient('${c.id}')" title="Créer une nouvelle facture pour ce client">
              <i class="fa-solid fa-file-circle-plus"></i> Facture
            </button>
            <button class="btn-success" style="padding: 0.28rem 0.55rem; font-size: 0.76rem; background: #25D366; border-color: #25D366;" onclick="openWhatsAppForClient('${c.id}')" title="Contacter le client sur WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
            <button class="btn-secondary" style="padding: 0.28rem 0.55rem; font-size: 0.76rem;" onclick="openClientDetailModal('${c.id}')" title="Voir la fiche détaillée & l'historique">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn-secondary" style="padding: 0.28rem 0.5rem; font-size: 0.76rem; border-color: var(--info); color: var(--info);" onclick="openClientModal('${c.id}')" title="Éditer les informations du client">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            ${isAdmin ? `
              <button class="btn-secondary" style="padding: 0.28rem 0.5rem; font-size: 0.76rem; color: var(--danger); border-color: var(--danger);" onclick="deleteClientWithConfirm('${c.id}')" title="Supprimer le client">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openClientModal(clientId = '') {
  const form = document.getElementById('client-form');
  if (form) form.reset();

  document.getElementById('client-edit-id').value = '';

  if (clientId) {
    const c = window.store.getClientById(clientId);
    if (!c) return;

    document.getElementById('client-modal-title').textContent = `Éditer le Client : ${c.name}`;
    document.getElementById('client-edit-id').value = c.id;
    document.getElementById('client-code').value = c.code || '';
    document.getElementById('client-name').value = c.name || '';
    document.getElementById('client-type').value = c.type || 'COMPANY';
    document.getElementById('client-contact').value = c.contactName || '';
    document.getElementById('client-phone').value = c.phone || '';
    document.getElementById('client-email').value = c.email || '';
    document.getElementById('client-address').value = c.address || '';
    document.getElementById('client-taxid').value = c.taxId || '';
    document.getElementById('client-category').value = c.category || 'Client Régulier';
    document.getElementById('client-notes').value = c.notes || '';
  } else {
    document.getElementById('client-modal-title').textContent = 'Nouveau Client - Portefeuille 2M GLOBAL SERVICES';
    const clients = window.store.getClients();
    document.getElementById('client-code').value = `CLI-${String(clients.length + 1).padStart(3, '0')}`;
  }

  openModal('modal-client');
}

function handleClientFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('client-edit-id').value;
  const code = document.getElementById('client-code').value.trim();
  const name = document.getElementById('client-name').value.trim();
  const type = document.getElementById('client-type').value;
  const contactName = document.getElementById('client-contact').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  const email = document.getElementById('client-email').value.trim();
  const address = document.getElementById('client-address').value.trim();
  const taxId = document.getElementById('client-taxid').value.trim();
  const category = document.getElementById('client-category').value;
  const notes = document.getElementById('client-notes').value.trim();

  try {
    const saved = window.store.saveClient({
      id,
      code,
      name,
      type,
      contactName,
      phone,
      email,
      address,
      taxId,
      category,
      notes
    });

    showToast(`Client ${saved.name} enregistré dans le portefeuille avec succès !`, 'success');
    closeModal('modal-client');
    renderClients();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function deleteClientWithConfirm(clientId) {
  if (!window.store.isAdmin()) {
    showToast('ACCÈS REFUSÉ : Seul l\'Administrateur Général peut supprimer un client.', 'danger');
    return;
  }

  const c = window.store.getClientById(clientId);
  if (!c) return;

  if (confirm(`Confirmer la suppression du client "${c.name}" du portefeuille ?`)) {
    try {
      window.store.deleteClient(clientId);
      showToast(`Client ${c.name} supprimé du portefeuille.`, 'info');
      renderClients();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

function openClientDetailModal(clientId) {
  const c = window.store.getClientById(clientId);
  if (!c) return;

  const metrics = window.store.getClientMetrics(c.id);
  const invoices = window.store.getClientInvoices(c.id);

  const container = document.getElementById('client-detail-content');
  if (!container) return;

  const isCompany = c.type === 'COMPANY';
  const typeBadge = isCompany ?
    '<span class="badge badge-primary"><i class="fa-solid fa-building"></i> Entreprise / Société</span>' :
    '<span class="badge badge-info"><i class="fa-solid fa-user"></i> Particulier</span>';

  const invoiceRows = invoices.length > 0 ? invoices.map(inv => {
    const formattedDate = new Date(inv.date).toLocaleDateString('fr-FR');
    const isProforma = inv.type === 'PROFORMA';
    const isService = inv.type === 'SERVICE';
    const typeLabel = isProforma ? 'PROFORMA' : (isService ? 'PRESTATION' : 'FACTURE');

    return `
      <tr>
        <td><strong style="color: var(--accent-primary); cursor: pointer;" onclick="viewInvoiceDetail('${inv.id}')">${escapeHtml(inv.number)}</strong></td>
        <td><span class="badge ${isProforma ? 'badge-info' : 'badge-success'}">${typeLabel}</span></td>
        <td>${formattedDate}</td>
        <td><strong>${window.formatFCFA(inv.totalAmount)}</strong></td>
        <td>${inv.status === 'PAID' ? '<span class="badge badge-success">Payée</span>' : '<span class="badge badge-warning">En attente</span>'}</td>
        <td>
          <div style="display: flex; gap: 0.3rem;">
            <button class="btn-secondary" style="padding: 0.2rem 0.45rem; font-size: 0.74rem;" onclick="viewInvoiceDetail('${inv.id}')">
              <i class="fa-solid fa-print"></i> Aperçu
            </button>
            <button class="btn-success" style="padding: 0.2rem 0.45rem; font-size: 0.74rem; background:#25D366; border-color:#25D366;" onclick="openWhatsAppModal('${inv.id}')">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('') : `
    <tr>
      <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
        Aucune facture ni devis proforma généré pour ce client.
      </td>
    </tr>
  `;

  container.innerHTML = `
    <!-- Header Profile Brief -->
    <div style="background: var(--bg-tertiary); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; border-left: 4px solid var(--accent-primary);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <h2 style="font-size: 1.35rem; color: var(--text-primary);">${escapeHtml(c.name)}</h2>
            ${typeBadge}
          </div>
          <span style="font-family: monospace; font-size: 0.85rem; color: var(--accent-primary); font-weight: 700;">Code Client: ${escapeHtml(c.code)}</span>
          ${c.taxId ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">${escapeHtml(c.taxId)}</p>` : ''}
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-primary" onclick="createInvoiceForClient('${c.id}')">
            <i class="fa-solid fa-plus"></i> Émettre Facture
          </button>
          <button class="btn-success" style="background: #25D366; border-color: #25D366;" onclick="openWhatsAppForClient('${c.id}')">
            <i class="fa-brands fa-whatsapp"></i> WhatsApp
          </button>
        </div>
      </div>
    </div>

    <!-- Contact & Stats Grid -->
    <div class="kpi-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 1.25rem;">
      <div class="card" style="padding: 1rem;">
        <h4 style="font-size: 0.88rem; color: var(--accent-primary); margin-bottom: 0.75rem;"><i class="fa-solid fa-address-card"></i> Coordonnées & Contact</h4>
        <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.4rem;">
          <div><strong>Personne de contact :</strong> ${escapeHtml(c.contactName || c.name)}</div>
          <div><strong>Téléphone :</strong> ${escapeHtml(c.phone || 'Non renseigné')}</div>
          <div><strong>Email :</strong> ${escapeHtml(c.email || 'Non renseigné')}</div>
          <div><strong>Adresse géographique :</strong> ${escapeHtml(c.address || 'Non renseignée')}</div>
          <div><strong>Catégorie commerciale :</strong> <span class="badge badge-secondary">${escapeHtml(c.category || 'Client Régulier')}</span></div>
        </div>
      </div>

      <div class="card" style="padding: 1rem;">
        <h4 style="font-size: 0.88rem; color: #10b981; margin-bottom: 0.75rem;"><i class="fa-solid fa-chart-line"></i> Indicateurs d'Achats & Volume</h4>
        <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.4rem;">
          <div><strong>Chiffre d'Affaires Total :</strong> <strong style="color: #10b981; font-size: 1.05rem;">${window.formatFCFA(metrics.totalRevenue)}</strong></div>
          <div><strong>Documents Générés :</strong> ${metrics.totalInvoices} facture(s) / proforma(s)</div>
          <div><strong>Factures en attente :</strong> <strong style="color: var(--warning);">${window.formatFCFA(metrics.pendingAmount)}</strong></div>
          <div><strong>Dernier achat effectué :</strong> ${metrics.lastPurchaseDate ? new Date(metrics.lastPurchaseDate).toLocaleDateString('fr-FR') : 'Aucun'}</div>
        </div>
      </div>
    </div>

    ${c.notes ? `
      <div style="background: var(--bg-card); padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; font-size: 0.82rem; border: 1px solid var(--border-color);">
        <strong>Remarques & Préférences du client :</strong> ${escapeHtml(c.notes)}
      </div>
    ` : ''}

    <!-- Invoices History Table -->
    <div class="card" style="padding: 0;">
      <div class="card-header" style="padding: 0.85rem 1rem;">
        <h4 style="font-size: 0.95rem; color: var(--text-primary);"><i class="fa-solid fa-file-invoice"></i> Historique des Factures & Devis de ce Client</h4>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>N° Document</th>
              <th>Type</th>
              <th>Date</th>
              <th>Montant Total TTC</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceRows}
          </tbody>
        </table>
      </div>
    </div>
  `;

  openModal('modal-client-detail');
}

function createInvoiceForClient(clientId) {
  const c = window.store.getClientById(clientId);
  if (!c) return;

  closeModal('modal-client-detail');
  openNewInvoiceModal('DEFINITIVE');

  const clientInput = document.getElementById('inv-client-name');
  if (clientInput) clientInput.value = c.name;

  const phoneInput = document.getElementById('inv-client-phone');
  if (phoneInput) phoneInput.value = c.phone || '';

  const taxInput = document.getElementById('inv-client-taxid');
  if (taxInput) taxInput.value = c.taxId || '';
}

function openWhatsAppForClient(clientId) {
  const c = window.store.getClientById(clientId);
  if (!c || !c.phone) {
    showToast('Numéro de téléphone du client non disponible.', 'warning');
    return;
  }

  const invoices = window.store.getClientInvoices(c.id);
  if (invoices.length > 0) {
    openWhatsAppModal(invoices[0].id);
  } else {
    const rawPhone = c.phone.replace(/[^\d+]/g, '');
    const cleanPhone = rawPhone.startsWith('+') ? rawPhone.substring(1) : (rawPhone.startsWith('00') ? rawPhone.substring(2) : '221' + rawPhone);
    const settings = window.store.getSettings();
    const msg = encodeURIComponent(`Bonjour ${c.name},\n\nNous vous contactons de la part de *${settings.companyName || '2M GLOBAL SERVICES'}*. Comment pouvons-nous vous aider aujourd'hui ?`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }
}

window.renderClients = renderClients;
window.openClientModal = openClientModal;
window.handleClientFormSubmit = handleClientFormSubmit;
window.deleteClientWithConfirm = deleteClientWithConfirm;
window.openClientDetailModal = openClientDetailModal;
window.createInvoiceForClient = createInvoiceForClient;
window.openWhatsAppForClient = openWhatsAppForClient;
