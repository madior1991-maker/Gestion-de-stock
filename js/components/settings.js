/**
 * StockManager Pro v2 - Settings & User Account Management (RBAC & Role Editing Modal)
 */

function renderSettings() {
  const settings = window.store.getSettings();

  // Company fields
  const companyNameEl = document.getElementById('set-company-name');
  const companyAddressEl = document.getElementById('set-company-address');
  const companyPhoneEl = document.getElementById('set-company-phone');
  const companyEmailEl = document.getElementById('set-company-email');
  const companyTaxIdEl = document.getElementById('set-company-taxid');

  if (companyNameEl) companyNameEl.value = settings.companyName || '2M GLOBAL SERVICES';
  if (companyAddressEl) companyAddressEl.value = settings.companyAddress || 'LIBERTE O1 VILLA N• 1336';
  if (companyPhoneEl) companyPhoneEl.value = settings.companyPhone || '76-192-34-41';
  if (companyEmailEl) companyEmailEl.value = settings.companyEmail || '2mglobalservices11@gmail.COM';
  if (companyTaxIdEl) companyTaxIdEl.value = settings.companyTaxId || 'N.I.N.E.A: 012457695 - SN.DKR.2025.A.35597 - 35529/2025/RCCM/RA';

  // Options fields
  const currencyEl = document.getElementById('set-currency');
  const vatRateEl = document.getElementById('set-vat-rate');
  const invPrefixEl = document.getElementById('set-inv-prefix');
  const proPrefixEl = document.getElementById('set-pro-prefix');
  const poPrefixEl = document.getElementById('set-po-prefix');

  if (currencyEl) currencyEl.value = settings.currency || 'FCFA';
  if (vatRateEl) vatRateEl.value = settings.defaultVatRate || 18;
  if (invPrefixEl) invPrefixEl.value = settings.invoicePrefix || 'FAC-';
  if (proPrefixEl) proPrefixEl.value = settings.proformaPrefix || 'PRO-';
  if (poPrefixEl) poPrefixEl.value = settings.poPrefix || 'BC-';

  // Advanced policy options
  const showQrCodeEl = document.getElementById('set-show-qrcode');
  const allowNegativeEl = document.getElementById('set-allow-negative');

  if (showQrCodeEl) showQrCodeEl.checked = settings.showQrCode !== false;
  if (allowNegativeEl) allowNegativeEl.checked = !!settings.allowNegativeStock;

  // Electronic Stamp Preview
  renderStampPreview(settings.companyStamp);

  // Render User Accounts List Table
  renderUserAccountsTable();
}

function handleStampFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Veuillez sélectionner un fichier image valide.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    const base64Img = event.target.result;
    window.store.saveSettings({ companyStamp: base64Img });
    renderStampPreview(base64Img);
    showToast('Cachet électronique enregistré avec succès !', 'success');
  };
  reader.readAsDataURL(file);
}

