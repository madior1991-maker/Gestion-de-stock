/**
 * StockManager Pro - Reports, Export & Import Component
 */

function exportProductsCSV() {
  const products = window.store.getProducts();
  const categories = window.store.getCategories();

  if (products.length === 0) {
    showToast('Aucun produit à exporter.', 'warning');
    return;
  }

  const headers = ['SKU', 'Nom', 'Categorie', 'Quantite', 'Seuil_Min', 'Prix_Achat', 'Prix_Vente', 'Emplacement', 'Date_Creation'];
  const rows = products.map(p => {
    const cat = categories.find(c => c.id === p.categoryId);
    return [
      `"${p.sku}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(cat ? cat.name : '').replace(/"/g, '""')}"`,
      p.quantity,
      p.minStock,
      p.buyPrice,
      p.sellPrice,
      `"${(p.location || '').replace(/"/g, '""')}"`,
      `"${p.createdAt || ''}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `inventaire_stock_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Exportation du stock au format CSV réussie !', 'success');
}

function exportMovementsCSV() {
  const movements = window.store.getMovements();
  const products = window.store.getProducts();

  if (movements.length === 0) {
    showToast('Aucun mouvement à exporter.', 'warning');
    return;
  }

  const headers = ['Date', 'SKU', 'Produit', 'Type', 'Quantite', 'Motif', 'Utilisateur'];
  const rows = movements.map(m => {
    const prod = products.find(p => p.id === m.productId);
    return [
      `"${m.date}"`,
      `"${prod ? prod.sku : ''}"`,
      `"${prod ? prod.name.replace(/"/g, '""') : ''}"`,
      `"${m.type}"`,
      m.quantity,
      `"${(m.reason || '').replace(/"/g, '""')}"`,
      `"${(m.user || 'Admin').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `historique_mouvements_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Exportation des mouvements au format CSV réussie !', 'success');
}

function exportFullBackupJSON() {
  const data = {
    products: window.store.getProducts(),
    categories: window.store.getCategories(),
    suppliers: window.store.getSuppliers(),
    movements: window.store.getMovements(),
    exportedAt: new Date().toISOString()
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `stockmanager_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Sauvegarde complète de la base de données JSON téléchargée.', 'success');
}

function importBackupJSON(fileEvent) {
  const file = fileEvent.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.products && Array.isArray(data.products)) {
        localStorage.setItem('stockmanager_products_v1', JSON.stringify(data.products));
        if (data.categories) localStorage.setItem('stockmanager_categories_v1', JSON.stringify(data.categories));
        if (data.suppliers) localStorage.setItem('stockmanager_suppliers_v1', JSON.stringify(data.suppliers));
        if (data.movements) localStorage.setItem('stockmanager_movements_v1', JSON.stringify(data.movements));

        showToast('Restauration des données réussie !', 'success');
        setTimeout(() => location.reload(), 1000);
      } else {
        throw new Error('Structure JSON invalide.');
      }
    } catch (err) {
      showToast('Fichier de sauvegarde invalide : ' + err.message, 'danger');
    }
  };
  reader.readAsText(file);
}

function resetDemoDataWithConfirm() {
  if (confirm('ATTENTION : Voulez-vous réinitialiser toutes les données aux valeurs de démonstration d\'origine ?')) {
    window.store.resetDemoData();
    showToast('Données réinitialisées avec succès.', 'info');
    setTimeout(() => location.reload(), 800);
  }
}
