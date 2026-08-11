/**
 * StockManager Pro - Categories Component
 */

function renderCategories() {
  const categories = window.store.getCategories();
  const products = window.store.getProducts();

  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  if (categories.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
        <i class="fa-solid fa-tags" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
        Aucune catégorie enregistrée.
      </div>
    `;
    return;
  }

  grid.innerHTML = categories.map(cat => {
    const catProducts = products.filter(p => p.categoryId === cat.id);
    const totalVal = catProducts.reduce((acc, p) => acc + (p.buyPrice * p.quantity), 0);

    return `
      <div class="card" style="border-left: 4px solid ${cat.color}; transition: transform var(--transition-fast);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <h3 style="font-size: 1.1rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
            <span style="width: 12px; height: 12px; border-radius: 50%; background-color: ${cat.color}; display: inline-block;"></span>
            ${escapeHtml(cat.name)}
          </h3>
          <div style="display: flex; gap: 0.25rem;">
            <button class="icon-btn" title="Modifier" onclick="openCategoryModal('${cat.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-btn" title="Supprimer" style="color: var(--danger);" onclick="deleteCategoryConfirm('${cat.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; min-height: 2.4em;">
          ${escapeHtml(cat.description || 'Pas de description')}
        </p>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem; color: var(--text-muted);">
          <span><strong>${catProducts.length}</strong> Références</span>
          <span>Valeur: <strong>${window.formatFCFA(totalVal)}</strong></span>
        </div>
      </div>
    `;
  }).join('');
}

function openCategoryModal(catId = null) {
  const form = document.getElementById('category-form');
  if (form) form.reset();

  const idInput = document.getElementById('cat-id');
  const nameInput = document.getElementById('cat-name');
  const colorInput = document.getElementById('cat-color');
  const descInput = document.getElementById('cat-desc');

  if (catId) {
    const cat = window.store.getCategories().find(c => c.id === catId);
    if (!cat) return;
    if (idInput) idInput.value = cat.id;
    if (nameInput) nameInput.value = cat.name;
    if (colorInput) colorInput.value = cat.color;
    if (descInput) descInput.value = cat.description || '';
  } else {
    if (idInput) idInput.value = '';
    if (colorInput) colorInput.value = '#' + Math.floor(Math.random()*16777215).toString(16);
  }

  openModal('modal-category');
}

function handleCategoryFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('cat-id').value;
  const name = document.getElementById('cat-name').value.trim();
  const color = document.getElementById('cat-color').value;
  const description = document.getElementById('cat-desc').value.trim();

  if (!name) {
    showToast('Le nom de la catégorie est obligatoire.', 'warning');
    return;
  }

  window.store.saveCategory({
    ...(id ? { id } : {}),
    name,
    color,
    description
  });

  closeModal('modal-category');
  showToast('Catégorie enregistrée.', 'success');
  renderCategories();
  if (window.renderProducts) window.renderProducts();
}

function deleteCategoryConfirm(catId) {
  const products = window.store.getProducts();
  const hasProducts = products.some(p => p.categoryId === catId);

  if (hasProducts) {
    showToast('Impossible de supprimer cette catégorie car elle contient des produits associés.', 'warning');
    return;
  }

  if (confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
    window.store.deleteCategory(catId);
    showToast('Catégorie supprimée.', 'info');
    renderCategories();
  }
}