function renderStampPreview(stampDataUrl) {
  const container = document.getElementById('stamp-preview');
  if (!container) return;

  if (stampDataUrl) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem; background: var(--bg-card); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <img src="${stampDataUrl}" alt="Cachet Électronique" style="height: 65px; max-width: 140px; object-fit: contain; background: #fff; padding: 4px; border-radius: 4px;">
        <div>
          <span style="color: var(--success); font-weight: 700; font-size: 0.85rem;"><i class="fa-solid fa-circle-check"></i> Cachet Électronique Enregistré</span>
          <p style="font-size: 0.75rem; color: var(--text-muted);">S'insère automatiquement sur les factures et bons de commande.</p>
          <button type="button" class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; margin-top: 0.35rem; color: var(--danger);" onclick="deleteStampImage()">
            <i class="fa-solid fa-trash"></i> Supprimer
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <span style="font-size: 0.8rem; color: var(--text-muted);">Aucun cachet électronique configuré.</span>
    `;
  }
}

function deleteStampImage() {
  if (confirm('Supprimer le cachet électronique de l\'entreprise ?')) {
    window.store.saveSettings({ companyStamp: '' });
    renderStampPreview('');
    showToast('Cachet électronique supprimé.', 'info');
  }
}

function renderUserAccountsTable() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  const users = window.store.getUsers();
  const isAdmin = window.store.isAdmin();

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          Aucun utilisateur configuré dans le système.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map(u => {
    let roleBadge = '';
    if (u.role === 'ADMIN') roleBadge = '<span class="badge badge-primary" style="background: linear-gradient(135deg, #0284c7, #0369a1); color:#fff; font-weight: 700;"><i class="fa-solid fa-crown"></i> Administrateur Général</span>';
    else if (u.role === 'MAGASINIER') roleBadge = '<span class="badge badge-info" style="font-weight: 600;"><i class="fa-solid fa-box"></i> Magasinier / Stock</span>';
    else roleBadge = '<span class="badge badge-secondary" style="font-weight: 600;"><i class="fa-solid fa-user-tag"></i> Vendeur / Commercial</span>';

    const permissionsText = u.role === 'ADMIN' ?
      '<span style="color: var(--success); font-weight: 600;"><i class="fa-solid fa-shield-check"></i> Accès Total & Modification Factures</span>' :
      (u.role === 'MAGASINIER' ?
        '<span style="color: var(--info);"><i class="fa-solid fa-boxes-stacked"></i> Mouvements Stock & Réceptions BC</span>' :
        '<span style="color: var(--text-secondary);"><i class="fa-solid fa-file-invoice"></i> Émission de Factures & Proformas</span>');

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div class="user-avatar" style="background: ${u.role === 'ADMIN' ? 'linear-gradient(135deg, #0284c7, #f97316)' : 'var(--bg-tertiary)'}; font-size: 0.75rem;">
              ${u.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <strong style="color: var(--text-primary); font-size: 0.9rem;">${escapeHtml(u.name)}</strong>
              <span style="display:block; font-size:0.75rem; color:var(--text-muted);">${escapeHtml(u.email)}</span>
            </div>
          </div>
        </td>
        <td>${roleBadge}</td>
        <td>${permissionsText}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            ${isAdmin ? `
              <button class="btn-secondary" style="padding: 0.28rem 0.6rem; font-size: 0.78rem; border-color: var(--accent-primary); color: var(--accent-primary);" onclick="openEditUserModal('${u.id}')">
                <i class="fa-solid fa-user-pen"></i> Modifier le Rôle
              </button>
              ${users.length > 1 ? `
                <button class="btn-secondary" style="padding: 0.28rem 0.5rem; font-size: 0.78rem; color: var(--danger);" onclick="deleteUserWithConfirm('${u.id}')" title="Supprimer cet utilisateur">
                  <i class="fa-solid fa-trash"></i>
                </button>
              ` : ''}
            ` : `
              <span style="font-size: 0.75rem; color: var(--text-muted); opacity: 0.6;">
                <i class="fa-solid fa-lock"></i> Réservé Admin
              </span>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openEditUserModal(userId = '') {
  if (!window.store.isAdmin()) {
    showToast('ACCÈS REFUSÉ : Seul l\'Administrateur Général est autorisé à gérer ou modifier les rôles.', 'danger');
    return;
  }

  const form = document.getElementById('user-edit-form');
  if (form) form.reset();

  document.getElementById('user-edit-id').value = '';

  if (userId) {
    const users = window.store.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('user-edit-modal-title').textContent = `Modifier le Rôle de : ${user.name}`;
    document.getElementById('user-edit-id').value = user.id;
    document.getElementById('user-edit-name').value = user.name || '';
    document.getElementById('user-edit-email').value = user.email || '';
    document.getElementById('user-edit-role').value = user.role || 'VENDEUR';
  } else {
    document.getElementById('user-edit-modal-title').textContent = 'Nouveau Compte Utilisateur & Attribution de Rôle';
    document.getElementById('user-edit-name').value = '';
    document.getElementById('user-edit-email').value = '';
    document.getElementById('user-edit-role').value = 'VENDEUR';
  }

  openModal('modal-user-edit');
}

function handleUserFormSubmit(e) {
  e.preventDefault();

  if (!window.store.isAdmin()) {
    showToast('ACCÈS REFUSÉ : Seul l\'Administrateur Général peut enregistrer les rôles.', 'danger');
    return;
  }

  const id = document.getElementById('user-edit-id').value;
  const name = document.getElementById('user-edit-name').value.trim();
  const email = document.getElementById('user-edit-email').value.trim();
  const role = document.getElementById('user-edit-role').value;

  try {
    window.store.saveUser({
      id: id || undefined,
      name,
      email,
      role
    });

    const roleLabels = {
      'ADMIN': 'Administrateur Général',
      'MAGASINIER': 'Magasinier / Gestionnaire de Stock',
      'VENDEUR': 'Vendeur / Commercial'
    };

    showToast(`Utilisateur "${name}" enregistré avec le rôle : ${roleLabels[role]} !`, 'success');
    closeModal('modal-user-edit');
    renderUserAccountsTable();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function deleteUserWithConfirm(userId) {
  if (!window.store.isAdmin()) {
    showToast('ACCÈS REFUSÉ : Seul l\'Administrateur Général peut supprimer un utilisateur.', 'danger');
    return;
  }

  const users = window.store.getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;

  if (confirm(`Confirmer la suppression du compte de "${user.name}" (${user.email}) ?`)) {
    try {
      window.store.deleteUser(userId);
      showToast(`Compte utilisateur "${user.name}" supprimé.`, 'info');
      renderUserAccountsTable();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

function handleSettingsSubmit(e) {
  e.preventDefault();

  const companyName = document.getElementById('set-company-name').value.trim();
  const companyAddress = document.getElementById('set-company-address').value.trim();
  const companyPhone = document.getElementById('set-company-phone').value.trim();
  const companyEmail = document.getElementById('set-company-email').value.trim();
  const companyTaxId = document.getElementById('set-company-taxid').value.trim();

  const currency = document.getElementById('set-currency').value.trim() || 'FCFA';
  const defaultVatRate = parseFloat(document.getElementById('set-vat-rate').value) || 0;
  const invoicePrefix = document.getElementById('set-inv-prefix').value.trim() || 'FAC-';
  const proformaPrefix = document.getElementById('set-pro-prefix').value.trim() || 'PRO-';
  const poPrefix = document.getElementById('set-po-prefix').value.trim() || 'BC-';

  const showQrCode = document.getElementById('set-show-qrcode') ? document.getElementById('set-show-qrcode').checked : true;
  const allowNegativeStock = document.getElementById('set-allow-negative') ? document.getElementById('set-allow-negative').checked : false;

  const invoiceFooterLine1 = `2M GLOBAL SERVICES - ${companyTaxId}`;
  const invoiceFooterLine2 = `Adresse: ${companyAddress} - 📧 E-MAIL: ${companyEmail} - ☎️ Tél: ${companyPhone}`;

  try {
    window.store.saveSettings({
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      companyTaxId,
      currency,
      defaultVatRate,
      invoicePrefix,
      proformaPrefix,
      poPrefix,
      showQrCode,
      allowNegativeStock,
      invoiceFooterLine1,
      invoiceFooterLine2
    });

    showToast('Paramètres 2M GLOBAL SERVICES enregistrés avec succès !', 'success');

    if (window.renderDashboard) window.renderDashboard();
    if (window.renderInvoices) window.renderInvoices();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function openAddUserModal() {
  openEditUserModal();
}

window.renderSettings = renderSettings;
window.handleStampFileUpload = handleStampFileUpload;
window.deleteStampImage = deleteStampImage;
window.handleSettingsSubmit = handleSettingsSubmit;
window.openAddUserModal = openAddUserModal;
window.openEditUserModal = openEditUserModal;
window.handleUserFormSubmit = handleUserFormSubmit;
window.deleteUserWithConfirm = deleteUserWithConfirm;
