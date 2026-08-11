/**
 * StockManager Pro v2 - Products Component (Catalog Management & Product Photo Upload)
 */

let currentProductImageData = '';

function renderProducts(filteredProducts = null) {
  const products = filteredProducts || window.store.getProducts();
  const categories = window.store.getCategories();
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <i class="fa-solid fa-box-open" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
          Aucun produit trouvé. Cliquez sur "Nouveau Produit" pour ajouter une référence.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const category = categories.find(c => c.id === p.categoryId) || { name: 'Non classé', color: '#64748b' };

    let statusBadge = '<span class="badge badge-success"><span class="badge-dot"></span>En Stock</span>';
    if (p.quantity <= 0) {
      statusBadge = '<span class="badge badge-danger"><span class="badge-dot"></span>Rupture</span>';
    } else if (p.quantity <= p.minStock) {
      statusBadge = '<span class="badge badge-warning"><span class="badge-dot"></span>Alerte Stock</span>';
    }

    const imageHtml = p.image ?
      `<img src="${p.image}" class="product-thumb" alt="${escapeHtml(p.name)}">` :
      `<div class="product-thumb-placeholder" style="color: ${category.color};"><i class="fa-solid fa-box"></i></div>`;

    return `
      <tr>
        <td style="width: 50px;">${imageHtml}</td>
        <td>
          <strong style="color: var(--text-primary); font-size: 0.95rem; cursor: pointer;" onclick="viewProductDetail('${p.id}')">${escapeHtml(p.name)}</strong>
          <span style="display: block; font-family: monospace; font-size: 0.75rem; color: var(--accent-primary); font-weight: 600;">${escapeHtml(p.sku)}</span>
        </td>
        <td>
          <span class="badge" style="background-color: ${category.color}20; color: ${category.color}; border: 1px solid ${category.color}40;">
            ${escapeHtml(category.name)}
          </span>
        </td>
        <td>
          <strong style="font-size: 1.05rem; ${p.quantity <= p.minStock ? 'color: var(--warning);' : ''}">${p.quantity}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);"> (Min: ${p.minStock})</span>
        </td>
        <td>
          <strong style="color: var(--text-primary);">${window.formatFCFA(p.sellPrice)}</strong>
          ${p.buyPrice ? `<span style="display: block; font-size: 0.75rem; color: var(--text-muted);">Achat: ${window.formatFCFA(p.buyPrice)}</span>` : ''}
        </td>
        <td>
          <span style="font-size: 0.85rem; color: var(--text-secondary);"><i class="fa-solid fa-location-dot" style="font-size: 0.75rem;"></i> ${escapeHtml(p.location || 'N/A')}</span>
        </td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="icon-btn" title="Modifier produit" onclick="openProductModal('${p.id}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="icon-btn" title="Réapprovisionner rapide" onclick="openRestockModal('${p.id}')">
              <i class="fa-solid fa-plus" style="color: var(--success);"></i>
            </button>
            <button class="icon-btn" title="Supprimer" onclick="deleteProductWithConfirm('${p.id}')">
              <i class="fa-solid fa-trash" style="color: var(--danger);"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function handleProductImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Veuillez sélectionner un fichier image valide (PNG ou JPG).', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    currentProductImageData = evt.target.result;
    document.getElementById('product-image-data').value = currentProductImageData;

    const previewContainer = document.getElementById('product-image-preview');
    if (previewContainer) {
      previewContainer.innerHTML = `
        <div style="position: relative; display: inline-block;">
          <img src="${currentProductImageData}" alt="Aperçu Produit" style="height: 80px; width: 80px; object-fit: cover; border-radius: var(--radius-md); border: 2px solid var(--accent-primary);">
          <button type="button" class="icon-btn" style="position: absolute; top: -6px; right: -6px; width: 22px; height: 22px; background: var(--danger); color: #fff;" title="Supprimer la photo" onclick="deleteProductImage()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;
    }
  };
  reader.readAsDataURL(file);
}

function deleteProductImage() {
  currentProductImageData = '';
  const fileInput = document.getElementById('product-image-file');
  if (fileInput) fileInput.value = '';

  const dataInput = document.getElementById('product-image-data');
  if (dataInput) dataInput.value = '';

  const previewContainer = document.getElementById('product-image-preview');
  if (previewContainer) previewContainer.innerHTML = '';
}

