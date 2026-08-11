/**
 * StockManager Pro - Low Stock & Alerts Component
 */

function renderAlerts() {
  const lowStockProducts = window.store.getLowStockProducts();
  const categories = window.store.getCategories();
  const suppliers = window.store.getSuppliers();

  const tbody = document.getElementById('alerts-table-body');
  const alertCountHeader = document.getElementById('alert-count-header');

  if (alertCountHeader) {
    alertCountHeader.textContent = `${lowStockProducts.length} produit(s) requérant une attention urgente`;
  }

  if (!tbody) return;

  if (lowStockProducts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3rem; color: var(--success);">
          <i class="fa-solid fa-circle-check" style="font-size: 3rem; margin-bottom: 0.75rem; display: block;"></i>
          <strong>Aucun réapprovisionnement nécessaire !</strong>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Tous les niveaux de stock respectent vos seuils minimaux.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lowStockProducts.map(p => {
    const cat = categories.find(c => c.id === p.categoryId);
    const catName = cat ? cat.name : 'Non classé';
    const supplier = suppliers.find(s => s.id === p.supplierId);
    const supplierName = supplier ? supplier.name : 'Non spécifié';

    const isOut = p.quantity <= 0;
    const suggestedReorder = Math.max((p.minStock * 2) - p.quantity, p.minStock);

    return `
      <tr>
        <td>
          <strong style="display: block; color: var(--text-primary);">${escapeHtml(p.name)}</strong>
          <code style="font-size: 0.75rem; color: var(--accent-primary); font-family: monospace;">${escapeHtml(p.sku)}</code>
        </td>
        <td><span class="badge badge-secondary">${escapeHtml(catName)}</span></td>
        <td>
          <strong style="color: ${isOut ? 'var(--danger)' : 'var(--warning)'}; font-size: 1.1rem;">
            ${p.quantity}
          </strong>
        </td>
        <td><span style="font-weight: 600; color: var(--text-secondary);">${p.minStock}</span></td>
        <td>
          <strong style="color: var(--accent-primary);">${suggestedReorder} unités</strong>
        </td>
        <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(supplierName)}</span></td>
        <td>
          <button class="btn-primary" style="padding: 0.35rem 0.85rem; font-size: 0.82rem;" onclick="openQuickRestockModal('${p.id}', ${suggestedReorder})">
            <i class="fa-solid fa-cart-plus"></i> Réapprovisionner
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openQuickRestockModal(productId, defaultQty = 10) {
  const p = window.store.getProductById(productId);
  if (!p) return;

  const modalTitle = document.getElementById('restock-modal-title');
  const prodNameEl = document.getElementById('restock-product-name');
  const prodIdInput = document.getElementById('restock-product-id');
  const qtyInput = document.getElementById('restock-qty');

  if (modalTitle) modalTitle.textContent = `Réapprovisionner : ${p.name}`;
  if (prodNameEl) prodNameEl.textContent = `${p.name} (Stock actuel: ${p.quantity}, Seuil: ${p.minStock})`;
  if (prodIdInput) prodIdInput.value = p.id;
  if (qtyInput) qtyInput.value = defaultQty > 0 ? defaultQty : Math.max(p.minStock * 2 - p.quantity, 10);

  openModal('modal-restock');
}

function handleRestockSubmit(e) {
  e.preventDefault();

  const productId = document.getElementById('restock-product-id').value;
  const quantity = parseInt(document.getElementById('restock-qty').value, 10);
  const reason = document.getElementById('restock-reason').value.trim() || 'Réapprovisionnement Rapide';

  if (!productId || isNaN(quantity) || quantity <= 0) {
    showToast('Veuillez spécifier une quantité valide.', 'warning');
    return;
  }

  try {
    const { product } = window.store.addMovement({
      productId,
      type: 'IN',
      quantity,
      reason,
      user: 'Admin'
    });

    closeModal('modal-restock');
    showToast(`Réapprovisionnement réussi ! Nouveau stock pour ${product.name}: ${product.quantity}`, 'success');

    if (window.renderDashboard) window.renderDashboard();
    if (window.renderProducts) window.renderProducts();
    renderAlerts();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}
