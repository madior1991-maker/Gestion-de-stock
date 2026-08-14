/**
 * StockManager Pro v2 - Invoices Component (Single-Page A4 Invoice Layout, Proforma, Definitive & Service Provider Invoices)
 */

let invoiceItemsCount = 0;
let currentInvoiceFilter = 'ALL';

function filterInvoiceList(typeFilter) {
  currentInvoiceFilter = typeFilter;

  const buttons = document.querySelectorAll('.inv-filter-btn');
  buttons.forEach(btn => {
    if (btn.dataset.filter === typeFilter) {
      btn.classList.add('active');
      btn.style.background = 'var(--accent-primary)';
      btn.style.color = '#ffffff';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'var(--bg-tertiary)';
      btn.style.color = 'var(--text-secondary)';
    }
  });

  renderInvoices();
}

function renderInvoices() {
  let invoices = window.store.getInvoices();
  const isAdmin = window.store.isAdmin();
  const tbody = document.getElementById('invoices-table-body');
  if (!tbody) return;

  if (currentInvoiceFilter !== 'ALL') {
    invoices = invoices.filter(inv => inv.type === currentInvoiceFilter);
  }

  if (invoices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <i class="fa-solid fa-receipt" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
          Aucune facture ne correspond au filtre sélectionné.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = invoices.map(inv => {
    const formattedDate = new Date(inv.date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const isProforma = inv.type === 'PROFORMA';
    const isService = inv.type === 'SERVICE';

    let typeBadge = '';
    if (isProforma) {
      typeBadge = '<span class="badge badge-info" style="border: 1px solid var(--info);"><i class="fa-solid fa-file-lines"></i> PROFORMA</span>';
    } else if (isService) {
      typeBadge = '<span class="badge badge-primary" style="background: linear-gradient(135deg, #0284c7, #0369a1); color:#fff;"><i class="fa-solid fa-briefcase"></i> PRESTATION</span>';
    } else {
      typeBadge = '<span class="badge badge-success" style="border: 1px solid var(--success);"><i class="fa-solid fa-file-invoice"></i> DÉFINITIVE</span>';
    }

    // Status Badge
    let statusBadge = '';
    if (isProforma) {
      if (inv.status === 'CONVERTED') {
        statusBadge = '<span class="badge badge-secondary"><i class="fa-solid fa-check-double"></i> Convertie</span>';
      } else {
        statusBadge = '<span class="badge badge-info"><i class="fa-solid fa-file-lines"></i> Offre Proforma</span>';
      }
    } else {
      if (inv.status === 'PAID') statusBadge = '<span class="badge badge-success"><span class="badge-dot"></span>Payée</span>';
      else if (inv.status === 'PENDING') statusBadge = '<span class="badge badge-warning"><span class="badge-dot"></span>En attente</span>';
      else if (inv.status === 'CANCELLED') statusBadge = '<span class="badge badge-danger"><span class="badge-dot"></span>Annulée</span>';
      else statusBadge = '<span class="badge badge-success"><span class="badge-dot"></span>Payée</span>';
    }

    // Admin Editing Check
    let editBtnHtml = '';
    if (isAdmin) {
      editBtnHtml = `
        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; border-color: var(--info); color: var(--info);" onclick="openEditInvoiceModal('${inv.id}')" title="Modifier ce document (Réservé Admin Général)">
          <i class="fa-solid fa-pen-to-square"></i> Éditer
        </button>
      `;
    } else {
      editBtnHtml = `
        <span style="font-size: 0.72rem; color: var(--text-muted); opacity: 0.5; align-self: center;" title="Modification verrouillée : Réservée à l'Administrateur Général">
          <i class="fa-solid fa-lock"></i>
        </span>
      `;
    }

    const paymentDisplay = isProforma ?
      '<span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">— Offre Proforma</span>' :
      `<span class="badge badge-secondary"><i class="fa-solid fa-credit-card" style="font-size:0.7rem;"></i> ${escapeHtml(inv.paymentMethod || 'Virement bancaire')}</span>`;

    return `
      <tr>
        <td>
          <strong style="color: var(--accent-primary); cursor: pointer;" onclick="viewInvoiceDetail('${inv.id}')">${escapeHtml(inv.number)}</strong>
          ${inv.convertedFrom ? `<span style="display:block; font-size:0.72rem; color:var(--text-muted);">Ex: ${escapeHtml(inv.convertedFrom)}</span>` : ''}
        </td>
        <td>${typeBadge}</td>
        <td>${formattedDate}</td>
        <td>
          <strong style="color: var(--text-primary);">${escapeHtml(inv.clientName)}</strong>
          ${inv.clientPhone ? `<span style="display:block; font-size:0.75rem; color:var(--text-muted);">${escapeHtml(inv.clientPhone)}</span>` : ''}
        </td>
        <td>${paymentDisplay}</td>
        <td><strong style="font-size: 1.05rem; color: var(--text-primary);">${window.formatFCFA(inv.totalAmount)}</strong></td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            ${isProforma && inv.status !== 'CONVERTED' ? `
              <button class="btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; background: linear-gradient(135deg, #10b981, #059669);" onclick="convertProformaToDefinitiveWithConfirm('${inv.id}')" title="Convertir en facture définitive">
                <i class="fa-solid fa-arrow-right-arrow-left"></i> Convertir
              </button>
            ` : ''}
            ${editBtnHtml}
            <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="viewInvoiceDetail('${inv.id}')">
              <i class="fa-solid fa-print"></i> Aperçu
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openNewInvoiceModal(defaultType = 'DEFINITIVE') {
  const form = document.getElementById('invoice-form');
  if (form) form.reset();

  const container = document.getElementById('invoice-items-rows');
  if (container) container.innerHTML = '';
  invoiceItemsCount = 0;

  document.getElementById('editing-invoice-id').value = '';

  const modalTitleMap = {
    'DEFINITIVE': 'Nouvelle Facture Définitive (Vente d\'Articles)',
    'PROFORMA': 'Nouvelle Facture Proforma (Devis Commercial)',
    'SERVICE': 'Nouvelle Facture de Prestation de Services (Honoraires & Travaux)'
  };

  document.getElementById('invoice-modal-title').textContent = modalTitleMap[defaultType] || 'Nouvelle Facture';
  document.getElementById('inv-submit-btn').innerHTML = `<i class="fa-solid fa-check-double"></i> Générer le Document`;

  const typeSelect = document.getElementById('inv-type-select');
  if (typeSelect) {
    typeSelect.value = defaultType;
    onInvoiceTypeChange(defaultType);
  }

  const paymentSelect = document.getElementById('inv-payment-method');
  if (paymentSelect) {
    paymentSelect.value = defaultType === 'SERVICE' ? 'Virement bancaire' : 'Espèces';
    onPaymentMethodChange(paymentSelect.value);
  }

  const clientInput = document.getElementById('inv-client-name');
  if (clientInput) clientInput.value = 'Client Passage';

  const dueDateInput = document.getElementById('inv-due-date');
  if (dueDateInput) {
    const defaultDue = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    dueDateInput.value = defaultDue;
  }

  const vatInput = document.getElementById('inv-vat-rate');
  const settings = window.store.getSettings();
  if (vatInput) vatInput.value = settings.defaultVatRate || 18;

  addInvoiceItemRow();

  openModal('modal-invoice-create');
}

function onPaymentMethodChange(val) {
  const otherInput = document.getElementById('inv-payment-other');
  if (otherInput) {
    if (val === 'Autre') {
      otherInput.style.display = 'block';
      otherInput.required = true;
    } else {
      otherInput.style.display = 'none';
      otherInput.required = false;
      otherInput.value = '';
    }
  }
}

function openEditInvoiceModal(invoiceId) {
  if (!window.store.isAdmin()) {
    showToast('ACCÈS REFUSÉ : Seul l\'Administrateur Général est autorisé à modifier une facture.', 'danger');
    return;
  }

  const inv = window.store.getInvoiceById(invoiceId);
  if (!inv) return;

  const form = document.getElementById('invoice-form');
  if (form) form.reset();

  const container = document.getElementById('invoice-items-rows');
  if (container) container.innerHTML = '';
  invoiceItemsCount = 0;

  document.getElementById('editing-invoice-id').value = inv.id;

  const modalTitle = `Éditer la Facture #${inv.number} (Mode Admin Général)`;

  document.getElementById('invoice-modal-title').textContent = modalTitle;
  document.getElementById('inv-submit-btn').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Enregistrer les Modifications (Admin)`;

  const type = inv.type || 'DEFINITIVE';
  document.getElementById('inv-type-select').value = type;
  onInvoiceTypeChange(type);

  document.getElementById('inv-client-name').value = inv.clientName || '';
  document.getElementById('inv-client-phone').value = inv.clientPhone || '';
  document.getElementById('inv-client-taxid').value = inv.clientTaxId || '';

  const knownMethods = ['Espèces', 'Wave', 'Orange Money', 'Chèque', 'Virement bancaire'];
  const pMethod = inv.paymentMethod || 'Virement bancaire';
  if (knownMethods.includes(pMethod)) {
    document.getElementById('inv-payment-method').value = pMethod;
    onPaymentMethodChange(pMethod);
  } else {
    document.getElementById('inv-payment-method').value = 'Autre';
    onPaymentMethodChange('Autre');
    document.getElementById('inv-payment-other').value = pMethod;
  }

  const dueDateInput = document.getElementById('inv-due-date');
  if (dueDateInput) dueDateInput.value = inv.dueDate ? inv.dueDate.split('T')[0] : '';
  
  const statusSelect = document.getElementById('inv-status-select');
  if (statusSelect) statusSelect.value = inv.status || 'PAID';

  document.getElementById('inv-notes').value = inv.notes || '';

  document.getElementById('inv-discount').value = inv.discountAmount || 0;
  document.getElementById('inv-vat-rate').value = inv.vatRate || 18;
  document.getElementById('inv-custom-total').value = inv.totalAmount;

  if (inv.items && inv.items.length > 0) {
    inv.items.forEach(item => {
      addInvoiceItemRow(item.productId || '', item.quantity, item.unitPrice, item.productName || '');
    });
  } else {
    addInvoiceItemRow();
  }

  openModal('modal-invoice-create');
}

function onInvoiceTypeChange(type) {
  const isProforma = type === 'PROFORMA';
  const isService = type === 'SERVICE';

  const helpText = document.getElementById('inv-type-helptext');
  const paymentGroup = document.getElementById('inv-payment-group');
  const dueDateGroup = document.getElementById('inv-due-date-group');
  const statusGroup = document.getElementById('inv-status-group');

  if (helpText) {
    helpText.style.display = 'block';
    if (isProforma) {
      helpText.innerHTML = `<i class="fa-solid fa-circle-info"></i> <strong>Proforma (Devis) :</strong> Offre de prix sans engagement commercial. Pas d'échéance ni de statut de règlement.`;
    } else if (isService) {
      helpText.innerHTML = `<i class="fa-solid fa-briefcase"></i> <strong>Prestation de Services :</strong> Saisie libre des travaux, honoraires et prestations réalisés sans déduction de stock physique.`;
    } else {
      helpText.innerHTML = `<i class="fa-solid fa-check-circle"></i> <strong>Facture Définitive :</strong> Vente commerciale réelle avec sélection du règlement & déduction automatique de stock.`;
    }
  }

  // Payment Method, Due Date & Payment Status Visibility
  if (paymentGroup) {
    paymentGroup.style.display = isProforma ? 'none' : 'block';
    const paymentSelect = document.getElementById('inv-payment-method');
    if (paymentSelect) paymentSelect.required = !isProforma;
  }

  if (dueDateGroup) {
    dueDateGroup.style.display = isProforma ? 'none' : 'block';
  }

  if (statusGroup) {
    statusGroup.style.display = isProforma ? 'none' : 'block';
  }

  // Re-render items rows if switching type
  const container = document.getElementById('invoice-items-rows');
  if (container && container.children.length > 0) {
    const existingRows = Array.from(container.children);
    const savedItems = existingRows.map(r => {
      const prodSelect = r.querySelector('.inv-prod-select');
      const serviceInput = r.querySelector('.inv-service-name');
      const qtyInput = r.querySelector('.inv-qty-input');
      const priceInput = r.querySelector('.inv-price-input');
      return {
        productId: prodSelect ? prodSelect.value : '',
        serviceName: serviceInput ? serviceInput.value : '',
        quantity: parseInt(qtyInput?.value, 10) || 1,
        price: parseFloat(priceInput?.value) || 0
      };
    });

    container.innerHTML = '';
    invoiceItemsCount = 0;
    savedItems.forEach(item => {
      addInvoiceItemRow(item.productId, item.quantity, item.price, item.serviceName);
    });
  }
}

function addInvoiceItemRow(prefillProductId = '', prefillQty = 1, prefillPrice = 0, prefillServiceName = '') {
  const container = document.getElementById('invoice-items-rows');
  if (!container) return;

  const currentType = document.getElementById('inv-type-select')?.value || 'DEFINITIVE';
  const isService = currentType === 'SERVICE';
  const products = window.store.getProducts();

  invoiceItemsCount++;
  const rowId = `inv-row-${invoiceItemsCount}`;

  const row = document.createElement('div');
  row.className = 'form-grid';
  row.id = rowId;
  row.style.gridTemplateColumns = '2.2fr 0.8fr 1fr 1fr 40px';
  row.style.alignItems = 'end';
  row.style.marginBottom = '0.5rem';

  let itemSelectorHtml = '';
  if (isService) {
    // Freeform text input for Service Invoices ("renseigner moi-même")
    itemSelectorHtml = `
      <input type="text" class="form-control inv-service-name" placeholder="Ex: Audit réseau, Maintenance, Honoraires..." value="${escapeHtml(prefillServiceName)}" required oninput="calculateInvoiceTotals()">
    `;
  } else {
    // Product selector for Stock Invoices
    const productOptions = `<option value="">Sélectionner un produit...</option>` +
      products.map(p => `<option value="${p.id}" ${p.id === prefillProductId ? 'selected' : ''} data-price="${p.sellPrice}" data-stock="${p.quantity}">${escapeHtml(p.name)} (Disp: ${p.quantity}) - ${window.formatFCFA(p.sellPrice)}</option>`).join('');
    
    itemSelectorHtml = `
      <select class="form-control inv-prod-select" onchange="onInvoiceProductChange(this, '${rowId}')" required>
        ${productOptions}
      </select>
    `;
  }

  row.innerHTML = `
    <div class="form-group" style="margin-bottom: 0;">
      <label style="font-size: 0.72rem;">${isService ? 'Désignation de la Prestation / Service *' : 'Produit / Article en Stock *'}</label>
      ${itemSelectorHtml}
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label style="font-size: 0.72rem;">Qté / Unit</label>
      <input type="number" class="form-control inv-qty-input" min="1" value="${prefillQty}" oninput="calculateInvoiceTotals()" required>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label style="font-size: 0.72rem;">Tarif Unitaire HT (FCFA)</label>
      <input type="number" class="form-control inv-price-input" min="0" step="1" value="${prefillPrice || 0}" oninput="calculateInvoiceTotals()" required>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label style="font-size: 0.72rem;">Total HT (FCFA)</label>
      <input type="text" class="form-control inv-row-total" value="0 FCFA" readonly style="background: var(--bg-tertiary);">
    </div>
    <div>
      <button type="button" class="icon-btn" style="color: var(--danger); height: 38px; width: 38px;" onclick="removeInvoiceItemRow('${rowId}')">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;

  container.appendChild(row);
  calculateInvoiceTotals();
}

function removeInvoiceItemRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) row.remove();
  calculateInvoiceTotals();
}

function onInvoiceProductChange(selectEl, rowId) {
  const selectedOpt = selectEl.options[selectEl.selectedIndex];
  const row = document.getElementById(rowId);
  if (!row) return;

  const priceInput = row.querySelector('.inv-price-input');
  if (selectedOpt && selectedOpt.dataset.price) {
    priceInput.value = selectedOpt.dataset.price;
  }

  calculateInvoiceTotals();
}

function calculateInvoiceTotals(source = 'ITEMS') {
  const rows = document.querySelectorAll('#invoice-items-rows .form-grid');
  let subtotal = 0;

  rows.forEach(r => {
    const qty = parseInt(r.querySelector('.inv-qty-input')?.value, 10) || 0;
    const price = parseFloat(r.querySelector('.inv-price-input')?.value) || 0;
    const rowTotal = qty * price;
    subtotal += rowTotal;

    const rowTotalInput = r.querySelector('.inv-row-total');
    if (rowTotalInput) rowTotalInput.value = window.formatFCFA(rowTotal);
  });

  const discountInput = document.getElementById('inv-discount');
  const vatRateInput = document.getElementById('inv-vat-rate');
  const customTotalInput = document.getElementById('inv-custom-total');

  let discount = parseFloat(discountInput?.value) || 0;
  let vatRate = parseFloat(vatRateInput?.value) || 0;

  if (source === 'CUSTOM' && customTotalInput) {
    const customTotal = parseFloat(customTotalInput.value) || 0;
    if (customTotal > 0) {
      const netWithVat = customTotal / (1 + (vatRate / 100));
      discount = Math.max(subtotal - netWithVat, 0);
      if (discountInput) discountInput.value = Math.round(discount);
    }
  }

  let netSubtotal = Math.max(subtotal - discount, 0);
  let vatAmount = netSubtotal * (vatRate / 100);
  let totalAmount = netSubtotal + vatAmount;

  if (source !== 'CUSTOM' && customTotalInput) {
    customTotalInput.value = Math.round(totalAmount);
  }

  const subtotalEl = document.getElementById('inv-summary-subtotal');
  const discountEl = document.getElementById('inv-summary-discount');
  const netEl = document.getElementById('inv-summary-net');
  const vatEl = document.getElementById('inv-summary-vat');
  const totalEl = document.getElementById('inv-summary-total');

  if (subtotalEl) subtotalEl.textContent = window.formatFCFA(subtotal);
  if (discountEl) discountEl.textContent = window.formatFCFA(discount);
  if (netEl) netEl.textContent = window.formatFCFA(netSubtotal);
  if (vatEl) vatEl.textContent = window.formatFCFA(vatAmount);
  if (totalEl) totalEl.textContent = window.formatFCFA(totalAmount);
}

function handleInvoiceSubmit(e) {
  e.preventDefault();

  const editingId = document.getElementById('editing-invoice-id').value;

  if (editingId && !window.store.isAdmin()) {
    showToast('ACCÈS REFUSÉ : Seul l\'Administrateur Général peut modifier une facture.', 'danger');
    return;
  }

  const type = document.getElementById('inv-type-select').value;
  const isProforma = type === 'PROFORMA';
  const isService = type === 'SERVICE';
  const clientName = document.getElementById('inv-client-name').value.trim();
  const clientPhone = document.getElementById('inv-client-phone').value.trim();
  const clientTaxId = document.getElementById('inv-client-taxid').value.trim();
  
  let paymentMethod = '';
  if (!isProforma) {
    paymentMethod = document.getElementById('inv-payment-method').value;
    if (paymentMethod === 'Autre') {
      const otherVal = document.getElementById('inv-payment-other').value.trim();
      paymentMethod = otherVal ? `Autre (${otherVal})` : 'Autre';
    }
  }

  const dueDate = isProforma ? '' : (document.getElementById('inv-due-date')?.value || '');
  const status = isProforma ? 'PENDING' : (document.getElementById('inv-status-select')?.value || 'PAID');
  const notes = document.getElementById('inv-notes').value.trim();

  const discountAmount = parseFloat(document.getElementById('inv-discount').value) || 0;
  const vatRate = parseFloat(document.getElementById('inv-vat-rate').value) || 0;
  const customTotal = parseFloat(document.getElementById('inv-custom-total').value);

  const rows = document.querySelectorAll('#invoice-items-rows .form-grid');
  const items = [];
  let subtotal = 0;

  rows.forEach(r => {
    let productId = '';
    let productName = '';

    if (isService) {
      const serviceInput = r.querySelector('.inv-service-name');
      productName = serviceInput ? serviceInput.value.trim() : 'Prestation de Service';
    } else {
      const select = r.querySelector('.inv-prod-select');
      productId = select ? select.value : '';
      const selectedOpt = select ? select.options[select.selectedIndex] : null;
      productName = selectedOpt ? selectedOpt.text.split(' (Disp:')[0] : '';
    }

    const qty = parseInt(r.querySelector('.inv-qty-input').value, 10) || 0;
    const unitPrice = parseFloat(r.querySelector('.inv-price-input').value) || 0;

    if (productName && qty > 0) {
      const lineTotal = qty * unitPrice;
      subtotal += lineTotal;
      items.push({
        productId,
        productName,
        quantity: qty,
        unitPrice,
        total: lineTotal
      });
    }
  });

  if (items.length === 0) {
    showToast('Veuillez ajouter au moins une prestation ou un produit à la facture.', 'warning');
    return;
  }

  const netSubtotal = Math.max(subtotal - discountAmount, 0);
  const vatAmount = netSubtotal * (vatRate / 100);
  const calculatedTotal = netSubtotal + vatAmount;

  const finalTotalAmount = (!isNaN(customTotal) && customTotal >= 0) ? customTotal : calculatedTotal;

  try {
    let invoice;
    if (editingId) {
      invoice = window.store.updateInvoice(editingId, {
        type,
        clientName,
        clientPhone,
        clientTaxId,
        paymentMethod,
        dueDate,
        items,
        subtotal,
        discountAmount,
        netSubtotal,
        vatRate,
        vatAmount,
        totalAmount: finalTotalAmount,
        notes,
        status
      });
      showToast(`Facture #${invoice.number} modifiée par l'Administrateur Général !`, 'success');
    } else {
      invoice = window.store.createInvoice({
        type,
        clientName,
        clientPhone,
        clientTaxId,
        paymentMethod,
        dueDate,
        items,
        subtotal,
        discountAmount,
        netSubtotal,
        vatRate,
        vatAmount,
        totalAmount: finalTotalAmount,
        notes,
        status
      });
      const typeLabels = {
        'DEFINITIVE': 'Facture Définitive',
        'PROFORMA': 'Facture Proforma',
        'SERVICE': 'Facture de Prestation de Services'
      };
      showToast(`${typeLabels[type]} #${invoice.number} générée avec succès !`, 'success');
    }

    closeModal('modal-invoice-create');

    renderInvoices();
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderProducts) window.renderProducts();
    if (window.renderMovements) window.renderMovements();

    viewInvoiceDetail(invoice.id);
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function convertProformaToDefinitiveWithConfirm(id) {
  const proforma = window.store.getInvoiceById(id);
  if (!proforma) return;

  if (confirm(`Confirmer la conversion de la Proforma #${proforma.number} en Facture Définitive ?`)) {
    try {
      const definitive = window.store.convertProformaToDefinitive(id);
      showToast(`Proforma convertie ! Facture Définitive #${definitive.number} générée.`, 'success');

      renderInvoices();
      if (window.renderDashboard) window.renderDashboard();
      if (window.renderProducts) window.renderProducts();
      if (window.renderMovements) window.renderMovements();
      if (window.renderAlerts) window.renderAlerts();

      viewInvoiceDetail(definitive.id);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

// Display Ultra-Clean 1-Page A4 Invoice Document Template with Official Company Legal Footer & Payment Details
function viewInvoiceDetail(invoiceId) {
  const inv = window.store.getInvoiceById(invoiceId);
  if (!inv) return;

  const isProforma = inv.type === 'PROFORMA';
  const isService = inv.type === 'SERVICE';
  const settings = window.store.getSettings();
  const detailContainer = document.getElementById('printable-invoice-content');
  if (!detailContainer) return;

  const formattedDate = new Date(inv.date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const formattedDueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  }) : 'À réception';

  const amountInWords = window.numberToWordsFR ? window.numberToWordsFR(inv.totalAmount) : window.formatFCFA(inv.totalAmount);

  // Generate QR Code URL for Document Authenticity Check
  const showQr = settings.showQrCode !== false;
  const qrData = encodeURIComponent(`2M GLOBAL SERVICES | Facture #${inv.number} | Client: ${inv.clientName} | Total: ${inv.totalAmount} FCFA | Date: ${formattedDate}`);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${qrData}`;

  const itemRowsHtml = inv.items.map((item, idx) => {
    const prod = item.productId ? window.store.getProductById(item.productId) : null;
    const sku = prod ? prod.sku : (isService ? 'SERV-' + (idx + 1).toString().padStart(2, '0') : 'REF-' + (idx + 1));
    return `
      <tr>
        <td style="padding: 0.4rem; text-align: center; border-bottom: 1px solid var(--border-color);">${idx + 1}</td>
        <td style="padding: 0.4rem; font-family: monospace; font-size: 0.8rem; color: var(--accent-primary); border-bottom: 1px solid var(--border-color);">${escapeHtml(sku)}</td>
        <td style="padding: 0.4rem; border-bottom: 1px solid var(--border-color);"><strong>${escapeHtml(item.productName)}</strong></td>
        <td style="padding: 0.4rem; text-align: center; border-bottom: 1px solid var(--border-color);">${item.quantity}</td>
        <td style="padding: 0.4rem; text-align: right; border-bottom: 1px solid var(--border-color);">${window.formatFCFA(item.unitPrice)}</td>
        <td style="padding: 0.4rem; text-align: right; border-bottom: 1px solid var(--border-color);"><strong>${window.formatFCFA(item.total)}</strong></td>
      </tr>
    `;
  }).join('');

  let stampHtml = '';
  if (settings.companyStamp) {
    stampHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;">
        <img src="${settings.companyStamp}" alt="Cachet Électronique Officiel" style="max-height: 75px; max-width: 160px; object-fit: contain; background: #fff; padding: 2px; border-radius: 4px; border: 1px solid #ccc;">
        <span style="font-size: 0.65rem; color: var(--success); font-weight: 700;">Cachet Électronique Authentifié</span>
      </div>
    `;
  } else {
    stampHtml = `
      <div style="height: 60px; border: 1px dashed var(--border-color); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.75rem;">
        Cachet Électronique
      </div>
    `;
  }

  const rightBoxHtml = isProforma ? `
    <div style="text-align: right; display: flex; flex-direction: column; justify-content: center; align-items: flex-end;">
      <span class="badge badge-info" style="font-size: 0.85rem; padding: 0.35rem 0.85rem;"><i class="fa-solid fa-file-lines"></i> DEVIS PROFORMA</span>
      <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">Offre de prix sans engagement commercial</span>
    </div>
  ` : `
    <div style="text-align: right;">
      <span style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">MODALITÉS DE RÈGLEMENT :</span>
      <p style="font-size: 0.9rem; color: var(--text-primary); font-weight: 600; margin-top: 0.1rem;">Mode: <strong>${escapeHtml(inv.paymentMethod || 'Virement bancaire')}</strong></p>
      <div style="margin-top: 0.35rem;">
        ${inv.status === 'PAID' ? '<span class="badge badge-success" style="font-size: 0.78rem; padding: 0.25rem 0.65rem;"><i class="fa-solid fa-circle-check"></i> FACTURE PAYÉE</span>' : '<span class="badge badge-warning" style="font-size: 0.78rem; padding: 0.25rem 0.65rem;"><i class="fa-solid fa-clock"></i> EN ATTENTE DE RÈGLEMENT</span>'}
      </div>
    </div>
  `;

  const logoImgHtml = settings.companyLogo ?
    `<img src="${settings.companyLogo}" alt="2M GLOBAL SERVICES" style="max-height: 65px; max-width: 200px; object-fit: contain; margin-bottom: 0.35rem; display: block;">` :
    `<h2 style="font-size: 1.4rem; color: var(--accent-primary); font-weight: 800; margin-bottom: 0.2rem;">${escapeHtml(settings.companyName)}</h2>`;

  const headerDateHtml = isProforma ?
    `Date: <strong>${formattedDate}</strong>` :
    `Date: <strong>${formattedDate}</strong> | Échéance: <strong>${formattedDueDate}</strong>`;

  const docTitle = isProforma ? 'FACTURE PROFORMA' : (isService ? 'FACTURE DE PRESTATION DE SERVICES' : 'FACTURE DÉFINITIVE');
  const tableColHeader = isService ? 'Désignation des Prestations & Travaux Effectués' : 'Désignation des Prestations / Articles';

  const line1 = settings.invoiceFooterLine1 || '2M GLOBAL SERVICES - N.I.N.E.A: 012457695 - SN.DKR.2025.A.35597 - 35529/2025/RCCM/RA';
  const line2 = settings.invoiceFooterLine2 || 'Adresse: LIBERTE O1 VILLA N• 1336 - 📧 E-MAIL: 2mglobalservices11@gmail.COM - ☎️ Tél: 76-192-34-41';

  detailContainer.innerHTML = `
    <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--border-color); font-size: 0.88rem; max-width: 800px; margin: 0 auto;">
      
      ${isProforma ? `
        <div style="background: rgba(245, 158, 11, 0.15); border: 1px dashed #f59e0b; padding: 0.4rem 0.75rem; border-radius: var(--radius-sm); margin-bottom: 1rem; text-align: center; color: #d97706; font-weight: 700; font-size: 0.8rem;">
          <i class="fa-solid fa-triangle-exclamation"></i> FACTURE PROFORMA - OFFRE DE PRIX SANS VALEUR COMPTABLE NI FISCALE
        </div>
      ` : ''}

      <!-- Company Header with Logo & QR Code -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${isProforma ? '#06b6d4' : (isService ? '#0284c7' : '#f97316')}; padding-bottom: 1rem; margin-bottom: 1rem;">
        <div>
          ${logoImgHtml}
          <h2 style="font-size: 1.15rem; color: #0284c7; font-weight: 800; margin-bottom: 0.15rem;">${escapeHtml(settings.companyName)}</h2>
          <p style="color: var(--text-secondary); font-size: 0.82rem; margin-bottom: 0.1rem;">${escapeHtml(settings.companyAddress)}</p>
          <p style="color: var(--text-secondary); font-size: 0.82rem; margin-bottom: 0.1rem;">Tél: ${escapeHtml(settings.companyPhone)} | Email: ${escapeHtml(settings.companyEmail)}</p>
          <p style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-top: 0.2rem;">${escapeHtml(settings.companyTaxId)}</p>
        </div>

        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem;">
          <div style="display: flex; gap: 0.85rem; align-items: center;">
            <div style="text-align: right;">
              <h1 style="font-size: 1.35rem; letter-spacing: -0.03em; color: #0284c7; text-transform: uppercase; font-family: 'Outfit', sans-serif;">
                ${docTitle}
              </h1>
              <div style="font-family: monospace; font-size: 1.1rem; color: ${isProforma ? '#06b6d4' : '#f97316'}; font-weight: 800;">N° ${escapeHtml(inv.number)}</div>
            </div>
            ${showQr ? `<img src="${qrCodeUrl}" alt="QR Code d'Authenticité" style="width: 70px; height: 70px; background: #fff; padding: 3px; border-radius: 6px; border: 1px solid #ccc;">` : ''}
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary);">${headerDateHtml}</p>
        </div>
      </div>

      <!-- Client & Payment Box -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: var(--bg-tertiary); padding: 0.85rem 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
        <div>
          <span style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">CLIENT (DESTINATAIRE) :</span>
          <h3 style="font-size: 1.05rem; color: var(--text-primary); margin-top: 0.1rem;">${escapeHtml(inv.clientName)}</h3>
          ${inv.clientPhone ? `<p style="font-size: 0.82rem; color: var(--text-secondary);">Tél: ${escapeHtml(inv.clientPhone)}</p>` : ''}
          ${inv.clientTaxId ? `<p style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(inv.clientTaxId)}</p>` : ''}
        </div>

        ${rightBoxHtml}
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.85rem;">
        <thead>
          <tr style="background: var(--bg-tertiary); text-transform: uppercase; font-size: 0.72rem; color: var(--text-secondary);">
            <th style="padding: 0.5rem; text-align: center;">#</th>
            <th style="padding: 0.5rem; text-align: left;">Réf SKU / Code</th>
            <th style="padding: 0.5rem; text-align: left;">${tableColHeader}</th>
            <th style="padding: 0.5rem; text-align: center;">Qté / Unité</th>
            <th style="padding: 0.5rem; text-align: right;">Prix Unitaire HT</th>
            <th style="padding: 0.5rem; text-align: right;">Montant Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <!-- Breakdown & Amount in Words -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div style="flex: 1; max-width: 420px; background: var(--bg-tertiary); padding: 0.75rem 1rem; border-radius: var(--radius-md); border-left: 3px solid ${isProforma ? '#06b6d4' : '#f97316'};">
          <span style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">ARRÊTÉ LA PRÉSENTE FACTURE À LA SOMME DE :</span>
          <p style="font-weight: 700; color: var(--text-primary); margin-top: 0.25rem; font-style: italic; font-size: 0.85rem; line-height: 1.3;">
            « ${escapeHtml(amountInWords)} »
          </p>
        </div>

        <div style="width: 300px; background: var(--bg-tertiary); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem; font-size: 0.82rem;">
            <span>Sous-Total HT :</span>
            <strong>${window.formatFCFA(inv.subtotal)}</strong>
          </div>
          ${inv.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem; font-size: 0.82rem; color: var(--warning);">
              <span>Remise Accordée :</span>
              <strong>-${window.formatFCFA(inv.discountAmount)}</strong>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem; font-size: 0.82rem;">
            <span>Net HT :</span>
            <strong>${window.formatFCFA(inv.netSubtotal || (inv.subtotal - (inv.discountAmount || 0)))}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.82rem;">
            <span>TVA (${inv.vatRate || 18}%) :</span>
            <strong>${window.formatFCFA(inv.vatAmount)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 2px solid #0284c7; padding-top: 0.5rem; font-size: 1.1rem; color: var(--text-primary);">
            <strong>TOTAL TTC :</strong>
            <strong style="color: #0284c7;">${window.formatFCFA(inv.totalAmount)}</strong>
          </div>
        </div>
      </div>

      ${inv.notes ? `
        <div style="background: var(--bg-tertiary); padding: 0.6rem 1rem; border-radius: var(--radius-md); font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">
          <strong>Remarques / Conditions de la Prestation :</strong> ${escapeHtml(inv.notes)}
        </div>
      ` : ''}

      <!-- Official Bank RIB & Mobile Money Payment Modalities Block -->
      <div style="margin-top: 1rem; background: var(--bg-tertiary); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-size: 0.8rem; line-height: 1.4;">
        <h4 style="font-size: 0.82rem; color: var(--accent-primary); text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
          <i class="fa-solid fa-building-columns"></i> MODALITÉS DE RÈGLEMENT & COORDONNÉES BANCAIRES
        </h4>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <!-- Bank & Check Wire Details -->
          <div style="border-right: 1px solid var(--border-color); padding-right: 0.75rem;">
            <p style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
              <i class="fa-solid fa-money-check-dollar" style="color: var(--success);"></i> Par virement bancaire ou chèque :
            </p>
            <div style="font-size: 0.78rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.15rem;">
              <div><strong>Banque :</strong> CBAO</div>
              <div><strong>IBAN :</strong> <span style="font-family: monospace; font-weight: 700; color: var(--text-primary);">SN08 SN012 012120 35207043601 08</span></div>
              <div><strong>Code SWIFT :</strong> <span style="font-family: monospace; font-weight: 700; color: var(--text-primary);">CBAOSNDA</span></div>
            </div>
          </div>

          <!-- Mobile Money Details (Wave / Orange Money) -->
          <div>
            <p style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
              <i class="fa-solid fa-mobile-screen-button" style="color: #0284c7;"></i> Par Wave ou Orange Money :
            </p>
            <div style="font-size: 0.78rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.15rem;">
              <div>📲 <strong>+221 77 171 51 29</strong></div>
              <div>📲 <strong>+221 76 192 34 41</strong></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Signatures & Electronic Stamp Box -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <div style="text-align: center;">
          <p style="font-weight: 700; color: var(--text-primary); font-size: 0.8rem; text-transform: uppercase;">Pour le Client (Signature)</p>
          <div style="height: 60px; margin-top: 0.35rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md);"></div>
        </div>
        <div style="text-align: center;">
          <p style="font-weight: 700; color: var(--text-primary); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 0.35rem;">Pour 2M GLOBAL SERVICES (Signature & Cachet)</p>
          ${stampHtml}
        </div>
      </div>

      <!-- Official 2M GLOBAL SERVICES Legal Footer -->
      <div style="margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 0.65rem; text-align: center; font-size: 0.72rem; color: var(--text-secondary); font-weight: 500; line-height: 1.4;">
        <p style="margin: 0; font-weight: 700; color: var(--text-primary);">${escapeHtml(line1)}</p>
        <p style="margin: 3px 0 0 0;">${escapeHtml(line2)}</p>
      </div>

    </div>
  `;

  openModal('modal-invoice-detail');
}

function printInvoice() {
  window.print();
}

window.filterInvoiceList = filterInvoiceList;
window.onPaymentMethodChange = onPaymentMethodChange;