function openProductModal(productId = null) {
  const form = document.getElementById('product-form');
  if (form) form.reset();

  deleteProductImage();

  const titleEl = document.getElementById('product-modal-title');
  const idInput = document.getElementById('product-id');
  const skuInput = document.getElementById('product-sku');
  const nameInput = document.getElementById('product-name');
  const catSelect = document.getElementById('product-category');
  const locInput = document.getElementById('product-location');
  const qtyInput = document.getElementById('product-qty');
  const minInput = document.getElementById('product-min');
  const buyInput = document.getElementById('product-buy-price');
  const sellInput = document.getElementById('product-sell-price');
  const notesInput = document.getElementById('product-notes');

  const categories = window.store.getCategories();
  catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

  if (productId) {
    const product = window.store.getProductById(productId);
    if (!product) return;

    titleEl.textContent = 'Modifier Produit : ' + product.name;
    idInput.value = product.id;
    skuInput.value = product.sku;
    nameInput.value = product.name;
    catSelect.value = product.categoryId;
    locInput.value = product.location || '';
    qtyInput.value = product.quantity;
    qtyInput.disabled = true; // Quantity managed through movements
    minInput.value = product.minStock;
    buyInput.value = product.buyPrice || 0;
    sellInput.value = product.sellPrice || 0;
    notesInput.value = product.notes || '';

    if (product.image) {
      currentProductImageData = product.image;
      document.getElementById('product-image-data').value = product.image;
      const previewContainer = document.getElementById('product-image-preview');
      if (previewContainer) {
        previewContainer.innerHTML = `
          <div style="position: relative; display: inline-block;">
            <img src="${product.image}" alt="${escapeHtml(product.name)}" style="height: 80px; width: 80px; object-fit: cover; border-radius: var(--radius-md); border: 2px solid var(--accent-primary);">
            <button type="button" class="icon-btn" style="position: absolute; top: -6px; right: -6px; width: 22px; height: 22px; background: var(--danger); color: #fff;" title="Supprimer la photo" onclick="deleteProductImage()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        `;
      }
    }

    generateBarcodePreview(product.sku);
  } else {
    titleEl.textContent = 'Nouveau Produit';
    idInput.value = '';
    qtyInput.disabled = false;
    qtyInput.value = 0;
    minInput.value = window.store.getSettings().defaultMinStock || 5;

    // Auto-generate random SKU prefix
    const randomSku = 'SKU-' + Math.floor(1000 + Math.random() * 9000);
    skuInput.value = randomSku;
    generateBarcodePreview(randomSku);
  }

  openModal('modal-product');
}

function handleProductFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('product-id').value;
  const sku = document.getElementById('product-sku').value.trim();
  const name = document.getElementById('product-name').value.trim();
  const categoryId = document.getElementById('product-category').value;
  const location = document.getElementById('product-location').value.trim();
  const quantity = parseInt(document.getElementById('product-qty').value, 10) || 0;
  const minStock = parseInt(document.getElementById('product-min').value, 10) || 0;
  const buyPrice = parseFloat(document.getElementById('product-buy-price').value) || 0;
  const sellPrice = parseFloat(document.getElementById('product-sell-price').value) || 0;
  const notes = document.getElementById('product-notes').value.trim();
  const image = document.getElementById('product-image-data').value;

  try {
    const saved = window.store.saveProduct({
      id: id || undefined,
      sku,
      name,
      categoryId,
      location,
      quantity,
      minStock,
      buyPrice,
      sellPrice,
      notes,
      image
    });

    closeModal('modal-product');
    showToast(`Produit "${saved.name}" enregistré avec succès !`, 'success');

    renderProducts();
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderAlerts) window.renderAlerts();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function openRestockModal(productId) {
  const product = window.store.getProductById(productId);
  if (!product) return;

  document.getElementById('restock-product-id').value = product.id;
  document.getElementById('restock-product-name').textContent = `${product.name} (${product.sku}) - Stock actuel: ${product.quantity}`;
  document.getElementById('restock-qty').value = Math.max(product.minStock * 2, 10);

  openModal('modal-restock');
}

