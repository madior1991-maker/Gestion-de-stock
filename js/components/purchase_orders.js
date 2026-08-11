/**
 * StockManager Pro v2 - Purchase Orders Component (Bons de Commande Fournisseur & Logo 2M GLOBAL SERVICES)
 */

let poItemsCount = 0;

function renderPurchaseOrders() {
  const pos = window.store.getPurchaseOrders();
  const tbody = document.getElementById('po-table-body');
  if (!tbody) return;

  if (pos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <i class="fa-solid fa-file-contract" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
          Aucun bon de commande fournisseur enregistré.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = pos.map(po => {
    const formattedDate = new Date(po.date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    let statusBadge = '<span class="badge badge-info"><span class="badge-dot"></span>Envoyé</span>';
    if (po.status === 'RECEIVED') statusBadge = '<span class="badge badge-success"><span class="badge-dot"></span>Réceptionné</span>';
    if (po.status === 'DRAFT') statusBadge = '<span class="badge badge-secondary"><span class="badge-dot"></span>Brouillon</span>';

    return `
      <tr>
        <td>
          <strong style="color: var(--accent-primary); cursor: pointer;" onclick="viewPODetail('${po.id}')">${escapeHtml(po.number)}</strong>
        </td>
        <td>${formattedDate}</td>
        <td><strong style="color: var(--text-primary);">${escapeHtml(po.supplierName)}</strong></td>
        <td><span class="badge badge-secondary">${po.items.length} article(s)</span></td>
        <td><strong style="font-size: 1.05rem; color: var(--text-primary);">${window.formatFCFA(po.totalAmount)}</strong></td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            ${po.status !== 'RECEIVED' ? `
              <button class="btn-primary" style="padding: 0.3rem 0.65rem; font-size: 0.8rem; background: linear-gradient(135deg, #10b981, #059669);" onclick="confirmReceivePO('${po.id}')">
                <i class="fa-solid fa-truck-ramp-box"></i> Réceptionner
              </button>
            ` : ''}
            <button class="btn-secondary" style="padding: 0.3rem 0.65rem; font-size: 0.8rem;" onclick="viewPODetail('${po.id}')">
              <i class="fa-solid fa-eye"></i> Aperçu
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openNewPOModal(supplierId = null, prefillItems = []) {
  const form = document.getElementById('po-form');
  if (form) form.reset();

  const container = document.getElementById('po-items-rows');
  if (container) container.innerHTML = '';
  poItemsCount = 0;

  const supSelect = document.getElementById('po-supplier-select');
  const suppliers = window.store.getSuppliers();
  if (supSelect) {
    supSelect.innerHTML = `<option value="">Sélectionner un fournisseur...</option>` +
      suppliers.map(s => `<option value="${s.id}" ${s.id === supplierId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('');
  }

  if (prefillItems && prefillItems.length > 0) {
    prefillItems.forEach(item => {
      addPOItemRow(item.productId, item.quantity, item.buyPrice);
    });
  } else {
    addPOItemRow();
  }

  openModal('modal-po-create');
}

function generatePOFromLowStock() {
  const lowStock = window.store.getLowStockProducts();
  if (lowStock.length === 0) {
    showToast('Aucun produit en stock critique à réapprovisionner.', 'info');
    return;
  }

  const itemsToOrder = lowStock.map(p => ({
    productId: p.id,
    quantity: Math.max((p.minStock * 2) - p.quantity, 10),
    buyPrice: p.buyPrice || 0
  }));

  const mainSupplierId = lowStock[0]?.supplierId || '';
  openNewPOModal(mainSupplierId, itemsToOrder);
  showToast(`Bon de commande pré-rempli avec ${itemsToOrder.length} produit(s) en alerte !`, 'success');
}

function addPOItemRow(productId = '', quantity = 10, buyPrice = 0) {
  const container = document.getElementById('po-items-rows');
  if (!container) return;

  const products = window.store.getProducts();
  poItemsCount++;
  const rowId = `po-row-${poItemsCount}`;

  const row = document.createElement('div');
  row.className = 'form-grid';
  row.id = rowId;
  row.style.gridTemplateColumns = '2fr 1fr 1fr 1fr 40px';
  row.style.alignItems = 'end';
  row.style.marginBottom = '0.5rem';

  const productOptions = `<option value="">Sélectionner un produit...</option>` +
    products.map(p => `<option value="${p.id}" ${p.id === productId ? 'selected' : ''} data-buy="${p.buyPrice}">${escapeHtml(p.name)} (${p.sku})</option>`).join('');

  row.innerHTML = `
    <div class="form-group" style="margin-bottom: 0;">
      <label style="font-size: 0.72rem;">Produit</label>
      <select class="form-control po-prod-select" onchange="onPOProductChange(this, '${rowId}')" required>
        ${productOptions}
      </select>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label style="font-size: 0.72rem;">Qté à commander</label>
      <input type="number" class="form-control po-qty-input" min="1" value="${quantity}" oninput="calculatePOTotals()" required>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label style="font-size: 0.72rem;">Prix Achat Unitaire (FCFA)</label>
      <input type="number" class="form-control po-price-input" min="0" step="1" value="${buyPrice}" oninput="calculatePOTotals()" required>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label style="font-size: 0.72rem;">Total (FCFA)</label>
      <input type="text" class="form-control po-row-total" value="0 FCFA" readonly style="background: var(--bg-tertiary);">
    </div>
    <div>
      <button type="button" class="icon-btn" style="color: var(--danger); height: 38px; width: 38px;" onclick="removePOItemRow('${rowId}')">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;

  container.appendChild(row);
  calculatePOTotals();
}

function removePOItemRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) row.remove();
  calculatePOTotals();
}

function onPOProductChange(selectEl, rowId) {
  const selectedOpt = selectEl.options[selectEl.selectedIndex];
  const row = document.getElementById(rowId);
  if (!row) return;

  const priceInput = row.querySelector('.po-price-input');
  if (selectedOpt && selectedOpt.dataset.buy) {
    priceInput.value = selectedOpt.dataset.buy;
  }
  calculatePOTotals();
}

function calculatePOTotals() {
  const rows = document.querySelectorAll('#po-items-rows .form-grid');
  let totalAmount = 0;

  rows.forEach(r => {
    const qty = parseInt(r.querySelector('.po-qty-input')?.value, 10) || 0;
    const price = parseFloat(r.querySelector('.po-price-input')?.value) || 0;
    const rowTotal = qty * price;
    totalAmount += rowTotal;

    const rowTotalInput = r.querySelector('.po-row-total');
    if (rowTotalInput) rowTotalInput.value = window.formatFCFA(rowTotal);
  });

  const totalEl = document.getElementById('po-summary-total');
  if (totalEl) totalEl.textContent = window.formatFCFA(totalAmount);
}

function handlePOSubmit(e) {
  e.preventDefault();

  const supplierSelect = document.getElementById('po-supplier-select');
  const supplierId = supplierSelect.value;
  const supplierName = supplierSelect.options[supplierSelect.selectedIndex]?.text || 'Fournisseur';

  const rows = document.querySelectorAll('#po-items-rows .form-grid');
  const items = [];
  let totalAmount = 0;

  rows.forEach(r => {
    const select = r.querySelector('.po-prod-select');
    const productId = select.value;
    const selectedOpt = select.options[select.selectedIndex];
    const productName = selectedOpt ? selectedOpt.text.split(' (')[0] : '';
    const qty = parseInt(r.querySelector('.po-qty-input').value, 10) || 0;
    const unitPrice = parseFloat(r.querySelector('.po-price-input').value) || 0;

    if (productId && qty > 0) {
      const lineTotal = qty * unitPrice;
      totalAmount += lineTotal;
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
    showToast('Veuillez ajouter au moins un produit au bon de commande.', 'warning');
    return;
  }

  try {
    const po = window.store.createPurchaseOrder({
      supplierId,
      supplierName,
      items,
      totalAmount,
      status: 'SENT'
    });

    closeModal('modal-po-create');
    showToast(`Bon de commande #${po.number} créé avec succès !`, 'success');

    renderPurchaseOrders();
    viewPODetail(po.id);
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function confirmReceivePO(poId) {
  const po = window.store.getPurchaseOrderById(poId);
  if (!po) return;

  if (confirm(`Confirmer la réception du bon de commande #${po.number} ? Le stock des ${po.items.length} produit(s) sera crédité automatiquement.`)) {
    try {
      window.store.receivePurchaseOrder(poId);
      showToast(`Stock crédité ! Commande #${po.number} marquée comme réceptionnée.`, 'success');

      renderPurchaseOrders();
      if (window.renderDashboard) window.renderDashboard();
      if (window.renderProducts) window.renderProducts();
      if (window.renderMovements) window.renderMovements();
      if (window.renderAlerts) window.renderAlerts();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

function viewPODetail(poId) {
  const po = window.store.getPurchaseOrderById(poId);
  if (!po) return;

  const settings = window.store.getSettings();
  const detailContainer = document.getElementById('printable-po-content');
  if (!detailContainer) return;

  const formattedDate = new Date(po.date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const itemRowsHtml = po.items.map((item, idx) => `
    <tr>
      <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); text-align: center;">${idx + 1}</td>
      <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);"><strong>${escapeHtml(item.productName)}</strong></td>
      <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); text-align: center;">${item.quantity}</td>
      <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); text-align: right;">${window.formatFCFA(item.unitPrice)}</td>
      <td style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); text-align: right;"><strong>${window.formatFCFA(item.total)}</strong></td>
    </tr>
  `).join('');

  let stampHtml = '';
  if (settings.companyStamp) {
    stampHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
        <img src="${settings.companyStamp}" alt="Cachet Électronique Officiel" style="max-height: 95px; max-width: 180px; object-fit: contain; background: #fff; padding: 4px; border-radius: 4px; border: 1px solid #ccc;">
        <span style="font-size: 0.7rem; color: var(--success); font-weight: 700;">Cachet Électronique Authentifié</span>
      </div>
    `;
  } else {
    stampHtml = `
      <div style="height: 75px; border: 1px dashed var(--border-color); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.8rem;">
        Cachet Électronique (Paramètres)
      </div>
    `;
  }

  const logoImgHtml = settings.companyLogo ?
    `<img src="${settings.companyLogo}" alt="2M GLOBAL SERVICES" style="max-height: 75px; max-width: 220px; object-fit: contain; margin-bottom: 0.5rem; display: block;">` :
    `<h2 style="font-size: 1.5rem; color: var(--accent-primary); margin-bottom: 0.25rem;">${escapeHtml(settings.companyName)}</h2>`;

  detailContainer.innerHTML = `
    <div style="padding: 2rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f97316; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
        <div>
          ${logoImgHtml}
          <h2 style="font-size: 1.25rem; color: #0284c7; font-weight: 800; margin-bottom: 0.25rem;">${escapeHtml(settings.companyName)}</h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(settings.companyAddress)}</p>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">Tél: ${escapeHtml(settings.companyPhone)} | Email: ${escapeHtml(settings.companyEmail)}</p>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">${escapeHtml(settings.companyTaxId)}</p>
        </div>
        <div style="text-align: right;">
          <h1 style="font-size: 1.6rem; letter-spacing: -0.03em; color: #0284c7; text-transform: uppercase;">BON DE COMMANDE</h1>
          <span style="font-family: monospace; font-size: 1.1rem; color: #f97316; font-weight: 700;">#${escapeHtml(po.number)}</span>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Date: ${formattedDate}</p>
        </div>
      </div>

      <div style="background: var(--bg-tertiary); padding: 1rem 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; display: flex; justify-content: space-between;">
        <div>
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted);">Fournisseur Destinataire :</span>
          <h3 style="font-size: 1.1rem; color: var(--text-primary);">${escapeHtml(po.supplierName)}</h3>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted);">Statut Commande :</span>
          <div style="margin-top: 0.25rem;">
            ${po.status === 'RECEIVED' ? '<span class="badge badge-success" style="font-size: 0.9rem;"><i class="fa-solid fa-check-circle"></i> REÇU & INTÉGRÉ</span>' : '<span class="badge badge-info" style="font-size: 0.9rem;"><i class="fa-solid fa-paper-plane"></i> ENVOYÉ AU FOURNISSEUR</span>'}
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.9rem;">
        <thead>
          <tr style="background: var(--bg-tertiary); text-transform: uppercase; font-size: 0.75rem; color: var(--text-secondary);">
            <th style="padding: 0.75rem; text-align: center;">#</th>
            <th style="padding: 0.75rem; text-align: left;">Désignation Produit</th>
            <th style="padding: 0.75rem; text-align: center;">Quantité Commandée</th>
            <th style="padding: 0.75rem; text-align: right;">Prix Unitaire Est.</th>
            <th style="padding: 0.75rem; text-align: right;">Montant Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div></div>
        <div style="width: 300px; background: var(--bg-tertiary); padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; font-size: 1.15rem; color: var(--text-primary);">
            <strong>TOTAL COMMANDE :</strong>
            <strong style="color: #0284c7;">${window.formatFCFA(po.totalAmount)}</strong>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
        <div style="text-align: center;">
          <p style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem; text-transform: uppercase;">Pour le Fournisseur (Signature)</p>
          <div style="height: 75px; margin-top: 0.5rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md);"></div>
        </div>
        <div style="text-align: center;">
          <p style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 0.5rem;">Pour 2M GLOBAL SERVICES (Signature & Cachet)</p>
          ${stampHtml}
        </div>
      </div>
    </div>
  `;

  openModal('modal-po-detail');
}
