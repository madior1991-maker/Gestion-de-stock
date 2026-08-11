/**
 * StockManager Pro v2 - Main Application Router, Notifications Center & Event Handlers
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Initialize role selector UI
  const roleSelect = document.getElementById('user-role-select');
  if (roleSelect) {
    roleSelect.value = window.store.getUserRole();
  }

  // Setup View Navigation Router
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const viewName = item.dataset.view;
      if (viewName) switchView(viewName);
    });
  });

  // Mobile Menu Toggle
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  // Theme Toggle Button
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Global Search Input Handler
  const globalSearch = document.getElementById('global-search');
  if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (query.length > 0) {
        switchView('products');
        const prodSearch = document.getElementById('search-products');
        if (prodSearch) {
          prodSearch.value = query;
          if (window.filterProducts) window.filterProducts();
        }
      }
    });
  }

  // Update Notification Center
  updateNotificationCenter();

  // Render initial view (Dashboard)
  switchView('dashboard');
}

function switchView(viewName) {
  // Update sidebar active link
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  // Update visible section
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.toggle('active', section.id === `view-${viewName}`);
  });

  // Refresh Notifications & Trigger component renderers
  updateNotificationCenter();

  if (viewName === 'dashboard' && window.renderDashboard) window.renderDashboard();
  if (viewName === 'products' && window.renderProducts) window.renderProducts();
  if (viewName === 'invoices' && window.renderInvoices) window.renderInvoices();
  if (viewName === 'purchase-orders' && window.renderPurchaseOrders) window.renderPurchaseOrders();
  if (viewName === 'movements' && window.renderMovements) window.renderMovements();
  if (viewName === 'alerts' && window.renderAlerts) window.renderAlerts();
  if (viewName === 'categories' && window.renderCategories) window.renderCategories();
  if (viewName === 'settings' && window.renderSettings) window.renderSettings();
}

function switchUserRole(newRole) {
  window.store.setUserRole(newRole);

  const roleLabels = {
    'ADMIN': '👑 Administrateur Général (Accès Total & Édition Factures)',
    'MAGASINIER': '📦 Magasinier (Gestion des Stocks & Réception BC)',
    'VENDEUR': '💼 Vendeur / Commercial (Facturation)'
  };

  showToast(`Rôle changé : ${roleLabels[newRole] || newRole}`, 'info');

  const activeSection = document.querySelector('.view-section.active');
  if (activeSection) {
    const viewName = activeSection.id.replace('view-', '');
    switchView(viewName);
  }
}

function toggleNotificationDrawer() {
  const drawer = document.getElementById('notification-drawer');
  if (drawer) {
    drawer.classList.toggle('active');
  }
}

function updateNotificationCenter() {
  const notifs = window.store.getNotifications();
  const notifBadge = document.getElementById('notif-badge');
  const notifList = document.getElementById('notification-list');

  if (notifBadge) {
    notifBadge.textContent = notifs.length;
    notifBadge.style.display = notifs.length > 0 ? 'inline-block' : 'none';
  }

  if (notifList) {
    if (notifs.length === 0) {
      notifList.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          Aucune alerte récente.
        </div>
      `;
      return;
    }

    notifList.innerHTML = notifs.map(n => `
      <div class="notification-item">
        <i class="fa-solid ${n.type === 'danger' ? 'fa-circle-exclamation' : (n.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check')}" style="color: var(--${n.type}); font-size: 1.1rem; margin-top: 2px;"></i>
        <div>
          <strong style="font-size: 0.85rem; color: var(--text-primary); font-weight: 600;">${escapeHtml(n.title)}</strong>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(n.message)}</p>
          <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 4px;">${n.time}</span>
        </div>
      </div>
    `).join('');
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);

  const themeBtnIcon = document.querySelector('#theme-toggle-btn i');
  if (themeBtnIcon) {
    themeBtnIcon.className = newTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    danger: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type] || 'fa-circle-info'}"></i>
    <span style="font-size: 0.9rem;">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 4000);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.switchView = switchView;
window.switchUserRole = switchUserRole;
window.toggleNotificationDrawer = toggleNotificationDrawer;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.escapeHtml = escapeHtml;
