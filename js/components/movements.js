/**
 * StockManager Pro - Stock Movements Component (IN/OUT/ADJUST Log)
 */

function renderMovements() {
  const movements = window.store.getMovements();
  const products = window.store.getProducts();

  filterMovements(movements, products);
}

function filterMovements(movements, products) {
  const typeFilter = document.getElementById('filter-movement-type')?.value || 'ALL';
  const searchTerm = (document.getElementById('search-movement')?.value || '').toLowerCase();

  const filtered = movements.filter(m => {
    const prod = products.find(p => p.id === m.productId);
    const prodName = prod ? prod.name.toLowerCase() : '';
    const prodSku = prod ? prod.sku.toLowerCase() : '';
    const reason = (m.reason || '').toLowerCase();

    const matchType = typeFilter === 'ALL' || m.type === typeFilter;
    const matchSearch = prodName.includes(searchTerm) || prodSku.includes(searchTerm) || reason.includes(searchTerm);

    return matchType && matchSearch;
  });

  renderMovementsTable(filtered, products);
}

function renderMovementsTable(movements, products) {
  const tbody = document.getElementById('movements-table-body');
  if (!tbody) return;

  if (movements.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <i class="fa-solid fa-clock-rotate-left" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
          Aucun mouvement enregistré.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = movements.map(m => {
    const prod = products.find(p => p.id === m.productId);
    const prodName = prod ? prod.name : 'Produit Supprimé';
    const prodSku = prod ? prod.sku : 'N/A';

    let badgeHtml = '';
    let qtyPrefix = '';
    if (m.type === 'IN') {
      badgeHtml = `<span class="badge badge-success"><i class="fa-solid fa-arrow-down"></i> Entrée</span>`;
      qtyPrefix = '+';
    } else if (m.type === 'OUT') {
      badgeHtml = `<span class="badge badge-danger"><i class="fa-solid fa-arrow-up"></i> Sortie</span>`;
      qtyPrefix = '-';
    } else {
      badgeHtml = `<span class="badge badge-info"><i class="fa-solid fa-sliders"></i> Ajustement</span>`;
      qtyPrefix = '=';
    }

    const formattedDate = new Date(m.date).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    return `
      <tr>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${formattedDate}</td>
        <td>
          <strong style="display: block; color: var(--text-primary);">${escapeHtml(prodName)}</strong>
          <code style="font-size: 0.75rem; color: var(--accent-primary); font-family: monospace;">${escapeHtml(prodSku)}</code>
        </td>
        <td>${badgeHtml}</td>
        <td>
          <strong style="font-size: 1.05rem; color: ${m.type === 'IN' ? 'var(--success)' : m.type === 'OUT' ? 'var(--danger)' : 'var(--info)'}">
            ${qtyPrefix}${m.quantity}
          </strong>
        </td>
        <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(m.reason)}</span></td>
        <td><span class="badge badge-secondary"><i class="fa-solid fa-user" style="font-size: 0.7rem;"></i> ${escapeHtml(m.user || 'Admin')}</span></td>
      </tr>
    `;
  }).join('');
}

// Open Movement Modal
function openMovementModalForProduct(productId = null) {
  const form = document.getElementById('movement-form');
  if (form) form.reset();

  const prodSelect = document.getElementById('movement-product-select');
  const products = window.store.getProducts();

  if (prodSelect) {
    prodSelect.innerHTML = `<option value="">Sélectionner un produit...</option>` +
      products.map(p => `<option value="${p.id}" ${p.id === productId ? 'selected' : ''}>${escapeHtml(p.name)} (Disp: ${p.quantity})</option>`).join('');
  }

  openModal('modal-movement');
}

function handleMovementFormSubmit(e) {
  e.preventDefault();

  const productId = document.getElementById('movement-product-select').value;
  const type = document.getElementById('movement-type').value;
  const quantity = parseInt(document.getElementById('movement-qty').value, 10);
  const reason = document.getElementById('movement-reason').value.trim();

  if (!productId || !type || isNaN(quantity) || quantity <= 0) {
    showToast('Veuillez remplir correctement tous les champs.', 'warning');
    return;
  }

  try {
    const { product } = window.store.addMovement({ productId, type, quantity, reason });
    closeModal('modal-movement');
    showToast(`Mouvement enregistré ! Nouveau stock pour "${product.name}": ${product.quantity}`, 'success');

    if (window.renderDashboard) window.renderDashboard();
    if (window.renderProducts) window.renderProducts();
    renderMovements();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}
