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
            ${!isProforma && inv.status === 'PENDING' ? `
              <button class="btn-success" style="padding: 0.28rem 0.55rem; font-size: 0.76rem;" onclick="quickMarkInvoicePaid('${inv.id}')" title="Marquer cette facture comme payée">
                <i class="fa-solid fa-circle-check"></i> Régler
              </button>
              <button class="btn-warning" style="padding: 0.28rem 0.55rem; font-size: 0.76rem; background: linear-gradient(135deg, #f59e0b, #d97706); color:#fff;" onclick="sendWhatsAppReminder('${inv.id}')" title="Envoyer une relance d'impayé sur WhatsApp">
                <i class="fa-solid fa-bell"></i> Relancer
              </button>
            ` : ''}
            ${editBtnHtml}
            <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="viewInvoiceDetail('${inv.id}')">
              <i class="fa-solid fa-print"></i> Aperçu
            </button>
            <button class="btn-success" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; background: #25D366; border-color: #25D366; font-weight: 600;" onclick="openWhatsAppModal('${inv.id}')" title="Envoyer directement la facture au client sur WhatsApp">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
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

  populateInvoiceClientDropdown();

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
  let totalHaqqiQty = 0;
  let haqqiStandardTotal = 0;

  rows.forEach(r => {
    const qty = parseInt(r.querySelector('.inv-qty-input')?.value, 10) || 0;
    const price = parseFloat(r.querySelector('.inv-price-input')?.value) || 0;
    const rowTotal = qty * price;
    subtotal += rowTotal;

    const selectEl = r.querySelector('.inv-prod-select');
    let isHaqqi = false;

    if (selectEl) {
      const prodText = (selectEl.options[selectEl.selectedIndex]?.text || '').toLowerCase();
      if (prodText.includes('haqqi')) isHaqqi = true;
    }

    if (isHaqqi) {
      totalHaqqiQty += qty;
      haqqiStandardTotal += rowTotal;
    }

    const rowTotalInput = r.querySelector('.inv-row-total');
    if (rowTotalInput) rowTotalInput.value = window.formatFCFA(rowTotal);
  });

  const discountInput = document.getElementById('inv-discount');
  const vatRateInput = document.getElementById('inv-vat-rate');
  const customTotalInput = document.getElementById('inv-custom-total');
  const haqqiNoticeEl = document.getElementById('inv-haqqi-promo-notice');

  let discount = parseFloat(discountInput?.value) || 0;
  let vatRate = parseFloat(vatRateInput?.value) || 0;

  // Apply automatic HAQQI 3-pack promo (3 items = 10,000 FCFA Net, TVA = 0% on HAQQI promo)
  if (totalHaqqiQty >= 3) {
    const bundles = Math.floor(totalHaqqiQty / 3);
    const remainder = totalHaqqiQty % 3;
    const targetHaqqiNet = (bundles * 10000) + (remainder * 3500);
    const haqqiDiscountNeeded = Math.max(haqqiStandardTotal - targetHaqqiNet, 0);

    if (source === 'ITEMS' && discountInput) {
      discount = haqqiDiscountNeeded;
      discountInput.value = Math.round(discount);
    }

    if (haqqiNoticeEl) {
      haqqiNoticeEl.style.display = 'block';
      haqqiNoticeEl.innerHTML = `
        <div style="background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.4); border-radius: var(--radius-md); padding: 0.65rem 0.85rem; color: #ec4899; font-size: 0.85rem; margin-top: 0.75rem; margin-bottom: 0.25rem;">
          <i class="fa-solid fa-gift"></i> <strong>OFFRE SPÉCIALE HAQQI ACTIVÉE :</strong> ${totalHaqqiQty} Parfum(s) HAQQI (<strong>${bundles} Lot(s) de 3 à 10 000 FCFA Net Sans TVA</strong>). Total HAQQI : <strong>${window.formatFCFA(targetHaqqiNet)} Net</strong>.
        </div>
      `;
    }
  } else if (haqqiNoticeEl) {
    haqqiNoticeEl.style.display = 'none';
  }

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
  window.currentDetailInvoiceId = invoiceId;
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

  const itemCount = inv.items.length;
  const tableCellPadding = itemCount > 8 ? '0.18rem 0.3rem' : (itemCount > 5 ? '0.22rem 0.35rem' : '0.28rem 0.4rem');
  const tableFontSize = itemCount > 8 ? '0.72rem' : (itemCount > 5 ? '0.75rem' : '0.78rem');
  const sectionSpacing = itemCount > 8 ? '0.45rem' : (itemCount > 5 ? '0.55rem' : '0.65rem');

  const itemRowsHtml = inv.items.map((item, idx) => {
    const prod = item.productId ? window.store.getProductById(item.productId) : null;
    const sku = prod ? prod.sku : (isService ? 'SERV-' + (idx + 1).toString().padStart(2, '0') : 'REF-' + (idx + 1));
    return `
      <tr>
        <td style="padding: ${tableCellPadding}; text-align: center; border-bottom: 1px solid var(--border-color);">${idx + 1}</td>
        <td style="padding: ${tableCellPadding}; font-family: monospace; font-size: ${tableFontSize}; color: var(--accent-primary); border-bottom: 1px solid var(--border-color);">${escapeHtml(sku)}</td>
        <td style="padding: ${tableCellPadding}; border-bottom: 1px solid var(--border-color);"><strong>${escapeHtml(item.productName)}</strong></td>
        <td style="padding: ${tableCellPadding}; text-align: center; border-bottom: 1px solid var(--border-color);">${item.quantity}</td>
        <td style="padding: ${tableCellPadding}; text-align: right; border-bottom: 1px solid var(--border-color);">${window.formatFCFA(item.unitPrice)}</td>
        <td style="padding: ${tableCellPadding}; text-align: right; border-bottom: 1px solid var(--border-color);"><strong>${window.formatFCFA(item.total)}</strong></td>
      </tr>
    `;
  }).join('');

  let stampHtml = '';
  if (settings.companyStamp) {
    stampHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;">
        <img src="${settings.companyStamp}" alt="Cachet Électronique Officiel" style="max-height: 48px; max-width: 140px; object-fit: contain; background: #fff; padding: 2px; border-radius: 4px; border: 1px solid #ccc;">
        <span style="font-size: 0.6rem; color: var(--success); font-weight: 700;">Cachet Électronique Authentifié</span>
      </div>
    `;
  } else {
    stampHtml = `
      <div style="height: 42px; border: 1px dashed var(--border-color); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.7rem;">
        Cachet Électronique
      </div>
    `;
  }

  const rightBoxHtml = isProforma ? `
    <div style="text-align: right; display: flex; flex-direction: column; justify-content: center; align-items: flex-end;">
      <span class="badge badge-info" style="font-size: 0.78rem; padding: 0.25rem 0.65rem;"><i class="fa-solid fa-file-lines"></i> DEVIS PROFORMA</span>
      <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">Offre de prix sans engagement commercial</span>
    </div>
  ` : `
    <div style="text-align: right;">
      <span style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">MODALITÉS DE RÈGLEMENT :</span>
      <p style="font-size: 0.82rem; color: var(--text-primary); font-weight: 600; margin-top: 0.1rem; margin-bottom: 0.2rem;">Mode: <strong>${escapeHtml(inv.paymentMethod || 'Virement bancaire')}</strong></p>
      <div>
        ${inv.status === 'PAID' ? '<span class="badge badge-success" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;"><i class="fa-solid fa-circle-check"></i> FACTURE PAYÉE</span>' : '<span class="badge badge-warning" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;"><i class="fa-solid fa-clock"></i> EN ATTENTE DE RÈGLEMENT</span>'}
      </div>
    </div>
  `;

  const logoImgHtml = settings.companyLogo ?
    `<img src="${settings.companyLogo}" alt="2M GLOBAL SERVICES" style="max-height: 52px; max-width: 180px; object-fit: contain; margin-bottom: 0.2rem; display: block;">` :
    `<h2 style="font-size: 1.2rem; color: var(--accent-primary); font-weight: 800; margin-bottom: 0.1rem;">${escapeHtml(settings.companyName)}</h2>`;

  const headerDateHtml = isProforma ?
    `Date: <strong>${formattedDate}</strong>` :
    `Date: <strong>${formattedDate}</strong> | Échéance: <strong>${formattedDueDate}</strong>`;

  const docTitle = isProforma ? 'FACTURE PROFORMA' : (isService ? 'FACTURE DE PRESTATION DE SERVICES' : 'FACTURE DÉFINITIVE');
  const tableColHeader = isService ? 'Désignation des Prestations & Travaux Effectués' : 'Désignation des Prestations / Articles';

  const line1 = settings.invoiceFooterLine1 || '2M GLOBAL SERVICES - N.I.N.E.A: 012457695 - SN.DKR.2025.A.35597 - 35529/2025/RCCM/RA';
  const line2 = settings.invoiceFooterLine2 || 'Adresse: LIBERTE O1 VILLA N• 1336 - 📧 E-MAIL: 2mglobalservices11@gmail.COM - ☎️ Tél: 76-192-34-41';

  detailContainer.innerHTML = `
    <div style="padding: 1.1rem 1.25rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--border-color); font-size: 0.82rem; line-height: 1.25; max-width: 800px; margin: 0 auto; box-sizing: border-box; page-break-inside: avoid;">
      
      ${isProforma ? `
        <div style="background: rgba(245, 158, 11, 0.15); border: 1px dashed #f59e0b; padding: 0.35rem 0.65rem; border-radius: var(--radius-sm); margin-bottom: ${sectionSpacing}; text-align: center; color: #d97706; font-weight: 700; font-size: 0.75rem;">
          <i class="fa-solid fa-triangle-exclamation"></i> FACTURE PROFORMA - OFFRE DE PRIX SANS VALEUR COMPTABLE NI FISCALE
        </div>
      ` : ''}

      <!-- Company Header with Logo & QR Code -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${isProforma ? '#06b6d4' : (isService ? '#0284c7' : '#f97316')}; padding-bottom: 0.5rem; margin-bottom: ${sectionSpacing};">
        <div>
          ${logoImgHtml}
          <h2 style="font-size: 1.05rem; color: #0284c7; font-weight: 800; margin-bottom: 0.1rem;">${escapeHtml(settings.companyName)}</h2>
          <p style="color: var(--text-secondary); font-size: 0.78rem; margin-bottom: 0.05rem;">${escapeHtml(settings.companyAddress)}</p>
          <p style="color: var(--text-secondary); font-size: 0.78rem; margin-bottom: 0.05rem;">Tél: ${escapeHtml(settings.companyPhone)} | Email: ${escapeHtml(settings.companyEmail)}</p>
          <p style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-top: 0.1rem;">${escapeHtml(settings.companyTaxId)}</p>
        </div>

        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
          <div style="display: flex; gap: 0.65rem; align-items: center;">
            <div style="text-align: right;">
              <h1 style="font-size: 1.2rem; letter-spacing: -0.02em; color: #0284c7; text-transform: uppercase; font-family: 'Outfit', sans-serif; margin: 0;">
                ${docTitle}
              </h1>
              <div style="font-family: monospace; font-size: 0.98rem; color: ${isProforma ? '#06b6d4' : '#f97316'}; font-weight: 800;">N° ${escapeHtml(inv.number)}</div>
            </div>
            ${showQr ? `<img src="${qrCodeUrl}" alt="QR Code" style="width: 58px; height: 58px; background: #fff; padding: 2px; border-radius: 5px; border: 1px solid #ccc;">` : ''}
          </div>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0;">${headerDateHtml}</p>
        </div>
      </div>

      <!-- Client & Payment Box -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; background: var(--bg-tertiary); padding: 0.55rem 0.85rem; border-radius: var(--radius-md); margin-bottom: ${sectionSpacing};">
        <div>
          <span style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">CLIENT (DESTINATAIRE) :</span>
          <h3 style="font-size: 0.95rem; color: var(--text-primary); margin-top: 0.05rem; margin-bottom: 0.1rem;">${escapeHtml(inv.clientName)}</h3>
          ${inv.clientPhone ? `<p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0;">Tél: ${escapeHtml(inv.clientPhone)}</p>` : ''}
          ${inv.clientTaxId ? `<p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">${escapeHtml(inv.clientTaxId)}</p>` : ''}
        </div>

        ${rightBoxHtml}
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: ${sectionSpacing}; font-size: ${tableFontSize};">
        <thead>
          <tr style="background: var(--bg-tertiary); text-transform: uppercase; font-size: 0.7rem; color: var(--text-secondary);">
            <th style="padding: 0.35rem 0.4rem; text-align: center;">#</th>
            <th style="padding: 0.35rem 0.4rem; text-align: left;">Réf SKU</th>
            <th style="padding: 0.35rem 0.4rem; text-align: left;">${tableColHeader}</th>
            <th style="padding: 0.35rem 0.4rem; text-align: center;">Qté</th>
            <th style="padding: 0.35rem 0.4rem; text-align: right;">P.U HT</th>
            <th style="padding: 0.35rem 0.4rem; text-align: right;">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <!-- Breakdown & Amount in Words -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${sectionSpacing}; gap: 0.75rem;">
        <div style="flex: 1; max-width: 420px; background: var(--bg-tertiary); padding: 0.55rem 0.85rem; border-radius: var(--radius-md); border-left: 3px solid ${isProforma ? '#06b6d4' : '#f97316'};">
          <span style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">ARRÊTÉ LA PRÉSENTE FACTURE À LA SOMME DE :</span>
          <p style="font-weight: 700; color: var(--text-primary); margin-top: 0.2rem; margin-bottom: 0; font-style: italic; font-size: 0.8rem; line-height: 1.25;">
            « ${escapeHtml(amountInWords)} »
          </p>
        </div>

        <div style="width: 270px; background: var(--bg-tertiary); padding: 0.55rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem; font-size: 0.78rem;">
            <span>Sous-Total HT :</span>
            <strong>${window.formatFCFA(inv.subtotal)}</strong>
          </div>
          ${inv.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem; font-size: 0.78rem; color: var(--warning);">
              <span>Remise Accordée :</span>
              <strong>-${window.formatFCFA(inv.discountAmount)}</strong>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem; font-size: 0.78rem;">
            <span>Net HT :</span>
            <strong>${window.formatFCFA(inv.netSubtotal || (inv.subtotal - (inv.discountAmount || 0)))}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem; font-size: 0.78rem;">
            <span>TVA (${inv.vatRate || 18}%) :</span>
            <strong>${window.formatFCFA(inv.vatAmount)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 2px solid #0284c7; padding-top: 0.35rem; font-size: 1rem; color: var(--text-primary);">
            <strong>TOTAL TTC :</strong>
            <strong style="color: #0284c7;">${window.formatFCFA(inv.totalAmount)}</strong>
          </div>
        </div>
      </div>

      ${inv.notes ? `
        <div style="background: var(--bg-tertiary); padding: 0.45rem 0.75rem; border-radius: var(--radius-md); font-size: 0.75rem; color: var(--text-secondary); margin-bottom: ${sectionSpacing};">
          <strong>Remarques / Conditions :</strong> ${escapeHtml(inv.notes)}
        </div>
      ` : ''}

      <!-- Official Bank RIB & Mobile Money Payment Modalities Block -->
      <div style="margin-top: ${sectionSpacing}; background: var(--bg-tertiary); padding: 0.55rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-size: 0.75rem; line-height: 1.3;">
        <h4 style="font-size: 0.75rem; color: var(--accent-primary); text-transform: uppercase; font-weight: 700; margin-bottom: 0.35rem; margin-top: 0; display: flex; align-items: center; gap: 0.35rem;">
          <i class="fa-solid fa-building-columns"></i> MODALITÉS DE RÈGLEMENT & COORDONNÉES BANCAIRES
        </h4>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <!-- Bank & Check Wire Details -->
          <div style="border-right: 1px solid var(--border-color); padding-right: 0.5rem;">
            <p style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.15rem; margin-top: 0;">
              <i class="fa-solid fa-money-check-dollar" style="color: var(--success);"></i> Par virement bancaire ou chèque :
            </p>
            <div style="font-size: 0.73rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.1rem;">
              <div><strong>Banque :</strong> CBAO</div>
              <div><strong>IBAN :</strong> <span style="font-family: monospace; font-weight: 700; color: var(--text-primary);">SN08 SN012 012120 35207043601 08</span></div>
              <div><strong>Code SWIFT :</strong> <span style="font-family: monospace; font-weight: 700; color: var(--text-primary);">CBAOSNDA</span></div>
            </div>
          </div>

          <!-- Mobile Money Details (Wave / Orange Money) -->
          <div>
            <p style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.15rem; margin-top: 0;">
              <i class="fa-solid fa-mobile-screen-button" style="color: #0284c7;"></i> Par Wave ou Orange Money :
            </p>
            <div style="font-size: 0.73rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.1rem;">
              <div>📲 <strong>+221 77 171 51 29</strong></div>
              <div>📲 <strong>+221 76 192 34 41</strong></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Signatures & Electronic Stamp Box -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-top: 0.55rem; border-top: 1px solid var(--border-color); padding-top: 0.45rem;">
        <div style="text-align: center;">
          <p style="font-weight: 700; color: var(--text-primary); font-size: 0.75rem; text-transform: uppercase; margin: 0;">Pour le Client (Signature)</p>
          <div style="height: 42px; margin-top: 0.25rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md);"></div>
        </div>
        <div style="text-align: center;">
          <p style="font-weight: 700; color: var(--text-primary); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 0.25rem; margin-top: 0;">Pour 2M GLOBAL SERVICES (Signature & Cachet)</p>
          ${stampHtml}
        </div>
      </div>

      <!-- Official 2M GLOBAL SERVICES Legal Footer -->
      <div style="margin-top: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.45rem; text-align: center; font-size: 0.68rem; color: var(--text-secondary); font-weight: 500; line-height: 1.3;">
        <p style="margin: 0; font-weight: 700; color: var(--text-primary);">${escapeHtml(line1)}</p>
        <p style="margin: 2px 0 0 0;">${escapeHtml(line2)}</p>
      </div>

    </div>
  `;

  openModal('modal-invoice-detail');
}

function printInvoice() {
  window.print();
}

// ==========================================================================
// WhatsApp Direct Invoice Sending Engine
// ==========================================================================

let currentWhatsAppInvoiceId = null;
window.currentDetailInvoiceId = null;

function openWhatsAppModal(invoiceId) {
  const inv = window.store.getInvoiceById(invoiceId);
  if (!inv) {
    showToast('Facture introuvable.', 'danger');
    return;
  }

  currentWhatsAppInvoiceId = invoiceId;
  const settings = window.store.getSettings();
  const defaultCountryCode = settings.waCountryCode || '221';

  // Set brief card info
  const briefEl = document.getElementById('wa-invoice-brief');
  if (briefEl) {
    const isProforma = inv.type === 'PROFORMA';
    const isService = inv.type === 'SERVICE';
    const docTitle = isProforma ? 'Devis Proforma' : (isService ? 'Facture Prestation' : 'Facture Définitive');

    briefEl.innerHTML = `
      <div>
        <strong style="color: var(--accent-primary); font-size: 1.05rem;">${docTitle} #${escapeHtml(inv.number)}</strong>
        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.15rem;">
          Client: <strong>${escapeHtml(inv.clientName)}</strong> | Date: ${new Date(inv.date).toLocaleDateString('fr-FR')}
        </div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 1.1rem; font-weight: 800; color: #25D366;">${window.formatFCFA(inv.totalAmount)}</span>
      </div>
    `;
  }

  // Pre-fill phone number
  const phoneInput = document.getElementById('wa-client-phone');
  if (phoneInput) {
    phoneInput.value = inv.clientPhone || '';
  }

  // Country code select
  const countrySelect = document.getElementById('wa-country-code');
  if (countrySelect) {
    countrySelect.value = defaultCountryCode;
  }

  updateWhatsAppMessagePreview();
  openModal('modal-whatsapp-share');
}

function openWhatsAppModalFromDetail() {
  if (window.currentDetailInvoiceId) {
    openWhatsAppModal(window.currentDetailInvoiceId);
  }
}

function cleanPhoneNumber(phoneStr, countryCode = '221') {
  if (!phoneStr) return '';
  let cleaned = phoneStr.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned.substring(1);
  }

  if (cleaned.startsWith('00')) {
    return cleaned.substring(2);
  }

  if (countryCode === 'AUTRE') {
    return cleaned;
  }

  if (cleaned.startsWith('0') && cleaned.length >= 9) {
    cleaned = cleaned.substring(1);
  }

  if (countryCode && !cleaned.startsWith(countryCode) && cleaned.length <= 10) {
    cleaned = countryCode + cleaned;
  }

  return cleaned;
}

function generateWhatsAppInvoiceMessage(inv, includeItems = true, includePayment = true) {
  const settings = window.store.getSettings();
  const isProforma = inv.type === 'PROFORMA';
  const isService = inv.type === 'SERVICE';

  const docTitle = isProforma ? 'DEVIS PROFORMA' : (isService ? 'FACTURE DE PRESTATION DE SERVICES' : 'FACTURE DÉFINITIVE');
  const formattedDate = new Date(inv.date).toLocaleDateString('fr-FR');
  const companyName = settings.companyName || '2M GLOBAL SERVICES';

  let msg = `📄 *${companyName.toUpperCase()}*\n`;
  msg += `-------------------------------------------\n`;
  msg += `🧾 *${docTitle} N° ${inv.number}*\n`;
  msg += `👤 *Client :* ${inv.clientName}\n`;
  msg += `📅 *Date :* ${formattedDate}\n`;

  if (inv.dueDate && !isProforma) {
    const formattedDue = new Date(inv.dueDate).toLocaleDateString('fr-FR');
    msg += `⏳ *Échéance :* ${formattedDue}\n`;
  }

  msg += `-------------------------------------------\n`;

  if (includeItems && inv.items && inv.items.length > 0) {
    msg += `📦 *DÉTAILS DES PRESTATIONS / ARTICLES :*\n`;
    inv.items.forEach((item) => {
      msg += `• *${item.productName}*\n  └ Qté : ${item.quantity} x ${window.formatFCFA(item.unitPrice)} = *${window.formatFCFA(item.total)}*\n`;
    });
    msg += `-------------------------------------------\n`;
  }

  msg += `💵 *Sous-Total HT :* ${window.formatFCFA(inv.subtotal)}\n`;
  if (inv.discountAmount > 0) {
    msg += `🏷️ *Remise Accordée :* -${window.formatFCFA(inv.discountAmount)}\n`;
  }
  if (inv.vatAmount > 0) {
    msg += `🏛️ *TVA (${inv.vatRate || 18}%) :* ${window.formatFCFA(inv.vatAmount)}\n`;
  }
  msg += `💰 *TOTAL TTC :* *${window.formatFCFA(inv.totalAmount)}*\n`;

  if (!isProforma) {
    const statusLabel = inv.status === 'PAID' ? 'Payée ✅' : 'En attente de règlement ⏳';
    msg += `📌 *Statut :* ${statusLabel}\n`;
    msg += `💳 *Mode de Règlement :* ${inv.paymentMethod || 'Virement bancaire'}\n`;
  }

  if (includePayment) {
    msg += `-------------------------------------------\n`;
    msg += `🏦 *COORDONNÉES DE RÈGLEMENT :*\n`;
    msg += `• *Virement / Chèque :* CBAO (IBAN: SN08 SN012 012120 35207043601 08)\n`;
    msg += `• *Wave / Orange Money :* 📲 +221 77 171 51 29 / +221 76 192 34 41\n`;
  }

  msg += `-------------------------------------------\n`;
  if (inv.notes) {
    msg += `📝 *Notes :* ${inv.notes}\n`;
  }

  msg += `✨ *Merci pour votre confiance !*\n`;
  msg += `📞 *Contact :* ${settings.companyPhone || '76-192-34-41'} | 📧 ${settings.companyEmail || '2mglobalservices11@gmail.COM'}`;

  return msg;
}

function updateWhatsAppMessagePreview() {
  if (!currentWhatsAppInvoiceId) return;

  const inv = window.store.getInvoiceById(currentWhatsAppInvoiceId);
  if (!inv) return;

  const countryCode = document.getElementById('wa-country-code')?.value || '221';
  const rawPhone = document.getElementById('wa-client-phone')?.value || '';
  const formattedPhone = cleanPhoneNumber(rawPhone, countryCode);

  const numDisplay = document.getElementById('wa-formatted-num-display');
  if (numDisplay) {
    numDisplay.textContent = formattedPhone ? `📲 Format WhatsApp : +${formattedPhone}` : '⚠️ Saisissez un numéro';
  }

  const includeItems = document.getElementById('wa-opt-items')?.checked !== false;
  const includePayment = document.getElementById('wa-opt-payment')?.checked !== false;

  const msgPreview = document.getElementById('wa-message-preview');
  if (msgPreview) {
    msgPreview.value = generateWhatsAppInvoiceMessage(inv, includeItems, includePayment);
  }
}

function sendWhatsAppMessageFromModal() {
  const countryCode = document.getElementById('wa-country-code')?.value || '221';
  const rawPhone = document.getElementById('wa-client-phone')?.value || '';
  const formattedPhone = cleanPhoneNumber(rawPhone, countryCode);

  if (!formattedPhone || formattedPhone.length < 7) {
    showToast('Veuillez saisir un numéro de téléphone WhatsApp valide.', 'warning');
    return;
  }

  // Generate single-page A4 PDF file & send via Web Share API or download + open WhatsApp
  shareInvoicePDFWhatsApp();
}

function copyWhatsAppMessageToClipboard() {
  const msgText = document.getElementById('wa-message-preview')?.value || '';
  if (!msgText) return;

  navigator.clipboard.writeText(msgText).then(() => {
    showToast('Texte de la facture copié dans le presse-papier !', 'success');
  }).catch(err => {
    showToast('Erreur lors de la copie du message.', 'danger');
  });
}

function downloadInvoicePDF(invoiceId) {
  if (!invoiceId) return;
  const inv = window.store.getInvoiceById(invoiceId);
  if (!inv) return;

  viewInvoiceDetail(invoiceId);
  const element = document.getElementById('printable-invoice-content');
  if (!element) return;

  showToast(`Génération du fichier PDF pour la Facture #${inv.number}...`, 'info');

  const opt = {
    margin: [4, 4, 4, 4],
    filename: `Facture_${inv.number}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: 'avoid-all' }
  };

  if (window.html2pdf) {
    window.html2pdf().set(opt).from(element).save().then(() => {
      showToast(`Facture #${inv.number} téléchargée en PDF avec succès !`, 'success');
    }).catch(err => {
      showToast('Erreur génération PDF: ' + err.message, 'danger');
    });
  } else {
    printInvoice();
  }
}