function handleRestockSubmit(e) {
  e.preventDefault();

  const productId = document.getElementById('restock-product-id').value;
  const qty = parseInt(document.getElementById('restock-qty').value, 10);
  const reason = document.getElementById('restock-reason').value.trim();

  try {
    const { product } = window.store.addMovement({
      productId,
      type: 'IN',
      quantity: qty,
      reason,
      user: 'Admin'
    });

    closeModal('modal-restock');
    showToast(`Stock de "${product.name}" réapprovisionné de +${qty} unités !`, 'success');

    renderProducts();
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderMovements) window.renderMovements();
    if (window.renderAlerts) window.renderAlerts();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function deleteProductWithConfirm(id) {
  const product = window.store.getProductById(id);
  if (!product) return;

  if (confirm(`Voulez-vous vraiment supprimer le produit "${product.name}" (${product.sku}) ? Cette action est irréversible.`)) {
    window.store.deleteProduct(id);
    showToast(`Produit "${product.name}" supprimé.`, 'info');

    renderProducts();
    if (window.renderDashboard) window.renderDashboard();
    if (window.renderAlerts) window.renderAlerts();
  }
}

function filterProducts() {
  const search = document.getElementById('search-products').value.toLowerCase().trim();
  const categoryId = document.getElementById('filter-category').value;
  const status = document.getElementById('filter-status').value;

  const allProducts = window.store.getProducts();

  const filtered = allProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search) || (p.location && p.location.toLowerCase().includes(search));
    const matchCategory = categoryId === 'ALL' || p.categoryId === categoryId;

    let matchStatus = true;
    if (status === 'OK') matchStatus = p.quantity > p.minStock;
    if (status === 'LOW') matchStatus = p.quantity > 0 && p.quantity <= p.minStock;
    if (status === 'OUT') matchStatus = p.quantity <= 0;

    return matchSearch && matchCategory && matchStatus;
  });

  renderProducts(filtered);
}

function generateBarcodePreview(text) {
  const container = document.getElementById('barcode-preview');
  if (!container) return;

  if (!text) {
    container.innerHTML = '';
    return;
  }

  let barsHtml = '';
  for (let i = 0; i < text.length * 3; i++) {
    const width = (i % 2 === 0) ? (i % 3 === 0 ? 3 : 1) : 2;
    barsHtml += `<div class="barcode-bar" style="width: ${width}px; opacity: ${i % 4 === 0 ? 0.4 : 1};"></div>`;
  }

  container.innerHTML = `
    <div class="barcode-box">
      <div class="barcode-lines">${barsHtml}</div>
      <div class="barcode-text">${escapeHtml(text.toUpperCase())}</div>
    </div>
  `;
}

function viewProductDetail(id) {
  const p = window.store.getProductById(id);
  if (!p) return;

  const category = window.store.getCategories().find(c => c.id === p.categoryId) || { name: 'Non classé' };
  const detailContainer = document.getElementById('product-detail-content');

  detailContainer.innerHTML = `
    ${p.image ? `<div style="text-align: center; margin-bottom: 1rem;"><img src="${p.image}" alt="${escapeHtml(p.name)}" style="max-height: 180px; border-radius: var(--radius-md); object-fit: contain; border: 1px solid var(--border-color);"></div>` : ''}
    <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
      <h2 style="font-size: 1.3rem; color: var(--text-primary);">${escapeHtml(p.name)}</h2>
      <span style="font-family: monospace; color: var(--accent-primary); font-weight: 700;">SKU: ${escapeHtml(p.sku)}</span>
    </div>

    <div class="form-grid">
      <div><strong>Catégorie :</strong> ${escapeHtml(category.name)}</div>
      <div><strong>Stock actuel :</strong> <span style="font-size: 1.1rem; color: var(--accent-primary); font-weight: 700;">${p.quantity}</span> (Seuil min: ${p.minStock})</div>
      <div><strong>Prix d'achat HT :</strong> ${window.formatFCFA(p.buyPrice)}</div>
      <div><strong>Prix de vente TTC :</strong> ${window.formatFCFA(p.sellPrice)}</div>
      <div><strong>Emplacement :</strong> ${escapeHtml(p.location || 'Non spécifié')}</div>
      <div><strong>Valeur du stock :</strong> ${window.formatFCFA(p.quantity * p.sellPrice)}</div>
    </div>

    ${p.notes ? `
      <div style="margin-top: 1rem; background: var(--bg-card); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <strong>Description / Remarques :</strong> ${escapeHtml(p.notes)}
      </div>
    ` : ''}
  `;

  openModal('modal-product-detail');
}