function downloadInvoicePDFFromModal() {
  if (currentWhatsAppInvoiceId) {
    downloadInvoicePDF(currentWhatsAppInvoiceId);
  }
}

async function shareInvoicePDFWhatsApp() {
  if (!currentWhatsAppInvoiceId) return;
  const inv = window.store.getInvoiceById(currentWhatsAppInvoiceId);
  if (!inv) return;

  const settings = window.store.getSettings();
  const countryCode = document.getElementById('wa-country-code')?.value || '221';
  const rawPhone = document.getElementById('wa-client-phone')?.value || '';
  const formattedPhone = cleanPhoneNumber(rawPhone, countryCode);

  const msgText = document.getElementById('wa-message-preview')?.value || '';

  showToast(`Génération du PDF officiel pour la Facture #${inv.number}...`, 'info');

  viewInvoiceDetail(currentWhatsAppInvoiceId);
  const element = document.getElementById('printable-invoice-content');
  if (!element) return;

  const opt = {
    margin: [4, 4, 4, 4],
    filename: `Facture_${inv.number}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: 'avoid-all' }
  };

  try {
    if (!window.html2pdf) {
      downloadInvoicePDF(currentWhatsAppInvoiceId);
      return;
    }

    const pdfBlob = await window.html2pdf().set(opt).from(element).outputPdf('blob');
    const fileName = `Facture_${inv.number}.pdf`;
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // Native Web Share API (smartphones / mobile browsers / supported Edge/Chrome)
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        title: `Facture ${inv.number} - ${settings.companyName || '2M GLOBAL SERVICES'}`,
        text: msgText,
        files: [pdfFile]
      });
      showToast('Fichier PDF et message partagés sur WhatsApp !', 'success');
    } else {
      // Desktop Web WhatsApp fallback:
      // 1. Download PDF file automatically
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

      // 2. Open WhatsApp Web / App
      const encodedMsg = encodeURIComponent(msgText);
      const waUrl = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;
      window.open(waUrl, '_blank');

      // 3. Show guidance toast
      showToast(`📄 PDF "${fileName}" téléchargé ! Glissez-déposez le fichier dans la discussion WhatsApp.`, 'success', 8000);
    }
  } catch (err) {
    console.error('Erreur lors du partage PDF:', err);
    showToast('Erreur lors du partage du PDF: ' + err.message, 'danger');
  }
}

function populateInvoiceClientDropdown(selectedClientId = '') {
  const selectEl = document.getElementById('inv-client-select');
  if (!selectEl) return;

  const clients = window.store.getClients();
  let optionsHtml = `<option value="">-- Choisir un client du portefeuille --</option>`;
  optionsHtml += clients.map(c => `<option value="${c.id}" ${c.id === selectedClientId ? 'selected' : ''}>${escapeHtml(c.name)} (${c.code || ''}) - ${escapeHtml(c.phone || '')}</option>`).join('');
  optionsHtml += `<option value="MANUAL">✏️ Saisir manuellement un autre nom de client...</option>`;

  selectEl.innerHTML = optionsHtml;
}

function onInvoiceClientSelect(clientId) {
  if (!clientId || clientId === 'MANUAL') return;

  const client = window.store.getClientById(clientId);
  if (!client) return;

  const nameInput = document.getElementById('inv-client-name');
  const phoneInput = document.getElementById('inv-client-phone');
  const taxInput = document.getElementById('inv-client-taxid');

  if (nameInput) nameInput.value = client.name;
  if (phoneInput) phoneInput.value = client.phone || '';
  if (taxInput) taxInput.value = client.taxId || '';
}

function quickMarkInvoicePaid(invoiceId) {
  const inv = window.store.getInvoiceById(invoiceId);
  if (!inv) return;

  if (confirm(`Marquer la Facture #${inv.number} (Client: ${inv.clientName}) comme PAYÉE ?`)) {
    try {
      window.store.markInvoiceAsPaid(invoiceId);
      showToast(`Facture #${inv.number} marquée comme PAYÉE !`, 'success');
      renderInvoices();
      if (window.renderDashboard) window.renderDashboard();
      if (window.renderClients) window.renderClients();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

function sendWhatsAppReminder(invoiceId) {
  const inv = window.store.getInvoiceById(invoiceId);
  if (!inv) return;

  const settings = window.store.getSettings();
  const companyName = settings.companyName || '2M GLOBAL SERVICES';
  const rawPhone = inv.clientPhone ? inv.clientPhone.replace(/[^\d+]/g, '') : '';
  const cleanPhone = cleanPhoneNumber(rawPhone, settings.waCountryCode || '221');

  const formattedDate = new Date(inv.date).toLocaleDateString('fr-FR');
  const formattedDue = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('fr-FR') : 'À réception';

  let msg = `🔔 *RAPPEL DE RÈGLEMENT - ${companyName.toUpperCase()}*\n`;
  msg += `-------------------------------------------\n`;
  msg += `Bonjour *${inv.clientName}*,\n\n`;
  msg += `Nous vous rappelons gentiment que la *Facture N° ${inv.number}* émise le ${formattedDate} (Échéance : ${formattedDue}) d'un montant de *${window.formatFCFA(inv.totalAmount)}* est en attente de règlement.\n\n`;
  msg += `💳 *MODALITÉS DE RÈGLEMENT :*\n`;
  msg += `• *Virement bancaire / Chèque :* CBAO (IBAN: SN08 SN012 012120 35207043601 08)\n`;
  msg += `• *Wave / Orange Money :* 📲 +221 77 171 51 29 / +221 76 192 34 41\n\n`;
  msg += `Si votre règlement a déjà été effectué, merci de ne pas tenir compte de ce rappel.\n\n`;
  msg += `✨ *Merci pour votre confiance !*\n`;
  msg += `📞 Contact : ${settings.companyPhone || '76-192-34-41'}`;

  const encoded = encodeURIComponent(msg);
  const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
  showToast(`Relance WhatsApp d'impayé préparée pour la Facture #${inv.number}`, 'success');
}

function printPOSReceipt(invoiceId) {
  const invId = invoiceId || window.currentDetailInvoiceId;
  const inv = window.store.getInvoiceById(invId);
  if (!inv) return;

  const settings = window.store.getSettings();
  const formattedDate = new Date(inv.date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const win = window.open('', '_blank', 'width=380,height=600');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket POS #${inv.number}</title>
      <style>
        body { font-family: monospace; font-size: 11px; width: 270px; margin: 0 auto; padding: 8px; color: #000; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        td, th { padding: 2px 0; }
      </style>
    </head>
    <body onload="window.print(); setTimeout(() => window.close(), 500);">
      <div class="text-center bold" style="font-size: 13px;">${settings.companyName || '2M GLOBAL SERVICES'}</div>
      <div class="text-center" style="font-size: 9px;">${settings.companyAddress || 'Dakar, Sénégal'}</div>
      <div class="text-center" style="font-size: 9px;">Tél: ${settings.companyPhone || '76-192-34-41'}</div>
      <div class="divider"></div>
      <div><strong>TICKET N° :</strong> ${inv.number}</div>
      <div><strong>Date :</strong> ${formattedDate}</div>
      <div><strong>Client :</strong> ${inv.clientName}</div>
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Article</th>
            <th style="text-align:center;">Qté</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${inv.items.map(i => `
            <tr>
              <td>${i.productName}</td>
              <td style="text-align:center;">${i.quantity}</td>
              <td class="text-right">${window.formatFCFA(i.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="divider"></div>
      <div class="bold text-right" style="font-size: 12px;">TOTAL TTC : ${window.formatFCFA(inv.totalAmount)}</div>
      <div class="text-right" style="font-size: 9px;">Mode: ${inv.paymentMethod || 'Espèces'}</div>
      <div class="divider"></div>
      <div class="text-center" style="margin-top: 6px;">Merci pour votre confiance !</div>
      <div class="text-center" style="font-size: 8px; margin-top: 4px;">*** Conservez ce ticket ***</div>
    </body>
    </html>
  `);
  win.document.close();
}

window.filterInvoiceList = filterInvoiceList;
window.onPaymentMethodChange = onPaymentMethodChange;
window.openWhatsAppModal = openWhatsAppModal;
window.openWhatsAppModalFromDetail = openWhatsAppModalFromDetail;
window.updateWhatsAppMessagePreview = updateWhatsAppMessagePreview;
window.sendWhatsAppMessageFromModal = sendWhatsAppMessageFromModal;
window.copyWhatsAppMessageToClipboard = copyWhatsAppMessageToClipboard;
window.downloadInvoicePDF = downloadInvoicePDF;
window.downloadInvoicePDFFromModal = downloadInvoicePDFFromModal;
window.shareInvoicePDFWhatsApp = shareInvoicePDFWhatsApp;
window.populateInvoiceClientDropdown = populateInvoiceClientDropdown;
window.onInvoiceClientSelect = onInvoiceClientSelect;
window.quickMarkInvoicePaid = quickMarkInvoicePaid;
window.sendWhatsAppReminder = sendWhatsAppReminder;
window.printPOSReceipt = printPOSReceipt;
